import type { Rental, RentalKey } from '@/domain/rental.js';
import type { Clock } from '@/application/ports/out/clock.js';
import type { RentalRepository } from '@/application/ports/out/repositories/rental-repository.js';
import type { UUID } from '@/utils/types.js';
import type { RentalDetails } from '@/application/models/rental-details.js';
import type { ClientRepository } from '@/application/ports/out/repositories/client-repository.js';
import type { PropertyRepository } from '@/application/ports/out/repositories/property-repository.js';

// Reads only. Booking and cancelling are use cases:
// ReservePropertyUseCase and CancelRentalUseCase.
// Plain class: rental.module.ts builds it with useFactory, so the
// application layer does not depend on Nest
export class RentalService {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly clientRepository: ClientRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly clock: Clock,
  ) {}

  async findByKeys(keys: RentalKey[]): Promise<Rental[]> {
    return this.rentalRepository.findByKeys(keys);
  }

  async findAll(): Promise<RentalDetails[]> {
    const rentals = await this.rentalRepository.findAll();
    return this.loadDetails(rentals);
  }

  async findByClientId(clientId: UUID): Promise<RentalDetails[]> {
    const rentals = await this.rentalRepository.findByClientId(clientId);
    return this.loadDetails(rentals);
  }

  async findByKey(key: RentalKey): Promise<RentalDetails | null> {
    const rental = await this.rentalRepository.findByKey(key);
    if (!rental) return null;

    const [details] = await this.loadDetails([rental]);
    return details;
  }

  // Called by the daily scheduler
  async refreshAllStatuses(): Promise<number> {
    const rentals = await this.rentalRepository.findAll();
    return this.refreshStatuses(rentals);
  }

  private async loadDetails(rentals: Rental[]): Promise<RentalDetails[]> {
    if (rentals.length === 0) return [];

    await this.refreshStatuses(rentals);

    const clientIds = [...new Set(rentals.map((r) => r.getClientId()))];
    const propertyIds = [...new Set(rentals.map((r) => r.getPropertyId()))];

    const [clients, properties, occupiedIds] = await Promise.all([
      this.clientRepository.findByIds(clientIds),
      this.propertyRepository.findByIds(propertyIds),
      this.propertyRepository.findOccupiedPropertyIds(
        propertyIds,
        this.clock.today(),
      ),
    ]);

    const occupiedPropertyIds = new Set(occupiedIds);
    const clientsById = new Map(clients.map((c) => [c.getId(), c]));
    const propertiesById = new Map(properties.map((p) => [p.getId(), p]));

    for (const property of properties) {
      property.applyOccupancy(occupiedPropertyIds.has(property.getId()));
    }

    return rentals.map((rental) => {
      const client = clientsById.get(rental.getClientId());
      const property = propertiesById.get(rental.getPropertyId());
      if (!client || !property) {
        throw new Error('Client or Property not found for rental');
      }
      return { rental, client, property };
    });
  }

  // The rental tells whether its status changed (Tell, don't ask)
  private async refreshStatuses(rentals: Rental[]): Promise<number> {
    const today = this.clock.today();
    const changed = rentals.filter((rental) => rental.refreshStatus(today));

    if (changed.length > 0) {
      await this.rentalRepository.updateStatuses(changed);
    }

    return changed.length;
  }
}
