import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';

import { Task, TaskFormValue } from '../../../core/models/task.model';
import { TaskStatus } from '../../../core/models/task-status.type';

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

    // Input signals for parent to child communication
    readonly task = input<Task | null>(null);
    readonly isBusy = input<boolean>(false);

    // Output signals for child to parent communication
    readonly formSubmitted = output<TaskFormValue>();
    readonly cancelled = output<void>();

    readonly taskModel = signal<TaskForm>({
        title: '',
        description: '',
        status: 'pending'
    });

    readonly taskForm = form(this.taskModel, (p) => {
        required(p.title, { message: 'Title is required' });
    });

    readonly isEditMode = computed(() => !!this.task());
    readonly isFormValid = computed(() => this.taskForm().valid());

    constructor() {
        effect(() => {
            const task = this.task();

            if (task) {
                this.taskModel.set({
                    title: task.title,
                    description: task.description,
                    status: task.status
                });
            }
        });
    }

    onSubmit(event: Event): void {
        event.preventDefault();
        submit(this.taskForm, async () => {
            this.formSubmitted.emit({
                title: this.taskModel().title.trim(),
                description: this.taskModel().description.trim(),
                status: this.taskModel().status
            });

            // Emit the form data to parent component
            // this.formSubmitted.emit(formValue);
        });
    }

    cancel(): void {
        this.cancelled.emit();
    }
}
