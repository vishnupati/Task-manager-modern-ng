import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppFooterComponent } from './shared/components/app-footer/app-footer.component';
import { AppHeaderComponent } from './shared/components/app-header/app-header.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet, ToastContainerComponent, AppHeaderComponent, AppFooterComponent ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}
