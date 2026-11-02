import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { form, FormField, required, submit } from '@angular/forms/signals';
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

const toFormModel = (task: Task | null): TaskForm => ({
  title: task?.title ?? '',
  description: task?.description ?? '',
  status: task?.status ?? 'pending',
});

@Component({
  selector: 'app-task-form',
  imports: [FormField],
  templateUrl: './task-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(TaskApiService);
  private readonly store = inject(TaskStoreService);
  private readonly notifications = inject(NotificationService);

  readonly taskId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    requireSync: true,
  });

  // The task from the already-loaded list, so the edit form renders without waiting on a request.
  private readonly cachedTask = computed(() => {
    const id = this.taskId();
    return id ? (this.store.tasks().find((task) => task.id === id) ?? null) : null;
  });

  // Only needed for deep links, when the list isn't loaded yet or doesn't contain the task.
  readonly taskResource = this.api.getTask(() => (this.cachedTask() ? null : this.taskId()));

  readonly task = computed(
    () => this.cachedTask() ?? (this.taskResource.hasValue() ? this.taskResource.value() : null),
  );
  readonly isEditMode = computed(() => !!this.taskId());
  // Editing can't start until the task is known, otherwise a blank form would be saved over it.
  readonly isTaskPending = computed(() => this.isEditMode() && !this.task());

  readonly isBusy = signal(false);

  // Re-seeded only when a different task arrives, so a list refresh never wipes in-progress edits.
  readonly taskModel = linkedSignal<Task | null, TaskForm>({
    source: this.task,
    computation: (task, previous) =>
      previous && previous.source?.id === task?.id ? previous.value : toFormModel(task),
  });

  readonly taskForm = form(this.taskModel, (p) => {
    required(p.title, { message: 'Title is required' });
  });

  readonly isFormValid = computed(() => this.taskForm().valid());

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.isTaskPending()) {
      return;
    }

    submit(this.taskForm, async () => {
      const { title, description, status } = this.taskModel();
      const formValue: TaskFormValue = {
        title: title.trim(),
        description: description.trim(),
        status,
      };

      const taskId = this.taskId();
      if (taskId) {
        // Optimistic: the list already shows the change while it syncs in the background.
        this.store.queueTaskUpdate(taskId, formValue);
        this.notifications.success('Task updated successfully.');
        this.router.navigate(['/tasks']);
        return;
      }

      this.isBusy.set(true);
      try {
        await firstValueFrom(this.store.createTask(formValue));
        this.notifications.success('Task created successfully.');
        this.router.navigate(['/tasks']);
      } catch {
        // httpErrorInterceptor already shows the server's error message.
      } finally {
        this.isBusy.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/tasks']);
  }
}
