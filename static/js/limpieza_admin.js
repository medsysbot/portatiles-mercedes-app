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
      { data: 'razon_social' },
      { data: 'direccion' },
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
  const btnEditar = document.getElementById('btnEditarSeleccionado');
  const btnEliminar = document.getElementById('btnEliminarServicios');
  let servicios = [];

  async function cargarServicios() {
    try {
      const resp = await fetch('/admin/api/servicios_limpieza', {
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') }
      });
      if (!resp.ok) throw new Error('Error al consultar servicios');
      servicios = await resp.json();
      mostrarServicios(servicios);
      errorDiv.classList.add('d-none');
      
    } catch (err) {
      console.error('Error cargando servicios:', err);
    }
  }

  function mostrarServicios(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
    actualizarBotones();
  }

  function actualizarBotones() {
    const checks = document.querySelectorAll('#tablaServicios tbody .fila-check:checked');
    const unoSeleccionado = checks.length === 1;
    const algunoSeleccionado = checks.length > 0;
    if (btnEditar) btnEditar.disabled = !unoSeleccionado;
    if (btnEliminar) btnEliminar.disabled = !algunoSeleccionado;
  }

  $('#tablaServicios tbody').on('change', '.fila-check', actualizarBotones);

  btnEditar?.addEventListener('click', () => {
    const checks = document.querySelectorAll('#tablaServicios tbody .fila-check:checked');
    const id = checks[0].dataset.id;
    localStorage.setItem('pendiente_recarga', '1');
    window.location.href = `/admin/limpieza/editar/${id}`;
  });

  btnEliminar?.addEventListener('click', async () => {
    const checks = document.querySelectorAll('#tablaServicios tbody .fila-check:checked');
    const ids = Array.from(checks).map(c => c.dataset.id);
    if (!ids.length) return;
    if (!confirm('¿Estás seguro de eliminar los servicios seleccionados?')) return;
    const inicio = Date.now();
    try {
      const resp = await fetch('/admin/api/servicios_limpieza/eliminar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '')
        },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await cargarServicios();
      
    } catch (err) {
      console.error('Error eliminando servicios:', err);
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
      if (btnEditar) btnEditar.disabled = true;
    }
  });

  function filtrarServicios(texto) {
    const q = texto.toLowerCase();
    const filtrados = servicios.filter(s =>
      (s.nombre_cliente || '').toLowerCase().includes(q) ||
      (s.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (s.razon_social || '').toLowerCase().includes(q) ||
      (s.direccion || '').toLowerCase().includes(q) ||
      (s.numero_bano || '').toLowerCase().includes(q)
    );
    mostrarServicios(filtrados);
    if (filtrados.length === 0) {
    }
  }

  buscador?.addEventListener('input', () => filtrarServicios(buscador.value.trim()));
  btnBuscar?.addEventListener('click', () => filtrarServicios(buscador.value.trim()));

  cargarServicios();

  if (localStorage.getItem('pendiente_recarga')) {
    localStorage.removeItem('pendiente_recarga');
    cargarServicios();
  }
});
