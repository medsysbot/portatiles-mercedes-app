// Archivo: static/js/reportes_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaReportes').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'id_reporte' },
      { data: 'fecha' },
      { data: 'nombre_persona' },
      { data: 'asunto' },
      { data: 'contenido' }
    ]
  });

  const btnBuscar = document.getElementById('btnBuscarReportes');
  const buscador = document.getElementById('busquedaReportes');
  const errorDiv = document.getElementById('errorReportes');
  let reportes = [];

  async function cargarReportes() {
    const inicio = Date.now();
    try {
      const resp = await fetch('/empleado/api/reportes', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar reportes');
      reportes = await resp.json();
      mostrarReportes(reportes);
      errorDiv.classList.add('d-none');
      if (reportes.length === 0) {
      }
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
      }, delay);
    } catch (err) {
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
      }, delay);
      console.error('Error cargando reportes:', err);
      errorDiv.textContent = '';
      errorDiv.classList.add('d-none');
    }
  }

  function mostrarReportes(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrarReportes(texto) {
    const q = texto.toLowerCase();
    const filtrados = reportes.filter(r =>
      (r.nombre_persona || '').toLowerCase().includes(q) ||
      (r.asunto || '').toLowerCase().includes(q)
    );
    mostrarReportes(filtrados);
    if (filtrados.length === 0) {
    }
  }

  buscador?.addEventListener('input', () => filtrarReportes(buscador.value.trim()));
  btnBuscar?.addEventListener('click', () => filtrarReportes(buscador.value.trim()));

  cargarReportes();
});
