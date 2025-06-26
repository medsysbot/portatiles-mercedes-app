"""
----------------------------------------------------------
Archivo: routes/login.py
Descripción: Funciones de autenticación y registro de usuarios
Acceso: Privado
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
----------------------------------------------------------
"""
"""Funciones de autenticación y registro de usuarios."""

import os
import logging
import traceback
from fastapi import APIRouter, HTTPException, status, Form, Response, Request
from pydantic import BaseModel
from supabase import create_client, Client
from passlib.context import CryptContext
from passlib.hash import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
import secrets
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

# ==== Configuración de Supabase ====
# Configuración de Supabase y JWT
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
APP_URL = os.getenv("APP_URL", "http://localhost:8000")

# Configuración de logging
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
    """Imprime errores anteriores al inicio."""
# ==== Lógica de validación ====
    log_path = os.path.join(LOG_DIR, "error_login.log")
    try:
        if os.path.isfile(log_path):
            with open(log_path, "r") as f:
                print(f.read())
    except Exception as exc:  # pragma: no cover
        print(f"No se pudo leer {log_path}: {exc}")

imprimir_log_error()

class LoginInput(BaseModel):
    email: str
    # IMPORTANTE: El campo debe llamarse "password" (sin ñ ni tilde) en todo el flujo
    password: str
    rol: str

class RecuperarInput(BaseModel):
    email: str

class ResetInput(BaseModel):
    token: str
    password: str

router = APIRouter()
# ==== Endpoints ====

@router.post("/login")
async def login(datos: LoginInput, response: Response):
    """Autentica a un usuario y genera un token de acceso.

    Parámetros
    ----------
    datos : LoginInput
        Objeto con las credenciales enviadas por el cliente. Incluye
        `email`, `password` y `rol`.

    Retorna
    -------
    dict
        Información del usuario junto con un token JWT si las
        credenciales son correctas.

    Errores
    -------
    HTTPException 401
        Usuario o contraseña incorrectos.
    HTTPException 403
        El usuario existe pero se encuentra inactivo.
    HTTPException 500
# ==== Lógica de generación de token ====
        Error interno al procesar la solicitud.
    """
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
        # Debug: imprimir valores recibidos y hash antes de decidir
        print(f"Email recibido: {email}")
        print(f"Password recibido: {password}")
        print(f"Rol recibido: {rol}")
        print(f"Hash leído: {hashed_password}")
        print(f"Resultado de pwd_context.verify: {verificacion}")

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
        raise HTTPException(status_code=500, detail="Error interno en el servidor")

@router.post("/verificar_token")
def verificar_token(data: dict):
    """Valida un token JWT y extrae la información del usuario.

    Parámetros
    ----------
    data : dict
        Diccionario que debe contener la clave ``token`` con el
        JWT emitido por el sistema.

    Retorna
    -------
    dict
        Estado de la verificación y datos básicos del usuario si el
        token es válido.

    Errores
    -------
    HTTPException 401
        Cuando el token está ausente o es inválido.
    """
# ==== Lógica de registro ====
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
    """Registra un usuario final con rol ``cliente``.

    Elimina la lógica antigua de direcciones y guarda la
    contraseña de forma segura mediante ``bcrypt``.
    """

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
        # El campo "activo" se agrega automáticamente en el backend,
        # nunca es visible ni editable para el cliente.
        datos_insert = {
            "nombre": nombre,
            "email": email,
            "password_hash": password_hash,
            "rol": "cliente",
            "activo": True,  # El campo "activo" se agrega automáticamente
        }
        # <!--
        # Eliminado envío y lógica de campos creado_en y actualizado_en porque ya no existen en la tabla usuarios.
        # -->
        print("Datos a insertar en usuarios:", datos_insert)
        try:
            resp = supabase.table("usuarios").insert(datos_insert).execute()
        except Exception as e:  # pragma: no cover - debug supabase errors
            print("Error al insertar en usuarios:", e)
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
    """Inicia el proceso de recuperación de contraseña."""
    mensaje = {"mensaje": "Si el email existe, se envió un correo de recuperación"}
    email = datos.email.strip().lower()
    try:
        resp = supabase.table("usuarios").select("id").eq("email", email).execute()
        if getattr(resp, "data", []):
            token = secrets.token_urlsafe(32)
            expira = (datetime.utcnow() + timedelta(minutes=30)).isoformat()
            supabase.table("reset_tokens").insert({
                "email": email,
                "token": token,
                "expira": expira,
                "usado": False,
            }).execute()
            if all([EMAIL_ORIGEN, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT]):
                msg = EmailMessage()
                msg["From"] = EMAIL_ORIGEN
                msg["To"] = email
                msg["Subject"] = "Recuperar contraseña"
                base_url = APP_URL or str(request.base_url).rstrip("/")
                enlace = f"{base_url}/reset_password?token={token}"
                msg.set_content(
                    f"Para restablecer tu contraseña hacé clic en el siguiente enlace:\n{enlace}\n\nSi no solicitaste este cambio podés ignorar este mensaje."
                )
                with smtplib.SMTP_SSL(SMTP_SERVER, int(SMTP_PORT)) as smtp:
                    smtp.login(EMAIL_ORIGEN, EMAIL_PASSWORD)
                    smtp.send_message(msg)
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.error("Error en recuperar_password: %s", exc)
    return mensaje


@router.post("/reset_password")
async def reset_password(datos: ResetInput):
    """Actualiza la contraseña si el token es válido."""
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
        if exp and datetime.fromisoformat(exp) < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Token inválido o expirado")

        pwd_hash = pwd_context.hash(nueva)
        supabase.table("usuarios").update({"password_hash": pwd_hash}).eq("email", registro["email"]).execute()
        supabase.table("reset_tokens").update({"usado": True}).eq("token", token).execute()
        return {"mensaje": "Contraseña actualizada"}
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - dependencias externas
        logger.error("Error en reset_password: %s", exc)
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
