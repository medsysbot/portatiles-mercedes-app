import types
import main
from fastapi.testclient import TestClient
from routes import admin_panel
import routes.alquileres as alquileres

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

    def single(self):
        self.single_mode = True
        return self

    def maybe_single(self):
        self.single_mode = "maybe"
        return self

    def insert(self, data):
        self.is_select = False
        self.insert_data = data
        return self

    def execute(self):
        if self.is_select:
            result = [
                u
                for u in self.data
                if all(u.get(k) == v for k, v in self.filters.items())
            ]
            if self.single_mode == True:
                result = result[0]
            elif self.single_mode == "maybe":
                result = result[0] if result else None
            return types.SimpleNamespace(data=result, status_code=200, error=None)
        if self.insert_data:
            self.data.append(self.insert_data)
            return types.SimpleNamespace(
                data=[{"id": len(self.data)}], status_code=200, error=None
            )
        return types.SimpleNamespace(data=None, status_code=400, error="invalid")


class AlquilerMemoryDB:
    def __init__(self, data=None):
        self.alquileres = data or []

    def table(self, name):
        if name == alquileres.ALQUILERES_TABLE:
            return InMemoryQuery(self.alquileres)
        return InMemoryQuery([])


def test_alquileres_end_to_end(monkeypatch):
    db = AlquilerMemoryDB([])
    monkeypatch.setattr(admin_panel, "supabase", db)
    monkeypatch.setattr(alquileres, "supabase", db)

    resp = client.get("/admin/alquileres")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]
    assert "Administración de alquileres" in resp.text
    assert 'id="tablaAlquileres"' in resp.text

    datos = {
        "numero_bano": "B100",
        "cliente_nombre": "Empresa SA",
        "dni_cuit_cuil": "20345678",
        "direccion": "Calle 1",
        "fecha_inicio": "2025-01-01",
        "fecha_fin": "2025-12-31",
        "observaciones": "Obs",
    }
    resp = client.post("/admin/alquileres/nuevo", json=datos)
    assert resp.status_code == 200
    assert resp.json().get("ok") is True

    resp = client.get("/admin/api/alquileres")
    assert resp.status_code == 200
    lista = resp.json()
    assert len(lista) == 1
    assert lista[0]["numero_bano"] == "B100"
    assert lista[0]["cliente_nombre"] == "Empresa SA"
    assert lista[0]["dni_cuit_cuil"] == "20345678"
