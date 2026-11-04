# Unit of Work para crear y cancelar rentas

Plan pendiente de implementar. Revisar el código antes de empezar: los nombres
y las líneas pueden haber cambiado.

## Problemas actuales

### 1. El repositorio de rentas escribe clientes

`RentalRepositoryTypeORM.saveWithClient` y `deleteWithClient` guardan
`ClientEntity`, y el puerto `RentalRepository` recibe un `Client`. Un
repositorio debería persistir solo su propio agregado.

### 2. La transacción cubre las escrituras pero no las lecturas

En `RentalService.save`, el cliente se lee fuera de la transacción, el saldo
se descuenta en memoria y después se guarda el saldo completo. Con dos
peticiones simultáneas:

- El cliente tiene 1000 y pide dos rentas de 900 en fechas que no se solapan
  (la restricción de solapamiento no las frena).
- Las dos leen 1000, las dos calculan 100 y las dos guardan 100.
- Resultado: dos rentas por 1800 con solo 900 descontados. El
  `CHECK balance >= 0` no lo detecta porque cada escritura guarda 100.

Lo mismo pasa si un `deposit` o `withdraw` coincide con crear o cancelar una
renta: uno de los cambios de saldo se pierde.

La doble cancelación sí está protegida: el segundo `delete` afecta 0 filas,
lanza el error y hace rollback.

Una Unit of Work sola no arregla el problema 2. Las lecturas tienen que ocurrir
dentro de la transacción y bloquear la fila del cliente.

## Objetivo

1. Crear y cancelar una renta en una sola transacción que incluya las
   lecturas, con la fila del cliente bloqueada (`SELECT ... FOR UPDATE`).
2. Cada repositorio guarda solo su entidad. `RentalRepository` deja de conocer
   a `Client`.

## Piezas nuevas

### 1. Puerto `UnitOfWork` (application)

`src/application/ports/out/unit-of-work.ts`

```ts
export const UNIT_OF_WORK = Symbol('UnitOfWork');

// Repositorios ligados a la transacción en curso
export interface TransactionalRepositories {
  clients: ClientRepository;
  rentals: RentalRepository;
  properties: PropertyRepository;
}

export interface UnitOfWork {
  // Si work termina bien, hace commit. Si lanza un error, hace rollback y lo relanza.
  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
}
```

`application` no sabe nada de TypeORM. Solo sabe que lo que haga dentro de
`run` es atómico.

### 2. Implementación `TypeOrmUnitOfWork` (infraestructura)

`src/infrastructure/persistence/typeorm-unit-of-work.ts`

```ts
@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work({
        clients: new ClientRepositoryTypeORM(manager),
        rentals: new RentalRepositoryTypeORM(manager),
        properties: new PropertyRepositoryTypeORM(manager),
      }),
    );
  }
}
```

`dataSource.transaction` abre la transacción y entrega un `EntityManager` atado
a ella. Los repositorios creados con ese manager leen y escriben dentro de la
misma transacción.

### 3. Módulo `UnitOfWorkModule`

`src/modules/unit-of-work.module.ts`: provee y exporta
`{ provide: UNIT_OF_WORK, useClass: TypeOrmUnitOfWork }`. Lo importan
`ClientModule` y `RentalModule`.

## Cambios en lo existente

### 4. Los repositorios reciben un `EntityManager`

Hoy usan `@InjectRepository(XEntity) Repository<XEntity>`, que siempre apunta a
la conexión general. Para poder usarlos dentro de una transacción:

```ts
export class ClientRepositoryTypeORM implements ClientRepository {
  private readonly repository: Repository<ClientEntity>;

  constructor(private readonly manager: EntityManager) {
    this.repository = manager.getRepository(ClientEntity);
  }
  // el resto de métodos no cambia
}
```

Aplica a `client`, `rental` y `property`. Los métodos ya usan
`this.repository`, así que su cuerpo queda igual.

En `client.module.ts`, `rental.module.ts` y `property.module.ts`, el registro
pasa de `useClass` a `useFactory` con el manager general (uso fuera de
transacción):

