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

// amount × times, computed in cents (e.g. price per night × nights)
export function multiplyAmount(amount: number, times: number): number {
  assertValidAmount(amount);
  if (!Number.isInteger(times) || times <= 0) {
    throw new DomainError(
      DomainErrorCode.INVALID_AMOUNT,
      'The multiplier must be a positive integer',
    );
  }

  return fromCents(toCents(amount) * times);
}

export interface AmountSplit {
  // amount × rate, rounded to the nearest cent
  part: number;
  // amount − part, so part + rest is always exactly amount
  rest: number;
}

export function splitByRate(amount: number, rate: number): AmountSplit {
  assertValidAmount(amount);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new DomainError(DomainErrorCode.INVALID_AMOUNT, 'The rate is not valid');
  }

  const totalInCents = toCents(amount);
  const partInCents = Math.round(totalInCents * rate);
  return {
    part: fromCents(partInCents),
    rest: fromCents(totalInCents - partInCents),
  };
}

export function sumAmounts(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

export function isSameAmount(a: number, b: number): boolean {
  return toCents(a) === toCents(b);
}
