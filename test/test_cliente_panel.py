import types
import main
from fastapi.testclient import TestClient
from routes import cliente_panel

client = TestClient(main.app)

class MockUpsertQuery:
    def __init__(self):
        self.upsert_data = None
    def upsert(self, data):
        self.upsert_data = data
        return self
    def execute(self):
        return types.SimpleNamespace(data=[{"id": 1}], status_code=200, error=None)

class MockSupabaseSave:
    def __init__(self):
        self.table_name = None
        self.query = MockUpsertQuery()
    def table(self, name):
        self.table_name = name
        return self.query

class MockSelectQuery:
    def __init__(self, data):
        self.data = data
        self.filter = None
    def select(self, *_):
        return self
    def eq(self, _field, value):
        self.filter = value
        return self
    def single(self):
        return self
    def execute(self):
        if self.data and self.filter == self.data["email"]:
            return types.SimpleNamespace(data=self.data, status_code=200, error=None)
        return types.SimpleNamespace(data=None, status_code=200, error=None)

class MockSupabaseInfo:
    def __init__(self, data):
        self.data = data
    def table(self, name):
        return MockSelectQuery(self.data)


def test_guardar_datos_cliente(monkeypatch):
    db = MockSupabaseSave()
    monkeypatch.setattr(cliente_panel, "supabase", db)
    resp = client.post(
        "/guardar_datos_cliente",
        data={
            "email": "prueba@test.com",
            "nombre": "Juan",
            "apellido": "Perez",
            "dni": "123",
            "direccion": "Calle 1",
            "telefono": "555",
        },
    )
    assert resp.status_code == 200
    assert db.table_name == "datos_personales_clientes"
    assert db.query.upsert_data["dni"] == "123"


def test_info_cliente_ok(monkeypatch):
    data = {
        "email": "ana@test.com",
        "nombre": "Ana",
        "apellido": "Gomez",
        "dni": "321",
        "direccion": "calle a",
        "telefono": "1234",
    }
    monkeypatch.setattr(cliente_panel, "supabase", MockSupabaseInfo(data))
    resp = client.get("/info_cliente", params={"email": data["email"]})
    assert resp.status_code == 200
    assert resp.json()["dni"] == "321"


def test_info_cliente_no_encontrado(monkeypatch):
    monkeypatch.setattr(cliente_panel, "supabase", MockSupabaseInfo(None))
    resp = client.get("/info_cliente", params={"email": "no@test.com"})
    assert resp.status_code == 404
