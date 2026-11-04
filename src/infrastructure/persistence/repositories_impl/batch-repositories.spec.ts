import { DataSource, In } from 'typeorm';
import { vi } from 'vitest';
import { OwnerEntity } from '../entities/owner.entity.js';
import { RentalEntity } from '../entities/rental.entity.js';
import { OwnerRepositoryTypeORM } from './owner-repository-typeorm.js';
import { RentalRepositoryTypeORM } from './rental-repository-typeorm.js';

describe('batch repository queries', () => {
  // No connection is opened: only the query boundary is mocked.
  const dataSource = new DataSource({ type: 'postgres' });

  afterEach(() => vi.restoreAllMocks());

  it('does not query owners for an empty batch', async () => {
    const orm = dataSource.getRepository(OwnerEntity);
    const find = vi.spyOn(orm, 'findBy').mockResolvedValue([]);
    const repository = new OwnerRepositoryTypeORM(orm);

    expect(await repository.findByIds([])).toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });

  it('fetches an owner batch in one query and returns domain objects', async () => {
    const orm = dataSource.getRepository(OwnerEntity);
    const entity = Object.assign(new OwnerEntity(), {
      id: 'owner-1',
      name: 'Ana',
      phone: '3001234567',
      email: 'ana@example.com',
      bankId: 'bank-1',
    });
    const find = vi.spyOn(orm, 'findBy').mockResolvedValue([entity]);
    const repository = new OwnerRepositoryTypeORM(orm);

    const owners = await repository.findByIds(['owner-1', 'missing']);

    expect(find).toHaveBeenCalledExactlyOnceWith({
      id: In(['owner-1', 'missing']),
    });
    expect(owners.map((owner) => owner.getData())).toEqual([
      {
        id: entity.id,
        name: entity.name,
        phone: entity.phone,
        email: entity.email,
        bankId: entity.bankId,
      },
    ]);
  });

  it('does not issue an unrestricted rental query for an empty batch', async () => {
    const orm = dataSource.getRepository(RentalEntity);
    const find = vi.spyOn(orm, 'findBy').mockResolvedValue([]);
    const repository = new RentalRepositoryTypeORM(orm);

    expect(await repository.findByKeys([])).toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });

  it('keeps each composite rental key together in a single OR query', async () => {
    const orm = dataSource.getRepository(RentalEntity);
    const find = vi.spyOn(orm, 'findBy').mockResolvedValue([]);
    const repository = new RentalRepositoryTypeORM(orm);

    await repository.findByKeys([
      {
        propertyId: 'property-1',
        clientId: 'client-1',
        startDate: new Date('2026-11-01'),
      },
      {
        propertyId: 'property-2',
        clientId: 'client-2',
        startDate: new Date('2026-11-05'),
      },
    ]);

    expect(find).toHaveBeenCalledExactlyOnceWith([
      {
        propertyId: 'property-1',
        clientId: 'client-1',
        checkInDate: '2026-11-01',
      },
      {
        propertyId: 'property-2',
        clientId: 'client-2',
        checkInDate: '2026-11-05',
      },
    ]);
  });
});
