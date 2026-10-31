import { Bank } from '@/domain/bank.js';
import { UUID } from '@/utils/types.js';

export interface BankRepository {
  findAll(): Promise<Bank[]>;
  findById(id: UUID): Promise<Bank | null>;
}
