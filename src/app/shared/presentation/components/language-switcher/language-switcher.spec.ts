import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSwitcherComponent } from './language-switcher';

describe('LanguageSwitcherComponent', () => {
  let component: LanguageSwitcherComponent;
  let fixture: ComponentFixture<LanguageSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have languages', () => {
    expect(component.languages.length).toBe(2);
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
