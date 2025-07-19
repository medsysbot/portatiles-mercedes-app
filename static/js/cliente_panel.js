// ============= AUTENTICACIÓN Y TOKEN (sólo token, igual empleados) =============
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
function showMsg(_, msg, tipo = "error-datos") {
}

function limpiarCredenciales() {
  localStorage.clear();
}

// ======== Tablas persistentes ========
let tablaAlquileres = null;
let datosAlquileres = [];
let tablaFacturas = null;
let datosFacturas = [];
let tablaCompras = null;
let datosCompras = [];
let tablaComprobantes = null;
let datosComprobantes = [];

// ============= DETECTAR SECCIÓN Y CARGAR DATOS =============
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('layout-fixed');
  if (document.querySelector('.content-wrapper')) {
    document.querySelector('.content-wrapper').style.backgroundImage = "url('/static/imagenes/fondo-panel.png')";
    document.querySelector('.content-wrapper').style.backgroundSize = "cover";
    document.querySelector('.content-wrapper').style.backgroundAttachment = "fixed";
  }
  if (document.querySelector('.main-header')) {
    document.querySelector('.main-header').classList.add('bg-white');
    document.querySelector('.main-header').classList.remove('navbar-dark');
    document.querySelector('.main-header').classList.add('navbar-light');
  }
  if (document.querySelector('.main-sidebar')) {
    document.querySelector('.main-sidebar').style.backgroundColor = "#23272b";
    document.querySelector('.main-sidebar').style.minHeight = "100vh";
  }
  if (document.querySelector('.sidebar')) {
    document.querySelector('.sidebar').style.minHeight = "calc(100vh - 57px)";
  }
  document.body.style.background = "#000";

  // Menú lateral: la lógica de AdminLTE ya maneja el pushmenu,
  // por lo que no necesitamos código adicional aquí.

  document.querySelectorAll('.nav-sidebar .nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('/clientes/')) {
        e.preventDefault();
        window.location.href = href;
      }
      if (href && href === '/cliente/panel') {
        e.preventDefault();
        window.location.href = href;
      }
    });
  });

document.getElementById('btnLogout')?.addEventListener('click', limpiarCredenciales);

  if (document.getElementById('tablaAlquileres')) actualizarAlquileres();
  if (document.getElementById('tablaFacturas')) actualizarFacturas();
  if (document.getElementById('tablaCompras')) actualizarCompras();
  if (document.getElementById('tablaLimpieza')) actualizarLimpiezas();
  if (document.getElementById('tablaComprobantes')) actualizarComprobantes();
  if (document.getElementById('cntBaños')) cargarResumen();
});

// ------ ALQUILERES ------
async function actualizarAlquileres() {
  try {
    const res = await fetchConAuth(`/clientes/alquileres_api`);
    if (!res) return;
    datosAlquileres = await res.json();

    if ($.fn.DataTable.isDataTable('#tablaAlquileres')) {
      $('#tablaAlquileres').DataTable().destroy();
    }
    $('#tablaAlquileres').DataTable({
      language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
      paging: true,
      searching: true,
      ordering: true,
      columns: [
        { data: 'numero_bano', defaultContent: '-' },
        { data: 'direccion', defaultContent: '-' },
        { data: 'fecha_inicio', defaultContent: '-' },
        { data: 'fecha_fin', defaultContent: '-' },
        { data: 'observaciones', defaultContent: '-' }
      ]
    });
    tablaAlquileres = $('#tablaAlquileres').DataTable();
    tablaAlquileres.clear().rows.add(datosAlquileres).draw();
  } catch (e) {
    showMsg('tablaAlquileres', 'Error al cargar alquileres');
  }
}

// ------ FACTURAS ------
async function actualizarFacturas() {
  try {
    const res = await fetchConAuth(`/clientes/facturas_pendientes_api`);
    if (!res) return;
    datosFacturas = await res.json();

    if (!tablaFacturas) {
      tablaFacturas = $('#tablaFacturas').DataTable({
        language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        paging: true,
        searching: false,
        ordering: true,
        columns: [
          { data: 'fecha', defaultContent: '-' },
          { data: 'numero_factura', defaultContent: '-' },
          { data: 'razon_social', defaultContent: '-' },
          { data: 'monto_adeudado', defaultContent: '-' }
        ]
      });
    }

    tablaFacturas.clear().rows.add(datosFacturas).draw();
  } catch (e) {
    showMsg('tablaFacturas', 'Error al cargar facturas');
  }
}

