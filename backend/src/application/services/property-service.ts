import type { Clock } from '@/application/ports/out/clock.js';
import type {
  PropertyFilters,
  PropertyRepository,
} from '@/application/ports/out/repositories/property-repository.js';
import type { Property } from '@/domain/property.js';
import type { UUID } from '@/utils/types.js';
import type { PropertyDetails } from '@/application/models/property-details.js';
import type { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import type { CityRepository } from '@/application/ports/out/repositories/city-repository.js';
import type { OwnerRepository } from '@/application/ports/out/repositories/owner-repository.js';

// Reads only. Adding, editing and removing are use cases:
// AddPropertyUseCase, EditPropertyUseCase and RemovePropertyUseCase.
// Plain class: property.module.ts builds it with useFactory, so the
// application layer does not depend on Nest
export class PropertyService {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly ownerRepository: OwnerRepository,
    private readonly bankRepository: BankRepository,
    private readonly cityRepository: CityRepository,
    private readonly clock: Clock,
  ) {}

  async findByIds(ids: UUID[]): Promise<PropertyDetails[]> {
    const properties = await this.propertyRepository.findByIds(ids);
    return this.loadDetails(properties);
  }

  async findAll(): Promise<PropertyDetails[]> {
    const properties = await this.propertyRepository.findAll();
    return this.loadDetails(properties);
  }

  async findById(id: UUID): Promise<PropertyDetails | null> {
    const property = await this.propertyRepository.findById(id);
    if (!property) return null;

    const [details] = await this.loadDetails([property]);
    return details;
  }

  async findByOwnerId(ownerId: UUID): Promise<PropertyDetails[]> {
    const properties = await this.propertyRepository.findByOwnerId(ownerId);
    return this.loadDetails(properties);
  }

  async findByFilters(filters: PropertyFilters): Promise<PropertyDetails[]> {
    const properties = await this.propertyRepository.findByFilters(filters);
    return this.loadDetails(properties);
  }

  private async loadDetails(
    properties: Property[],
  ): Promise<PropertyDetails[]> {
    if (properties.length === 0) return [];

    const ownerIds = [
      ...new Set(properties.map((property) => property.getOwnerId())),
    ];
    const cityIds = [
      ...new Set(properties.map((property) => property.getCityId())),
    ];

    const [owners, cities, occupiedIds] = await Promise.all([
      this.ownerRepository.findByIds(ownerIds),
      this.cityRepository.findByIds(cityIds),
      this.propertyRepository.findOccupiedPropertyIds(
        properties.map((property) => property.getId()),
        this.clock.today(),
      ),
    ]);

    const bankIds = [...new Set(owners.map((owner) => owner.getBankId()))];
    const banks = await this.bankRepository.findByIds(bankIds);

    const ownersById = new Map(owners.map((owner) => [owner.getId(), owner]));
    const citiesById = new Map(cities.map((city) => [city.getId(), city]));
    const banksById = new Map(banks.map((bank) => [bank.getId(), bank]));
    const occupiedPropertyIds = new Set(occupiedIds);

    return properties.map((property) => {
      property.applyOccupancy(occupiedPropertyIds.has(property.getId()));

      const owner = ownersById.get(property.getOwnerId());
      const city = citiesById.get(property.getCityId());
      if (!owner || !city) {
        throw new Error(`Missing relations for property ${property.getId()}`);
      }

      const ownerBank = banksById.get(owner.getBankId());
      if (!ownerBank) {
        throw new Error(`Missing bank for owner ${owner.getId()}`);
      }

      return { property, owner, ownerBank, city };
    });
  }
}
