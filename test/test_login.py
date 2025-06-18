"""
----------------------------------------------------------
Archivo: test/test_login.py
Descripción: Pruebas unitarias del módulo de login
Última modificación: 2025-06-15
Proyecto: Portátiles Mercedes
----------------------------------------------------------
"""

import os
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from passlib.hash import bcrypt
import types
import pytest

load_dotenv(dotenv_path='.env')

import main
from routes import login

class MockQuery:
    def __init__(self, user):
        self.user = user
        self.filters = {}
    def select(self, *_args):
        return self
    def eq(self, field, value):
        self.filters[field] = value
        return self
    def single(self):
        return self
    def execute(self):
        email = self.filters.get('email')
        rol = self.filters.get('rol')
        if (
            email == self.user['email']
            and rol == self.user['rol']
        ):
            return types.SimpleNamespace(data=self.user, status_code=200, error=None)
        return types.SimpleNamespace(data=None, status_code=200, error=None)

class MockSupabase:
    def __init__(self, user):
        self.user = user
    def table(self, _name):
        return MockQuery(self.user)

def setup_mock_supabase(monkeypatch, user):
    monkeypatch.setattr(login, 'supabase', MockSupabase(user))

@pytest.fixture
def client():
    return TestClient(main.app)


def create_user():
    return {
        'email': 'admin@portatiles.com',
        'password_hash': bcrypt.hash('admin123'),
        'rol': 'Administrador',
        'activo': True,
        'nombre': 'Admin'
    }


def test_login_exitoso(monkeypatch, client):
    user = create_user()
    setup_mock_supabase(monkeypatch, user)
    response = client.post('/login', json={
        'email': user['email'],
        'password': 'admin123',
        'rol': 'Administrador'
    })
    assert response.status_code == 200
    data = response.json()
    assert data['rol'] == 'Administrador'
    assert 'access_token' in data


def test_login_rol_incorrecto(monkeypatch, client):
    user = create_user()
    setup_mock_supabase(monkeypatch, user)
    response = client.post('/login', json={
        'email': user['email'],
        'password': 'admin123',
        'rol': 'cliente'
    })
    assert response.status_code == 401


def test_login_password_incorrecto(monkeypatch, client):
    """Contraseña incorrecta debería devolver 401."""
    user = create_user()
    setup_mock_supabase(monkeypatch, user)
    response = client.post('/login', json={
        'email': user['email'],
        'password': 'clave-incorrecta',
        'rol': 'Administrador'
    })
    assert response.status_code == 401


def test_login_usuario_inactivo(monkeypatch, client):
    """Usuario inactivo debería devolver 403."""
    user = create_user()
    user['activo'] = False
    setup_mock_supabase(monkeypatch, user)
    response = client.post('/login', json={
        'email': user['email'],
        'password': 'admin123',
        'rol': 'Administrador'
    })
    assert response.status_code == 403


def test_login_usuario_inexistente(monkeypatch, client):
    """Usuario no registrado debería devolver 401."""
    user = create_user()
    setup_mock_supabase(monkeypatch, user)
    response = client.post('/login', json={
        'email': 'otro@portatiles.com',
        'password': 'admin123',
        'rol': 'Administrador'
    })
    assert response.status_code == 401


class InMemoryQuery:
    def __init__(self, data):
        self.data = data
        self.filters = {}
        self.is_select = True
        self.insert_data = None

    def select(self, *_args):
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
            result = [
                u for u in self.data
                if all(u.get(k) == v for k, v in self.filters.items())
            ]
            return types.SimpleNamespace(data=result, status_code=200, error=None)
        if self.insert_data is not None:
            self.data.append(self.insert_data)
            return types.SimpleNamespace(data=[{'id': len(self.data)}], status_code=200, error=None)
        return types.SimpleNamespace(data=None, status_code=400, error='invalid')


class InMemorySupabase:
    def __init__(self):
        self.users = []

    def table(self, name):
        if name == 'usuarios':
            return InMemoryQuery(self.users)
        return InMemoryQuery([])


def test_registrar_cliente_ok(monkeypatch, client):
    db = InMemorySupabase()
    monkeypatch.setattr(login, 'supabase', db)
    resp = client.post('/registrar_cliente', data={
        'nombre': 'Ana',
        'email': 'ana@test.com',
        'password': 'abc123'
    })
    assert resp.status_code == 200
    assert resp.json()['mensaje'] == 'Registro exitoso'
    assert len(db.users) == 1
    assert db.users[0]['email'] == 'ana@test.com'
    assert 'password_hash' in db.users[0]
    assert db.users[0]['activo'] is True
    assert 'creado_en' in db.users[0]
    # Validar formato ISO 8601
    from datetime import datetime
    datetime.fromisoformat(db.users[0]['creado_en'])


def test_registrar_cliente_email_repetido(monkeypatch, client):
    db = InMemorySupabase()
    db.users.append({'email': 'ana@test.com', 'password_hash': 'x', 'rol': 'cliente'})
    monkeypatch.setattr(login, 'supabase', db)
    resp = client.post('/registrar_cliente', data={
        'nombre': 'Ana',
        'email': 'ana@test.com',
        'password': 'abc123'
    })
    assert resp.status_code == 400


