# Brisa: flujo de trabajo y guía para delegar

Este documento resume las decisiones de esta sesión y el estado revisado del código.
Antes de ejecutar una tarea, revisar los archivos: el proyecto sigue cambiando.
Las tareas pendientes son propuestas para delegar; no autorizan implementarlas todas juntas.

## Preferencias de implementación

- Priorizar código explícito y legible, aunque se repitan algunos campos.
- Evitar tipos como `Partial<Omit<ReturnType<...>>>` en firmas de negocio.
- Usar interfaces con atributos explícitos para commands y modelos de detalles.
- Respetar el alcance solicitado: si se pide únicamente repository o response, tocar esa capa y las referencias imprescindibles.
- No añadir capas, builders o dependencias cuando un objeto tipado resuelve el problema.
- Conservar el trabajo existente y revisar los cambios locales antes de editar.

## Organización

```text
src/
  domain/                                Entidades y reglas de negocio
  application/
    commands/                            Datos de entrada independientes de HTTP
    models/                              Datos de lectura con relaciones: *Details
    services/                            Coordinación de casos de uso
    ports/out/repositories/              Contratos y tokens de inyección
  infrastructure/
    http/
      controllers/                       Rutas y adaptación HTTP
      dto/request/create/                Requests de creación
      dto/request/update/                Requests de PATCH
      dto/response/                      Responses básicos y con detalles
      mappers/                           Transformaciones de entrada y salida HTTP
    persistence/
      entities/                          Entidades TypeORM
      mapper/                            Conversión entre persistencia y dominio
      repositories_impl/                 Implementaciones TypeORM
  modules/                               Registro y exportación de dependencias
```

## Flujo de lectura: GET

```text
Controller → Service → Repository → TypeORM
                ↓
       Dominios y relaciones por lote
                ↓
          Modelo *Details
                ↓
Controller → HttpMapper → *DetailsResponse
```

1. El controller valida parámetros y llama al service.
2. El repository devuelve objetos del dominio, sin depender de los DTO HTTP.
3. El service reúne las relaciones requeridas y devuelve modelos de detalles.
4. El mapper construye el response; no consulta repositorios ni llama a services.
5. El controller entrega la respuesta. Convertir un resultado mediante un mapper es una responsabilidad válida del controller.

Para listados, extraer los IDs relacionados, deduplicarlos y consultar por lote.
Asociar los resultados mediante `Map` por ID; no asumir que llegan en el orden solicitado.
Usar `Promise.all` para consultas independientes, no para lanzar consultas por cada registro.

Ejemplo vigente: [PropertyService](../src/application/services/property-service.ts).
La lectura de properties usa hasta cuatro consultas: propiedades, propietarios, ciudades y bancos.
El número de consultas no crece por cada propiedad del listado.

## Flujo de escritura: POST y PATCH

Las escrituras pueden devolver datos básicos, sin cargar relaciones solo para presentarlas.
Esto no elimina las validaciones de existencia de relaciones que requiera el caso de uso.

### POST

```text
Request → Mapper → Command o Domain → Service → Repository
                                         ↓
                           Domain → Mapper → Response básico
```

- No incluir el ID propio en el request; conservar los IDs de relaciones necesarias.
- Usar un command explícito si el service necesita datos de entrada independientes de HTTP.
- La conversión directa a dominio también existe: Properties actualmente usa ese camino.
- El dominio mantiene sus validaciones; el mapper adapta y normaliza datos.

### PATCH

```text
UpdateRequest → HttpMapper → UpdateCommand
                                  ↓
                  Service carga el dominio existente
                                  ↓
                  Aplica métodos del dominio y guarda
                                  ↓
                      Mapper → Response básico
```

- Usar `PartialType` para derivar el DTO y conservar las validaciones de los campos enviados.
- Cuando haya campos no editables, usar `OmitType` o un DTO explícito.
- El service recibe un command con atributos opcionales explícitos: `name?: string`, etc.
- Comprobar `!== undefined`, para conservar valores enviados como `0`.
- Omitir un campo significa conservarlo; no aplicar valores por defecto de creación al PATCH.
- Rechazar `null` cuando el campo no admite borrado; en los DTO correspondientes se usa `skipNullProperties: false`.
- No construir un dominio incompleto ni usar `Object.assign` para saltarse sus métodos.
- Guardar solo después de aplicar y validar todos los cambios.
- Las operaciones de saldo deben respetar los métodos del dominio; no convertirlas en asignaciones genéricas sin definir antes el caso de uso.

Referencia: [UpdateOwnerCommand](../src/application/commands/update-owner.command.ts).

## Responses acordados

Los responses básicos y sus variantes de detalles pueden compartir archivo.
La anotación TypeScript no elimina campos del JSON: el mapper debe construir el objeto exacto.

