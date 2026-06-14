import { DEFAULT_LOCALE, isSupportedLocale } from './locale.types';
import type { SupportedLocale } from './locale.types';

export function parseLocale(
  acceptLanguage?: string | string[],
): SupportedLocale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  const header = Array.isArray(acceptLanguage)
    ? acceptLanguage.join(',')
    : acceptLanguage;

  const tags = header
    .split(',')
    .map((part) => part.trim().split(';')[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const tag of tags) {
    const base = tag.split('-')[0];
    if (isSupportedLocale(base)) {
      return base;
    }
  }

  return DEFAULT_LOCALE;
}
