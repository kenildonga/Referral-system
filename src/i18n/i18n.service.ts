import { Injectable } from '@nestjs/common';
import { getCurrentLocale } from './locale.context';
import { messageCatalogs } from './messages';
import { DEFAULT_LOCALE } from './locale.types';
import type { SupportedLocale } from '../types/i18n.types';

@Injectable()
export class I18nService {
  t(
    key: string,
    params?: Record<string, string | number>,
    locale?: SupportedLocale,
  ): string {
    const resolvedLocale = locale ?? getCurrentLocale();
    let message =
      messageCatalogs[resolvedLocale]?.[key] ??
      messageCatalogs[DEFAULT_LOCALE][key] ??
      key;

    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        message = message.replaceAll(`{{${paramKey}}}`, String(paramValue));
      }
    }

    return message;
  }
}
