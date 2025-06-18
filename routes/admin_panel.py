"""
----------------------------------------------------------
Archivo: routes/admin_panel.py
Descripción: Endpoints para el panel administrativo de la empresa
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

"""Endpoints para el panel administrativo de la empresa."""

from datetime import date, datetime

from fastapi import APIRouter, HTTPException, Query, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from passlib.hash import bcrypt


supabase = None

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

    contexto = {
        "request": request,
        "clientes": [],
        "pagina_actual": page,
        "hay_mas": False,
        "query_str": "",
    }
    return templates.TemplateResponse("clientes_admin.html", contexto)


@router.get("/admin/clientes/nuevo", response_class=HTMLResponse)
def form_nuevo_cliente(request: Request):
    """Formulario para crear un nuevo cliente."""
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
    return RedirectResponse("/admin/clientes", status_code=303)


# ============================ Empleados ============================

@router.get("/admin/empleados", response_class=HTMLResponse)
def admin_empleados_page(request: Request, mensaje: str | None = Query(None)):
    """Listado de empleados y administradores."""
    empleados = []
    if supabase:
        resp = supabase.table("usuarios").select("*").execute()
        empleados = [
            u for u in getattr(resp, "data", []) or [] if u.get("rol") in ("Empleado", "Administrador")
        ]
    contexto = {"request": request, "empleados": empleados, "mensaje": mensaje}
    return templates.TemplateResponse("empleados_admin.html", contexto)


@router.get("/admin/empleados/nuevo", response_class=HTMLResponse)
def form_nuevo_empleado(request: Request):
    """Formulario para crear un nuevo empleado."""
    return templates.TemplateResponse("empleado_form.html", {"request": request})


@router.post("/admin/empleados/nuevo")
def crear_empleado(
    nombre: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    rol: str = Form(...),
):
    """Alta de empleados o administradores desde el panel."""
    if not password:
        raise HTTPException(status_code=400, detail="Contraseña requerida")
    if rol not in ("Empleado", "Administrador"):
        raise HTTPException(status_code=400, detail="Rol inv\u00e1lido")
    if supabase:
        existe = (
            supabase.table("usuarios").select("id").eq("email", email).execute()
        )
        if getattr(existe, "data", []):
            raise HTTPException(status_code=400, detail="Ese email ya est\u00e1 registrado")
        insertar = supabase.table("usuarios").insert({
            "nombre": nombre,
            "email": email,
            # Modificación: El alta de empleados requiere definir una contraseña inicial
            # para que pueda autenticarse y obtener su token JWT.
            "password_hash": bcrypt.hash(password),
            "rol": rol,
            "activo": True,
            "creado_en": datetime.now().isoformat(),
        }).execute()
        if getattr(insertar, "error", None) is not None or not insertar.data:
            raise HTTPException(status_code=500, detail="No se pudo crear el usuario")
    return {"mensaje": "Empleado creado correctamente"}


@router.get("/admin/clientes/{dni}/editar", response_class=HTMLResponse)
def form_editar_cliente(dni: str, request: Request):
    """Formulario de edición de un cliente existente."""
    return templates.TemplateResponse(
        "cliente_form.html",
        {"request": request, "cliente": None},
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
    return RedirectResponse("/admin/clientes", status_code=303)


@router.post("/admin/clientes/{dni}/eliminar")
def eliminar_cliente(dni: str):
    """Elimina un cliente por su DNI."""
    return RedirectResponse("/admin/clientes", status_code=303)

@router.get("/admin/alquileres", response_class=HTMLResponse)
def admin_alquileres_page(request: Request):
    """Gestión de alquileres."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("alquileres_admin.html", {"request": request})

@router.get("/admin/ventas", response_class=HTMLResponse)
def admin_ventas_page(request: Request):
    """Gestión de ventas."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("ventas_admin.html", {"request": request})

@router.get("/admin/limpiezas", response_class=HTMLResponse)
def admin_limpiezas_page(request: Request):
    """Registro de limpiezas."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("limpiezas_admin.html", {"request": request})

@router.get("/admin/limpieza", response_class=HTMLResponse)
def admin_limpieza_page(request: Request):
    """Registro de limpiezas."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("limpieza_admin.html", {"request": request})

@router.get("/admin/morosos", response_class=HTMLResponse)
def admin_morosos_page(request: Request):
    """Listado de clientes morosos."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("morosos_admin.html", {"request": request})

@router.get("/admin/emails", response_class=HTMLResponse)
def admin_emails_page(request: Request):
    """Módulo de envíos de emails."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("emails_admin.html", {"request": request})

@router.get("/admin/ia-respuestas", response_class=HTMLResponse)
@router.get("/admin/ia/respuestas", response_class=HTMLResponse)
def admin_ia_respuestas_page(request: Request):
    """Respuestas automáticas con IA."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("ia_respuestas_admin.html", {"request": request})

@router.get("/admin/ia/clasificados", response_class=HTMLResponse)
def admin_ia_clasificados_page(request: Request):
    """Clasificados generados por IA."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("ia_clasificados_admin.html", {"request": request})

@router.get("/admin/graficos", response_class=HTMLResponse)
def admin_graficos_page(request: Request):
    """Visualización de gráficos y estadísticas."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("graficos_admin.html", {"request": request})

@router.get("/admin/facturas", response_class=HTMLResponse)
def admin_facturas_page(request: Request):
    """Facturas pendientes y emitidas."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("facturas_admin.html", {"request": request})


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
    if supabase:
        consulta = supabase.table("clientes").select("*")
        if dni:
            consulta = consulta.eq("dni", dni)
        resp = consulta.execute()
        clientes = getattr(resp, "data", []) or []
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
    return []


@router.get("/admin/api/alquileres")
async def admin_alquileres(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    dni: str | None = Query(None),
):
    """Alquileres con filtros por fecha y cliente."""
    return []


@router.get("/admin/api/ventas")
async def admin_ventas(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    cliente: str | None = Query(None),
):
    """Ventas realizadas con filtros por fecha y nombre de cliente."""
    return []


@router.get("/admin/api/limpiezas")
async def admin_limpiezas(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    dni: str | None = Query(None),
):
    """Limpiezas registradas con filtros por fecha y cliente."""
    return []
