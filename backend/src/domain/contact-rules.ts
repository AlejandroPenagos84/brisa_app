import { DomainError } from './errors/domain-error.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';

// Rules shared by Client, Owner and Administrator. Each function validates
// and returns the normalized value, so the entity assigns what it returns.

export function requireName(name: string): string {
  const value = name.trim();
  if (!value) {
    throw new DomainError(DomainErrorCode.NAME_REQUIRED, 'The name is required');
  }
  return value;
}

export function requirePhone(phone: string): string {
  const value = phone.trim();
  if (!value) {
    throw new DomainError(DomainErrorCode.PHONE_REQUIRED, 'The phone is required');
  }
  return value;
}

// Emails are compared without case: the database has a unique index on
// LOWER(email)
export function normalizeEmail(email: string): string {
  const value = email.trim().toLowerCase();
  if (!value) {
    throw new DomainError(DomainErrorCode.EMAIL_REQUIRED, 'The email is required');
  }
  return value;
}

export function requireBankId(bankId: string): string {
  const value = bankId.trim();
  if (!value) {
    throw new DomainError(DomainErrorCode.INVALID_BANK, 'The bank is not valid');
  }
  return value;
}

export function requireAccountNumber(accountNumber: string): string {
  const value = accountNumber.trim();
  if (!value) {
    throw new DomainError(DomainErrorCode.ACCOUNT_NUMBER_REQUIRED, 'The account number is required');
  }
  return value;
}

export function requireAccountType(accountType: string): string {
  const value = accountType.trim();
  if (!value) {
    throw new DomainError(DomainErrorCode.ACCOUNT_TYPE_REQUIRED, 'The account type is required');
  }
  return value;
}

export interface BankAccountChanges {
  bankId?: string;
  accountNumber?: string;
  accountType?: string;
}

export interface BankAccountData {
  bankId: string;
  accountNumber: string;
  accountType: string;
}

// Merges the changes into the current account. Returns null when nothing
// changes, so the entity can report whether it changed.
export function mergeBankAccount(
  current: BankAccountData,
  changes: BankAccountChanges,
): BankAccountData | null {
  const next: BankAccountData = {
    bankId:
      changes.bankId !== undefined
        ? requireBankId(changes.bankId)
        : current.bankId,
    accountNumber:
      changes.accountNumber !== undefined
        ? requireAccountNumber(changes.accountNumber)
        : current.accountNumber,
    accountType:
      changes.accountType !== undefined
        ? requireAccountType(changes.accountType)
        : current.accountType,
  };

  const changed =
    next.bankId !== current.bankId ||
    next.accountNumber !== current.accountNumber ||
    next.accountType !== current.accountType;

  return changed ? next : null;
}
