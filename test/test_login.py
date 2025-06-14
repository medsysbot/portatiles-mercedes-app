from app.utils.supabase_client import supabase
from passlib.hash import bcrypt
import jwt
import os
from dotenv import load_dotenv

load_dotenv()


def test_login_manual():
    email = "admin@portatiles.com"
    password = "admin123"
    JWT_SECRET = os.getenv("JWT_SECRET")

    assert JWT_SECRET, "Falta JWT_SECRET en entorno"

    assert supabase, "Supabase client no inicializado"

    res = supabase.table("usuarios").select("*").eq("email", email).execute()
    assert res.data, "Usuario no encontrado en Supabase"

    user = res.data[0]
    assert bcrypt.verify(password, user["password_hash"]), "Contraseña incorrecta"

    token = jwt.encode({
        "id": user["id"],
        "email": user["email"],
        "rol": user["rol"]
    }, JWT_SECRET, algorithm="HS256")

    print("✅ Login exitoso – token JWT generado:")
    print(token)


if __name__ == "__main__":
    test_login_manual()
