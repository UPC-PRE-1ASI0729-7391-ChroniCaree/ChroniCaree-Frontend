import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ToolbarContentComponent } from '../toolbar-content/toolbar-content';
import { HeaderContentComponent } from '../header-content/header-content';
import { FooterContentComponent } from '../footer-content/footer-content';

@Component({
  selector: 'app-layout-content',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ToolbarContentComponent,
    HeaderContentComponent,
    FooterContentComponent
  ],
  templateUrl: './layout-content.html',
  styleUrl: './layout-content.css'
})
export class LayoutContentComponent {
  currentUrl = signal<string>('');

  // Routes that should be full-screen (no header/footer/toolbar)
  fullScreenRoutes = ['/iam/login', '/iam/register'];
  
  isFullScreen = computed(() => {
    const url = this.currentUrl();
    return this.fullScreenRoutes.some(route => url.startsWith(route));
  });

  constructor(private router: Router) {
    // Set initial URL
    this.currentUrl.set(this.router.url);

    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.url);
      });
  }
}
