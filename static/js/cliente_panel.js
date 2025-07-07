// Archivo: static/js/cliente_panel.js

// ============= AUTENTICACIÓN Y TOKEN =============

// Obtiene token del storage y lo usa en cada fetch (igual empleados)
function getAuthToken() {
  return localStorage.getItem("access_token");
}

// Función helper para fetch con token
async function fetchConAuth(url, options = {}) {
  const token = getAuthToken();
  const headers = options.headers || {};
  headers["Authorization"] = "Bearer " + token;
  options.headers = headers;
  const resp = await fetch(url, options);
  if (resp.status === 401) {
    window.location.href = "/login";
    return;
  }
  return resp;
}

// ============= SIDEBAR Y TOPBAR =============
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar: navegación y toggle
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
  // Botón menú (hamburguesa) para mostrar/ocultar sidebar
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-collapse');
  });
  // Cerrar sesión
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  });

  // ============= VISUAL Y FONDO =============
  document.body.classList.add('bg-black');
  document.body.style.backgroundImage = "url('/static/imagenes/fondo-panel.png')";
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundAttachment = "fixed";

  // ============= INICIALIZAR CARDS Y ÚLTIMO COMPROBANTE =============
  actualizarCardsCliente();
  actualizarUltimoComprobante();

  // ============= CALENDARIO (igual empleados) =============
  inicializarCalendarioCliente();

  // ============= TABLAS: SCROLL INFINITO Y ESTILO (igual empleados) =============
  document.querySelectorAll('.tabla-scroll').forEach(tabla => {
    tabla.style.background = "#111";
    tabla.parentElement.style.overflowX = "auto";
    tabla.parentElement.style.overflowY = "auto";
    tabla.parentElement.style.maxHeight = "500px";
  });

  // CSS global seguro
  if (!document.querySelector('link[href*="style.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/static/css/style.css';
    document.head.appendChild(link);
  }
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

// ============= ÚLTIMO COMPROBANTE PAGADO =============
async function actualizarUltimoComprobante() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario_obj")) || {};
    const dni = usuario.dni_quit_quill || usuario.dni_cuit_cuil || "";
    const res = await fetchConAuth(`/cliente/api/dashboard?dni_cuit_cuil=${encodeURIComponent(dni)}&email=${encodeURIComponent(usuario.email)}`);
    if (!res) return;
    const data = await res.json();
    const comprobante = data.ultimo_comprobante;
    const el = document.getElementById("cardUltimoComprobante");
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
    const el = document.getElementById("cardUltimoComprobante");
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
