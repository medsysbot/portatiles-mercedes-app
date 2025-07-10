// Script: empleados_datos_personales_empleado.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaDatosPersonales').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'nombre_empleado' },
      { data: 'dni_cuit_cuil' },
      { data: 'email' },
      { data: 'fecha_ingreso' },
      // Ajuste de nombre de campo para coincidir con la base de datos
      { data: 'documento_pdf_url', render: url => `<a href="${url}" target="_blank">Ver</a>` }
    ]
  });

  async function cargarDatos() {
    const inicio = Date.now();
    if (typeof showAlert === 'function') {
      showAlert('enviando-reporte', 'Cargando datos...', false, 1600);
    }
    try {
      const resp = await fetch('/empleado/api/datos_personales', { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } });
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
