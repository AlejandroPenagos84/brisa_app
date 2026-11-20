import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@/application/errors/application-error.js';
import type { Clock } from '@/application/ports/out/clock.js';
import type { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import type { RentalKey } from '@/domain/rental.js';

// Cancels an upcoming rental: the owner gives back the net amount and the
// administrator keeps the commission, so the client recovers the cost
// minus the commission in its bank account (simulated, outside the app).
// The PAYMENT transaction is kept and a REFUND is added.
export class CancelRentalUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly bankRepository: BankRepository,
    private readonly clock: Clock,
  ) {}

  async execute(key: RentalKey): Promise<void> {
    const today = this.clock.today();

    await this.unitOfWork.run(async (repos) => {
      const rental = await repos.rentalsRepository.findByKey(key);
      if (!rental) throw new NotFoundError('Rental not found');

      // Lock order: client → property → owner → administrator
      const client = await repos.clientsRepository.findByIdForUpdate(
        rental.getClientId(),
      );
      if (!client) {
        throw new Error('Missing client for rental'); // broken integrity -> 500
      }

      const property = await repos.propertiesRepository.findByIdForUpdate(
        rental.getPropertyId(),
      );
      if (!property) {
        throw new Error('Missing property for rental'); // broken integrity -> 500
      }

      const owner = await repos.ownersRepository.findByIdForUpdate(
        property.getOwnerId(),
      );
      if (!owner) {
        throw new Error(`Missing owner for property ${property.getId()}`);
      }

      const administrator =
        await repos.administratorsRepository.getAdministratorForUpdate();

      const bank = await this.bankRepository.findById(client.getBankId());
      if (!bank) {
        throw new Error(`Missing bank for client ${client.getId()}`);
      }

      // Domain: only upcoming rentals with a cost; the inverse of girarPago
      rental.assertCanBeCancelled(today);
      const transaction = bank.refundPayment(
        client,
        administrator,
        owner,
        rental,
        { id: randomUUID(), createdAt: this.clock.now() },
      );

      // If another cancellation won: 0 rows -> NotFoundError -> rollback
      await repos.rentalsRepository.delete(key);
      await repos.ownersRepository.update(owner.getId(), owner);
      await repos.administratorsRepository.update(administrator);
      await repos.administratorTransactionsRepository.save(transaction);
    });
  }
}
