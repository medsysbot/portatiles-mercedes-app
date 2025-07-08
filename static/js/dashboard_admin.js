// Archivo: static/js/dashboard_admin.js
// Proyecto: Portátiles Mercedes

function limpiarCredenciales() {
  localStorage.clear();
}

async function cargarGraficos(charts) {
  try {
    const resp = await fetch('/admin/api/dashboard');
    if (!resp.ok) throw new Error('Error consultando datos');
    const datos = await resp.json();

    const labels = datos.labels || [];
    const alquileres = datos.alquileres || [];
    const ventas = datos.ventas || [];
    const gastos = datos.gastos || [];
    const ingresos = datos.ingresos || [];
    const totales = datos.totales || {};

    const getSafe = (obj, key) =>
      (obj && typeof obj[key] !== 'undefined' && obj[key] !== null)
        ? obj[key]
        : 0;

    // Cargar tarjetas (siempre con valor seguro)
    document.getElementById('totalClientes').textContent   = getSafe(totales, 'clientes');
    document.getElementById('totalAlquileres').textContent = getSafe(totales, 'alquileres');
    document.getElementById('totalVentas').textContent     = getSafe(totales, 'ventas');
    document.getElementById('totalPendientes').textContent = getSafe(totales, 'pendientes');
    document.getElementById('totalMorosos').textContent    = getSafe(totales, 'morosos');

    // Gráficos
    const opcionesGrafico = {
      responsive: true,
      aspectRatio: 2,
      scales: {
        y: { suggestedMin: 0, suggestedMax: 10, ticks: { color: '#000' } },
        x: {
          grid: { color: 'rgba(0,0,0,0.1)' },
          ticks: { color: '#000' }
        }
      },
      plugins: { legend: { labels: { color: '#000' } } }
    };

    if (document.getElementById('graficoAlquileres')) {
      charts.alquileres = new Chart(
        document.getElementById('graficoAlquileres').getContext('2d'), {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Alquileres', data: alquileres, backgroundColor: 'rgba(60,141,188,0.9)' }] },
        options: opcionesGrafico
      });
    }
    if (document.getElementById('graficoVentas')) {
      charts.ventas = new Chart(
        document.getElementById('graficoVentas').getContext('2d'), {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Ventas', data: ventas, backgroundColor: 'rgba(40,167,69,0.9)' }] },
        options: opcionesGrafico
      });
    }
    if (document.getElementById('graficoGastos')) {
      charts.gastos = new Chart(
        document.getElementById('graficoGastos').getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Gastos', data: gastos, borderColor: 'rgba(220,53,69,0.9)', fill: false }] },
        options: opcionesGrafico
      });
    }
    if (document.getElementById('graficoIngresos')) {
      charts.ingresos = new Chart(
        document.getElementById('graficoIngresos').getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Ingresos', data: ingresos, borderColor: 'rgba(0,123,255,0.9)', fill: false }] },
        options: opcionesGrafico
      });
    }
  } catch (err) {
    // Si hay error igual muestra 0 en todas las tarjetas
    ['totalClientes','totalAlquileres','totalVentas','totalPendientes','totalMorosos'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.textContent = '0';
    });
    console.error('Error gráficos:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnLogout')?.addEventListener('click', limpiarCredenciales);
  cargarGraficos({});
});
