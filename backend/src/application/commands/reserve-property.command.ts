import type { UUID } from '@/utils/types.js';

// Calendar days at UTC midnight
export interface ReservePropertyCommand {
  propertyId: UUID;
  clientId: UUID;
  startDate: Date;
  endDate: Date;
}
