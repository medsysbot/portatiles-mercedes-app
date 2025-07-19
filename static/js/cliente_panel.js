// Archivo: cliente_panel.js
// Proyecto: Portátiles Mercedes

function limpiarCredenciales() {
  localStorage.clear();
  window.location.href = '/login';
}

async function fetchConAuth(url, options = {}) {
  const token = localStorage.getItem('access_token');
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

// Inicialización de tablas DataTables
let tablas = {};
function initTablas() {
  const opciones = {
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
  };

  tablas = {
    alquileres: $('#tablaAlquileres').DataTable(opciones),
    facturas: $('#tablaFacturasPendientes').DataTable(opciones),
    ventas: $('#tablaVentasCliente').DataTable(opciones),
    limpiezas: $('#tablaServicios').DataTable(opciones),
    programacion: $('#tablaProgramacion').DataTable(opciones),
    comprobantes: $('#tablaComprobantes').DataTable({
      ...opciones,
      columnDefs: [{ targets: 0, orderable: false }],
    }),
  };
}

// Función para cargar datos desde API y renderizar tablas
async function cargarDatos(url, tabla, errorId, mensajeVacio) {
  try {
    const resp = await fetchConAuth(url);
    if (!resp.ok) throw new Error('Error en petición');
    const datos = await resp.json();
    tabla.clear().rows.add(datos).draw();
    if (mensajeVacio && document.getElementById(mensajeVacio)) {
      document.getElementById(mensajeVacio).style.display = datos.length === 0 ? 'block' : 'none';
    }
  } catch (error) {
    console.error(`Error cargando ${url}`, error);
    if (errorId && document.getElementById(errorId)) {
      document.getElementById(errorId).style.display = 'block';
    }
  }
}

// Función para inicializar eventos de filtrado rápido
function initBusquedaRapida(inputId, btnId, tablaKey, datos) {
  document.getElementById(btnId).addEventListener('click', () => {
    const q = document.getElementById(inputId).value.toLowerCase();
    const filtrados = datos.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(q))
    );
    tablas[tablaKey].clear().rows.add(filtrados).draw();
  });
}

// ========================
// Tarjeta resumen de último comprobante de pago
function mostrarUltimoComprobante(comprobantes) {
  const panel = document.getElementById('preview-comprobante');
  if (!panel) return;

  if (!comprobantes.length) {
    panel.innerHTML = '<p class="text-center">Sin comprobantes</p>';
    return;
  }

  comprobantes.sort((a, b) => new Date(b.fecha_envio) - new Date(a.fecha_envio));
  const ultimo = comprobantes[0];

  let archivoHTML = '';
  if (ultimo.comprobante_url) {
    if (/\.(jpg|jpeg|png|gif)$/i.test(ultimo.comprobante_url)) {
      archivoHTML = `<img src="${ultimo.comprobante_url}" alt="Comprobante" class="img-fluid mt-2" style="max-height:150px; object-fit:contain; width:100%;"/>`;
    } else if (/\.pdf$/i.test(ultimo.comprobante_url)) {
      archivoHTML = `<embed src="${ultimo.comprobante_url}" type="application/pdf" width="100%" height="150px" style="border-radius:8px;">`;
    } else {
      archivoHTML = `<a href="${ultimo.comprobante_url}" target="_blank">Ver comprobante</a>`;
    }
  }

  panel.innerHTML = `
    <p class="mb-1"><strong>Factura:</strong> ${ultimo.numero_factura || '-'}</p>
    <p class="mb-1"><strong>Fecha:</strong> ${ultimo.fecha_envio || '-'}</p>
    ${archivoHTML}
  `;
}

// ========================

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('access_token');
  if (!token) limpiarCredenciales();

  initTablas();

  try {
    const ver = await fetch('/verificar_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!ver.ok) limpiarCredenciales();
    const info = await ver.json();
    if (info.rol !== 'cliente') limpiarCredenciales();

    const email = info.email;
    const datosCliRes = await fetch(`/info_datos_cliente?email=${email}`);
    const datosCli = datosCliRes.ok ? await datosCliRes.json() : {};
    const dni = datosCli.dni_cuit_cuil;

    // Cargar datos personales automáticamente
    Object.keys(datosCli).forEach(key => {
      if (document.getElementById(key)) {
        document.getElementById(key).value = datosCli[key];
      }
    });

    // Cargar datos para tablas
    cargarDatos(`/alquileres_cliente?dni_cuit_cuil=${dni}`, tablas.alquileres, 'errorAlquileres', 'mensajeAlquileres');
    cargarDatos(`/facturas_pendientes_cliente?dni=${dni}`, tablas.facturas, 'errorFacturas', 'mensajeFacturas');
    cargarDatos(`/ventas_cliente?dni_cuit_cuil=${dni}`, tablas.ventas, 'errorVentas', 'mensajeVentas');
    cargarDatos(`/limpiezas_cliente?dni_cuit_cuil=${dni}`, tablas.limpiezas, 'errorServicios', 'mensajeServicios');
    cargarDatos('/cliente/api/limpiezas_programadas', tablas.programacion, '', '');
    cargarDatos(`/api/comprobantes_pago?dni_cuit_cuil=${dni}`, tablas.comprobantes, 'msgComprobante', '');

    // Tarjeta resumen de último comprobante de pago
    try {
      const resp = await fetchConAuth(`/api/comprobantes_pago?dni_cuit_cuil=${dni}`);
      if (resp.ok) {
        const comprobantes = await resp.json();
        mostrarUltimoComprobante(comprobantes);
      } else {
        mostrarUltimoComprobante([]);
      }
    } catch (e) {
      mostrarUltimoComprobante([]);
    }

    // Inicialización búsqueda rápida (ejemplo para alquileres)
    let alquileresData = (await fetchConAuth(`/alquileres_cliente?dni_cuit_cuil=${dni}`)).json();
    initBusquedaRapida('busquedaAlquileres', 'btnBuscarAlquiler', 'alquileres', await alquileresData);

    // Formulario guardar datos personales
    document.getElementById('formDatos').addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const datos = Object.fromEntries(formData.entries());
      const resp = await fetchConAuth('/guardar_datos_cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const resultado = await resp.json();
      alert(resultado.mensaje || 'Datos actualizados correctamente.');
    });

  } catch (err) {
    console.error(err);
    limpiarCredenciales();
  }

  document.getElementById('btnLogout')?.addEventListener('click', limpiarCredenciales);
});
