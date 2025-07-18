// ==================== PANEL EMPLEADO PORTÁTILES MERCEDES ====================

// ==== AUTENTICACIÓN Y TOKEN ====
function getAuthToken() {
  return localStorage.getItem("access_token");
}

function limpiarCredenciales() {
  localStorage.clear();
}

// Wrapper seguro para fetch con token y control de sesión
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
    limpiarCredenciales();
    window.location.href = "/login";
    return;
  }
  return resp;
}

// =========== RESUMEN TARJETAS Y DASHBOARD ===========
async function cargarResumenEmpleado() {
  try {
    const [servRes, repRes] = await Promise.all([
      fetchConAuth('/empleado/api/servicios_limpieza'),
      fetchConAuth('/empleado/api/reportes')
    ]);
    const servicios = servRes ? await servRes.json() : [];
    const reportes = repRes ? await repRes.json() : [];
    document.getElementById('cntComprobantes').textContent = servicios.length;
    document.getElementById('cntReportes').textContent = reportes.length;
  } catch (e) {
    document.getElementById('cntComprobantes').textContent = '0';
    document.getElementById('cntReportes').textContent = '0';
    console.error('Error cargando dashboard empleado:', e);
  }
}

// =========== CALENDARIO FULLCALENDAR ===========
function inicializarCalendario() {
  const calendarioEl = document.getElementById('calendario');
  if (calendarioEl && window.FullCalendar) {
    const calendario = new FullCalendar.Calendar(calendarioEl, {
      initialView: 'dayGridMonth',
      height: 'auto',
      headerToolbar: {
        start: '',
        center: 'title',
        end: 'today,dayGridMonth,timeGridWeek,listWeek'
      },
      locale: 'es',
      titleFormat: { year: 'numeric', month: 'long' }
    });
    calendario.render();
  }
}

// =========== DESTRUCCIÓN DE SESIÓN EN LOGOUT ===========
document.getElementById('btnLogout')?.addEventListener('click', limpiarCredenciales);

// =========== INICIALIZACIÓN GENERAL ===========
document.addEventListener('DOMContentLoaded', () => {
  cargarResumenEmpleado();
  inicializarCalendario();
});
