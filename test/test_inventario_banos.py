import types
import main
from fastapi.testclient import TestClient
from routes import inventario_banos

client = TestClient(main.app)

class InMemoryQuery:
    def __init__(self, data):
        self.data = data
        self.is_select = True
        self.insert_data = None

    def select(self, *_):
        self.is_select = True
        return self

    def insert(self, data):
        self.is_select = False
        self.insert_data = data
        return self

    def execute(self):
        if self.is_select:
            return types.SimpleNamespace(data=self.data, status_code=200, error=None)
        if self.insert_data is not None:
            self.data.append(self.insert_data)
            return types.SimpleNamespace(data=[{"id": len(self.data)}], status_code=200, error=None)
        return types.SimpleNamespace(data=None, status_code=400, error="invalid")

class InventarioDB:
    def __init__(self, data=None):
        self.banos = data or []
    def table(self, name):
        return InMemoryQuery(self.banos)


def test_inventario_banos_flow(monkeypatch):
    db = InventarioDB([])
    monkeypatch.setattr(inventario_banos, "supabase", db)

    resp = client.get("/admin/inventario")
    assert resp.status_code == 200
    assert "tablaInventario" in resp.text

    resp = client.get("/admin/api/inventario_banos")
    assert resp.status_code == 200
    assert resp.json() == []

    data = {
        "numero_bano": "B1",
        "condicion": "bueno",
        "estado": "activo"
    }
    resp = client.post("/admin/inventario_banos/nuevo", json=data)
    assert resp.status_code == 200
    assert resp.json().get("ok") is True

    resp = client.get("/admin/api/inventario_banos")
    lista = resp.json()
    assert len(lista) == 1
    assert lista[0]["numero_bano"] == "B1"
