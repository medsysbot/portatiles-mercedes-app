"""
----------------------------------------------------------
Archivo: routes/admin_panel.py
Descripción: Endpoints para el panel administrativo de la empresa
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Endpoints para el panel administrativo de la empresa."""

from datetime import date
import os

from fastapi import APIRouter, HTTPException, Query, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from supabase import create_client, Client
from pydantic import BaseModel


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(
        "Advertencia: SUPABASE_URL y SUPABASE_KEY no estan configurados. "
        "La conexión a Supabase estará deshabilitada."
    )
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()
# Las plantillas privadas ahora se ubican en la carpeta `templates` de la raíz
# del proyecto. Por eso actualizamos la ruta que usa Jinja2Templates.
templates = Jinja2Templates(directory="templates")


class Cliente(BaseModel):
    """Modelo de datos para crear o actualizar clientes."""

    nombre: str
    apellido: str
    dni: str
    email: str
    telefono: str | None = None
    estado: str = "activo"
    observaciones: str | None = None


@router.get("/admin/panel", response_class=HTMLResponse)
def admin_panel_view(request: Request):
    """Vista principal del panel administrativo."""
    return templates.TemplateResponse("panel_admin.html", {"request": request})


# Vista principal de reportes
@router.get("/admin/reportes", response_class=HTMLResponse)
def admin_reportes_view(request: Request):
    """Pantalla inicial con resumen de reportes"""
    return templates.TemplateResponse("reportes_admin.html", {"request": request})


@router.get("/admin/mercadopago", response_class=HTMLResponse)
def admin_mercadopago_view(request: Request):
    """Panel para pagos y cobranzas."""
    return templates.TemplateResponse("mercadopago_admin.html", {"request": request})


@router.get("/admin/facturacion", response_class=HTMLResponse)
def admin_facturacion_view(request: Request):
    """Pantalla de facturación"""
    return templates.TemplateResponse("facturacion_admin.html", {"request": request})




@router.get("/admin/bash-generator", response_class=HTMLResponse)
def admin_bash_generator_view(request: Request):
    """Pantalla para generación de scripts bash"""
    return templates.TemplateResponse("bash_generator_admin.html", {"request": request})

# Secciones del panel
@router.get("/admin/clientes", response_class=HTMLResponse)
def admin_clientes_page(
    request: Request,
    q: str | None = Query(None, description="Búsqueda por nombre, email o DNI"),
    estado: str | None = Query(None),
    page: int = Query(1, gt=0),
):
    """Administración de clientes con filtros y paginación."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")

    resp = supabase.table("clientes").select("*").execute()
    if (
        resp.data is None
        or (hasattr(resp, "status_code") and resp.status_code != 200)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    clientes = resp.data
    if q:
        q_low = q.lower()
        clientes = [
            c
            for c in clientes
            if q_low in (c.get("nombre") or "").lower()
            or q_low in (c.get("apellido") or "").lower()
            or q_low in (c.get("email") or "").lower()
            or q_low in (c.get("dni") or "").lower()
        ]
    if estado:
        clientes = [c for c in clientes if c.get("estado") == estado]

    page_size = 20
    start = (page - 1) * page_size
    end = start + page_size
    paginados = clientes[start:end]
    hay_mas = end < len(clientes)

    # Conservar los query params excepto page para los enlaces de paginación
    params = request.query_params.multi_items()
    query_str = "&".join(
        f"{k}={v}" for k, v in params if k != "page"
    )

    contexto = {
        "request": request,
        "clientes": paginados,
        "pagina_actual": page,
        "hay_mas": hay_mas,
        "query_str": query_str,
    }
    return templates.TemplateResponse("clientes_admin.html", contexto)


@router.get("/admin/clientes/nuevo", response_class=HTMLResponse)
def form_nuevo_cliente(request: Request):
    """Formulario para crear un nuevo cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    return templates.TemplateResponse("cliente_form.html", {"request": request, "cliente": None})


@router.post("/admin/clientes/nuevo")
def crear_cliente(
    nombre: str = Form(...),
    apellido: str = Form(...),
    dni: str = Form(...),
    email: str = Form(...),
    telefono: str | None = Form(None),
    estado: str = Form("activo"),
    observaciones: str | None = Form(None),

):
    """Procesa la creación de un cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    datos = Cliente(
        nombre=nombre,
        apellido=apellido,
        dni=dni,
        email=email,
        telefono=telefono,
        estado=estado,
        observaciones=observaciones,
    ).model_dump()
    resp = supabase.table("clientes").insert(datos).execute()
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code != 201)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    return RedirectResponse("/admin/clientes", status_code=303)


@router.get("/admin/clientes/{dni}/editar", response_class=HTMLResponse)
def form_editar_cliente(dni: str, request: Request):
    """Formulario de edición de un cliente existente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    resp = supabase.table("clientes").select("*").eq("dni", dni).single().execute()
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code != 200)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return templates.TemplateResponse(
        "cliente_form.html",
        {"request": request, "cliente": resp.data},
    )


