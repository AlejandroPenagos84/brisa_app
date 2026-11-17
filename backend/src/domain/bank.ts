import type { UUID } from '@/utils/types.js';
import type { Administrator } from './administrator.js';
import type {
  AdministratorTransaction,
  TransactionMeta,
} from './administrator-transaction.js';
import type { Client } from './client.js';
import { DomainError } from './errors/domain-error.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';
import type { Owner } from './owner.js';
import type { Rental } from './rental.js';

// Diagram: Banco
export class Bank {
  constructor(
    private readonly id: UUID,
    private name: string,
    private countryId: string,
  ) {}

  // Diagram: girarPago(). The client's bank sends the cost of the rental
  // from the client's account to the administrator, who keeps the
  // commission and credits the owner. owner must be the owner of the
  // rented property.
  // Simulated payment: the client's account is outside the app (there is
  // no payment gateway), so the transfer is always approved.
  transferPayment(
    client: Client,
    administrator: Administrator,
    owner: Owner,
    rental: Rental,
    meta: TransactionMeta,
  ): AdministratorTransaction {
    const amount = this.assertCanMove(client, rental);
    return administrator.receivePayment(owner, amount, meta);
  }

  // Inverse movement when a rental is cancelled: the owner and the
  // administrator give the whole cost back to the client's bank account
  // (simulated, outside the app)
  refundPayment(
    client: Client,
    administrator: Administrator,
    owner: Owner,
    rental: Rental,
    meta: TransactionMeta,
  ): AdministratorTransaction {
    const amount = this.assertCanMove(client, rental);
    return administrator.refundPayment(owner, amount, meta);
  }

  // Returns the amount to move
  private assertCanMove(client: Client, rental: Rental): number {
    if (client.getBankId() !== this.id) {
      throw new DomainError(
        DomainErrorCode.PAYMENT_BANK_MISMATCH,
        "The payment must go through the client's bank",
      );
    }

    if (rental.getClientId() !== client.getId()) {
      throw new DomainError(
        DomainErrorCode.INVALID_CLIENT,
        'The rental does not belong to the client',
      );
    }

    const amount = rental.getCost();
    if (amount <= 0) {
      throw new DomainError(
        DomainErrorCode.RENTAL_HAS_NO_COST,
        'The rental has no cost',
      );
    }

    return amount;
  }

  getId(): UUID {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getCountryId(): string {
    return this.countryId;
  }

  getData() {
    return {
      id: this.id,
      name: this.name,
      countryId: this.countryId,
    };
  }
}
