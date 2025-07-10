// Archivo: static/js/morosos_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaMorosos');
  const btnBuscar = document.getElementById('btnBuscarMorosos');
  const btnEliminar = document.getElementById('btnEliminarSeleccionados');
  const mensajeError = document.getElementById('errorMorosos');

  let morososCargados = [];

  const tabla = $('#tablaMorosos').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'id_moroso', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'id_moroso' },
      { data: 'fecha_facturacion' },
      { data: 'numero_factura' },
      { data: 'dni_cuit_cuil' },
      { data: 'razon_social' },
      { data: 'nombre_cliente' },
      { data: 'monto_adeudado' }
    ]
  });

  function actualizarBoton() {
    const checks = document.querySelectorAll('#tablaMorosos tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = checks.length === 0;
  }

  $('#tablaMorosos tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaMorosos tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    try {
      const resp = await fetch('/admin/api/morosos/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await cargarMorosos();
    } catch (_) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al eliminar morosos', false, 2500);
      }
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function cargarMorosos() {
    try {
      const resp = await fetch('/admin/api/morosos', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error consultando morosos');
      morososCargados = await resp.json();
      mostrarMorosos(morososCargados);
      mensajeError?.classList.add('d-none');
    } catch (_) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'No se pudo cargar el listado', false, 2500);
      }
    }
  }

  function mostrarMorosos(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrarMorosos(texto) {
    const q = texto.toLowerCase();
    const filtrados = morososCargados.filter(m =>
      (m.dni_cuit_cuil || '').toLowerCase().includes(q)
    );
    mostrarMorosos(filtrados);
    if (filtrados.length === 0) {
    } else {
    }
  }

  buscador?.addEventListener('input', () => {
    filtrarMorosos(buscador.value.trim());
  });
  btnBuscar?.addEventListener('click', () => {
    filtrarMorosos(buscador.value.trim());
  });

  cargarMorosos();
});
