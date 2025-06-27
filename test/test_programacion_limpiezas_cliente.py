from fastapi.testclient import TestClient
from routes import programacion_limpiezas
from main import app

client = TestClient(app)


def test_vista_cliente(monkeypatch):
    app.dependency_overrides[programacion_limpiezas.auth_required] = lambda: {"rol": "cliente"}
    resp = client.get("/cliente/programacion_limpiezas/view")
    assert resp.status_code == 200
    assert "Próximas limpiezas" in resp.text
    app.dependency_overrides.clear()
