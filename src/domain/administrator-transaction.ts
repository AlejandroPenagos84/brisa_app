import { UUID } from '@/utils/types.js';
import { DomainError } from './errors/domain-error.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';
import { isSameAmount, sumAmounts } from './money.js';

export enum TransactionType {
  // The client paid a rental: the owner receives the net amount
  PAYMENT = 'PAYMENT',
  // A rental was cancelled: the owner gives back the net amount
  REFUND = 'REFUND',
}

// Id and date of a new transaction. The caller provides them, like the
// ids of the other entities, so the domain does not depend on a clock.
export interface TransactionMeta {
  id: UUID;
  createdAt: Date;
}

// Row of the administrator ↔ owner table. Immutable: a refund is a new
// transaction, the payment is never changed or deleted.
export class AdministratorTransaction {
  constructor(
    private readonly id: UUID,
    private readonly administratorId: UUID,
    private readonly ownerId: UUID,
    private readonly type: TransactionType,
    private readonly grossAmount: number,
    private readonly commission: number,
    private readonly netAmount: number,
    private readonly createdAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    const invalid = (message: string) =>
      new DomainError(DomainErrorCode.INVALID_TRANSACTION, message);

    if (!this.id.trim() || !this.administratorId.trim() || !this.ownerId.trim()) {
      throw invalid('The transaction ids are not valid');
    }

    if (!Object.values(TransactionType).includes(this.type)) {
      throw invalid('The transaction type is not valid');
    }

    if (
      !Number.isFinite(this.grossAmount) ||
      !Number.isFinite(this.commission) ||
      !Number.isFinite(this.netAmount) ||
      this.grossAmount <= 0 ||
      this.commission < 0 ||
      this.netAmount < 0
    ) {
      throw invalid('The transaction amounts are not valid');
    }

    if (!isSameAmount(sumAmounts(this.commission, this.netAmount), this.grossAmount)) {
      throw invalid('The commission plus the net amount must equal the gross amount');
    }

    if (!(this.createdAt instanceof Date) || !Number.isFinite(this.createdAt.getTime())) {
      throw invalid('The transaction date is not valid');
    }
  }

  // Signed net amount for the owner's earnings: + for a payment, − for a
  // refund
  getSignedNetAmount(): number {
    return this.type === TransactionType.PAYMENT
      ? this.netAmount
      : -this.netAmount;
  }

  getId(): UUID {
    return this.id;
  }

  getAdministratorId(): UUID {
    return this.administratorId;
  }

  getOwnerId(): UUID {
    return this.ownerId;
  }

  getType(): TransactionType {
    return this.type;
  }

  getGrossAmount(): number {
    return this.grossAmount;
  }

  getCommission(): number {
    return this.commission;
  }

  getNetAmount(): number {
    return this.netAmount;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt.getTime());
  }

  getData() {
    return {
      id: this.id,
      administratorId: this.administratorId,
      ownerId: this.ownerId,
      type: this.type,
      grossAmount: this.grossAmount,
      commission: this.commission,
      netAmount: this.netAmount,
      createdAt: this.createdAt,
    };
  }
}
