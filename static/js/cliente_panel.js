async function cargarResumenCliente() {
  try {
    // Pedir todos los datos en paralelo
    const [alqRes, factRes, compRes, limpRes] = await Promise.all([
      fetchConAuth('/clientes/alquileres_api'),
      fetchConAuth('/clientes/facturas_pendientes_api'),
      fetchConAuth('/clientes/comprobantes_api'),
      fetchConAuth('/clientes/proxima_limpieza')
    ]);

    // Procesar respuestas
    const alquileres = alqRes ? await alqRes.json() : [];
    const facturas = factRes ? await factRes.json() : [];
    const comprobantes = compRes ? await compRes.json() : [];
    const limpieza = limpRes ? await limpRes.json() : { fecha_servicio: null };

    // Próxima limpieza (tarjeta verde)
    document.getElementById('card-proxima-limpieza').textContent =
      limpieza.fecha_servicio ? limpieza.fecha_servicio : '--/--/----';

    // Cantidad de baños alquilados (tarjeta azul)
    document.getElementById('card-banos-alquilados').textContent = alquileres.length;

    // Fecha última factura (tarjeta celeste)
    let fechaUltimaFactura = '--/--/----';
    if (facturas.length) {
      // Suponiendo que cada factura tiene campo "fecha"
      facturas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      fechaUltimaFactura = facturas[0].fecha || '--/--/----';
    }
    document.getElementById('card-ultima-factura').textContent = fechaUltimaFactura;

    // Último comprobante de pago
    mostrarUltimoComprobanteCliente(comprobantes);
  } catch (err) {
    // Si ocurre error, limpiar tarjetas
    document.getElementById('card-proxima-limpieza').textContent = '--/--/----';
    document.getElementById('card-banos-alquilados').textContent = '0';
    document.getElementById('card-ultima-factura').textContent = '--/--/----';
    document.getElementById('preview-comprobante').innerHTML = `<span class="text-muted">No hay comprobante registrado.</span>`;
    showMsg(null, 'Error cargando resumen');
  }
}

function mostrarUltimoComprobanteCliente(comprobantes) {
  const panel = document.getElementById('preview-comprobante');
  if (!panel) return;

  if (!comprobantes.length) {
    panel.innerHTML = `<span class="text-muted">No hay comprobante registrado.</span>`;
    return;
  }
  // Ordenar por fecha_envio descendente
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

// Llamar esta función al cargar el panel
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('card-proxima-limpieza')) {
    cargarResumenCliente();
  }
});
