"""Genera corte-actualizar-propiedad.drawio (PATCH /properties/:id).

Fuente: PropertyController.update, PropertyService.update/applyFieldChanges/
applyStatusChange/applyOccupancy, PropertyRepositoryTypeORM.findById/
findOccupiedPropertyIds/update, PropertyMapper, main.ts (pipes y filtro).
"""
from drawlib import Page, label, write

H = 70
r = lambda i: 120 + 120 * i  # noqa: E731
C = {0: (40, 150), 1: (240, 220), 2: (520, 260), 3: (860, 260), 4: (1200, 280), 5: (1560, 260)}


def bx(p, cid, text, layer, c, row, h=H, **kw):
    x, w = C[c]
    p.box(cid, text, layer, x, r(row) if row is not None else kw.pop("y"), w, h, **kw)


p = Page("corte", "Actualizar propiedad")
p.text("t", "¿Qué componentes ejecuta PATCH /properties/:id y en qué orden?", 40, 10, 1600, 40, size=20)
p.text("st", "Los números de las flechas remiten a los pasos de la leyenda.", 40, 52, 1000, 25, size=12,
       bold=False, color="#555555")

p.box("cli", label("Cliente HTTP"), "ext", 40, r(1), 150, H)
bx(p, "pipes", label("ValidationPipe", "main.ts (global)", "+ ParseUUIDPipe en :id"), "infra", 1, 1)
bx(p, "ctrl", label("PropertyController.update", "http/controllers/property.controller.ts"), "infra", 2, 1,
   size=12)
bx(p, "req", label("UpdatePropertyRequest", "http/dto/request/update/update-property.request.ts"), "infra",
   2, 2, size=12)
bx(p, "hmap", label("PropertyHttpMapper", "http/mappers/property-http.mapper.ts"), "infra", 2, 3)
bx(p, "res", label("PropertyResponse", "http/dto/response/property.response.ts"), "infra", 2, 4)

p.box("err", "<b>Excepciones de @nestjs/common</b><br><font style=\"font-size:11px\">NotFoundException → 404"
      "<br>BadRequestException → 400<br>ConflictException → 409</font>",
      "app", 860, 90, 260, 110, size=12)
bx(p, "svc", label("PropertyService.update", "application/services/property-service.ts"), "app", 3, 1,
   size=12)
bx(p, "cmd", label("UpdatePropertyCommand", "application/commands/update-property.command.ts"), "app", 3, 3,
   size=12)
bx(p, "port", label("PropertyRepository", "application/ports/out/repositories/property-repository.ts",
                    "token PROPERTY_REPOSITORY"), "app", 4, 1, size=12)

bx(p, "adp", label("PropertyRepositoryTypeORM", "persistence/repositories_impl/property-repository-typeorm.ts"),
   "infra", 4, 3, size=12)
bx(p, "pmap", label("PropertyMapper", "persistence/mapper/property-mapper.ts"), "infra", 4, 4)
bx(p, "ent", label("PropertyEntity · RentalEntity", "persistence/entities/", "@Entity properties · rentals"),
   "infra", 4, 5, size=12)
p.db("pg", "<b>PostgreSQL</b><br><font style=\"font-size:11px\">tablas properties, rentals</font>",
     1230, r(6), 220, 90)

bx(p, "prop", label("Property · PropertyStatus", "domain/property.ts"), "dom", 5, 1)

# Flujo de ida
p.edge("f1", "cli", "pipes", "1", ex=(1, 0.6), en=(0, 0.6))
p.edge("f1e", "pipes", "cli", "400", kind="err", ex=(0, 0.25), en=(1, 0.25))
p.edge("f1v", "pipes", "req", "1 valida", ex=(0.5, 1), en=(0, 0.5), pts=[(350, r(2) + H / 2)])
p.edge("f1c", "pipes", "ctrl", "1", ex=(1, 0.6), en=(0, 0.6))
p.edge("f1b", "ctrl", "req", "@Body", ex=(0.5, 1), en=(0.5, 0))
p.edge("f2", "ctrl", "hmap", "2, 9", ex=(1, 0.85), en=(1, 0.2),
       pts=[(820, r(1) + H * 0.85), (820, r(3) + H * 0.2)])
