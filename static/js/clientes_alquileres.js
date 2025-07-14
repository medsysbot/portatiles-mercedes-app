// Archivo: static/js/clientes_alquileres.js
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

  const buscador = document.getElementById('busquedaAlquileres');
  const btnBuscar = document.getElementById('btnBuscarAlquiler');
  const errorDiv = document.getElementById('errorAlquileres');

  let registros = [];

  const tabla = $('#tablaAlquileres').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'numero_bano', defaultContent: '-' },
      { data: 'cliente_nombre', defaultContent: '-' },
      { data: 'dni_cuit_cuil', defaultContent: '-' },
      { data: 'direccion', defaultContent: '-' },
      { data: 'fecha_inicio', defaultContent: '-' },
      { data: 'fecha_fin', defaultContent: '-' },
      { data: 'observaciones', defaultContent: '-' }
    ]
  });

  async function cargarAlquileres() {
    const inicio = startDataLoad();
    await dataLoadDelay();
    try {
      const resp = await fetch('/clientes/alquileres_api', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (resp.status === 401) return handleUnauthorized();
      registros = await resp.json();
      mostrarAlquileres(registros);
      if (registros.length === 0) {
      }
      endDataLoad(inicio, true);
    } catch (err) {
      endDataLoad(inicio, false);
      console.error('Error cargando alquileres:', err);
    }
  }

  function mostrarAlquileres(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
    const filtrados = registros.filter(a =>
      (a.cliente_nombre || '').toLowerCase().includes(q) ||
      (a.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (String(a.numero_bano || '')).toLowerCase().includes(q)
    );
    mostrarAlquileres(filtrados);
    if (filtrados.length === 0) {
    }
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  cargarAlquileres();
});
