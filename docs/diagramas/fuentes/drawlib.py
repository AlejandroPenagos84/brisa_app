"""Utilidades mínimas para escribir XML de draw.io con estilos por capa."""
from xml.sax.saxutils import escape

LAYER = {
    "infra": ("#dae8fc", "#6c8ebf"),
    "app": ("#d5e8d4", "#82b366"),
    "dom": ("#ffe599", "#bf9000"),
    "ext": ("#f5f5f5", "#666666"),
}
HEADER_COLOR = {"infra": "#3d6aa8", "app": "#4f7f3a", "dom": "#9a7400", "ext": "#555555"}

EDGE_BASE = ("edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;"
             "strokeWidth=1.5;fontSize=11;labelBackgroundColor=#ffffff;jumpStyle=arc;jumpSize=10;")
EDGE_KIND = {
    "dep": "endArrow=block;endSize=8;",
    "impl": "endArrow=block;endFill=0;endSize=12;dashed=1;",
    "ret": "endArrow=open;endSize=8;dashed=1;strokeColor=#888888;fontColor=#666666;",
    "err": "endArrow=open;endSize=8;dashed=1;strokeColor=#b85450;fontColor=#b85450;",
}


def attr(v):
    return escape(str(v), {'"': "&quot;", "\n": "&#xa;"})


def label(title, sub=None, extra=None):
    """Etiqueta HTML: nombre real en negrita + archivo en gris."""
    parts = [f"<b>{escape(title)}</b>"]
    if extra:
        parts.append(f"<font style=\"font-size:11px\">{escape(extra)}</font>")
    if sub:
        parts.append(f"<font style=\"font-size:10px\" color=\"#555555\">{escape(sub)}</font>")
    return "<br>".join(parts)


class Page:
    def __init__(self, pid, name):
        self.pid, self.name, self.cells = pid, name, []

    def text(self, cid, value, x, y, w, h, size=14, bold=True, color="#000000", align="left"):
        st = (f"text;html=1;align={align};verticalAlign=middle;whiteSpace=wrap;fontSize={size};"
              f"fontStyle={1 if bold else 0};fontColor={color};")
        self._v(cid, value, st, x, y, w, h)

    def header(self, cid, value, layer, x, y, w):
        self.text(cid, value, x, y, w, 40, size=13, color=HEADER_COLOR[layer], align="center")

    def box(self, cid, value, layer, x, y, w, h, foreign=False, parent="1", size=13, extra=""):
        fill, stroke = LAYER[layer]
        st = (f"rounded=1;whiteSpace=wrap;html=1;fontSize={size};fillColor={fill};strokeColor={stroke};"
              + ("dashed=1;dashPattern=6 4;" if foreign else "") + extra)
        self._v(cid, value, st, x, y, w, h, parent)

    def db(self, cid, value, x, y, w, h):
        st = ("shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;size=12;fontSize=13;"
              "fillColor=#f5f5f5;strokeColor=#666666;")
        self._v(cid, value, st, x, y, w, h)

    def lane(self, cid, value, layer, x, y, w, h):
        fill, stroke = LAYER[layer]
        st = (f"swimlane;startSize=30;html=1;fontSize=13;fontStyle=1;rounded=0;fillColor={fill};"
              f"strokeColor={stroke};swimlaneFillColor=#fffdf5;container=1;collapsible=0;")
        self._v(cid, value, st, x, y, w, h)

    def note(self, cid, value, x, y, w, h, size=11):
        st = (f"text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;fontSize={size};"
              "fontColor=#333333;spacing=8;strokeColor=#bbbbbb;fillColor=#fafafa;rounded=0;")
        self._v(cid, value, st, x, y, w, h)

    def edge(self, cid, src, tgt, value="", kind="dep", ex=None, en=None, pts=None, offset=None,
             extra=""):
        st = EDGE_BASE + EDGE_KIND[kind] + extra
        if ex:
            st += f"exitX={ex[0]};exitY={ex[1]};exitDx=0;exitDy=0;"
        if en:
            st += f"entryX={en[0]};entryY={en[1]};entryDx=0;entryDy=0;"
        geo = ""
        if pts:
            geo += '<Array as="points">' + "".join(
                f'<mxPoint x="{px}" y="{py}"/>' for px, py in pts) + "</Array>"
        if offset:
            geo += f'<mxPoint as="offset" x="{offset[0]}" y="{offset[1]}"/>'
        self.cells.append(
            f'<mxCell id="{attr(cid)}" value="{attr(value)}" style="{st}" edge="1" parent="1" '
            f'source="{attr(src)}" target="{attr(tgt)}"><mxGeometry relative="1" as="geometry">'
            f"{geo}</mxGeometry></mxCell>")

    def _v(self, cid, value, st, x, y, w, h, parent="1"):
        self.cells.append(
            f'<mxCell id="{attr(cid)}" value="{attr(value)}" style="{st}" vertex="1" '
            f'parent="{attr(parent)}"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" '
            'as="geometry"/></mxCell>')

    def xml(self):
        body = "\n".join(self.cells)
        return (f'<diagram id="{attr(self.pid)}" name="{attr(self.name)}"><mxGraphModel grid="1" '
                'gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" '
                'pageScale="1" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
                f"\n{body}\n</root></mxGraphModel></diagram>")


def write(path, pages):
    with open(path, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="drawio" version="26.0.0">\n')
        f.write("\n".join(p.xml() for p in pages))
        f.write("\n</mxfile>\n")
