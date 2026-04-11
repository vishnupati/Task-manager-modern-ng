import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { UserAuthService } from '../../../core/services/user-auth.service';

@Component({
    selector: 'app-header',
    imports: [ CommonModule, RouterLink, RouterLinkActive ],
    templateUrl: './app-header.component.html',
    styleUrl: './app-header.component.scss',
    host: {
        '(document:click)': 'handleDocumentClick($event)'
    }
})
export class AppHeaderComponent {
    private readonly auth = inject(UserAuthService);
    private readonly hostElement = inject(ElementRef<HTMLElement>);

    readonly isMenuOpen = signal(false);
    readonly user = this.auth.user;
    readonly isAuthenticated = this.auth.isAuthenticated;
    readonly initials = computed(() => {
        const user = this.user();
        if (!user || !user.name) {
            return 'GU';
        }

        return user.name
            .split(' ')
            .map((part) => part.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    });

    toggleMenu(): void {
        this.isMenuOpen.update((value) => !value);
    }

    logout(): void {
        this.isMenuOpen.set(false);
        this.auth.logout().subscribe();
    }

    handleDocumentClick(event: Event): void {
        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }

        if (!this.hostElement.nativeElement.contains(target)) {
            this.isMenuOpen.set(false);
        }
    }
}
