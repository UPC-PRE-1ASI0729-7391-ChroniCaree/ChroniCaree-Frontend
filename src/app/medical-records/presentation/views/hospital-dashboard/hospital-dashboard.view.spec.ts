import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HospitalDashboardView } from './hospital-dashboard.view';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';
import { signal } from '@angular/core';

describe('HospitalDashboardView', () => {
  let component: HospitalDashboardView;
  let fixture: ComponentFixture<HospitalDashboardView>;
  let mockStore: jasmine.SpyObj<HospitalDashboardStore>;

  beforeEach(async () => {
    mockStore = jasmine.createSpyObj('HospitalDashboardStore', ['loadDashboardStats'], {
      stats: signal(null),
      doctors: signal([]),
      loading: signal(false),
      error: signal(null),
      canAddMoreDoctors: signal(true)
    });

    await TestBed.configureTestingModule({
      imports: [HospitalDashboardView],
      providers: [
        { provide: HospitalDashboardStore, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalDashboardView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard on init', () => {
    component.ngOnInit();
    expect(mockStore.loadDashboardStats).toHaveBeenCalled();
  });

  it('should select tab correctly', () => {
    component.selectTab('patients');
    expect(component.activeTab()).toBe('patients');
  });

  it('should refresh data', () => {
    component.refreshData();
    expect(mockStore.loadDashboardStats).toHaveBeenCalled();
  });

  it('should return correct status color', () => {
    expect(component.getStatusColor('active')).toBe('text-green-600 bg-green-100');
    expect(component.getStatusColor('pending_subscription')).toBe('text-yellow-600 bg-yellow-100');
    expect(component.getStatusColor('suspended')).toBe('text-red-600 bg-red-100');
  });

  it('should return correct status text', () => {
    expect(component.getStatusText('active')).toBe('Activo');
    expect(component.getStatusText('pending_subscription')).toBe('Pendiente de Suscripción');
    expect(component.getStatusText('suspended')).toBe('Suspendido');
  });

  it('should return correct plan badge color', () => {
    expect(component.getPlanBadgeColor('Enterprise')).toBe('bg-purple-600 text-white');
    expect(component.getPlanBadgeColor('Professional')).toBe('bg-blue-600 text-white');
    expect(component.getPlanBadgeColor('Basic')).toBe('bg-green-600 text-white');
  });
});
