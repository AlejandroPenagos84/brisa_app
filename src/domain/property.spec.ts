import { DomainErrorCode } from './errors/domain-error-codes.js';
import { PropertyStatus } from './property.js';
import { IDS, aProperty, aRental, day } from '../../test/domain/builders.js';

describe('Property', () => {
  describe('checkAvailability (consultarDisponibilidad)', () => {
    const start = day('2026-12-10');
    const end = day('2026-12-15');

    it('is available without overlapping rentals', () => {
      const rentals = [aRental('2026-12-20', '2026-12-25')];
      expect(aProperty().checkAvailability(start, end, rentals)).toBe(true);
    });

    it('is not available when a rental overlaps', () => {
      const rentals = [aRental('2026-12-12', '2026-12-18')];
      expect(aProperty().checkAvailability(start, end, rentals)).toBe(false);
    });

    it('is not available when manually inactive', () => {
      expect(aProperty(100, true).checkAvailability(start, end, [])).toBe(false);
    });

    it('ignores rentals of other properties', () => {
      const rentals = [aRental('2026-12-12', '2026-12-18', 0, IDS.otherProperty)];
      expect(aProperty().checkAvailability(start, end, rentals)).toBe(true);
    });
  });

  describe('changeStatus', () => {
    it('is idempotent', () => {
      const property = aProperty();

      property.changeStatus(PropertyStatus.ACTIVE, []);
      expect(property.isManuallyInactive()).toBe(false);

      property.changeStatus(PropertyStatus.INACTIVE, []);
      property.changeStatus(PropertyStatus.INACTIVE, []);
      expect(property.isManuallyInactive()).toBe(true);
    });

    it('can deactivate even with current rentals', () => {
      const property = aProperty();
      property.changeStatus(PropertyStatus.INACTIVE, [aRental('2026-12-10', '2026-12-15')]);
      expect(property.getStatus()).toBe(PropertyStatus.INACTIVE);
    });

    it('cannot reactivate with current rentals', () => {
      const property = aProperty(100, true);
      expect(() =>
        property.changeStatus(PropertyStatus.ACTIVE, [aRental('2026-12-10', '2026-12-15')]),
      ).toThrow(
        expect.objectContaining({ code: DomainErrorCode.PROPERTY_HAS_ACTIVE_RENTALS }),
      );
    });

    it('reactivates without current rentals', () => {
      const property = aProperty(100, true);
      property.changeStatus(PropertyStatus.ACTIVE, []);
      expect(property.getStatus()).toBe(PropertyStatus.ACTIVE);
    });
  });
});
