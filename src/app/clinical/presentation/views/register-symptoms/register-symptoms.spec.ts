import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterSymptomsComponent } from './register-symptoms';

describe('RegisterSymptomsComponent', () => {
  let component: RegisterSymptomsComponent;
  let fixture: ComponentFixture<RegisterSymptomsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterSymptomsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterSymptomsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
