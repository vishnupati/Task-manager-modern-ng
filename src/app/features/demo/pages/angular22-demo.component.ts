import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject, Service, debounced, ChangeDetectionStrategy } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Service()
export class MockDemoLogService {
  private logs = signal<string[]>(['Service initialized with @Service decorator']);

  getLogs() {
    return this.logs.asReadonly();
  }

  addLog(message: string) {
    this.logs.update((current) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...current]);
  }
}

interface Post {
  id: number;
  title: string;
  body: string;
}

@Component({
  selector: 'app-angular22-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './angular22-demo.component.html',
  styleUrl: './angular22-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Angular22DemoComponent {
  private readonly logService = inject(MockDemoLogService);

  // 1. Debounced Search Term Signal
  readonly searchTerm = signal('');
  readonly debouncedSearch = debounced(this.searchTerm, 500);

  // 2. httpResource with reactive Debouncing dependency
  readonly postsResource = httpResource<Post[]>(() => {
    const query = this.debouncedSearch.value()?.trim();
    if (!query) {
      return 'https://jsonplaceholder.typicode.com/posts?_limit=3';
    }
    return `https://jsonplaceholder.typicode.com/posts?q=${encodeURIComponent(query)}&_limit=3`;
  }, {
    defaultValue: []
  });

  // 3. Error Boundary State
  readonly triggerError = signal(false);
  readonly riskyValue = computed(() => {
    if (this.triggerError()) {
      throw new Error('Component crashed: Change detection triggered an error in the template.');
    }
    return 'All processes running normally inside @boundary.';
  });

  // 4. Switch Control Flow Select State
  readonly activeTab = signal<'http' | 'boundary' | 'service'>('http');

  readonly logs = this.logService.getLogs();

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.logService.addLog(`Updated search term input to: "${value}"`);
  }

  toggleError(): void {
    const nextState = !this.triggerError();
    this.triggerError.set(nextState);
    this.logService.addLog(`Set triggerError state to: ${nextState}`);
  }

  switchTab(tab: 'http' | 'boundary' | 'service'): void {
    this.activeTab.set(tab);
    this.logService.addLog(`Switched switch-case display tab to: "${tab}"`);
  }

  clearLogs(): void {
    this.logService.addLog('Log console cleared.');
  }
}
