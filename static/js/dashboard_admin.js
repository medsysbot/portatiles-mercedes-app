// Archivo: static/js/dashboard_admin.js
// Proyecto: Portátiles Mercedes

function limpiarCredenciales() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
}


function obtenerLocal(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function guardarLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

async function cargarGraficos(charts) {
  try {
    let labels = obtenerLocal('graficoLabels');
    let alquileres = obtenerLocal('graficoAlquileresData');
    let ventas = obtenerLocal('graficoVentasData');
    let gastos = obtenerLocal('graficoGastosData');
    let ingresos = obtenerLocal('graficoIngresosData');

    if (!labels || !alquileres || !ventas || !gastos || !ingresos) {
      const resp = await fetch('/admin/api/dashboard');
      if (!resp.ok) throw new Error('Error consultando datos');
      const datos = await resp.json();
      labels = labels || datos.labels;
      alquileres = alquileres || datos.alquileres;
      ventas = ventas || datos.ventas;
      gastos = gastos || datos.gastos;
      ingresos = ingresos || datos.ingresos;
      guardarLocal('graficoLabels', labels);
      guardarLocal('graficoAlquileresData', alquileres);
      guardarLocal('graficoVentasData', ventas);
      guardarLocal('graficoGastosData', gastos);
      guardarLocal('graficoIngresosData', ingresos);
    }

  if (!charts.alquileres) {
    charts.alquileres = new Chart(document.getElementById('graficoAlquileres').getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Alquileres', data: alquileres, backgroundColor: 'rgba(60,141,188,0.9)' }] },
      options: {
        responsive: true,
        aspectRatio: 2,
        scales: { y: { suggestedMin: -7, suggestedMax: 7 } }
      }
    });
    charts.ventas = new Chart(document.getElementById('graficoVentas').getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Ventas', data: ventas, backgroundColor: 'rgba(40,167,69,0.9)' }] },
      options: {
        responsive: true,
        aspectRatio: 2,
        scales: { y: { suggestedMin: -7, suggestedMax: 7 } }
      }
    });
    charts.gastos = new Chart(document.getElementById('graficoGastos').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Gastos', data: gastos, borderColor: 'rgba(220,53,69,0.9)', fill: false }] },
      options: {
        responsive: true,
        aspectRatio: 2,
        scales: { y: { suggestedMin: -7, suggestedMax: 7 } }
      }
    });
    charts.ingresos = new Chart(document.getElementById('graficoIngresos').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Ingresos', data: ingresos, borderColor: 'rgba(0,123,255,0.9)', fill: false }] },
      options: {
        responsive: true,
        aspectRatio: 2,
        scales: { y: { suggestedMin: -7, suggestedMax: 7 } }
      }
    });
  } else {
    charts.alquileres.data.labels = labels;
    charts.alquileres.data.datasets[0].data = alquileres;
    charts.alquileres.update();

    charts.ventas.data.labels = labels;
    charts.ventas.data.datasets[0].data = ventas;
    charts.ventas.update();

    charts.gastos.data.labels = labels;
    charts.gastos.data.datasets[0].data = gastos;
    charts.gastos.update();

    charts.ingresos.data.labels = labels;
    charts.ingresos.data.datasets[0].data = ingresos;
    charts.ingresos.update();
  }
  } catch (err) {
    console.error('Error actualizando gráficos:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('btnLogout');
  const charts = {};

  btnLogout?.addEventListener('click', limpiarCredenciales);
  cargarGraficos(charts);
});
