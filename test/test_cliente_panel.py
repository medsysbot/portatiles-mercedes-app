import main
from fastapi.testclient import TestClient
from routes import cliente_panel

client = TestClient(main.app)


class DummyCursor:
    def __init__(self):
        self.query = None
        self.params = None

    def execute(self, query, params):
        self.query = query
        self.params = params

    def close(self):
        pass


class DummyConn:
    def __init__(self):
        self.cursor_obj = DummyCursor()
        self.committed = False

    def cursor(self):
        return self.cursor_obj

    def commit(self):
        self.committed = True

    def close(self):
        pass


def test_guardar_datos_cliente(monkeypatch):
    conn = DummyConn()

    def fake_connect(url):
        return conn

    monkeypatch.setattr(cliente_panel.psycopg2, "connect", fake_connect)
    client.app.dependency_overrides[cliente_panel.auth_required] = lambda credentials=None: {}

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

    resp = client.post("/guardar_datos_cliente", json=datos, headers={"Authorization": "Bearer a"})
    client.app.dependency_overrides = {}

    assert resp.status_code == 200
    assert conn.cursor_obj.query is not None
    assert conn.committed


def test_guardar_datos_cliente_error(monkeypatch):
    def fake_connect(url):
        raise Exception("fail")

    monkeypatch.setattr(cliente_panel.psycopg2, "connect", fake_connect)
    client.app.dependency_overrides[cliente_panel.auth_required] = lambda credentials=None: {}

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

    resp = client.post("/guardar_datos_cliente", json=datos, headers={"Authorization": "Bearer a"})
    client.app.dependency_overrides = {}

    assert resp.status_code == 500
