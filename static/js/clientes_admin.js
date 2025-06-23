// Archivo: static/js/clientes_admin.js
// Proyecto: Portátiles Mercedes

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
      { data: 'dni', render: data => `<input type="checkbox" class="fila-check" data-id="${data}">`, orderable: false },
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

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const checks = document.querySelectorAll('#tablaClientes tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = checks.length === 0;
  }

  $('#tablaClientes tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaClientes tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length || !confirm('¿Eliminar registros seleccionados?')) return;
    try {
      const resp = await fetch('/admin/api/clientes/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await obtenerClientes();
    } catch (err) {
      console.error('Error eliminando clientes:', err);
      mostrarMensaje('Error eliminando registros', 'danger');
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function obtenerClientes() {
    try {
      const resp = await fetch('/clientes');
      const data = await resp.json();
      console.log('✅ Clientes recibidos:', data);
      clientesCargados = data || [];
      mostrarClientes(clientesCargados);
    } catch (error) {
      console.error('❌ Error al cargar clientes:', error);
      mostrarMensaje('Error consultando la base de datos', 'danger');
      // Solo borrar la tabla si está vacía desde el principio
      if (clientesCargados.length === 0) {
        tabla.clear().draw();
      }
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

  obtenerClientes();  // solo una vez, al cargar

  // Si existe un botón de refrescar manual
  document.getElementById('btnClientes')?.addEventListener('click', () => {
    obtenerClientes();
  });
});
