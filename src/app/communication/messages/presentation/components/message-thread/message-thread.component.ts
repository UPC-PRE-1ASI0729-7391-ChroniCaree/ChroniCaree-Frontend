import { Component, inject, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MessagesStore } from '../../../application/messages.store'; // <- 3 niveles arriba

@Component({
  standalone: true,
  selector: 'cc-message-thread',
  imports: [CommonModule],
  templateUrl: './message-thread.component.html',
  styleUrls: ['./message-thread.component.css']
})
export class MessageThreadComponent {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private store: MessagesStore = inject(MessagesStore);

  vm: Signal<any> = computed(() => this.store.currentThread());

  constructor() {
    const id: string = this.route.snapshot.paramMap.get('id')!;
    this.store.openThread(id);
  }
}
