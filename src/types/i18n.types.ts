import type { Request } from 'express';
import { SUPPORTED_LOCALES } from '../i18n/locale.types';

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type MessageTree = {
  [key: string]: string | MessageTree;
};

export interface LocaleRequest extends Request {
  locale?: SupportedLocale;
}