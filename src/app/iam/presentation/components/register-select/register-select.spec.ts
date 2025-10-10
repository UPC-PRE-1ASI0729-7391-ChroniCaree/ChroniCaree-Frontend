import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegisterSelectComponent } from './register-select';

describe('RegisterSelectComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterSelectComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RegisterSelectComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have null hovered card initially', () => {
    const fixture = TestBed.createComponent(RegisterSelectComponent);
    const component = fixture.componentInstance;
    expect(component['hoveredCard']()).toBeNull();
  });
});
