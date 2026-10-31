import { UUID } from '@/utils/types.js';

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
      throw new Error('The balance is not valid');
    }

    if (!this.name.trim()) {
      throw new Error('The name is required');
    }

    if (!this.phone.trim()) {
      throw new Error('The phone is required');
    }

    if (!this.email.trim()) {
      throw new Error('The email is required');
    }

    if (!this.bankId.trim()) {
      throw new Error('The bank is not valid');
    }

    if (!this.accountNumber.trim()) {
      throw new Error('The account number is required');
    }

    if (!this.accountType.trim()) {
      throw new Error('The account type is required');
    }
  }

  changePhone(phone: string): void {
    if (!phone.trim()) {
      throw new Error('The phone is required');
    }

    this.phone = phone;
  }

  changeEmail(email: string): void {
    if (!email.trim()) {
      throw new Error('The email is required');
    }

    this.email = email;
  }

  changeBankAccount(
    bankId: UUID,
    accountNumber: string,
    accountType: string,
  ): void {
    if (!bankId.trim() || !accountNumber.trim() || !accountType.trim()) {
      throw new Error('The bank account data is not valid');
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
      throw new Error('The balance exceeds the maximum allowed');
    }

    this.balance = Client.fromCents(newBalanceInCents);
  }

  discount(amount: number): void {
    Client.validateAmount(amount);

    const balanceInCents = Client.toCents(this.balance);
    const amountInCents = Client.toCents(amount);

    if (amountInCents > balanceInCents) {
      throw new Error('Insufficient balance');
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
      throw new Error('The amount must be greater than zero');
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
