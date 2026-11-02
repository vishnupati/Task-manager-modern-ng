import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { of } from 'rxjs';

import { App } from './app';
import { LOCAL_STORAGE } from './core/config/local-storage.token';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ App ],
      providers: [
        provideRouter([]),
        { provide: SwUpdate, useValue: { isEnabled: false, versionUpdates: of() } },
        {
          provide: LOCAL_STORAGE,
          useValue: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {}
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
