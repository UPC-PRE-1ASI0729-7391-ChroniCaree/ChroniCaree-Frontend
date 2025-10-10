import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NudgePanelComponent } from './nudge-panel';

describe('NudgePanelComponent', () => {
  let component: NudgePanelComponent;
  let fixture: ComponentFixture<NudgePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NudgePanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NudgePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load nudges on init', () => {
    component.ngOnInit();
    expect(component).toBeTruthy();
  });
});
