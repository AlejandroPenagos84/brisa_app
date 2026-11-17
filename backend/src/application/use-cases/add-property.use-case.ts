import { randomUUID } from 'node:crypto';
import type { CreatePropertyCommand } from '@/application/commands/create-property.command.js';
import { NotFoundError } from '@/application/errors/application-error.js';
import type { CityRepository } from '@/application/ports/out/repositories/city-repository.js';
import type { OwnerRepository } from '@/application/ports/out/repositories/owner-repository.js';
import type { PropertyRepository } from '@/application/ports/out/repositories/property-repository.js';
import type { Property } from '@/domain/property.js';

// Diagram: Propietario.agregarInmueble(). The owner creates the property
export class AddPropertyUseCase {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly cityRepository: CityRepository,
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(command: CreatePropertyCommand): Promise<Property> {
    const [owner, city] = await Promise.all([
      this.ownerRepository.findById(command.ownerId),
      this.cityRepository.findById(command.cityId),
    ]);

    if (!owner) {
      throw new NotFoundError(`Owner with id ${command.ownerId} not found`);
    }

    if (!city) {
      throw new NotFoundError(`City with id ${command.cityId} not found`);
    }

    const property = owner.addProperty(randomUUID(), {
      cityId: command.cityId,
      address: command.address,
      area: command.area,
      numberOfRooms: command.numberOfRooms,
      capacity: command.capacity,
      pricePerNight: command.pricePerNight,
    });

    return this.propertyRepository.save(property);
  }
}
