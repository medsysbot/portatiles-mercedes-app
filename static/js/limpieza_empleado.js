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
      { data: 'razon_social' },
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
  const btnEditar = document.getElementById('btnEditarSeleccionado');
  let servicios = [];

  async function cargarServicios() {
    const inicio = Date.now();
    try {
      const resp = await fetch('/empleado/api/servicios_limpieza', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar servicios');
      servicios = await resp.json();
      mostrarServicios(servicios);
      if (servicios.length === 0) {
      }
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
      }, delay);
    } catch (err) {
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
      }, delay);
      console.error('Error cargando servicios:', err);
    }
  }

  function mostrarServicios(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function actualizarBotones() {
    const checks = document.querySelectorAll('#tablaServicios tbody .fila-check:checked');
    const activo = checks.length === 1;
    if (btnEditar) btnEditar.disabled = !activo;
  }

  $('#tablaServicios tbody').on('change', '.fila-check', actualizarBotones);

  btnEditar?.addEventListener('click', () => {
    const checks = document.querySelectorAll('#tablaServicios tbody .fila-check:checked');
    const id = checks[0].dataset.id;
    localStorage.setItem('pendiente_recarga', '1');
    window.location.href = `/empleado/limpieza/editar/${id}`;
  });

  function filtrarServicios(texto) {
    const q = texto.toLowerCase();
    const filtrados = servicios.filter(s =>
      (s.nombre_cliente || '').toLowerCase().includes(q) ||
      (s.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (s.razon_social || '').toLowerCase().includes(q) ||
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
