// Archivo: static/js/cliente_panel.js
// Proyecto: Portátiles Mercedes

// --------- Limpieza de credenciales ----------
function limpiarCredenciales() {
  localStorage.clear();
  window.location.href = '/login';
}

// --------- Fetch con autorización ----------
async function fetchConAuth(url, options = {}) {
  const token = localStorage.getItem('access_token');
  if (!token) limpiarCredenciales();
  const resp = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
  if (resp.status === 401) {
    limpiarCredenciales();
    throw new Error('Unauthorized');
  }
  return resp;
}

// --------- Inicialización DataTables ---------
let tablas = {};
function initTablas() {
  // Destruir instancias previas si existen
  ['tablaAlquileres', 'tablaFacturasPendientes', 'tablaVentasCliente', 'tablaServicios', 'tablaProgramacion', 'tablaComprobantes'].forEach(id => {
    if ($.fn.DataTable.isDataTable('#' + id)) {
      $('#' + id).DataTable().clear().destroy();
    }
  });

  const opciones = {
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    responsive: true
  };

  tablas = {
    alquileres: $('#tablaAlquileres').DataTable({ ...opciones, columns: [
      { data: 'numero_bano' }, { data: 'direccion' }, { data: 'fecha_inicio' }, { data: 'fecha_fin' }, { data: 'observaciones' }
    ]}),
    facturas: $('#tablaFacturasPendientes').DataTable({ ...opciones, columns: [
      { data: 'numero_factura' }, { data: 'fecha' }, { data: 'monto' }, { data: 'factura_url', render: d => d ? `<a href="${d}" target="_blank">VER FACTURA</a>` : '-' }
    ]}),
    ventas: $('#tablaVentasCliente').DataTable(opciones),
    limpiezas: $('#tablaServicios').DataTable(opciones),
    programacion: $('#tablaProgramacion').DataTable(opciones),
    comprobantes: $('#tablaComprobantes').DataTable({ 
      ...opciones,
      columns: [
        { data: 'nombre_cliente' },
        { data: 'dni_cuit_cuil' },
        { data: 'razon_social' },
        { data: 'numero_de_factura' },
        { data: 'comprobante_url', render: d => d ? `<a href="${d}" target="_blank">VER PAGO</a>` : '-' },
        { data: 'fecha_envio' }
      ]
    }),
  };
}

// --------- Render archivo (factura/comprobante) ---------
function renderArchivo(url) {
  if (!url) return '<span class="text-muted">No disponible</span>';
  if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return `<img src="${url}" alt="Archivo" style="max-width:100%; max-height:180px; border-radius:8px; box-shadow:0 2px 8px #0002;">`;
  }
  if (url.match(/\.pdf$/i)) {
    return `<embed src="${url}" type="application/pdf" width="100%" height="180px" style="border-radius:8px; box-shadow:0 2px 8px #0002;" />`;
  }
  return `<a href="${url}" target="_blank" class="btn btn-link">Ver archivo</a>`;
}

// --------- Resumen: Factura y Comprobante ---------
function mostrarUltimaFactura(facturas) {
  const panel = document.getElementById('preview-factura');
  if (!panel) return;
  if (!facturas.length) {
    panel.innerHTML = `<span class="text-muted">No hay factura registrada.</span>`;
    return;
  }
  facturas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const ultima = facturas[0];
  panel.innerHTML = `
    <p class="mb-1"><strong>Nro:</strong> ${ultima.numero_factura || '-'}</p>
    <p class="mb-1"><strong>Fecha:</strong> ${ultima.fecha || '-'}</p>
    ${renderArchivo(ultima.factura_url)}
  `;
}

function mostrarUltimoComprobanteCliente(comprobantes) {
  const panel = document.getElementById('preview-comprobante');
  if (!panel) return;
  if (!comprobantes.length) {
    panel.innerHTML = `<span class="text-muted">No hay comprobante registrado.</span>`;
    return;
  }
  comprobantes.sort((a, b) => new Date(b.fecha_envio) - new Date(a.fecha_envio));
  const ultimo = comprobantes[0];
  panel.innerHTML = `
    <p class="mb-1"><strong>Factura:</strong> ${ultimo.numero_de_factura || '-'}</p>
    <p class="mb-1"><strong>Fecha:</strong> ${ultimo.fecha_envio || '-'}</p>
    ${renderArchivo(ultimo.comprobante_url)}
  `;
}

// --------- Carga el resumen principal ---------
async function cargarResumenCliente() {
  try {
    const [alqRes, factRes, compRes, limpRes] = await Promise.all([
      fetchConAuth('/clientes/alquileres_api'),
      fetchConAuth('/clientes/facturas_pendientes_api'),
      fetchConAuth('/clientes/comprobantes_api'),
      fetchConAuth('/clientes/proxima_limpieza')
    ]);
    const alquileres = alqRes ? await alqRes.json() : [];
    const facturas = factRes ? await factRes.json() : [];
    const comprobantes = compRes ? await compRes.json() : [];
    const limpieza = limpRes ? await limpRes.json() : { fecha_servicio: null };

    document.getElementById('card-proxima-limpieza').textContent =
      limpieza.fecha_servicio ? limpieza.fecha_servicio : '--/--/----';
    document.getElementById('card-banos-alquilados').textContent = alquileres.length;

    let fechaUltimaFactura = '--/--/----';
    if (facturas.length) {
      facturas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      fechaUltimaFactura = facturas[0].fecha || '--/--/----';
    }
    document.getElementById('card-ultima-factura').textContent = fechaUltimaFactura;

    mostrarUltimaFactura(facturas);
    mostrarUltimoComprobanteCliente(comprobantes);
  } catch (err) {
    document.getElementById('card-proxima-limpieza').textContent = '--/--/----';
    document.getElementById('card-banos-alquilados').textContent = '0';
    document.getElementById('card-ultima-factura').textContent = '--/--/----';
    document.getElementById('preview-factura').innerHTML = `<span class="text-muted">No hay factura registrada.</span>`;
    document.getElementById('preview-comprobante').innerHTML = `<span class="text-muted">No hay comprobante registrado.</span>`;
    console.error('Error cargando resumen', err);
  }
}

// --------- DOMContentLoaded principal ---------
document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar tablas
  initTablas();

  // Cargar resumen tarjetas
  if (document.getElementById('card-proxima-limpieza')) {
    cargarResumenCliente();
  }

  // ... aquí seguirías con otros inicializadores y listeners, como logout ...
  document.getElementById('btnLogout')?.addEventListener('click', limpiarCredenciales);
});
