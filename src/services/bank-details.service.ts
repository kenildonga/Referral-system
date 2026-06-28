import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankDetails } from '../entities/bank-details.entity';
import { BankHolderType } from '../entities/enum';
import type { CreateBankDetailsInput } from '../types/bank.types';

@Injectable()
export class BankDetailsService {
  constructor(
    @InjectRepository(BankDetails)
    private readonly bankDetailsRepository: Repository<BankDetails>,
  ) {}

  async createForHolder(
    holderId: string,
    userType: BankHolderType,
    input: CreateBankDetailsInput,
  ): Promise<BankDetails> {
    const record = this.bankDetailsRepository.create({
      holderId,
      userType,
      accountHolderName: input.accountHolderName,
      accountNumber: input.accountNumber,
      ifscCode: input.ifscCode.toUpperCase(),
    });
    return this.bankDetailsRepository.save(record);
  }
}
