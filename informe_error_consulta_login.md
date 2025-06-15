# Manejo de error de consulta en /login

Se encapsuló la llamada `.single().execute()` dentro de un bloque `try/except` para evitar que un error de Supabase devuelva `500` al cliente. Si la consulta no arroja exactamente una fila, se registra una advertencia y se responde con `401` y el mensaje "Credenciales inválidas".

## Código final

```python
        try:
            response = (
                supabase.table("usuarios")
                .select("*")
                .eq("email", email)
                .eq("rol", rol)
                .single()
                .execute()
            )
        except Exception as exc:  # pragma: no cover - Supabase errors
            logger.warning(
                f"Login fallido – consulta sin resultado para {email}: {exc}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )
```

## Ejemplo de log

```
2025-06-16 09:40:12,678 [WARNING] Login fallido – consulta sin resultado para usuario@ejemplo.com: JSON object requested, multiple (or no) rows returned
```

## Ejemplo de respuesta

```json
{"detail": "Credenciales inválidas"}
```
