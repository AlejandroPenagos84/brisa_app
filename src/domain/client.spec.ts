import { Client } from './client.js';
import { DomainErrorCode } from './errors/domain-error-codes.js';
import { RentalStatus } from './rental.js';
import { IDS, aClient, aProperty, aRental, day } from '../../test/domain/builders.js';

describe('Client', () => {
  it('normalizes the email', () => {
    const client = new Client(
      IDS.client, 'Sofía', '320', '  Sofia@Example.COM ', IDS.city,
      IDS.bank, '1002003001', 'Ahorros',
    );
    expect(client.getEmail()).toBe('sofia@example.com');

    client.changeEmail('OTHER@Example.com');
    expect(client.getEmail()).toBe('other@example.com');
  });

  describe('reserveProperty (reservarInmueble)', () => {
    const today = day('2026-12-01');
    const start = day('2026-12-10');
    const end = day('2026-12-15');

    it('creates the rental with its cost', () => {
      const rental = aClient(1000).reserveProperty(aProperty(180), start, end, [], [], today);

      expect(rental.getPropertyId()).toBe(IDS.property);
      expect(rental.getClientId()).toBe(IDS.client);
      expect(rental.getCost()).toBe(900);
      expect(rental.getStatus()).toBe(RentalStatus.UPCOMING);
    });

    it('does not charge the client (the bank does)', () => {
      const client = aClient(1000);
      client.reserveProperty(aProperty(180), start, end, [], [], today);
      expect(client.getBalance()).toBe(1000);
    });

    it('rejects a start date in the past', () => {
      expect(() =>
        aClient().reserveProperty(aProperty(), day('2026-11-30'), end, [], [], today),
      ).toThrow(expect.objectContaining({ code: DomainErrorCode.START_DATE_IN_PAST }));
    });

    it('rejects an unavailable property', () => {
      const propertyRentals = [aRental('2026-12-12', '2026-12-20', 0, IDS.property, IDS.otherClient)];
      expect(() =>
        aClient().reserveProperty(aProperty(), start, end, propertyRentals, [], today),
      ).toThrow(expect.objectContaining({ code: DomainErrorCode.PROPERTY_NOT_AVAILABLE }));
    });

    it('rejects when the client has an overlapping rental', () => {
      const clientRentals = [aRental('2026-12-12', '2026-12-20', 0, IDS.otherProperty)];
      expect(() =>
        aClient().reserveProperty(aProperty(), start, end, [], clientRentals, today),
      ).toThrow(expect.objectContaining({ code: DomainErrorCode.CLIENT_HAS_OVERLAPPING_RENTAL }));
    });

    it('rejects when the balance is not enough', () => {
      expect(() =>
        aClient(899.99).reserveProperty(aProperty(180), start, end, [], [], today),
      ).toThrow(expect.objectContaining({ code: DomainErrorCode.INSUFFICIENT_BALANCE }));
    });
  });

  describe('changeBankAccount', () => {
    it('returns false when nothing changes', () => {
      const client = aClient();
      expect(client.changeBankAccount({ accountNumber: ' 1002003001 ' })).toBe(false);
    });

    it('merges the changes with the current account', () => {
      const client = aClient();
      expect(client.changeBankAccount({ accountType: 'Corriente' })).toBe(true);
      expect(client.getAccountNumber()).toBe('1002003001');
      expect(client.getAccountType()).toBe('Corriente');
    });
  });

  describe('assertCanBeDeleted', () => {
    it('rejects a client with current rentals', () => {
      expect(() => aClient().assertCanBeDeleted([aRental('2026-12-10', '2026-12-15')])).toThrow(
        expect.objectContaining({ code: DomainErrorCode.CLIENT_HAS_ACTIVE_RENTALS }),
      );
    });

    it('allows a client without current rentals', () => {
      expect(() => aClient().assertCanBeDeleted([])).not.toThrow();
    });
  });
});
