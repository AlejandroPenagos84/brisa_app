import { NotFoundError } from '@/application/errors/application-error.js';
import type { Clock } from '@/application/ports/out/clock.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import type { UUID } from '@/utils/types.js';

// Diagram: Propietario.eliminarInmueble(). ownerId is the owner making the
// request: only the owner of the property can delete it. Deletes the
// property with its finished rentals; the domain rejects it if it has
// current rentals.
export class RemovePropertyUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(ownerId: UUID, id: UUID): Promise<void> {
    const today = this.clock.today();

    await this.unitOfWork.run(async (repos) => {
      const owner = await repos.ownersRepository.findById(ownerId);
      if (!owner) {
        throw new NotFoundError(`Owner with id ${ownerId} not found`);
      }

      const property = await repos.propertiesRepository.findByIdForUpdate(id);
      if (!property) {
        throw new NotFoundError(`Property with id ${id} not found`);
      }

      const currentRentals =
        await repos.rentalsRepository.findCurrentByPropertyId(id, today);

      owner.removeProperty(property, currentRentals);

      const deleted = await repos.propertiesRepository.deleteWithPastRentals(
        id,
        today,
      );
      if (!deleted) {
        throw new NotFoundError(`Property with id ${id} not found`);
      }
    });
  }
}
