import { UUID } from '@/utils/types.js';

// Data the application needs to create an owner, independent of HTTP
export interface CreateOwnerCommand {
  name: string;
  phone: string;
  email: string;
  bankId: UUID;
}
