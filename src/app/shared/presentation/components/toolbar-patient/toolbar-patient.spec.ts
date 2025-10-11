import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ToolbarPatientComponent } from './toolbar-patient';
import { UserStore } from '../../../../iam/application/user.store';
import { NudgeStore } from '../../../../communication/application/nudge.store';
import { MedicationReminderFacade } from '../../../../medications/infrastructure/medication-reminder.facade';

describe('ToolbarPatientComponent', () => {
  let component: ToolbarPatientComponent;
  let fixture: ComponentFixture<ToolbarPatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarPatientComponent],
      providers: [
        UserStore,
        NudgeStore,
        MedicationReminderFacade,
        provideRouter([]),
        provideHttpClient(),
        provideAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarPatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have totalNotifications computed signal', () => {
    expect(component.totalNotifications).toBeDefined();
  });

  it('should have activeNudgesCount getter', () => {
    expect(component.activeNudgesCount).toBeDefined();
  });

  it('should have currentUser getter', () => {
    expect(component.currentUser).toBeDefined();
  });
});
