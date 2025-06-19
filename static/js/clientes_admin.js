// Archivo: static/js/clientes_admin.js
// Descripción: Carga y filtrado dinámico de clientes desde Supabase
// Proyecto: Portátiles Mercedes
// Última modificación: 2025-06-19

function handleUnauthorized() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
  localStorage.removeItem('nombre');
  window.location.href = '/login';
}

async function fetchConAuth(url) {
  const resp = await fetch(url, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') },
  });
  if (resp.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }
  return resp;
}

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaClientes').DataTable({
    columns: [
      { data: 'dni' },
      { data: 'nombre' },
      { data: 'apellido' },
      { data: 'direccion' },
      { data: 'telefono' },
      { data: 'cuit' },
      { data: 'razon_social' },
      { data: 'email' },
    ],
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
  });

  async function cargarClientes(texto = '') {
    const params = new URLSearchParams();
    if (texto) params.append('q', texto);
    try {
      const resp = await fetchConAuth(`/admin/api/clientes?${params.toString()}`);
      if (!resp.ok) throw new Error('Error');
      const lista = await resp.json();
      tabla.clear();
      tabla.rows.add(lista).draw();
    } catch (e) {
      console.error('Error obteniendo clientes', e);
      tabla.clear().draw();
    }
  }

  const buscador = document.getElementById('busquedaCliente');
  if (buscador) {
    buscador.addEventListener('input', () => {
      cargarClientes(buscador.value.trim());
    });
  }

  cargarClientes();
});
