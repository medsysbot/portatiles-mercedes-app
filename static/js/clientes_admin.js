// Archivo: static/js/clientes_admin.js
// Descripción: Búsqueda en tiempo real de clientes
// Proyecto: Portátiles Mercedes
// Última modificación: 2025-06-17

function handleUnauthorized() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
  localStorage.removeItem('nombre');
  window.location.href = '/login';
}

async function fetchConAuth(url) {
  const resp = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
  });
  if (resp.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }
  return resp;
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('busquedaCliente');
  const estadoSel = null;
  if (!input) return;

  async function buscar() {
    const params = new URLSearchParams();
    if (input.value.trim()) params.append('q', input.value.trim());
    
    const resp = await fetchConAuth(`/admin/api/clientes?${params.toString()}`);
    if (!resp.ok) return;
    const lista = await resp.json();
    const tbody = document.querySelector('#tablaClientes tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (const c of lista) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        `<td>${c.nombre || ''}</td>` +
        `<td>${c.apellido || ''}</td>` +
        `<td>${c.dni || ''}</td>` +
        `<td>${c.email || ''}</td>` +
        `<td>${c.telefono || ''}</td>` +
        `<td>${c.fecha_alta || ''}</td>`;
      tbody.appendChild(tr);
    }
  }

  input.addEventListener('input', buscar);
});
