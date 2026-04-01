import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, of, startWith, Subject, switchMap } from 'rxjs';

import { TaskFormValue, Task } from '../../../core/models/task.model';
import { NotificationService } from '../../../core/services/notification.service';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { TaskFormComponent } from '../components/task-form.component';

@Component({
    selector: 'app-task-page',
    standalone: true,
    imports: [CommonModule, TaskFormComponent],
    templateUrl: './task-page.component.html',
    styleUrl: './task-page.component.scss'
})
export class TaskPageComponent {

    private readonly store = inject(TaskStoreService);
    private readonly notifications = inject(NotificationService);
    private readonly searchInput$ = new Subject<string>();

    // ✅ Local state (signals only)
    readonly isPanelOpen = signal(false);
    readonly selectedTask = signal<Task | null>(null);
    readonly errorMessage = signal('');
    readonly currentPage = signal(1);
    readonly pageSize = signal(6);

    // Store data
    readonly tasks = this.store.tasks;
    readonly isSaving = this.store.isSaving;

    readonly stats = computed(() =>
        this.store.statsResource.value() ?? { total: 0, pending: 0, completed: 0 }
    );

    readonly isLoading = computed(() =>
        this.store.tasksResource.isLoading()
    );

    // 🔍 Search
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
        if (!searchTerm) return this.tasks();

        return this.tasks().filter(task =>
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm)
        );
    });

    // 📄 Pagination
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
        // initial load
        this.store.tasksFromReloadSignal();

        // fix page overflow
        effect(() => {
            const totalPages = this.totalPages();
            const page = this.currentPage();
            if (page > totalPages) {
                this.currentPage.set(totalPages);
            }
        });

        // reset page on search
        effect(() => {
            this.query();
            this.currentPage.set(1);
        });
    }

    // 🟢 UI Actions
    openCreate(): void {
        this.selectedTask.set(null);
        this.isPanelOpen.set(true);
    }

    openEdit(taskId: string): void {
        const task = this.tasks().find(t => t.id === taskId);
        if (task) {
            this.selectedTask.set(task);
            this.isPanelOpen.set(true);
        }
    }

    closePanel(): void {
        this.isPanelOpen.set(false);
        this.selectedTask.set(null);
    }

    // 🔍 Search handler
    onSearchChange(value: string): void {
        this.searchInput$.next(value);
    }

    // 💾 Save handler
    onTaskSaved(formValue: TaskFormValue): void {
        const selectedTask = this.selectedTask();

        if (selectedTask) {
            this.store.queueTaskUpdate(selectedTask.id, formValue);
            this.notifications.success('Task updated successfully.');
        } else {
            this.store.createTask(formValue).subscribe({
                next: () => {
                    this.notifications.success('Task created successfully.');
                },
                error: (error: HttpErrorResponse) => {
                    this.notifications.error(
                        error.error?.message ?? 'Unable to create task right now.'
                    );
                }
            });
        }

        this.closePanel();
    }

    toggleStatus(taskId: string, completed: boolean): void {
        this.store.queueTaskUpdate(taskId, {
            status: completed ? 'completed' : 'pending'
        });
        this.notifications.info('Task status updated.');
    }

    removeTask(taskId: string): void {
        this.store.deleteTask(taskId).subscribe({
            next: () => {
                this.notifications.success('Task deleted successfully.');
            },
            error: (error: HttpErrorResponse) => {
                this.notifications.error(
                    error.error?.message ?? 'Unable to delete task right now.'
                );
            }
        });
    }

    // 📄 Pagination controls
    goToPreviousPage(): void {
        this.currentPage.update(v => Math.max(1, v - 1));
    }

    goToNextPage(): void {
        const pages = this.totalPages();
        this.currentPage.update(v => Math.min(pages, v + 1));
    }
}