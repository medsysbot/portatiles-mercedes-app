// Archivo: static/js/reportes_empleado.js
// Módulo exclusivo para el panel de EMPLEADOS
// Incluye: carga de nuevo reporte + listado y búsqueda

document.addEventListener('DOMContentLoaded', () => {
  // === FORMULARIO DE NUEVO REPORTE ===
  const form = document.querySelector('form[data-success-url]');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const datos = new FormData(form);

      try {
        if (typeof showAlert === 'function') {
          await showAlert('enviando-reporte', 'Enviando reporte...', 2600);
        }

        const resp = await fetch(form.getAttribute('action') || window.location.pathname, {
          method: 'POST',
          body: datos
        });

        if (resp.ok) {
          if (typeof showAlert === 'function') {
            await showAlert('reporte-exito', 'Reporte enviado', 2600);
          }
          setTimeout(() => {
            window.location.href = form.dataset.successUrl || '/';
          }, 2600);
        } else {
          if (typeof showAlert === 'function') {
            await showAlert('reporte-error', 'Error al enviar reporte', 2600);
          }
        }
      } catch (_) {
        if (typeof showAlert === 'function') {
          await showAlert('reporte-error', 'Error al enviar reporte', 2600);
        }
      }
    });
  }

  // === LISTADO Y FILTRO DE REPORTES (solo si existe la tabla) ===
  const tablaElement = document.getElementById('tablaReportes');
  if (tablaElement) {
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

    const btnBuscar = document.getElementById('btnBuscar');
    const buscador = document.getElementById('campoBuscar');
    const errorDiv = document.getElementById('errorReportes');
    let reportes = [];

    async function cargarReportes() {
      const inicio = Date.now();
      if (typeof showAlert === 'function') {
        showAlert('enviando-reporte', 'Cargando reportes...', false, 1600);
      }
      try {
        const resp = await fetch('/empleado/api/reportes', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
        });
        if (!resp.ok) throw new Error('Error al consultar reportes');
        reportes = await resp.json();
        mostrarReportes(reportes);
        errorDiv?.classList.add('d-none');

        const delay = Math.max(0, 1600 - (Date.now() - inicio));
        setTimeout(() => {
          if (typeof showAlert === 'function') {
            showAlert('reporte-exito', 'Listado actualizado', false, 2600);
          }
        }, delay);
      } catch (err) {
        const delay = Math.max(0, 1600 - (Date.now() - inicio));
        setTimeout(() => {
          if (typeof showAlert === 'function') {
            showAlert('reporte-error', 'Error al cargar reportes', false, 2600);
          }
        }, delay);
        console.error('Error cargando reportes:', err);
        if (errorDiv) {
          errorDiv.textContent = '';
          errorDiv.classList.add('d-none');
        }
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
    }

    buscador?.addEventListener('input', () => filtrarReportes(buscador.value.trim()));
    btnBuscar?.addEventListener('click', () => filtrarReportes(buscador.value.trim()));

    cargarReportes();
  }
});
