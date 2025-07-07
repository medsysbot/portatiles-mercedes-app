// Archivo: static/js/dashboard_admin.js
// Proyecto: Portátiles Mercedes

function limpiarCredenciales() {
  localStorage.clear();
}

function obtener(key) {
  const d = localStorage.getItem(key);
  return d ? JSON.parse(d) : null;
}

function guardar(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

async function cargarGraficos(charts) {
  try {
    let labels = obtener('graficoLabels');
    let alquileres = obtener('graficoAlquileresData');
    let ventas = obtener('graficoVentasData');
    let gastos = obtener('graficoGastosData');
    let ingresos = obtener('graficoIngresosData');
    let totales = obtener('graficoTotales');

    if (!labels || !alquileres || !ventas || !gastos || !ingresos || !totales) {
      const resp = await fetch('/admin/api/dashboard');
      if (!resp.ok) throw new Error('Error consultando datos');
      const datos = await resp.json();
      labels = datos.labels;
      alquileres = datos.alquileres;
      ventas = datos.ventas;
      gastos = datos.gastos;
      ingresos = datos.ingresos;
      totales = datos.totales;
      guardar('graficoLabels', labels);
      guardar('graficoAlquileresData', alquileres);
      guardar('graficoVentasData', ventas);
      guardar('graficoGastosData', gastos);
      guardar('graficoIngresosData', ingresos);
      guardar('graficoTotales', totales);
    }

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
