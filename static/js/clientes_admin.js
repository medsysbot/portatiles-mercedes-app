// Archivo: static/js/clientes_admin.js
// Descripción: Búsqueda en tiempo real de clientes
// Proyecto: Portátiles Mercedes
// Última modificación: 2025-06-17

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('busquedaCliente');
  const estadoSel = document.getElementById('estadoFiltro');
  if (!input) return;

  async function buscar() {
    const params = new URLSearchParams();
    if (input.value.trim()) params.append('q', input.value.trim());
    if (estadoSel && estadoSel.value) params.append('estado', estadoSel.value);
    const resp = await fetch(`/admin/api/clientes?${params.toString()}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
    });
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
        `<td>${c.estado || ''}</td>` +
        `<td>${c.fecha_alta || ''}</td>`;
      tbody.appendChild(tr);
    }
  }

  input.addEventListener('input', buscar);
  if (estadoSel) estadoSel.addEventListener('change', buscar);
});
