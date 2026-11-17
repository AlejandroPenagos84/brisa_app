"""Genera puertos-adaptadores.drawio.

Consumidores: parámetros @Inject(TOKEN) en src/application/services/*-service.ts.
Implementación: `implements` en repositories_impl/*.ts y { provide, useClass } en src/modules/*.module.ts.
Tecnología: uso de Repository<Entity>, createQueryBuilder y manager.transaction en cada adaptador.
"""
from drawlib import Page, write

PORTS = [
    ("PropertyRepository", "PROPERTY_REPOSITORY", "property-repository.ts", ["PropertyService", "RentalService"],
     "PropertyRepositoryTypeORM", "property-repository-typeorm.ts", "PropertyModule",
     ["Repository&lt;PropertyEntity&gt;", "QueryBuilder con join a rentals",
      "transacción: borra RentalEntity pasadas + PropertyEntity"]),
    ("RentalRepository", "RENTAL_REPOSITORY", "rental-repository.ts", ["RentalService"],
     "RentalRepositoryTypeORM", "rental-repository-typeorm.ts", "RentalModule",
     ["Repository&lt;RentalEntity&gt;", "QueryBuilder (solapamientos)",
      "transacciones: RentalEntity + ClientEntity"]),
    ("ClientRepository", "CLIENT_REPOSITORY", "client-repository.ts", ["ClientService", "RentalService"],
     "ClientRepositoryTypeORM", "client-repository-typeorm.ts", "ClientModule",
     ["Repository&lt;ClientEntity&gt;", "QueryBuilder",
      "transacción: borra RentalEntity + ClientEntity"]),
    ("OwnerRepository", "OWNER_REPOSITORY", "owner-repository.ts", ["OwnerService", "PropertyService"],
     "OwnerRepositoryTypeORM", "owner-repository-typeorm.ts", "OwnerModule",
     ["Repository&lt;OwnerEntity&gt;", "QueryBuilder"]),
    ("BankRepository", "BANK_REPOSITORY", "bank-repository.ts",
     ["BankService", "OwnerService", "PropertyService", "ClientService"],
     "BankRepositoryTypeORM", "bank-repository-typeorm.ts", "BankModule", ["Repository&lt;BankEntity&gt;"]),
    ("CityRepository", "CITY_REPOSITORY", "city-repository.ts", ["CityService", "PropertyService", "ClientService"],
     "CityRepositoryTypeORM", "city-repository-typeorm.ts", "CityModule", ["Repository&lt;CityEntity&gt;"]),
    ("CountryRepository", "COUNTRY_REPOSITORY", "country-repository.ts",
     ["CountryService", "BankService", "CityService", "ClientService"],
     "CountryRepositoryTypeORM", "country-repository-typeorm.ts", "CountryModule",
     ["Repository&lt;CountryEntity&gt;"]),
]

GREY = '<font style="font-size:10px" color="#555555">'
p = Page("puertos", "Puertos y adaptadores")
p.text("t", "¿Quién consume cada puerto de salida y qué adaptador lo implementa?", 40, 10, 1700, 40, size=20)
XC, XP, XA, XT, XD = 40, 400, 900, 1400, 1780
WC, WP, WA, WT = 280, 380, 380, 300
H, PITCH, TOP = 100, 130, 130
p.header("h1", "Servicios consumidores<br>src/application/services/", "app", XC, 75, WC)
p.header("h2", "Puerto (interfaz + token)<br>src/application/ports/out/repositories/", "app", XP, 75, WP)
p.header("h3", "Adaptador<br>src/infrastructure/persistence/repositories_impl/", "infra", XA, 75, WA)
p.header("h4", "Tecnología<br>TypeORM 1.x (@nestjs/typeorm)", "infra", XT, 75, WT)

for i, (port, tok, pf, cons, adp, af, mod, tech) in enumerate(PORTS):
    y = TOP + i * PITCH
    p.box(f"c{i}", "<br>".join(f"<b>{c}</b>" for c in cons), "app", XC, y, WC, H, size=12)
    p.box(f"p{i}", f"<b>interface {port}</b><br>token {tok}<br>{GREY}{pf}</font>", "app", XP, y, WP, H)
    p.box(f"a{i}", f"<b>{adp}</b><br>registrado en {mod} (useClass)<br>{GREY}{af}</font>", "infra",
          XA, y, WA, H, size=12)
    p.box(f"t{i}", "<br>".join(tech), "infra", XT, y, WT, H, size=11)
    p.edge(f"ec{i}", f"c{i}", f"p{i}", "depende · @Inject", ex=(1, 0.5), en=(0, 0.5))
    p.edge(f"ea{i}", f"a{i}", f"p{i}", "implementa", kind="impl", ex=(0, 0.5), en=(1, 0.5))
    p.edge(f"et{i}", f"a{i}", f"t{i}", "usa", ex=(1, 0.5), en=(0, 0.5))

total_h = (len(PORTS) - 1) * PITCH + H
p.db("pg", "<b>PostgreSQL</b><br><font style=\"font-size:11px\">driver pg<br>DatabaseModule</font>",
     XD, TOP, 160, total_h)
for i in range(len(PORTS)):
    y = TOP + i * PITCH + H / 2
    p.edge(f"ed{i}", f"t{i}", "pg", "", ex=(1, 0.5), en=(0, round((y - TOP) / total_h, 4)))

p.note("nota", "Flecha continua: depende de (el servicio recibe la interfaz por @Inject(TOKEN)). "
       "Flecha discontinua con triángulo: implementa (class X implements Puerto). "
       "Los controllers no usan puertos de entrada: inyectan la clase del servicio directamente. "
       "package.json declara también mysql2, pero DatabaseModule configura type: 'postgres'.",
       40, TOP + total_h + 30, 1900, 45)

write("../puertos-adaptadores.drawio", [p])
print("ok")
