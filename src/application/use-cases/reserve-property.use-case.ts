import { randomUUID } from 'node:crypto';
import type { ReservePropertyCommand } from '@/application/commands/reserve-property.command.js';
import { NotFoundError } from '@/application/errors/application-error.js';
import type { Clock } from '@/application/ports/out/clock.js';
import type { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import type { Rental } from '@/domain/rental.js';

// The client reserves a property and pays it through its bank: the
// administrator keeps the commission and the owner receives the rest.
// Only loads, calls the domain and saves; the rules live in the domain.
export class ReservePropertyUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly bankRepository: BankRepository,
    private readonly clock: Clock,
  ) {}

  async execute(command: ReservePropertyCommand): Promise<Rental> {
    const today = this.clock.today();

    return this.unitOfWork.run(async (repos) => {
      // Lock order: client → property → owner → administrator
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
      await repos.clientsRepository.update(client.getId(), client);
      await repos.ownersRepository.update(owner.getId(), owner);
      await repos.administratorsRepository.update(administrator);
      await repos.administratorTransactionsRepository.save(transaction);
      return rental;
    });
  }
}
