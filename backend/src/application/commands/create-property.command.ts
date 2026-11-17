import type { UUID } from '@/utils/types.js';

export interface CreatePropertyCommand {
  ownerId: UUID;
  cityId: UUID;
  address: string;
  area: number;
  numberOfRooms: number;
  capacity: number;
  price: number;
}
