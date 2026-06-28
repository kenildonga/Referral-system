import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { parseLocale } from './parse-locale';
import { localeStorage } from './locale.context';
import type { LocaleRequest } from '../types/i18n.types';

@Injectable()
export class LocaleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<LocaleRequest>();
    const locale = parseLocale(request.headers['accept-language']);
    request.locale = locale;

    return new Observable((subscriber) => {
      localeStorage.run(locale, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
