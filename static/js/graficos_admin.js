// Reemplazá todo el script actual por esto:

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('formGraficos');
  const select = document.getElementById('dataset');
  const input = document.getElementById('valores');

  // Si falta alguno, no seguir
  if (!form || !select || !input) return;

  // Encontrar los gráficos
  const charts = {
    alquileres: Chart.getChart('graficoAlquileres'),
    ventas: Chart.getChart('graficoVentas'),
    gastos: Chart.getChart('graficoGastos'),
    ingresos: Chart.getChart('graficoIngresos')
  };

  // Si no existen, intentar instanciar desde cero (si es necesario)
  for (const tipo in charts) {
    if (!charts[tipo] && document.getElementById('grafico' + tipo.charAt(0).toUpperCase() + tipo.slice(1))) {
      charts[tipo] = new Chart(document.getElementById('grafico' + tipo.charAt(0).toUpperCase() + tipo.slice(1)).getContext('2d'), {
        type: (tipo === 'gastos' || tipo === 'ingresos') ? 'line' : 'bar',
        data: { labels: Array(12).fill(''), datasets: [{ label: tipo.charAt(0).toUpperCase() + tipo.slice(1), data: Array(12).fill(0) }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const tipo = select.value;
    const valores = input.value
      .split(',')
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v));
    if (valores.length !== 12) {
      alert('Debe ingresar exactamente 12 valores separados por coma.');
      return;
    }
    if (charts[tipo]) {
      charts[tipo].data.datasets[0].data = valores;
      charts[tipo].update();
    } else {
      alert('No se encontró el gráfico correspondiente.');
    }
  });
});
