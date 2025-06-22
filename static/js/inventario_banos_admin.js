// Archivo: static/js/inventario_bano_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const btnNuevo = document.getElementById('btnNuevoBano');
  const buscador = document.getElementById('busquedaInventario');
  const btnBuscar = document.getElementById('btnBuscarInventario');
  const mensajeError = document.getElementById('errorInventario');
  const mensajeInfo = document.getElementById('mensajeInventario');

  let banosCargados = [];

  const tabla = $('#tablaInventario').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      { data: 'numero_bano' },
      { data: 'condicion' },
      { data: 'ultima_reparacion' },
      { data: 'ultimo_mantenimiento' },
      { data: 'estado' },
      { data: 'observaciones' }
    ]
  });

  async function cargarTabla() {
    try {
      const resp = await fetch('/admin/api/inventario_bano', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      });
      if (!resp.ok) throw new Error('Error al consultar inventario');
      banosCargados = await resp.json();
      mostrarBanos(banosCargados);
      mensajeError?.classList.add('d-none');
      if (banosCargados.length === 0) {
        mostrarMensaje('No hay baños registrados', '');
      } else {
        mostrarMensaje('', '');
      }
    } catch (err) {
      console.error('Error cargando inventario:', err);
      if (mensajeError) {
        mensajeError.textContent = 'No se pudo cargar el inventario.';
        mensajeError.classList.remove('d-none');
      }
    }
  }

  function mostrarBanos(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function mostrarMensaje(texto, tipo) {
    if (!mensajeInfo) return;
    if (!texto) {
      mensajeInfo.style.display = 'none';
      mensajeInfo.textContent = '';
      mensajeInfo.classList.remove('alert-danger');
      return;
    }
    mensajeInfo.textContent = texto;
    mensajeInfo.classList.toggle('alert-danger', tipo === 'danger');
    mensajeInfo.style.display = 'block';
  }

  // Botón Agregar baño: navega al formulario de alta (NO modal)
  btnNuevo?.addEventListener('click', () => {
    window.location.href = '/admin/inventario_bano/nuevo';
  });

  buscador?.addEventListener('input', () => {
    filtrarBanos(buscador.value.trim());
  });
  btnBuscar?.addEventListener('click', () => {
    filtrarBanos(buscador.value.trim());
  });

  function filtrarBanos(texto) {
    const q = texto.toLowerCase();
    const filtrados = banosCargados.filter(b =>
      (b.numero_bano || '').toLowerCase().includes(q) ||
      (b.condicion || '').toLowerCase().includes(q) ||
      (b.estado || '').toLowerCase().includes(q)
    );
    mostrarBanos(filtrados);
    if (filtrados.length === 0) {
      mostrarMensaje('No hay baños registrados', '');
    } else {
      mostrarMensaje('', '');
    }
  }

  cargarTabla();
});
