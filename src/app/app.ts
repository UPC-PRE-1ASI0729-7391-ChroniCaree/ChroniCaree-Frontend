import { Component } from '@angular/core';
import { LayoutContentComponent } from './shared/presentation/components/layout-content/layout-content';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutContentComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
