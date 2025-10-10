import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicalDiagnosesComponent } from './medical-diagnoses';

describe('MedicalDiagnosesComponent', () => {
  let component: MedicalDiagnosesComponent;
  let fixture: ComponentFixture<MedicalDiagnosesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalDiagnosesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalDiagnosesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
