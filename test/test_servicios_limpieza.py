import types
import main
from fastapi.testclient import TestClient
import routes.limpieza as limpieza_module

client = TestClient(main.app, base_url="http://localhost")

class InMemoryQuery:
    def __init__(self, data):
        self.data = data
        self.filters = {}
        self.is_select = True
        self.insert_data = None
        self.is_delete = False

    def select(self, *_):
        self.is_select = True
        return self

    def eq(self, field, value):
        self.filters[field] = value
        return self

    def delete(self):
        self.is_select = False
        self.is_delete = True
        return self

    def in_(self, field, values):
        self.delete_field = field
        self.delete_values = values
        return self

    def execute(self):
        if self.is_select:
            result = [d for d in self.data if all(d.get(k) == v for k, v in self.filters.items())]
            return types.SimpleNamespace(data=result, status_code=200, error=None)
        if self.is_delete:
            self.data[:] = [d for d in self.data if d.get(self.delete_field) not in self.delete_values]
            return types.SimpleNamespace(data=None, status_code=200, error=None)
        return types.SimpleNamespace(data=None, status_code=400, error="invalid")

class MemoryDB:
    def __init__(self, servicios=None):
        self.servicios = servicios or []
    def table(self, name):
        return InMemoryQuery(self.servicios)

def test_eliminar_servicios_limpieza(monkeypatch):
    datos = [{"id_servicio": 1, "numero_bano": "B1"}]
    db = MemoryDB(datos)
    monkeypatch.setattr(limpieza_module, "supabase", db)

    resp = client.post("/admin/api/servicios_limpieza/eliminar", json={"ids": [1]})
    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert db.servicios == []
