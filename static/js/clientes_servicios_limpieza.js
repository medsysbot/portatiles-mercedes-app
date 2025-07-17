// Archivo: static/js/clientes_servicios_limpieza.js
// Proyecto: Portátiles Mercedes

function handleUnauthorized() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
  localStorage.removeItem('nombre');
  window.location.href = '/login';
}

window.pmServiciosLimpiezaData = window.pmServiciosLimpiezaData || [];
let tablaServicios = null;

function inicializarTablaServicios() {
  if (tablaServicios) return;
  tablaServicios = $('#tablaServicios').DataTable({
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
}

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('access_token')) {
    window.location.href = '/login';
    return;
  }

  const buscador = document.getElementById('busquedaServicios');
  const btnBuscar = document.getElementById('btnBuscarServicios');
  const errorDiv = document.getElementById('errorServicios');

  inicializarTablaServicios();
  const tabla = tablaServicios;

  async function cargarServicios() {
    try {
      const resp = await fetch('/clientes/servicios_limpieza_api', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (resp.status === 401) return handleUnauthorized();
      window.pmServiciosLimpiezaData = await resp.json();
      mostrarServicios(window.pmServiciosLimpiezaData);
    } catch (err) {
      console.error('Error cargando servicios:', err);
      if (window.pmServiciosLimpiezaData.length === 0) tabla.clear().draw();
    }
  }

  function mostrarServicios(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
    const filtrados = window.pmServiciosLimpiezaData.filter(s =>
      (s.numero_bano || '').toLowerCase().includes(q) ||
      (s.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (s.nombre_cliente || '').toLowerCase().includes(q) ||
      (s.razon_social || '').toLowerCase().includes(q)
    );
    mostrarServicios(filtrados);
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  cargarServicios();
});
