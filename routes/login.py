"""
----------------------------------------------------------
Archivo: routes/login.py
Descripción: Funciones de autenticación y registro de usuarios
Acceso: Privado
Proyecto: Portátiles Mercedes
Última modificación: 2025-07-07
----------------------------------------------------------
"""
import os
import logging
import traceback
from fastapi import APIRouter, HTTPException, status, Form, Response, Request, Body
from pydantic import BaseModel
from supabase import create_client, Client
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
import secrets
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
JWT_EXP_MINUTES = 60

faltantes = [
    nombre
    for nombre, valor in {
        "SUPABASE_URL": SUPABASE_URL,
        "SUPABASE_KEY": SUPABASE_KEY,
        "JWT_SECRET": JWT_SECRET,
    }.items()
    if not valor
]
if faltantes:
    raise RuntimeError(
        "Faltan variables de entorno requeridas: " + ", ".join(faltantes)
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
EMAIL_ORIGEN = os.getenv("EMAIL_ORIGEN")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")
APP_URL = os.getenv("APP_URL")

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "login_events.log")
logger = logging.getLogger("login_events")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

def imprimir_log_error():
    log_path = os.path.join(LOG_DIR, "error_login.log")
    try:
        if os.path.isfile(log_path):
            with open(log_path, "r") as f:
                logger.error(f.read())
    except Exception as exc:
        logger.error("No se pudo leer %s: %s", log_path, exc)

imprimir_log_error()

def enviar_email_recuperacion(destino: str, token: str, base_url: str) -> None:
    if not all([EMAIL_ORIGEN, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT]):
        logger.error("Variables SMTP faltantes - no se puede enviar correo")
        raise Exception("SMTP no configurado")

    enlace = f"{base_url}/reset_password?token={token}"
    msg = EmailMessage()
    msg["From"] = EMAIL_ORIGEN
    msg["To"] = destino
    msg["Subject"] = "Recuperar contraseña"
    msg.set_content(
        "Para restablecer tu contraseña hacé clic en el siguiente enlace:\n"
        f"{enlace}\n\nSi no solicitaste este cambio podés ignorar este mensaje."
    )

    logger.info(
        "Preparando email de recuperación | destino=%s token=%s url=%s",
        destino,
        token,
        enlace,
    )
    with smtplib.SMTP_SSL(SMTP_SERVER, int(SMTP_PORT)) as smtp:
        smtp.login(EMAIL_ORIGEN, EMAIL_PASSWORD)
        smtp.send_message(msg)
    logger.info("Correo de recuperación enviado a %s", destino)

class LoginInput(BaseModel):
    email: str
    password: str
    rol: str

class RecuperarInput(BaseModel):
    email: str

class ResetInput(BaseModel):
    token: str
    password: str

router = APIRouter()

@router.post("/login")
async def login(datos: LoginInput, response: Response):
    try:
        email = datos.email
        password = datos.password
        rol = datos.rol

        logger.info(f"Intento de login para: {email} con rol {rol}")

        try:
            supabase_resp = (
                supabase.table("usuarios")
                .select("*")
                .eq("email", email)
                .execute()
            )
        except Exception as exc:
            logger.warning(
                f"Login fallido – error consultando usuario: {email} ({exc})"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )

        usuarios = getattr(supabase_resp, "data", []) or []
        usuario = next(
            (
                u
                for u in usuarios
                if u.get("rol", "").lower() == rol.lower()
            ),
            None,
        )

        if (
            not usuarios
            or (hasattr(supabase_resp, "status_code") and supabase_resp.status_code != 200)
            or getattr(supabase_resp, "error", None) is not None
            or usuario is None
        ):
            logger.warning(f"Login fallido – usuario no encontrado: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario o contraseña incorrectos",
            )
        hashed_password = usuario.get("password") or usuario.get("password_hash")
        verificacion = False
        if hashed_password:
            verificacion = pwd_context.verify(password, hashed_password)

        if not hashed_password or not verificacion:
            logger.warning(f"Login fallido – contraseña incorrecta: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario o contraseña incorrectos",
            )

        if not usuario.get("activo", True):
            logger.warning(f"Login fallido – usuario inactivo: {email}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")

        token_data = {
            "sub": usuario["email"],
            "id": usuario.get("id"),
            "rol": usuario.get("rol"),
            "nombre": usuario.get("nombre"),
            "exp": datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES),
        }
        token = jwt.encode(token_data, JWT_SECRET, algorithm=ALGORITHM)

        logger.info(f"Login exitoso: {email}")
        response.set_cookie(key="access_token", value=token, httponly=True)

        # --- Solución para panel de clientes: incluir dni_cuit_cuil en la respuesta ---
        if usuario.get("rol", "").lower() == "cliente":
            try:
                datos_cli = (
                    supabase.table("datos_personales_clientes")
                    .select("dni_cuit_cuil, nombre")
                    .eq("email", usuario["email"])
                    .maybe_single()
                    .execute()
                )
                cli = getattr(datos_cli, "data", None)
            except Exception as exc:
                logger.error("Error obteniendo datos del cliente: %s", exc)
                cli = None
            return {
                "access_token": token,
                "usuario": {
                    "dni_cuit_cuil": cli.get("dni_cuit_cuil") if isinstance(cli, dict) else None,
                    "email": usuario["email"],
                    "nombre": cli.get("nombre") if isinstance(cli, dict) else usuario.get("nombre", ""),
                },
            }
        # --- Fin solución clientes ---

        return {
            "access_token": token,
            "rol": usuario.get("rol"),
            "nombre": usuario.get("nombre"),
            "id": usuario.get("id"),
            "token_type": "bearer",
        }
    except HTTPException:
        raise
    except Exception:
        with open(os.path.join(LOG_DIR, "error_login.log"), "a") as f:
            f.write(traceback.format_exc())
        imprimir_log_error()
        raise HTTPException(status_code=500, detail="Error interno del sistema. Contacte al administrador.")

