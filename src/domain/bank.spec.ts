import { TransactionType } from './administrator-transaction.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';
import {
  IDS,
  aBank,
  aClient,
  aRental,
  anAdministrator,
  anOwner,
  day,
} from '../../test/domain/builders.js';

const meta = { id: 'tx-1', createdAt: day('2026-12-01') };

describe('Bank', () => {
  describe('transferPayment (girarPago)', () => {
    it('moves the cost from the client to the administrator and the owner', () => {
      const client = aClient(1000);
      const administrator = anAdministrator(0);
      const owner = anOwner(0);
      const rental = aRental('2026-12-10', '2026-12-15', 500);

      const transaction = aBank().transferPayment(client, administrator, owner, rental, meta);

      expect(client.getBalance()).toBe(500);
      expect(administrator.getBalance()).toBe(50);
      expect(owner.getBalance()).toBe(450);
      expect(transaction.getData()).toEqual({
        id: 'tx-1',
        administratorId: IDS.administrator,
        ownerId: IDS.owner,
        type: TransactionType.PAYMENT,
        grossAmount: 500,
        commission: 50,
        netAmount: 450,
        createdAt: meta.createdAt,
      });
    });

    it("must go through the client's bank", () => {
      expect(() =>
        aBank(IDS.otherBank).transferPayment(
          aClient(1000), anAdministrator(), anOwner(),
          aRental('2026-12-10', '2026-12-15', 500), meta,
        ),
      ).toThrow(expect.objectContaining({ code: DomainErrorCode.PAYMENT_BANK_MISMATCH }));
    });

    it('rejects when the client cannot pay', () => {
      expect(() =>
        aBank().transferPayment(
          aClient(100), anAdministrator(), anOwner(),
          aRental('2026-12-10', '2026-12-15', 500), meta,
        ),
      ).toThrow(expect.objectContaining({ code: DomainErrorCode.INSUFFICIENT_BALANCE }));
    });
  });

  describe('refundPayment', () => {
    it('gives the whole cost back to the client', () => {
      const client = aClient(500);
      const administrator = anAdministrator(50);
      const owner = anOwner(450);
      const rental = aRental('2026-12-10', '2026-12-15', 500);

      const transaction = aBank().refundPayment(client, administrator, owner, rental, meta);

      expect(client.getBalance()).toBe(1000);
      expect(administrator.getBalance()).toBe(0);
      expect(owner.getBalance()).toBe(0);
      expect(transaction.getType()).toBe(TransactionType.REFUND);
      expect(transaction.getSignedNetAmount()).toBe(-450);
    });

    it('rejects when the owner balance is not enough, without changing anything', () => {
      const client = aClient(500);
      const administrator = anAdministrator(50);
      const owner = anOwner(100);

      expect(() =>
        aBank().refundPayment(
          client, administrator, owner,
          aRental('2026-12-10', '2026-12-15', 500), meta,
        ),
      ).toThrow(expect.objectContaining({ code: DomainErrorCode.INSUFFICIENT_BALANCE }));
      expect(client.getBalance()).toBe(500);
      expect(administrator.getBalance()).toBe(50);
      expect(owner.getBalance()).toBe(100);
    });
  });
});
