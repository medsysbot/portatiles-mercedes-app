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

    const labels = datos.labels;
    const alquileres = datos.alquileres;
    const ventas = datos.ventas;
    const gastos = datos.gastos;
    const ingresos = datos.ingresos;
    const totales = datos.totales;

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

    charts.alquileres = new Chart('graficoAlquileres', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Alquileres', data: alquileres, backgroundColor: 'rgba(60,141,188,0.9)' }] },
      options: opcionesGrafico
    });
    charts.ventas = new Chart('graficoVentas', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Ventas', data: ventas, backgroundColor: 'rgba(40,167,69,0.9)' }] },
      options: opcionesGrafico
    });
    charts.gastos = new Chart('graficoGastos', {
      type: 'line',
      data: { labels, datasets: [{ label: 'Gastos', data: gastos, borderColor: 'rgba(220,53,69,0.9)', fill: false }] },
      options: opcionesGrafico
    });
    charts.ingresos = new Chart('graficoIngresos', {
      type: 'line',
      data: { labels, datasets: [{ label: 'Ingresos', data: ingresos, borderColor: 'rgba(0,123,255,0.9)', fill: false }] },
      options: opcionesGrafico
    });

    document.getElementById('totalClientes').textContent = totales.clientes;
    document.getElementById('totalAlquileres').textContent = totales.alquileres;
    document.getElementById('totalVentas').textContent = totales.ventas;
    document.getElementById('totalPendientes').textContent = totales.pendientes;
    document.getElementById('totalMorosos').textContent = totales.morosos;

  } catch (err) {
    console.error('Error gráficos:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnLogout')?.addEventListener('click', limpiarCredenciales);
  cargarGraficos({});
});
