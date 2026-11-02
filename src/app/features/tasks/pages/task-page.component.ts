import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
  ChangeDetectionStrategy,
  debounced,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '../../../core/services/notification.service';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';

@Component({
  selector: 'app-task-page',
  imports: [TaskListComponent, SearchInputComponent],
  templateUrl: './task-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './task-page.component.scss',
})
export class TaskPageComponent {
  private readonly store = inject(TaskStoreService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly actionError = signal('');
  readonly pageSize = signal(6);
  readonly searchTerm = signal('');

  readonly tasks = this.store.tasks;
  readonly stats = this.store.stats;
  // Only the first load replaces the list; reloads keep showing the tasks already on screen.
  readonly isLoading = computed(() => this.store.tasksResource.status() === 'loading');

  readonly query = debounced(this.searchTerm, 400);

  readonly errorMessage = computed(() => {
    const error = this.store.tasksResource.error();
    if (error) {
      const serverMessage = error instanceof HttpErrorResponse ? error.error?.message : undefined;
      return serverMessage ?? 'Unable to load tasks. Please try again.';
    }
    return this.actionError();
  });

  readonly filteredTasks = computed(() => {
    const searchTerm = this.query.value()?.trim().toLowerCase();
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

  // Back to the first page whenever the search query changes.
  private readonly requestedPage = linkedSignal({
    source: () => this.query.value(),
    computation: () => 1,
  });

  // Clamped, so deleting the last task of the last page doesn't leave an empty page.
  readonly currentPage = computed(() => Math.min(this.requestedPage(), this.totalPages()));

  readonly paginatedTasks = computed(() => {
    const size = this.pageSize();
    const start = (this.currentPage() - 1) * size;
    return this.filteredTasks().slice(start, start + size);
  });

  openCreate(): void {
    this.router.navigate(['/task/new']);
  }

  openEdit(taskId: string): void {
    this.router.navigate(['/task', taskId]);
  }

  onToggleStatus({ taskId, completed }: { taskId: string; completed: boolean }): void {
    this.actionError.set('');
    this.store.queueTaskUpdate(taskId, { status: completed ? 'completed' : 'pending' });
    this.notifications.info('Task status updated.');
  }

  onEditTask(taskId: string): void {
    this.openEdit(taskId);
  }

  onDeleteTask(taskId: string): void {
    this.actionError.set('');
    this.store.deleteTask(taskId).subscribe({
      next: () => {
        this.notifications.success('Task deleted successfully.');
      },
      error: (error: HttpErrorResponse) => {
        this.actionError.set(error.error?.message ?? 'Unable to delete task right now.');
      },
    });
  }

  goToPreviousPage(): void {
    this.requestedPage.set(Math.max(1, this.currentPage() - 1));
  }

  goToNextPage(): void {
    this.requestedPage.set(Math.min(this.totalPages(), this.currentPage() + 1));
  }
}
