import { signal, WritableSignal } from '@angular/core';

type Translations = Record<string, any>;

const DEFAULT_LANG = 'en';

// current language signal
export const currentLanguage: WritableSignal<string> = signal(localStorage.getItem('locale') || DEFAULT_LANG);

// in-memory cache for loaded translation objects
const cache: Record<string, Translations | null> = {};

// simple subscribers list for change notifications
const listeners: Set<() => void> = new Set();

export function onLanguageChange(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

async function loadTranslations(lang: string): Promise<Translations> {
  if (cache[lang]) return cache[lang] as Translations;

  try {
    const res = await fetch(`/i18n/${lang}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load /i18n/${lang}.json`);
    const json = await res.json();
    cache[lang] = json;
    return json;
  } catch (e) {
    console.warn('i18n: load failed for', lang, e);
    cache[lang] = {};
    return {};
  }
}

/**
 * Set the current language and preload translations.
 */
export async function setLanguage(lang: string) {
  if (!lang) return;
  localStorage.setItem('locale', lang);
  currentLanguage.set(lang);
  // preload
  await loadTranslations(lang);
  // notify listeners
  listeners.forEach((cb) => cb());
}

/**
 * Translate a dot-separated key using the loaded translation object for currentLanguage.
 * If translation not found, returns the key itself.
 */
export function translate(key: string): string {
  const lang = currentLanguage();
  const translations = cache[lang] || null;
  if (!translations) return key;

  const parts = key.split('.');
  let cur: any = translations;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = cur[p];
    } else {
      return key;
    }
  }
  return typeof cur === 'string' ? cur : key;
}

// Ensure default language is loaded at startup (fire-and-forget)
loadTranslations(currentLanguage()).catch(() => {});

export default {
  currentLanguage,
  setLanguage,
  translate,
  onLanguageChange,
};
