import { computed, inject, Service, signal } from '@angular/core';
import { catchError, concatMap, defer, EMPTY, finalize, map, Observable, Subject, tap, throwError } from 'rxjs';

import { mapCreateTaskFormToDto, mapCreateTaskResponseToModel, mapUpdateTaskFormToDto } from '../mappers/task.mapper';
import { CreateTaskDto, UpdateTaskDto } from '../models/task.dto';
import { Task, TaskFormValue } from '../models/task.model';
import { TaskApiService } from './task-api.service';
import { UserAuthService } from './user-auth.service';

interface UpdateCommand {
    id: string;
    payload: UpdateTaskDto;
    /** The task as it was before the optimistic update, used to roll back on failure. */
    previous: Task | null;
}

// randomUUID only exists in secure contexts (HTTPS, localhost); the key is optional for the API.
const newClientTaskId = (): string | undefined =>
    typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : undefined;

@Service()
export class TaskStoreService {
    private readonly api = inject(TaskApiService);
    private readonly auth = inject(UserAuthService);
    private readonly updateQueue$ = new Subject<UpdateCommand>();

    private readonly userId = computed(() => this.auth.user()?.id ?? null);

    readonly tasksResource = this.api.getTasks(this.userId);

    // `value()` throws while the resource is in the error state; fall back to an empty list so
    // pages keep rendering and can show the error instead of crashing.
    readonly tasks = computed(() => (this.tasksResource.hasValue() ? this.tasksResource.value() : []));
    readonly selectedTaskId = signal<string | null>(null);
    readonly isSaving = signal(false);

    readonly selectedTask = computed(() => {
        const selectedId = this.selectedTaskId();
        if (!selectedId) {
            return null;
        }

        return this.tasks().find((task) => task.id === selectedId) ?? null;
    });

    readonly stats = computed(() => {
        const tasks = this.tasks();
        const completed = tasks.filter((task) => task.status === 'completed').length;
        const total = tasks.length;
        return {
            total,
            completed,
            pending: total - completed
        };
    });

    constructor() {
        this.updateQueue$
            .pipe(
                // Sequential, so the server always ends up with the user's latest change.
                concatMap((command) =>
                    this.api.updateTask(command.id, command.payload).pipe(
                        // Handle the error per request so one failure doesn't terminate the queue.
                        // The error toast itself comes from httpErrorInterceptor.
                        catchError(() => {
                            this.revertUpdate(command);
                            return EMPTY;
                        })
                    )
                )
            )
            .subscribe();
    }

    refresh(): void {
        this.tasksResource.reload();
    }

    createTask(formValue: TaskFormValue): Observable<Task | null> {
        const payload: CreateTaskDto = { ...mapCreateTaskFormToDto(formValue), clientTaskId: newClientTaskId() };

        return defer(() => {
            this.isSaving.set(true);
            return this.api.createTask(payload);
        }).pipe(
            map((response) => mapCreateTaskResponseToModel(response, payload)),
            tap((task) => {
                if (task && this.isLoaded()) {
                    this.tasksResource.update((tasks) => [ task, ...tasks ]);
                } else {
                    // No addressable task in the response, or the first load is still running.
                    this.tasksResource.reload();
                }
            }),
            finalize(() => this.isSaving.set(false))
        );
    }

    /** Applies the change immediately and syncs it to the server in the background. */
    queueTaskUpdate(id: string, value: Partial<TaskFormValue>): void {
        const payload = mapUpdateTaskFormToDto(value);
        const previous = this.isLoaded() ? (this.tasks().find((task) => task.id === id) ?? null) : null;

        if (previous) {
            this.tasksResource.update((tasks) => tasks.map((task) => (task.id === id ? { ...task, ...payload } : task)));
        }

        this.updateQueue$.next({ id, payload, previous });
    }

    deleteTask(id: string): Observable<void> {
        return defer(() => {
            // Optimistic: remove right away and put the task back if the request fails.
            const tasks = this.tasks();
            const index = tasks.findIndex((task) => task.id === id);
            const removed = this.isLoaded() && index >= 0 ? tasks[index] : null;

            if (removed) {
                this.tasksResource.update((current) => current.filter((task) => task.id !== id));
            }

            return this.api.deleteTask(id).pipe(
                catchError((error: unknown) => {
                    if (removed && this.isLoaded()) {
                        this.tasksResource.update((current) =>
                            current.some((task) => task.id === id)
                                ? current
                                : [ ...current.slice(0, index), removed, ...current.slice(index) ]
                        );
                    }

                    return throwError(() => error);
                })
            );
        });
    }

    selectTask(id: string | null): void {
        this.selectedTaskId.set(id);
    }

    // Local changes are applied only on top of a loaded list: writing to the resource while the
    // first request is in flight would cancel it and replace the list with a partial one.
    private isLoaded(): boolean {
        const status = this.tasksResource.status();
        return status === 'resolved' || status === 'local' || status === 'reloading';
    }

    private revertUpdate({ id, payload, previous }: UpdateCommand): void {
        if (!previous || !this.isLoaded()) {
            return;
        }

        // Roll back only the fields that still hold this update's value, so a later edit is kept.
        this.tasksResource.update((tasks) =>
            tasks.map((task) => {
                if (task.id !== id) {
                    return task;
                }

                const reverted = { ...task };
                if (payload.title !== undefined && task.title === payload.title) {
                    reverted.title = previous.title;
                }
                if (payload.description !== undefined && task.description === payload.description) {
                    reverted.description = previous.description;
                }
                if (payload.status !== undefined && task.status === payload.status) {
                    reverted.status = previous.status;
                }
                return reverted;
            })
        );
    }
}
