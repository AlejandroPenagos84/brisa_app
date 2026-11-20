import type { UUID } from '@/utils/types.js';
import {
  AdministratorTransaction,
  type TransactionMeta,
  TransactionType,
} from './administrator-transaction.js';
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
  splitByRate,
} from './money.js';
import type { Owner } from './owner.js';

// Receives the money of every rental, keeps the commission and passes the
// net amount to the owner. There is a single administrator.
export class Administrator {
  static readonly COMMISSION_RATE = 0.1;

  constructor(
    private readonly id: UUID,
    private name: string,
    private phone: string,
    private email: string,
    private bankId: UUID,
    private accountNumber: string,
    private accountType: string,
    // Accumulated commissions
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

  // The client paid grossAmount: the administrator keeps the commission
  // and the owner receives the rest
  receivePayment(
    owner: Owner,
    grossAmount: number,
    meta: TransactionMeta,
  ): AdministratorTransaction {
    const { part: commission, rest: netAmount } = splitByRate(
      grossAmount,
      Administrator.COMMISSION_RATE,
    );

    // Computed before changing anything, so a failure leaves both intact
    const newBalance =
      commission > 0 ? addToBalance(this.balance, commission) : this.balance;
    owner.receivePayment(netAmount);
    this.balance = newBalance;

    return this.createTransaction(
      owner,
      TransactionType.PAYMENT,
      grossAmount,
      commission,
      netAmount,
      meta,
    );
  }

  // A rental of grossAmount was cancelled: the administrator keeps the
  // commission and only the owner gives the net amount back, so the
  // client recovers grossAmount minus the commission. The REFUND records
  // only the money that moves: gross = net, commission = 0.
  refundPayment(
    owner: Owner,
    grossAmount: number,
    meta: TransactionMeta,
  ): AdministratorTransaction {
    const { rest: netAmount } = splitByRate(
      grossAmount,
      Administrator.COMMISSION_RATE,
    );

    if (!owner.hasEnoughBalance(netAmount)) {
      throw new DomainError(
        DomainErrorCode.INSUFFICIENT_BALANCE,
        'The owner balance is not enough to refund the rental',
      );
    }

    owner.returnPayment(netAmount);

    return this.createTransaction(
      owner,
      TransactionType.REFUND,
      netAmount,
      0,
      netAmount,
      meta,
    );
  }

  private createTransaction(
    owner: Owner,
    type: TransactionType,
    grossAmount: number,
    commission: number,
    netAmount: number,
    meta: TransactionMeta,
  ): AdministratorTransaction {
    return new AdministratorTransaction(
      meta.id,
      this.id,
      owner.getId(),
      type,
      grossAmount,
      commission,
      netAmount,
      meta.createdAt,
    );
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
