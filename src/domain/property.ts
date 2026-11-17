import { UUID } from '@/utils/types.js';
import { DomainError } from './errors/domain-error.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';
import type { Rental } from './rental.js';

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// Fields an owner can change. Explicit attributes, one per field
export interface PropertyChanges {
  address?: string;
  area?: number;
  numberOfRooms?: number;
  capacity?: number;
  pricePerNight?: number;
  status?: PropertyStatus;
}

// Diagram: Inmueble. Created by Owner.addProperty
export class Property {
  private manuallyInactive: boolean;
  private occupied = false;

  constructor(
    private readonly id: UUID,
    private readonly ownerId: UUID,
    private readonly cityId: string,
    private address: string,
    private area: number,
    private numberOfRooms: number,
    private capacity: number,
    private pricePerNight: number,
    manuallyInactive: boolean = false,
  ) {
    this.manuallyInactive = manuallyInactive;
    this.address = address.trim();
    this.validate();
  }

  private validate(): void {
    if (!this.address) {
      throw new DomainError(DomainErrorCode.ADDRESS_REQUIRED, 'The address is required');
    }

    if (this.area <= 0) {
      throw new DomainError(DomainErrorCode.INVALID_AREA, 'The area must be greater than zero');
    }

    if (this.numberOfRooms < 0) {
      throw new DomainError(DomainErrorCode.INVALID_NUMBER_OF_ROOMS, 'The number of rooms cannot be negative');
    }

    if (this.capacity <= 0) {
      throw new DomainError(DomainErrorCode.INVALID_CAPACITY, 'The capacity must be greater than zero');
    }

    if (this.pricePerNight <= 0) {
      throw new DomainError(DomainErrorCode.INVALID_PRICE, 'The price must be greater than zero');
    }

    if (typeof this.manuallyInactive !== 'boolean') {
      throw new DomainError(DomainErrorCode.INVALID_PROPERTY_AVAILABILITY, 'The property availability is not valid');
    }
  }

  // Diagram: consultarDisponibilidad(). rentals are the current (not
  // finished) rentals of this property; rentals of other properties are
  // ignored.
  checkAvailability(startDate: Date, endDate: Date, rentals: Rental[]): boolean {
    if (this.manuallyInactive) return false;

    return !rentals.some(
      (rental) =>
        rental.getPropertyId() === this.id &&
        rental.overlaps(startDate, endDate),
    );
  }

  hasCurrentRentals(rentals: Rental[]): boolean {
    return rentals.some((rental) => rental.getPropertyId() === this.id);
  }

  // Called through Owner.editProperty. Applies only the fields present
  applyChanges(changes: PropertyChanges, currentRentals: Rental[]): void {
    if (changes.address !== undefined) this.changeAddress(changes.address);
    if (changes.area !== undefined) this.changeArea(changes.area);
    if (changes.numberOfRooms !== undefined) {
      this.changeNumberOfRooms(changes.numberOfRooms);
    }
    if (changes.capacity !== undefined) this.changeCapacity(changes.capacity);
    if (changes.pricePerNight !== undefined) {
      this.changePricePerNight(changes.pricePerNight);
    }
    if (changes.status !== undefined) {
      this.changeStatus(changes.status, currentRentals);
    }
  }

  changeAddress(address: string): void {
    if (!address.trim()) {
      throw new DomainError(DomainErrorCode.ADDRESS_REQUIRED, 'The address is required');
    }

    this.address = address.trim();
  }

  changeArea(area: number): void {
    if (area <= 0) {
      throw new DomainError(DomainErrorCode.INVALID_AREA, 'The area must be greater than zero');
    }

    this.area = area;
  }

  changeNumberOfRooms(numberOfRooms: number): void {
    if (numberOfRooms < 0) {
      throw new DomainError(DomainErrorCode.INVALID_NUMBER_OF_ROOMS, 'The number of rooms cannot be negative');
    }
    this.numberOfRooms = numberOfRooms;
  }

  changePricePerNight(pricePerNight: number): void {
    if (pricePerNight <= 0) {
      throw new DomainError(DomainErrorCode.INVALID_PRICE, 'The price must be greater than zero');
    }

    this.pricePerNight = pricePerNight;
  }

  changeCapacity(capacity: number): void {
    if (capacity <= 0) {
      throw new DomainError(DomainErrorCode.INVALID_CAPACITY, 'The capacity must be greater than zero');
    }

    this.capacity = capacity;
  }

  // Idempotent: asking for the current status does nothing.
  // A property with current rentals cannot be reactivated.
  changeStatus(status: PropertyStatus, currentRentals: Rental[]): void {
    if (status === PropertyStatus.INACTIVE) {
      this.manuallyInactive = true;
      return;
    }

    if (!this.manuallyInactive) return;

    if (this.hasCurrentRentals(currentRentals)) {
      throw new DomainError(
        DomainErrorCode.PROPERTY_HAS_ACTIVE_RENTALS,
        'The property has active or upcoming rentals',
      );
    }

    this.manuallyInactive = false;
  }

  // Read side only: whether it has current rentals is loaded in batch
  applyOccupancy(occupied: boolean): void {
    this.occupied = occupied;
  }

  isManuallyInactive(): boolean {
    return this.manuallyInactive;
  }

  getId(): UUID {
    return this.id;
  }

  getOwnerId(): UUID {
    return this.ownerId;
  }

  getCityId(): string {
    return this.cityId;
  }

  getAddress(): string {
    return this.address;
  }

  getArea(): number {
    return this.area;
  }

  getNumberOfRooms(): number {
    return this.numberOfRooms;
  }

  getCapacity(): number {
    return this.capacity;
  }

  getPricePerNight(): number {
    return this.pricePerNight;
  }

  getStatus(): PropertyStatus {
    if (this.manuallyInactive || this.occupied) {
      return PropertyStatus.INACTIVE;
    }

    return PropertyStatus.ACTIVE;
  }

  getData() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      cityId: this.cityId,
      address: this.address,
      area: this.area,
      numberOfRooms: this.numberOfRooms,
      capacity: this.capacity,
      pricePerNight: this.pricePerNight,
      status: this.getStatus(),
    };
  }
}
