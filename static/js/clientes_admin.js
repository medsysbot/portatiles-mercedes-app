// Archivo: static/js/clientes_admin.js
// Proyecto: Portátiles Mercedes
// Requiere que la plantilla cargue /static/js/alertas.js para usar showAlert

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

document.addEventListener('DOMContentLoaded', async () => {
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
    try {
      await showAlert('borrando', 'Eliminando clientes...', true, 2600);
      const resp = await fetch('/admin/api/clientes/eliminar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('access_token')
        },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');

      await showAlert('borrado-exito', 'Clientes eliminados', true, 2600);

      await obtenerClientes();  // Esta ya tiene los alert internos
    } catch (err) {
      await showAlert('borrado-error', 'Error eliminando clientes', true, 2600);
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function obtenerClientes() {
    try {
      await showAlert('cargando-datos', 'Cargando clientes...', true, 2600);
      const resp = await fetch('/clientes');
      const data = await resp.json();
      window.pmClientesAdminData = data || [];
      mostrarClientes(window.pmClientesAdminData);
      await showAlert('exito-datos', 'Clientes cargados correctamente', true, 2600);
    } catch (error) {
      await showAlert('error-datos', 'Error al cargar clientes', true, 2600);
      if (window.pmClientesAdminData.length === 0) tabla.clear().draw();
    }
  }

  if (window.pmClientesAdminData.length === 0) {
    await obtenerClientes();
  } else {
    mostrarClientes(window.pmClientesAdminData);
  }
