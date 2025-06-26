"""
----------------------------------------------------------
Archivo: routes/sitemap.py
Descripción: Rutas para sitemap.xml y robots.txt
Última modificación: 2025-07-05
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

from pathlib import Path
from fastapi import APIRouter, Response

router = APIRouter()

BASE_URL = "https://portatilesmercedes.com"

@router.get("/sitemap.xml", response_class=Response)
def sitemap_xml() -> Response:
    """Genera dinámicamente el sitemap y lo guarda en /static."""
    urls = [
        {"loc": f"{BASE_URL}/", "priority": 1.0},
        {"loc": f"{BASE_URL}/login", "priority": 0.9},
        {"loc": f"{BASE_URL}/cliente_panel", "priority": 0.8},
        {"loc": f"{BASE_URL}/empleado/panel", "priority": 0.8},
        {"loc": f"{BASE_URL}/admin/panel", "priority": 0.8},
        {"loc": f"{BASE_URL}/servicios", "priority": 0.7},
        {"loc": f"{BASE_URL}/contacto", "priority": 0.7},
        {"loc": f"{BASE_URL}/politica-privacidad", "priority": 0.6},
        {"loc": f"{BASE_URL}/galeria", "priority": 0.6},
        {"loc": f"{BASE_URL}/registro_clientes", "priority": 0.5},
        {"loc": f"{BASE_URL}/informacion-banos.html", "priority": 0.5},
        {"loc": f"{BASE_URL}/alquiler", "priority": 0.5},
        {"loc": f"{BASE_URL}/limpieza", "priority": 0.5},
        {"loc": f"{BASE_URL}/ventas", "priority": 0.5},
        {"loc": f"{BASE_URL}/debito", "priority": 0.5},
    ]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        xml += f'  <url><loc>{u["loc"]}</loc><priority>{u["priority"]}</priority></url>\n'
    xml += '</urlset>'
    Path("static/sitemap.xml").write_text(xml, encoding="utf-8")
    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt", response_class=Response)
def robots_txt() -> Response:
    """Devuelve robots.txt con la referencia al sitemap."""
    content = (
        "User-agent: *\n"
        "Disallow:\n\n"
        f"Sitemap: {BASE_URL}/sitemap.xml"
    )
    Path("static/robots.txt").write_text(content, encoding="utf-8")
    return Response(content=content, media_type="text/plain")
# Recordar actualizar el sitemap si se agregan nuevas rutas al sistema.
