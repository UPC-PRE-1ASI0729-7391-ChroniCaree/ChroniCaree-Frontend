import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RequestPatientModalComponent } from './request-patient-modal';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';

describe('RequestPatientModalComponent', () => {
  let component: RequestPatientModalComponent;
  let fixture: ComponentFixture<RequestPatientModalComponent>;
  let httpMock: HttpTestingController;

  const mockAvailablePatients = [
    {
      id: 2,
      userId: 4,
      assignedDoctorId: null,
      firstName: 'Pedro',
      lastName: 'Gómez',
      dni: '87654321',
      birthDate: '1990-03-20',
      gender: 'male',
      phone: '+51 999 222 333',
      subscriptionId: 2
    },
    {
      id: 3,
      userId: 5,
      assignedDoctorId: null,
      firstName: 'María',
      lastName: 'Sánchez',
      dni: '11223344',
      birthDate: '1985-07-10',
      gender: 'female',
      phone: '+51 999 444 555',
      subscriptionId: null
    }
  ];

  const mockAllPatients = [
    ...mockAvailablePatients,
    {
      id: 1,
      userId: 1,
      assignedDoctorId: 2,
      firstName: 'Ana',
      lastName: 'Rodríguez',
      dni: '12345678',
      birthDate: '1980-05-15',
      gender: 'female',
      phone: '+51 999 111 222',
      subscriptionId: 1
    }
  ];

  const mockDoctors = [
    {
      id: 2,
      userId: 3,
      firstName: 'Juan',
      lastName: 'Torres',
      specialty: 'Cardiología',
      licenseNumber: 'CMP-54321'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestPatientModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RequestPatientModalComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load available patients on init', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/patients`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAllPatients);

    expect(component.availablePatients().length).toBe(2);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe(null);
  });

  it('should filter out patients with assigned doctors', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/patients`);
    req.flush(mockAllPatients);

    const available = component.availablePatients();
    expect(available.every(p => !p.id || p.id !== 1)).toBe(true);
  });

  it('should handle error when loading patients', () => {
    spyOn(console, 'error');
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/patients`);
    req.error(new ProgressEvent('Network error'));

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Error al cargar pacientes disponibles');
    expect(console.error).toHaveBeenCalled();
  });

  it('should select a patient', () => {
    component.selectPatient(2);
    expect(component.selectedPatientId()).toBe(2);
  });

  it('should compute selected patient', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/patients`);
    req.flush(mockAllPatients);

    component.selectPatient(2);
    
    const selected = component.selectedPatient();
    expect(selected).toBeTruthy();
    expect(selected?.firstName).toBe('Pedro');
  });

  it('should calculate age correctly', () => {
    const age = component.calculateAge('1990-03-20');
    expect(age).toBeGreaterThan(30);
    expect(age).toBeLessThan(40);
  });

  it('should request patient assignment successfully', () => {
    // Setup
    const mockUser = { id: 3, email: 'dr.juan@chronicaree.com', role: 'doctor' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));
    spyOn(window, 'dispatchEvent');
    
    fixture.detectChanges();
    const loadReq = httpMock.expectOne(`${environment.apiBaseUrl}/patients`);
    loadReq.flush(mockAllPatients);

    component.selectPatient(2);
    component.requestPatient();

    // Expect doctor lookup
    const doctorReq = httpMock.expectOne(`${environment.apiBaseUrl}/doctors`);
    expect(doctorReq.request.method).toBe('GET');
    doctorReq.flush(mockDoctors);

    // Expect patient update
    const patchReq = httpMock.expectOne(`${environment.apiBaseUrl}/patients/2`);
    expect(patchReq.request.method).toBe('PATCH');
    expect(patchReq.request.body).toEqual({ assignedDoctorId: 2 });
    patchReq.flush({});

    expect(component.requesting()).toBe(false);
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: 'patient-assigned' })
    );
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: 'close-modal' })
    );
  });

  it('should not request without selected patient', () => {
    component.requestPatient();
    
    httpMock.expectNone(`${environment.apiBaseUrl}/doctors`);
    expect(component.requesting()).toBe(false);
  });

  it('should handle missing user in localStorage on request', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(window, 'alert');
    
    component.selectPatient(2);
    component.requestPatient();

    expect(window.alert).toHaveBeenCalledWith('Error: No se encontró usuario autenticado');
    expect(component.requesting()).toBe(false);
  });

  it('should handle doctor not found on request', () => {
    const mockUser = { id: 999, email: 'unknown@test.com', role: 'doctor' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));
    spyOn(window, 'alert');
    
    fixture.detectChanges();
    const loadReq = httpMock.expectOne(`${environment.apiBaseUrl}/patients`);
    loadReq.flush(mockAllPatients);

    component.selectPatient(2);
    component.requestPatient();

    const doctorReq = httpMock.expectOne(`${environment.apiBaseUrl}/doctors`);
    doctorReq.flush(mockDoctors);

    expect(window.alert).toHaveBeenCalledWith('Error: No se encontró perfil de doctor');
    expect(component.requesting()).toBe(false);
  });

  it('should handle error during patient assignment', () => {
    const mockUser = { id: 3, email: 'dr.juan@chronicaree.com', role: 'doctor' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));
    spyOn(window, 'alert');
    spyOn(console, 'error');
    
    fixture.detectChanges();
    const loadReq = httpMock.expectOne(`${environment.apiBaseUrl}/patients`);
    loadReq.flush(mockAllPatients);

    component.selectPatient(2);
    component.requestPatient();

    const doctorReq = httpMock.expectOne(`${environment.apiBaseUrl}/doctors`);
    doctorReq.flush(mockDoctors);

    const patchReq = httpMock.expectOne(`${environment.apiBaseUrl}/patients/2`);
    patchReq.error(new ProgressEvent('Network error'));

    expect(console.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Error al asignar paciente. Intenta de nuevo.');
    expect(component.requesting()).toBe(false);
  });

  it('should handle error fetching doctors on request', () => {
    const mockUser = { id: 3, email: 'dr.juan@chronicaree.com', role: 'doctor' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));
    spyOn(window, 'alert');
    spyOn(console, 'error');
    
    fixture.detectChanges();
    const loadReq = httpMock.expectOne(`${environment.apiBaseUrl}/patients`);
    loadReq.flush(mockAllPatients);

    component.selectPatient(2);
    component.requestPatient();

    const doctorReq = httpMock.expectOne(`${environment.apiBaseUrl}/doctors`);
    doctorReq.error(new ProgressEvent('Network error'));

    expect(console.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Error al obtener información del doctor');
    expect(component.requesting()).toBe(false);
  });

  it('should close modal and dispatch event', () => {
    spyOn(window, 'dispatchEvent');
    
    component.close();
    
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: 'close-modal' })
    );
  });

  it('should map patients with subscription status', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/patients`);
    req.flush(mockAvailablePatients);

    const patients = component.availablePatients();
    expect(patients[0].hasActiveSubscription).toBe(true);
    expect(patients[1].hasActiveSubscription).toBe(false);
  });
});
