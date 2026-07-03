import { Component, computed, inject, signal, ViewEncapsulation, ChangeDetectionStrategy, HostListener, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ============================================================================
 * 🔥 COMPLETE @Component DECORATOR GUIDE WITH ALL PROPERTIES
 * ============================================================================
 * 
 * Angular ke @Component decorator mein ye properties use kar sakte ho:
 */

// ============================================================================
// Example 1: SIMPLE COMPONENT (Only required fields)
// ============================================================================
@Component({
    selector: 'app-simple-example',
    template: `<h3>Simple Component</h3>`,
    standalone: true
})
class SimpleExampleComponent { }

// ============================================================================
// Example 2: COMPONENT WITH TEMPLATE & STYLES
// ============================================================================
@Component({
    selector: 'app-basic-example',
    template: `<h3>Basic Component with Inline Template</h3>`,
    styles: [ `h3 { color: blue; }` ],
    standalone: true
})
class BasicExampleComponent { }

// ============================================================================
// Example 3: COMPONENT WITH IMPORTS (Standalone Dependencies)
// ============================================================================
@Component({
    selector: 'app-with-imports',
    template: `
    <div *ngIf="isVisible()">
      <p>{{ message }}</p>
      <button (click)="toggle()">Toggle</button>
    </div>
  `,
    standalone: true,
    imports: [ CommonModule ]  // Import CommonModule for *ngIf, *ngFor, etc.
})
class WithImportsExampleComponent {
    isVisible = signal(true);
    message = 'Hello Angular!';

    toggle() {
        this.isVisible.update(v => !v);
    }
}

// ============================================================================
// Example 4: COMPONENT WITH PROVIDERS (Dependency Injection)
// ============================================================================
class LoggerService {
    log(message: string) {
        console.log(`[Logger]: ${message}`);
    }
}

@Component({
    selector: 'app-with-providers',
    template: `<h3>Component with Providers</h3>`,
    standalone: true,
    providers: [ LoggerService ]  // Provide service at component level
})
class WithProvidersExampleComponent {
    private logger = inject(LoggerService);

    ngOnInit() {
        this.logger.log('Component initialized');
    }
}

// ============================================================================
// Example 5: COMPONENT WITH CHANGE DETECTION STRATEGY
// ============================================================================
@Component({
    selector: 'app-onpush-example',
    template: `<h3>OnPush Change Detection: {{ counter() }}</h3>`,
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush  // ✅ Performance optimization
})
class OnPushExampleComponent {
    counter = signal(0);

    increment() {
        this.counter.update(c => c + 1);
    }
}

// ============================================================================
// Example 6: COMPONENT WITH VIEW ENCAPSULATION
// ============================================================================
@Component({
    selector: 'app-encapsulation-example',
    template: `<h3 class="title">Encapsulation Example</h3>`,
    styles: [ `
    .title {
      color: red;
      /* This style is scoped to this component only */
    }
  `],
    standalone: true,
    encapsulation: ViewEncapsulation.Emulated  // (Default: Emulated, None, ShadowDom)
})
class EncapsulationExampleComponent { }

// ============================================================================
// Example 7: COMPONENT WITH HOST BINDINGS & LISTENERS
// ============================================================================
@Component({
    selector: 'app-host-example',
    template: `<h3>Click Count: {{ clickCount() }}</h3>`,
    standalone: true,
    host: {
        'class': 'host-wrapper',
        '[class.active]': 'isActive()',
        '(click)': 'handleHostClick()'
    }
})
class HostExampleComponent {
    clickCount = signal(0);
    isActive = signal(false);

    handleHostClick() {
        this.clickCount.update(c => c + 1);
    }
}

// ============================================================================
// Example 8: COMPONENT WITH @HostListener & @HostBinding DECORATORS
// ============================================================================
@Component({
    selector: 'app-host-decorator-example',
    template: `<h3>Mouse Position Listener</h3>`,
    standalone: true
})
class HostDecoratorExampleComponent {
    @HostBinding('style.background-color')
    bgColor = 'lightgray';

    @HostListener('mouseenter')
    onMouseEnter() {
        this.bgColor = 'lightblue';
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        this.bgColor = 'lightgray';
    }
}

// ============================================================================
// Example 9: COMPONENT WITH viewProviders (Child-level DI)
// ============================================================================
@Component({
    selector: 'app-view-providers-example',
    template: `<h3>View Providers Example</h3>`,
    standalone: true,
    providers: [ LoggerService ],
    viewProviders: [
        {
            provide: 'child-logger',
            useValue: { log: (msg: string) => console.log(`[Child]: ${msg}`) }
        }
    ]
})
class ViewProvidersExampleComponent { }

// ============================================================================
// Example 10: COMPLETE EXAMPLE WITH ALL MAJOR PROPERTIES
// ============================================================================
@Component({
    selector: 'app-complete-example',
    templateUrl: './component-decorator-demo-complete.component.html',
    styleUrls: [ './component-decorator-demo-complete.component.scss' ],
    standalone: true,
    imports: [ CommonModule ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.Emulated,
    providers: [ LoggerService ],
    host: {
        'class': 'complete-wrapper',
        '[class.theme-dark]': 'isDarkMode()'
    }
})
class CompleteExampleComponent {
    isDarkMode = signal(false);
    private logger = inject(LoggerService);

    toggleTheme() {
        this.isDarkMode.update(v => !v);
        this.logger.log('Theme toggled');
    }

    @HostListener('window:resize')
    onWindowResize() {
        this.logger.log('Window resized');
    }
}

// ============================================================================
// MAIN DEMO COMPONENT - SHOWCASING ALL PROPERTIES
// ============================================================================
@Component({
    selector: 'app-component-decorator-demo',
    templateUrl: './component-decorator-demo.component.html',
    styleUrl: './component-decorator-demo.component.scss',
    standalone: true,
    imports: [ CommonModule ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComponentDecoratorDemoComponent {
    activeTab = signal('overview');

    // Properties showcase
    decoratorProperties = signal([
        {
            category: '🔴 REQUIRED FIELDS',
            fields: [
                { name: 'selector', description: 'CSS selector for the component', example: "selector: 'app-my-component'" },
                { name: 'template/templateUrl', description: 'Component HTML content', example: "templateUrl: './my.component.html'" },
            ]
        },
        {
            category: '🟠 COMMONLY USED FIELDS',
            fields: [
                { name: 'imports', description: 'Import other standalone components, directives', example: "imports: [CommonModule, MyComponent]" },
                { name: 'providers', description: 'Services to inject (component-level DI)', example: "providers: [UserService, AuthService]" },
                { name: 'styles/styleUrls', description: 'CSS styling for component', example: "styleUrl: './my.component.scss'" },
                { name: 'standalone', description: 'Mark component as standalone (Angular 14+)', example: "standalone: true" },
            ]
        },
        {
            category: '🟡 PERFORMANCE & OPTIMIZATION',
            fields: [
                { name: 'changeDetection', description: 'Control change detection strategy', example: "changeDetection: ChangeDetectionStrategy.OnPush" },
                { name: 'encapsulation', description: 'CSS scope: Emulated, None, or ShadowDom', example: "encapsulation: ViewEncapsulation.ShadowDom" },
            ]
        },
        {
            category: '🟢 HOST & DOM INTERACTION',
            fields: [
                { name: 'host', description: 'Bind to host element properties & events', example: "host: { 'class': 'my-class', '(click)': 'onClick()' }" },
                { name: '@HostBinding', description: 'Decorator to bind properties to host', example: "@HostBinding('class.active') isActive = true;" },
                { name: '@HostListener', description: 'Decorator to listen to host events', example: "@HostListener('click') onClick() {}" },
            ]
        },
        {
            category: '🔵 ADVANCED FEATURES',
            fields: [
                { name: 'viewProviders', description: 'Providers visible to child components only', example: "viewProviders: [SomeService]" },
                { name: 'animations', description: 'Define component animations', example: "animations: [trigger('fadeIn', [...])]" },
                { name: 'schemas', description: 'Allow unknown elements/attributes', example: "schemas: [NO_ERRORS_SCHEMA]" },
            ]
        },
        {
            category: '🟣 RARE/SPECIAL FIELDS',
            fields: [
                { name: 'interpolation', description: 'Change template interpolation syntax', example: "interpolation: ['{%', '%}']" },
                { name: 'preserveWhitespace', description: 'Preserve whitespace in template', example: "preserveWhitespace: true" },
            ]
        }
    ]);

    codeExamples = signal([
        {
            title: 'Simple Component (5 lines)',
            code: `@Component({
  selector: 'app-simple',
  template: '<h1>Hello</h1>',
  standalone: true
})
export class SimpleComponent {}`
        },
        {
            title: 'With Imports & Providers',
            code: `@Component({
  selector: 'app-advanced',
  imports: [CommonModule, CustomComponent],
  providers: [UserService, AuthService],
  standalone: true
})
export class AdvancedComponent {
  private auth = inject(AuthService);
}`
        },
        {
            title: 'With Change Detection OnPush',
            code: `@Component({
  selector: 'app-optimized',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div>{{ signal() }}</div>',
  standalone: true
})
export class OptimizedComponent {
  counter = signal(0);
}`
        },
        {
            title: 'With Host Bindings & Listeners',
            code: `@Component({
  selector: 'app-interactive',
  host: {
    'class': 'interactive-component',
    '[class.active]': 'isActive()'
  },
  standalone: true
})
export class InteractiveComponent {
  isActive = signal(false);
  
  @HostListener('click')
  onClick() { this.isActive.update(v => !v); }
}`
        },
        {
            title: 'Complete Professional Example',
            code: `@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, HeaderComponent],
  providers: [DataService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  host: { 'class': 'dashboard-container' },
  standalone: true
})
export class DashboardComponent {
  private data = inject(DataService);
  loading = signal(false);
}`
        }
    ]);

    professionalPattern = `@Component({
  selector: 'app-feature',
  templateUrl: './feature.component.html',
  styleUrl: './feature.component.scss',
  standalone: true,
  imports: [CommonModule],
  providers: [FeatureService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'feature-wrapper' }
})
export class FeatureComponent {
  data = signal([]);
  isLoading = signal(false);
}`;

    simpleComponentExample = `@Component({
  selector: 'app-hello',
  template: '<h1>Hello!</h1>'
})
export class HelloComponent {}`;

    overviewCodeExample = `@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  data = signal([]);
}`;

    switchTab(tab: string) {
        this.activeTab.set(tab);
    }
}
