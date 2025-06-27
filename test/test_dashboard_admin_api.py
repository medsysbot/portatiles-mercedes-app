from fastapi.testclient import TestClient
import types
from routes import admin_panel
from main import app

client = TestClient(app)

def test_dashboard_api(monkeypatch):
    monkeypatch.setattr(admin_panel, "_contar_por_mes", lambda tabla, campo: [1]*12)
    def fake_contar_total(tabla):
        totales = {
            "datos_personales_clientes": 10,
            admin_panel.ALQUILERES_TABLE: 5,
            admin_panel.VENTAS_TABLE: 3,
            "facturas_pendientes": 2,
            "morosos": 1,
        }
        return totales.get(tabla, 0)
    monkeypatch.setattr(admin_panel, "_contar_total", fake_contar_total)
    resp = client.get("/admin/api/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["alquileres"] == [1]*12
    assert data["ventas"] == [1]*12
    assert data["totales"] == {
        "clientes": 10,
        "alquileres": 5,
        "ventas": 3,
        "pendientes": 2,
        "morosos": 1,
    }
