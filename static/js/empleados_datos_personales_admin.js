// Archivo: static/js/empleados_datos_personales_admin.js
// Proyecto: Portátiles Mercedes (panel administración - datos personales empleados)
// Manejo de borrado con alertas visuales (borrando, éxito, error)

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

    // 1. Alerta visual: Borrando...
    await showAlert("borrando", "Eliminando registros...", true, 1200);

    try {
      const resp = await fetch('/admin/api/empleados_datos_personales/eliminar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('access_token')
        },
        body: JSON.stringify({ ids })
      });

      if (resp.ok) {
        // 2. Alerta visual: Éxito, luego recarga datos
        await showAlert("borrado-exito", "Registros eliminados", true, 2600);
        setTimeout(() => { obtenerDatos(); }, 260);
      } else {
        // 3. Alerta visual: Error
        await showAlert("borrado-error", "Error al eliminar", true, 2600);
      }
    } catch (err) {
      await showAlert("borrado-error", "Error al eliminar", true, 2600);
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function obtenerDatos() {
    try {
      const resp = await fetch('/admin/api/empleados_datos_personales', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      const datos = await resp.json();
      tabla.clear();
      tabla.rows.add(datos).draw();
    } catch (err) {
      console.error('Error al cargar datos personales:', err);
      if (!tabla.data().count()) tabla.clear().draw();
    }
  }

  obtenerDatos();
});
