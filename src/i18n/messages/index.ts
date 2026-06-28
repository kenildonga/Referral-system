import { enMessages } from './en';
import { hiMessages } from './hi';
import { guMessages } from './gu';
import type { MessageTree, SupportedLocale } from '../../types/i18n.types';

function flattenMessages(
  tree: MessageTree,
  prefix = '',
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(tree)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else {
      Object.assign(result, flattenMessages(value, fullKey));
    }
  }

  return result;
}

export const messageCatalogs: Record<
  SupportedLocale,
  Record<string, string>
> = {
  en: flattenMessages(enMessages),
  hi: flattenMessages(hiMessages),
  gu: flattenMessages(guMessages),
};

export const HTTP_STATUS_ERROR_KEYS: Record<number, string> = {
  400: 'http.badRequest',
  402: 'http.paymentRequired',
  403: 'http.forbidden',
  404: 'http.notFound',
  405: 'http.methodNotAllowed',
  406: 'http.notAcceptable',
  407: 'http.proxyAuthRequired',
  408: 'http.requestTimeout',
  409: 'http.conflict',
  410: 'http.gone',
  411: 'http.lengthRequired',
  412: 'http.preconditionFailed',
  413: 'http.payloadTooLarge',
  414: 'http.uriTooLong',
  415: 'http.unsupportedMediaType',
  416: 'http.rangeNotSatisfiable',
  417: 'http.expectationFailed',
  418: 'http.imATeapot',
  421: 'http.misdirectedRequest',
  422: 'http.unprocessableEntity',
  423: 'http.locked',
  424: 'http.failedDependency',
  425: 'http.tooEarly',
  426: 'http.upgradeRequired',
  428: 'http.preconditionRequired',
  429: 'http.tooManyRequests',
  431: 'http.requestHeaderFieldsTooLarge',
  451: 'http.unavailableForLegalReasons',
};
