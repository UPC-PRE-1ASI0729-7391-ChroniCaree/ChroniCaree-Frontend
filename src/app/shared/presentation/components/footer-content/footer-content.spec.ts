import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterContentComponent } from './footer-content';

describe('FooterContentComponent', () => {
  let component: FooterContentComponent;
  let fixture: ComponentFixture<FooterContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have current year', () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });

  it('should have links sections', () => {
    expect(component.links.company.length).toBeGreaterThan(0);
    expect(component.links.support.length).toBeGreaterThan(0);
    expect(component.links.legal.length).toBeGreaterThan(0);
  });
});
