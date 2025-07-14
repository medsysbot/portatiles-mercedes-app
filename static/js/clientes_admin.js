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

let clientesCargados = [];

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tabla-clientes').DataTable({
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
      const resp = await fetch('/admin/api/clientes/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await obtenerClientes();
    } catch (err) {
      showAlert('error-datos', 'Error eliminando clientes');
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function obtenerClientes() {
    const inicio = startDataLoad();
    try {
      const resp = await fetch('/clientes');
      const data = await resp.json();
      clientesCargados = data || [];
      mostrarClientes(clientesCargados);
      endDataLoad(inicio, true);
    } catch (error) {
      endDataLoad(inicio, false);
      if (clientesCargados.length === 0) tabla.clear().draw();
    }
  }

  function mostrarClientes(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrarClientes(texto) {
    const q = texto.toLowerCase();
    const filtrados = clientesCargados.filter(c =>
      (c.nombre || '').toLowerCase().includes(q) ||
      (c.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
    mostrarClientes(filtrados);
  }

  const buscador = document.getElementById('busquedaCliente');
  const btnBuscar = document.getElementById('btnBuscarCliente');
  if (buscador) buscador.addEventListener('input', () => filtrarClientes(buscador.value.trim()));
  if (btnBuscar) btnBuscar.addEventListener('click', () => filtrarClientes(buscador.value.trim()));

  obtenerClientes();
});
