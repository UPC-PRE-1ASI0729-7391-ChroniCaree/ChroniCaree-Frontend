import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HealthAlertsComponent } from './health-alerts';
import { AlertStore } from '../../../application/alert.store';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('HealthAlertsComponent', () => {
  let component: HealthAlertsComponent;
  let fixture: ComponentFixture<HealthAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthAlertsComponent],
      providers: [
        AlertStore,
        provideHttpClient(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HealthAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have stats', () => {
    expect(component.stats).toBeDefined();
  });
});
