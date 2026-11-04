import { randomUUID } from 'node:crypto';
import {
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';
import { CreateOwnerCommand } from '@/application/commands/create-owner.command.js';
import type { UpdateOwnerCommand } from '@/application/commands/update-owner.command.js';
import type { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import type { OwnerRepository } from '@/application/ports/out/repositories/owner-repository.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import { Owner } from '@/domain/owner.js';
import { Bank } from '@/domain/bank.js';
import { UUID } from '@/utils/types.js';

// Plain class: owner.module.ts builds it with useFactory, so the
// application layer does not depend on Nest
export class OwnerService {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly bankRepository: BankRepository,
    private readonly unitOfWork: UnitOfWork,
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
      command.balance,
    );

    const savedOwner = await this.ownerRepository.save(owner);
    return { owner: savedOwner, bank };
  }

  async deposit(id: UUID, amount: number): Promise<Owner> {
    return this.unitOfWork.run(async ({ ownersRepository }) => {
      const owner = await ownersRepository.findByIdForUpdate(id);
      if (!owner) throw new NotFoundError(`Owner with id ${id} not found`);
      owner.deposit(amount);
      return ownersRepository.update(id, owner);
    });
  }

  async withdraw(id: UUID, amount: number): Promise<Owner> {
    return this.unitOfWork.run(async ({ ownersRepository }) => {
      const owner = await ownersRepository.findByIdForUpdate(id);
      if (!owner) throw new NotFoundError(`Owner with id ${id} not found`);
      owner.discount(amount);
      return ownersRepository.update(id, owner);
    });
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
