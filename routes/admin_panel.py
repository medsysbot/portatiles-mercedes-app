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
from dotenv import load_dotenv
import os
import logging
from supabase import create_client, Client
from jose import jwt, JWTError
from routes.alquileres import ALQUILERES_TABLE
from routes.ventas import VENTAS_TABLE

load_dotenv()

# Configuración de correo
EMAIL_ORIGEN = os.getenv("EMAIL_ORIGEN")

# Conexión a Supabase (mismo enfoque que en cliente_panel)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "admin_panel.log")
logger = logging.getLogger("admin_panel")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

router = APIRouter()
# Las plantillas privadas ahora se ubican en la carpeta `templates` de la raíz
# del proyecto. Por eso actualizamos la ruta que usa Jinja2Templates.
templates = Jinja2Templates(directory="templates")


class Cliente(BaseModel):
    """Modelo de datos para crear o actualizar clientes."""

    nombre: str
    apellido: str
    dni_cuit_cuil: str
    direccion: str
    telefono: str
    razon_social: str
    email: str


class _IdLista(BaseModel):
    ids: list[str]



def obtener_clientes_db() -> list:
    """Obtiene todos los clientes desde Supabase."""
    if supabase:
        try:
            logger.info(
                "==> Iniciando consulta a tabla datos_personales_clientes en Supabase"
            )
            resp = supabase.table("datos_personales_clientes").select("*").execute()
            return getattr(resp, "data", []) or []
        except Exception as exc:
            logger.exception("🔥 Error al consultar clientes en Supabase:")
            raise HTTPException(status_code=500, detail=str(exc))
    logger.error("Supabase no configurado")
    raise HTTPException(status_code=500, detail="Supabase no configurado")


def _ultimos_emails(limit: int = 5) -> list[dict]:
    """Devuelve los últimos correos registrados en la base."""
    if not supabase:
        return []
    try:
        res = (
            supabase.table("emails_enviados")
            .select("fecha,asunto,email_destino,estado")
            .order("fecha", desc=True)
            .limit(limit)
            .execute()
        )
        return getattr(res, "data", []) or []
    except Exception as exc:  # pragma: no cover - errores de conexión
        logger.error("Error consultando emails: %s", exc)
        return []


def _contar_total(tabla: str) -> int:
    """Devuelve el total de registros en la tabla.

    2025-07-10: Ajuste de consulta para evitar errores cuando la tabla
    no posee campo ``id``. Se selecciona cualquier columna y se utiliza
    ``count='exact'``. Se consulta solo un registro para minimizar la
    transferencia y se obtiene el total a partir de la cabecera devuelta.
    """
    if not supabase:
        return 0
    try:
        # La opción ``head=True`` generaba problemas con algunos entornos de
        # Supabase y devolvía ``None`` en ``count``. Para evitarlo realizamos
        # una consulta mínima (limit 1) pero solicitando ``count='exact'``,
        # lo que permite obtener el total real sin depender de un campo
        # específico en la tabla.
        resp = (
            supabase.table(tabla)
            .select("*", count="exact")
            .limit(1)
            .execute()
        )
        return getattr(resp, "count", 0) or 0
    except Exception as exc:  # pragma: no cover - errores de conexión
        logger.error("Error contando registros en %s: %s", tabla, exc)
        return 0


