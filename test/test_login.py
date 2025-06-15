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
