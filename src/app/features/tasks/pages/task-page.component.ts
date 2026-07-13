import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  model,
  output,
  signal,
  ChangeDetectionStrategy,
  debounced,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '../../../core/services/notification.service';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { TaskFormComponent } from '../components/task-form.component';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { Task } from '../../../core/models/task.model';
import { TaskFormValue } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-page',
  standalone: true,
  imports: [CommonModule, TaskFormComponent, TaskListComponent, SearchInputComponent],
  templateUrl: './task-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './task-page.component.scss',
})
export class TaskPageComponent {
  private readonly store = inject(TaskStoreService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly actionError = signal('');
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
  readonly stats = this.store.stats;
  readonly isLoading = computed(() => this.store.tasksResource.isLoading());

  readonly query = debounced(this.searchTerm, 400);

  readonly errorMessage = computed(() => {
    const resourceErr = this.store.tasksResource.error() as any;
    if (resourceErr) {
      return resourceErr.error?.message ?? resourceErr.message ?? 'Unable to load tasks. Please try again.';
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

  readonly paginatedTasks = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.filteredTasks().slice(start, start + size);
  });

  constructor() {
    effect(() => {
      const totalPages = this.totalPages();
      const page = this.currentPage();
      if (page > totalPages) {
        this.currentPage.set(totalPages);
      }
    });

    effect(() => {
      this.query.value();
      this.currentPage.set(1);
    });
  }

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
        },
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
