import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css'
})
export class LanguageSwitcherComponent {
  readonly languages: Language[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];
  // track both currently selected language code and the Language object for template
  public currentLanguage: Language = this.languages[0];
  public showDropdown = false;

  private translate = inject(TranslateService);

  constructor() {
    const code = (this.translate.currentLang as string) || this.translate.getBrowserLang() || this.languages[0].code;
    const found = this.languages.find(l => l.code === code);
    if (found) this.currentLanguage = found;
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  selectLanguage(language: Language): void {
    this.translate.use(language.code);
    this.currentLanguage = language;
    this.showDropdown = false;
    try { localStorage.setItem('locale', language.code); } catch { /* ignore */ }
  }
}
