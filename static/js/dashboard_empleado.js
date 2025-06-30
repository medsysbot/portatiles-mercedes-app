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

      document.getElementById('cntLimpiezas').textContent = serviciosData.length;  // Servicios esta semana
      document.getElementById('cntComprobantes').textContent = serviciosData.length; // Servicios registrados
      document.getElementById('cntReportes').textContent = reportesData.length; // Reportes enviados

    } catch (err) {
      console.error('Error cargando dashboard empleado:', err);
    }
  }

  const calendario = new FullCalendar.Calendar(calendarioEl, {
  initialView: 'dayGridMonth',
  height: 'auto',
  headerToolbar: {
    left: 'prev,next today',      // Flechas y Today a la izquierda
    center: 'title',              // Título (junio de 2025) al centro
    right: 'dayGridMonth,timeGridWeek,listWeek'  // Vistas a la derecha
  },
  locale: 'es'
});
    calendario.render();
  }

  cargarResumen();

  const btnLogout = document.getElementById('btnLogout');
  btnLogout?.addEventListener('click', limpiarCredenciales);
});