```ts
{
  provide: CLIENT_REPOSITORY,
  useFactory: (dataSource: DataSource) =>
    new ClientRepositoryTypeORM(dataSource.manager),
  inject: [DataSource],
}
```

### 5. Bloqueo del cliente: `findByIdForUpdate`

Nuevo método en el puerto `ClientRepository`:

```ts
// Bloquea la fila hasta que termine la transacción.
// Solo es válido dentro de UnitOfWork.run
findByIdForUpdate(id: UUID): Promise<Client | null>;
```

Implementación:

```ts
const entity = await this.repository.findOne({
  where: { id },
  lock: { mode: 'pessimistic_write' }, // SELECT ... FOR UPDATE
});
```

Una segunda transacción que pida el mismo cliente espera al commit de la
primera y lee el saldo ya descontado. Fuera de una transacción, TypeORM lanza
`PessimisticLockTransactionRequiredError`, así que el mal uso se detecta
enseguida.

### 6. `RentalRepository` deja de conocer a `Client`

| Antes | Después |
|---|---|
| `saveWithClient(rental, client)` | `save(rental)` |
| `deleteWithClient(key, client)` | `delete(key)`: lanza `NotFoundError` si afecta 0 filas |

Quitar los imports de `Client`, `ClientEntity` y `ClientMapper` de
`rental-repository-typeorm.ts`.

### 7. `RentalService.save`

```ts
async save(rental: Rental): Promise<Rental> {
  return this.unitOfWork.run(async ({ clients, properties, rentals }) => {
    const client = await clients.findByIdForUpdate(rental.getClientId()); // bloquea
    const property = await properties.findById(rental.getPropertyId());
    if (!client) throw new NotFoundError(`Client with id ${rental.getClientId()} not found`);
    if (!property) throw new NotFoundError(`Property with id ${rental.getPropertyId()} not found`);

    const today = businessTodayAsDate();
    rental.assertCanStartOn(today);
    this.assertPropertyIsAvailable(property);
    await this.assertNoConflicts(rentals, rental); // usa el repo transaccional

    const total = this.calculateCharge(rental, property);
    rental.refreshStatus(today);
    rental.charge(total);
    client.discount(total); // si no alcanza: DomainError -> rollback -> 409

    await rentals.save(rental);
    await clients.update(client.getId(), client);
    return rental;
  });
}
```

- `assertNoConflicts` recibe el `RentalRepository` transaccional en lugar de
  usar `this.rentalRepository`.
- `getClientAndProperty` y `applyCharge` desaparecen o se integran aquí.
- Cualquier error lanzado dentro de `run` deshace todo, y los filtros lo
  traducen igual que ahora.

### 8. `RentalService.cancel`

```ts
async cancel(key: RentalKey): Promise<boolean> {
  return this.unitOfWork.run(async ({ clients, rentals }) => {
    const rental = await rentals.findByKey(key);
    if (!rental) throw new NotFoundError('Rental not found');

    const client = await clients.findByIdForUpdate(rental.getClientId());
    if (!client) throw new Error(`Missing client for rental`); // integridad rota -> 500

    rental.refreshStatus(businessTodayAsDate());
    if (rental.getStatus() !== RentalStatus.UPCOMING) {
      throw new ConflictError('The rental has already started');
    }
    if (rental.getChargedAmount() <= 0) {
      throw new ConflictError('The rental has no charged amount to refund');
    }

    client.deposit(rental.getChargedAmount());
    await rentals.delete(key); // si otra cancelación ganó: 0 filas -> NotFoundError -> rollback
    await clients.update(client.getId(), client);
    return true;
  });
}
```

Hoy `cancel` usa `loadDetails` solo para obtener el cliente. Eso también carga
la propiedad y las ocupaciones, y escribe estados fuera de la transacción. Con
este cambio deja de usarlo.

### 9. `ClientService.deposit` y `withdraw`

Deben pasar por la UoW con `findByIdForUpdate`. Si no, un depósito fuera del
bloqueo puede seguir pisando el saldo que dejó una renta.

