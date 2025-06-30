// Archivo: static/js/dashboard_empleado.js
// Proyecto: Portátiles Mercedes

function limpiarCredenciales() {
  localStorage.clear();
}

document.addEventListener('DOMContentLoaded', () => {
  const headers = { Authorization: 'Bearer ' + localStorage.getItem('access_token') };

  async function cargarResumen() {
    try {
      const [limpiezas, servicios, reportes] = await Promise.all([
        fetch('/empleado/api/limpiezas_programadas', { headers }),
        fetch('/empleado/api/servicios_limpieza', { headers }),
        fetch('/empleado/api/reportes', { headers })
      ]);

      const limpiezasData = limpiezas.ok ? await limpiezas.json() : [];
      const serviciosData = servicios.ok ? await servicios.json() : [];
      const reportesData = reportes.ok ? await reportes.json() : [];

      document.getElementById('cntLimpiezas').textContent = limpiezasData.length;
      document.getElementById('cntComprobantes').textContent = serviciosData.length;
      document.getElementById('cntReportes').textContent = reportesData.length;

    } catch (err) {
      console.error('Error cargando dashboard empleado:', err);
    }
  }

  const calendarioEl = document.getElementById('calendario');
  if (calendarioEl && window.FullCalendar) {
    const calendario = new FullCalendar.Calendar(calendarioEl, {
      initialView: 'dayGridMonth',
      height: 'auto',
      headerToolbar: {
        start: 'prev,next today',  // Flechas + Today en una línea
        center: '',                // Título va arriba solo
        end: 'dayGridMonth,timeGridWeek,listWeek' // Vistas
      },
      titleFormat: { year: 'numeric', month: 'long' }, // "junio 2025"
      buttonText: {
        today: 'Hoy',
        month: 'Mes',
        week: 'Semana',
        list: 'Lista'
      },
      locale: 'es'
    });
    calendario.render();
  }

  // Inicializar mapa en Villa Mercedes
  const map = L.map('map').setView([-33.6757, -65.4574], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
  L.marker([-33.6757, -65.4574]).addTo(map).bindPopup("Villa Mercedes");

  cargarResumen();

  const btnLogout = document.getElementById('btnLogout');
  btnLogout?.addEventListener('click', limpiarCredenciales);
});
