import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';

import { provideRouter } from '@angular/router';import { provideRouter } from '@angular/router';

import { provideHttpClient, withFetch } from '@angular/common/http';import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';import { routes } from './app.routes';



export const appConfig: ApplicationConfig = {export const appConfig: ApplicationConfig = {

  providers: [  providers: [

    provideBrowserGlobalErrorListeners(),    provideBrowserGlobalErrorListeners(),

    provideZoneChangeDetection({ eventCoalescing: true }),    provideZoneChangeDetection({ eventCoalescing: true }),

    provideHttpClient(withFetch()),    provideHttpClient(withFetch()),

    provideRouter(routes)    provideRouter(routes)

  ]  ]

};};

import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {provideHttpClient, withFetch} from '@angular/common/http';
import {provideTranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch()),
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }),
      fallbackLang: 'en'
      }
    ),
    provideRouter(routes)
  ]
};
