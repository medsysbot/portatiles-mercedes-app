import main
from fastapi.testclient import TestClient
from routes import cliente_panel
import types

client = TestClient(main.app)


class MockQuery:
    def __init__(self):
        self.inserted = None

    def insert(self, data):
        self.inserted = data
        return self

    def execute(self):
        return types.SimpleNamespace(data=[{"id": 1}], status_code=200)


class MockSupabase:
    def __init__(self):
        self.query = MockQuery()

    def table(self, _name):
        return self.query


def test_guardar_datos_cliente(monkeypatch):
    db = MockSupabase()
    monkeypatch.setattr(cliente_panel, "supabase", db)

    datos = {
        "dni": "123",
        "nombre": "Juan",
        "apellido": "Perez",
        "direccion": "Calle 1",
        "telefono": "111",
        "cuit": "20-12345678-9",
        "razon_social": "JP Servicios",
        "email": "test@test.com",
    }

    resp = client.post("/guardar_datos_cliente", json=datos)

    assert resp.status_code == 200
    assert db.query.inserted is not None


def test_guardar_datos_cliente_error(monkeypatch):
    class FailSupabase:
        def table(self, _name):
            raise Exception("fail")

    monkeypatch.setattr(cliente_panel, "supabase", FailSupabase())

    datos = {
        "dni": "1",
        "nombre": "a",
        "apellido": "b",
        "direccion": "c",
        "telefono": "d",
        "cuit": "e",
        "razon_social": "f",
        "email": "x",
    }

    resp = client.post("/guardar_datos_cliente", json=datos)

    assert resp.status_code == 500


def test_guardar_datos_cliente_sin_email(monkeypatch):
    db = MockSupabase()
    monkeypatch.setattr(cliente_panel, "supabase", db)

    datos = {
        "dni": "111",
        "nombre": "Ana",
        "apellido": "Gomez",
        "direccion": "Av 1",
        "telefono": "555",
        "cuit": "20-12345678-9",
        "razon_social": "AG Servicios",
    }

    resp = client.post("/guardar_datos_cliente", json=datos)

    assert resp.status_code == 200
