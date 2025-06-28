// Script: empleados_salarios_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaSalarios').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'id', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'salario' },
      { data: 'anticipo_pedido' },
      { data: 'saldo_a_pagar' },
      { data: 'recibo_sueldo_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
    ]
  });

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const marcados = document.querySelectorAll('#tablaSalarios tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = marcados.length === 0;
  }

  $('#tablaSalarios tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaSalarios tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length || !confirm('¿Eliminar registros seleccionados?')) return;
    try {
      const resp = await fetch('/admin/api/empleados_salarios/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await cargarDatos();
    } catch (err) {
      console.error('Error eliminando salarios:', err);
      alert('Error eliminando registros');
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function cargarDatos() {
    try {
      const resp = await fetch('/admin/api/empleados_salarios', { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } });
      const datos = await resp.json();
      tabla.clear();
      tabla.rows.add(datos).draw();
    } catch (err) {
      console.error('Error al cargar salarios:', err);
    }
  }

  cargarDatos();
});
