import type { UUID } from '@/utils/types.js';

// Data the application needs to create an owner, independent of HTTP.
// There is no initial balance: it only changes through rental payments.
export interface CreateOwnerCommand {
  name: string;
  phone: string;
  email: string;
  bankId: UUID;
  accountNumber: string;
  accountType: string;
}
