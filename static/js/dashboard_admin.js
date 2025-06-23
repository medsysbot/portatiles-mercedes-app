// Archivo: static/js/dashboard_admin.js
// Proyecto: Portátiles Mercedes

function limpiarCredenciales() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
}

function ajustarAlturaGraficos() {
  document.querySelectorAll('.grafico-panel').forEach(canvas => {
    const ancho = canvas.offsetWidth;
    canvas.style.height = `${ancho / 2}px`;
  });
}

window.addEventListener('resize', ajustarAlturaGraficos);

async function cargarGraficos(charts) {
  try {
    const resp = await fetch('/admin/api/dashboard');
    if (!resp.ok) throw new Error('Error consultando datos');
    const datos = await resp.json();
    const labels = datos.labels;

  if (!charts.alquileres) {
    charts.alquileres = new Chart(document.getElementById('graficoAlquileres').getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Alquileres', data: datos.alquileres, backgroundColor: 'rgba(60,141,188,0.9)' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { suggestedMin: -7, suggestedMax: 7 } } }
    });
    charts.ventas = new Chart(document.getElementById('graficoVentas').getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Ventas', data: datos.ventas, backgroundColor: 'rgba(40,167,69,0.9)' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { suggestedMin: -7, suggestedMax: 7 } } }
    });
    charts.gastos = new Chart(document.getElementById('graficoGastos').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Gastos', data: datos.gastos, borderColor: 'rgba(220,53,69,0.9)', fill: false }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { suggestedMin: -7, suggestedMax: 7 } } }
    });
    charts.ingresos = new Chart(document.getElementById('graficoIngresos').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Ingresos', data: datos.ingresos, borderColor: 'rgba(0,123,255,0.9)', fill: false }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { suggestedMin: -7, suggestedMax: 7 } } }
    });
  } else {
    charts.alquileres.data.labels = labels;
    charts.alquileres.data.datasets[0].data = datos.alquileres;
    charts.alquileres.update();

    charts.ventas.data.labels = labels;
    charts.ventas.data.datasets[0].data = datos.ventas;
    charts.ventas.update();

    charts.gastos.data.labels = labels;
    charts.gastos.data.datasets[0].data = datos.gastos;
    charts.gastos.update();

    charts.ingresos.data.labels = labels;
    charts.ingresos.data.datasets[0].data = datos.ingresos;
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
  ajustarAlturaGraficos();
  cargarGraficos(charts);
});
