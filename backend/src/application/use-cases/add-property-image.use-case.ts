import { randomUUID } from 'node:crypto';
import type { AddPropertyImageCommand } from '@/application/commands/add-property-image.command.js';
import { NotFoundError } from '@/application/errors/application-error.js';
import type { PropertyImageStorage } from '@/application/ports/out/property-image-storage.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import type { PropertyImage } from '@/domain/property-image.js';

// Only the owner of the property can add images (PROPERTY_NOT_OWNED).
// The property row is locked, so two uploads at the same time cannot both
// pass the 10 images limit or take the same position.
//
// The file is written inside the transaction, after the domain accepted the
// image: if writing fails, nothing is saved in the database. If the commit
// fails after writing, the file is deleted again.
export class AddPropertyImageUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly imageStorage: PropertyImageStorage,
  ) {}

  async execute(command: AddPropertyImageCommand): Promise<PropertyImage> {
    const { ownerId, propertyId } = command;
    const imageId = randomUUID();
    const fileName = `${imageId}.${command.format}`;
    let fileWritten = false;

    try {
      return await this.unitOfWork.run(async (repos) => {
        const owner = await repos.ownersRepository.findById(ownerId);
        if (!owner) {
          throw new NotFoundError(`Owner with id ${ownerId} not found`);
        }

        const property =
          await repos.propertiesRepository.findByIdForUpdate(propertyId);
        if (!property) {
          throw new NotFoundError(`Property with id ${propertyId} not found`);
        }

        const image = owner.addPropertyImage(property, imageId, fileName);
        await repos.propertiesRepository.update(propertyId, property);

        await this.imageStorage.save(propertyId, fileName, command.content);
        fileWritten = true;
        return image;
      });
    } catch (error) {
      if (fileWritten) {
        await this.imageStorage.delete(propertyId, fileName).catch(() => {});
      }
      throw error;
    }
  }
}
