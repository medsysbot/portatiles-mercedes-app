import main
from fastapi.testclient import TestClient

client = TestClient(main.app)

def test_admin_panel_html():
    resp = client.get('/admin/panel')
    assert resp.status_code == 200
    assert 'text/html' in resp.headers['content-type']
