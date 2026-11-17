# Application sin dependencias de Nest

**Estado: implementado** (servicios con `useFactory`, puerto `Clock`, regla de
lint). Se conserva como referencia.

Conviene hacerlo junto con `unit-of-work-rentals.md`. Ese plan también pasa los
repositorios a `useFactory`, así que hacer los dos a la vez evita tocar los
módulos dos veces.

## Estado actual

`domain` no depende de ningún framework. En `application`, las únicas
dependencias de Nest son `@Injectable()` y `@Inject(TOKEN)` en los 7 servicios:

- `bank-service.ts`
- `city-service.ts`
- `client-service.ts`
- `country-service.ts`
- `owner-service.ts`
- `property-service.ts`
- `rental-service.ts`

Además, `RentalService` llama a `businessTodayAsDate()` (`src/utils/business-date.ts`),
que lee `process.env.APP_TIME_ZONE`. No es Nest, pero mete configuración del
entorno en la aplicación e impide probar el servicio con una fecha fija.

## Objetivo

- `application` y `domain` solo dependen de TypeScript y de sus propios puertos.
- La inyección de dependencias se arma en `src/modules`, que es la capa que sí
  conoce a Nest.
- El lint impide que la dependencia vuelva a entrar.

## Pasos

### 1. Servicios como clases normales

Quitar `@Injectable()`, `@Inject(TOKEN)` y el import de `@nestjs/common`.

```ts
// application/services/client-service.ts
export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly cityRepository: CityRepository,
    private readonly bankRepository: BankRepository,
    private readonly countryRepository: CountryRepository,
  ) {}
  // los métodos no cambian
}
```

Los parámetros siguen tipados con las interfaces de los puertos. El servicio
no sabe quién lo construye.

### 2. Los módulos construyen los servicios con `useFactory`

```ts
// modules/client.module.ts
providers: [
  { provide: CLIENT_REPOSITORY, useClass: ClientRepositoryTypeORM },
  {
    provide: ClientService,
    useFactory: (
      clients: ClientRepository,
      cities: CityRepository,
      banks: BankRepository,
      countries: CountryRepository,
    ) => new ClientService(clients, cities, banks, countries),
    inject: [
      CLIENT_REPOSITORY,
      CITY_REPOSITORY,
      BANK_REPOSITORY,
      COUNTRY_REPOSITORY,
    ],
  },
],
```

- `provide: ClientService` usa la clase como token. Los controladores
  (`constructor(private readonly clientService: ClientService)`) y
  `RentalStatusScheduler` no cambian.
- El orden de `inject` debe coincidir con el de los parámetros. Los tipos lo
  detectan casi siempre, porque cada puerto tiene métodos distintos.
- Los módulos que hoy importan un servicio de otro módulo (por ejemplo,
  `exports: [..., ClientService]`) siguen funcionando igual.
- Los tokens (`CLIENT_REPOSITORY`, etc.) son `Symbol` de JavaScript puro y
  pueden quedarse en los puertos.

Repetir para los 7 servicios. Dependencias de cada uno (revisar su
constructor):

| Servicio | Módulo | Dependencias |
|---|---|---|
| `BankService` | `bank.module.ts` | `BANK_REPOSITORY`, `COUNTRY_REPOSITORY` |
| `CityService` | `city.module.ts` | `CITY_REPOSITORY`, `COUNTRY_REPOSITORY` |
| `CountryService` | `country.module.ts` | `COUNTRY_REPOSITORY` |
| `OwnerService` | `owner.module.ts` | `OWNER_REPOSITORY`, `BANK_REPOSITORY` |
| `PropertyService` | `property.module.ts` | `PROPERTY_REPOSITORY`, `OWNER_REPOSITORY`, `BANK_REPOSITORY`, `CITY_REPOSITORY` |
| `ClientService` | `client.module.ts` | `CLIENT_REPOSITORY`, `CITY_REPOSITORY`, `BANK_REPOSITORY`, `COUNTRY_REPOSITORY` |
| `RentalService` | `rental.module.ts` | `RENTAL_REPOSITORY`, `CLIENT_REPOSITORY`, `PROPERTY_REPOSITORY`, `CLOCK` (paso 3) |

Si se implementa la Unit of Work, `ClientService` y `RentalService` reciben
también `UNIT_OF_WORK`.

### 3. El reloj como puerto

```ts
// application/ports/out/clock.ts
export const CLOCK = Symbol('Clock');

export interface Clock {
  // Día actual del negocio a medianoche UTC, igual que las fechas de Rental
  today(): Date;
}
```

```ts
// infrastructure/time/business-clock.ts
export class BusinessClock implements Clock {
  constructor(private readonly timeZone: string) {}

  today(): Date {
    // en-CA formatea como YYYY-MM-DD
    const day = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    return new Date(`${day}T00:00:00.000Z`);
  }
}
```

- En `RentalService`, reemplazar `businessTodayAsDate()` por
  `this.clock.today()`.
- En `rental.module.ts`, registrar
  `{ provide: CLOCK, useFactory: () => new BusinessClock(process.env.APP_TIME_ZONE ?? 'America/Bogota') }`.
- `src/utils/business-date.ts` pasa a `src/infrastructure/time/`. Ahí lo siguen
  usando los repositorios (`businessToday()`) y el `RentalStatusScheduler`
  (`businessTimeZone()`).
- Opcional: que `businessToday()` y `BusinessClock` compartan la misma función,
  para no duplicar el formateo.

### 4. Regla de lint

Agregar a `.oxlintrc.json` (se conservan las reglas que ya existen):

```json
{
  "overrides": [
    {
      "files": ["src/application/**/*.ts", "src/domain/**/*.ts"],
      "rules": {
        "no-restricted-imports": ["error", {
          "patterns": [{
            "group": ["@nestjs/*", "typeorm", "express", "@/infrastructure/*", "@/modules/*"],
            "message": "application y domain no pueden depender de frameworks ni de infraestructura"
          }]
        }]
      }
    }
  ]
}
```

Probada con una config temporal: antes del paso 1 marca exactamente los 7
imports de `@nestjs/common` de los servicios. La regla también impide que
`application` importe de `@/infrastructure`. Hoy no pasa: la dependencia va de
infraestructura hacia `application`, como debe ser.

El patrón no cubre imports relativos (`../../infrastructure/...`). El proyecto
usa el alias `@/`, pero conviene revisarlo en code review.

## Orden sugerido

1. Agregar la regla de lint. `pnpm run lint` debe marcar los 7 servicios: eso
   confirma que la regla funciona.
2. Un servicio a la vez: quitar los decoradores y escribir su `useFactory`.
   Empezar por `CountryService` (una dependencia) y terminar por
   `RentalService`.
3. Puerto `Clock` y `BusinessClock`. Mover `business-date.ts` a
   infraestructura.
4. `pnpm run lint` sin errores y `npx tsc --noEmit`.

## Verificación

- `pnpm run lint`: 0 errores de `no-restricted-imports`.
- `grep -rn "@nestjs" src/application src/domain` sin resultados.
- `npx tsc --noEmit` sin errores.
- Arrancar la app (`pnpm run start:dev`). Si un `useFactory` está mal armado,
  Nest falla al iniciar con "Nest can't resolve dependencies of ...". Luego
  probar un endpoint por módulo, por ejemplo con Swagger en `/docs`.

## Lo que cuesta

- Más código en los módulos: cada servicio pasa de una línea en `providers` a
  un factory de 5 a 10 líneas.
- Nada cambia hacia fuera: ni rutas, ni respuestas, ni controladores.
