import { TransactionalRepositories, UnitOfWork } from "@/application/ports/out/repositories/unit-of-work.js";
import { Injectable } from "@nestjs/common";
import { PropertyRepositoryTypeORM } from "./repositories_impl/property-repository-typeorm.js";
import { RentalRepositoryTypeORM } from "./repositories_impl/rental-repository-typeorm.js";
import { ClientRepositoryTypeORM } from "./repositories_impl/client-repository-typeorm.js";
import { OwnerRepositoryTypeORM } from "./repositories_impl/owner-repository-typeorm.js";
import { DataSource } from "typeorm";

@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {

    constructor(private readonly dataSource: DataSource) {}

    run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work({
        clientsRepository: new ClientRepositoryTypeORM(manager),
        ownersRepository: new OwnerRepositoryTypeORM(manager),
        rentalsRepository: new RentalRepositoryTypeORM(manager),
        propertiesRepository: new PropertyRepositoryTypeORM(manager),
      }),
    );
    }

}