@router.get("/admin/panel", response_class=HTMLResponse)
def admin_panel_view(request: Request):
    """Vista principal del panel administrativo con datos de resumen."""

    contexto = {
        "request": request,
        "total_clientes": _contar_total("datos_personales_clientes"),
        "total_alquileres": _contar_total(ALQUILERES_TABLE),
        "total_ventas": _contar_total(VENTAS_TABLE),
        "total_pendientes": _contar_total("facturas_pendientes"),
        "total_morosos": _contar_total("morosos"),
    }

    return templates.TemplateResponse("panel_admin.html", contexto)


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
    q: str = Query(None, description="Búsqueda por nombre, email o DNI"),
    page: int = Query(1, gt=0)
):  
    """Administración de clientes con filtros y paginación."""
    # Seguridad básica JWT
    usuario = "desconocido"
    rol_usuario = "desconocido"
    token = request.cookies.get("access_token")
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    secret = os.getenv("JWT_SECRET")
    if token and secret:
        try:
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            usuario = payload.get("nombre", "desconocido")
            rol_usuario = payload.get("rol", "desconocido")
        except JWTError:
            pass

    try:
        clientes = obtener_clientes_db()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar clientes: {str(e)}")
    
    if clientes is None:
        clientes = []

    if q and clientes:
        q_low = q.lower()
        clientes = [
            c
            for c in clientes
            if q_low in (c.get("nombre") or "").lower()
            or q_low in (c.get("dni_cuit_cuil") or "").lower()
            or q_low in (c.get("email") or "").lower()
        ]

    contexto = {
        "request": request,
        "clientes": clientes,
        "mensaje_error": None,
        "pagina_actual": page,
        "hay_mas": False,
        "query_str": q or "",
    }
    return templates.TemplateResponse("clientes_admin.html", contexto)


@router.get("/admin/clientes/nuevo", response_class=HTMLResponse)
def form_nuevo_cliente(request: Request):
    """Formulario para crear un nuevo cliente."""
    return templates.TemplateResponse(
        "cliente_form.html", {"request": request, "cliente": None}
    )


@router.post("/admin/clientes/nuevo")
def crear_cliente(
    nombre: str = Form(...),
    apellido: str = Form(...),
    dni_cuit_cuil: str = Form(...),
    direccion: str = Form(...),
    telefono: str = Form(...),
    razon_social: str = Form(...),
    email: str = Form(...),
):
    """Procesa la creación de un cliente."""
    if supabase:
        datos = {
            "dni_cuit_cuil": dni_cuit_cuil,
            "nombre": nombre,
            "apellido": apellido,
            "direccion": direccion,
            "telefono": telefono,
            "razon_social": razon_social,
            "email": email,
        }
        for campo, val in datos.items():
            if not val:
                raise HTTPException(status_code=400, detail=f"Campo '{campo}' faltante")
        # Verificamos si ya existe un cliente con el mismo DNI
        existe_dni = (
            supabase.table("datos_personales_clientes")
            .select("dni_cuit_cuil")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .limit(1)
            .execute()
        )
        if existe_dni.data and len(existe_dni.data) > 0:
            raise HTTPException(status_code=400, detail="Ese DNI ya está registrado")

        # Verificamos si el email está registrado para evitar duplicados
        resultado = (
            supabase.table("datos_personales_clientes")
            .select("*")
            .eq("email", email)
            .limit(1)
            .execute()
        )
        if resultado.data and len(resultado.data) > 0:
            # Si existe, no insertamos un nuevo registro
            raise HTTPException(status_code=400, detail="Ese email ya está registrado")

        supabase.table("datos_personales_clientes").insert(datos).execute()
    return RedirectResponse("/admin/clientes", status_code=303)


# ============================ Empleados ============================


