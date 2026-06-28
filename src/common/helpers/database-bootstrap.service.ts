import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Admin } from '../../entities/admins.entity';

const BACKFILL_PHONE_BASE = 9000000000;

@Injectable()
export class DatabaseBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseBootstrapService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.backfillAdminPhoneNumbers();
  }

  private async backfillAdminPhoneNumbers(): Promise<void> {
    const adminsWithoutPhone = await this.adminRepository.find({
      where: { phoneNumber: IsNull() },
      order: { createdAt: 'ASC' },
    });

    if (adminsWithoutPhone.length === 0) {
      return;
    }

    const usedPhones = new Set(
      (
        await this.adminRepository.find({
          where: {},
          select: { phoneNumber: true },
        })
      )
        .map((admin) => admin.phoneNumber)
        .filter((phone): phone is string => phone !== null),
    );

    let nextPhone = BACKFILL_PHONE_BASE + 1;

    for (const admin of adminsWithoutPhone) {
      while (usedPhones.has(String(nextPhone))) {
        nextPhone += 1;
      }

      const phoneNumber = String(nextPhone);
      admin.phoneNumber = phoneNumber;
      await this.adminRepository.save(admin);
      usedPhones.add(phoneNumber);
      nextPhone += 1;

      this.logger.log(
        `Assigned placeholder phone ${phoneNumber} to admin ${admin.email}`,
      );
    }
  }
}