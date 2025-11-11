import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HospitalSidebarComponent } from '../hospital-sidebar/hospital-sidebar.component';

@Component({
  selector: 'app-hospital-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HospitalSidebarComponent],
  templateUrl: './hospital-layout.component.html',
  styleUrls: ['./hospital-layout.component.css']
})
export class HospitalLayoutComponent {
}
