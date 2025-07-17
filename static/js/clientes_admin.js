// Archivo: static/js/clientes_admin.js
// Proyecto: Portátiles Mercedes

function handleUnauthorized() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
  localStorage.removeItem('nombre');
  window.location.href = '/login';
}

window.pmClientesAdminData = window.pmClientesAdminData || [];
let tablaClientes = null;

function inicializarTablaClientes() {
  if (tablaClientes) return;
  tablaClientes = $('#tabla-clientes').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      {
        data: 'dni_cuit_cuil',
        render: data => `<input type="checkbox" class="fila-check" value="${data}">`,
        orderable: false
      },
      { data: 'dni_cuit_cuil' },
      { data: 'nombre' },
      { data: 'apellido' },
      { data: 'direccion' },
      { data: 'telefono' },
      { data: 'razon_social' },
      { data: 'email' }
    ]
  });
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarTablaClientes();
  const tabla = tablaClientes;

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const checks = document.querySelectorAll('#tabla-clientes tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = checks.length === 0;
  }

  $('#tabla-clientes tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tabla-clientes tbody .fila-check:checked')).map(c => c.value);
    if (!ids.length) return;
    const start = Date.now();
    try {
      const resp = await fetch('/admin/api/clientes/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await obtenerClientes();
      const delay = Math.max(0, 1600 - (Date.now() - start));
      setTimeout(() => {
      }, delay);
    } catch (err) {
      const delay = Math.max(0, 1600 - (Date.now() - start));
      setTimeout(() => {
      }, delay);
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function obtenerClientes() {
    try {
      const resp = await fetch('/clientes');
      const data = await resp.json();
      window.pmClientesAdminData = data || [];
      mostrarClientes(window.pmClientesAdminData);
    } catch (error) {
      if (window.pmClientesAdminData.length === 0) tabla.clear().draw();
    }
  }

  function mostrarClientes(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrarClientes(texto) {
    const q = texto.toLowerCase();
    const filtrados = window.pmClientesAdminData.filter(c =>
      (c.nombre || '').toLowerCase().includes(q) ||
      (c.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (c.razon_social || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
    mostrarClientes(filtrados);
  }

  const buscador = document.getElementById('busquedaCliente');
  const btnBuscar = document.getElementById('btnBuscarCliente');
  if (buscador) buscador.addEventListener('input', () => filtrarClientes(buscador.value.trim()));
  if (btnBuscar) btnBuscar.addEventListener('click', () => filtrarClientes(buscador.value.trim()));

  if (window.pmClientesAdminData.length === 0) {
    obtenerClientes();
  } else {
    mostrarClientes(window.pmClientesAdminData);
  }
});
