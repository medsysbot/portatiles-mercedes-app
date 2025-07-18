// Archivo: static/js/clientes_facturas_pendientes.js
// Proyecto: Portátiles Mercedes

function handleUnauthorized() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
  localStorage.removeItem('nombre');
  window.location.href = '/login';
}

window.pmFacturasPendientesData = window.pmFacturasPendientesData || [];
let tablaFacturasPendientes = null;

function inicializarTablaFacturasPendientes() {
  if (tablaFacturasPendientes) return;
  tablaFacturasPendientes = $('#tablaFacturasPendientes').DataTable({
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
      { data: 'monto_adeudado', defaultContent: '-' },
      { data: 'factura_url', render: d => d ? `<a href="${d}" target="_blank">Ver</a>` : '', defaultContent: '' }
    ]
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('access_token')) {
    window.location.href = '/login';
    return;
  }

  const buscador = document.getElementById('busquedaFacturas');
  const btnBuscar = document.getElementById('btnBuscarFacturas');

  inicializarTablaFacturasPendientes();
  const tabla = tablaFacturasPendientes;

  async function cargarFacturas() {
    try {
      const resp = await fetch('/clientes/facturas_pendientes_api', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (resp.status === 401) return handleUnauthorized();
      window.pmFacturasPendientesData = await resp.json();
      mostrarFacturas(window.pmFacturasPendientesData);
    } catch (err) {
      console.error('Error cargando facturas:', err);
      if (window.pmFacturasPendientesData.length === 0) tabla.clear().draw();
    }
  }

  function mostrarFacturas(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
    const filtrados = window.pmFacturasPendientesData.filter(f =>
      (f.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (f.razon_social || '').toLowerCase().includes(q) ||
      (f.nombre_cliente || '').toLowerCase().includes(q) ||
      (f.numero_factura || '').toLowerCase().includes(q)
    );
    mostrarFacturas(filtrados);
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  if (window.pmFacturasPendientesData.length === 0) {
    cargarFacturas();
  } else {
    mostrarFacturas(window.pmFacturasPendientesData);
  }
});
