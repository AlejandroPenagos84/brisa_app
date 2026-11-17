import { randomUUID } from 'node:crypto';
import type { ReservePropertyCommand } from '@/application/commands/reserve-property.command.js';
import { NotFoundError } from '@/application/errors/application-error.js';
import type { Clock } from '@/application/ports/out/clock.js';
import type { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import type { Reservation } from '@/application/models/reservation.js';

// The client reserves a property and pays it from its bank account. The
// payment is simulated (no gateway): it is always approved. The
// administrator keeps the commission and the owner receives the rest.
// Only loads, calls the domain and saves; the rules live in the domain.
export class ReservePropertyUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly bankRepository: BankRepository,
    private readonly clock: Clock,
  ) {}

  async execute(command: ReservePropertyCommand): Promise<Reservation> {
    const today = this.clock.today();

    return this.unitOfWork.run(async (repos) => {
      // Lock order: client → property → owner → administrator.
      // The client is not modified (it pays outside the app), but locking
      // it serializes its reservations, so the overlap check is reliable.
      const client = await repos.clientsRepository.findByIdForUpdate(
        command.clientId,
      );
      if (!client) {
        throw new NotFoundError(`Client with id ${command.clientId} not found`);
      }

      const property = await repos.propertiesRepository.findByIdForUpdate(
        command.propertyId,
      );
      if (!property) {
        throw new NotFoundError(
          `Property with id ${command.propertyId} not found`,
        );
      }

      const owner = await repos.ownersRepository.findByIdForUpdate(
        property.getOwnerId(),
      );
      if (!owner) {
        throw new Error(`Missing owner for property ${property.getId()}`);
      }

      const administrator =
        await repos.administratorsRepository.getAdministratorForUpdate();

      // Banks are reference data: read outside the transaction
      const bank = await this.bankRepository.findById(client.getBankId());
      if (!bank) {
        throw new Error(`Missing bank for client ${client.getId()}`);
      }

      const [propertyRentals, clientRentals] = await Promise.all([
        repos.rentalsRepository.findCurrentByPropertyId(
          property.getId(),
          today,
        ),
        repos.rentalsRepository.findCurrentByClientId(client.getId(), today),
      ]);

      // Domain: reservarInmueble + girarPago
      const rental = client.reserveProperty(
        property,
        command.startDate,
        command.endDate,
        propertyRentals,
        clientRentals,
        today,
      );
      const transaction = bank.transferPayment(
        client,
        administrator,
        owner,
        rental,
        { id: randomUUID(), createdAt: this.clock.now() },
      );

      await repos.rentalsRepository.save(rental);
      await repos.ownersRepository.update(owner.getId(), owner);
      await repos.administratorsRepository.update(administrator);
      await repos.administratorTransactionsRepository.save(transaction);
      return { rental, payment: transaction, client };
    });
  }
}
