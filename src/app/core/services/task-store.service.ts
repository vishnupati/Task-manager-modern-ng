import { computed, effect, inject, Injectable, linkedSignal, resource, signal } from '@angular/core';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { finalize, Subject, concatMap, switchMap, tap } from 'rxjs';

import { mapCreateTaskFormToDto, mapUpdateTaskFormToDto } from '../mappers/task.mapper';
import { Task, TaskFormValue } from '../models/task.model';
import { TaskApiService } from './task-api.service';

interface UpdateCommand {
    id: string;
    value: Partial<TaskFormValue>;
}

interface TaskStats {
    total: number;
    completed: number;
    pending: number;
}

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
    private readonly api = inject(TaskApiService);

    private readonly refreshNonce = signal(0);
    private readonly reloadRequest$ = new Subject<void>();
    private readonly updateQueue$ = new Subject<UpdateCommand>();

    readonly tasksResource = rxResource<Task[], number>({
        params: () => this.refreshNonce(),
        defaultValue: [],
        stream: () => this.api.getTasks()
    });

    readonly tasks = linkedSignal(() => this.tasksResource.value() ?? []);
    readonly selectedTaskId = signal<string | null>(null);
    readonly isSaving = signal(false);

    readonly selectedTask = computed(() => {
        const selectedId = this.selectedTaskId();
        if (!selectedId) {
            return null;
        }

        return this.tasks().find((task) => task.id === selectedId) ?? null;
    });

    readonly statsResource = resource<TaskStats, Task[]>({
        params: () => this.tasks(),
        defaultValue: { total: 0, completed: 0, pending: 0 },
        loader: async ({ params }) => {
            const completed = params.filter((task) => task.status === 'completed').length;
            const total = params.length;
            return {
                total,
                completed,
                pending: total - completed
            };
        }
    });

    readonly tasksFromReloadSignal = toSignal(
        this.reloadRequest$.pipe(
            switchMap(() => this.api.getTasks()),
            tap((tasks) => this.tasks.set(tasks))
        ),
        { initialValue: [] as Task[] }
    );

    constructor() {
        effect(() => {
            const latest = this.tasksResource.value();
            if (latest) {
                this.tasks.set(latest);
            }
        });

        this.updateQueue$
            .pipe(
                concatMap((command) =>
                    this.api.updateTask(command.id, mapUpdateTaskFormToDto(command.value)).pipe(
                        tap((updated) => {
                            this.tasks.update((tasks) => tasks.map((task) => (task.id === updated.id ? updated : task)));
                        })
                    )
                )
            )
            .subscribe();
    }

    refresh(): void {
        this.refreshNonce.update((value) => value + 1);
        this.reloadRequest$.next();
    }

    createTask(formValue: TaskFormValue) {
        this.isSaving.set(true);
        return this.api.createTask(mapCreateTaskFormToDto(formValue)).pipe(
            tap((task) => {
                this.tasks.update((tasks) => [ task, ...tasks ]);
            }),
            finalize(() => this.isSaving.set(false))
        );
    }

    queueTaskUpdate(id: string, value: Partial<TaskFormValue>): void {
        this.updateQueue$.next({ id, value });
    }

    deleteTask(id: string) {
        return this.api.deleteTask(id).pipe(
            tap(() => {
                this.tasks.update((tasks) => tasks.filter((task) => task.id !== id));
            })
        );
    }

    selectTask(id: string | null): void {
        this.selectedTaskId.set(id);
    }
}
