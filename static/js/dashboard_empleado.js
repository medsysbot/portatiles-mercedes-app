// Archivo: static/js/dashboard_empleado.js
// Panel resumen empleados – Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const headers = { Authorization: 'Bearer ' + localStorage.getItem('access_token') };

  function contarSemana(items) {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setHours(0,0,0,0);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 7);
    return items.filter(it => {
      const f = new Date(it.fecha_limpieza || it.fecha_servicio);
      return f >= inicio && f < fin;
    }).length;
  }

  async function cargarResumen() {
    try {
      const [progRes, servRes, repRes] = await Promise.all([
        fetch('/empleado/api/limpiezas_programadas', { headers }),
        fetch('/empleado/api/servicios_limpieza', { headers }),
        fetch('/empleado/api/reportes', { headers })
      ]);
      const prog = progRes.ok ? await progRes.json() : [];
      const serv = servRes.ok ? await servRes.json() : [];
      const rep = repRes.ok ? await repRes.json() : [];

      document.getElementById('cntLimpiezas').textContent = contarSemana(prog);
      document.getElementById('cntComprobantes').textContent = serv.length;
      document.getElementById('cntReportes').textContent = rep.length;
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    }
  }

  const calendarioEl = document.getElementById('calendario');
  if (calendarioEl && window.FullCalendar) {
    const calendar = new FullCalendar.Calendar(calendarioEl, {
      initialView: 'dayGridMonth',
      height: 'auto'
    });
    calendar.render();
  }

  cargarResumen();
});