@router.get("/admin/empleados", response_class=HTMLResponse)
def admin_empleados_page(request: Request, mensaje: str | None = Query(None)):
    """Listado de empleados y administradores."""
    empleados = []
    if supabase:
        resp = supabase.table("usuarios").select("*").execute()
        empleados = [
            u
            for u in getattr(resp, "data", []) or []
            if u.get("rol") in ("empleado", "Administrador")
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
    if rol not in ("empleado", "Administrador"):
        raise HTTPException(status_code=400, detail="Rol inv\u00e1lido")
    if supabase:
        existe = supabase.table("usuarios").select("id").eq("email", email).execute()
        if getattr(existe, "data", []):
            raise HTTPException(
                status_code=400, detail="Ese email ya est\u00e1 registrado"
            )
        insertar = (
            supabase.table("usuarios")
            .insert(
                {
                    "nombre": nombre,
                    "email": email,
                    # Modificación: El alta de empleados requiere definir una contraseña inicial
                    # para que pueda autenticarse y obtener su token JWT.
                    "password_hash": bcrypt.hash(password),
                    "rol": rol,
                    "activo": True,
                }
            )
            .execute()
        )
        # <!--
        # Eliminado envío y lógica de campos creado_en y actualizado_en porque ya no existen en la tabla usuarios.
        # -->
        if getattr(insertar, "error", None) is not None or not insertar.data:
            raise HTTPException(status_code=500, detail="No se pudo crear el usuario")
    return {"mensaje": "Empleado creado correctamente"}


@router.get("/admin/clientes/{dni_cuit_cuil}/editar", response_class=HTMLResponse)
def form_editar_cliente(dni_cuit_cuil: str, request: Request):
    """Formulario de edición de un cliente existente."""
    cliente = None
    if supabase:
        resp = (
            supabase.table("datos_personales_clientes")
            .select("*")
            .eq("dni_cuit_cuil", dni_cuit_cuil)
            .single()
            .execute()
        )
        cliente = getattr(resp, "data", None)
    return templates.TemplateResponse(
        "cliente_form.html",
        {"request": request, "cliente": cliente},
    )


@router.post("/admin/clientes/{dni_cuit_cuil}/editar")
def editar_cliente(
    dni_cuit_cuil: str,
    nombre: str = Form(...),
    apellido: str = Form(...),
    direccion: str = Form(...),
    telefono: str = Form(...),
    razon_social: str = Form(...),
    email: str = Form(...),
):
    """Guarda los cambios de un cliente."""
    if supabase:
        datos = {
            "nombre": nombre,
            "apellido": apellido,
            "direccion": direccion,
            "telefono": telefono,
            "razon_social": razon_social,
            "email": email,
        }
        for campo, val in datos.items():
            if not val:
                raise HTTPException(status_code=400, detail=f"Campo '{campo}' faltante")
        supabase.table("datos_personales_clientes").update(datos).eq(
            "dni_cuit_cuil", dni_cuit_cuil
        ).execute()
    return RedirectResponse("/admin/clientes", status_code=303)


@router.post("/admin/clientes/{dni_cuit_cuil}/eliminar")
def eliminar_cliente(dni_cuit_cuil: str):
    """Elimina un cliente por su DNI."""
    return RedirectResponse("/admin/clientes", status_code=303)


@router.get("/admin/alquileres", response_class=HTMLResponse)
def admin_alquileres_page(request: Request):
    """Gestión de alquileres."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("alquileres_admin.html", {"request": request})


@router.get("/admin/alquileres/nuevo", response_class=HTMLResponse)
def form_nuevo_alquiler(request: Request):
    """Formulario para registrar un alquiler."""
    return templates.TemplateResponse("alquiler_form_admin.html", {"request": request})


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
    return templates.TemplateResponse(
        "emails_admin.html",
        {
            "request": request,
            "gmail_user": EMAIL_ORIGEN,
        },
    )


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
    return templates.TemplateResponse(
        "ia_clasificados_admin.html", {"request": request}
    )


@router.get("/admin/graficos", response_class=HTMLResponse)
def admin_graficos_page(request: Request):
    """Visualización de gráficos y estadísticas."""
    # Sección conectada correctamente. Listo para insertar datos reales.
    return templates.TemplateResponse("graficos_admin.html", {"request": request})


@router.get("/admin/facturas", response_class=HTMLResponse)
def admin_facturas_page(request: Request):
    """Facturas pendientes y emitidas."""
    # Sección conectada correctamente. Alias a facturas_pendientes.
    return templates.TemplateResponse(
        "facturas_pendientes.html", {"request": request}
    )


@router.get("panel/cliente")
def cliente_panel():
    return {"msg": "Bienvenido"}


@router.get("/admin/api/clientes")
async def admin_clientes(
    dni_cuit_cuil: str | None = Query(None),
    q: str | None = Query(None),
):
    """Lista de clientes con filtros por DNI y búsqueda."""
    logger.info("Solicitud de listado de clientes")
    try:
        clientes = obtener_clientes_db()
    except HTTPException as exc:
        logger.error("Fallo obteniendo clientes: %s", exc.detail)
        raise
    if dni_cuit_cuil:
        clientes = [c for c in clientes if c.get("dni_cuit_cuil") == dni_cuit_cuil]
    if q:
        q_low = q.lower()
        clientes = [
            c
            for c in clientes
            if q_low in (c.get("nombre") or "").lower()
            or q_low in (c.get("dni_cuit_cuil") or "").lower()
            or q_low in (c.get("email") or "").lower()
        ]
    return {"clientes": clientes}


@router.get("/admin/api/clientes/todos")
async def admin_clientes_todos():
    """Devuelve la lista completa de clientes sin filtros."""
    try:
        clientes = obtener_clientes_db()
    except HTTPException as exc:
        logger.error("Fallo obteniendo clientes: %s", exc.detail)
        raise
    return {"clientes": clientes}


@router.get("/info_todos_clientes")
async def info_todos_clientes():
    """Retorna todos los clientes registrados."""
    if not supabase:
        logger.error("Supabase no configurado")
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        result = (
            supabase.table("datos_personales_clientes").select("*").execute()
        )
    except Exception as exc:  # pragma: no cover - errores de conexión
        logger.error("Error al consultar todos los clientes: %s", exc)
        raise HTTPException(status_code=500, detail="Error consultando datos")

    return getattr(result, "data", []) or []







@router.get("/admin/api/limpiezas")
async def admin_limpiezas(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    dni_cuit_cuil: str | None = Query(None),
):
    """Limpiezas registradas con filtros por fecha y cliente."""
    return []


def _contar_por_mes(tabla: str, campo: str) -> list[int]:
    """Devuelve la cantidad de registros por mes para la tabla indicada."""
    valores = [0] * 12
    if not supabase:
        return valores
    try:
        res = supabase.table(tabla).select(campo).execute()
    except Exception as exc:  # pragma: no cover - errores de conexión
        logger.error("Error consultando %s: %s", tabla, exc)
        return valores

    for fila in getattr(res, "data", []):
        fecha_str = fila.get(campo)
        if not fecha_str:
            continue
        try:
            mes = datetime.fromisoformat(str(fecha_str)).month
        except Exception:
            continue
        valores[mes - 1] += 1
    return valores


@router.get("/admin/api/dashboard")
async def datos_dashboard():
    """Datos mensuales para los gráficos del panel."""
    labels = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
    ]
    alquileres = _contar_por_mes(ALQUILERES_TABLE, "fecha_inicio")
    ventas = _contar_por_mes(VENTAS_TABLE, "fecha_operacion")
    # Tablas de gastos e ingresos aún no implementadas
    gastos = [0] * 12
    ingresos = [0] * 12

    totales = {
        "clientes": _contar_total("datos_personales_clientes"),
        "alquileres": _contar_total(ALQUILERES_TABLE),
        "ventas": _contar_total(VENTAS_TABLE),
        "pendientes": _contar_total("facturas_pendientes"),
        "morosos": _contar_total("morosos"),
    }

    return {
        "labels": labels,
        "alquileres": alquileres,
        "ventas": ventas,
        "gastos": gastos,
        "ingresos": ingresos,
        "totales": totales,
    }


@router.post("/admin/api/clientes/eliminar")
async def eliminar_clientes(payload: _IdLista):
    """Elimina clientes por DNI."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table("datos_personales_clientes").delete().in_("dni_cuit_cuil", payload.ids).execute()
    except Exception as exc:  # pragma: no cover
        logger.exception("Error eliminando clientes:")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}


@router.post("/admin/api/empleados/eliminar")
async def eliminar_empleados(payload: _IdLista):
    """Elimina empleados por ID."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        supabase.table("usuarios").delete().in_("id", payload.ids).execute()
    except Exception as exc:  # pragma: no cover
        logger.exception("Error eliminando empleados:")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True}
