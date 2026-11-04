import type { Client } from '@/domain/client.js';
import type { Property } from '@/domain/property.js';
import {
  Rental,
  RentalStatus,
  type RentalKey,
} from '@/domain/rental.js';
import { Inject, Injectable } from '@nestjs/common';
import {
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';
import {
  RENTAL_REPOSITORY,
  type RentalRepository,
} from '@/application/ports/out/repositories/rental-repository.js';
import { UUID } from '@/utils/types.js';
import { businessTodayAsDate } from '@/utils/business-date.js';
import { RentalDetails } from '../models/rental-details.js';
import { CLIENT_REPOSITORY, type ClientRepository } from '../ports/out/repositories/client-repository.js';
import { PROPERTY_REPOSITORY, type PropertyRepository } from '../ports/out/repositories/property-repository.js';

@Injectable()
export class RentalService {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
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

  async save(rental: Rental): Promise<Rental> {
    const { client, property } = await this.getClientAndProperty(rental);

    rental.assertCanStartOn(businessTodayAsDate());
    this.assertPropertyIsAvailable(property);
    await this.assertNoConflicts(rental);

    const total = this.calculateCharge(rental, property);
    this.applyCharge(rental, client, total);

    return this.rentalRepository.saveWithClient(rental, client);
  }

  private async getClientAndProperty(
    rental: Rental,
  ): Promise<{ client: Client; property: Property }> {
    const [client, property] = await Promise.all([
      this.clientRepository.findById(rental.getClientId()),
      this.propertyRepository.findById(rental.getPropertyId()),
    ]);

    if (!client) {
      throw new NotFoundError(
        `Client with id ${rental.getClientId()} not found`,
      );
    }

    if (!property) {
      throw new NotFoundError(
        `Property with id ${rental.getPropertyId()} not found`,
      );
    }

    return { client, property };
  }

  private assertPropertyIsAvailable(property: Property): void {
    if (!property.isAvailableForBooking()) {
      throw new ConflictError('The property is inactive');
    }
  }

  private async assertNoConflicts(rental: Rental): Promise<void> {
    const [existing, propertyOverlap, clientOverlap] = await Promise.all([
      this.rentalRepository.findByKey(rental.getKey()),
      this.rentalRepository.hasOverlappingPropertyRental(
        rental.getPropertyId(),
        rental.getStartDate(),
        rental.getEndDate(),
      ),
      this.rentalRepository.hasOverlappingClientRental(
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

  private applyCharge(
    rental: Rental,
    client: Client,
    total: number,
  ): void {
    rental.refreshStatus(businessTodayAsDate());
    rental.charge(total);
    client.discount(total);
  }

  async cancel(key: RentalKey): Promise<boolean> {
    const rental = await this.rentalRepository.findByKey(key);
    if (!rental) {
      throw new NotFoundError('Rental not found');
    }

    const [details] = await this.loadDetails([rental]);
    const { client } = details;

    if (rental.getStatus() !== RentalStatus.UPCOMING) {
      throw new ConflictError('The rental has already started');
    }

    const amount = rental.getChargedAmount();

    if (amount <= 0) {
      throw new ConflictError(
        'The rental has no charged amount to refund',
      );
    }

    client.deposit(amount);

    return this.rentalRepository.deleteWithClient(key, client);
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
    const today = businessTodayAsDate();
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
