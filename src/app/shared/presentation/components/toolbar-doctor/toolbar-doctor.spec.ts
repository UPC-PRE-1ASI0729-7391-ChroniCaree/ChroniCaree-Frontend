import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ToolbarDoctorComponent } from './toolbar-doctor';
import { UserStore } from '../../../../iam/application/user.store';

describe('ToolbarDoctorComponent', () => {
  let component: ToolbarDoctorComponent;
  let fixture: ComponentFixture<ToolbarDoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarDoctorComponent],
      providers: [
        UserStore,
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarDoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have currentUser getter', () => {
    expect(component.currentUser).toBeDefined();
  });
});
