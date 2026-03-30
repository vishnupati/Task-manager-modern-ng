import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of, startWith, Subject, switchMap } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-task-page',
    standalone: true,
    imports: [ CommonModule ],
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

    readonly tasks = this.store.tasks;
    readonly stats = computed(() => this.store.statsResource.value() ?? { total: 0, pending: 0, completed: 0 });
    readonly isLoading = computed(() => this.store.tasksResource.isLoading());

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
        this.router.navigate(['/task/new']);
    }

    openEdit(taskId: string): void {
        this.router.navigate(['/task', taskId]);
    }

    onSearchChange(value: string): void {
        this.searchInput$.next(value);
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
