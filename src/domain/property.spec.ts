import { Property, PropertyStatus } from '@/domain/property.js';

const makeProperty = (manuallyInactive = false) =>
  new Property(
    'property-1',
    'owner-1',
    'city-1',
    'Calle 1',
    60,
    2,
    4,
    180,
    manuallyInactive,
  );

describe('Property status', () => {
  it('is active by default', () => {
    expect(makeProperty().getStatus()).toBe(PropertyStatus.ACTIVE);
  });

  it('is inactive when manually deactivated', () => {
    expect(makeProperty(true).getStatus()).toBe(PropertyStatus.INACTIVE);
  });

  it('is inactive while occupied', () => {
    const property = makeProperty();
    property.applyOccupancy(true);

    expect(property.getStatus()).toBe(PropertyStatus.INACTIVE);
  });

  it('returns to active when occupancy ends', () => {
    const property = makeProperty();
    property.applyOccupancy(true);
    property.applyOccupancy(false);

    expect(property.getStatus()).toBe(PropertyStatus.ACTIVE);
  });

  it('preserves the manual deactivation after occupancy ends', () => {
    const property = makeProperty(true);
    property.applyOccupancy(true);
    property.applyOccupancy(false);

    expect(property.getStatus()).toBe(PropertyStatus.INACTIVE);
    expect(property.isAvailableForBooking()).toBe(false);
  });
});
