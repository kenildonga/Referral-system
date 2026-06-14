import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { I18nService } from '../../i18n/i18n.service';
import { HTTP_STATUS_ERROR_KEYS } from '../../i18n/messages';
import type { LocaleRequest } from '../../i18n/locale.interceptor';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<LocaleRequest>();
    const locale = request.locale;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = this.i18n.t(
      'common.internalServerError',
      undefined,
      locale,
    );
    let error: string | undefined = undefined;

    if (exception instanceof ZodValidationException) {
      statusCode = HttpStatus.BAD_REQUEST;
      error = this.i18n.t('http.badRequest', undefined, locale);
      const zodError = exception.getZodError() as ZodError;
      message = zodError.issues.map((issue) => {
        const translated = this.i18n.t(issue.message, undefined, locale);
        const path = issue.path.join('.');
        if (path) {
          const lowerMsg = translated.toLowerCase();
          const lowerPath = path.toLowerCase();
          if (lowerMsg.includes(lowerPath)) {
            return translated;
          }
          return `${path}: ${translated}`;
        }
        return translated;
      });
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseObj = exception.getResponse();

      if (typeof responseObj === 'string') {
        message = this.i18n.t(responseObj, undefined, locale);
      } else if (typeof responseObj === 'object' && responseObj !== null) {
        const res = responseObj as {
          message?: string | string[];
          error?: string;
        };
        if (res.message) {
          message = Array.isArray(res.message)
            ? res.message.map((item) => this.i18n.t(item, undefined, locale))
            : this.i18n.t(res.message, undefined, locale);
        }
        if (res.error) {
          error = this.i18n.t(res.error, undefined, locale);
        }
      }

      if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
        message = this.i18n.t('common.internalServerError', undefined, locale);
      }
    } else {
      const err = exception as Error;
      this.logger.error(err.message, err.stack);
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = this.i18n.t('common.internalServerError', undefined, locale);
    }

    if (
      statusCode !== HttpStatus.UNAUTHORIZED &&
      statusCode !== HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      if (!error) {
        const errorKey = HTTP_STATUS_ERROR_KEYS[statusCode] ?? 'http.error';
        error = this.i18n.t(errorKey, undefined, locale);
      }
    } else {
      error = undefined;
    }

    const responseBody: {
      message: string | string[];
      error?: string;
      statusCode: number;
    } = {
      message,
      ...(error ? { error } : {}),
      statusCode,
    };

    response.status(statusCode).json(responseBody);
  }
}
