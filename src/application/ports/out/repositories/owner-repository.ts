import { Owner } from '@/domain/owner.js';
import { UUID } from '@/utils/types.js';

export const OWNER_REPOSITORY = Symbol('OwnerRepository');

export interface OwnerRepository {
  findAll(): Promise<Owner[]>;
  findByIds(ids: UUID[]): Promise<Owner[]>;
  findById(id: UUID): Promise<Owner | null>;
  save(owner: Owner): Promise<Owner>;
  update(id: UUID, owner: Owner): Promise<Owner>;
  delete(id: UUID): Promise<boolean>;
}
