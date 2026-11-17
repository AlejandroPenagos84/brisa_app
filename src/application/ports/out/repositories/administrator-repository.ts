import { Administrator } from '@/domain/administrator.js';

export const ADMINISTRATOR_REPOSITORY = Symbol('AdministratorRepository');

// There is a single administrator, created by script.sql. Both getters
// throw if it does not exist: it is a broken installation, not a 404.
export interface AdministratorRepository {
  getAdministrator(): Promise<Administrator>;
  // Locks the row until the transaction ends. Only valid inside UnitOfWork.run
  getAdministratorForUpdate(): Promise<Administrator>;
  update(administrator: Administrator): Promise<Administrator>;
}
