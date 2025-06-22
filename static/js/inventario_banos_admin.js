// Archivo: static/js/inventario_banos_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  const btnNuevo = document.getElementById('btnNuevoBano');
  const modal = $('#modalNuevoBano');
  const modalContainer = document.getElementById('modal-form-container');
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
      const resp = await fetch('/admin/api/inventario_banos', {
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

  btnNuevo?.addEventListener('click', async () => {
    const resp = await fetch('/admin/inventario/form');
    modalContainer.innerHTML = await resp.text();
    modal.modal('show');
    const form = document.getElementById('formNuevoBano');
    form?.addEventListener('submit', guardarBano);
  });

  buscador?.addEventListener('input', () => {
    filtrarBanos(buscador.value.trim());
  });
  btnBuscar?.addEventListener('click', () => {
    filtrarBanos(buscador.value.trim());
  });

  async function guardarBano(event) {
    event.preventDefault();
    const form = event.target;
    const datos = Object.fromEntries(new FormData(form).entries());

    if (!datos.numero_bano || !datos.condicion || !datos.estado) {
      alert('Complete los campos obligatorios');
      return;
    }

    const resp = await fetch('/admin/inventario_banos/nuevo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const result = await resp.json();
    if (resp.ok && result.ok) {
      modal.modal('hide');
      form.removeEventListener('submit', guardarBano);
      cargarTabla();
      mostrarMensaje('Baño guardado', '');
    } else {
      mostrarMensaje(result.error || result.detail || 'Error al guardar', 'danger');
    }
  }

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
