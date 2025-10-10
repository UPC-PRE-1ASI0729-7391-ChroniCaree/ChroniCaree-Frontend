import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  readonly currentLanguage = signal<Language>(this.languages[0]);
  readonly showDropdown = signal(false);

  toggleDropdown(): void {
    this.showDropdown.update(v => !v);
  }

  selectLanguage(language: Language): void {
    this.currentLanguage.set(language);
    this.showDropdown.set(false);
    // Aquí puedes implementar la lógica para cambiar el idioma de la aplicación
    console.log('Idioma cambiado a:', language.code);
  }
}
