// ============= AUTENTICACIÓN Y TOKEN =============
function getAuthToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("token");
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
    window.location.href = "/login";
    return;
  }
  return resp;
}

// ============= UTILIDADES =============
function getUsuario() {
  // Debe guardarse correctamente al loguear: dni_cuit_cuil y email
  try {
    return JSON.parse(localStorage.getItem("usuario_obj")) || {};
  } catch (e) {
    return {};
  }
}
function showMsg(divId, msg, type="danger") {
  const el = document.getElementById(divId);
  if (el) el.innerHTML = `<div class="alert alert-${type} text-center mb-0">${msg}</div>`;
}

// ============= DETECTAR SECCIÓN Y CARGAR DATOS =============
document.addEventListener('DOMContentLoaded', () => {
  // Barra lateral, fondo, estilos globales
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

  // Menú lateral
  document.querySelector('[data-widget="pushmenu"]')?.addEventListener('click', function (e) {
    e.preventDefault();
    document.body.classList.toggle('sidebar-collapse');
  });

  // Sidebar navigation
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

  // Cerrar sesión
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login';
  });

  // Detectar sección por ID o por URL
  if (document.getElementById('tablaAlquileres')) actualizarAlquileres();
  if (document.getElementById('tablaFacturas')) actualizarFacturas();
  if (document.getElementById('tablaCompras')) actualizarCompras();
  if (document.getElementById('tablaLimpieza')) actualizarLimpiezas();
  if (document.getElementById('tablaEmails')) actualizarEmails();
  // Panel resumen
  if (document.getElementById('proxLimpieza')) actualizarCardsCliente();
  if (document.getElementById('panelUltimoComprobante')) actualizarUltimoComprobante();
  if (document.getElementById('calendario')) inicializarCalendarioCliente();
});

// ============= FUNCIONES DE CARGA POR SECCIÓN =============

// ------ ALQUILERES ------
async function actualizarAlquileres() {
  const usuario = getUsuario();
  const dni = usuario.dni_cuit_cuil || "";
  if (!dni) return showMsg("tablaAlquileres", "No hay datos de usuario");
  try {
    const res = await fetchConAuth(`/alquileres_cliente?dni_cuit_cuil=${encodeURIComponent(dni)}`);
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
  const usuario = getUsuario();
  const dni = usuario.dni_cuit_cuil || "";
  if (!dni) return showMsg("tablaFacturas", "No hay datos de usuario");
  try {
    const res = await fetchConAuth(`/facturas_pendientes_cliente?dni=${encodeURIComponent(dni)}`);
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
  const usuario = getUsuario();
  const dni = usuario.dni_cuit_cuil || "";
  if (!dni) return showMsg("tablaCompras", "No hay datos de usuario");
  try {
    const res = await fetchConAuth(`/ventas_cliente?dni_cuit_cuil=${encodeURIComponent(dni)}`);
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
  const usuario = getUsuario();
  const dni = usuario.dni_cuit_cuil || "";
  if (!dni) return showMsg("tablaLimpieza", "No hay datos de usuario");
  try {
    const res = await fetchConAuth(`/limpiezas_cliente?dni_cuit_cuil=${encodeURIComponent(dni)}`);
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

// ------ EMAILS ------
async function actualizarEmails() {
  const usuario = getUsuario();
  if (!usuario.email) return showMsg("tablaEmails", "No hay email de usuario");
  try {
    const res = await fetchConAuth(`/emails_cliente?email=${encodeURIComponent(usuario.email)}`);
    if (!res) return;
    const datos = await res.json();
    let html = "<table class='table table-striped'><thead><tr><th>Fecha</th><th>Asunto</th><th>Estado</th></tr></thead><tbody>";
    if (!datos.length) html += "<tr><td colspan='3' class='text-center'>Sin emails</td></tr>";
    datos.forEach(em => {
      html += `<tr>
        <td>${em.fecha||"-"}</td>
        <td>${em.asunto||"-"}</td>
        <td>${em.estado||"-"}</td>
      </tr>`;
    });
    html += "</tbody></table>";
    document.getElementById("tablaEmails").innerHTML = html;
  } catch (e) {
    showMsg("tablaEmails", "Error al cargar emails");
  }
}

// ------ PANEL RESUMEN ------
async function actualizarCardsCliente() {
  try {
    const usuario = getUsuario();
    const dni = usuario.dni_cuit_cuil || "";
    const res = await fetchConAuth(`/cliente/api/dashboard?dni_cuit_cuil=${encodeURIComponent(dni)}&email=${encodeURIComponent(usuario.email)}`);
    if (!res) return;
    const data = await res.json();
    document.getElementById("proxLimpieza").textContent =
      data.proxima_limpieza && data.proxima_limpieza.fecha_servicio
        ? data.proxima_limpieza.fecha_servicio
        : "-";
    document.getElementById("cntBaños").textContent = data.alquileres ?? "-";
    document.getElementById("cntFactPend").textContent =
      data.facturas_pendientes && typeof data.facturas_pendientes.cantidad === "number"
        ? data.facturas_pendientes.cantidad
        : "-";
  } catch (err) {
    document.getElementById("proxLimpieza").textContent = "-";
    document.getElementById("cntBaños").textContent = "-";
    document.getElementById("cntFactPend").textContent = "-";
  }
}

async function actualizarUltimoComprobante() {
  try {
    const usuario = getUsuario();
    const dni = usuario.dni_cuit_cuil || "";
    const res = await fetchConAuth(`/cliente/api/dashboard?dni_cuit_cuil=${encodeURIComponent(dni)}&email=${encodeURIComponent(usuario.email)}`);
    if (!res) return;
    const data = await res.json();
    const comprobante = data.ultimo_comprobante;
    const el = document.getElementById("panelUltimoComprobante");
    if (!el) return;
    if (!comprobante) {
      el.innerHTML = `<div class="alert alert-secondary text-center mb-0">No hay comprobantes registrados</div>`;
    } else {
      el.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center p-2">
          <div><strong>Fecha:</strong> ${comprobante.fecha_envio || "-"}</div>
          <div><strong>URL:</strong> <a href="${comprobante.comprobante_url}" target="_blank">${comprobante.comprobante_url}</a></div>
        </div>
      `;
    }
  } catch (e) {
    const el = document.getElementById("panelUltimoComprobante");
    if (el) el.innerHTML = `<div class="alert alert-danger mb-0">Error al cargar comprobante</div>`;
  }
}

// ------ CALENDARIO ------
function inicializarCalendarioCliente() {
  if (typeof FullCalendar !== "undefined") {
    const calendarEl = document.getElementById('calendario');
    if (calendarEl) {
      fetchConAuth("/cliente/api/limpiezas_programadas")
        .then(resp => resp.json())
        .then(events => {
          const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            events: events,
            height: 400
          });
          calendar.render();
        });
    }
  }
}
