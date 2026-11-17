import type { UpdatePropertyCommand } from '@/application/commands/update-property.command.js';
import { NotFoundError } from '@/application/errors/application-error.js';
import type { Clock } from '@/application/ports/out/clock.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import type { Property } from '@/domain/property.js';
import type { UUID } from '@/utils/types.js';

// Diagram: Propietario.editarInmueble(). ownerId is the owner making the
// request: only the owner of the property can edit it (PROPERTY_NOT_OWNED).
// Runs in a transaction with the property locked, so it cannot be
// reactivated while it is being booked.
export class EditPropertyUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(
    ownerId: UUID,
    id: UUID,
    command: UpdatePropertyCommand,
  ): Promise<Property> {
    const today = this.clock.today();

    return this.unitOfWork.run(async (repos) => {
      const owner = await repos.ownersRepository.findById(ownerId);
      if (!owner) {
        throw new NotFoundError(`Owner with id ${ownerId} not found`);
      }

      const property = await repos.propertiesRepository.findByIdForUpdate(id);
      if (!property) {
        throw new NotFoundError(`Property with id ${id} not found`);
      }

      // Always loaded: the domain decides if it needs them (reactivation)
      const currentRentals =
        await repos.rentalsRepository.findCurrentByPropertyId(id, today);

      owner.editProperty(
        property,
        {
          address: command.address,
          area: command.area,
          numberOfRooms: command.numberOfRooms,
          capacity: command.capacity,
          pricePerNight: command.pricePerNight,
          status: command.status,
        },
        currentRentals,
      );

      const updated = await repos.propertiesRepository.update(id, property);
      updated.applyOccupancy(currentRentals.length > 0);
      return updated;
    });
  }
}
