import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';

import { UserStore } from '../../../../iam/application/user.store';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';

@Component({
  standalone: true,
  selector: 'app-toolbar-admin',
  imports: [CommonModule, RouterLink, RouterLinkActive, MatBadgeModule, TranslateModule],
  templateUrl: './toolbar-admin.html',
  styleUrls: ['./toolbar-admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarAdminComponent implements OnInit {
  hospitalStore = inject(HospitalDashboardStore);

  constructor(
    private router: Router,
    private userStore: UserStore
  ) {}

  get stats() {
    return this.hospitalStore.stats();
  }

  ngOnInit(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser.tenantId) {
        this.hospitalStore.loadDashboardStats(currentUser.tenantId);
      }
    }
  }

  logout(): void {
    this.userStore.clearCurrentUser();
    this.router.navigate(['/iam/login']);
  }
}
