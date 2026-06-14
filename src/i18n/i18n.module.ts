import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { I18nService } from './i18n.service';
import { LocaleInterceptor } from './locale.interceptor';

@Global()
@Module({
  providers: [
    I18nService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LocaleInterceptor,
    },
  ],
  exports: [I18nService],
})
export class I18nModule {}
