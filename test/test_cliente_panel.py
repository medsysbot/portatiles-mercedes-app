import types
import main
from fastapi.testclient import TestClient
from routes import cliente_panel

client = TestClient(main.app)

class MockUpsertQuery:
    def __init__(self, existing_dni=None):
        self.upsert_data = None
        self.existing_dni = existing_dni
        self.is_select = False
        self.filter = None
    def upsert(self, data):
        self.upsert_data = data
        self.is_select = False
        return self
    def select(self, *_):
        self.is_select = True
        return self
    def eq(self, _field, value):
        self.filter = value
        return self
    def execute(self):
        if self.is_select:
            if self.filter == self.existing_dni:
                return types.SimpleNamespace(data=[{"id": 1}], status_code=200, error=None)
            return types.SimpleNamespace(data=[], status_code=200, error=None)
        return types.SimpleNamespace(data=[{"id": 1}], status_code=200, error=None)

class MockUserQuery:
    def __init__(self, valid_id=True):
        self.valid_id = valid_id
        self.is_select = False
    def select(self, *_):
        self.is_select = True
        return self
    def eq(self, _field, _value):
        return self
    def single(self):
        return self
    def execute(self):
        if self.is_select and self.valid_id:
            return types.SimpleNamespace(data={"id": "uuid"}, status_code=200, error=None)
        if self.is_select:
            return types.SimpleNamespace(data=None, status_code=200, error=None)
        return types.SimpleNamespace(data=None, status_code=200, error=None)

class MockSupabaseSave:
    def __init__(self, existing_dni=None, valid_user=True):
        self.table_name = None
        self.clientes_query = MockUpsertQuery(existing_dni)
        self.user_query = MockUserQuery(valid_user)
    def table(self, name):
        self.table_name = name
        if name == "clientes":
            return self.clientes_query
        if name == "usuarios":
            return self.user_query
        return MockUpsertQuery()

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
            "id_usuario": "uuid-123",
        },
    )
    assert resp.status_code == 200
    assert db.table_name == "clientes"
    assert db.clientes_query.upsert_data["dni"] == "123"
    assert db.clientes_query.upsert_data["id_usuario"] == "uuid-123"


def test_guardar_datos_cliente_dni_repetido(monkeypatch):
    db = MockSupabaseSave(existing_dni="123")
    monkeypatch.setattr(cliente_panel, "supabase", db)
    resp = client.post(
        "/guardar_datos_cliente",
        data={
            "email": "otro@test.com",
            "nombre": "Pepe",
            "apellido": "Lopez",
            "dni": "123",
            "direccion": "Calle x",
            "telefono": "444",
            "id_usuario": "uuid-123",
        },
    )
    assert resp.status_code == 400


def test_guardar_datos_cliente_uuid_invalido(monkeypatch):
    db = MockSupabaseSave(valid_user=False)
    monkeypatch.setattr(cliente_panel, "supabase", db)
    resp = client.post(
        "/guardar_datos_cliente",
        data={
            "email": "otro@test.com",
            "nombre": "Pepe",
            "apellido": "Lopez",
            "dni": "122",
            "direccion": "Calle x",
            "telefono": "444",
            "id_usuario": "invalido",
        },
    )
    assert resp.status_code == 400


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
