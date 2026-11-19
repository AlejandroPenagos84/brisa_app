import { Module } from '@nestjs/common';
import { PROPERTY_IMAGE_STORAGE } from '@/application/ports/out/property-image-storage.js';
import { LocalDiskPropertyImageStorage } from '@/infrastructure/storage/local-disk-property-image-storage.js';

// Where the uploaded files are kept. main.ts serves the same folder as /uploads
@Module({
  providers: [
    {
      provide: PROPERTY_IMAGE_STORAGE,
      useFactory: () => new LocalDiskPropertyImageStorage(),
    },
  ],
  exports: [PROPERTY_IMAGE_STORAGE],
})
export class StorageModule {}
