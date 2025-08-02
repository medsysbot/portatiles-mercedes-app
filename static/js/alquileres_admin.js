// Archivo: static/js/alquileres_admin.js
// Proyecto: Portátiles Mercedes (panel administración - alquileres)
// Manejo de borrado con alertas visuales: borrando, éxito, error

window.pmAlquileresAdminData = window.pmAlquileresAdminData || [];
let tablaAlquileres = null;

function inicializarTablaAlquileres() {
  if (tablaAlquileres) return;
  tablaAlquileres = $('#tablaAlquileres').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'numero_bano', render: data => `<input type="checkbox" class="fila-check" data-id="${data}">`, orderable: false },
      { data: 'numero_bano' },
      { data: 'cliente_nombre' },
      { data: 'razon_social' },
      { data: 'dni_cuit_cuil' },
      { data: 'direccion' },
      { data: 'fecha_inicio' },
      { data: 'fecha_fin' },
      { data: 'observaciones' }
    ]
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('busquedaAlquileres');
  const btnBuscar = document.getElementById('btnBuscarAlquiler');
  const mensajeError = document.getElementById('errorAlquileres');

  inicializarTablaAlquileres();
  const tabla = tablaAlquileres;

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');
  const btnEditar = document.getElementById('btnEditarSeleccionado');

  function actualizarBotones() {
    const marcados = document.querySelectorAll('#tablaAlquileres tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = marcados.length === 0;
    if (btnEditar) btnEditar.disabled = marcados.length !== 1;
  }

  $('#tablaAlquileres tbody').on('change', '.fila-check', actualizarBotones);

  btnEditar?.addEventListener('click', () => {
    const seleccionado = document.querySelector('#tablaAlquileres tbody .fila-check:checked');
    if (!seleccionado) return;
    const id = seleccionado.dataset.id;
    window.location.href = `/admin/alquileres/editar/${id}`;
  });

  // BORRADO con alertas visuales
  btnEliminar?.addEventListener('click', async () => {
    const seleccionados = Array.from(document.querySelectorAll('#tablaAlquileres tbody .fila-check:checked')).map(cb => cb.dataset.id);
    if (!seleccionados.length) return;

    btnEliminar.disabled = true; // Deshabilito botón mientras procesa

    await showAlert("borrando", "Eliminando registros...", true, 1200);

    try {
      const resp = await fetch('/admin/api/alquileres/eliminar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('access_token')
        },
        body: JSON.stringify({ ids: seleccionados })
      });

      if (resp.ok) {
        await showAlert("borrado-exito", "Registros eliminados", true, 2600);
        // Recargo datos de tabla para reflejar eliminación
        await obtenerDatos();
      } else {
        await showAlert("borrado-error", "Error al eliminar", true, 2600);
      }
    } catch (err) {
      await showAlert("borrado-error", "Error al eliminar", true, 2600);
    } finally {
      actualizarBotones(); // Actualizo estado botones tras terminar
    }
  });

  async function obtenerDatos() {
    try {
      const resp = await fetch('/admin/api/alquileres', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error consultando alquileres');
      window.pmAlquileresAdminData = await resp.json();
      mostrarDatos(window.pmAlquileresAdminData);
      mensajeError?.classList.add('d-none');
    } catch (err) {
      console.error('Error al cargar alquileres:', err);
      if (!window.pmAlquileresAdminData.length) tabla.clear().draw();
    }
  }

  function mostrarDatos(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrarAlquileres(texto) {
    const q = texto.toLowerCase();
    const filtrados = window.pmAlquileresAdminData.filter(a =>
      (a.cliente_nombre || '').toLowerCase().includes(q) ||
      (a.razon_social || '').toLowerCase().includes(q) ||
      (a.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (a.numero_bano || '').toLowerCase().includes(q)
    );
    mostrarDatos(filtrados);
    actualizarBotones(); // Actualizo botones tras filtrar
  }

  buscador?.addEventListener('input', () => {
    filtrarAlquileres(buscador.value.trim());
  });
  btnBuscar?.addEventListener('click', () => {
    filtrarAlquileres(buscador.value.trim());
  });

  if (window.pmAlquileresAdminData.length === 0) {
    obtenerDatos();
  } else {
    mostrarDatos(window.pmAlquileresAdminData);
  }
});