@router.post("/admin/clientes/{dni}/editar")
def editar_cliente(
    dni: str,
    nombre: str = Form(...),
    apellido: str = Form(...),
    email: str = Form(...),
    telefono: str | None = Form(None),
    estado: str = Form("activo"),
    observaciones: str | None = Form(None),
):
    """Guarda los cambios de un cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    datos = {
        "nombre": nombre,
        "apellido": apellido,
        "email": email,
        "telefono": telefono,
        "estado": estado,
        "observaciones": observaciones,
    }
    resp = supabase.table("clientes").update(datos).eq("dni", dni).execute()
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code not in (200, 204))
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    return RedirectResponse("/admin/clientes", status_code=303)


@router.post("/admin/clientes/{dni}/eliminar")
def eliminar_cliente(dni: str):
    """Elimina un cliente por su DNI."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    resp = supabase.table("clientes").delete().eq("dni", dni).execute()
    if (
        getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    return RedirectResponse("/admin/clientes", status_code=303)

@router.get("/admin/alquileres", response_class=HTMLResponse)
def admin_alquileres_page(request: Request):
    """Gestión de alquileres."""
    return templates.TemplateResponse("alquileres_admin.html", {"request": request})

@router.get("/admin/ventas", response_class=HTMLResponse)
def admin_ventas_page(request: Request):
    """Gestión de ventas."""
    return templates.TemplateResponse("ventas_admin.html", {"request": request})

@router.get("/admin/limpiezas", response_class=HTMLResponse)
def admin_limpiezas_page(request: Request):
    """Registro de limpiezas."""
    return templates.TemplateResponse("limpiezas_admin.html", {"request": request})

@router.get("/admin/morosos", response_class=HTMLResponse)
def admin_morosos_page(request: Request):
    """Listado de clientes morosos."""
    return templates.TemplateResponse("morosos_admin.html", {"request": request})

@router.get("/admin/emails", response_class=HTMLResponse)
def admin_emails_page(request: Request):
    """Módulo de envíos de emails."""
    return templates.TemplateResponse("emails_admin.html", {"request": request})

@router.get("/admin/ia-respuestas", response_class=HTMLResponse)
def admin_ia_respuestas_page(request: Request):
    """Respuestas automáticas con IA."""
    return templates.TemplateResponse("ia_respuestas_admin.html", {"request": request})


@router.get("/cliente_panel")
def cliente_panel():
    return {"msg": "Bienvenido"}


@router.get("/admin/api/clientes")
async def admin_clientes(
    dni: str | None = Query(None),
    q: str | None = Query(None),
    estado: str | None = Query(None),
):
    """Lista de clientes con filtros por DNI, búsqueda y estado."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    consulta = supabase.table("clientes").select("*")
    if dni:
        consulta = consulta.eq("dni", dni)
    resp = consulta.execute()
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code != 200)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    clientes = resp.data
    if q:
        q_low = q.lower()
        clientes = [
            c
            for c in clientes
            if q_low in (c.get("nombre") or "").lower()
            or q_low in (c.get("apellido") or "").lower()
            or q_low in (c.get("email") or "").lower()
            or q_low in (c.get("dni") or "").lower()
        ]
    if estado:
        clientes = [c for c in clientes if c.get("estado") == estado]
    return clientes


@router.get("/admin/api/alquileres")
async def admin_alquileres(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    dni: str | None = Query(None),
):
    """Alquileres con filtros por fecha y cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    consulta = supabase.table("alquileres").select("*")
    if dni:
        consulta = consulta.eq("dni_cliente", dni)
    if desde:
        consulta = consulta.gte("fecha_inicio", desde.isoformat())
    if hasta:
        consulta = consulta.lte("fecha_fin", hasta.isoformat())
    resp = consulta.execute()
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code != 200)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    return resp.data


@router.get("/admin/api/ventas")
async def admin_ventas(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    cliente: str | None = Query(None),
):
    """Ventas realizadas con filtros por fecha y nombre de cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    consulta = supabase.table("ventas").select("*")
    if cliente:
        consulta = consulta.ilike("cliente_nombre", f"%{cliente}%")
    if desde:
        consulta = consulta.gte("created_at", desde.isoformat())
    if hasta:
        consulta = consulta.lte("created_at", hasta.isoformat())
    resp = consulta.execute()
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code != 200)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    return resp.data


@router.get("/admin/api/limpiezas")
async def admin_limpiezas(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    dni: str | None = Query(None),
):
    """Limpiezas registradas con filtros por fecha y cliente."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    consulta = supabase.table("limpiezas").select("*")
    if dni:
        consulta = consulta.eq("dni_cliente", dni)
    if desde:
        consulta = consulta.gte("fecha_hora", desde.isoformat())
    if hasta:
        consulta = consulta.lte("fecha_hora", hasta.isoformat())
    resp = consulta.execute()
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code != 200)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=str(getattr(resp, "error", "Error en Supabase")),
        )
    return resp.data
