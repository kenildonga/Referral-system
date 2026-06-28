import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminService } from './services/admin.service';
import { AdminRole } from './entities/enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  try {
    console.log('Seeding admin database...');
    const superAdminEmail = 'superadmin@test.com';
    const superAdminPassword = 'superpassword123';

    await adminService.create({
      name: 'Super Admin',
      email: superAdminEmail,
      phoneNumber: '9000000001',
      password: superAdminPassword,
      role: AdminRole.SUPER_ADMIN,
    });

    console.log(
      `Seeding completed. Super admin created with email: ${superAdminEmail}`,
    );
  } catch (error: any) {
    if (error.status === 409 || error.message?.includes('already exists')) {
      console.log('Super admin already exists.');
    } else {
      console.error('Seeding failed:', error);
    }
  } finally {
    await app.close();
  }
}

bootstrap();
