import type { UUID } from '@/utils/types.js';

export interface UpdateOwnerCommand {
  name?: string;
  phone?: string;
  email?: string;
  bankId?: UUID;
}
