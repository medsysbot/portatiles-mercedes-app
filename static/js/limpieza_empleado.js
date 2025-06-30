// Archivo: static/js/limpieza_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaServicios').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'id_servicio', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'fecha_servicio' },
      { data: 'numero_bano' },
      { data: 'dni_cuit_cuil' },
      { data: 'nombre_cliente' },
      { data: 'tipo_servicio' },
      { data: 'estado', render: e => e === 'completado' ? '<span class="badge badge-success">Completado</span>' : '<span class="badge badge-warning">Pendiente</span>' },
      { data: 'remito_url', render: data => data ? `<a href="${data}" target="_blank">Ver</a>` : 'Sin remito' },
      { data: 'observaciones' }
    ]
  });

  const btnBuscar = document.getElementById('btnBuscarServicios');
  const buscador = document.getElementById('busquedaServicios');
  const errorDiv = document.getElementById('errorServicios');
  const mensajeDiv = document.getElementById('mensajeServicios');
  const btnEliminar = document.getElementById('btnEliminarSeleccionados');
  let servicios = [];

  async function cargarServicios() {
    try {
      const resp = await fetch('/empleado/api/servicios_limpieza', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar servicios');
      servicios = await resp.json();
      mostrarServicios(servicios);
      errorDiv.classList.add('d-none');
      if (servicios.length === 0) {
        mostrarMensaje('No hay servicios registrados', '');
      } else {
        mostrarMensaje('', '');
      }
    } catch (err) {
      console.error('Error cargando servicios:', err);
      errorDiv.textContent = 'No se pudo cargar el listado.';
      errorDiv.classList.remove('d-none');
    }
  }

  function mostrarServicios(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function actualizarBoton() {
    const checks = document.querySelectorAll('#tablaServicios tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = checks.length === 0;
  }

  $('#tablaServicios tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaServicios tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length || !confirm('¿Eliminar registros seleccionados?')) return;
    try {
      const resp = await fetch('/empleado/api/servicios_limpieza/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await cargarServicios();
    } catch (err) {
      console.error('Error eliminando servicios:', err);
      mostrarMensaje('Error eliminando registros', 'danger');
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  function mostrarMensaje(texto, tipo) {
    if (!mensajeDiv) return;
    if (!texto) {
      mensajeDiv.style.display = 'none';
      mensajeDiv.textContent = '';
      mensajeDiv.classList.remove('alert-danger');
      return;
    }
    mensajeDiv.textContent = texto;
    mensajeDiv.classList.toggle('alert-danger', tipo === 'danger');
    mensajeDiv.style.display = 'block';
  }

  function filtrarServicios(texto) {
    const q = texto.toLowerCase();
    const filtrados = servicios.filter(s =>
      (s.nombre_cliente || '').toLowerCase().includes(q) ||
      (s.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (s.numero_bano || '').toLowerCase().includes(q)
    );
    mostrarServicios(filtrados);
    if (filtrados.length === 0) {
      mostrarMensaje('No hay servicios registrados', '');
    } else {
      mostrarMensaje('', '');
    }
  }

  buscador?.addEventListener('input', () => filtrarServicios(buscador.value.trim()));
  btnBuscar?.addEventListener('click', () => filtrarServicios(buscador.value.trim()));

  cargarServicios();
});