| Recurso | Lectura / GET | Escritura |
| --- | --- | --- |
| Property | `PropertyDetailsResponse`: datos básicos, owner con banco resumido y ciudad resumida | `PropertyResponse`, sin objetos anidados |
| Bank | `BankDetailsResponse`: datos básicos y país | No tiene endpoints de escritura |
| City | `CityDetailsResponse`: datos básicos y país | No tiene endpoints de escritura |
| Country | `CountryResponse`: `id`, `name` | No tiene endpoints de escritura |
| Owner | Implementación todavía anterior al patrón de Properties | Su POST aún devuelve owner y banco |
| Client | Existe DTO con datos del cliente y banco con país; falta conectar los endpoints | Pendiente de definir al implementar |
| Rental | Existe DTO con propiedad detallada y cliente; falta conectar los endpoints | Pendiente de definir al implementar |

Los resúmenes de banco y ciudad contienen únicamente `id` y `name`.
Evitar referencias inversas que formen ciclos, como banco → propietarios → banco.
No ampliar la profundidad de relaciones sin una necesidad del front.

## Repositories y módulos

- Cada contrato exporta su token: `OWNER_REPOSITORY`, `BANK_REPOSITORY`, etc.
- El módulo registra `{ provide: TOKEN, useClass: RepositoryTypeORM }` y exporta el token para otros módulos.
- El módulo consumidor importa el módulo que exporta la dependencia. No hace falta crear un service intermediario para inyectar un repository.
- Los repositorios con ID simple tienen `findByIds(ids: UUID[])`.
- Rental tiene `findByKeys(keys: RentalKey[])` porque su clave es compuesta.
- Un lote vacío devuelve `[]` sin consultar; los IDs inexistentes no generan elementos ficticios.
- Los métodos de lote no garantizan el orden de entrada.

## Estado de Rental y siguiente tarea posible

Ya existe, únicamente en el contrato y la implementación del repository:

```ts
findByClientId(clientId: UUID): Promise<Rental[]>
```

Consulta todas las rentas del cliente y devuelve `[]` cuando no encuentra registros.
No se implementó todavía ese método en `RentalService` ni su endpoint.
`RentalController` sigue siendo un cascarón; el service solo expone actualmente la búsqueda por claves en lote.

El endpoint discutido para una futura tarea es:

```http
GET /rentals?clientId=<uuid>
```

Un cliente puede tener N rentas: la respuesta debe ser una colección.
El filtro pertenece a Rental. No añadir consultas de rentas a `ClientRepository`.
No inventar un ID simple de renta: su clave es `propertyId`, `clientId` y `startDate`.

### Encargo listo para delegar: rentas por cliente

> Implementar únicamente la consulta GET de rentas por cliente, siguiendo el patrón de Properties.
> Reutilizar `RentalRepository.findByClientId`; no cambiar el esquema ni añadir escrituras.
> Agregar la coordinación en RentalService y la ruta en RentalController.
> Si se necesitan relaciones anidadas, declarar RentalDetails con campos explícitos y resolverlas por lote.
> Reutilizar los mappers existentes y adaptar sus firmas solo cuando sea necesario.
> Validar el filtro UUID y devolver una colección vacía cuando la consulta no tenga resultados.
> Definir explícitamente el comportamiento si falta clientId, sin exponer por accidente todas las rentas.
> Verificar las dependencias exportadas e importadas en RentalModule.
> Añadir pruebas para varias rentas del mismo cliente, resultado vacío, filtro inválido y consultas por lote.
> No implementar POST, PATCH, DELETE ni completar Client durante esta tarea.

Si el volumen necesita paginación, acordar primero parámetros y estructura del response.
La paginación no está implementada en este método del repository.

## Otros pendientes, separados del encargo anterior

- Owner: decidir cuándo aplicar el patrón de response básico para escrituras y detalles para lecturas. Su mapper básico actual no completa `bank`, aunque `OwnerResponse` lo declara.
- Client: controller todavía sin endpoints y service con búsqueda por lote; completar solo con un alcance específico.
- Property: existen métodos del service para filtros y propietario, pero no todos están expuestos como rutas HTTP.
- Property: el estado ACTIVE/INACTIVE está en el dominio, pero el mapper de persistencia documenta que no tiene columna y no se persiste. No prometer persistencia del estado sin resolverlo.
- Revisar las políticas de 404, campos no editables y respuestas de DELETE dentro de tareas separadas.

## Procedimiento para quien reciba la tarea

1. Leer [AGENTS.md](../AGENTS.md), este documento y los archivos del recurso asignado.
2. Revisar `git status --short` y preservar cambios locales del usuario.
3. Confirmar qué partes ya existen: contrato, implementación, service, mapper, controller y módulo.
4. Implementar solo el alcance delegado, con nombres y atributos explícitos.
5. Mantener las consultas de relaciones dentro del service y las conversiones HTTP dentro del mapper.
6. Comprobar que las relaciones resumidas no incluyan agregados adicionales.
7. Ejecutar las verificaciones correspondientes:

```bash
pnpm build
pnpm test
git diff --check
```

8. Si se ejecutan pruebas E2E, preparar antes la base de datos que requieren; no asumir que existen fixtures ni un servidor disponible.
9. Informar archivos modificados, comportamiento final, pruebas realizadas y limitaciones reales.

No incluir valores del `.env` en documentación, logs o respuestas.
Para investigar comportamiento de producción, seguir las instrucciones de Observe de AGENTS.md; no instalar telemetría como parte de estas tareas de CRUD.
