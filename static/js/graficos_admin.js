// Manejo de gráficos con carga manual de datos

// Ejecutar una vez cargado el script. El archivo se incluye al final de la
// plantilla, por lo que el DOM ya está disponible y no es necesario esperar a
// `DOMContentLoaded`.
(async () => {
  const form = document.getElementById('formGraficos');
  const select = document.getElementById('dataset');
  const input = document.getElementById('valores');

  const resp = await fetch('/admin/api/dashboard');
  const datos = await resp.json();
  const labels = datos.labels;

  const charts = {
    alquileres: new Chart(document.getElementById('graficoAlquileres').getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Alquileres', data: datos.alquileres, backgroundColor: 'rgba(60,141,188,0.9)' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { suggestedMin: -7, suggestedMax: 7 } } }
    }),
    ventas: new Chart(document.getElementById('graficoVentas').getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Ventas', data: datos.ventas, backgroundColor: 'rgba(40,167,69,0.9)' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { suggestedMin: -7, suggestedMax: 7 } } }
    }),
    gastos: new Chart(document.getElementById('graficoGastos').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Gastos', data: datos.gastos, borderColor: 'rgba(220,53,69,0.9)', fill: false }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { suggestedMin: -7, suggestedMax: 7 } } }
    }),
    ingresos: new Chart(document.getElementById('graficoIngresos').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Ingresos', data: datos.ingresos, borderColor: 'rgba(0,123,255,0.9)', fill: false }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { suggestedMin: -7, suggestedMax: 7 } } }
    })
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const tipo = select.value;
    const valores = input.value
      .split(',')
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v));
    if (valores.length) {
      charts[tipo].data.datasets[0].data = valores;
      charts[tipo].update();
    }
  });
})();
