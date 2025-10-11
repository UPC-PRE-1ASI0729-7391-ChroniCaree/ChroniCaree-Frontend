import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MedicalRecordsStore } from '../../../../doctors/application/medical-records.store';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './medical-record-detail.html',
  styleUrls: ['./medical-record-detail.css'],
})
export class MedicalRecordDetailComponent {
  private route = inject(ActivatedRoute);
  private recordsStore = inject(MedicalRecordsStore);
  private location = inject(Location);

  recordId = Number(this.route.snapshot.paramMap.get('id'));

  record$ = this.recordsStore.selectedRecord;

  constructor() {
    if (this.recordId) {
      this.recordsStore.selectRecord(this.recordId);
    }
  }

  goBack() {
    this.location.back();
  }
}
