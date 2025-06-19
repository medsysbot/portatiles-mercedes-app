import types
import main
from fastapi.testclient import TestClient
from routes import cliente_panel

client = TestClient(main.app)

class InMemoryQuery:
    def __init__(self, existing=None):
        self.data = existing
        self.inserted = None
        self.updated = None
        self.is_select = False
        self.filter = None
    def select(self, *_):
        self.is_select = True
        return self
    def insert(self, data):
        self.inserted = data
        self.is_select = False
        return self
    def update(self, data):
        self.updated = data
        self.is_select = False
        return self
    def eq(self, field, value):
        self.filter = value
        return self
    def single(self):
        return self
    def execute(self):
        if self.is_select:
            if self.data and self.filter in (self.data.get("dni"), self.data.get("email")):
                return types.SimpleNamespace(data=self.data, status_code=200, error=None)
            return types.SimpleNamespace(data=None, status_code=200, error=None)
        return types.SimpleNamespace(data=[{"ok": True}], status_code=200, error=None)

class MockSupabase:
    def __init__(self, existing=None):
        self.query = InMemoryQuery(existing)
        self.table_name = None
    def table(self, name):
        self.table_name = name
        return self.query


def test_guardar_datos_cliente(monkeypatch):
    db = MockSupabase()
    monkeypatch.setattr(cliente_panel, "supabase", db)
    client.app.dependency_overrides[cliente_panel.auth_required] = lambda credentials=None: {}
    resp = client.post(
        "/guardar_datos_cliente",
        data={
            "email": "test@test.com",
            "nombre": "Juan",
            "apellido": "Perez",
            "dni": "123",
            "direccion": "Calle 1",
            "telefono": "111",
            "cuit": "20-12345678-9",
            "razon_social": "JP Servicios",
        },
        headers={"Authorization": "Bearer a"},
    )
    client.app.dependency_overrides = {}
    assert resp.status_code == 200
    assert db.table_name == "datos_personales_clientes"
    assert db.query.inserted["dni"] == "123"


def test_guardar_datos_cliente_dni_repetido(monkeypatch):
    existing = {
        "dni": "123",
        "nombre": "Ana",
        "apellido": "Lopez",
        "direccion": "x",
        "telefono": "222",
        "cuit": "20-12345678-9",
        "razon_social": "AL",
        "email": "ana@test.com",
    }
    db = MockSupabase(existing)
    monkeypatch.setattr(cliente_panel, "supabase", db)
    client.app.dependency_overrides[cliente_panel.auth_required] = lambda credentials=None: {}
    resp = client.post(
        "/guardar_datos_cliente",
        data={
            "email": "otro@test.com",
            "nombre": "Juan",
            "apellido": "Perez",
            "dni": "123",
            "direccion": "Calle 1",
            "telefono": "111",
            "cuit": "20-99999999-9",
            "razon_social": "JP",
        },
        headers={"Authorization": "Bearer a"},
    )
    client.app.dependency_overrides = {}
    assert resp.status_code == 200  # update
    assert db.query.updated["telefono"] == "111"


def test_info_cliente_ok(monkeypatch):
    data = {
        "dni": "321",
        "nombre": "Ana",
        "apellido": "Gomez",
        "direccion": "calle a",
        "telefono": "1234",
        "cuit": "20-11111111-1",
        "razon_social": "AG",
        "email": "ana@test.com",
    }
    db = MockSupabase(data)
    monkeypatch.setattr(cliente_panel, "supabase", db)
    resp = client.get("/info_cliente", params={"email": data["email"]})
    assert resp.status_code == 200
    assert resp.json()["dni"] == "321"


def test_info_cliente_no_encontrado(monkeypatch):
    db = MockSupabase(None)
    monkeypatch.setattr(cliente_panel, "supabase", db)
    resp = client.get("/info_cliente", params={"email": "x@test.com"})
    assert resp.status_code == 404
