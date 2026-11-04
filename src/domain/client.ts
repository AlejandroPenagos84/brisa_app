import { UUID } from '@/utils/types.js';
import { DomainError } from './errors/domain-error.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';

// NUMERIC(12,2) in the database: up to 9,999,999,999.99
const MAX_BALANCE_IN_CENTS = 999_999_999_999;

export class Client {
  constructor(
    private readonly id: UUID,
    private name: string,
    private phone: string,
    private email: string,
    private cityId: string,
    private bankId: UUID,
    private accountNumber: string,
    private accountType: string,
    private balance: number = 0,
  ) {
    this.validate();
  }

  private validate(): void {
    if (
      !Client.hasAtMostTwoDecimals(this.balance) ||
      this.balance < 0 ||
      Client.toCents(this.balance) > MAX_BALANCE_IN_CENTS
    ) {
      throw new DomainError(DomainErrorCode.INVALID_BALANCE, 'The balance is not valid');
    }

    if (!this.name.trim()) {
      throw new DomainError(DomainErrorCode.NAME_REQUIRED, 'The name is required');
    }

    if (!this.phone.trim()) {
      throw new DomainError(DomainErrorCode.PHONE_REQUIRED, 'The phone is required');
    }

    if (!this.email.trim()) {
      throw new DomainError(DomainErrorCode.EMAIL_REQUIRED, 'The email is required');
    }

    if (!this.bankId.trim()) {
      throw new DomainError(DomainErrorCode.INVALID_BANK, 'The bank is not valid');
    }

    if (!this.accountNumber.trim()) {
      throw new DomainError(DomainErrorCode.ACCOUNT_NUMBER_REQUIRED, 'The account number is required');
    }

    if (!this.accountType.trim()) {
      throw new DomainError(DomainErrorCode.ACCOUNT_TYPE_REQUIRED, 'The account type is required');
    }
  }

  changeName(name: string): void {
    if (!name.trim()) {
      throw new DomainError(DomainErrorCode.NAME_REQUIRED, 'The name is required');
    }

    this.name = name;
  }

  changeCityId(cityId: string): void {
    if (!cityId.trim()) {
      throw new DomainError(DomainErrorCode.INVALID_CITY, 'The city is not valid');
    }

    this.cityId = cityId;
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

  changeBankAccount(
    bankId: UUID,
    accountNumber: string,
    accountType: string,
  ): void {
    if (!bankId.trim() || !accountNumber.trim() || !accountType.trim()) {
      throw new DomainError(DomainErrorCode.INVALID_BANK_ACCOUNT, 'The bank account data is not valid');
    }

    this.bankId = bankId;
    this.accountNumber = accountNumber;
    this.accountType = accountType;
  }

  deposit(amount: number): void {
    Client.validateAmount(amount);

    const newBalanceInCents =
      Client.toCents(this.balance) + Client.toCents(amount);
    if (newBalanceInCents > MAX_BALANCE_IN_CENTS) {
      throw new DomainError(DomainErrorCode.BALANCE_LIMIT_EXCEEDED, 'The balance exceeds the maximum allowed');
    }

    this.balance = Client.fromCents(newBalanceInCents);
  }

  discount(amount: number): void {
    Client.validateAmount(amount);

    const balanceInCents = Client.toCents(this.balance);
    const amountInCents = Client.toCents(amount);

    if (amountInCents > balanceInCents) {
      throw new DomainError(DomainErrorCode.INSUFFICIENT_BALANCE, 'Insufficient balance');
    }

    this.balance = Client.fromCents(balanceInCents - amountInCents);
  }

  hasEnoughBalance(amount: number): boolean {
    return Client.toCents(amount) <= Client.toCents(this.balance);
  }

  // Amounts are computed in cents to avoid floating point errors
  // (0.1 + 0.2 = 0.30000000000000004)
  private static validateAmount(amount: number): void {
    if (!Client.hasAtMostTwoDecimals(amount) || amount <= 0) {
      throw new DomainError(DomainErrorCode.INVALID_AMOUNT, 'The amount must be greater than zero');
    }
  }

  private static hasAtMostTwoDecimals(value: number): boolean {
    return (
      Number.isFinite(value) &&
      Math.abs(value * 100 - Math.round(value * 100)) < 1e-6
    );
  }

  private static toCents(value: number): number {
    return Math.round(value * 100);
  }

  private static fromCents(cents: number): number {
    return cents / 100;
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

  getCityId(): string {
    return this.cityId;
  }

  getBankId(): UUID {
    return this.bankId;
  }

  getAccountNumber(): string {
    return this.accountNumber;
  }

  getAccountType(): string {
    return this.accountType;
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
      cityId: this.cityId,
      bankId: this.bankId,
      accountNumber: this.accountNumber,
      accountType: this.accountType,
      balance: this.balance,
    };
  }
}
