import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { CreateOwnerCommand } from '@/application/commands/create-owner.command.js';
import { OwnerCommandMapper } from '@/application/mappers/owner-command.mapper.js';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/application/ports/out/repositories/owner-repository.js';
import { Owner } from '@/domain/owner.js';
import { UUID } from '@/utils/types.js';

@Injectable()
export class OwnerService {
  // Nest injects whatever provider is registered with this token
  // (OwnerRepositoryTypeORM, see owner.module.ts)
  constructor(
    @Inject(OWNER_REPOSITORY) private readonly ownerRepository: OwnerRepository,
  ) {}

  async findAll(): Promise<Owner[]> {
    return this.ownerRepository.findAll();
  }

  async findById(id: UUID): Promise<Owner | null> {
    return this.ownerRepository.findById(id);
  }

  async create(command: CreateOwnerCommand): Promise<Owner> {
    const owner = OwnerCommandMapper.fromCreateCommandToDomain(
      randomUUID(),
      command,
    );
    return this.ownerRepository.save(owner);
  }
}
