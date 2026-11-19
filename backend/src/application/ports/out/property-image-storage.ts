import type { UUID } from '@/utils/types.js';

export const PROPERTY_IMAGE_STORAGE = Symbol('PropertyImageStorage');

// Keeps the bytes of the property images. The database only has the
// PropertyImage metadata (file name and position)
export interface PropertyImageStorage {
  save(propertyId: UUID, fileName: string, content: Uint8Array): Promise<void>;
  // Does nothing when the file does not exist
  delete(propertyId: UUID, fileName: string): Promise<void>;
  // Every image of the property; used when the property is deleted
  deleteAll(propertyId: UUID): Promise<void>;
}
