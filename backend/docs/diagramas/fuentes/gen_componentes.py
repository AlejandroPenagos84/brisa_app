"""Genera componentes.drawio: una página de módulos Nest + una página por módulo.

Todos los datos de MODULES salen del código (ver TRAZABILIDAD.md):
constructores (@Inject), imports y providers de src/modules/*.module.ts.
"""
from drawlib import Page, label, write

W, H, PITCH, TOP = 280, 90, 130, 200
X = {"E": 60, "A": 420, "P": 790, "S": 1160, "D": 1540}
DW = 300  # ancho del contenedor de dominio

MODULES = [
    dict(key="country", name="CountryModule", file="country.module.ts",
         controller=("CountryController", "http/controllers/country.controller.ts"),
         dtos=["CountryResponse"],
         httpmapper=("CountryHttpMapper", "http/mappers/country-http.mapper.ts", None),
         service=("CountryService", "services/country-service.ts"),
         cmds=None, cmds_dom=False,
         port=("CountryRepository", "COUNTRY_REPOSITORY", "country-repository.ts"),
         foreign=[],
         adapter=("CountryRepositoryTypeORM", "repositories_impl/country-repository-typeorm.ts"),
         pmapper=("CountryMapper", "mapper/country-mapper.ts"),
         entities=["CountryEntity"],
         domain=[("Country", "country.ts")]),
    dict(key="city", name="CityModule", file="city.module.ts",
         controller=("CityController", "http/controllers/city.controller.ts"),
         dtos=["CityResponse · CityDetailsResponse"],
         httpmapper=("CityHttpMapper", "http/mappers/city-http.mapper.ts", "usa CountryHttpMapper"),
         service=("CityService", "services/city-service.ts"),
         cmds=("CityDetails", "models/city-details.ts"), cmds_dom=True,
         port=("CityRepository", "CITY_REPOSITORY", "city-repository.ts"),
         foreign=[("CountryRepository", "CountryModule")],
         adapter=("CityRepositoryTypeORM", "repositories_impl/city-repository-typeorm.ts"),
         pmapper=("CityMapper", "mapper/city-mapper.ts"),
         entities=["CityEntity"],
         domain=[("City", "city.ts"), ("Country", "country.ts")]),
    dict(key="bank", name="BankModule", file="bank.module.ts",
         controller=("BankController", "http/controllers/bank.controller.ts"),
         dtos=["BankResponse · BankDetailsResponse", "BankSummaryResponse"],
         httpmapper=("BankHttpMapper", "http/mappers/bank-http.mapper.ts",
                     "usa BankSummaryHttpMapper, CountryHttpMapper"),
         service=("BankService", "services/bank-service.ts"),
         cmds=("BankDetails", "models/bank-details.ts"), cmds_dom=True,
         port=("BankRepository", "BANK_REPOSITORY", "bank-repository.ts"),
         foreign=[("CountryRepository", "CountryModule")],
         adapter=("BankRepositoryTypeORM", "repositories_impl/bank-repository-typeorm.ts"),
         pmapper=("BankMapper", "mapper/bank-mapper.ts"),
         entities=["BankEntity"],
         domain=[("Bank", "bank.ts"), ("Country", "country.ts")]),
    dict(key="owner", name="OwnerModule", file="owner.module.ts",
         controller=("OwnerController", "http/controllers/owner.controller.ts"),
         dtos=["CreateOwnerRequest · UpdateOwnerRequest", "OwnerResponse"],
         httpmapper=("OwnerHttpMapper", "http/mappers/owner-http.mapper.ts", "usa BankSummaryHttpMapper"),
         service=("OwnerService", "services/owner-service.ts"),
         cmds=("CreateOwnerCommand · UpdateOwnerCommand", "commands/"), cmds_dom=False,
         port=("OwnerRepository", "OWNER_REPOSITORY", "owner-repository.ts"),
         foreign=[("BankRepository", "BankModule")],
         adapter=("OwnerRepositoryTypeORM", "repositories_impl/owner-repository-typeorm.ts"),
         pmapper=("OwnerMapper", "mapper/owner-mapper.ts"),
         entities=["OwnerEntity"],
         domain=[("Owner", "owner.ts"), ("Bank", "bank.ts")]),
    dict(key="property", name="PropertyModule", file="property.module.ts",
         controller=("PropertyController", "http/controllers/property.controller.ts"),
         dtos=["CreatePropertyRequest · UpdatePropertyRequest", "PropertyFiltersRequest",
               "PropertyResponse · PropertyDetailsResponse"],
         httpmapper=("PropertyHttpMapper", "http/mappers/property-http.mapper.ts", "usa OwnerHttpMapper"),
         service=("PropertyService", "services/property-service.ts"),
         cmds=("CreatePropertyCommand · UpdatePropertyCommand\nPropertyDetails", "commands/ · models/"),
         cmds_dom=True,
         port=("PropertyRepository", "PROPERTY_REPOSITORY", "property-repository.ts"),
         foreign=[("OwnerRepository", "OwnerModule"), ("BankRepository", "BankModule"),
                  ("CityRepository", "CityModule")],
         adapter=("PropertyRepositoryTypeORM", "repositories_impl/property-repository-typeorm.ts"),
         pmapper=("PropertyMapper", "mapper/property-mapper.ts"),
         entities=["PropertyEntity · RentalEntity"],
         domain=[("Property · PropertyStatus", "property.ts"), ("Owner", "owner.ts"),
                 ("Bank", "bank.ts"), ("City", "city.ts")]),
    dict(key="client", name="ClientModule", file="client.module.ts",
         controller=("ClientController", "http/controllers/client.controller.ts"),
         dtos=["CreateClientRequest · UpdateClientRequest", "ClientAmountRequest",
               "ClientResponse · ClientDetailsResponse"],
         httpmapper=("ClientHttpMapper", "http/mappers/client-http.mapper.ts", "usa BankHttpMapper"),
         service=("ClientService", "services/client-service.ts"),
         cmds=("CreateClientCommand · UpdateClientCommand\nClientDetails", "commands/ · models/"),
         cmds_dom=True,
         port=("ClientRepository", "CLIENT_REPOSITORY", "client-repository.ts"),
         foreign=[("CityRepository", "CityModule"), ("BankRepository", "BankModule"),
                  ("CountryRepository", "CountryModule")],
         adapter=("ClientRepositoryTypeORM", "repositories_impl/client-repository-typeorm.ts"),
         pmapper=("ClientMapper", "mapper/client-mapper.ts"),
         entities=["ClientEntity · RentalEntity"],
         domain=[("Client", "client.ts"), ("Bank", "bank.ts"), ("Country", "country.ts")]),
    dict(key="rental", name="RentalModule", file="rental.module.ts",
         controller=("RentalController", "http/controllers/rental.controller.ts"),
         scheduler=("RentalStatusScheduler", "scheduling/rental-status.scheduler.ts"),
         dtos=["CreateRentalRequest", "RentalResponse · RentalDetailsResponse"],
         httpmapper=("RentalHttpMapper", "http/mappers/rental-http.mapper.ts", None),
         service=("RentalService", "services/rental-service.ts"),
         cmds=("RentalDetails", "models/rental-details.ts"), cmds_dom=True,
         port=("RentalRepository", "RENTAL_REPOSITORY", "rental-repository.ts"),
         foreign=[("ClientRepository", "ClientModule"), ("PropertyRepository", "PropertyModule")],
         adapter=("RentalRepositoryTypeORM", "repositories_impl/rental-repository-typeorm.ts"),
         pmapper=("RentalMapper · ClientMapper", "mapper/rental-mapper.ts · client-mapper.ts"),
         entities=["RentalEntity · ClientEntity"],
         domain=[("Rental · RentalKey · RentalStatus", "rental.ts"), ("Client", "client.ts"),
                 ("Property", "property.ts")]),
]


