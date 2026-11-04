import type { Client } from '@/domain/client.js';
import type { Owner } from '@/domain/owner.js';
import type { Property } from '@/domain/property.js';
import { Rental, RentalStatus, type RentalKey } from '@/domain/rental.js';
import {
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';
import type { RentalRepository } from '@/application/ports/out/repositories/rental-repository.js';
import { UUID } from '@/utils/types.js';
import { RentalDetails } from '../models/rental-details.js';
import type { ClientRepository } from '../ports/out/repositories/client-repository.js';
import type { PropertyRepository } from '../ports/out/repositories/property-repository.js';
import type { UnitOfWork } from '../ports/out/repositories/unit-of-work.js';
import type { Clock } from '../ports/out/clock.js';

// Plain class: rental.module.ts builds it with useFactory, so the
// application layer does not depend on Nest
export class RentalService {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly clientRepository: ClientRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly unitOfWork: UnitOfWork,
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

  async refreshAllStatuses(): Promise<number> {
    const rentals = await this.rentalRepository.findAll();
    return this.refreshStatuses(rentals);
  }

  // Lock order: client first, then owner. Every transaction that locks
  // both follows it, so they cannot wait on each other (no deadlocks).
  async save(rental: Rental): Promise<Rental> {
    return this.unitOfWork.run(
      async ({
        clientsRepository,
        ownersRepository,
        propertiesRepository,
        rentalsRepository,
      }) => {
        const client = await clientsRepository.findByIdForUpdate(
          rental.getClientId(),
        );
        if (!client) {
          throw new NotFoundError(
            `Client with id ${rental.getClientId()} not found`,
          );
        }

        const property = await propertiesRepository.findById(
          rental.getPropertyId(),
        );
        if (!property) {
          throw new NotFoundError(
            `Property with id ${rental.getPropertyId()} not found`,
          );
        }

        const owner = await ownersRepository.findByIdForUpdate(
          property.getOwnerId(),
        );
        if (!owner) {
          throw new Error(`Missing owner for property ${property.getId()}`);
        }

        rental.assertCanStartOn(this.clock.today());
        this.assertPropertyIsAvailable(property);
        await this.assertNoConflicts(rentalsRepository, rental);

        const total = this.calculateCharge(rental, property);
        this.applyCharge(rental, client, owner, total);

        await rentalsRepository.save(rental);
        await clientsRepository.update(client.getId(), client);
        await ownersRepository.update(owner.getId(), owner);
        return rental;
      },
    );
  }

  private assertPropertyIsAvailable(property: Property): void {
    if (!property.isAvailableForBooking()) {
      throw new ConflictError('The property is inactive');
    }
  }

  private async assertNoConflicts(
    rentalsRepository: RentalRepository,
    rental: Rental,
  ): Promise<void> {
    const [existing, propertyOverlap, clientOverlap] = await Promise.all([
      rentalsRepository.findByKey(rental.getKey()),
      rentalsRepository.hasOverlappingPropertyRental(
        rental.getPropertyId(),
        rental.getStartDate(),
        rental.getEndDate(),
      ),
      rentalsRepository.hasOverlappingClientRental(
        rental.getClientId(),
        rental.getStartDate(),
        rental.getEndDate(),
      ),
    ]);

    if (existing) {
      throw new ConflictError('The rental already exists');
    }

    if (propertyOverlap) {
      throw new ConflictError(
        'The property has an overlapping active or upcoming rental',
      );
    }

    if (clientOverlap) {
      throw new ConflictError(
        'The client has an overlapping active or upcoming rental',
      );
    }
  }

  private calculateCharge(rental: Rental, property: Property): number {
    const nights = Math.round(
      (rental.getEndDate().getTime() - rental.getStartDate().getTime()) /
        86_400_000,
    );

    return Math.round(property.getPrice() * nights * 100) / 100;
  }

  // The client pays the rental and the owner receives the money
  private applyCharge(
    rental: Rental,
    client: Client,
    owner: Owner,
    total: number,
  ): void {
    rental.refreshStatus(this.clock.today());
    rental.charge(total);
    client.discount(total);
    owner.deposit(total);
  }

  // The owner returns the charged amount to the client
  async cancel(key: RentalKey): Promise<boolean> {
    return this.unitOfWork.run(
      async ({
        clientsRepository,
        ownersRepository,
        propertiesRepository,
        rentalsRepository,
      }) => {
        const rental = await rentalsRepository.findByKey(key);
        if (!rental) throw new NotFoundError('Rental not found');

        const client = await clientsRepository.findByIdForUpdate(
          rental.getClientId(),
        );
        if (!client) {
          throw new Error(`Missing client for rental`); // broken integrity -> 500
        }

        const property = await propertiesRepository.findById(
          rental.getPropertyId(),
        );
        if (!property) {
          throw new Error(`Missing property for rental`); // broken integrity -> 500
        }

        const owner = await ownersRepository.findByIdForUpdate(
          property.getOwnerId(),
        );
        if (!owner) {
          throw new Error(`Missing owner for property ${property.getId()}`);
        }

        rental.refreshStatus(this.clock.today());
        if (rental.getStatus() !== RentalStatus.UPCOMING) {
          throw new ConflictError('The rental has already started');
        }

        const amount = rental.getChargedAmount();
        if (amount <= 0) {
          throw new ConflictError('The rental has no charged amount to refund');
        }

        // Checked here so the message says whose balance is missing
        if (!owner.hasEnoughBalance(amount)) {
          throw new ConflictError(
            'The owner balance is not enough to refund the rental',
          );
        }

        owner.discount(amount);
        client.deposit(amount);

        // If another cancellation won: 0 rows -> NotFoundError -> rollback
        await rentalsRepository.delete(key);
        await clientsRepository.update(client.getId(), client);
        await ownersRepository.update(owner.getId(), owner);
        return true;
      },
    );
  }

  private async loadDetails(rental: Rental[]): Promise<RentalDetails[]> {
    if (rental.length === 0) return [];

    await this.refreshStatuses(rental);

    const clientsId = [...new Set(rental.map((r) => r.getClientId()))];
    const propertiesId = [...new Set(rental.map((r) => r.getPropertyId()))];

    const [clients, properties, occupiedIds] = await Promise.all([
      this.clientRepository.findByIds(clientsId),
      this.propertyRepository.findByIds(propertiesId),
      this.propertyRepository.findOccupiedPropertyIds(propertiesId),
    ]);

    const occupiedPropertyIds = new Set(occupiedIds);
    const clientsById = new Map(clients.map((c) => [c.getId(), c]));
    const propertiesById = new Map(properties.map((p) => [p.getId(), p]));

    for (const property of properties) {
      property.applyOccupancy(occupiedPropertyIds.has(property.getId()));
    }

    return rental.map((r) => {
      const client = clientsById.get(r.getClientId());
      const property = propertiesById.get(r.getPropertyId());
      if (!client || !property) {
        throw new Error('Client or Property not found for rental');
      }
      return { rental: r, client, property };
    });
  }

  private async refreshStatuses(rentals: Rental[]): Promise<number> {
    const today = this.clock.today();
    const changed: Rental[] = [];

    for (const rental of rentals) {
      const previous = rental.getStatus();
      rental.refreshStatus(today);

      if (rental.getStatus() !== previous) {
        changed.push(rental);
      }
    }

    if (changed.length > 0) {
      await this.rentalRepository.updateStatuses(changed);
    }

    return changed.length;
  }
}
