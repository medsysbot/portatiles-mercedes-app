// ============= AUTENTICACIÓN Y TOKEN =============
function getAuthToken() {
  return localStorage.getItem("access_token");
}
async function fetchConAuth(url, options = {}) {
  const token = getAuthToken();
  if (!token) {
    window.location.href = "/login";
    return;
  }
  options.headers = {
    ...(options.headers || {}),
    "Authorization": "Bearer " + token
  };
  const resp = await fetch(url, options);
  if (resp.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
    return;
  }
  return resp;
}

// Destruir credenciales al hacer logout
document.getElementById('btnLogout')?.addEventListener('click', () => {
    localStorage.clear();
});

// ============= RESUMEN PANEL CLIENTE =============
function renderArchivo(url, texto = 'VER ARCHIVO') {
  if (!url) return null;
  if (url.endsWith('.jpg') || url.endsWith('.png')) {
    return `
      <a href="${url}" target="_blank" style="display:block; color:#0bf; text-decoration:underline; margin-bottom:5px;">${texto}</a>
      <a href="${url}" target="_blank">
        <img src="${url}" alt="${texto}" style="max-width:150px; border:1px solid #ccc; border-radius:4px;">
      </a>
    `;
  } else {
    return `<a href="${url}" target="_blank" style="color:#0bf; text-decoration:underline;">${texto}</a>`;
  }
}

function mostrarUltimaFactura(facturas) {
  const panel = document.getElementById('preview-factura');
  if (!panel) return;
  if (!facturas.length) {
    panel.innerHTML = `<span class="text-muted">No hay factura registrada.</span>`;
    return;
  }
  facturas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const ultimo = facturas[0];
  const archivoHTML = renderArchivo(ultimo.factura_url, 'VER FACTURA');
  panel.innerHTML = `
    <p class="mb-1"><strong>Factura:</strong> ${ultimo.numero_factura || '-'}</p>
    <p class="mb-1"><strong>Fecha:</strong> ${ultimo.fecha || '-'}</p>
    <p class="mb-1"><strong>DNI/CUIT/CUIL:</strong> ${ultimo.dni_cuit_cuil || '-'}</p>
    ${archivoHTML || '<span class="text-muted">No disponible</span>'}
  `;
}

function mostrarUltimoComprobanteCliente(comprobantes) {
  const panel = document.getElementById('preview-comprobante');
  if (!comprobantes || comprobantes.length === 0) {
    panel.innerHTML = '<span class="text-muted">No hay comprobante registrado.</span>';
    return;
  }

  const ultimo = comprobantes[0];

  const archivoHTML = renderArchivo(ultimo.comprobante_url, 'VER COMPROBANTE');

  panel.innerHTML = `
    <p class="mb-1"><strong>Factura:</strong> ${ultimo.numero_factura || '-'}</p>
    <p class="mb-1"><strong>Fecha:</strong> ${ultimo.fecha_envio || '-'}</p>
    <p class="mb-1"><strong>DNI/CUIT/CUIL:</strong> ${ultimo.dni_cuit_cuil || '-'}</p>
    ${archivoHTML || '<span class="text-muted">No disponible</span>'}
  `;
}

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

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('card-proxima-limpieza')) {
    cargarResumenCliente();
  }
});
