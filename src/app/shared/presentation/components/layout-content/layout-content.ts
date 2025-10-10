import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
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
}
