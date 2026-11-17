import { DomainErrorCode } from './errors/domain-error-codes.js';
import { PropertyStatus } from './property.js';
import { IDS, aProperty, aRental, anOwner } from '../../test/domain/builders.js';

const newPropertyData = {
  cityId: IDS.city,
  address: 'Carrera 80 #34-12',
  area: 100,
  numberOfRooms: 3,
  capacity: 6,
  pricePerNight: 250,
};

describe('Owner', () => {
  describe('addProperty (agregarInmueble)', () => {
    it('creates a property that belongs to the owner', () => {
      const property = anOwner().addProperty(IDS.property, newPropertyData);

      expect(property.getId()).toBe(IDS.property);
      expect(property.getOwnerId()).toBe(IDS.owner);
      expect(property.getPricePerNight()).toBe(250);
      expect(property.getStatus()).toBe(PropertyStatus.ACTIVE);
    });
  });

  describe('editProperty (editarInmueble)', () => {
    it('applies only the given changes', () => {
      const property = anOwner().editProperty(aProperty(100), { pricePerNight: 150 }, []);

      expect(property.getPricePerNight()).toBe(150);
      expect(property.getCapacity()).toBe(4);
    });

    it('rejects a property of another owner', () => {
      const property = aProperty(100, false, IDS.otherOwner);
      expect(() => anOwner().editProperty(property, { capacity: 2 }, [])).toThrow(
        expect.objectContaining({ code: DomainErrorCode.PROPERTY_NOT_OWNED }),
      );
    });
  });

  describe('removeProperty (eliminarInmueble)', () => {
    it('rejects a property with current rentals', () => {
      expect(() =>
        anOwner().removeProperty(aProperty(), [aRental('2026-12-10', '2026-12-15')]),
      ).toThrow(
        expect.objectContaining({ code: DomainErrorCode.PROPERTY_HAS_ACTIVE_RENTALS }),
      );
    });

    it('allows a property without current rentals', () => {
      expect(() => anOwner().removeProperty(aProperty(), [])).not.toThrow();
    });
  });

  describe('assertCanBeDeleted', () => {
    it('rejects an owner with properties', () => {
      expect(() => anOwner().assertCanBeDeleted([aProperty()])).toThrow(
        expect.objectContaining({ code: DomainErrorCode.OWNER_HAS_PROPERTIES }),
      );
    });
  });
});
