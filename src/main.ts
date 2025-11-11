import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Global handlers to avoid uncaught promise rejections or errors from 3rd-party scripts
// (e.g., blocked Stripe resources) bringing down the app UI or spamming the console.
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  try {
    // Log with a clear prefix so it's easy to find in the console
    console.warn('Global unhandledrejection caught:', event.reason);
    // Prevent the browser from logging this again as an uncaught exception
    event.preventDefault();
  } catch (err) {
    console.error('Error handling unhandledrejection:', err);
  }
});

window.addEventListener('error', (event: ErrorEvent) => {
  try {
    console.warn('Global error caught:', event.message, 'at', event.filename, event.lineno + ':' + event.colno);
    // do not call preventDefault here — we only reduce noise in console by logging a concise message
  } catch (err) {
    console.error('Error handling global error event:', err);
  }
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
