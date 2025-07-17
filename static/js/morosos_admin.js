// Archivo: static/js/morosos_admin.js
// Proyecto: Portátiles Mercedes

let tablaMorosos = null;

function inicializarTablaMorosos() {
  if (tablaMorosos) return;
  tablaMorosos = $('#tablaMorosos').DataTable({
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
}

document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaMorosos');
  const btnBuscar = document.getElementById('btnBuscarMorosos');
  const btnEliminar = document.getElementById('btnEliminarSeleccionados');
  const mensajeError = document.getElementById('errorMorosos');

  let morososCargados = [];

  inicializarTablaMorosos();
  const tabla = tablaMorosos;

  function actualizarBoton() {
    const checks = document.querySelectorAll('#tablaMorosos tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = checks.length === 0;
  }

  $('#tablaMorosos tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaMorosos tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    const start = Date.now();
    try {
      const resp = await fetch('/admin/api/morosos/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await cargarMorosos();
      const delay = Math.max(0, 1600 - (Date.now() - start));
      setTimeout(() => {
      }, delay);
    } catch (_) {
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
    }
  }

  function mostrarMorosos(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrarMorosos(texto) {
    const q = texto.toLowerCase();
    const filtrados = morososCargados.filter(m =>
      (m.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (m.razon_social || '').toLowerCase().includes(q) ||
      (m.nombre_cliente || '').toLowerCase().includes(q) ||
      (m.numero_factura || '').toLowerCase().includes(q)
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
