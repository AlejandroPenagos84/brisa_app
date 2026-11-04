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
    private chargedAmount: number = 0,
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

    if (!Number.isFinite(this.chargedAmount) || this.chargedAmount < 0) {
      throw new Error('The charged amount is not valid');
    }
  }

  charge(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('The charge amount is not valid');
    }

    this.chargedAmount = amount;
  }

  getKey(): RentalKey {
    return {
      propertyId: this.propertyId,
      clientId: this.clientId,
      startDate: this.startDate,
    };
  }

  getPropertyId(): UUID {
    return this.propertyId;
  }

  getClientId(): UUID {
    return this.clientId;
  }

  getStartDate(): Date {
    return new Date(this.startDate.getTime());
  }

  getEndDate(): Date {
    return new Date(this.endDate.getTime());
  }

  getChargedAmount(): number {
    return this.chargedAmount;
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
