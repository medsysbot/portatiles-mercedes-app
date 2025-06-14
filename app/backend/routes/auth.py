import os
import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from supabase import create_client, Client
from passlib.context import CryptContext
from jose import jwt
from dotenv import load_dotenv

load_dotenv()

# --- Configuración de Supabase y JWT ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ROLE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

if not SUPABASE_URL or not SUPABASE_KEY or not JWT_SECRET:
    raise RuntimeError("Variables de entorno de Supabase o JWT no configuradas")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Crear carpeta de logs si no existe ---
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "login_events.log")

# --- Configuración de logging ---
logger = logging.getLogger("login_events")
logger.setLevel(logging.INFO)
if not logger.handlers:
    file_handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    logger.propagate = False

# --- Esquema de entrada ---
class LoginInput(BaseModel):
    email: str
    password: str

# --- Router de login ---
router = APIRouter()

@router.post("/login")
async def login(datos: LoginInput):
    try:
        email = datos.email
        password = datos.password

        logger.info(f"Intento de login para: {email}")

        # Buscar usuario por email
        response = (
            supabase.table("usuarios")
            .select("*")
            .eq("email", email)
            .single()
            .execute()
        )

        if response.error:
            logger.warning(f"Login fallido – usuario no encontrado: {email}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

        usuario = response.data
        hashed_password = usuario.get("password") or usuario.get("password_hash")

        if not hashed_password or not pwd_context.verify(password, hashed_password):
            logger.warning(f"Login fallido – contraseña incorrecta: {email}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

        # Generar token
        token_data = {"sub": usuario["email"], "rol": usuario.get("rol")}
        token = jwt.encode(token_data, JWT_SECRET, algorithm=ALGORITHM)

        logger.info(f"Login exitoso: {email}")
        return {"access_token": token, "rol": usuario.get("rol"), "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error inesperado en login para {datos.email if 'datos' in locals() else 'desconocido'}: {e}"
        )
        raise HTTPException(status_code=500, detail="Error interno en el servidor")
