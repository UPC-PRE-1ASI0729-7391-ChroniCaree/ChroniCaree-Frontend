import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSwitcherContentComponent } from './language-switcher-content';

describe('LanguageSwitcherContentComponent', () => {
  let component: LanguageSwitcherContentComponent;
  let fixture: ComponentFixture<LanguageSwitcherContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcherContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have languages', () => {
    expect(component.languages.length).toBe(3);
  });

  it('should toggle dropdown', () => {
    expect(component.showDropdown()).toBeFalse();
    component.toggleDropdown();
    expect(component.showDropdown()).toBeTrue();
  });

  it('should select language', () => {
    const newLanguage = component.languages[1];
    component.selectLanguage(newLanguage);
    expect(component.currentLanguage().code).toBe(newLanguage.code);
    expect(component.showDropdown()).toBeFalse();
  });
});
