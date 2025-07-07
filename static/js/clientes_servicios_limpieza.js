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
  const mensajeDiv = document.getElementById('mensajeServicios');

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
      { data: 'tipo_servicio', defaultContent: '-' },
      { data: 'estado', defaultContent: '-' },
      { data: 'remito_url', render: d => d ? `<a href="${d}" target="_blank">Ver</a>` : '-', defaultContent: '-' },
      { data: 'observaciones', defaultContent: '-' }
    ]
  });

  async function cargarServicios() {
    try {
      const resp = await fetch('/clientes/servicios_limpieza_api', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (resp.status === 401) return handleUnauthorized();
      registros = await resp.json();
      mostrarServicios(registros);
      errorDiv.classList.add('d-none');
      mensajeDiv.style.display = registros.length ? 'none' : 'block';
      mensajeDiv.textContent = registros.length ? '' : 'Sin registros';
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

  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
    const filtrados = registros.filter(s =>
      (s.numero_bano || '').toLowerCase().includes(q) ||
      (s.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (s.nombre_cliente || '').toLowerCase().includes(q)
    );
    mostrarServicios(filtrados);
    mensajeDiv.style.display = filtrados.length ? 'none' : 'block';
    mensajeDiv.textContent = filtrados.length ? '' : 'Sin registros';
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  cargarServicios();
});
