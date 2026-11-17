import type { UUID } from '@/utils/types.js';

export interface UpdateAdministratorCommand {
  name?: string;
  phone?: string;
  email?: string;
  bankId?: UUID;
  accountNumber?: string;
  accountType?: string;
}
