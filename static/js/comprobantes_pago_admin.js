// Archivo: static/js/comprobantes_pago_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const tabla = $('#tablaComprobantes').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'nombre_cliente' },
      { data: 'dni_cuit_cuil' },
      { data: 'numero_factura' },
      { data: 'comprobante_url', render: d => `<a href="${d}" target="_blank">Ver</a>` },
      { data: 'fecha_envio' }
    ]
  });

  async function cargarComprobantes() {
    try {
      const resp = await fetch('/admin/api/comprobantes_pago', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error consultando');
      const datos = await resp.json();
      tabla.clear();
      tabla.rows.add(datos).draw();
      document.getElementById('mensajeComprobantes').style.display = datos.length ? 'none' : 'block';
      document.getElementById('mensajeComprobantes').textContent = datos.length ? '' : 'Sin registros';
      document.getElementById('errorComprobantes').classList.add('d-none');
    } catch (err) {
      console.error('Error cargando comprobantes:', err);
      const div = document.getElementById('errorComprobantes');
      div.textContent = 'No se pudo cargar el listado';
      div.classList.remove('d-none');
    }
  }

  cargarComprobantes();
});
