import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicalRecordsListComponent } from './medical-records-list';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MedicalRecordsStore } from '../../../application/medical-records.store';
import { DoctorApiEndpoint } from '../../../infrastructure/doctor-api.endpoint';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { RecordType } from '../../../domain/model/medical-record.entity';

describe('MedicalRecordsListComponent', () => {
  let component: MedicalRecordsListComponent;
  let fixture: ComponentFixture<MedicalRecordsListComponent>;
  let mockRecordsStore: jasmine.SpyObj<MedicalRecordsStore>;
  let mockDoctorApi: jasmine.SpyObj<DoctorApiEndpoint>;

  const mockRecords = [
    {
      id: 1,
      patientId: 1,
      doctorId: 3,
      type: RecordType.VITAL_SIGNS,
      date: '2025-04-05T08:30:00Z',
      glucose: 180,
      bloodPressure: '140/90',
      heartRate: 78,
      temperature: 36.5,
      weight: 68,
      notes: 'Glucosa elevada',
      patientName: 'Ana Rodríguez'
    }
  ];

  const mockDoctors = [
    {
      id: 2,
      userId: 3,
      tenantId: null,
      isIndependent: true,
      firstName: 'Juan',
      lastName: 'Torres',
      dni: '11223344',
      specialty: 'Cardiología',
      licenseNumber: 'CMP-54321',
      phone: '+51 999 555 666',
      isVerified: true
    }
  ];

  beforeEach(async () => {
    mockRecordsStore = jasmine.createSpyObj('MedicalRecordsStore', [
      'loadRecordsByDoctor',
      'refresh',
      'clear'
    ], {
      records: signal(mockRecords),
      loading: signal(false),
      error: signal(null),
      vitalSignsRecords: signal(mockRecords),
      symptomsRecords: signal([]),
      consultationRecords: signal([]),
      totalRecords: signal(1)
    });

    mockDoctorApi = jasmine.createSpyObj('DoctorApiEndpoint', ['getAll']);
    mockDoctorApi.getAll.and.returnValue(of(mockDoctors));

    await TestBed.configureTestingModule({
      imports: [MedicalRecordsListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: MedicalRecordsStore, useValue: mockRecordsStore },
        { provide: DoctorApiEndpoint, useValue: mockDoctorApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicalRecordsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load doctor and records on init', () => {
    const mockUser = { id: 3, email: 'dr.juan@chronicaree.com', role: 'doctor' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));

    fixture.detectChanges();

    expect(mockDoctorApi.getAll).toHaveBeenCalled();
    expect(mockRecordsStore.loadRecordsByDoctor).toHaveBeenCalledWith(2);
  });

  it('should change selected tab', () => {
    expect(component.selectedTab()).toBe('all');
    
    component.setTab('vital_signs');
    expect(component.selectedTab()).toBe('vital_signs');
  });

  it('should return correct filtered records', () => {
    component.setTab('vital_signs');
    let filtered = component.getFilteredRecords();
    expect(filtered).toEqual(mockRecords);

    component.setTab('all');
    filtered = component.getFilteredRecords();
    expect(filtered).toEqual(mockRecords);
  });

  it('should format date correctly', () => {
    const formatted = component.formatDate('2025-04-05T08:30:00Z');
    expect(formatted).toContain('abril');
    expect(formatted).toContain('2025');
  });

  it('should return correct record type label', () => {
    expect(component.getRecordTypeLabel(RecordType.VITAL_SIGNS)).toBe('🩺 Signos Vitales');
    expect(component.getRecordTypeLabel(RecordType.SYMPTOMS)).toBe('🤒 Síntomas');
    expect(component.getRecordTypeLabel(RecordType.CONSULTATION)).toBe('👨‍⚕️ Consulta');
  });

  it('should refresh records list', () => {
    const mockUser = { id: 3, email: 'dr.juan@chronicaree.com', role: 'doctor' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));
    
    fixture.detectChanges();
    mockRecordsStore.refresh.calls.reset();
    
    component.refresh();
    
    expect(mockRecordsStore.refresh).toHaveBeenCalledWith(2);
  });

  it('should expose RecordType enum to template', () => {
    expect(component.RecordType).toBeDefined();
    expect(component.RecordType.VITAL_SIGNS).toBe('vital_signs');
  });
});
