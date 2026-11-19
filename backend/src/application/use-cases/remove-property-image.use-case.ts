import { NotFoundError } from '@/application/errors/application-error.js';
import type { PropertyImageStorage } from '@/application/ports/out/property-image-storage.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import type { UUID } from '@/utils/types.js';

// Only the owner of the property can remove images (PROPERTY_NOT_OWNED).
// The remaining images move up, so the next one becomes the cover if the
// cover was removed. The file is deleted only after the commit; if that
// fails the database is already right and the file is just left over.
export class RemovePropertyImageUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly imageStorage: PropertyImageStorage,
  ) {}

  async execute(ownerId: UUID, propertyId: UUID, imageId: UUID): Promise<void> {
    const removed = await this.unitOfWork.run(async (repos) => {
      const owner = await repos.ownersRepository.findById(ownerId);
      if (!owner) {
        throw new NotFoundError(`Owner with id ${ownerId} not found`);
      }

      const property =
        await repos.propertiesRepository.findByIdForUpdate(propertyId);
      if (!property) {
        throw new NotFoundError(`Property with id ${propertyId} not found`);
      }

      const image = owner.removePropertyImage(property, imageId);
      await repos.propertiesRepository.update(propertyId, property);
      return image;
    });

    await this.imageStorage
      .delete(propertyId, removed.getFileName())
      .catch(() => {});
  }
}
