import { AsyncLocalStorage } from 'async_hooks';
import { DEFAULT_LOCALE } from './locale.types';
import type { SupportedLocale } from './locale.types';

export const localeStorage = new AsyncLocalStorage<SupportedLocale>();

export function getCurrentLocale(): SupportedLocale {
  return localeStorage.getStore() ?? DEFAULT_LOCALE;
}
