import { UUID } from '@/utils/types.js';
import { DomainError } from './errors/domain-error.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';

// A rental is identified by the property, the client and the start date
export interface RentalKey {
  propertyId: UUID;
  clientId: UUID;
  startDate: Date;
}

export enum RentalStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

export class Rental {
  constructor(
    private readonly propertyId: UUID,
    private readonly clientId: UUID,
    private readonly startDate: Date,
    private readonly endDate: Date,
    private chargedAmount: number = 0,
    private status: RentalStatus = RentalStatus.UPCOMING,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.propertyId.trim()) {
      throw new DomainError(DomainErrorCode.INVALID_PROPERTY, 'The property is not valid');
    }

    if (!this.clientId.trim()) {
      throw new DomainError(DomainErrorCode.INVALID_CLIENT, 'The client is not valid');
    }

    if (
      !(this.startDate instanceof Date) ||
      !(this.endDate instanceof Date) ||
      !Number.isFinite(this.startDate.getTime()) ||
      !Number.isFinite(this.endDate.getTime())
    ) {
      throw new DomainError(DomainErrorCode.INVALID_RENTAL_DATES, 'The rental dates are not valid');
    }

    if (this.startDate.getTime() >= this.endDate.getTime()) {
      throw new DomainError(DomainErrorCode.END_DATE_NOT_AFTER_START_DATE, 'The end date must be after the start date');
    }

    if (!Number.isFinite(this.chargedAmount) || this.chargedAmount < 0) {
      throw new DomainError(DomainErrorCode.INVALID_CHARGED_AMOUNT, 'The charged amount is not valid');
    }

    if (!Object.values(RentalStatus).includes(this.status)) {
      throw new DomainError(DomainErrorCode.INVALID_RENTAL_STATUS, 'The rental status is not valid');
    }
  }

  charge(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new DomainError(DomainErrorCode.INVALID_CHARGE_AMOUNT, 'The charge amount is not valid');
    }

    this.chargedAmount = amount;
  }

  // Only applies when booking: rentals loaded from the database can have
  // started in the past. today is a calendar day at UTC midnight.
  assertCanStartOn(today: Date): void {
    if (this.startDate.getTime() < today.getTime()) {
      throw new DomainError(
        DomainErrorCode.START_DATE_IN_PAST,
        'The rental start date cannot be in the past',
      );
    }
  }

  // today is a calendar day at UTC midnight, like startDate and endDate.
  // The caller decides which day it is (it depends on the time zone).
  refreshStatus(today: Date): void {
    const start = this.startDate.getTime();
    const end = this.endDate.getTime();
    const current = today.getTime();

    if (current < start) {
      this.status = RentalStatus.UPCOMING;
      return;
    }

    if (current < end) {
      this.status = RentalStatus.ACTIVE;
      return;
    }

    this.status = RentalStatus.FINISHED;
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

  getStatus(): RentalStatus {
    return this.status;
  }

  getData() {
    return {
      propertyId: this.propertyId,
      clientId: this.clientId,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
    };
  }
}