@router.post("/verificar_token")
def verificar_token(data: dict):
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Token faltante")
    try:
        datos = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return {
            "status": "ok",
            "rol": datos.get("rol"),
            "user_id": datos.get("id"),
            "email": datos.get("sub"),
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

@router.post("/registrar_cliente")
def registrar_cliente(
    nombre: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
):
    if not password:
        raise HTTPException(status_code=400, detail="Contraseña requerida")

    if supabase:
        existe = (
            supabase.table("usuarios").select("id").eq("email", email).execute()
        )
        if getattr(existe, "data", []):
            raise HTTPException(
                status_code=400, detail="El email ya está registrado"
            )

        password_hash = pwd_context.hash(password)
        datos_insert = {
            "nombre": nombre,
            "email": email,
            "password_hash": password_hash,
            "rol": "cliente",
            "activo": True,
        }
        try:
            resp = supabase.table("usuarios").insert(datos_insert).execute()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        if (
            not resp.data
            or (hasattr(resp, "status_code") and resp.status_code != 200)
            or getattr(resp, "error", None) is not None
        ):
            logger.error(
                f"Registro fallido para {email}: {getattr(resp, 'error', 'Error en Supabase')}"
            )
            raise HTTPException(
                status_code=400,
                detail=str(getattr(resp, "error", "Error en Supabase")),
            )

    logger.info(f"Registro exitoso para nuevo cliente: {email}")
    return {"mensaje": "Registro exitoso"}

@router.post("/recuperar_password")
async def recuperar_password(datos: RecuperarInput, request: Request):
    mensaje = {"mensaje": "Si el email existe, se envió un correo de recuperación"}
    email = datos.email.strip().lower()
    logger.info("Solicitud de recuperación recibida para %s", email)
    try:
        resp = supabase.table("usuarios").select("id").eq("email", email).execute()
        if getattr(resp, "data", []):
            logger.info("Usuario encontrado, generando token de recuperación")
            token = secrets.token_urlsafe(32)
            expira = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
            logger.info(
                "Token generado para %s | token=%s expira=%s", email, token, expira
            )
            resp_token = (
                supabase.table("reset_tokens")
                .insert({
                    "email": email,
                    "token": token,
                    "expira": expira,
                    "usado": False,
                })
                .execute()
            )
            logger.info(
                "Respuesta de Supabase al registrar token: %s", getattr(resp_token, "data", None)
            )
            if not getattr(resp_token, "data", None):
                logger.error("Fallo al registrar el token en Supabase: %s", getattr(resp_token, "error", "desconocido"))
                raise HTTPException(
                    status_code=500,
                    detail="Error registrando token de recuperación",
                )

            base_url = APP_URL or str(request.base_url).rstrip("/")
            try:
                enviar_email_recuperacion(email, token, base_url)
            except Exception as exc:
                logger.exception("Error enviando email de recuperación: %s", exc)
                raise HTTPException(
                    status_code=500,
                    detail="No se pudo enviar el email de recuperación, intente nuevamente más tarde.",
                )
        else:
            logger.info("Recuperación solicitada para email inexistente: %s", email)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error en recuperar_password: %s", exc)
    return mensaje

@router.post("/reset_password")
async def reset_password(datos: ResetInput):
    token = datos.token
    nueva = datos.password
    try:
        res = (
            supabase.table("reset_tokens").select("email, expira, usado").eq("token", token).single().execute()
        )
        registro = getattr(res, "data", None)
        if not registro or registro.get("usado"):
            raise HTTPException(status_code=400, detail="Token inválido o expirado")
        exp = registro.get("expira")
        if exp:
            exp_dt = datetime.fromisoformat(exp)
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            if exp_dt < datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Token inválido o expirado")
        pwd_hash = pwd_context.hash(nueva)
        supabase.table("usuarios").update({"password_hash": pwd_hash}).eq("email", registro["email"]).execute()
        supabase.table("reset_tokens").update({"usado": True}).eq("token", token).execute()
        return {"mensaje": "Contraseña actualizada"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error en reset_password: %s", exc)
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
