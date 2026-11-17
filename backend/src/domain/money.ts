import { DomainError } from './errors/domain-error.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';

// Balances are NUMERIC(12,2) in the database: up to 9,999,999,999.99
const MAX_BALANCE_IN_CENTS = 999_999_999_999;

// Amounts are computed in cents to avoid floating point errors
// (0.1 + 0.2 = 0.30000000000000004)
function hasAtMostTwoDecimals(value: number): boolean {
  return (
    Number.isFinite(value) &&
    Math.abs(value * 100 - Math.round(value * 100)) < 1e-6
  );
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

export function assertValidBalance(balance: number): void {
  if (
    !hasAtMostTwoDecimals(balance) ||
    balance < 0 ||
    toCents(balance) > MAX_BALANCE_IN_CENTS
  ) {
    throw new DomainError(
      DomainErrorCode.INVALID_BALANCE,
      'The balance is not valid',
    );
  }
}

function assertValidAmount(amount: number): void {
  if (!hasAtMostTwoDecimals(amount) || amount <= 0) {
    throw new DomainError(
      DomainErrorCode.INVALID_AMOUNT,
      'The amount must be greater than zero',
    );
  }
}

// Returns the new balance after adding amount
export function addToBalance(balance: number, amount: number): number {
  assertValidAmount(amount);

  const newBalanceInCents = toCents(balance) + toCents(amount);
  if (newBalanceInCents > MAX_BALANCE_IN_CENTS) {
    throw new DomainError(
      DomainErrorCode.BALANCE_LIMIT_EXCEEDED,
      'The balance exceeds the maximum allowed',
    );
  }

  return fromCents(newBalanceInCents);
}

// Returns the new balance after subtracting amount
export function subtractFromBalance(balance: number, amount: number): number {
  assertValidAmount(amount);

  const balanceInCents = toCents(balance);
  const amountInCents = toCents(amount);
  if (amountInCents > balanceInCents) {
    throw new DomainError(
      DomainErrorCode.INSUFFICIENT_BALANCE,
      'Insufficient balance',
    );
  }

  return fromCents(balanceInCents - amountInCents);
}

export function isBalanceEnough(balance: number, amount: number): boolean {
  return toCents(amount) <= toCents(balance);
}
