import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderContentComponent } from './header-content';

describe('HeaderContentComponent', () => {
  let component: HeaderContentComponent;
  let fixture: ComponentFixture<HeaderContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle notifications', () => {
    expect(component.showNotifications()).toBeFalse();
    component.toggleNotifications();
    expect(component.showNotifications()).toBeTrue();
  });

  it('should get unread count', () => {
    expect(component.getUnreadCount()).toBe(2);
  });
});
