import { computed, inject, Service, signal } from '@angular/core';
import { concatMap, finalize, Subject, tap } from 'rxjs';

import { mapCreateTaskFormToDto, mapUpdateTaskFormToDto } from '../mappers/task.mapper';
import { Task, TaskFormValue } from '../models/task.model';
import { TaskApiService } from './task-api.service';

interface UpdateCommand {
    id: string;
    value: Partial<TaskFormValue>;
}

@Service()
export class TaskStoreService {
    private readonly api = inject(TaskApiService);
    private readonly updateQueue$ = new Subject<UpdateCommand>();

    readonly tasksResource = this.api.getTasks();

    readonly tasks = computed(() => this.tasksResource.value() ?? []);
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
                concatMap((command) =>
                    this.api.updateTask(command.id, mapUpdateTaskFormToDto(command.value)).pipe(
                        tap((updated) => {
                            this.tasksResource.update((tasks) => (tasks ?? []).map((task) => (task.id === updated.id ? updated : task)));
                        })
                    )
                )
            )
            .subscribe();
    }

    refresh(): void {
        this.tasksResource.reload();
    }

    createTask(formValue: TaskFormValue) {
        this.isSaving.set(true);
        return this.api.createTask(mapCreateTaskFormToDto(formValue)).pipe(
            tap((task) => {
                this.tasksResource.update((tasks) => [ task, ...(tasks ?? []) ]);
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
                this.tasksResource.update((tasks) => (tasks ?? []).filter((task) => task.id !== id));
            })
        );
    }

    selectTask(id: string | null): void {
        this.selectedTaskId.set(id);
    }
}
