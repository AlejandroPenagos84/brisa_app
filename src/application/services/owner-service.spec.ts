import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { BANK_REPOSITORY } from '@/application/ports/out/repositories/bank-repository.js';
import { OWNER_REPOSITORY } from '@/application/ports/out/repositories/owner-repository.js';
import { OwnerService } from '@/application/services/owner-service.js';
import { Owner } from '@/domain/owner.js';

const makeOwner = () =>
  new Owner(
    'owner-1',
    'Ana',
    '3001234567',
    'ana@example.com',
    'bank-1',
  );

const bank = {
  getId: () => 'bank-1',
  getName: () => 'Bancolombia',
};

describe('OwnerService', () => {
  const owners = {
    findAll: vi.fn(),
    findByIds: vi.fn(),
    findById: vi.fn(),
    existsByEmail: vi.fn(),
    hasProperties: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const banks = {
    findById: vi.fn(),
  };

  let service: OwnerService;

  beforeEach(async () => {
    vi.resetAllMocks();

    owners.findById.mockResolvedValue(makeOwner());
    owners.existsByEmail.mockResolvedValue(false);
    owners.hasProperties.mockResolvedValue(false);
    owners.save.mockImplementation((value: Owner) => Promise.resolve(value));
    owners.update.mockImplementation((_id: string, value: Owner) =>
      Promise.resolve(value),
    );
    owners.delete.mockResolvedValue(true);
    banks.findById.mockResolvedValue(bank);

    const module = await Test.createTestingModule({
      providers: [
        OwnerService,
        { provide: OWNER_REPOSITORY, useValue: owners },
        { provide: BANK_REPOSITORY, useValue: banks },
      ],
    }).compile();
    service = module.get(OwnerService);
  });

  describe('update', () => {
    it('rejects a bank that does not exist', async () => {
      banks.findById.mockResolvedValue(null);

      await expect(
        service.update('owner-1', { bankId: 'missing-bank' }),
      ).rejects.toThrow(NotFoundException);
      expect(owners.update).not.toHaveBeenCalled();
    });

    it('rejects an email already used by another owner', async () => {
      owners.existsByEmail.mockResolvedValue(true);

      await expect(
        service.update('owner-1', { email: 'other@example.com' }),
      ).rejects.toThrow(ConflictException);
      expect(owners.existsByEmail).toHaveBeenCalledWith(
        'other@example.com',
        'owner-1',
      );
      expect(owners.update).not.toHaveBeenCalled();
    });

  });

  describe('create', () => {
    it('rejects an email already registered', async () => {
      owners.existsByEmail.mockResolvedValue(true);

      await expect(
        service.create({
          name: 'Ana',
          phone: '3001234567',
          email: 'ana@example.com',
          bankId: 'bank-1',
        }),
      ).rejects.toThrow(ConflictException);
      expect(owners.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('blocks deletion when the owner has properties', async () => {
      owners.hasProperties.mockResolvedValue(true);

      await expect(service.delete('owner-1')).rejects.toThrow(
        ConflictException,
      );
      expect(owners.delete).not.toHaveBeenCalled();
    });

    it('deletes an owner without properties', async () => {
      expect(await service.delete('owner-1')).toBe(true);
      expect(owners.delete).toHaveBeenCalledExactlyOnceWith('owner-1');
    });
  });
});
