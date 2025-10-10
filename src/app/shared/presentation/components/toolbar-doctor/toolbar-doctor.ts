import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-toolbar-doctor',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './toolbar-doctor.html',
  styleUrls: ['./toolbar-doctor.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarDoctorComponent {
  constructor(private router: Router) {}

  logout(): void {

    console.log('Doctor logout');

  }
}
