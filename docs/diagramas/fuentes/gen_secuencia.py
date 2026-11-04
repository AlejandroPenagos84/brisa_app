"""Genera secuencia-actualizar-propiedad.drawio con seqlayout.py (drawio-skill) y aplica colores por capa."""
import json
import re
import sys

sys.path.insert(0, "/home/alejandropenagos/.kiro/skills/drawio-skill/scripts")
import seqlayout  # noqa: E402

seqlayout.LIFELINE_W = 190
seqlayout.HEADER_H = 50
seqlayout.TOP = 110
seqlayout.MIN_SPACING = 230
seqlayout.LIFELINE = seqlayout.LIFELINE.replace("size=40;", "size=50;")
seqlayout.ACTOR = seqlayout.LIFELINE + ("participant=umlActor;verticalAlign=bottom;"
                                        "spacingBottom=-14;labelBackgroundColor=#ffffff;")

OUT = "../secuencia-actualizar-propiedad.drawio"
spec = json.load(open("secuencia-actualizar-propiedad.json", encoding="utf-8"))
s = seqlayout.layout(spec)

COL = {"cli": ("#f5f5f5", "#666666"), "pipes": ("#dae8fc", "#6c8ebf"), "ctrl": ("#dae8fc", "#6c8ebf"),
       "hmap": ("#dae8fc", "#6c8ebf"), "svc": ("#d5e8d4", "#82b366"), "prop": ("#ffe599", "#bf9000"),
       "repo": ("#dae8fc", "#6c8ebf"), "pmap": ("#dae8fc", "#6c8ebf"), "db": ("#f5f5f5", "#666666")}
for pid, (fill, stroke) in COL.items():
    s = re.sub(rf'(<mxCell id="{pid}" [^>]*style=")', rf"\1fillColor={fill};strokeColor={stroke};fontSize=12;fontStyle=1;", s)
s = s.replace("fillColor=#fff2cc;strokeColor=#d6b656;", "fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;")
s = s.replace('verticalAlign=bottom;endArrow=', 'verticalAlign=bottom;fontSize=11;endArrow=')

extra = (
    '<mxCell id="titulo" value="¿En qué orden se ejecuta PATCH /properties/:id? (PropertyService.update)" '
    'style="text;html=1;align=left;verticalAlign=middle;fontSize=20;fontStyle=1;" vertex="1" parent="1">'
    '<mxGeometry x="40" y="10" width="1400" height="40" as="geometry"/></mxCell>\n'
    '<mxCell id="sub" value="Notas rojas: condición o error. Flecha continua: llamada. Discontinua gris: retorno. '
    'Azul: infraestructura · Verde: aplicación · Ámbar: dominio · Gris: externo. '
    'Las ramas de status (pasos INACTIVE / ACTIVE) son alternativas; solo se ejecuta la que corresponde." '
    'style="text;html=1;align=left;verticalAlign=middle;fontSize=12;fontColor=#555555;whiteSpace=wrap;" '
    'vertex="1" parent="1"><mxGeometry x="40" y="50" width="1900" height="40" as="geometry"/></mxCell>\n')
s = s.replace('<mxCell id="1" parent="0"/>\n', '<mxCell id="1" parent="0"/>\n' + extra, 1)
open(OUT, "w", encoding="utf-8").write(s)
print("ok")
