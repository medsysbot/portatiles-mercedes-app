// Archivo: static/js/facturas_pendientes.js
// Proyecto: Portátiles Mercedes

window.pmFacturasPendAdminData = window.pmFacturasPendAdminData || [];
let tablaFacturas = null;

function inicializarTablaFacturas() {
  if (tablaFacturas) return;
  tablaFacturas = $('#tablaFacturas').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'id_factura', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'id_factura' },
      { data: 'fecha' },
      { data: 'numero_factura' },
      { data: 'dni_cuit_cuil' },
      { data: 'razon_social' },
      { data: 'nombre_cliente' },
      { data: 'monto_adeudado' },
      { data: 'factura_url', render: d => d ? `<a href="${d}" target="_blank">Ver</a>` : '' }
    ]
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const btnNueva = document.getElementById('btnNuevaFactura');
  const buscador = document.getElementById('busquedaFacturas');
  const btnBuscar = document.getElementById('btnBuscarFacturas');
  const mensajeError = document.getElementById('errorFacturas');

  inicializarTablaFacturas();
  const tabla = tablaFacturas;

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const checks = document.querySelectorAll('#tablaFacturas tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = checks.length === 0;
  }

  $('#tablaFacturas tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaFacturas tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    try {
      const resp = await fetch('/admin/api/facturas_pendientes/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await obtenerDatos();
    } catch (err) {
      console.error('Error eliminando facturas:', err);
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function obtenerDatos() {
    try {
      const resp = await fetch('/admin/api/facturas_pendientes', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error consultando facturas');
      window.pmFacturasPendAdminData = await resp.json();
      mostrarDatos(window.pmFacturasPendAdminData);
      mensajeError?.classList.add('d-none');
    } catch (err) {
      console.error('Error cargando facturas:', err);
      if (!window.pmFacturasPendAdminData.length) tabla.clear().draw();
    }
  }

  function mostrarDatos(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  btnNueva?.addEventListener('click', () => {
    window.location.href = '/admin/facturas_pendientes/nueva';
  });

  buscador?.addEventListener('input', () => {
    filtrarFacturas(buscador.value.trim());
  });
  btnBuscar?.addEventListener('click', () => {
    filtrarFacturas(buscador.value.trim());
  });

  function filtrarFacturas(texto) {
    const q = texto.toLowerCase();
    const filtradas = window.pmFacturasPendAdminData.filter(f =>
      (f.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (f.razon_social || '').toLowerCase().includes(q) ||
      (f.nombre_cliente || '').toLowerCase().includes(q) ||
      (f.numero_factura || '').toLowerCase().includes(q)
    );
    mostrarDatos(filtradas);
    if (filtradas.length === 0) {
    } else {
    }
  }

  if (window.pmFacturasPendAdminData.length === 0) {
    obtenerDatos();
  } else {
    mostrarDatos(window.pmFacturasPendAdminData);
  }
});
