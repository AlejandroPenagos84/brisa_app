import { Administrator } from './administrator.js';
import { TransactionType } from './administrator-transaction.js';
import { Owner } from './owner.js';

const meta = (id: string) => ({ id, createdAt: new Date('2026-11-01T00:00:00Z') });

function setup() {
  const administrator = new Administrator(
    'admin-1',
    'Brisa',
    '3001234567',
    'admin@brisa.co',
    'bank-1',
    '1234-5678-9012-3456',
    'Ahorros',
  );
  const owner = new Owner(
    'owner-1',
    'Ana',
    '3007654321',
    'ana@brisa.co',
    'bank-1',
    '6543-2109-8765-4321',
    'Ahorros',
  );
  return { administrator, owner };
}

describe('Administrator.refundPayment', () => {
  it('keeps the commission and refunds only the net amount', () => {
    const { administrator, owner } = setup();
    administrator.receivePayment(owner, 300, meta('payment-1'));

    const refund = administrator.refundPayment(owner, 300, meta('refund-1'));

    expect(refund.getType()).toBe(TransactionType.REFUND);
    expect(refund.getGrossAmount()).toBe(270);
    expect(refund.getCommission()).toBe(0);
    expect(refund.getNetAmount()).toBe(270);
    expect(administrator.getBalance()).toBe(30);
    expect(owner.getBalance()).toBe(0);
  });
});
