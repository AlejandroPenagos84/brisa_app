import type { UUID } from '@/utils/types.js';

// Detected from the file content by the infrastructure, never from the
// name or the Content-Type sent by the client
export type PropertyImageFormat = 'jpg' | 'png' | 'webp';

export interface AddPropertyImageCommand {
  ownerId: UUID;
  propertyId: UUID;
  format: PropertyImageFormat;
  content: Uint8Array;
}
