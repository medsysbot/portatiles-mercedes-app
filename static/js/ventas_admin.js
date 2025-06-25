// Archivo: static/js/ventas_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaVentas');
  const mensajeError = document.getElementById('errorVentas');
  const mensajeInfo = document.getElementById('mensajeVentas');

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
    if (!ids.length || !confirm('¿Eliminar registros seleccionados?')) return;
    try {
      const resp = await fetch('/admin/api/ventas/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await cargarVentas();
    } catch (err) {
      console.error('Error eliminando ventas:', err);
      mostrarMensaje('Error eliminando registros', 'danger');
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function cargarVentas() {
    try {
      const resp = await fetch('/admin/api/ventas', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error consultando ventas');
      ventasCargadas = await resp.json();
      mostrarVentas(ventasCargadas);
      mensajeError?.classList.add('d-none');
      if (ventasCargadas.length === 0) {
        mostrarMensaje('No hay ventas registradas', '');
      } else {
        mostrarMensaje('', '');
      }
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      if (mensajeError) {
        mensajeError.textContent = 'No se pudo cargar el listado.';
        mensajeError.classList.remove('d-none');
      }
    }
  }

  function mostrarVentas(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function mostrarMensaje(texto, tipo) {
    if (!mensajeInfo) return;
    if (!texto) {
      mensajeInfo.style.display = 'none';
      mensajeInfo.textContent = '';
      mensajeInfo.classList.remove('alert-danger');
      return;
    }
    mensajeInfo.textContent = texto;
    mensajeInfo.classList.toggle('alert-danger', tipo === 'danger');
    mensajeInfo.style.display = 'block';
  }

  buscador?.addEventListener('input', () => {
    const texto = (buscador.value || '').toLowerCase();
    const filtrados = ventasCargadas.filter(v =>
      (v.nombre_cliente || '').toLowerCase().includes(texto) ||
      (v.dni_cuit_cuil || '').toLowerCase().includes(texto)
    );
    mostrarVentas(filtrados);
    if (filtrados.length === 0) {
      mostrarMensaje('No hay ventas registradas', '');
    } else {
      mostrarMensaje('', '');
    }
  });

  cargarVentas();
});
