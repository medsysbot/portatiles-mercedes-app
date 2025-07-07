// static/js/cliente_panel.js
// Copia exacta de la lógica de empleados, adaptada solo textos y endpoints si hace falta

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
    window.location.href = "/login";
    return;
  }
  return resp;
}

// ============= LÓGICA PANEL =============
document.addEventListener('DOMContentLoaded', () => {
  // Barra lateral plegable (igual empleados)
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

  // Fondo: barra superior blanca, barra lateral gris, imagen solo en contenido principal
  document.querySelector('body').classList.add('layout-fixed');
  document.querySelector('.content-wrapper').style.backgroundImage = "url('/static/imagenes/fondo-panel.png')";
  document.querySelector('.content-wrapper').style.backgroundSize = "cover";
  document.querySelector('.content-wrapper').style.backgroundAttachment = "fixed";
  document.querySelector('.main-header').classList.add('bg-white');
  document.querySelector('.main-header').classList.remove('navbar-dark');
  document.querySelector('.main-header').classList.add('navbar-light');
  document.querySelector('.main-sidebar').style.backgroundColor = "#23272b";
  document.querySelector('.main-sidebar').style.minHeight = "100vh";
  document.querySelector('.sidebar').style.minHeight = "calc(100vh - 57px)";
  document.body.style.background = "#000";

  // Scroll infinito, igual empleados
  document.querySelectorAll('.tabla-scroll').forEach(tabla => {
    tabla.style.background = "#111";
    tabla.parentElement.style.overflowX = "auto";
    tabla.parentElement.style.overflowY = "auto";
    tabla.parentElement.style.maxHeight = "500px";
  });

  // Inicializar cards y calendario
  actualizarCardsCliente();
  actualizarUltimoComprobante();
  inicializarCalendarioCliente();
});

// ============= CARDS RESUMEN =============
async function actualizarCardsCliente() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario_obj")) || {};
    const dni = usuario.dni_quit_quill || usuario.dni_cuit_cuil || "";
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

// ============= ÚLTIMO COMPROBANTE AL LADO DEL CALENDARIO =============
async function actualizarUltimoComprobante() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario_obj")) || {};
    const dni = usuario.dni_quit_quill || usuario.dni_cuit_cuil || "";
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

// ============= CALENDARIO =============
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
