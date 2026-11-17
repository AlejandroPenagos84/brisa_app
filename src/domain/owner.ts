import { UUID } from '@/utils/types.js';
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
import { Property, type PropertyChanges } from './property.js';
import type { Rental } from './rental.js';

// Data of a new property. The owner and the id are set by addProperty
export interface NewPropertyData {
  cityId: string;
  address: string;
  area: number;
  numberOfRooms: number;
  capacity: number;
  pricePerNight: number;
}

// Diagram: Propietario
export class Owner {
  constructor(
    private readonly id: UUID,
    private name: string,
    private phone: string,
    private email: string,
    private bankId: UUID,
    private accountNumber: string,
    private accountType: string,
    // Net amount (90%) of the rentals of the owner's properties
    private balance: number = 0,
  ) {
    assertValidBalance(this.balance);
    this.name = requireName(name);
    this.phone = requirePhone(phone);
    this.email = normalizeEmail(email);
    this.bankId = requireBankId(bankId);
    this.accountNumber = requireAccountNumber(accountNumber);
    this.accountType = requireAccountType(accountType);
  }

  // Diagram: agregarInmueble(). The owner creates the property.
  // The id comes from the caller, like in the rest of the entities.
  addProperty(propertyId: UUID, data: NewPropertyData): Property {
    return new Property(
      propertyId,
      this.id,
      data.cityId,
      data.address,
      data.area,
      data.numberOfRooms,
      data.capacity,
      data.pricePerNight,
    );
  }

  // Diagram: editarInmueble(). currentRentals are the current (not
  // finished) rentals of the property; they are needed to reactivate it.
  editProperty(
    property: Property,
    changes: PropertyChanges,
    currentRentals: Rental[],
  ): Property {
    this.assertOwns(property);
    property.applyChanges(changes, currentRentals);
    return property;
  }

  // Diagram: eliminarInmueble(). Validates; the caller deletes it.
  removeProperty(property: Property, currentRentals: Rental[]): void {
    this.assertOwns(property);

    if (property.hasCurrentRentals(currentRentals)) {
      throw new DomainError(
        DomainErrorCode.PROPERTY_HAS_ACTIVE_RENTALS,
        'The property has active or upcoming rentals',
      );
    }
  }

  // The owner is deleted with its properties and transactions; it is only
  // blocked while one of its properties has a current (not finished)
  // rental. currentRentals can include rentals of other properties.
  assertCanBeDeleted(
    ownedProperties: Property[],
    currentRentals: Rental[],
  ): void {
    const ownedIds = new Set(
      ownedProperties
        .filter((property) => property.getOwnerId() === this.id)
        .map((property) => property.getId()),
    );

    const hasActiveRentals = currentRentals.some((rental) =>
      ownedIds.has(rental.getPropertyId()),
    );
    if (hasActiveRentals) {
      throw new DomainError(
        DomainErrorCode.OWNER_HAS_ACTIVE_RENTALS,
        'A property of the owner has active or upcoming rentals',
      );
    }
  }

  private assertOwns(property: Property): void {
    if (property.getOwnerId() !== this.id) {
      throw new DomainError(
        DomainErrorCode.PROPERTY_NOT_OWNED,
        'The property does not belong to the owner',
      );
    }
  }

  changeName(name: string): void {
    this.name = requireName(name);
  }

  changePhone(phone: string): void {
    this.phone = requirePhone(phone);
  }

  changeEmail(email: string): void {
    this.email = normalizeEmail(email);
  }

  // Returns true if the account changed
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

  // The balance only changes through the administrator: the net amount of
  // a rental when it is paid, and back when it is cancelled
  receivePayment(netAmount: number): void {
    this.balance = addToBalance(this.balance, netAmount);
  }

  returnPayment(netAmount: number): void {
    this.balance = subtractFromBalance(this.balance, netAmount);
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
      bankId: this.bankId,
      accountNumber: this.accountNumber,
      accountType: this.accountType,
      balance: this.balance,
    };
  }
}
