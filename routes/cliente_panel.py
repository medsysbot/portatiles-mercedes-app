"""
----------------------------------------------------------
Archivo: routes/cliente_panel.py
Descripción: Rutas completas API y HTML del panel de clientes (PWA)
Proyecto: Portátiles Mercedes
Última modificación: 2025-07-07
----------------------------------------------------------
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from utils.supabase_client import supabase
from utils.auth_utils import verificar_token  # igual que en empleados
import logging
import os

# ========= SETUP =========
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "cliente_events.log")
logger = logging.getLogger("cliente_events")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# ========= RUTAS HTML (Panel cliente PWA) =========

@router.get("/cliente/panel")
async def html_panel_cliente(request: Request, token_data: dict = Depends(verificar_token)):
    return templates.TemplateResponse("cliente_panel.html", {"request": request})

@router.get("/clientes/datos_personales")
async def html_datos_personales(request: Request, token_data: dict = Depends(verificar_token)):
    return templates.TemplateResponse("clientes_datos.html", {"request": request})

@router.get("/clientes/alquileres")
async def html_alquileres(request: Request, token_data: dict = Depends(verificar_token)):
    return templates.TemplateResponse("clientes_alquileres.html", {"request": request})

@router.get("/clientes/facturas_pendientes")
async def html_facturas_pendientes(request: Request, token_data: dict = Depends(verificar_token)):
    return templates.TemplateResponse("clientes_facturas_pendientes.html", {"request": request})

@router.get("/clientes/comprobantes")
async def html_comprobantes(request: Request, token_data: dict = Depends(verificar_token)):
    return templates.TemplateResponse("clientes_comprobantes.html", {"request": request})

@router.get("/clientes/mis_compras")
async def html_mis_compras(request: Request, token_data: dict = Depends(verificar_token)):
    return templates.TemplateResponse("clientes_mis_compras.html", {"request": request})

@router.get("/clientes/servicios_limpieza")
async def html_servicios_limpieza(request: Request, token_data: dict = Depends(verificar_token)):
    return templates.TemplateResponse("clientes_servicios_limpieza.html", {"request": request})

@router.get("/clientes/emails")
async def html_emails(request: Request, token_data: dict = Depends(verificar_token)):
    return templates.TemplateResponse("clientes_emails.html", {"request": request})

# ========= API ENDPOINTS (SIEMPRE AUTENTICADO, igual que empleados) =========

def get_dni_from_email(email: str):
    """Busca el dni_cuit_cuil del cliente por su email."""
    res = (
        supabase.table("datos_personales_clientes")
        .select("dni_cuit_cuil")
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    if not getattr(res, "data", None) or not res.data.get("dni_cuit_cuil"):
        raise HTTPException(status_code=404, detail="Datos de usuario no encontrados")
    return res.data["dni_cuit_cuil"]

@router.get("/clientes/datos_personales_api")
async def get_datos_personales(token_data: dict = Depends(verificar_token)):
    email = token_data["email"]
    try:
        resp = (
            supabase.table("datos_personales_clientes")
            .select("dni_cuit_cuil,nombre,apellido,direccion,telefono,razon_social,email")
            .eq("email", email)
            .single()
            .execute()
        )
        if getattr(resp, "data", None):
            return resp.data
        raise HTTPException(status_code=404, detail="Datos no encontrados")
    except Exception as exc:
        logger.error(f"Error consultando datos de cliente: {exc}")
        raise HTTPException(status_code=500, detail=f"Error consultando datos: {exc}")

@router.get("/clientes/alquileres_api")
async def get_alquileres(token_data: dict = Depends(verificar_token)):
    dni = get_dni_from_email(token_data["email"])
    try:
        res = (
            supabase.table("alquileres")
            .select("numero_bano,cliente_nombre,direccion,fecha_inicio,fecha_fin,observaciones")
            .eq("dni_cuit_cuil", dni)
            .execute()
        )
        return res.data or []
    except Exception as exc:
        logger.error(f"Error consultando alquileres: {exc}")
        raise HTTPException(status_code=500, detail=f"Error consultando alquileres: {exc}")

@router.get("/clientes/facturas_pendientes_api")
async def get_facturas_pendientes(token_data: dict = Depends(verificar_token)):
    dni = get_dni_from_email(token_data["email"])
    try:
        res = (
            supabase.table("facturas_pendientes")
            .select("fecha,numero_factura,razon_social,monto_adeudado")
            .eq("dni_cuit_cuil", dni)
            .execute()
        )
        return res.data or []
    except Exception as exc:
        logger.error(f"Error consultando facturas pendientes: {exc}")
        raise HTTPException(status_code=500, detail=f"Error consultando facturas: {exc}")

@router.get("/clientes/compras_api")
async def get_compras(token_data: dict = Depends(verificar_token)):
    dni = get_dni_from_email(token_data["email"])
    try:
        res = (
            supabase.table("ventas")
            .select("fecha_operacion,tipo_bano,forma_pago,observaciones")
            .eq("dni_cuit_cuil", dni)
            .execute()
        )
        return res.data or []
    except Exception as exc:
        logger.error(f"Error consultando compras: {exc}")
        raise HTTPException(status_code=500, detail=f"Error consultando compras: {exc}")

@router.get("/clientes/servicios_limpieza_api")
async def get_servicios_limpieza(token_data: dict = Depends(verificar_token)):
    dni = get_dni_from_email(token_data["email"])
    try:
        res = (
            supabase.table("servicios_limpieza")
            .select("fecha_servicio,numero_bano,tipo_servicio,remito_url,observaciones")
            .eq("dni_cuit_cuil", dni)
            .execute()
        )
        return res.data or []
    except Exception as exc:
        logger.error(f"Error consultando servicios de limpieza: {exc}")
        raise HTTPException(status_code=500, detail=f"Error consultando limpiezas: {exc}")

@router.get("/clientes/emails_api")
async def get_emails(token_data: dict = Depends(verificar_token)):
    email = token_data["email"]
    try:
        res = (
            supabase.table("emails_enviados")
            .select("fecha,asunto,estado")
            .eq("email_destino", email)
            .order("fecha", desc=True)
            .limit(10)
            .execute()
        )
        return res.data or []
    except Exception as exc:
        logger.error(f"Error consultando emails: {exc}")
        raise HTTPException(status_code=500, detail=f"Error consultando emails: {exc}")

@router.get("/clientes/comprobantes_api")
async def get_comprobantes(token_data: dict = Depends(verificar_token)):
    dni = get_dni_from_email(token_data["email"])
    try:
        res = (
            supabase.table("comprobantes_pago")
            .select("nombre_cliente,dni_cuit_cuil,numero_factura,comprobante_url,fecha")
            .eq("dni_cuit_cuil", dni)
            .execute()
        )
        return res.data or []
    except Exception as exc:
        logger.error(f"Error consultando comprobantes: {exc}")
        raise HTTPException(status_code=500, detail=f"Error consultando comprobantes: {exc}")

# ========= ENDPOINT PARA GUARDAR/ACTUALIZAR DATOS DEL CLIENTE =========

@router.post("/clientes/guardar_datos_personales")
async def guardar_datos_personales(request: Request, token_data: dict = Depends(verificar_token)):
    email = token_data["email"]
    data = await request.json()
    try:
        # Se asegura que se guarda para el cliente autenticado
        data["email"] = email
        resultado = (
            supabase.table("datos_personales_clientes")
            .upsert(data, on_conflict="dni_cuit_cuil")
            .execute()
        )
        if getattr(resultado, "error", None) is None:
            return JSONResponse(
                content={"mensaje": "¡Datos guardados correctamente!"},
                status_code=200,
            )
        logger.error(f"Error guardando datos: {resultado.error}")
        return JSONResponse(
            content={"error": getattr(resultado.error, "message", str(resultado.error))},
            status_code=400,
        )
    except Exception as e:
        logger.error(f"Excepción al guardar datos: {str(e)}")
        return JSONResponse(
            content={"error": f"Error interno: {str(e)}"}, status_code=500
        )
