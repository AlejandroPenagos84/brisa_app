import type { UUID } from '@/utils/types.js';

export interface UpdateClientCommand {
  name?: string;
  phone?: string;
  email?: string;
  cityId?: UUID;
  bankId?: UUID;
  accountNumber?: string;
  accountType?: string;
}
