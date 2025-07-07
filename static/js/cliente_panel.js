// Archivo: static/js/cliente_panel.js
// Lógica de cards, gráficos, calendario y navegación del panel de clientes

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar navigation (igual que empleados, links a cada módulo)
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

  // ========== Inicializar cards de resumen ==========
  actualizarCardsCliente();

  // ========== Inicializar gráficos ==========
  inicializarGraficosCliente();

  // ========== Inicializar calendario ==========
  inicializarCalendarioCliente();

  // ====== Asegura CSS global si algún módulo no lo trae ======
  if (!document.querySelector('link[href*="style.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/static/css/style.css';
    document.head.appendChild(link);
  }
});

// ------------- Función para actualizar los cards resumen ----------------
async function actualizarCardsCliente() {
  try {
    const usuario = window.usuario || JSON.parse(localStorage.getItem("usuario_obj")) || {};
    const dni = usuario.dni_quit_quill || usuario.dni_cuit_cuil || "";
    // Llamá al endpoint de dashboard de cliente (ajustá según tu backend si corresponde)
    const res = await fetch(`/cliente/api/dashboard?dni_cuit_cuil=${encodeURIComponent(dni)}&email=${encodeURIComponent(usuario.email)}`);
    if (!res.ok) throw new Error("Error al cargar el resumen del cliente");
    const data = await res.json();

    // Próxima limpieza
    document.getElementById("proxLimpieza").textContent =
      data.proxima_limpieza && data.proxima_limpieza.fecha_servicio
        ? data.proxima_limpieza.fecha_servicio
        : "-";

    // Baños alquilados
    document.getElementById("cntBaños").textContent = data.alquileres ?? "-";

    // Facturas pendientes
    document.getElementById("cntFactPend").textContent =
      data.facturas_pendientes && typeof data.facturas_pendientes.cantidad === "number"
        ? data.facturas_pendientes.cantidad
        : "-";

    // Cards extra (si tenés en empleados más cards, replicá igual para cliente aquí)
    // ...

  } catch (err) {
    document.getElementById("proxLimpieza").textContent = "-";
    document.getElementById("cntBaños").textContent = "-";
    document.getElementById("cntFactPend").textContent = "-";
  }
}

// ------------- Inicialización de gráficos del dashboard cliente -------------
function inicializarGraficosCliente() {
  // Si tenés gráficos tipo Chart.js, podés adaptarlo así (igual que empleados):
  if (typeof Chart !== "undefined") {
    // Ejemplo: gráfico de facturación mensual
    const ctx = document.getElementById("graficoFacturacionCliente");
    if (ctx) {
      fetch("/cliente/api/dashboard/facturacion?tipo=mensual")
        .then(r => r.json())
        .then(data => {
          new Chart(ctx, {
            type: "bar",
            data: {
              labels: data.labels,
              datasets: [{
                label: "Facturación mensual",
                data: data.valores,
                backgroundColor: "#26a69a"
              }]
            },
            options: {
              responsive: true,
              plugins: { legend: { display: false } }
            }
          });
        });
    }
    // Agregá más gráficos igual que empleados...
  }
}

// ------------- Inicialización de calendario cliente (FullCalendar) -------------
function inicializarCalendarioCliente() {
  if (typeof FullCalendar !== "undefined") {
    const calendarEl = document.getElementById('calendario');
    if (calendarEl) {
      fetch("/cliente/api/limpiezas_programadas")
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
