import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutContentComponent } from './layout-content';
import { provideRouter } from '@angular/router';

describe('LayoutContentComponent', () => {
  let component: LayoutContentComponent;
  let fixture: ComponentFixture<LayoutContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutContentComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