```ts
async deposit(id: UUID, amount: number): Promise<Client> {
  return this.unitOfWork.run(async ({ clients }) => {
    const client = await clients.findByIdForUpdate(id);
    if (!client) throw new NotFoundError(`Client with id ${id} not found`);
    client.deposit(amount);
    return clients.update(id, client);
  });
}
```

`withdraw` es igual, con `client.discount(amount)`.

### 10. Deadlocks en el filtro de base de datos

Todas las transacciones bloquean solo el cliente y en el mismo orden, así que
no se esperan deadlocks. Aun así, agregar el código de Postgres `40P01` en
`mapDatabaseError` para responder 409 ("try again") en lugar de 500.

## Fuera de alcance

- **Overlaps de fechas**: ya los cubren las restricciones
  `excl_rentals_client_period` y `excl_rentals_property_period`.
- **Desactivar una propiedad mientras alguien la reserva**: carrera teórica de
  baja gravedad. Se cubriría bloqueando también la propiedad (`FOR SHARE`)
  dentro de `save`, siempre después del cliente para mantener el orden de
  bloqueo.
- **`deleteWithFinishedRentals`, `deleteWithPastRentals` y `updateStatuses`**:
  siguen con su `manager.transaction` interno. Ninguno se llama desde una UoW.
  Si alguna vez se llaman, TypeORM convierte la transacción anidada en un
  savepoint.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/application/ports/out/unit-of-work.ts` | nuevo |
| `src/infrastructure/persistence/typeorm-unit-of-work.ts` | nuevo |
| `src/modules/unit-of-work.module.ts` | nuevo |
| `src/application/ports/out/repositories/client-repository.ts` | `+findByIdForUpdate` |
| `src/application/ports/out/repositories/rental-repository.ts` | `saveWithClient` → `save`, `deleteWithClient` → `delete` |
| `src/infrastructure/persistence/repositories_impl/client-repository-typeorm.ts` | constructor con `EntityManager`, `+findByIdForUpdate` |
| `src/infrastructure/persistence/repositories_impl/rental-repository-typeorm.ts` | constructor con `EntityManager`, sin lógica de cliente |
| `src/infrastructure/persistence/repositories_impl/property-repository-typeorm.ts` | constructor con `EntityManager` |
| `src/modules/client.module.ts`, `rental.module.ts`, `property.module.ts` | `useFactory`, importar `UnitOfWorkModule` |
| `src/application/services/rental-service.ts` | `save` y `cancel` con UoW |
| `src/application/services/client-service.ts` | `deposit` y `withdraw` con UoW |
| `src/infrastructure/http/filters/database-exception.filter.ts` | `+40P01` |

## Orden sugerido

1. Constructores con `EntityManager` y `useFactory` en los módulos. La app
   debe seguir funcionando igual: verificar con `tsc` y una petición de prueba.
2. Puerto `UnitOfWork`, `TypeOrmUnitOfWork` y `UnitOfWorkModule`.
3. `findByIdForUpdate` en el puerto y la implementación.
4. `RentalService.save` y `cancel` con UoW. Cambiar el puerto
   `RentalRepository` (`save` y `delete`) y borrar `saveWithClient` y
   `deleteWithClient`.
5. `ClientService.deposit` y `withdraw` con UoW.
6. `40P01` en el filtro de base de datos.

## Verificación

Además de `tsc` y `pnpm run lint`, una prueba de concurrencia contra la base de
datos local (`compose.yaml`):

1. Un cliente con saldo 1000 y dos propiedades activas.
2. Dos `POST /rentals` en paralelo, cada uno por 900 y en fechas distintas:

   ```bash
   curl -s -X POST localhost:3000/rentals -H 'Content-Type: application/json' -d '{...renta A...}' &
   curl -s -X POST localhost:3000/rentals -H 'Content-Type: application/json' -d '{...renta B...}' &
   wait
   ```

3. **Antes del cambio**: las dos responden 201 y el saldo queda en 100.
4. **Después**: una responde 201, la otra 409 `INSUFFICIENT_BALANCE`, y el
   saldo queda en 100 con una sola renta.

Repetir con un `PATCH /clients/:id/withdraw` en paralelo a un `POST /rentals`
para comprobar el paso 5.

Esta prueba puede quedar como test e2e en `test/`.
