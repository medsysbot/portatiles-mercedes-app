import main
from fastapi.testclient import TestClient

client = TestClient(main.app)

def test_admin_panel_html():
    resp = client.get('/admin/panel')
    assert resp.status_code == 200
    assert 'text/html' in resp.headers['content-type']

import os
import jwt
import types
from routes import admin_panel

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
        if 'dni' in self.filters:
            result = [c for c in self.data if c['dni'] == self.filters['dni']]
        return types.SimpleNamespace(data=result, status_code=200, error=None)

class MockSupabase:
    def __init__(self, data):
        self.data = data
    def table(self, _name):
        return MockQuery(self.data)

def auth_headers():
    secret = os.getenv('JWT_SECRET', 'secret')
    token = jwt.encode({'rol': 'Administrador'}, secret, algorithm='HS256')
    return {'Authorization': f'Bearer {token}'}


def test_admin_api_clientes_busqueda(monkeypatch):
    data = [
        {'nombre': 'Ana', 'apellido': 'Gomez', 'dni': '456', 'email': 'ana@test.com', 'estado': 'activo'},
        {'nombre': 'Juan', 'apellido': 'Perez', 'dni': '123', 'email': 'juan@test.com', 'estado': 'activo'},
    ]
    monkeypatch.setattr(admin_panel, 'supabase', MockSupabase(data))
    response = client.get('/admin/api/clientes?q=456', headers=auth_headers())
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['dni'] == '456'
