import type { UUID } from '@/utils/types.js';

export interface CreateClientCommand {
  name: string;
  phone: string;
  email: string;
  cityId: UUID;
  bankId: UUID;
  accountNumber: string;
  accountType: string;
  balance: number;
}
