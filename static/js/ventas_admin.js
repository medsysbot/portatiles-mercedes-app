// Archivo: static/js/ventas_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaVentas');
  const btnBuscar = document.getElementById('btnBuscarVentas');
  const mensajeError = document.getElementById('errorVentas');

  let ventasCargadas = [];

  const tabla = $('#tablaVentas').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'id_venta', render: data => `<input type="checkbox" class="fila-check" data-id="${data}">`, orderable: false },
      { data: 'fecha_operacion' },
      { data: 'tipo_bano' },
      { data: 'dni_cuit_cuil' },
      { data: 'nombre_cliente' },
      { data: 'forma_pago' },
      { data: 'observaciones' }
    ]
  });

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const checks = document.querySelectorAll('#tablaVentas tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = checks.length === 0;
  }

  $('#tablaVentas tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaVentas tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    if (typeof showAlert === 'function') {
      showAlert('guardando-datos', 'Eliminando ventas...', false, 1600);
    }
    try {
      const resp = await fetch('/admin/api/ventas/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await cargarVentas();
      if (typeof showAlert === 'function') {
        showAlert('exito-datos', 'Ventas eliminadas', false, 2600);
      }
    } catch (err) {
      console.error('Error eliminando ventas:', err);
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al eliminar ventas', false, 2600);
      }
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function cargarVentas() {
    const inicio = startDataLoad();
    await dataLoadDelay();
    try {
      const resp = await fetch('/admin/api/ventas', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error consultando ventas');
      ventasCargadas = await resp.json();
      mostrarVentas(ventasCargadas);
      endDataLoad(inicio, true);
    } catch (err) {
      endDataLoad(inicio, false);
      console.error('Error al cargar ventas:', err);
    }
  }

  function mostrarVentas(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrarVentas(texto) {
    const q = texto.toLowerCase();
    const filtrados = ventasCargadas.filter(v =>
      (v.nombre_cliente || '').toLowerCase().includes(q) ||
      (v.dni_cuit_cuil || '').toLowerCase().includes(q)
    );
    mostrarVentas(filtrados);
    if (filtrados.length === 0) {
    }
  }

  buscador?.addEventListener('input', () => {
    filtrarVentas(buscador.value.trim());
  });
  btnBuscar?.addEventListener('click', () => {
    filtrarVentas(buscador.value.trim());
  });

  cargarVentas();
});
