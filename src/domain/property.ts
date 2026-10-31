import { UUID } from '@/utils/types.js';

enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class Property {
  private status: PropertyStatus = PropertyStatus.ACTIVE;

  constructor(
    private readonly id: UUID,
    private readonly ownerId: UUID,
    private readonly cityId: string,
    private address: string,
    private area: number,
    private numberOfRooms: number,
    private capacity: number,
    private price: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.address.trim()) {
      throw new Error('The address is required');
    }

    if (this.area <= 0) {
      throw new Error('The area must be greater than zero');
    }

    if (this.numberOfRooms < 0) {
      throw new Error('The number of rooms cannot be negative');
    }

    if (this.capacity <= 0) {
      throw new Error('The capacity must be greater than zero');
    }

    if (this.price <= 0) {
      throw new Error('The price must be greater than zero');
    }
  }

  changeAddress(address: string): void {
    if (!address.trim()) {
      throw new Error('The address is required');
    }

    this.address = address;
  }

  changePrice(price: number): void {
    if (price <= 0) {
      throw new Error('The price must be greater than zero');
    }

    this.price = price;
  }

  deactivate(): void {
    if (this.status === PropertyStatus.INACTIVE) {
      throw new Error('The property is already inactive');
    }

    this.status = PropertyStatus.INACTIVE;
  }

  activate(): void {
    if (this.status === PropertyStatus.ACTIVE) {
      throw new Error('The property is already active');
    }

    this.status = PropertyStatus.ACTIVE;
  }

  isActive(): boolean {
    return this.status === PropertyStatus.ACTIVE;
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
      price: this.price,
      status: this.status,
    };
  }
}
