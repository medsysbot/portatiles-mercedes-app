// Script: empleados_ausencias_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaAusencias').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'id', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'tipo_ausencia' },
      { data: 'fecha_inicio' },
      { data: 'fecha_fin' },
      { data: 'certificado_medico_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
    ]
  });

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const marcados = document.querySelectorAll('#tablaAusencias tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = marcados.length === 0;
  }

  $('#tablaAusencias tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaAusencias tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    const ok = await mostrarConfirmacionPersonalizada('¿Eliminar registros seleccionados?', 'error-datos');
    if (!ok) return;
    try {
      const resp = await fetch('/admin/api/empleados_ausencias/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await cargarDatos();
    } catch (err) {
      console.error('Error eliminando ausencias:', err);
      mostrarAlertaPersonalizada('Error eliminando registros','error-datos');
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function cargarDatos() {
    try {
      const resp = await fetch('/admin/api/empleados_ausencias', { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } });
      const datos = await resp.json();
      tabla.clear();
      tabla.rows.add(datos).draw();
    } catch (err) {
      console.error('Error al cargar ausencias:', err);
    }
  }

  cargarDatos();
});