// ------ COMPRAS ------
async function actualizarCompras() {
  try {
    const res = await fetchConAuth(`/clientes/compras_api`);
    if (!res) return;
    datosCompras = await res.json();

    if (!tablaCompras) {
      tablaCompras = $('#tablaCompras').DataTable({
        language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        paging: true,
        searching: false,
        ordering: true,
        columns: [
          { data: 'fecha_operacion', defaultContent: '-' },
          { data: 'tipo_bano', defaultContent: '-' },
          { data: 'forma_pago', defaultContent: '-' },
          { data: 'observaciones', defaultContent: '-' }
        ]
      });
    }

    tablaCompras.clear().rows.add(datosCompras).draw();
  } catch (e) {
    showMsg('tablaCompras', 'Error al cargar compras');
  }
}

// ------ LIMPIEZAS ------
async function actualizarLimpiezas() {
  try {
    const res = await fetchConAuth(`/clientes/servicios_limpieza_api`);
    if (!res) return;
    const datos = await res.json();
    let html = "<table class='table table-striped'><thead><tr><th>Fecha</th><th>#Baño</th><th>Tipo</th><th>Remito</th></tr></thead><tbody>";
    if (!datos.length) html += "<tr><td colspan='4' class='text-center'>Sin servicios</td></tr>";
    datos.forEach(l => {
      html += `<tr>
        <td>${l.fecha_servicio||"-"}</td>
        <td>${l.numero_bano||"-"}</td>
        <td>${l.tipo_servicio||"-"}</td>
        <td>${l.remito_url ? `<a href="${l.remito_url}" target="_blank">Ver</a>` : "-"}</td>
      </tr>`;
    });
    html += "</tbody></table>";
    document.getElementById("tablaLimpieza").innerHTML = html;
  } catch (e) {
    showMsg("tablaLimpieza", "Error al cargar servicios");
  }
}

// ------ COMPROBANTES ------
async function actualizarComprobantes() {
  try {
    const res = await fetchConAuth(`/clientes/comprobantes_api`);
    if (!res) return;
    datosComprobantes = await res.json();

    if (!tablaComprobantes) {
      tablaComprobantes = $('#tablaComprobantes').DataTable({
        language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        paging: true,
        searching: false,
        ordering: true,
        columns: [
          { data: null, defaultContent: '', orderable: false },
          { data: 'nombre_cliente', defaultContent: '-' },
          { data: 'dni_cuit_cuil', defaultContent: '-' },
          { data: 'numero_factura', defaultContent: '-' },
          { data: 'comprobante_url', render: data => data ? `<a href="${data}" target="_blank">Ver</a>` : '-', defaultContent: '-' },
          { data: 'fecha_envio', defaultContent: '-' }
        ]
      });
    }

    tablaComprobantes.clear().rows.add(datosComprobantes).draw();
  } catch (e) {
    showMsg('tablaComprobantes', 'Error al cargar comprobantes');
  }
}

// ------ RESUMEN (CARDS, CALENDARIO Y ÚLTIMO COMPROBANTE) ------
async function cargarResumen() {
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

    document.getElementById('cntBaños').textContent = alquileres.length;
    document.getElementById('cntFactPend').textContent = facturas.length;
    const lblLimpieza = document.getElementById('fechaLimpieza');
    if (lblLimpieza) lblLimpieza.textContent = limpieza.fecha_servicio || '-';

    mostrarUltimoComprobante(comprobantes);
  } catch (err) {
    showMsg(null, 'Error cargando resumen');
  }
}


function mostrarUltimoComprobante(comprobantes) {
  const panel = document.getElementById('panelUltimoComprobante');
  if (!panel) return;

  if (!comprobantes.length) {
    panel.innerHTML = '<p class="text-center">Sin comprobantes</p>';
    return;
  }

  comprobantes.sort((a, b) => new Date(b.fecha_envio) - new Date(a.fecha_envio));
  const ultimo = comprobantes[0];
  panel.innerHTML = `
    <p class="mb-1"><strong>Factura:</strong> ${ultimo.numero_factura || '-'}</p>
    <p class="mb-1"><strong>Fecha:</strong> ${ultimo.fecha_envio || '-'}</p>
    ${ultimo.comprobante_url ? `<img src="${ultimo.comprobante_url}" alt="Comprobante" class="img-fluid mt-2" style="max-height:150px; object-fit:contain; width:100%;"/>` : ''}
  `;
}
