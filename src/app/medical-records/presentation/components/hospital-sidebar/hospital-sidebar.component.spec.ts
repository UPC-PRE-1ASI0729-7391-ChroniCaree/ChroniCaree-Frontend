import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { HospitalSidebarComponent } from './hospital-sidebar.component';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';

describe('HospitalSidebarComponent', () => {
  let component: HospitalSidebarComponent;
  let fixture: ComponentFixture<HospitalSidebarComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockStore: jasmine.SpyObj<HospitalDashboardStore>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      url: '/hospital/dashboard'
    });

    mockStore = jasmine.createSpyObj('HospitalDashboardStore', [], {
      hospitalName: signal('Hospital Test'),
      dashboardStats: signal({
        doctorsCount: 5,
        patientsCount: 20,
        invitationsCount: 2,
        availableSlots: 3
      })
    });

    await TestBed.configureTestingModule({
      imports: [HospitalSidebarComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: HospitalDashboardStore, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle sidebar', () => {
    expect(component.isCollapsed()).toBe(false);
    component.toggleSidebar();
    expect(component.isCollapsed()).toBe(true);
    component.toggleSidebar();
    expect(component.isCollapsed()).toBe(false);
  });

  it('should navigate to menu item', () => {
    const menuItem = component.menuItems[0];
    component.navigateTo(menuItem);
    expect(mockRouter.navigate).toHaveBeenCalledWith([menuItem.route]);
    expect(component.activeRoute()).toBe(menuItem.id);
  });

  it('should check if route is active', () => {
    component.activeRoute.set('dashboard');
    expect(component.isActive('dashboard')).toBe(true);
    expect(component.isActive('patients')).toBe(false);
  });

  it('should get badge value from store', () => {
    expect(component.getBadgeValue('doctors')).toBe('5');
    expect(component.getBadgeValue('patients')).toBe('20');
    expect(component.getBadgeValue('unknown')).toBeUndefined();
  });

  it('should logout and navigate to login', () => {
    spyOn(localStorage, 'removeItem');
    component.logout();
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/iam/login']);
  });

  it('should have correct menu items', () => {
    expect(component.menuItems.length).toBeGreaterThan(0);
    expect(component.menuItems[0].label).toBe('Dashboard');
    expect(component.menuItems[0].icon).toBe('dashboard');
  });

  it('should have settings items', () => {
    expect(component.settingsItems.length).toBeGreaterThan(0);
    expect(component.settingsItems[0].label).toBe('Configuración');
  });
});
