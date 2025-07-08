// Archivo: static/js/dashboard_admin.js
// Proyecto: Portátiles Mercedes

function limpiarCredenciales() {
  localStorage.clear();
}

async function cargarTotales() {
  try {
    const resp = await fetch('/admin/api/dashboard');
    if (!resp.ok) throw new Error('Error consultando datos');
    const datos = await resp.json();

    // Llenar las tarjetas con los totales, igual que la lógica de empleados
    document.getElementById('totalClientes').textContent = datos.totales.clientes || 0;
    document.getElementById('totalAlquileres').textContent = datos.totales.alquileres || 0;
    document.getElementById('totalVentas').textContent = datos.totales.ventas || 0;
    document.getElementById('totalPendientes').textContent = datos.totales.pendientes || 0;
    document.getElementById('totalMorosos').textContent = datos.totales.morosos || 0;

    // Si tienes gráficos y quieres que funcionen, descomenta esto:
    // cargarGraficos(datos);
  } catch (err) {
    console.error('Error cargando totales del dashboard:', err);
    // Si falla, pone todo en 0
    document.getElementById('totalClientes').textContent = 0;
    document.getElementById('totalAlquileres').textContent = 0;
    document.getElementById('totalVentas').textContent = 0;
    document.getElementById('totalPendientes').textContent = 0;
    document.getElementById('totalMorosos').textContent = 0;
  }
}

// Si quieres seguir usando los gráficos automáticos, mantén esta función y llama desde cargarTotales si hace falta
/*
function cargarGraficos(datos) {
  // ... aquí iría el código de gráficos automático si lo necesitas ...
}
*/

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnLogout')?.addEventListener('click', limpiarCredenciales);
  cargarTotales();
});
