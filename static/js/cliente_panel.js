function getAuthToken() {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (!token || token.length < 10) {
    console.warn("Token ausente o inválido:", token);
    window.location.href = "/login";
    return null;
  }
  return token;
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

document.getElementById('btnLogout')?.addEventListener('click', () => {
  localStorage.clear();
});

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

function mostrarUltimaFactura(facturas) {
  const panel = document.getElementById('preview-factura');
  if (!panel) return;
  if (!facturas.length) {
    panel.innerHTML = `<span class="text-muted">No hay factura registrada.</span>`;
    return;
  }
  facturas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const ultima = facturas[0];
  const archivoHTML = renderArchivo(ultima.factura_url);
  panel.innerHTML = `
    <p class="mb-1"><strong>Nro:</strong> ${ultima.numero_factura || '-'}</p>
    <p class="mb-1"><strong>Fecha:</strong> ${ultima.fecha || '-'}</p>
    ${archivoHTML || '<span class="text-muted">No disponible</span>'}
  `;
}

function mostrarUltimoComprobanteCliente(comprobantes) {
  const panel = document.getElementById('preview-comprobante');
  if (!panel) return;

  if (!comprobantes || !comprobantes.length) {
    panel.innerHTML = `<span class="text-muted">No hay comprobante registrado.</span>`;
    return;
  }

  comprobantes.sort((a, b) => new Date(b.fecha_envio) - new Date(a.fecha_envio));
  const ultimo = comprobantes[0];
  const archivoHTML = renderArchivo(ultimo.comprobante_url);

  panel.innerHTML = `
    <p class="mb-1"><strong>Factura:</strong> ${ultimo.numero_de_factura || '-'}</p>
    <p class="mb-1"><strong>Fecha:</strong> ${ultimo.fecha_envio || '-'}</p>
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
