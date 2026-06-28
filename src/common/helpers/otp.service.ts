import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PhoneRegistrationOtp } from '../../entities/phone-registration-otp.entity';
import { OtpPurpose } from '../../entities/enum';

const TEMP_OTP = '1111';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(PhoneRegistrationOtp)
    private readonly phoneOtpRepository: Repository<PhoneRegistrationOtp>,
  ) {}

  generateOtp(): string {
    return TEMP_OTP;
  }

  getOtpExpiryMinutes(): number {
    return parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10);
  }

  getMaxAttempts(): number {
    return parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
  }

  async issuePhoneOtp(
    phoneNumber: string,
    purpose: OtpPurpose = OtpPurpose.REGISTRATION,
  ): Promise<void> {
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(
      Date.now() + this.getOtpExpiryMinutes() * 60 * 1000,
    );

    const existingOtp = await this.phoneOtpRepository.findOne({
      where: { phoneNumber, purpose, usedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    if (existingOtp) {
      existingOtp.otpHash = otpHash;
      existingOtp.expiresAt = expiresAt;
      existingOtp.attempts = 0;
      await this.phoneOtpRepository.save(existingOtp);
      return;
    }

    const otpRecord = this.phoneOtpRepository.create({
      phoneNumber,
      purpose,
      otpHash,
      expiresAt,
      attempts: 0,
      usedAt: null,
    });
    await this.phoneOtpRepository.save(otpRecord);
  }

  async verifyPhoneOtp(
    phoneNumber: string,
    otp: string,
    purpose: OtpPurpose = OtpPurpose.REGISTRATION,
  ): Promise<void> {
    const otpRecord = await this.phoneOtpRepository.findOne({
      where: { phoneNumber, purpose, usedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('otp.invalidOrExpired');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('otp.invalidOrExpired');
    }

    if (otpRecord.attempts >= this.getMaxAttempts()) {
      throw new BadRequestException('otp.maxAttemptsExceeded');
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isOtpValid) {
      otpRecord.attempts += 1;
      await this.phoneOtpRepository.save(otpRecord);
      throw new BadRequestException('otp.invalidOrExpired');
    }

    otpRecord.usedAt = new Date();
    await this.phoneOtpRepository.save(otpRecord);
  }
}