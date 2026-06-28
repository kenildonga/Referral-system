import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admins.entity';
import { Agent } from './entities/agents.entity';
import { User } from './entities/users.entity';
import { State } from './entities/states.entity';
import { City } from './entities/cities.entity';
import { Form } from './entities/forms.entity';
import { FormResponse } from './entities/form-responses.entity';
import { PhoneRegistrationOtp } from './entities/phone-registration-otp.entity';
import { BankDetails } from './entities/bank-details.entity';
import { Chain } from './entities/chains.entity';
import { ChainReferral } from './entities/chain-referrals.entity';
import { AdminController } from './controllers/admin.controller';
import { ChainController } from './controllers/chain.controller';
import { AgentController } from './controllers/agent.controller';
import { FormController } from './controllers/form.controller';
import { UserController } from './controllers/user.controller';
import { IndexController } from './controllers/index.controller';
import { AdminService } from './services/admin.service';
import { AgentService } from './services/agent.service';
import { FormService } from './services/form.service';
import { UserService } from './services/user.service';
import { IndexService } from './services/index.service';
import { ChainService } from './services/chain.service';
import { BankDetailsService } from './services/bank-details.service';
import { I18nModule } from './i18n/i18n.module';
import { CommonModule } from './common/common.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    I18nModule,
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        autoLoadEntities: true,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.DB_SYNCHRONIZE === 'true',
        ssl:
          process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    TypeOrmModule.forFeature([
      Admin,
      Agent,
      User,
      State,
      City,
      PhoneRegistrationOtp,
      BankDetails,
      Form,
      FormResponse,
      Chain,
      ChainReferral,
    ]),
  ],
  controllers: [
    AdminController,
    AgentController,
    FormController,
    UserController,
    IndexController,
    ChainController,
  ],
  providers: [
    AdminService,
    AgentService,
    FormService,
    UserService,
    IndexService,
    ChainService,
    BankDetailsService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
