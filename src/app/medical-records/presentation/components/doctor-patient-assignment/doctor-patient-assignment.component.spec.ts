import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoctorPatientAssignmentComponent } from './doctor-patient-assignment.component';

describe('DoctorPatientAssignmentComponent', () => {
  let component: DoctorPatientAssignmentComponent;
  let fixture: ComponentFixture<DoctorPatientAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorPatientAssignmentComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorPatientAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the assignment view title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Vinculación Doctor-Paciente');
  });

  it('should show coming soon message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.coming-soon p')?.textContent).toContain('Funcionalidad en desarrollo');
  });
});
