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
        left: 'prev,next today', // Flechas y Today a la izquierda
        center: 'title',         // Título al centro
        right: 'dayGridMonth,timeGridWeek,listWeek' // Vistas a la derecha
      },
      locale: 'es'
    });
    calendario.render();
  }

  cargarResumen();

  const btnLogout = document.getElementById('btnLogout');
  btnLogout?.addEventListener('click', limpiarCredenciales);
});
