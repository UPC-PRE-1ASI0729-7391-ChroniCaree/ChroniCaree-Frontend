/**
 * Medical Records Store
 * Doctors Bounded Context - Application Layer
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { MedicalRecord, RecordType } from '../domain/model/medical-record.entity';
import { MedicalRecordsApiEndpoint } from '../infrastructure/medical-records-api.endpoint';

interface StoreState {
  records: MedicalRecord[];
  selectedRecord: MedicalRecord | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordsStore {
  private readonly apiEndpoint = inject(MedicalRecordsApiEndpoint);
  
  private readonly state = signal<StoreState>({
    records: [],
    selectedRecord: null,
    loading: false,
    error: null
  });
  
  readonly records = computed(() => this.state().records);
  readonly selectedRecord = computed(() => this.state().selectedRecord);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  
  readonly vitalSignsRecords = computed(() =>
    this.state().records.filter(r => r.type === RecordType.VITAL_SIGNS)
  );
  
  readonly symptomsRecords = computed(() =>
    this.state().records.filter(r => r.type === RecordType.SYMPTOMS)
  );
  
  readonly consultationRecords = computed(() =>
    this.state().records.filter(r => r.type === RecordType.CONSULTATION)
  );
  
  readonly totalRecords = computed(() => this.state().records.length);
  
  loadRecordsByDoctor(doctorId: number): void {
    this.setLoading(true);
    
    this.apiEndpoint.getRecordsByDoctor(doctorId).subscribe({
      next: (records) => {
        console.log(`✅ [MedicalRecordsStore] ${records.length} registros cargados`);
        this.state.update(s => ({ ...s, records, loading: false, error: null }));
      },
      error: (err) => {
        console.error(`❌ [MedicalRecordsStore] Error:`, err);
        this.state.update(s => ({ ...s, loading: false, error: 'Error al cargar registros' }));
      }
    });
  }
  
  loadRecordsByPatient(patientId: number): void {
    this.setLoading(true);
    
    this.apiEndpoint.getRecordsByPatient(patientId).subscribe({
      next: (records) => {
        this.state.update(s => ({ ...s, records, loading: false, error: null }));
      },
      error: (err) => {
        console.error(`❌ [MedicalRecordsStore] Error:`, err);
        this.state.update(s => ({ ...s, loading: false, error: 'Error al cargar registros' }));
      }
    });
  }
  
  selectRecord(recordId: number): void {
    const record = this.state().records.find(r => r.id === recordId);
    if (record) {
      this.state.update(s => ({ ...s, selectedRecord: record }));
    }
  }
  
  refresh(doctorId: number): void {
    this.loadRecordsByDoctor(doctorId);
  }
  
  clear(): void {
    this.state.set({ records: [], selectedRecord: null, loading: false, error: null });
  }
  
  private setLoading(loading: boolean): void {
    this.state.update(s => ({ ...s, loading }));
  }
}
