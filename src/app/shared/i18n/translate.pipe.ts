import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { onLanguageChange, translate as i18nTranslate, currentLanguage } from './i18n';

@Pipe({
  name: 'translate',
  pure: false // impure so it runs when language changes
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private unsubscribe: (() => void) | null = null;
  private lastLang = currentLanguage();

  constructor(private cd: ChangeDetectorRef) {
    this.unsubscribe = onLanguageChange(() => {
      // mark for check so Angular will re-evaluate impure pipes
      this.cd.markForCheck();
    });
  }

  transform(key: string | null | undefined): string {
    if (!key) return '';
    try {
      return i18nTranslate(key);
    } catch (e) {
      return key as string;
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribe) this.unsubscribe();
  }
}
