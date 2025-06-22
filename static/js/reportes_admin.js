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
  const mensajeDiv = document.getElementById('mensajeReportes');
  let reportes = [];

  async function cargarReportes() {
    try {
      const resp = await fetch('/admin/api/reportes', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar reportes');
      reportes = await resp.json();
      mostrarReportes(reportes);
      errorDiv.classList.add('d-none');
      if (reportes.length === 0) {
        mostrarMensaje('No hay reportes registrados', '');
      } else {
        mostrarMensaje('', '');
      }
    } catch (err) {
      console.error('Error cargando reportes:', err);
      errorDiv.textContent = 'No se pudo cargar el listado.';
      errorDiv.classList.remove('d-none');
    }
  }

  function mostrarReportes(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function mostrarMensaje(texto, tipo) {
    if (!mensajeDiv) return;
    if (!texto) {
      mensajeDiv.style.display = 'none';
      mensajeDiv.textContent = '';
      mensajeDiv.classList.remove('alert-danger');
      return;
    }
    mensajeDiv.textContent = texto;
    mensajeDiv.classList.toggle('alert-danger', tipo === 'danger');
    mensajeDiv.style.display = 'block';
  }

  function filtrarReportes(texto) {
    const q = texto.toLowerCase();
    const filtrados = reportes.filter(r =>
      (r.nombre_persona || '').toLowerCase().includes(q) ||
      (r.asunto || '').toLowerCase().includes(q)
    );
    mostrarReportes(filtrados);
    if (filtrados.length === 0) {
      mostrarMensaje('No hay reportes registrados', '');
    } else {
      mostrarMensaje('', '');
    }
  }

  buscador?.addEventListener('input', () => filtrarReportes(buscador.value.trim()));
  btnBuscar?.addEventListener('click', () => filtrarReportes(buscador.value.trim()));

  cargarReportes();
});
