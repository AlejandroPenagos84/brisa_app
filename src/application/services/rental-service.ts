import { Rental, type RentalKey } from '@/domain/rental.js';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RENTAL_REPOSITORY,
  type RentalRepository,
} from '@/application/ports/out/repositories/rental-repository.js';
import { UUID } from '@/utils/types.js';
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

  async save(rental: Rental): Promise<Rental> {
    const [client, property] = await Promise.all([
      this.clientRepository.findById(rental.getClientId()),
      this.propertyRepository.findById(rental.getPropertyId()),
    ]);

    if (!client) {
      throw new NotFoundException(
        `Client with id ${rental.getClientId()} not found`,
      );
    }

    if (!property) {
      throw new NotFoundException(
        `Property with id ${rental.getPropertyId()} not found`,
      );
    }

    const existing = await this.rentalRepository.findByKey(rental.getKey());
    if (existing) {
      throw new ConflictException('The rental already exists');
    }

    return this.rentalRepository.save(rental);
  }

  private async loadDetails(rental: Rental[]): Promise<RentalDetails[]> {
    if (rental.length === 0) return [];

    const clientsId = [...new Set(rental.map((r) => r.getClientId()))];
    const propertiesId = [...new Set(rental.map((r) => r.getPropertyId()))];

    const clients = await this.clientRepository.findByIds(clientsId);
    const properties = await this.propertyRepository.findByIds(
      propertiesId,
    );

    const clientsById = new Map(clients.map((c) => [c.getId(), c]));
    const propertiesById = new Map(properties.map((p) => [p.getId(), p]));

    return rental.map((r) => {
      const client = clientsById.get(r.getClientId());
      const property = propertiesById.get(r.getPropertyId());
      if (!client || !property) {
        throw new Error('Client or Property not found for rental');
      }
      return { rental: r, client, property };
    });
  }
}
