import { UUID } from '@/utils/types.js';
import { DomainError } from './errors/domain-error.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';
import {
  addToBalance,
  assertValidBalance,
  isBalanceEnough,
  subtractFromBalance,
} from './money.js';

export class Owner {
  constructor(
    private readonly id: UUID,
    private name: string,
    private phone: string,
    private email: string,
    private bankId: UUID,
    private balance: number = 0,
  ) {
    this.validate();
  }

  private validate(): void {
    assertValidBalance(this.balance);

    if (!this.name.trim()) {
      throw new DomainError(DomainErrorCode.NAME_REQUIRED, 'The name is required');
    }

    if (!this.email.trim()) {
      throw new DomainError(DomainErrorCode.EMAIL_REQUIRED, 'The email is required');
    }

    if (!this.phone.trim()) {
      throw new DomainError(DomainErrorCode.PHONE_REQUIRED, 'The phone is required');
    }

    if (!this.bankId.trim()) {
      throw new DomainError(DomainErrorCode.INVALID_BANK, 'The bank is not valid');
    }
  }

  changeName(name: string): void {
    if (!name.trim()) {
      throw new DomainError(DomainErrorCode.NAME_REQUIRED, 'The name is required');
    }

    this.name = name;
  }

  changePhone(phone: string): void {
    if (!phone.trim()) {
      throw new DomainError(DomainErrorCode.PHONE_REQUIRED, 'The phone is required');
    }

    this.phone = phone;
  }

  changeEmail(email: string): void {
    if (!email.trim()) {
      throw new DomainError(DomainErrorCode.EMAIL_REQUIRED, 'The email is required');
    }

    this.email = email;
  }

  changeBank(bankId: UUID): void {
    if (!bankId.trim()) {
      throw new DomainError(DomainErrorCode.INVALID_BANK, 'The bank is not valid');
    }

    this.bankId = bankId;
  }

  // Receives the payment of a rental, or a manual deposit
  deposit(amount: number): void {
    this.balance = addToBalance(this.balance, amount);
  }

  // Refunds a cancelled rental, or a manual withdrawal
  discount(amount: number): void {
    this.balance = subtractFromBalance(this.balance, amount);
  }

  hasEnoughBalance(amount: number): boolean {
    return isBalanceEnough(this.balance, amount);
  }

  getId(): UUID {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getPhone(): string {
    return this.phone;
  }

  getEmail(): string {
    return this.email;
  }

  getBankId(): UUID {
    return this.bankId;
  }

  getBalance(): number {
    return this.balance;
  }

  getData() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      email: this.email,
      bankId: this.bankId,
      balance: this.balance,
    };
  }
}
