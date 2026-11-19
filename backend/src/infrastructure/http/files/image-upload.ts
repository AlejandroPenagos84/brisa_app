import { BadRequestException } from '@nestjs/common';
import type { PropertyImageFormat } from '@/application/commands/add-property-image.command.js';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// The part of the Multer file the controller uses (memory storage)
export interface UploadedImageFile {
  buffer: Buffer;
  size: number;
}

function startsWith(bytes: Buffer, signature: number[], offset = 0): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

// Reads the format from the first bytes (magic numbers). The file name and
// the Content-Type come from the client and are not trusted
export function detectImageFormat(bytes: Buffer): PropertyImageFormat | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'png';
  }
  // RIFF....WEBP
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'webp';
  }
  return null;
}

export function requireImage(
  file: UploadedImageFile | undefined,
): { format: PropertyImageFormat; content: Buffer } {
  if (!file || file.size === 0) {
    throw new BadRequestException('The image file is required (field "file")');
  }

  const format = detectImageFormat(file.buffer);
  if (!format) {
    throw new BadRequestException('Only JPEG, PNG or WebP images are allowed');
  }

  return { format, content: file.buffer };
}
