import types
import main
from fastapi.testclient import TestClient
import routes.morosos as morosos_module

client = TestClient(main.app, base_url="http://localhost")

class InMemoryQuery:
    def __init__(self, data):
        self.data = data
        self.filters = {}
        self.is_select = True
        self.insert_data = None
        self.single_mode = False

    def select(self, *_):
        self.is_select = True
        return self

    def eq(self, field, value):
        self.filters[field] = value
        return self

    def maybe_single(self):
        self.single_mode = "maybe"
        return self

    def insert(self, data):
        self.is_select = False
        self.insert_data = data
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
            if self.single_mode == "maybe":
                result = result[0] if result else None
            return types.SimpleNamespace(data=result, status_code=200, error=None)
        if self.insert_data is not None:
            self.data.append(self.insert_data)
            return types.SimpleNamespace(data=[{"id": len(self.data)}], status_code=200, error=None)
        if getattr(self, "is_delete", False):
            self.data[:] = [d for d in self.data if d.get(self.delete_field) not in self.delete_values]
            return types.SimpleNamespace(data=None, status_code=200, error=None)
        return types.SimpleNamespace(data=None, status_code=400, error="invalid")

class MemoryDB:
    def __init__(self, data=None):
        self.morosos = data or []
    def table(self, name):
        return InMemoryQuery(self.morosos)


def test_morosos_end_to_end(monkeypatch):
    db = MemoryDB([])
    monkeypatch.setattr(morosos_module, "supabase", db)

    resp = client.get("/admin/morosos")
    assert resp.status_code == 200
    assert "Morosos" in resp.text
    assert 'id="tablaMorosos"' in resp.text

    datos = {
        "fecha_facturacion": "2025-01-01",
        "numero_factura": "X001",
        "dni_cuit_cuil": "20304567",
        "razon_social": "Empresa SA",
        "nombre_cliente": "Juan",
        "monto_adeudado": "150.50",
    }
    resp = client.post("/admin/morosos/nuevo", json=datos)
    assert resp.status_code == 200
    assert resp.json().get("ok") is True

    resp = client.get("/admin/api/morosos")
    assert resp.status_code == 200
    lista = resp.json()
    assert len(lista) == 1
    assert lista[0]["numero_factura"] == "X001"
    assert lista[0]["dni_cuit_cuil"] == "20304567"


def test_eliminar_morosos(monkeypatch):
    datos = [
        {
            "id_moroso": 1,
            "numero_factura": "X001",
            "dni_cuit_cuil": "20304567",
        }
    ]
    db = MemoryDB(datos)
    monkeypatch.setattr(morosos_module, "supabase", db)

    resp = client.post("/admin/api/morosos/eliminar", json={"ids": [1]})
    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert db.morosos == []
