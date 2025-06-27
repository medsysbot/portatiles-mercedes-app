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
    try {
      const resp = await fetch('/cliente/programacion_limpiezas', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      const datos = await resp.json();
      tabla.clear();
      tabla.rows.add(datos).draw();
    } catch (err) {
      console.error(err);
    }
  }

  cargarDatos();
});
