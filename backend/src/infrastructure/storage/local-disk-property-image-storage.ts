import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import type { PropertyImageStorage } from '@/application/ports/out/property-image-storage.js';
import type { UUID } from '@/utils/types.js';

// Folder served by the API as /uploads. UPLOADS_DIR can change it
export const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? 'uploads');

// Layout: {UPLOADS_DIR}/properties/{propertyId}/{fileName}
export class LocalDiskPropertyImageStorage implements PropertyImageStorage {
  constructor(private readonly rootDir: string = UPLOADS_DIR) {}

  async save(propertyId: UUID, fileName: string, content: Uint8Array): Promise<void> {
    const folder = this.folderOf(propertyId);
    await mkdir(folder, { recursive: true });
    // 'wx': fails instead of overwriting an existing image
    await writeFile(join(folder, this.safeName(fileName)), content, { flag: 'wx' });
  }

  async delete(propertyId: UUID, fileName: string): Promise<void> {
    await rm(join(this.folderOf(propertyId), this.safeName(fileName)), { force: true });
  }

  async deleteAll(propertyId: UUID): Promise<void> {
    await rm(this.folderOf(propertyId), { recursive: true, force: true });
  }

  // The domain already validates both values; this is a second barrier so a
  // bad value can never reach a path outside the uploads folder
  private folderOf(propertyId: UUID): string {
    if (!/^[\w-]+$/.test(propertyId)) {
      throw new Error(`Invalid property id for image storage: ${propertyId}`);
    }
    return join(this.rootDir, 'properties', propertyId);
  }

  private safeName(fileName: string): string {
    if (basename(fileName) !== fileName || fileName.startsWith('.')) {
      throw new Error(`Invalid image file name: ${fileName}`);
    }
    return fileName;
  }
}
