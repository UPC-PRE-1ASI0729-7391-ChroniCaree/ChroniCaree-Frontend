import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './iam/infrastructure/auth.interceptor';

// ngx-translate providers (runtime JSON loader)
// Using TranslateModule.forRoot so behavior matches installed @ngx-translate versions
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export function createTranslateLoader(http: HttpClient) {
  // Load translation files from /i18n/ (en.json / es.json)
  return new TranslateHttpLoader(http, '/i18n/', '.json');
}

// Initialize translations at app startup. Respect a stored locale in localStorage if present.
export function initializeTranslationsFactory(translate: TranslateService) {
  return () => {
    const saved = (() => {
      try { return localStorage.getItem('locale'); } catch (e) { return null; }
    })();
    const lang = (saved && saved.length) ? saved : 'es';
    translate.setDefaultLang('es');
    // translate.use returns an Observable — convert to a Promise so APP_INITIALIZER waits
    return lastValueFrom(translate.use(lang));
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideRouter(routes),
    // Register TranslateModule.forRoot so ngx-translate pipe/service are available globally
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient]
        }
      })
    )
    ,
    // Ensure the app starts with Spanish by default (or the previously stored locale)
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslationsFactory,
      deps: [TranslateService],
      multi: true
    }
  ]
};
