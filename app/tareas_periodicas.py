"""Tareas automáticas para pagos y alertas."""

from datetime import datetime, timedelta
import os

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(
        "Advertencia: SUPABASE_URL y SUPABASE_KEY no estan configurados. "
        "La conexión a Supabase estará deshabilitada."
    )
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def procesar_debitos_vencidos() -> None:
    """Genera pagos por los débitos cuyo vencimiento llegó."""
    if not supabase:
        raise RuntimeError("Supabase no configurado")
    hoy = datetime.utcnow().date()
    resp = (
        supabase.table("debitos_programados")
        .select("*")
        .lte("proximo_pago", hoy.isoformat())
        .execute()
    )

    for debito in resp.data or []:
        pago = {
            "dni_cliente": debito["dni_cliente"],
            "monto": debito["monto"],
            "fecha_pago": hoy.isoformat(),
            "metodo": "debito_automatico",
        }
        supabase.table("pagos").insert(pago).execute()
        nuevo_proximo = (
            datetime.fromisoformat(debito["proximo_pago"])
            + timedelta(days=debito["frecuencia_dias"])
        )
        supabase.table("debitos_programados").update(
            {"proximo_pago": nuevo_proximo.date().isoformat()}
        ).eq("id", debito["id"]).execute()
        supabase.table("alertas").insert(
            {
                "dni_cliente": debito["dni_cliente"],
                "tipo": "pago_vencido",
                "fecha": hoy.isoformat(),
            }
        ).execute()


def alertas_cumpleanos() -> None:
    """Crea alertas si hoy es el cumpleaños de un cliente."""
    if not supabase:
        raise RuntimeError("Supabase no configurado")
    hoy = datetime.utcnow().date()
    resp = supabase.table("clientes").select("dni, nombre, fecha_nacimiento").execute()
    for cli in resp.data or []:
        fecha = cli.get("fecha_nacimiento")
        if not fecha:
            continue
        cumple = datetime.fromisoformat(fecha).date()
        if cumple.month == hoy.month and cumple.day == hoy.day:
            supabase.table("alertas").insert(
                {
                    "dni_cliente": cli["dni"],
                    "tipo": "cumpleanos",
                    "fecha": hoy.isoformat(),
                    "mensaje": f"Felicidades {cli['nombre']}!",
                }
            ).execute()


def alertas_limpieza() -> None:
    """Detecta si un cliente lleva mucho tiempo sin limpieza y avisa."""
    if not supabase:
        raise RuntimeError("Supabase no configurado")
    hoy = datetime.utcnow()
    resp = supabase.table("limpiezas").select("cliente_id, fecha_hora").execute()
    ultimos: dict[str, datetime] = {}
    for registro in resp.data or []:
        fecha = datetime.fromisoformat(registro["fecha_hora"])
        cid = registro["cliente_id"]
        if cid not in ultimos or fecha > ultimos[cid]:
            ultimos[cid] = fecha
    for cid, fecha in ultimos.items():
        if (hoy - fecha).days >= 30:
            supabase.table("alertas").insert(
                {
                    "dni_cliente": cid,
                    "tipo": "limpieza_pendiente",
                    "fecha": hoy.date().isoformat(),
                }
            ).execute()


def ejecutar_tareas() -> None:
    """Ejecuta todas las tareas en orden."""
    procesar_debitos_vencidos()
    alertas_cumpleanos()
    alertas_limpieza()


if __name__ == "__main__":
    ejecutar_tareas()
