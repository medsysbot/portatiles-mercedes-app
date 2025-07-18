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

    mostrarUltimoComprobanteCliente(comprobantes);
  } catch (err) {
    document.getElementById('card-proxima-limpieza').textContent = '--/--/----';
    document.getElementById('card-banos-alquilados').textContent = '0';
    document.getElementById('card-ultima-factura').textContent = '--/--/----';
    document.getElementById('preview-comprobante').innerHTML = `<span class="text-muted">No hay comprobante registrado.</span>`;
    console.error('Error cargando resumen', err);
  }
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
    <div>
      <p class="mb-1"><strong>Factura:</strong> ${ultimo.numero_factura || '-'}</p>
      <p class="mb-1"><strong>Fecha:</strong> ${ultimo.fecha_envio || '-'}</p>
      ${
        ultimo.comprobante_url
          ? `<a href="${ultimo.comprobante_url}" target="_blank" class="btn btn-link">Ver comprobante</a>`
          : `<span class="text-muted">No hay comprobante disponible.</span>`
      }
    </div>
  `;
}

// Al cargar, llamar a cargarResumenCliente solo en el panel principal
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('card-proxima-limpieza')) {
    cargarResumenCliente();
  }
});
