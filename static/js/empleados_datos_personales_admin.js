// Script: empleados_datos_personales_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaDatosPersonales').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'id', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'email' },
      { data: 'fecha_ingreso' },
      // La API ahora devuelve el campo "documento_pdf_url". Actualizamos la
      // columna para reflejarlo correctamente.
      { data: 'documento_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
    ]
  });

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const marcados = document.querySelectorAll('#tablaDatosPersonales tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = marcados.length === 0;
  }

  $('#tablaDatosPersonales tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaDatosPersonales tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    const inicio = Date.now();
    if (typeof showAlert === 'function') {
      showAlert('guardando-datos', 'Eliminando datos...', false, 1600);
    }
    try {
      const resp = await fetch('/admin/api/empleados_datos_personales/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await cargarDatos();
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Registros eliminados', false, 2600);
        }
      }, delay);
    } catch (err) {
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('error-datos', 'Error al eliminar', false, 2600);
        }
      }, delay);
      console.error('Error eliminando datos personales:', err);
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function cargarDatos() {
    const inicio = Date.now();
    if (typeof showAlert === 'function') {
      showAlert('enviando-reporte', 'Cargando datos...', false, 1600);
    }
    try {
      const resp = await fetch('/admin/api/empleados_datos_personales', { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } });
      const datos = await resp.json();
      tabla.clear();
      tabla.rows.add(datos).draw();
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Listado actualizado', false, 2600);
        }
      }, delay);
    } catch (err) {
      const delay = Math.max(0, 1600 - (Date.now() - inicio));
      setTimeout(() => {
        if (typeof showAlert === 'function') {
          showAlert('error-datos', 'Error al cargar datos', false, 2600);
        }
      }, delay);
      console.error('Error al cargar datos personales:', err);
    }
  }

  cargarDatos();
});