def ry(r):
    return TOP + PITCH * r


def module_page(m, idx):
    p = Page(f"comp-{m['key']}", f"{idx}. {m['name']}")
    o = 1 if "scheduler" in m else 0
    p.text("t", f"¿Qué clases forman {m['name']} y de qué dependen? (src/modules/{m['file']})",
           40, 10, 1700, 40, size=20)
    p.header("hE", "Infraestructura · entrada<br>src/infrastructure/", "infra", X["E"], 60, W)
    p.header("hA", "Aplicación<br>src/application/", "app", X["A"], 60, W)
    p.header("hP", "Aplicación · puertos de salida<br>src/application/ports/out/repositories/", "app",
             X["P"], 60, W)
    p.header("hS", "Infraestructura · salida (TypeORM)<br>src/infrastructure/persistence/", "infra",
             X["S"], 60, W)

    r0 = o  # fila del controller / service / puerto propio / adaptador
    if o:
        n, f = m["scheduler"]
        p.box("sched", label(n, f, "@Cron EVERY_DAY_AT_MIDNIGHT"), "infra", X["E"], ry(0), W, H)
    n, f = m["controller"]
    p.box("ctrl", label(n, f), "infra", X["E"], ry(r0), W, H)
    dto_html = "<b>DTOs HTTP</b><br>" + "<br>".join(m["dtos"]) + \
        "<br><font style=\"font-size:10px\" color=\"#555555\">http/dto/request/ · http/dto/response/</font>"
    p.box("dto", dto_html, "infra", X["E"], ry(r0 + 1), W, H, size=12)
    n, f, uses = m["httpmapper"]
    p.box("hmap", label(n, f, uses), "infra", X["E"], ry(r0 + 2), W, H)

    n, f = m["service"]
    p.box("svc", label(n, f), "app", X["A"], ry(r0), W, H)
    if m["cmds"]:
        n, f = m["cmds"]
        p.box("cmds", label(n.split("\n")[0], f, n.split("\n")[1] if "\n" in n else None), "app",
              X["A"], ry(r0 + 2), W, H, size=12)

    n, tok, f = m["port"]
    p.box("port", label(n, f, f"token {tok}"), "app", X["P"], ry(r0), W, H)
    for k, (fn, fm) in enumerate(m["foreign"], start=1):
        p.box(f"fport{k}", label(fn, None, f"de {fm}"), "app", X["P"], ry(r0 + k), W, H, foreign=True)

    n, f = m["adapter"]
    p.box("adp", label(n, f, "@Injectable · implements " + m["port"][0]), "infra", X["S"], ry(r0), W, H,
          size=12)
    n, f = m["pmapper"]
    p.box("pmap", label(n, f), "infra", X["S"], ry(r0 + 1), W, H)
    p.box("ent", label(m["entities"][0], "entities/*.entity.ts", "@Entity TypeORM"), "infra",
          X["S"], ry(r0 + 2), W, H)

    # Contenedor de dominio
    nd = len(m["domain"])
    rows_used = max(3, 1 + len(m["foreign"]))
    dom_y = ry(r0) - 30
    dom_h = max(ry(r0 + rows_used) - 40 - dom_y, 40 + nd * 100)
    p.lane("dom", "Dominio · src/domain/", "dom", X["D"], dom_y, DW, dom_h)
    for i, (dn, df) in enumerate(m["domain"]):
        p.box(f"d{i}", label(dn, df), "dom", 20, 45 + i * 100, DW - 40, 80, parent="dom")

    # --- Aristas (todas verificadas en el código) ---
    yc = lambda r: ry(r) + H / 2  # noqa: E731
    if o:
        p.edge("e-sched", "sched", "svc", "", ex=(1, 0.5), en=(0, 0.25),
               pts=[(X["A"] - 40, yc(0)), (X["A"] - 40, ry(r0) + H * 0.25)], offset=(0, -10))
    p.edge("e-ctrl-svc", "ctrl", "svc", "", ex=(1, 0.6), en=(0, 0.6))
    p.edge("e-ctrl-dto", "ctrl", "dto", "", ex=(0.5, 1), en=(0.5, 0))
    p.edge("e-ctrl-hmap", "ctrl", "hmap", "", ex=(0, 0.8), en=(0, 0.2),
           pts=[(X["E"] - 25, ry(r0) + H * 0.8), (X["E"] - 25, ry(r0 + 2) + H * 0.2)])
    p.edge("e-hmap-dto", "hmap", "dto", "", ex=(0.5, 0), en=(0.5, 1))
    if m["cmds"]:
        p.edge("e-hmap-cmds", "hmap", "cmds", "", ex=(1, 0.5), en=(0, 0.5))
        p.edge("e-svc-cmds", "svc", "cmds", "", ex=(0.5, 1), en=(0.5, 0))

    # Service -> puertos (propio recto; ajenos por carriles con x decreciente)
    p.edge("e-svc-port", "svc", "port", "", ex=(1, 0.4), en=(0, 0.4))
    gap_l, gap_r = X["A"] + W, X["P"]
    for k in range(1, len(m["foreign"]) + 1):
        ey = 0.55 + 0.13 * k
        lx = gap_r - 20 - 15 * (k - 1)
        p.edge(f"e-svc-fport{k}", "svc", f"fport{k}", "", ex=(1, ey), en=(0, 0.5),
               pts=[(lx, ry(r0) + H * ey), (lx, yc(r0 + k))])

    # Adaptador
    p.edge("e-adp-port", "adp", "port", "implementa", kind="impl", ex=(0, 0.5), en=(1, 0.5),
           offset=(0, -12))
    p.edge("e-adp-pmap", "adp", "pmap", "", ex=(0.5, 1), en=(0.5, 0))
    p.edge("e-pmap-ent", "pmap", "ent", "", ex=(0.5, 1), en=(0.5, 0))
    p.edge("e-adp-ent", "adp", "ent", "", ex=(0, 0.85), en=(0, 0.5),
           pts=[(X["S"] - 25, ry(r0) + H * 0.85), (X["S"] - 25, yc(r0 + 2))])

    # Dependencias hacia el dominio
    p.edge("e-adp-dom", "adp", "dom", "", ex=(1, 0.5), en=(0, (yc(r0) - dom_y) / dom_h))
    p.edge("e-pmap-dom", "pmap", "dom", "", ex=(1, 0.5), en=(0, (yc(r0 + 1) - dom_y) / dom_h))
    t1, t2 = ry(r0) - 70, ry(r0) - 50
    if o:
        t1, t2 = ry(r0) - 60, ry(r0) - 45
    p.edge("e-svc-dom", "svc", "dom", "", ex=(0.5, 0), en=(0.75, 0),
           pts=[(X["A"] + W / 2, t1), (X["D"] + DW * 0.75, t1)])
    p.edge("e-port-dom", "port", "dom", "", ex=(0.5, 0), en=(0.35, 0),
           pts=[(X["P"] + W / 2, t2), (X["D"] + DW * 0.35, t2)])
    bottom = max(ry(r0 + rows_used) - 40, dom_y + dom_h)
    b1, b2 = bottom + 70, bottom + 45
    p.edge("e-hmap-dom", "hmap", "dom", "", ex=(0.5, 1), en=(0.75, 1),
           pts=[(X["E"] + W / 2, b1), (X["D"] + DW * 0.75, b1)])
    if m["cmds"] and m["cmds_dom"]:
        p.edge("e-cmds-dom", "cmds", "dom", "", ex=(0.5, 1), en=(0.35, 1),
               pts=[(X["A"] + W / 2, b2), (X["D"] + DW * 0.35, b2)])

    note = ("Flecha continua: depende de (import, inyección por constructor o uso estático). Service → puerto: @Inject(TOKEN). Adaptador → entidad: @InjectRepository. "
            "Flecha discontinua con triángulo: implementa la interfaz. "
            "Borde discontinuo: puerto de otro módulo; su adaptador aparece en la página de ese módulo. "
            "Las flechas al contenedor de dominio indican import de alguna de sus clases "
            "(detalle en TRAZABILIDAD.md).")
    if not (m["cmds"] and m["cmds_dom"]) and m["cmds"]:
        note += " Los comandos de este módulo solo importan el tipo UUID (src/utils/types.ts)."
    p.note("nota", note, 40, b1 + 30, 1800, 50)
    return p


