import types
import main
from fastapi.testclient import TestClient
import routes.facturas_pendientes as facturas_module

client = TestClient(main.app, base_url="http://localhost")

class InMemoryQuery:
    def __init__(self, data):
        self.data = data
        self.filters = {}
        self.is_select = True
        self.insert_data = None

    def select(self, *_):
        self.is_select = True
        return self

    def eq(self, field, value):
        self.filters[field] = value
        return self

    def insert(self, data):
        self.is_select = False
        self.insert_data = data
        return self

    def execute(self):
        if self.is_select:
            result = [d for d in self.data if all(d.get(k) == v for k, v in self.filters.items())]
            return types.SimpleNamespace(data=result, status_code=200, error=None)
        if self.insert_data is not None:
            self.data.append(self.insert_data)
            return types.SimpleNamespace(data=[{"id": len(self.data)}], status_code=200, error=None)
        return types.SimpleNamespace(data=None, status_code=400, error="invalid")

class MemoryDB:
    def __init__(self, facturas=None, clientes=None):
        self.facturas = facturas or []
        self.clientes = clientes or []
    def table(self, name):
        if name == facturas_module.TABLA:
            return InMemoryQuery(self.facturas)
        if name == "datos_personales_clientes":
            return InMemoryQuery(self.clientes)
        return InMemoryQuery([])


def test_facturas_end_to_end(monkeypatch):
    db = MemoryDB([])
    monkeypatch.setattr(facturas_module, "supabase", db)

    resp = client.get("/admin/facturas_pendientes")
    assert resp.status_code == 200
    assert "Facturas pendientes" in resp.text
    assert 'id="tablaFacturas"' in resp.text

    datos = {
        "fecha": "2025-01-01",
        "numero_factura": "F001",
        "dni_cuit_cuil": "20304567",
        "razon_social": "Empresa SA",
        "nombre_cliente": "Juan",
        "monto_adeudado": "150.50",
    }
    resp = client.post("/admin/facturas_pendientes/nueva", json=datos)
    assert resp.status_code == 200
    assert resp.json().get("ok") is True

    resp = client.get("/admin/api/facturas_pendientes")
    assert resp.status_code == 200
    lista = resp.json()
    assert len(lista) == 1
    assert lista[0]["numero_factura"] == "F001"
    assert lista[0]["dni_cuit_cuil"] == "20304567"
    assert "factura_url" in lista[0]
    assert lista[0]["factura_url"] is None


def test_buscar_clientes(monkeypatch):
    clientes = [
        {"dni_cuit_cuil": "1", "nombre": "Ana", "apellido": "G", "razon_social": "AG"},
        {"dni_cuit_cuil": "2", "nombre": "Juan", "apellido": "P", "razon_social": "JP"},
    ]
    db = MemoryDB([], clientes)
    monkeypatch.setattr(facturas_module, "supabase", db)
    resp = client.get("/admin/api/clientes/busqueda?q=Ana")
    assert resp.status_code == 200
    data = resp.json()
    assert "clientes" in data
    assert len(data["clientes"]) == 1
    assert data["clientes"][0]["dni_cuit_cuil"] == "1"
