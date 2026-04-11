import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, model, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of, startWith, Subject, switchMap } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { TaskFormComponent } from '../components/task-form.component';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { Task } from '../../../core/models/task.model';
import { TaskFormValue } from '../../../core/models/task.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-task-page',
    standalone: true,
    imports: [ CommonModule, TaskFormComponent, TaskListComponent, SearchInputComponent ],
    templateUrl: './task-page.component.html',
    styleUrl: './task-page.component.scss'
})
export class TaskPageComponent {
    private readonly store = inject(TaskStoreService);
    private readonly notifications = inject(NotificationService);
    private readonly router = inject(Router);
    private readonly searchInput$ = new Subject<string>();

    readonly errorMessage = signal('');
    readonly currentPage = signal(1);
    readonly pageSize = signal(6);

    // Model signals for two-way data binding
    readonly isPanelOpen = model(false);
    readonly selectedTask = model<Task | null>(null);
    readonly searchTerm = model<string>('');

    // Output signals for child to parent communication
    readonly taskSaved = output<Task>();
    readonly panelClosed = output<void>();

    readonly tasks = this.store.tasks;
    readonly stats = computed(() => this.store.statsResource.value() ?? { total: 0, pending: 0, completed: 0 });
    readonly isLoading = computed(() => this.store.tasksResource.isLoading());

    readonly query = toSignal(
        this.searchInput$.pipe(
            startWith(''),
            debounceTime(400),
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
        // Load tasks immediately
        this.loadTasks();

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

        effect(() => {
            const term = this.searchTerm();
            this.searchInput$.next(term);
        });
    }

    private loadTasks(): void {
        this.store.getTasks().subscribe({
            next: (tasks) => {
                this.errorMessage.set('');
            },
            error: (error: HttpErrorResponse) => {
                this.errorMessage.set(error.error?.message ?? 'Unable to load tasks. Please try again.');
            }
        });
    }

    openCreate(): void {
        this.router.navigate([ '/task/new' ]);
    }

    openEdit(taskId: string): void {
        this.router.navigate([ '/task', taskId ]);
    }

    onSearchChange(value: string): void {
        this.searchInput$.next(value);
    }

    onToggleStatus({ taskId, completed }: { taskId: string; completed: boolean }): void {
        this.errorMessage.set('');
        this.store.queueTaskUpdate(taskId, { status: completed ? 'completed' : 'pending' });
        this.notifications.info('Task status updated.');
    }

    onEditTask(taskId: string): void {
        this.openEdit(taskId);
    }

    onDeleteTask(taskId: string): void {
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
                    this.notifications.error(error.error?.message ?? 'Unable to create task right now.');
                }
            });
        }

        this.closePanel();
    }

    closePanel(): void {
        this.isPanelOpen.set(false);
        this.selectedTask.set(null);
        this.panelClosed.emit();
    }
}
