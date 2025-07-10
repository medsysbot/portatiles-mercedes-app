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
// Requiere que la plantilla cargue /static/js/alertas.js para usar showAlert
function showMsg(_, msg, tipo = "error-datos") {
  if (typeof showAlert === 'function') {
    showAlert(tipo, msg);
  }
}

function limpiarCredenciales() {
  localStorage.clear();
}

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
  if (document.getElementById('proxLimpieza')) cargarResumen();
});

// ------ ALQUILERES ------
async function actualizarAlquileres() {
  try {
    const res = await fetchConAuth(`/clientes/alquileres_api`);
    if (!res) return;
    const datos = await res.json();
    let html = "<table class='table table-striped'><thead><tr><th>#Baño</th><th>Dirección</th><th>Desde</th><th>Hasta</th><th>Obs.</th></tr></thead><tbody>";
    if (!datos.length) html += "<tr><td colspan='5' class='text-center'>Sin alquileres</td></tr>";
    datos.forEach(a => {
      html += `<tr>
        <td>${a.numero_bano||"-"}</td>
        <td>${a.direccion||"-"}</td>
        <td>${a.fecha_inicio||"-"}</td>
        <td>${a.fecha_fin||"-"}</td>
        <td>${a.observaciones||"-"}</td>
      </tr>`;
    });
    html += "</tbody></table>";
    document.getElementById("tablaAlquileres").innerHTML = html;
  } catch (e) {
    showMsg("tablaAlquileres", "Error al cargar alquileres");
  }
}

// ------ FACTURAS ------
async function actualizarFacturas() {
  try {
    const res = await fetchConAuth(`/clientes/facturas_pendientes_api`);
    if (!res) return;
    const datos = await res.json();
    let html = "<table class='table table-striped'><thead><tr><th>Fecha</th><th>Nro</th><th>Razón social</th><th>Monto</th></tr></thead><tbody>";
    if (!datos.length) html += "<tr><td colspan='4' class='text-center'>Sin facturas pendientes</td></tr>";
    datos.forEach(f => {
      html += `<tr>
        <td>${f.fecha||"-"}</td>
        <td>${f.numero_factura||"-"}</td>
        <td>${f.razon_social||"-"}</td>
        <td>${f.monto_adeudado||"-"}</td>
      </tr>`;
    });
    html += "</tbody></table>";
    document.getElementById("tablaFacturas").innerHTML = html;
  } catch (e) {
    showMsg("tablaFacturas", "Error al cargar facturas");
  }
}

// ------ COMPRAS ------
async function actualizarCompras() {
  try {
    const res = await fetchConAuth(`/clientes/compras_api`);
    if (!res) return;
    const datos = await res.json();
    let html = "<table class='table table-striped'><thead><tr><th>Fecha</th><th>Tipo Baño</th><th>Forma de pago</th><th>Observaciones</th></tr></thead><tbody>";
    if (!datos.length) html += "<tr><td colspan='4' class='text-center'>Sin compras</td></tr>";
    datos.forEach(v => {
      html += `<tr>
        <td>${v.fecha_operacion||"-"}</td>
        <td>${v.tipo_bano||"-"}</td>
        <td>${v.forma_pago||"-"}</td>
        <td>${v.observaciones||"-"}</td>
      </tr>`;
    });
    html += "</tbody></table>";
    document.getElementById("tablaCompras").innerHTML = html;
  } catch (e) {
    showMsg("tablaCompras", "Error al cargar compras");
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
    const comprobantes = await res.json();
    $('#tablaComprobantes').DataTable({
      data: comprobantes,
      destroy: true,
      columns: [
        { data: null, defaultContent: '', orderable: false },
        { data: 'nombre_cliente', defaultContent: '-' },
        { data: 'dni_cuit_cuil', defaultContent: '-' },
        { data: 'numero_factura', defaultContent: '-' },
        { data: 'comprobante_url', render: data => data ? `<a href="${data}" target="_blank">Ver</a>` : '-', defaultContent: '-' },
        { data: 'fecha_envio', defaultContent: '-' }
      ]
    });
  } catch (e) {
    showMsg("tablaComprobantes", "Error al cargar comprobantes");
  }
}

// ------ RESUMEN (CARDS, CALENDARIO Y ÚLTIMO COMPROBANTE) ------
async function cargarResumen() {
  try {
    const [alqRes, factRes, limpRes, compRes] = await Promise.all([
      fetchConAuth('/clientes/alquileres_api'),
      fetchConAuth('/clientes/facturas_pendientes_api'),
      fetchConAuth('/cliente/api/limpiezas_programadas'),
      fetchConAuth('/clientes/comprobantes_api')
    ]);

    const alquileres = alqRes ? await alqRes.json() : [];
    const facturas = factRes ? await factRes.json() : [];
    const limpiezas = limpRes ? await limpRes.json() : [];
    const comprobantes = compRes ? await compRes.json() : [];

    document.getElementById('cntBaños').textContent = alquileres.length;
    document.getElementById('cntFactPend').textContent = facturas.length;

    if (limpiezas.length) {
      limpiezas.sort((a, b) => new Date(a.fecha_limpieza) - new Date(b.fecha_limpieza));
      document.getElementById('proxLimpieza').textContent = limpiezas[0].fecha_limpieza || '-';
    }

    cargarCalendario(limpiezas);
    mostrarUltimoComprobante(comprobantes);
  } catch (err) {
    showMsg(null, 'Error cargando resumen');
  }
}

function cargarCalendario(eventos) {
  const calendarioEl = document.getElementById('calendario');
  if (!calendarioEl || !window.FullCalendar) return;

  const eventosCal = (eventos || []).map(ev => ({
    title: ev.numero_bano || '',
    start: ev.fecha_limpieza
  }));

  const calendario = new FullCalendar.Calendar(calendarioEl, {
    initialView: 'dayGridMonth',
    height: 'auto',
    headerToolbar: { start: '', center: 'title', end: 'today,dayGridMonth,timeGridWeek,listWeek' },
    locale: 'es',
    titleFormat: { year: 'numeric', month: 'long' },
    events: eventosCal
  });
  calendario.render();
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
