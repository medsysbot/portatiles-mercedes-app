import main
from fastapi.testclient import TestClient
from routes import cliente_panel
import types

client = TestClient(main.app)


class MockQuery:
    def __init__(self):
        self.inserted = None

    def upsert(self, data, on_conflict=None):
        self.inserted = data
        self.on_conflict = on_conflict
        return self

    def execute(self):
        return types.SimpleNamespace(data=[{"id": 1}], status_code=200)


class MockSupabase:
    def __init__(self):
        self.query = MockQuery()

    def table(self, _name):
        return self.query


class DataQuery:
    def __init__(self, record):
        self.record = record
        self.filters = {}

    def select(self, *_):
        return self

    def eq(self, field, value):
        self.filters[field] = value
        return self

    def single(self):
        return self

    def execute(self):
        if self.filters.get("email") == self.record.get("email"):
            return types.SimpleNamespace(data=self.record, status_code=200)
        return types.SimpleNamespace(data=None, status_code=404)


class DataSupabase:
    def __init__(self, record):
        self.q = DataQuery(record)

    def table(self, _name):
        return self.q


def test_guardar_datos_cliente(monkeypatch):
    db = MockSupabase()
    monkeypatch.setattr(cliente_panel, "supabase", db)

    datos = {
        "dni_cuit_cuil": "123",
        "nombre": "Juan",
        "apellido": "Perez",
        "direccion": "Calle 1",
        "telefono": "111",
        "razon_social": "JP Servicios",
        "email": "test@test.com",
    }

    resp = client.post("/guardar_datos_cliente", json=datos)

    assert resp.status_code == 200
    assert resp.json()["mensaje"].startswith("\u00a1Datos guardados")
    assert db.query.inserted is not None


def test_guardar_datos_cliente_error(monkeypatch):
    class FailSupabase:
        def table(self, _name):
            raise Exception("fail")

    monkeypatch.setattr(cliente_panel, "supabase", FailSupabase())

    datos = {
        "dni_cuit_cuil": "1",
        "nombre": "a",
        "apellido": "b",
        "direccion": "c",
        "telefono": "d",
        "razon_social": "f",
        "email": "x",
    }

    resp = client.post("/guardar_datos_cliente", json=datos)

    assert resp.status_code == 500
    assert "error" in resp.json()


def test_guardar_datos_cliente_sin_email(monkeypatch):
    db = MockSupabase()
    monkeypatch.setattr(cliente_panel, "supabase", db)

    datos = {
        "dni_cuit_cuil": "111",
        "nombre": "Ana",
        "apellido": "Gomez",
        "direccion": "Av 1",
        "telefono": "555",
        "razon_social": "AG Servicios",
    }

    resp = client.post("/guardar_datos_cliente", json=datos)

    assert resp.status_code == 200
    assert resp.json()["mensaje"].startswith("\u00a1Datos guardados")


def test_info_datos_cliente(monkeypatch):
    registro = {
        "email": "demo@test.com",
        "nombre": "Demo",
    }
    monkeypatch.setattr(cliente_panel, "supabase", DataSupabase(registro))

    resp = client.get("/info_datos_cliente", params={"email": registro["email"]})

    assert resp.status_code == 200
    assert resp.json()["nombre"] == "Demo"


def test_info_datos_cliente_no_encontrado(monkeypatch):
    """Si el email no existe debe devolver 404."""
    monkeypatch.setattr(cliente_panel, "supabase", DataSupabase({}))

    resp = client.get("/info_datos_cliente", params={"email": "no@existe.com"})

    assert resp.status_code == 404
