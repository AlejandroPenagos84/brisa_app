import { UUID } from '@/utils/types.js';

// A rental is identified by the property, the client and the start date
export interface RentalKey {
  propertyId: UUID;
  clientId: UUID;
  startDate: Date;
}

export class Rental {
  constructor(
    private readonly propertyId: UUID,
    private readonly clientId: UUID,
    private readonly startDate: Date,
    private readonly endDate: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.propertyId.trim()) {
      throw new Error('The property is not valid');
    }

    if (!this.clientId.trim()) {
      throw new Error('The client is not valid');
    }

    if (
      !(this.startDate instanceof Date) ||
      !(this.endDate instanceof Date) ||
      !Number.isFinite(this.startDate.getTime()) ||
      !Number.isFinite(this.endDate.getTime())
    ) {
      throw new Error('The rental dates are not valid');
    }

    if (this.startDate.getTime() >= this.endDate.getTime()) {
      throw new Error('The end date must be after the start date');
    }
  }

  getKey(): RentalKey {
    return {
      propertyId: this.propertyId,
      clientId: this.clientId,
      startDate: this.startDate,
    };
  }

  getData() {
    return {
      propertyId: this.propertyId,
      clientId: this.clientId,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }
}
