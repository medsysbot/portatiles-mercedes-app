// Archivo: static/js/graficos_admin.js
// Adaptado al diseño global de Portátiles Mercedes

function obtener(key) {
  const d = localStorage.getItem(key);
  return d ? JSON.parse(d) : null;
}

function guardar(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

(async () => {
  const form = document.getElementById('formGraficos');
  const select = document.getElementById('dataset');
  const input = document.getElementById('valores');

  let labels = obtener('graficoLabels');
  let alquileres = obtener('graficoAlquileresData');
  let ventas = obtener('graficoVentasData');
  let gastos = obtener('graficoGastosData');
  let ingresos = obtener('graficoIngresosData');

  if (!labels || !alquileres || !ventas || !gastos || !ingresos) {
    const resp = await fetch('/admin/api/dashboard');
    const datos = await resp.json();
    labels = labels || datos.labels;
    alquileres = alquileres || datos.alquileres;
    ventas = ventas || datos.ventas;
    gastos = gastos || datos.gastos;
    ingresos = ingresos || datos.ingresos;
    guardar('graficoLabels', labels);
    guardar('graficoAlquileresData', alquileres);
    guardar('graficoVentasData', ventas);
    guardar('graficoGastosData', gastos);
    guardar('graficoIngresosData', ingresos);
  }

  const opcionesGrafico = {
    responsive: true,
    aspectRatio: 2,
    scales: { 
      y: { suggestedMin: 0, suggestedMax: 10 },
      x: { grid: { color: 'rgba(255,255,255,0.1)' } }
    },
    plugins: { legend: { labels: { color: '#ffffff' } } }
  };

  const charts = {
    alquileres: new Chart(document.getElementById('graficoAlquileres').getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Alquileres', data: alquileres, backgroundColor: 'rgba(60,141,188,0.9)' }] },
      options: opcionesGrafico
    }),
    ventas: new Chart(document.getElementById('graficoVentas').getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Ventas', data: ventas, backgroundColor: 'rgba(40,167,69,0.9)' }] },
      options: opcionesGrafico
    }),
    gastos: new Chart(document.getElementById('graficoGastos').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Gastos', data: gastos, borderColor: 'rgba(220,53,69,0.9)', fill: false }] },
      options: opcionesGrafico
    }),
    ingresos: new Chart(document.getElementById('graficoIngresos').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Ingresos', data: ingresos, borderColor: 'rgba(0,123,255,0.9)', fill: false }] },
      options: opcionesGrafico
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
      const keyMap = {
        alquileres: 'graficoAlquileresData',
        ventas: 'graficoVentasData',
        gastos: 'graficoGastosData',
        ingresos: 'graficoIngresosData'
      };
      guardar(keyMap[tipo], valores);
    }
  });
})();
