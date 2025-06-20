// Archivo: static/js/clientes_admin.js
// Descripción: Carga y filtrado dinámico de clientes
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
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg = data.detail || 'Error obteniendo datos';
        mostrarMensaje(msg, 'danger');
        throw new Error(msg);
      }
      const lista = await resp.json();
      tabla.clear();
      tabla.rows.add(lista).draw();
      mostrarMensaje('', '');
    } catch (e) {
      console.error('Error obteniendo clientes', e);
      tabla.clear().draw();
    }
  }

  function mostrarMensaje(texto, tipo) {
    const cont = document.getElementById('mensajeClientes');
    if (!cont) return;
    if (!texto) {
      cont.style.display = 'none';
      cont.textContent = '';
      cont.classList.remove('alert-danger');
      return;
    }
    cont.textContent = texto;
    cont.classList.toggle('alert-danger', tipo === 'danger');
    cont.style.display = 'block';
  }

  const buscador = document.getElementById('busquedaCliente');
  const btnBuscar = document.getElementById('btnBuscarCliente');
  if (buscador) {
    buscador.addEventListener('input', () => {
      cargarClientes(buscador.value.trim());
    });
  }
  if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
      cargarClientes(buscador.value.trim());
    });
  }

  cargarClientes();
});
