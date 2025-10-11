import { DoctorsPatientDetailComponent } from './patient-detail';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

describe('DoctorsPatientDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])
      ],
      imports: [DoctorsPatientDetailComponent]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DoctorsPatientDetailComponent as any);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
