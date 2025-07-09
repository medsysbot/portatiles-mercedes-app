// Archivo: static/js/limpieza_empleado.js
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
      {
        data: 'estado',
        render: e => {
          if (!e) return '<span class="badge badge-secondary">Sin estado</span>';
          const est = e.toLowerCase();
          if (est === 'completo') return '<span class="badge badge-success">Completo</span>';
          if (est === 'pendiente') return '<span class="badge badge-warning">Pendiente</span>';
          return `<span class="badge badge-info">${e}</span>`;
        }
      },
      { data: 'remito_url', render: data => data ? `<a href="${data}" target="_blank">Ver</a>` : 'Sin remito' },
      { data: 'observaciones' }
    ]
  });

  const btnBuscar = document.getElementById('btnBuscarServicios');
  const buscador = document.getElementById('busquedaServicios');
  const errorDiv = document.getElementById('errorServicios');
  const mensajeDiv = document.getElementById('mensajeServicios');
  const btnEliminar = document.getElementById('btnEliminarSeleccionados');
  const btnEditar = document.getElementById('btnEditarSeleccionado');
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
      mostrarMensaje(servicios.length === 0 ? 'No hay servicios registrados' : '', '');
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

  function actualizarBotones() {
    const checks = document.querySelectorAll('#tablaServicios tbody .fila-check:checked');
    const activo = checks.length === 1;
    if (btnEliminar) btnEliminar.disabled = checks.length === 0;
    if (btnEditar) btnEditar.disabled = !activo;
  }

  $('#tablaServicios tbody').on('change', '.fila-check', actualizarBotones);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaServicios tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    const ok = await mostrarConfirmacionPersonalizada('¿Eliminar registros seleccionados?', 'error-datos');
    if (!ok) return;
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
      actualizarBotones();
    }
  });

  btnEditar?.addEventListener('click', () => {
    const checks = document.querySelectorAll('#tablaServicios tbody .fila-check:checked');
    if (checks.length !== 1) return mostrarAlertaPersonalizada('Debe seleccionar un único registro para editar','error-datos');
    const id = checks[0].dataset.id;
    if (!id) return mostrarAlertaPersonalizada('ID de servicio no encontrado','error-datos');
    localStorage.setItem('pendiente_recarga', '1');
    window.location.href = `/empleado/limpieza/editar/${id}`;
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
    mostrarMensaje(filtrados.length === 0 ? 'No hay servicios registrados' : '', '');
  }

  buscador?.addEventListener('input', () => filtrarServicios(buscador.value.trim()));
  btnBuscar?.addEventListener('click', () => filtrarServicios(buscador.value.trim()));

  cargarServicios();

  if (localStorage.getItem('pendiente_recarga')) {
    localStorage.removeItem('pendiente_recarga');
    cargarServicios();
  }
});
