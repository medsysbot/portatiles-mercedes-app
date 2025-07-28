// Archivo: static/js/dashboard_admin.js
// Proyecto: Portátiles Mercedes

function limpiarCredenciales() {
  localStorage.clear();
}

async function cargarTarjetas() {
  try {
    const resp = await fetch('/admin/api/dashboard');
    if (!resp.ok) throw new Error('Error consultando datos');
    const datos = await resp.json();
    const totales = datos.totales || {};

    document.getElementById('totalClientes').textContent   = totales.clientes ?? '-';
    document.getElementById('totalAlquileres').textContent = totales.alquileres ?? '-';
    document.getElementById('totalVentas').textContent     = totales.ventas ?? '-';
    document.getElementById('totalPendientes').textContent = totales.pendientes ?? '-';
    document.getElementById('totalMorosos').textContent    = totales.morosos ?? '-';
  } catch (err) {
    document.getElementById('totalClientes').textContent   = '-';
    document.getElementById('totalAlquileres').textContent = '-';
    document.getElementById('totalVentas').textContent     = '-';
    document.getElementById('totalPendientes').textContent = '-';
    document.getElementById('totalMorosos').textContent    = '-';
    console.error('Error cargando tarjetas:', err);
  }
}

// ---- EMAILS NUEVOS (NO LEÍDOS) ----
async function cargarEmailsNuevos() {
  try {
    const resp = await fetch('/admin/api/emails/noleidos');
    if (!resp.ok) throw new Error('Error consultando emails');
    const datos = await resp.json();
    const cantidad = typeof datos.noleidos === 'number' ? datos.noleidos : 0;
    document.getElementById('card-emails-nuevos').textContent = cantidad;
  } catch (err) {
    document.getElementById('card-emails-nuevos').textContent = '-';
    console.error('Error cargando emails nuevos:', err);
  }
}

// ---- MANTENEMOS LA LÓGICA DE LOS GRÁFICOS ----
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

    charts.alquileres = new Chart(
      document.getElementById('graficoAlquileres').getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Alquileres', data: alquileres, backgroundColor: 'rgba(60,141,188,0.9)' }] },
      options: opcionesGrafico
    });
    charts.ventas = new Chart(
      document.getElementById('graficoVentas').getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Ventas', data: ventas, backgroundColor: 'rgba(40,167,69,0.9)' }] },
      options: opcionesGrafico
    });
    charts.gastos = new Chart(
      document.getElementById('graficoGastos').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Gastos', data: gastos, borderColor: 'rgba(220,53,69,0.9)', fill: false }] },
      options: opcionesGrafico
    });
    charts.ingresos = new Chart(
      document.getElementById('graficoIngresos').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Ingresos', data:
