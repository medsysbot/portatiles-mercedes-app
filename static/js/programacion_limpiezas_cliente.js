// Archivo: static/js/programacion_limpiezas_cliente.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaProgramacion').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'fecha_limpieza' },
      { data: 'hora_aprox' },
      { data: 'numero_bano' },
      { data: 'direccion' }
    ]
  });

  async function cargarDatos() {
    const inicio = Date.now();
    if (typeof showAlert === 'function') {
      showAlert('enviando-reporte', 'Cargando datos...', false, 1600);
    }
    try {
      const resp = await fetch('/cliente/api/limpiezas_programadas', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
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
      console.error(err);
    }
  }

  cargarDatos();
});
