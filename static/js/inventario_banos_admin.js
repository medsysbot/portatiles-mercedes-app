// Archivo: static/js/inventario_banos_admin.js
// Proyecto: Portátiles Mercedes

window.pmInventarioBanosData = window.pmInventarioBanosData || [];
let tablaInventario = null;

function inicializarTablaInventario() {
  if (tablaInventario) return;
  tablaInventario = $('#tablaInventario').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'numero_bano', render: d => `<input type="checkbox" class="fila-check" data-id="${d}">`, orderable: false },
      { data: 'numero_bano' },
      { data: 'condicion' },
      { data: 'ultima_reparacion' },
      { data: 'ultimo_mantenimiento' },
      { data: 'estado' },
      { data: 'observaciones' }
    ]
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const btnNuevo = document.getElementById('btnNuevoBano');
  const buscador = document.getElementById('busquedaInventario');
  const btnBuscar = document.getElementById('btnBuscarInventario');
  const mensajeError = document.getElementById('errorInventario');

  inicializarTablaInventario();
  const tabla = tablaInventario;

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const checks = document.querySelectorAll('#tablaInventario tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = checks.length === 0;
  }

  $('#tablaInventario tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tablaInventario tbody .fila-check:checked')).map(c => c.dataset.id);
    if (!ids.length) return;
    try {
      const resp = await fetch('/admin/api/inventario_banos/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await obtenerDatos();
    } catch (err) {
      console.error('Error eliminando baños:', err);
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function obtenerDatos() {
    try {
      const resp = await fetch('/admin/api/inventario_banos', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar inventario');
      window.pmInventarioBanosData = await resp.json();
      mostrarDatos(window.pmInventarioBanosData);
      mensajeError?.classList.add('d-none');
    } catch (err) {
      console.error('Error cargando inventario:', err);
      if (!window.pmInventarioBanosData.length) tabla.clear().draw();
    }
  }

  function mostrarDatos(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  // Botón Agregar baño: navega al formulario de alta (NO modal)
  btnNuevo?.addEventListener('click', () => {
    window.location.href = '/admin/inventario_banos/nuevo';
  });

  buscador?.addEventListener('input', () => {
    filtrarBanos(buscador.value.trim());
  });
  btnBuscar?.addEventListener('click', () => {
    filtrarBanos(buscador.value.trim());
  });

  function filtrarBanos(texto) {
    const q = texto.toLowerCase();
    const filtrados = window.pmInventarioBanosData.filter(b =>
      (b.numero_bano || '').toLowerCase().includes(q) ||
      (b.condicion || '').toLowerCase().includes(q) ||
      (b.estado || '').toLowerCase().includes(q)
    );
    mostrarDatos(filtrados);
  }

  if (window.pmInventarioBanosData.length === 0) {
    obtenerDatos();
  } else {
    mostrarDatos(window.pmInventarioBanosData);
  }
});
