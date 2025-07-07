// Archivo: static/js/clientes_facturas_pendientes.js
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

  const buscador = document.getElementById('busquedaFacturas');
  const btnBuscar = document.getElementById('btnBuscarFacturas');
  const errorDiv = document.getElementById('errorFacturas');
  const mensajeDiv = document.getElementById('mensajeFacturas');

  let registros = [];

  const tabla = $('#tablaFacturasPendientes').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'fecha', defaultContent: '-' },
      { data: 'numero_factura', defaultContent: '-' },
      { data: 'dni_cuit_cuil', defaultContent: '-' },
      { data: 'razon_social', defaultContent: '-' },
      { data: 'nombre_cliente', defaultContent: '-' },
      { data: 'monto_adeudado', defaultContent: '-' }
    ]
  });

  async function cargarFacturas() {
    try {
      const resp = await fetch('/clientes/facturas_pendientes_api', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (resp.status === 401) return handleUnauthorized();
      registros = await resp.json();
      mostrarFacturas(registros);
      errorDiv.classList.add('d-none');
      mensajeDiv.style.display = registros.length ? 'none' : 'block';
      mensajeDiv.textContent = registros.length ? '' : 'Sin registros';
    } catch (err) {
      console.error('Error cargando facturas:', err);
      errorDiv.textContent = 'No se pudo cargar el listado.';
      errorDiv.classList.remove('d-none');
    }
  }

  function mostrarFacturas(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
    const filtrados = registros.filter(f =>
      (f.dni_cuit_cuil || '').toLowerCase().includes(q)
    );
    mostrarFacturas(filtrados);
    mensajeDiv.style.display = filtrados.length ? 'none' : 'block';
    mensajeDiv.textContent = filtrados.length ? '' : 'Sin registros';
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  cargarFacturas();
});
