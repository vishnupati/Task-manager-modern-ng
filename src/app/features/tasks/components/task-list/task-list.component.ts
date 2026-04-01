import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Task } from '../../../../core/models/task.model';

@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [ CommonModule ],
    template: `
        @if (tasks().length === 0) {
            <p class="state">No tasks found. Add your first task to get started.</p>
        } @else {
            <section class="task-list">
                @for (task of tasks(); track task.id) {
                    <article class="task-card" [class.completed]="task.status === 'completed'">
                        <header>
                            <h2>{{ task.title }}</h2>
                            <small>{{ task.createdAt | date: 'mediumDate' }}</small>
                        </header>

                        @if (task.description) {
                            <p>{{ task.description }}</p>
                        }

                        <footer>
                            <label class="toggle">
                                <input
                                    type="checkbox"
                                    [checked]="task.status === 'completed'"
                                    (change)="toggleStatus.emit({ taskId: task.id, completed: $any($event.target).checked })" />
                                <span>{{ task.status === 'completed' ? 'Completed' : 'Pending' }}</span>
                            </label>

                            <div class="actions">
                                <button type="button" (click)="editTask.emit(task.id)">Edit</button>
                                <button type="button" class="danger" (click)="deleteTask.emit(task.id)">Delete</button>
                            </div>
                        </footer>
                    </article>
                }
            </section>
        }
    `,
    styles: [ `
        .state {
            text-align: center;
            padding: 2rem;
            color: var(--app-text-secondary);
            font-style: italic;
        }

        .task-list {
            display: grid;
            gap: 1rem;
        }

        .task-card {
            border: 1px solid var(--app-border);
            border-radius: 8px;
            padding: 1rem;
            background-color: var(--app-surface);
            transition: border-color 0.2s ease;
        }

        .task-card:hover {
            border-color: var(--app-accent);
        }

        .task-card.completed {
            opacity: 0.7;
        }

        .task-card header {
            margin-bottom: 0.5rem;
        }

        .task-card h2 {
            margin: 0 0 0.25rem 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--app-text);
        }

        .task-card small {
            color: var(--app-text-secondary);
            font-size: 0.875rem;
        }

        .task-card p {
            margin: 0.5rem 0;
            color: var(--app-text);
            line-height: 1.5;
        }

        .task-card footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1rem;
            padding-top: 0.75rem;
            border-top: 1px solid var(--app-border);
        }

        .toggle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            font-size: 0.875rem;
            color: var(--app-text-secondary);
        }

        .toggle input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: var(--app-accent);
        }

        .actions {
            display: flex;
            gap: 0.5rem;
        }

        .actions button {
            padding: 0.375rem 0.75rem;
            border: 1px solid var(--app-border);
            border-radius: 4px;
            background-color: var(--app-surface);
            color: var(--app-text);
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .actions button:hover {
            border-color: var(--app-accent);
            background-color: var(--app-accent);
            color: white;
        }

        .actions button.danger {
            border-color: #dc2626;
            color: #dc2626;
        }

        .actions button.danger:hover {
            background-color: #dc2626;
            color: white;
        }
    `]
})
export class TaskListComponent {
    readonly tasks = input<Task[]>([]);

    readonly toggleStatus = output<{ taskId: string; completed: boolean }>();
    readonly editTask = output<string>();
    readonly deleteTask = output<string>();
}