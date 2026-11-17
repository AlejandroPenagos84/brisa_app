import type { UUID } from '@/utils/types.js';
import {
  type BankAccountChanges,
  mergeBankAccount,
  normalizeEmail,
  requireAccountNumber,
  requireAccountType,
  requireBankId,
  requireName,
  requirePhone,
} from './contact-rules.js';
import { DomainError } from './errors/domain-error.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';
import {
  addToBalance,
  assertValidBalance,
  isBalanceEnough,
  subtractFromBalance,
} from './money.js';
import type { Property } from './property.js';
import { Rental } from './rental.js';

// Diagram: Cliente
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
    assertValidBalance(this.balance);
    this.name = requireName(name);
    this.phone = requirePhone(phone);
    this.email = normalizeEmail(email);
    this.cityId = Client.requireCityId(cityId);
    this.bankId = requireBankId(bankId);
    this.accountNumber = requireAccountNumber(accountNumber);
    this.accountType = requireAccountType(accountType);
  }

  private static requireCityId(cityId: string): string {
    if (!cityId.trim()) {
      throw new DomainError(DomainErrorCode.INVALID_CITY, 'The city is not valid');
    }
    return cityId.trim();
  }

  // Diagram: reservarInmueble(). The client creates the rental.
  // propertyRentals and clientRentals are the current (not finished)
  // rentals of the property and of this client; the caller loads them.
  // The rental is not paid here: Bank.transferPayment does it.
  reserveProperty(
    property: Property,
    startDate: Date,
    endDate: Date,
    propertyRentals: Rental[],
    clientRentals: Rental[],
    today: Date,
  ): Rental {
    const rental = new Rental(property.getId(), this.id, startDate, endDate);
    rental.assertCanStartOn(today);

    if (!property.checkAvailability(startDate, endDate, propertyRentals)) {
      throw new DomainError(
        DomainErrorCode.PROPERTY_NOT_AVAILABLE,
        'The property is not available for the selected dates',
      );
    }

    const hasOverlap = clientRentals.some(
      (existing) =>
        existing.getClientId() === this.id &&
        existing.overlaps(startDate, endDate),
    );
    if (hasOverlap) {
      throw new DomainError(
        DomainErrorCode.CLIENT_HAS_OVERLAPPING_RENTAL,
        'The client has an overlapping active or upcoming rental',
      );
    }

    const cost = rental.calculateCost(property.getPricePerNight());
    if (!this.hasEnoughBalance(cost)) {
      throw new DomainError(
        DomainErrorCode.INSUFFICIENT_BALANCE,
        'The client balance is not enough to pay the rental',
      );
    }

    rental.refreshStatus(today);
    return rental;
  }

  // currentRentals are the current (not finished) rentals of this client
  assertCanBeDeleted(currentRentals: Rental[]): void {
    const hasCurrent = currentRentals.some(
      (rental) => rental.getClientId() === this.id,
    );
    if (hasCurrent) {
      throw new DomainError(
        DomainErrorCode.CLIENT_HAS_ACTIVE_RENTALS,
        'The client has active or upcoming rentals',
      );
    }
  }

  changeName(name: string): void {
    this.name = requireName(name);
  }

  changeCityId(cityId: string): void {
    this.cityId = Client.requireCityId(cityId);
  }

  changePhone(phone: string): void {
    this.phone = requirePhone(phone);
  }

  changeEmail(email: string): void {
    this.email = normalizeEmail(email);
  }

  // Returns true if the account changed, so the caller knows whether to
  // check that the new account is not registered by another client
  changeBankAccount(changes: BankAccountChanges): boolean {
    const next = mergeBankAccount(
      {
        bankId: this.bankId,
        accountNumber: this.accountNumber,
        accountType: this.accountType,
      },
      changes,
    );
    if (!next) return false;

    this.bankId = next.bankId;
    this.accountNumber = next.accountNumber;
    this.accountType = next.accountType;
    return true;
  }

  // Manual movements requested by the client
  deposit(amount: number): void {
    this.balance = addToBalance(this.balance, amount);
  }

  withdraw(amount: number): void {
    this.balance = subtractFromBalance(this.balance, amount);
  }

  // Movements of a rental, called by Bank
  pay(amount: number): void {
    this.balance = subtractFromBalance(this.balance, amount);
  }

  receiveRefund(amount: number): void {
    this.balance = addToBalance(this.balance, amount);
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
