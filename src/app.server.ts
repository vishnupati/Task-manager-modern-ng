import { APP_BASE_HREF } from '@angular/common';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server'; import '@angular/compiler';
import { App } from './app/app.js';
import { appConfig } from './app/app.config.js';

const serverConfig = {
    ...appConfig,
    providers: [
        provideServerRendering(),
        { provide: APP_BASE_HREF, useValue: '/' },
        ...(appConfig.providers || []),
    ],
};

export function bootstrap() {
    return bootstrapApplication(App, serverConfig);
}

