"""Modelos de datos utilizados en la aplicación."""

from pydantic import BaseModel, EmailStr

class Cliente(BaseModel):
    """Modelo representando a un cliente."""

    nombre: str
    email: EmailStr
    bano_alquilado: str
