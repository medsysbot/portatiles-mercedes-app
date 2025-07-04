@router.post("/login")
async def login(datos: LoginInput, response: Response):
    """Autentica a un usuario y genera un token de acceso."""
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
        response.set_cookie(key="access_token", value=token, httponly=True)

        logger.info(f"Login exitoso: {email}")

        # Nueva lógica: si es cliente, redirige al splash con nombre
        if usuario.get("rol", "").lower() == "cliente":
            nombre_usuario = usuario.get("nombre", "Cliente")
            response = Response(
                status_code=303,  # redirect see-other
                headers={"Location": f"/splash_cliente?nombre_usuario={nombre_usuario}"}
            )
            return response

        # Para roles distintos de cliente, responde JSON como antes
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
