from fastapi import APIRouter, HTTPException, Request
import traceback
router = APIRouter()

@router.post("/login")
async def login(request: Request):
    try:
        print("LOGIN: Recibiendo request")
        data = await request.json()
        print("LOGIN: DATA RECIBIDA:", data)
        email = data.get("email")
        password = data.get("password")
        print("LOGIN: email:", email, "password:", password)
        from app.backend.supabase_client import supabase
        result = supabase.table("usuarios").select("*").eq("email", email).execute()
        print("LOGIN: Resultado de consulta:", result)
        if not result.data:
            print("LOGIN: Usuario no encontrado")
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        usuario = result.data[0]
        print("LOGIN: Usuario encontrado:", usuario)
        import os
        from passlib.hash import bcrypt
        if not bcrypt.verify(password, usuario["password_hash"]):
            print("LOGIN: Password incorrecto")
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        import jwt
        JWT_SECRET = os.getenv("JWT_SECRET")
        token = jwt.encode({
            "id": usuario["id"],
            "email": usuario["email"],
            "rol": usuario["rol"]
        }, JWT_SECRET, algorithm="HS256")
        print("LOGIN: Token generado correctamente")
        return {
            "token": token,
            "usuario": {
                "id": usuario["id"],
                "email": usuario["email"],
                "rol": usuario["rol"],
                "nombre": usuario["nombre"]
            }
        }
    except Exception as e:
        print("ERROR LOGIN:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/test_env")
def test_env():
    import os
    return {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_ROLE_KEY": os.getenv("SUPABASE_ROLE_KEY"),
        "JWT_SECRET": os.getenv("JWT_SECRET"),
    }
