import { DomainErrorCode } from './errors/domain-error-codes.js';
import { RentalStatus } from './rental.js';
import { aRental, day } from '../../test/domain/builders.js';

describe('Rental', () => {
  describe('calculateCost (calcularCosto)', () => {
    it('is nights × price per night', () => {
      const rental = aRental('2026-12-10', '2026-12-15');

      expect(rental.calculateCost(180)).toBe(900);
      expect(rental.getCost()).toBe(900);
      expect(rental.getNights()).toBe(5);
    });

    it('has no floating point errors', () => {
      const rental = aRental('2026-12-10', '2026-12-13');
      expect(rental.calculateCost(33.33)).toBe(99.99);
    });
  });

  describe('overlaps', () => {
    const rental = aRental('2026-12-10', '2026-12-15');

    it('detects a range inside or crossing the rental', () => {
      expect(rental.overlaps(day('2026-12-12'), day('2026-12-13'))).toBe(true);
      expect(rental.overlaps(day('2026-12-05'), day('2026-12-11'))).toBe(true);
    });

    it('is inclusive at both ends, like the database constraint', () => {
      expect(rental.overlaps(day('2026-12-15'), day('2026-12-20'))).toBe(true);
      expect(rental.overlaps(day('2026-12-01'), day('2026-12-10'))).toBe(true);
    });

    it('does not overlap separate ranges', () => {
      expect(rental.overlaps(day('2026-12-16'), day('2026-12-20'))).toBe(false);
    });
  });

  describe('refreshStatus', () => {
    it('returns whether the status changed', () => {
      const rental = aRental('2026-12-10', '2026-12-15');

      expect(rental.refreshStatus(day('2026-12-01'))).toBe(false);
      expect(rental.refreshStatus(day('2026-12-10'))).toBe(true);
      expect(rental.getStatus()).toBe(RentalStatus.ACTIVE);
      expect(rental.refreshStatus(day('2026-12-15'))).toBe(true);
      expect(rental.getStatus()).toBe(RentalStatus.FINISHED);
    });
  });

  describe('assertCanBeCancelled', () => {
    it('allows an upcoming rental with cost', () => {
      const rental = aRental('2026-12-10', '2026-12-15', 900);
      expect(() => rental.assertCanBeCancelled(day('2026-12-01'))).not.toThrow();
    });

    it('rejects a rental that already started', () => {
      const rental = aRental('2026-12-10', '2026-12-15', 900);
      expect(() => rental.assertCanBeCancelled(day('2026-12-10'))).toThrow(
        expect.objectContaining({ code: DomainErrorCode.RENTAL_ALREADY_STARTED }),
      );
    });

    it('rejects a rental without cost', () => {
      const rental = aRental('2026-12-10', '2026-12-15', 0);
      expect(() => rental.assertCanBeCancelled(day('2026-12-01'))).toThrow(
        expect.objectContaining({ code: DomainErrorCode.RENTAL_HAS_NO_COST }),
      );
    });
  });
});
