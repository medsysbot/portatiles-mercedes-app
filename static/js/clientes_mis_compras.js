// Archivo: static/js/clientes_mis_compras.js
// Proyecto: Portátiles Mercedes

function handleUnauthorized() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
  localStorage.removeItem('nombre');
  window.location.href = '/login';
}

window.pmClientesComprasData = window.pmClientesComprasData || [];
let tablaVentasCliente = null;

function inicializarTablaVentasCliente() {
  if (tablaVentasCliente) return;
  tablaVentasCliente = $('#tablaVentasCliente').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'fecha_operacion', defaultContent: '-' },
      { data: 'tipo_bano', defaultContent: '-' },
      { data: 'dni_cuit_cuil', defaultContent: '-' },
      { data: 'nombre_cliente', defaultContent: '-' },
      { data: 'forma_pago', defaultContent: '-' },
      { data: 'observaciones', defaultContent: '-' }
    ]
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('access_token')) {
    window.location.href = '/login';
    return;
  }

  const buscador = document.getElementById('busquedaVentas');
  const btnBuscar = document.getElementById('btnBuscarVentas');
  const errorDiv = document.getElementById('errorVentas');

  inicializarTablaVentasCliente();
  const tabla = tablaVentasCliente;

  async function cargarVentas() {
    try {
      const resp = await fetch('/clientes/compras_api', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (resp.status === 401) return handleUnauthorized();
      window.pmClientesComprasData = await resp.json();
      mostrarVentas(window.pmClientesComprasData);
    } catch (err) {
      console.error('Error cargando compras:', err);
      if (window.pmClientesComprasData.length === 0) tabla.clear().draw();
    }
  }

  function mostrarVentas(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
    const filtrados = window.pmClientesComprasData.filter(v =>
      (v.dni_cuit_cuil || '').toLowerCase().includes(q)
    );
    mostrarVentas(filtrados);
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  cargarVentas();
});
