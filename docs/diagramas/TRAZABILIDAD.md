# Diagramas de arquitectura: trazabilidad

Rutas relativas a `src/` salvo que se indique otra cosa. Revisión del código: 2026-11-04.

## Archivos

| Diagrama | Editable | PNG | Pregunta |
|---|---|---|---|
| Capas (conceptual) | `capas.drawio` | `capas.png` | ¿Cómo dependen las capas entre sí? |
| Componentes | `componentes.drawio` (8 páginas) | `componentes-0-modulos.png` … `componentes-7-rental.png` | ¿Qué clases forman cada módulo y de qué dependen? |
| Corte vertical | `corte-actualizar-propiedad.drawio` | `corte-actualizar-propiedad.png` | ¿Qué componentes ejecuta `PATCH /properties/:id` y en qué orden? |
| Puertos y adaptadores | `puertos-adaptadores.drawio` | `puertos-adaptadores.png` | ¿Quién consume cada puerto y qué adaptador lo implementa? |
| Secuencia | `secuencia-actualizar-propiedad.drawio` | `secuencia-actualizar-propiedad.png` | ¿En qué orden se ejecuta la actualización? |

Los PNG llevan el XML incrustado y se pueden abrir en draw.io. Los diagramas detallados se generan con
los scripts de `fuentes/` (`python3 gen_componentes.py`, `gen_corte.py`, `gen_puertos.py`, `gen_secuencia.py`);
los datos de cada diagrama están escritos en esos scripts y salen de las evidencias de abajo.

## Evidencias por relación

### Controllers y scheduler → services (sin puertos de entrada)
Cada controller recibe la clase concreta del servicio en el constructor:
`infrastructure/http/controllers/{bank:22, city:22, client:36, country:22, owner:31, property:36, rental:35}.controller.ts`.
`infrastructure/scheduling/rental-status.scheduler.ts:9` inyecta `RentalService` y llama a `refreshAllStatuses()` con `@Cron(EVERY_DAY_AT_MIDNIGHT)`.

### Services → puertos (`@Inject(TOKEN)`)
| Service | Puertos | Evidencia |
|---|---|---|
| CountryService | CountryRepository | `application/services/country-service.ts:12` |
| CityService | CityRepository, CountryRepository | `city-service.ts:17,19` |
| BankService | BankRepository, CountryRepository | `bank-service.ts:17,19` |
| OwnerService | OwnerRepository, BankRepository | `owner-service.ts:28,29` |
| PropertyService | PropertyRepository, OwnerRepository, BankRepository, CityRepository | `property-service.ts:35-41` |
| ClientService | ClientRepository, CityRepository, BankRepository, CountryRepository | `client-service.ts:46-52` |
| RentalService | RentalRepository, ClientRepository, PropertyRepository | `rental-service.ts:27-31` |

### Adaptadores → puertos (implementa) y registro
Cada `XRepositoryTypeORM` declara `implements XRepository` en `infrastructure/persistence/repositories_impl/*-repository-typeorm.ts`
y se enlaza con `{ provide: X_REPOSITORY, useClass: XRepositoryTypeORM }` en `modules/*.module.ts`
(bank:14, city:14, client:21, country:13, owner:14, property:21, rental:20).

### Adaptadores → tecnología
- `@InjectRepository(XEntity)` en el constructor de cada adaptador (`Repository<XEntity>` de TypeORM).
- `createQueryBuilder`: client, owner, property, rental. `manager.transaction`: client (borra RentalEntity + ClientEntity),
  property (borra RentalEntity pasadas + PropertyEntity), rental (3 transacciones sobre RentalEntity y ClientEntity).
- Base de datos: `modules/database.module.ts:8` (`type: 'postgres'`, `synchronize: false`). `package.json` declara también `mysql2`, que no se usa en la configuración.

### Dependencias hacia el dominio
- `domain/*.ts` solo importa `@/utils/types.js`: el dominio no depende de nada externo.
- Puertos: cada `ports/out/repositories/*-repository.ts` importa su clase de dominio.
- Modelos: `models/property-details.ts` (Bank, City, Owner, Property), `client-details.ts` (Bank, Client, Country),
  `rental-details.ts` (Client, Property, Rental), `bank-details.ts` y `city-details.ts` (+ Country).
- `commands/update-property.command.ts` importa `PropertyStatus`; los comandos de owner y client solo importan `UUID`.
- Mappers HTTP y de persistencia importan las clases de dominio que traducen.

### Mappers HTTP que usan otros mappers
PropertyHttpMapper → OwnerHttpMapper; OwnerHttpMapper → BankSummaryHttpMapper; BankHttpMapper → BankSummaryHttpMapper, CountryHttpMapper;
CityHttpMapper → CountryHttpMapper; ClientHttpMapper → BankHttpMapper (imports en `infrastructure/http/mappers/`).

### Módulos Nest
`app.module.ts` importa ScheduleModule.forRoot(), DatabaseModule y los 7 módulos de funcionalidad. Imports entre módulos:
Bank→Country, City→Country, Owner→Bank, Property→City/Owner/Bank, Client→City/Bank/Country, Rental→Client/Property.
`OwnerModule` exporta solo `OWNER_REPOSITORY`, no `OwnerService`.

### Corte y secuencia `PATCH /properties/:id`
| Paso | Evidencia |
|---|---|
| ValidationPipe global y DatabaseExceptionFilter | `main.ts:12,17` |
| `@Patch(':id')`, ParseUUIDPipe, mapper, service, respuesta | `infrastructure/http/controllers/property.controller.ts:122-141` |
| `UpdatePropertyRequest` (PartialType de CreatePropertyRequest sin ownerId/cityId + status) | `infrastructure/http/dto/request/update/update-property.request.ts` |
| `fromUpdateRequestToCommand`, `fromDomainToResponse` | `infrastructure/http/mappers/property-http.mapper.ts` |
| `update`: findById → 404, applyFieldChanges → 400, applyStatusChange → 409, repository.update, applyOccupancy | `application/services/property-service.ts:156-235` |
| `findById` → `findOneBy`; `update` → `existsBy` + `save`; `findOccupiedPropertyIds` con join a rentals | `infrastructure/persistence/repositories_impl/property-repository-typeorm.ts:52-120` |
| Reglas de dominio (`change*`, `activate`, `deactivate`, `applyOccupancy`) | `domain/property.ts` |

## Pendiente de verificación
- Si la propiedad se borra entre `findById` y `update`, `PropertyRepositoryTypeORM.update` lanza `Error` genérico. No se encontró un mapeo HTTP explícito para ese caso.
- `DatabaseExceptionFilter` traduce `QueryFailedError` 23505/23P01 a 409. No se identificó ninguna restricción de `properties` que se dispare al actualizar una propiedad.

## Limitaciones conocidas de los diagramas
- En `componentes-0-modulos` hay un cruce, marcado con salto de línea, entre PropertyModule→CityModule y ClientModule→BankModule.
- En las páginas de componentes, las flechas hacia el dominio llegan al contenedor `Dominio`; la clase concreta que importa cada componente está en la sección "Dependencias hacia el dominio".
- Los puertos de otro módulo (borde discontinuo) muestran su adaptador y su clase de dominio en la página de su propio módulo.
- El diagrama de secuencia no usa marcos `alt`; las ramas condicionales de `status` y los errores aparecen como notas rojas.
