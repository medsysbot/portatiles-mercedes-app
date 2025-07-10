// Archivo: static/js/dashboard_empleado.js
// Proyecto: Portátiles Mercedes

function limpiarCredenciales() {
  localStorage.clear();
}

document.addEventListener('DOMContentLoaded', () => {
  const headers = { Authorization: 'Bearer ' + localStorage.getItem('access_token') };

  async function cargarResumen() {
    try {
      const [servicios, reportes] = await Promise.all([
        fetch('/empleado/api/servicios_limpieza', { headers }),
        fetch('/empleado/api/reportes', { headers })
      ]);

      const serviciosData = servicios.ok ? await servicios.json() : [];
      const reportesData = reportes.ok ? await reportes.json() : [];

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
      start: '',                                 // Sin flechas
      center: 'title',                          // Título del mes y año al centro
      end: 'today,dayGridMonth,timeGridWeek,listWeek' // Botones a la derecha
    },
    locale: 'es',
    titleFormat: { year: 'numeric', month: 'long' } // 🔥 Quita el "D" y deja "Junio 2025"
  });
  calendario.render();
}

  cargarResumen();

  const btnLogout = document.getElementById('btnLogout');
  btnLogout?.addEventListener('click', limpiarCredenciales);
});
