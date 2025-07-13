import main
from fastapi.testclient import TestClient
import types
from routes import admin_panel, comprobantes_admin, recursos_humanos
import utils.auth_utils as auth_utils

client = TestClient(main.app, base_url="http://localhost")

PAGES = [
    ("/admin/clientes", "btnBuscarCliente"),
    ("/admin/empleados", "btnBuscarEmpleado"),
    ("/admin/alquileres", "btnBuscarAlquiler"),
    ("/admin/morosos", "btnBuscarMorosos"),
    ("/admin/reportes", "btnBuscarReportes"),
    ("/admin/inventario_banos", "btnBuscarInventario"),
    ("/admin/ventas", "btnBuscarVentas"),
    ("/admin/limpieza", "btnBuscarServicios"),
    ("/admin/emails", "btnBuscarEmail"),
    ("/admin/facturas_pendientes", "btnBuscarFacturas"),
]


class DummyQuery:
    def select(self, *_):
        return self

    def execute(self):
        return types.SimpleNamespace(data=[], status_code=200, error=None)


class DummySupabase:
    def table(self, _name):
        return DummyQuery()


def fake_auth_required(*_args, **_kwargs):
    return {"rol": "Administrador"}


def test_buscar_buttons_present(monkeypatch):
    monkeypatch.setattr(admin_panel, "supabase", DummySupabase())
    monkeypatch.setattr(comprobantes_admin, "auth_required", fake_auth_required)
    monkeypatch.setattr(recursos_humanos, "auth_required", fake_auth_required)
    monkeypatch.setattr(auth_utils, "auth_required", fake_auth_required)
    for url, boton in PAGES:
        resp = client.get(url)
        assert resp.status_code == 200
        assert f'id="{boton}"' in resp.text
