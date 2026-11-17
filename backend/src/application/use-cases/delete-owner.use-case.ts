import { NotFoundError } from '@/application/errors/application-error.js';
import type { Clock } from '@/application/ports/out/clock.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import type { UUID } from '@/utils/types.js';

// Deletes the owner with everything: its properties (with their finished
// rentals) and its transactions. The administrator balance is kept.
// The domain blocks it while a property of the owner has a current rental.
export class DeleteOwnerUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(id: UUID): Promise<void> {
    const today = this.clock.today();

    await this.unitOfWork.run(async (repos) => {
      // Lock order, the same as ReservePropertyUseCase: property → owner.
      // With the properties locked nobody can book them meanwhile.
      const owned = await repos.propertiesRepository.findByOwnerId(id);
      const propertyIds = owned.map((property) => property.getId()).sort();
      const properties = [];
      for (const propertyId of propertyIds) {
        const property =
          await repos.propertiesRepository.findByIdForUpdate(propertyId);
        if (property) properties.push(property);
      }

      const owner = await repos.ownersRepository.findByIdForUpdate(id);
      if (!owner) {
        throw new NotFoundError(`Owner with id ${id} not found`);
      }

      const currentRentals =
        await repos.rentalsRepository.findCurrentByPropertyIds(
          propertyIds,
          today,
        );
      owner.assertCanBeDeleted(properties, currentRentals);

      // Children first, so the foreign keys are respected
      for (const property of properties) {
        await repos.propertiesRepository.deleteWithPastRentals(
          property.getId(),
          today,
        );
      }
      await repos.administratorTransactionsRepository.deleteByOwnerId(id);

      const deleted = await repos.ownersRepository.delete(id);
      if (!deleted) {
        throw new NotFoundError(`Owner with id ${id} not found`);
      }
    });
  }
}
