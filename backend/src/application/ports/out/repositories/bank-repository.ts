import { Bank } from '@/domain/bank.js';
import { UUID } from '@/utils/types.js';

export const BANK_REPOSITORY = Symbol('BankRepository');

export interface BankRepository {
  findAll(): Promise<Bank[]>;
  findByIds(ids: UUID[]): Promise<Bank[]>;
  findById(id: UUID): Promise<Bank | null>;
}
