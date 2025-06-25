import types
import main
from fastapi.testclient import TestClient
from routes import datos_personales

client = TestClient(main.app)

class InMemoryQuery:
    def __init__(self, existing=None):
        self.data = existing
        self.inserted = None
        self.filter = None
        self.is_select = False
        self.single_mode = False

    def select(self, *_):
        self.is_select = True
        return self

    def eq(self, _field, value):
        self.filter = value
        return self

    def single(self):
        self.single_mode = True
        return self

    def insert(self, data):
        self.inserted = data
        self.is_select = False
        return self

    def execute(self):
        if self.is_select:
            if self.data and self.filter == self.data.get("dni_cuit_cuil"):
                result = self.data if self.single_mode else [self.data]
                return types.SimpleNamespace(data=result, status_code=200, error=None)
            return types.SimpleNamespace(data=None if self.single_mode else [], status_code=200, error=None)
        if self.inserted is not None:
            self.data = self.inserted
            return types.SimpleNamespace(data=[{"id": 1}], status_code=200, error=None)
        return types.SimpleNamespace(data=None, status_code=400, error="invalid")

class MockSupabase:
    def __init__(self, existing=None):
        self.query = InMemoryQuery(existing)
        self.table_name = None
    def table(self, name):
        self.table_name = name
        return self.query


def test_registrar_datos_cliente_ok(monkeypatch):
    db = MockSupabase()
    monkeypatch.setattr(datos_personales, "supabase", db)
    resp = client.post(
        "/registrar_datos_cliente",
        data={
            "nombre": "Juan",
            "apellido": "Perez",
            "dni_cuit_cuil": "123",
            "direccion": "Calle 1",
            "telefono": "555",
            "cuit": "20-12345678-9",
            "razon_social": "JP",
            "email": "test@test.com",
        },
    )
    assert resp.status_code == 200
    assert db.table_name == "datos_personales_clientes"
    assert db.query.inserted["dni_cuit_cuil"] == "123"


def test_registrar_datos_cliente_dni_repetido(monkeypatch):
    existing = {
        "nombre": "Ana",
        "apellido": "Lopez",
        "dni_cuit_cuil": "123",
        "direccion": "x",
        "telefono": "222",
        "cuit": "20-99999999-9",
        "razon_social": "AL",
        "email": "ana@test.com",
    }
    db = MockSupabase(existing)
    monkeypatch.setattr(datos_personales, "supabase", db)
    resp = client.post(
        "/registrar_datos_cliente",
        data={
            "nombre": "Juan",
            "apellido": "Perez",
            "dni_cuit_cuil": "123",
            "direccion": "Calle 1",
            "telefono": "111",
            "cuit": "20-12345678-9",
            "razon_social": "JP",
            "email": "otro@test.com",
        },
    )
    assert resp.status_code == 400


def test_obtener_datos_cliente(monkeypatch):
    data = {
        "nombre": "Ana",
        "apellido": "Gomez",
        "dni_cuit_cuil": "321",
        "direccion": "calle a",
        "telefono": "1234",
        "cuit": "20-11111111-1",
        "razon_social": "AG",
        "email": "ana@test.com",
    }
    db = MockSupabase(data)
    monkeypatch.setattr(datos_personales, "supabase", db)
    resp = client.get("/datos_cliente", params={"dni_cuit_cuil": data["dni_cuit_cuil"]})
    assert resp.status_code == 200
    assert resp.json()["email"] == data["email"]
