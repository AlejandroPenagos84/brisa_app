import type { UUID } from '@/utils/types.js';
import { DomainError } from './errors/domain-error.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';
import { multiplyAmount } from './money.js';

const MS_PER_DAY = 86_400_000;

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

// Diagram: Renta. Created by Client.reserveProperty
export class Rental {
  constructor(
    private readonly propertyId: UUID,
    private readonly clientId: UUID,
    private readonly startDate: Date,
    private readonly endDate: Date,
    private cost: number = 0,
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

    if (!Number.isFinite(this.cost) || this.cost < 0) {
      throw new DomainError(DomainErrorCode.INVALID_CHARGED_AMOUNT, 'The rental cost is not valid');
    }

    if (!Object.values(RentalStatus).includes(this.status)) {
      throw new DomainError(DomainErrorCode.INVALID_RENTAL_STATUS, 'The rental status is not valid');
    }
  }

  // Diagram: calcularCosto(). Nights × price per night, in cents
  calculateCost(pricePerNight: number): number {
    this.cost = multiplyAmount(pricePerNight, this.getNights());
    return this.cost;
  }

  getNights(): number {
    return Math.round(
      (this.endDate.getTime() - this.startDate.getTime()) / MS_PER_DAY,
    );
  }

  // Both ends are inclusive, like the database constraint
  // daterange(check_in_date, check_out_date, '[]'): a stay cannot start
  // on the day another one ends
  overlaps(startDate: Date, endDate: Date): boolean {
    return (
      this.startDate.getTime() <= endDate.getTime() &&
      this.endDate.getTime() >= startDate.getTime()
    );
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

  // Only upcoming rentals with a cost can be cancelled and refunded
  assertCanBeCancelled(today: Date): void {
    this.refreshStatus(today);

    if (this.status !== RentalStatus.UPCOMING) {
      throw new DomainError(
        DomainErrorCode.RENTAL_ALREADY_STARTED,
        'The rental has already started',
      );
    }

    if (this.cost <= 0) {
      throw new DomainError(
        DomainErrorCode.RENTAL_HAS_NO_COST,
        'The rental has no cost to refund',
      );
    }
  }

  // today is a calendar day at UTC midnight, like startDate and endDate.
  // The caller decides which day it is (it depends on the time zone).
  // Returns true if the status changed.
  refreshStatus(today: Date): boolean {
    const previous = this.status;
    const start = this.startDate.getTime();
    const end = this.endDate.getTime();
    const current = today.getTime();

    if (current < start) {
      this.status = RentalStatus.UPCOMING;
    } else if (current < end) {
      this.status = RentalStatus.ACTIVE;
    } else {
      this.status = RentalStatus.FINISHED;
    }

    return this.status !== previous;
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

  getCost(): number {
    return this.cost;
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
      cost: this.cost,
      status: this.status,
    };
  }
}
