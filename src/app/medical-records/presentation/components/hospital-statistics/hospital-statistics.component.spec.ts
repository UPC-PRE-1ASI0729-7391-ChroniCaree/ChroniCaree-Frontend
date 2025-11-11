import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HospitalStatisticsComponent } from './hospital-statistics.component';

describe('HospitalStatisticsComponent', () => {
  let component: HospitalStatisticsComponent;
  let fixture: ComponentFixture<HospitalStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospitalStatisticsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the statistics view title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Estadísticas del Hospital');
  });

  it('should show coming soon message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.coming-soon p')?.textContent).toContain('Funcionalidad en desarrollo');
  });
});
