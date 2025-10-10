import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardPatient } from './dashboard-patient';
import { provideRouter } from '@angular/router';

describe('DashboardPatient', () => {
  let component: DashboardPatient;
  let fixture: ComponentFixture<DashboardPatient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPatient],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardPatient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
