import main
from fastapi.testclient import TestClient

client = TestClient(main.app)


def test_admin_panel_html():
    resp = client.get("/admin/panel")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]


import os
import jwt
import types
from routes import admin_panel, login
from routes.alquileres import ALQUILERES_TABLE


class MockQuery:
    def __init__(self, data):
        self.data = data
        self.filters = {}

    def select(self, *_):
        return self

    def eq(self, field, value):
        self.filters[field] = value
        return self

    def execute(self):
        result = self.data
        if "dni_cuit_cuil" in self.filters:
            result = [c for c in self.data if c["dni_cuit_cuil"] == self.filters["dni_cuit_cuil"]]
        return types.SimpleNamespace(data=result, status_code=200, error=None)


class MockSupabase:
    def __init__(self, data):
        self.data = data

    def table(self, _name):
        return MockQuery(self.data)


def auth_headers():
    secret = os.getenv("JWT_SECRET", "secret")
    token = jwt.encode({"rol": "Administrador"}, secret, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


def test_admin_api_clientes_busqueda(monkeypatch):
    data = [
        {
            "nombre": "Ana",
            "apellido": "Gomez",
            "dni_cuit_cuil": "456",
            "email": "ana@test.com",
            "estado": "activo",
        },
        {
            "nombre": "Juan",
            "apellido": "Perez",
            "dni_cuit_cuil": "123",
            "email": "juan@test.com",
            "estado": "activo",
        },
    ]
    monkeypatch.setattr(admin_panel, "supabase", MockSupabase(data))
    response = client.get("/admin/api/clientes?q=456", headers=auth_headers())
    assert response.status_code == 200
    data = response.json()
    assert "clientes" in data
    assert len(data["clientes"]) == 1
    assert data["clientes"][0]["dni_cuit_cuil"] == "456"


def test_info_todos_clientes(monkeypatch):
    datos = [
        {"dni_cuit_cuil": "1", "nombre": "Ana", "apellido": "G", "email": "a@test.com"},
        {"dni_cuit_cuil": "2", "nombre": "Juan", "apellido": "P", "email": "j@test.com"},
    ]
    monkeypatch.setattr(admin_panel, "supabase", MockSupabase(datos))
    resp = client.get("/info_todos_clientes")
    assert resp.status_code == 200
    lista = resp.json()
    assert isinstance(lista, list)
    assert len(lista) == 2


def test_admin_empleados_html(monkeypatch):
    monkeypatch.setattr(admin_panel, "supabase", EmpleadoMockSupabase())
    resp = client.get("/admin/empleados")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]


class EmpleadoMockQuery:
    def __init__(self, existing_email=None):
        self.filters = {}
        self.existing_email = existing_email
        self.is_select = True

    def select(self, *_):
        self.is_select = True
        return self

    def eq(self, field, value):
        self.filters[field] = value
        return self

    def insert(self, _data):
        self.is_select = False
        return self

    def execute(self):
        if self.is_select:
            if self.filters.get("email") == self.existing_email:
                return types.SimpleNamespace(
                    data=[{"id": 1}], status_code=200, error=None
                )
            return types.SimpleNamespace(data=[], status_code=200, error=None)
        return types.SimpleNamespace(data=[{"id": 2}], status_code=200, error=None)


class EmpleadoMockSupabase:
    def __init__(self, existing_email=None):
        self.existing_email = existing_email

    def table(self, _name):
        return EmpleadoMockQuery(self.existing_email)


class InMemoryQuery:
    def __init__(self, data):
        self.data = data
        self.filters = {}
        self.is_select = True
        self.single_mode = False
        self.insert_data = None

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


class InMemorySupabase:
    def __init__(self):
        self.users = []

    def table(self, name):
        if name == "usuarios":
            return InMemoryQuery(self.users)
        return InMemoryQuery([])


def test_crear_empleado_email_repetido(monkeypatch):
    monkeypatch.setattr(
        admin_panel, "supabase", EmpleadoMockSupabase("existe@test.com")
    )
    resp = client.post(
        "/admin/empleados/nuevo",
        data={
            "nombre": "Juan",
            "email": "existe@test.com",
            "password": "1234",
            "rol": "empleado",
        },
    )
    assert resp.status_code == 400


def test_crear_empleado_ok(monkeypatch):
    monkeypatch.setattr(admin_panel, "supabase", EmpleadoMockSupabase())
    resp = client.post(
        "/admin/empleados/nuevo",
        data={
            "nombre": "Ana",
            "email": "ana@test.com",
            "password": "1234",
            "rol": "Administrador",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["mensaje"] == "Empleado creado correctamente"


def test_crear_y_login_empleado(monkeypatch):
    mock_db = InMemorySupabase()
    monkeypatch.setattr(admin_panel, "supabase", mock_db)
    monkeypatch.setattr(login, "supabase", mock_db)
    create = client.post(
        "/admin/empleados/nuevo",
        data={
            "nombre": "Pepe",
            "email": "pepe@test.com",
            "password": "abc123",
            "rol": "empleado",
        },
    )
    assert create.status_code == 200
    login_resp = client.post(
        "/login",
        json={"email": "pepe@test.com", "password": "abc123", "rol": "empleado"},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


class AlquilerSupabase:
    def __init__(self, data=None):
        self.alquileres = data or []

    def table(self, name):
        if name == ALQUILERES_TABLE:
            return InMemoryQuery(self.alquileres)
        return InMemoryQuery([])


def test_crear_alquiler_ok(monkeypatch):
    db = AlquilerSupabase([])
    monkeypatch.setattr(admin_panel, "supabase", db)
    import routes.alquileres as alquileres

    monkeypatch.setattr(alquileres, "supabase", db)
    datos = {
        "numero_bano": "B1",
        "cliente_nombre": "Juan",
        "dni_cuit_cuil": "20123456",
        "direccion": "Dir",
        "fecha_inicio": "2025-01-01",
        "fecha_fin": "2025-12-31",
        "observaciones": "Obs",
    }
    resp = client.post("/admin/alquileres/nuevo", json=datos)
    assert resp.status_code == 200
    assert resp.json().get("ok") is True
    assert db.alquileres and db.alquileres[0]["numero_bano"] == "B1"


def test_crear_alquiler_duplicado(monkeypatch):
    existente = [{"numero_bano": "B2"}]
    db = AlquilerSupabase(existente)
    monkeypatch.setattr(admin_panel, "supabase", db)
    import routes.alquileres as alquileres

    monkeypatch.setattr(alquileres, "supabase", db)
    datos = {
        "numero_bano": "B2",
        "cliente_nombre": "Ana",
        "dni_cuit_cuil": "20987654",
        "direccion": "Dir",
        "fecha_inicio": "2025-01-01",
        "fecha_fin": None,
        "observaciones": "Obs",
    }
    resp = client.post("/admin/alquileres/nuevo", json=datos)
    assert resp.status_code == 200
    assert resp.json().get("error")
