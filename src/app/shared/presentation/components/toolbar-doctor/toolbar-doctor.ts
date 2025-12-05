import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { UserStore } from '../../../../iam/application/user.store';
import { MessagesStore } from '../../../../communication/application/messages.store';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-toolbar-doctor',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatBadgeModule,
    TranslateModule
  ],
  templateUrl: './toolbar-doctor.html',
  styleUrls: ['./toolbar-doctor.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarDoctorComponent implements OnInit {
  messagesStore = inject(MessagesStore);

  constructor(
    private router: Router,
    private userStore: UserStore
  ) {}

  ngOnInit(): void {

    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      console.error('❌ Toolbar-Doctor: Usuario no autenticado');
      return;
    }

    const currentUser = JSON.parse(currentUserStr);
    const userId = currentUser.id;
    console.log(`✅ Toolbar-Doctor: Cargando mensajes para doctor ID: ${userId}`);
    this.messagesStore.loadInbox('DOCTOR', userId.toString());
  }

  logout(): void {
    this.userStore.clearCurrentUser();

    this.router.navigate(['/iam/login']);
  }
}
