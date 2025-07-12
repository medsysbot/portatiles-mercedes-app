import types
import main
from fastapi.testclient import TestClient
import routes.facturas_pendientes as facturas_module

client = TestClient(main.app, base_url="http://localhost")

class InMemoryQuery:
    def __init__(self, data):
        self.data = data
        self.filters = {}
        self.operation = "select"
        self.insert_data = None
        self.update_data = None
        self.select_called = False

    def select(self, *_):
        self.select_called = True
        return self

    def eq(self, field, value):
        self.filters[field] = value
        return self

    def insert(self, data):
        self.operation = "insert"
        self.insert_data = data
        return self

    def update(self, data):
        self.operation = "update"
        self.update_data = data
        return self

    def execute(self):
        if self.operation == "select":
            result = [d for d in self.data if all(d.get(k) == v for k, v in self.filters.items())]
            return types.SimpleNamespace(data=result, status_code=200, error=None)
        if self.operation == "insert" and self.insert_data is not None:
            inserted_id = len(self.data) + 1
            registro = self.insert_data.copy()
            registro["id_factura"] = inserted_id
            self.data.append(registro)
            return types.SimpleNamespace(data=[{"id_factura": inserted_id}], status_code=200, error=None)
        if self.operation == "update" and self.update_data is not None:
            for d in self.data:
                if all(d.get(k) == v for k, v in self.filters.items()):
                    d.update(self.update_data)
            return types.SimpleNamespace(data=None, status_code=200, error=None)
        return types.SimpleNamespace(data=None, status_code=400, error="invalid")

class FakeBucket:
    def __init__(self):
        self.files = {}

    def upload(self, name, data, *_args, **_kwargs):
        self.files[name] = data

    def get_public_url(self, name):
        return f"http://example.com/{name}"


class FakeStorage:
    def __init__(self):
        self.buckets = {}

    def from_(self, name):
        if name not in self.buckets:
            self.buckets[name] = FakeBucket()
        return self.buckets[name]


class MemoryDB:
    def __init__(self, facturas=None, clientes=None):
        self.facturas = facturas or []
        self.clientes = clientes or []
        self.storage = FakeStorage()

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


def _datos_factura():
    return {
        "fecha": "2025-01-01",
        "numero_factura": "F001",
        "dni_cuit_cuil": "20304567",
        "razon_social": "Empresa SA",
        "nombre_cliente": "Juan",
        "monto_adeudado": "150.50",
    }


def test_crear_factura_con_pdf(monkeypatch):
    db = MemoryDB([])
    monkeypatch.setattr(facturas_module, "supabase", db)

    datos = _datos_factura()
    archivo = {"factura": ("archivo.pdf", b"%PDF-1.4 test", "application/pdf")}
    resp = client.post(
        "/admin/facturas_pendientes/nueva", data=datos, files=archivo,
        follow_redirects=False
    )

    assert resp.status_code == 303
    assert len(db.facturas) == 1
    bucket = db.storage.from_(facturas_module.BUCKET)
    nombre_archivo = next(iter(bucket.files))
    assert nombre_archivo.startswith("factura-1-")
    assert db.facturas[0]["factura_url"] == f"http://example.com/{nombre_archivo}"


def test_crear_factura_con_imagen(monkeypatch):
    db = MemoryDB([])
    monkeypatch.setattr(facturas_module, "supabase", db)

    datos = _datos_factura()
    monkeypatch.setattr(facturas_module, "_convertir_a_pdf", lambda *_: b"%PDF-1.4")
    archivo = {"factura": ("imagen.jpg", b"123", "image/jpeg")}
    resp = client.post(
        "/admin/facturas_pendientes/nueva", data=datos, files=archivo,
        follow_redirects=False
    )

    assert resp.status_code == 303
    bucket = db.storage.from_(facturas_module.BUCKET)
    nombre_archivo = next(iter(bucket.files))
    contenido = bucket.files[nombre_archivo]
    assert contenido.startswith(b"%PDF")
    assert db.facturas[0]["factura_url"] == f"http://example.com/{nombre_archivo}"
