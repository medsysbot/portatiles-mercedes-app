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

let clientesCargados = [];

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaClientes').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'dni' },
      { data: 'nombre' },
      { data: 'apellido' },
      { data: 'direccion' },
      { data: 'telefono' },
      { data: 'cuit' },
      { data: 'razon_social' },
      { data: 'email' }
    ]
  });

  async function obtenerClientes() {
    try {
      const resp = await fetchConAuth('/admin/api/clientes');
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg = data.detail || 'No se pudo consultar la base de datos';
        mostrarMensaje(msg, 'danger');
        throw new Error(msg);
      }
      const data = await resp.json();
      clientesCargados = data.clientes || [];
      mostrarClientes(clientesCargados);
    } catch (e) {
      console.error('Error obteniendo clientes', e);
      mostrarMensaje('Error consultando la base de datos', 'danger');
      tabla.clear().draw();
    }
  }

  function mostrarClientes(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
    if (lista.length === 0) {
      mostrarMensaje('No hay clientes registrados', '');
    } else {
      mostrarMensaje('', '');
    }
  }

  function filtrarClientes(texto) {
    const q = texto.toLowerCase();
    const filtrados = clientesCargados.filter(c =>
      (c.nombre || '').toLowerCase().includes(q) ||
      (c.dni || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
    mostrarClientes(filtrados);
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
      filtrarClientes(buscador.value.trim());
    });
  }
  if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
      filtrarClientes(buscador.value.trim());
    });
  }

  obtenerClientes();
});
