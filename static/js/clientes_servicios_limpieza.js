// Archivo: static/js/clientes_servicios_limpieza.js
// Proyecto: Portátiles Mercedes

function handleUnauthorized() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
  localStorage.removeItem('nombre');
  window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('access_token')) {
    window.location.href = '/login';
    return;
  }

  const buscador = document.getElementById('busquedaServicios');
  const btnBuscar = document.getElementById('btnBuscarServicios');
  const errorDiv = document.getElementById('errorServicios');

  let registros = [];

  const tabla = $('#tablaServicios').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'fecha_servicio', defaultContent: '-' },
      { data: 'numero_bano', defaultContent: '-' },
      { data: 'dni_cuit_cuil', defaultContent: '-' },
      { data: 'nombre_cliente', defaultContent: '-' },
      { data: 'razon_social', defaultContent: '-' },
      { data: 'tipo_servicio', defaultContent: '-' },
      { data: 'estado', defaultContent: '-' },
      { data: 'remito_url', render: d => d ? `<a href="${d}" target="_blank">Ver</a>` : '-', defaultContent: '-' },
      { data: 'observaciones', defaultContent: '-' }
    ]
  });

  async function cargarServicios() {
    const inicio = Date.now();
    if (typeof showAlert === 'function') {
      showAlert('enviando-reporte', 'Cargando servicios...', false, 1600);
    }
    try {
      const resp = await fetch('/clientes/servicios_limpieza_api', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (resp.status === 401) return handleUnauthorized();
      registros = await resp.json();
      mostrarServicios(registros);
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Listado actualizado', false, 2600);
        }
      }, delay);
    } catch (err) {
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('error-datos', 'No se pudieron cargar los servicios', false, 2600);
        }
      }, delay);
      console.error('Error cargando servicios:', err);
    }
  }

  function mostrarServicios(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
    const filtrados = registros.filter(s =>
      (s.numero_bano || '').toLowerCase().includes(q) ||
      (s.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (s.nombre_cliente || '').toLowerCase().includes(q) ||
      (s.razon_social || '').toLowerCase().includes(q)
    );
    mostrarServicios(filtrados);
    if (filtrados.length === 0) {
    }
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  cargarServicios();
});
