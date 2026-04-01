import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-search-input',
    standalone: true,
    imports: [ FormsModule ],
    template: `
        <input
            type="search"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Search by title or description"
            class="search-input" />
        <input
            type="search"
            [(ngModel)]='searchTerm'
            placeholder="Search by title or description"
            class="search-input" />
    `,
    styles: [ `
        .search-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--app-border);
            border-radius: 6px;
            background-color: var(--app-surface);
            color: var(--app-text);
            font-size: 14px;
        }

        .search-input:focus {
            outline: none;
            border-color: var(--app-accent);
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .search-input::placeholder {
            color: var(--app-text-secondary, #666);
        }
    `]
})
export class SearchInputComponent {
    readonly searchTerm = model<string>('');
}