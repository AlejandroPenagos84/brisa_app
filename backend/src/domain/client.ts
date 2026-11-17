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
  ) {
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
  // The rental is not paid here: Bank.transferPayment does it. The client
  // pays from its own bank account, outside the app, so there is no
  // balance to check.
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

    rental.calculateCost(property.getPricePerNight());

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
    };
  }
}
