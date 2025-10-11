import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NudgesPageComponent } from './nudges-page';
import { NudgeStore } from '../../../application/nudge.store';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('NudgesPageComponent', () => {
  let component: NudgesPageComponent;
  let fixture: ComponentFixture<NudgesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NudgesPageComponent],
      providers: [
        NudgeStore,
        provideHttpClient(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NudgesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have activeCount', () => {
    expect(component.activeCount).toBeDefined();
  });

  it('should have loading', () => {
    expect(component.loading).toBeDefined();
  });
});
