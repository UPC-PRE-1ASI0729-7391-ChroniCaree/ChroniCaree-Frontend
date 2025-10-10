import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolbarContentComponent } from './toolbar-content';

describe('ToolbarContentComponent', () => {
  let component: ToolbarContentComponent;
  let fixture: ComponentFixture<ToolbarContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolbarContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle sidebar', () => {
    expect(component.isCollapsed).toBeFalse();
    component.toggleSidebar();
    expect(component.isCollapsed).toBeTrue();
  });

  it('should have menu items', () => {
    expect(component.menuItems.length).toBeGreaterThan(0);
  });
});
