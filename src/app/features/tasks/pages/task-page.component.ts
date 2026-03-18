import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, of, startWith, Subject, switchMap } from 'rxjs';

import { TaskFormValue } from '../../../core/models/task.model';
import { NotificationService } from '../../../core/services/notification.service';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { TaskFormComponent } from '../components/task-form.component';

@Component({
    selector: 'app-task-page',
    standalone: true,
    imports: [ CommonModule, TaskFormComponent ],
    templateUrl: './task-page.component.html',
    styleUrl: './task-page.component.scss'
})
export class TaskPageComponent {
    private readonly store = inject(TaskStoreService);
    private readonly notifications = inject(NotificationService);
    private readonly searchInput$ = new Subject<string>();

    readonly isPanelOpen = signal(false);
    readonly editingId = signal<string | null>(null);
    readonly errorMessage = signal('');
    readonly currentPage = signal(1);
    readonly pageSize = signal(6);

    readonly tasks = this.store.tasks;
    readonly isSaving = this.store.isSaving;
    readonly stats = computed(() => this.store.statsResource.value() ?? { total: 0, pending: 0, completed: 0 });
    readonly isLoading = computed(() => this.store.tasksResource.isLoading());
    readonly selectedTask = computed(() => {
        const editId = this.editingId();
        if (!editId) {
            return null;
        }

        return this.tasks().find((task) => task.id === editId) ?? null;
    });

    readonly query = toSignal(
        this.searchInput$.pipe(
            startWith(''),
            debounceTime(200),
            distinctUntilChanged(),
            switchMap((value) => of(value.trim().toLowerCase()))
        ),
        { initialValue: '' }
    );

    readonly filteredTasks = computed(() => {
        const searchTerm = this.query();
        if (!searchTerm) {
            return this.tasks();
        }

        return this.tasks().filter((task) => {
            return (
                task.title.toLowerCase().includes(searchTerm) ||
                task.description.toLowerCase().includes(searchTerm)
            );
        });
    });

    readonly totalPages = computed(() => {
        const totalItems = this.filteredTasks().length;
        const size = this.pageSize();
        return Math.max(1, Math.ceil(totalItems / size));
    });

    readonly paginatedTasks = computed(() => {
        const page = this.currentPage();
        const size = this.pageSize();
        const start = (page - 1) * size;
        return this.filteredTasks().slice(start, start + size);
    });

    constructor() {
        effect(() => {
            this.store.tasksFromReloadSignal();
        });

        effect(() => {
            const totalPages = this.totalPages();
            const page = this.currentPage();
            if (page > totalPages) {
                this.currentPage.set(totalPages);
            }
        });

        effect(() => {
            this.query();
            this.currentPage.set(1);
        });
    }

    openCreate(): void {
        this.editingId.set(null);
        this.isPanelOpen.set(true);
    }

    openEdit(taskId: string): void {
        this.editingId.set(taskId);
        this.store.selectTask(taskId);
        this.isPanelOpen.set(true);
    }

    closePanel(): void {
        this.isPanelOpen.set(false);
        this.editingId.set(null);
        this.store.selectTask(null);
    }

    onSearchChange(value: string): void {
        this.searchInput$.next(value);
    }

    saveTask(formValue: TaskFormValue): void {
        this.errorMessage.set('');
        const editingTaskId = this.editingId();

        if (!editingTaskId) {
            this.store.createTask(formValue).subscribe({
                next: () => {
                    this.notifications.success('Task created successfully.');
                    this.closePanel();
                },
                error: (error: HttpErrorResponse) => {
                    this.errorMessage.set(error.error?.message ?? 'Unable to create task right now.');
                }
            });
            return;
        }

        this.store.queueTaskUpdate(editingTaskId, formValue);
        this.notifications.success('Task updated successfully.');
        this.closePanel();
    }

    toggleStatus(taskId: string, completed: boolean): void {
        this.errorMessage.set('');
        this.store.queueTaskUpdate(taskId, { status: completed ? 'completed' : 'pending' });
        this.notifications.info('Task status updated.');
    }

    removeTask(taskId: string): void {
        this.errorMessage.set('');
        this.store.deleteTask(taskId).subscribe({
            next: () => {
                this.notifications.success('Task deleted successfully.');
            },
            error: (error: HttpErrorResponse) => {
                this.errorMessage.set(error.error?.message ?? 'Unable to delete task right now.');
            }
        });
    }

    goToPreviousPage(): void {
        this.currentPage.update((value) => Math.max(1, value - 1));
    }

    goToNextPage(): void {
        const pages = this.totalPages();
        this.currentPage.update((value) => Math.min(pages, value + 1));
    }
}
