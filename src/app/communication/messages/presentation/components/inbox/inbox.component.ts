import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MessagesStore } from '../../../application/messages.store'; // <- 3 niveles arriba

@Component({
  standalone: true,
  selector: 'cc-inbox',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit {
  private store: MessagesStore = inject(MessagesStore);

  role: 'PATIENT' | 'DOCTOR' = 'PATIENT';
  userId: string = 'PATIENT-123';

  ngOnInit(): void {
    this.store.loadInbox(this.role, this.userId);
  }

  get threads(): any[] { // tipa con tu modelo Thread[] si ya lo tienes
    return this.store.inbox();
  }
}
