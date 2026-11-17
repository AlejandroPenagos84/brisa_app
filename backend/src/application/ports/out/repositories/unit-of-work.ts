import { ClientRepository } from "./client-repository.js";
import { OwnerRepository } from "./owner-repository.js";
import { PropertyRepository } from "./property-repository.js";
import { RentalRepository } from "./rental-repository.js";

export const UNIT_OF_WORK = Symbol('UnitOfWork');

export interface TransactionalRepositories{
    clientsRepository: ClientRepository;
    ownersRepository: OwnerRepository;
    propertiesRepository: PropertyRepository;
    rentalsRepository: RentalRepository;
}

export interface UnitOfWork {
    run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
}