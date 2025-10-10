import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditProfileDoctorComponent } from './edit-profile';

describe('EditProfileDoctorComponent', () => {
  let component: EditProfileDoctorComponent;
  let fixture: ComponentFixture<EditProfileDoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProfileDoctorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProfileDoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
