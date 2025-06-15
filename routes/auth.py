import os
import logging
import traceback
from fastapi import APIRouter, HTTPException, status, Form
from pydantic import BaseModel
from supabase import create_client, Client
from passlib.context import CryptContext
from passlib.hash import bcrypt
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

# Configuración de Supabase y JWT
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
JWT_EXP_MINUTES = 60

if not SUPABASE_URL or not SUPABASE_KEY or not JWT_SECRET:
    raise RuntimeError("Variables de entorno de Supabase o JWT no configuradas")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración de logging
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "login_events.log")
logger = logging.getLogger("login_events")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

def imprimir_log_error():
    """Imprime errores anteriores al inicio."""
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
    password: str
    rol: str

router = APIRouter()

@router.post("/login")
async def login(datos: LoginInput):
    try:
        email = datos.email
        password = datos.password
        rol = datos.rol

        logger.info(f"Intento de login para: {email} con rol {rol}")

        response = (
            supabase.table("usuarios")
            .select("*")
            .eq("email", email)
            .eq("rol", rol)
            .single()
            .execute()
        )

        if (
            not response.data
            or (hasattr(response, "status_code") and response.status_code != 200)
            or getattr(response, "error", None) is not None
        ):
            logger.warning(f"Login fallido – usuario no encontrado: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )

        usuario = response.data
        hashed_password = usuario.get("password") or usuario.get("password_hash")

        print("HASH LEÍDO DE BASE:")
        print(f"[{hashed_password}]")
        print(f"LARGO: {len(hashed_password) if hashed_password else 'None'}")

        print(f"EMAIL RECIBIDO: [{email}]")
        print(f"PASSWORD RECIBIDO: [{password}]")
        print(f"ROL RECIBIDO: [{rol}]")

        if not hashed_password or not pwd_context.verify(password, hashed_password):
            logger.warning(f"Login fallido – contraseña incorrecta: {email}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

        if not usuario.get("activo", True):
            logger.warning(f"Login fallido – usuario inactivo: {email}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")

        token_data = {
            "sub": usuario["email"],
            "rol": usuario.get("rol"),
            "nombre": usuario.get("nombre"),
        }
        token = jwt.encode(token_data, JWT_SECRET, algorithm=ALGORITHM)

        logger.info(f"Login exitoso: {email}")
        return {
            "access_token": token,
            "rol": usuario.get("rol"),
            "nombre": usuario.get("nombre"),
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
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Token faltante")
    try:
        datos = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return {"status": "ok", "rol": datos.get("rol"), "user_id": datos.get("sub")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.post("/registrar_cliente")
def registrar_cliente(email: str = Form(...), password: str = Form(...)):
    hash_pwd = bcrypt.hash(password)
    resp = (
        supabase.table("usuarios")
        .insert({"email": email, "password_hash": hash_pwd, "rol": "cliente"})
        .execute()
    )
    if (
        not resp.data
        or (hasattr(resp, "status_code") and resp.status_code != 200)
        or getattr(resp, "error", None) is not None
    ):
        raise HTTPException(status_code=400, detail=str(getattr(resp, "error", "Error en Supabase")))
    return {"mensaje": "Registro exitoso"}