def modules_page():
    p = Page("comp-modulos", "0. Módulos Nest")
    p.text("t", "¿Cómo se componen los módulos Nest? (src/app.module.ts, src/modules/)", 40, 10, 1500, 40,
           size=20)
    BW, BH = 260, 80
    p.box("app", label("AppModule", "src/app.module.ts", "controllers: AppController · providers: AppService"),
          "ext", 60, 80, 340, BH, size=12)
    p.box("sch", label("ScheduleModule.forRoot()", "@nestjs/schedule"), "ext", 460, 80, BW, BH)
    p.box("dbm", label("DatabaseModule", "modules/database.module.ts", "TypeOrmModule.forRoot(postgres)"),
          "ext", 780, 80, BW, BH)
    p.db("pg", "<b>PostgreSQL</b><br><font style=\"font-size:10px\">DB_HOST · DB_NAME (env)<br>"
         "synchronize: false</font>", 1100, 70, 200, 100)
    p.edge("e-app-sch", "app", "sch", "importa", ex=(1, 0.5), en=(0, 0.5))
    p.edge("e-app-dbm", "app", "dbm", "", ex=(0.5, 0), en=(0.5, 0),
           pts=[(230, 50), (910, 50)])  # noqa
    p.edge("e-dbm-pg", "dbm", "pg", "conecta", ex=(1, 0.5), en=(0, 0.5))

    p.lane("feat", "Módulos de funcionalidad (importados por AppModule)", "ext", 40, 230, 1700, 520)
    cx = {0: 30, 1: 370, 2: 710, 3: 1050, 4: 1390}
    ry_ = {"u": 60, "m": 220, "l": 380}
    pos = {
        "rental": (0, "m"), "property": (1, "u"), "client": (1, "l"), "owner": (2, "u"),
        "bank": (3, "m"), "city": (3, "l"), "country": (4, "m"),
    }
    exports = {
        "country": "exporta COUNTRY_REPOSITORY, CountryService",
        "city": "exporta CITY_REPOSITORY, CityService",
        "bank": "exporta BANK_REPOSITORY, BankService",
        "owner": "exporta solo OWNER_REPOSITORY",
        "property": "exporta PROPERTY_REPOSITORY, PropertyService",
        "client": "exporta CLIENT_REPOSITORY, ClientService",
        "rental": "exporta RENTAL_REPOSITORY, RentalService",
    }
    for m in MODULES:
        c, r = pos[m["key"]]
        p.box(f"m-{m['key']}", label(m["name"], "modules/" + m["file"], exports[m["key"]]), "ext",
              cx[c], ry_[r], BW, BH, parent="feat", size=12)
    p.edge("e-app-feat", "app", "feat", "importa", ex=(0.5, 1), en=(0.15, 0))

    # Coordenadas absolutas del contenedor (40, 230)
    ax = lambda c, f=0.0: 40 + cx[c] + BW * f  # noqa: E731
    ay = lambda r, f=0.5: 230 + ry_[r] + BH * f  # noqa: E731
    p.edge("i-ren-pro", "m-rental", "m-property", "", ex=(0.75, 0), en=(0, 0.5),
           pts=[(ax(0, 0.75), ay("u"))])
    p.edge("i-ren-cli", "m-rental", "m-client", "", ex=(0.75, 1), en=(0, 0.5),
           pts=[(ax(0, 0.75), ay("l"))])
    p.edge("i-pro-own", "m-property", "m-owner", "", ex=(1, 0.5), en=(0, 0.5))
    p.edge("i-own-ban", "m-owner", "m-bank", "", ex=(1, 0.5), en=(0.75, 0),
           pts=[(ax(3, 0.75), ay("u"))])
    p.edge("i-pro-ban", "m-property", "m-bank", "", ex=(0.8, 1), en=(0.35, 0),
           pts=[(ax(1, 0.8), ay("u", 1) + 20), (ax(3, 0.35), ay("u", 1) + 20)])
    p.edge("i-pro-cit", "m-property", "m-city", "", ex=(0.5, 1), en=(0, 0.2),
           pts=[(ax(1, 0.5), ay("u", 1) + 40), (ax(2, 1) + 20, ay("u", 1) + 40),
                (ax(2, 1) + 20, ay("l", 0.2))])
    p.edge("i-cli-cit", "m-client", "m-city", "", ex=(1, 0.7), en=(0, 0.7))
    p.edge("i-cli-ban", "m-client", "m-bank", "", ex=(1, 0.35), en=(0, 0.5),
           pts=[(ax(2, 1) + 55, ay("l", 0.35)), (ax(2, 1) + 55, ay("m"))])
    p.edge("i-cli-cou", "m-client", "m-country", "", ex=(0.5, 1), en=(0.5, 1),
           pts=[(ax(1, 0.5), ay("l", 1) + 40), (ax(4, 0.5), ay("l", 1) + 40)])
    p.edge("i-cit-cou", "m-city", "m-country", "", ex=(1, 0.5), en=(0.3, 1),
           pts=[(ax(4, 0.3), ay("l"))])
    p.edge("i-ban-cou", "m-bank", "m-country", "", ex=(1, 0.5), en=(0, 0.5))

    p.note("nota", "Flecha: imports del decorador @Module. Gris: composición Nest (no es una capa). "
           "Cada módulo de funcionalidad registra además TypeOrmModule.forFeature([SuEntity]) y enlaza su "
           "puerto con { provide: TOKEN, useClass: XRepositoryTypeORM }. "
           "main.ts registra globalmente ValidationPipe y DatabaseExceptionFilter.", 40, 770, 1700, 50)
    return p


if __name__ == "__main__":
    pages = [modules_page()] + [module_page(m, i) for i, m in enumerate(MODULES, start=1)]
    write("../componentes.drawio", pages)
    print("componentes.drawio:", len(pages), "páginas")