p.edge("f2r", "hmap", "req", "2 lee", ex=(0.5, 0), en=(0.5, 1))
p.edge("f2c", "hmap", "cmd", "2 crea", ex=(1, 0.7), en=(0, 0.7))
p.edge("f3", "ctrl", "svc", "3", ex=(1, 0.45), en=(0, 0.45))
p.edge("f3c", "svc", "cmd", "3 lee", ex=(0.5, 1), en=(0.5, 0))
p.edge("f4", "svc", "port", "4, 6, 7, 8", ex=(1, 0.55), en=(0, 0.55))
p.edge("fimp", "adp", "port", "implementa", kind="impl", ex=(0.5, 0), en=(0.5, 1))
p.edge("f5", "svc", "prop", "5, 6, 8", ex=(1, 0.2), en=(0.5, 0),
       pts=[(1160, r(1) + H * 0.2), (1160, 215), (1690, 215)], offset=(0, -10))
p.edge("fdb", "adp", "pg", "4, 6, 7, 8", ex=(0, 0.8), en=(0, 0.5),
       pts=[(1170, r(3) + H * 0.8), (1170, r(6) + 45)], offset=(0, -90))
p.edge("fpm", "adp", "pmap", "4, 7", ex=(0.5, 1), en=(0.5, 0))
p.edge("fpe", "pmap", "ent", "4, 7", ex=(0.5, 1), en=(0.5, 0))
p.edge("fpp", "pmap", "prop", "4, 7", ex=(1, 0.5), en=(0.3, 1), pts=[(1638, r(4) + H / 2)])
p.edge("ferr", "svc", "err", "lanza (4, 5, 6)", kind="err", ex=(0.5, 0), en=(0.5, 1))
# Vuelta
p.edge("f9", "hmap", "res", "9 crea", ex=(0.5, 1), en=(0.5, 0))
p.edge("f10", "res", "cli", "10 · 200 OK", kind="ret", ex=(0, 0.5), en=(0.5, 1),
       pts=[(115, r(4) + H / 2)], offset=(120, 0))
p.edge("ferr2", "err", "cli", "404 / 400 / 409", kind="err", ex=(0, 0.5), en=(0.5, 0),
       pts=[(115, 145)], offset=(200, 0))

steps = [
    "1. PATCH /properties/:id. ParseUUIDPipe valida :id y ValidationPipe valida el cuerpo como "
    "UpdatePropertyRequest (whitelist, forbidNonWhitelisted). Si falla → 400.",
    "2. PropertyHttpMapper.fromUpdateRequestToCommand(request) → UpdatePropertyCommand (recorta address).",
    "3. PropertyService.update(id, command).",
    "4. propertyRepository.findById(id) → findOneBy({ id }) → PropertyMapper.fromEntityToDomain → Property. "
    "Si es null → NotFoundException 404.",
    "5. applyFieldChanges: changeAddress / changeArea / changeNumberOfRooms / changeCapacity / changePrice "
    "para cada campo presente. Error de dominio → BadRequestException 400.",
    "6. applyStatusChange (solo si llega status): INACTIVE → deactivate() si no estaba inactiva. "
    "ACTIVE con inactivación manual → findOccupiedPropertyIds([id]); con alquileres → ConflictException 409; "
    "sin alquileres → activate().",
    "7. propertyRepository.update(id, property) → existsBy({ id }) + save(PropertyMapper.fromDomainToEntity) "
    "→ fromEntityToDomain.",
    "8. applyOccupancy: findOccupiedPropertyIds([id]) → property.applyOccupancy(ocupada).",
    "9. PropertyHttpMapper.fromDomainToResponse(updated) → PropertyResponse.",
    "10. Respuesta 200 con PropertyResponse.",
    "Pendiente de verificación: si la fila desaparece entre los pasos 4 y 7, el adaptador lanza Error "
    "genérico (sin mapeo HTTP explícito). DatabaseExceptionFilter solo traduce QueryFailedError 23505/23P01 "
    "a 409; no se identificó ninguna restricción de properties que lo dispare en este flujo.",
]
p.note("leyenda", "<b>Pasos</b><br>" + "<br>".join(steps), 40, 730, 1100, 200)
p.note("colores", "<b>Colores</b><br>Azul: infraestructura<br>Verde: aplicación<br>Ámbar: dominio<br>"
       "Gris: cliente externo y base de datos<br><br><b>Flechas</b><br>Continua: llamada / uso<br>"
       "Discontinua con triángulo: implementa<br>Discontinua gris: respuesta<br>Discontinua roja: error",
       1560, 730, 260, 230)

write("../corte-actualizar-propiedad.drawio", [p])
print("ok")
