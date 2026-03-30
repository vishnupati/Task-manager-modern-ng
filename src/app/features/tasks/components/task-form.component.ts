import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { resource } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';

import { Task, TaskFormValue } from '../../../core/models/task.model';
import { TaskStatus } from '../../../core/models/task-status.type';
import { TaskApiService } from '../../../core/services/task-api.service';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { NotificationService } from '../../../core/services/notification.service';

interface TaskForm {
    title: string;
    description: string;
    status: TaskStatus;
}

@Component({
    selector: 'app-task-form',
    standalone: true,
    imports: [ CommonModule, FormField ],
    templateUrl: './task-form.component.html',
    styleUrl: './task-form.component.scss'
})
export class TaskFormComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly api = inject(TaskApiService);
    private readonly store = inject(TaskStoreService);
    private readonly notifications = inject(NotificationService);

    readonly taskId = computed(() => {
        const params = this.route.snapshot.params;
        return params[ 'id' ] || null;
    });
    // readonly isCreateMode = computed(() => !this.taskId());

    readonly taskResource = resource<Task | null, string>({
        params: () => this.taskId() || null,
        loader: async ({ params }) => params ? await firstValueFrom(this.api.getTask(params)) : null
    });

    readonly task = computed(() => this.taskResource.value() ?? null);
    readonly isLoading = computed(() => this.taskResource.isLoading());
    readonly error = computed(() => this.taskResource.error());

    readonly isBusy = signal(false);

    readonly taskModel = signal<TaskForm>({
        title: '',
        description: '',
        status: 'pending'
    });

    readonly taskForm = form(this.taskModel, (p) => {
        required(p.title, { message: 'Title is required' });
    });

    readonly isEditMode = computed(() => !!this.taskId());

    readonly isFormValid = computed(() => this.taskForm().valid());

    constructor() {
        effect(() => {
            const task = this.task();
            this.taskModel.set({
                title: task?.title ?? '',
                description: task?.description ?? '',
                status: task?.status ?? 'pending'
            });
        });
    }

    onSubmit(event: Event): void {
        event.preventDefault();
        submit(this.taskForm, async () => {
            const formValue: TaskFormValue = {
                title: this.taskModel().title.trim(),
                description: this.taskModel().description.trim(),
                status: this.taskModel().status
            };

            this.isBusy.set(true);
            try {
                if (!this.task()) {
                    this.store.createTask(formValue).subscribe({
                        next: () => {
                            this.notifications.success('Task created successfully.');
                            this.isBusy.set(false);
                            this.router.navigate([ '/tasks' ]);
                        },
                        error: (error: HttpErrorResponse) => {
                            this.notifications.error(error.error?.message ?? 'Unable to create task right now.');
                            this.isBusy.set(false);
                        }
                    });
                } else {
                    this.store.queueTaskUpdate(this.taskId(), formValue);
                    this.notifications.success('Task updated successfully.');
                    this.isBusy.set(false);
                    this.router.navigate([ '/tasks' ]);
                }
            } catch (error) {
                this.notifications.error((error as HttpErrorResponse).error?.message ?? 'Unable to save task right now.');
                this.isBusy.set(false);
            }
        });
    }

    cancel(): void {
        this.router.navigate([ '/tasks' ]);
    }
}
