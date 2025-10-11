import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertPanelComponent } from './alert-panel';
import { AlertStore } from '../../../application/alert.store';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

describe('AlertPanelComponent', () => {
  let component: AlertPanelComponent;
  let fixture: ComponentFixture<AlertPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertPanelComponent],
      providers: [
        AlertStore,
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default maxItems', () => {
    expect(component.maxItems).toBe(3);
  });

  it('should calculate top alerts', () => {
    expect(component.topAlerts()).toBeDefined();
  });

  it('should calculate hasMoreAlerts', () => {
    expect(component.hasMoreAlerts()).toBeDefined();
  });
});
