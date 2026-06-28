import type { SupportedLocale } from '../types/i18n.types';

export const SUPPORTED_LOCALES = ['en', 'hi', 'gu'] as const;

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
