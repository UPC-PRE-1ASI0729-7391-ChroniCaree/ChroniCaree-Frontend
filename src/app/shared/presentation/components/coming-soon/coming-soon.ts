import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-coming-soon',
  imports: [CommonModule, RouterLink],
  templateUrl: './coming-soon.html',
  styleUrls: ['./coming-soon.css']
})
export class ComingSoonComponent {}
