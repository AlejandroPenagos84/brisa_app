import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';
import { CreateOwnerCommand } from '@/application/commands/create-owner.command.js';
import type { UpdateOwnerCommand } from '@/application/commands/update-owner.command.js';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '@/application/ports/out/repositories/bank-repository.js';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/application/ports/out/repositories/owner-repository.js';
import { Owner } from '@/domain/owner.js';
import { Bank } from '@/domain/bank.js';
import { UUID } from '@/utils/types.js';

@Injectable()
export class OwnerService {
  // Nest injects whatever provider is registered with this token
  // (OwnerRepositoryTypeORM, see owner.module.ts)
  constructor(
    @Inject(OWNER_REPOSITORY) private readonly ownerRepository: OwnerRepository,
    @Inject(BANK_REPOSITORY) private readonly bankRepository: BankRepository,
  ) {}

  async findByIds(ids: UUID[]): Promise<Owner[]> {
    return this.ownerRepository.findByIds(ids);
  }

  async findAll(): Promise<Owner[]> {
    return this.ownerRepository.findAll();
  }

  async findById(id: UUID): Promise<Owner | null> {
    return this.ownerRepository.findById(id);
  }

  async update(id: UUID, command: UpdateOwnerCommand): Promise<Owner> {
    const owner = await this.ownerRepository.findById(id);
    if (!owner) {
      throw new NotFoundError(`Owner with id ${id} not found`);
    }

    if (command.bankId !== undefined) {
      const bank = await this.bankRepository.findById(command.bankId);
      if (!bank) {
        throw new NotFoundError(
          `Bank with id ${command.bankId} not found`,
        );
      }
    }

    const email =
      command.email !== undefined
        ? command.email.trim().toLowerCase()
        : undefined;

    if (email !== undefined) {
      const emailExists = await this.ownerRepository.existsByEmail(
        email,
        id,
      );
      if (emailExists) {
        throw new ConflictError('The email is already registered');
      }
    }

    if (command.name !== undefined) {
      owner.changeName(command.name.trim());
    }
    if (command.phone !== undefined) {
      owner.changePhone(command.phone.trim());
    }
    if (email !== undefined) {
      owner.changeEmail(email);
    }
    if (command.bankId !== undefined) {
      owner.changeBank(command.bankId);
    }

    return this.ownerRepository.update(id, owner);
  }

  async create(
    command: CreateOwnerCommand,
  ): Promise<{ owner: Owner; bank: Bank }> {
    const bank = await this.bankRepository.findById(command.bankId);
    if (!bank) {
      throw new NotFoundError(`Bank with id ${command.bankId} not found`);
    }

    const email = command.email.trim().toLowerCase();
    if (await this.ownerRepository.existsByEmail(email)) {
      throw new ConflictError('The email is already registered');
    }

    const owner = new Owner(
      randomUUID(),
      command.name,
      command.phone,
      email,
      command.bankId,
    );

    const savedOwner = await this.ownerRepository.save(owner);
    return { owner: savedOwner, bank };
  }

  async delete(id: UUID): Promise<boolean> {
    if (await this.ownerRepository.hasProperties(id)) {
      throw new ConflictError(
        `Owner with id ${id} has properties and cannot be deleted`,
      );
    }

    return this.ownerRepository.delete(id);
  }
}
