import type { PropertyStatus } from '@/domain/property.js';

export interface UpdatePropertyCommand {
  address?: string;
  area?: number;
  numberOfRooms?: number;
  capacity?: number;
  price?: number;
  status?: PropertyStatus;
}