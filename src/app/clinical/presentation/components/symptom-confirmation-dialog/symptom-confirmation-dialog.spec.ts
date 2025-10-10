import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SymptomConfirmationDialogComponent } from './symptom-confirmation-dialog';

describe('SymptomConfirmationDialogComponent', () => {
  let component: SymptomConfirmationDialogComponent;
  let fixture: ComponentFixture<SymptomConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymptomConfirmationDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SymptomConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
