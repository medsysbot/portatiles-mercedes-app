// Archivo: static/js/comprobantes_pago_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('access_token')) {
    window.location.href = '/login';
    return;
  }

  function handleUnauthorized() {
    localStorage.clear();
    window.location.href = '/login';
  }

  async function fetchConAuth(url, options = {}) {
    const token = localStorage.getItem('access_token');
    if (!token) handleUnauthorized();

    const resp = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: 'Bearer ' + token
      }
    });
    if (resp.status === 401) handleUnauthorized();
    return resp;
  }

  const tabla = $('#tablaComprobantes').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      {
        data: 'id',
        render: id => `<input type="checkbox" class="check-comprobante" value="${id}">`,
        orderable: false
      },
      { data: 'nombre_cliente' },
      { data: 'dni_cuit_cuil' },
      {
        data: 'factura_url',
        render: url => url ? `<a href="${url}" target="_blank">VER FACTURA</a>` : ''
      },
      {
        data: 'comprobante_url',
        render: url => url ? `<a href="${url}" target="_blank">VER PAGO</a>` : ''
      },
      {
        data: 'fecha_envio',
        render: fecha => {
          if (!fecha) return '';
          const d = new Date(fecha);
          return `${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
        }
      }
    ]
  });

  const form = document.getElementById('formComprobanteAdmin');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const contTabla = document.getElementById('contenedorTabla');
  const contControles = document.getElementById('contenedorControles');
  const btnCancelar = document.getElementById('btnCancelarForm');
  const buscador = document.getElementById('busquedaComprobantes');
  const btnBuscar = document.getElementById('btnBuscarComprobantes');
  const btnEliminar = document.getElementById('btnEliminarComprobantes');
  const btnEditar = document.getElementById('btnEditarComprobante');
  let registros = [];

  function mostrarFormulario() {
    form.classList.remove('d-none');
    contTabla.classList.add('d-none');
    contControles?.remove();
  }

  function ocultarFormulario() {
    form.classList.add('d-none');
    location.href = '/admin/comprobantes';
  }

  btnNuevo?.addEventListener('click', mostrarFormulario);
  btnCancelar?.addEventListener('click', ocultarFormulario);

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const formData = new FormData(form);
    const isEdit = !!form.dataset.editing;
    const url = isEdit
      ? `/admin/api/comprobantes_pago/${form.dataset.editing}`
      : '/admin/comprobantes';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const resp = await fetchConAuth(url, {
        method,
        body: formData
      });
      const data = await resp.json();
      if (resp.ok) {
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', isEdit ? 'Comprobante actualizado' : 'Comprobante agregado', false, 2600);
        }
        setTimeout(() => {
          location.href = '/admin/comprobantes';
        }, 1600);
      } else {
        throw new Error(data.detail || 'Error');
      }
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', isEdit ? 'Error al editar' : 'Error al guardar', false, 2600);
      }
    }
  });

  async function cargarComprobantes() {
    try {
      const resp = await fetchConAuth('/admin/api/comprobantes_pago');
      if (!resp.ok) throw new Error('Error consultando');
      registros = await resp.json();
      tabla.clear().rows.add(registros).draw();
    } catch (err) {
      console.error('Error cargando comprobantes:', err);
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'No se pudo cargar el listado', false, 2600);
      }
    }
  }

  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
    const filtrados = registros.filter(c =>
      (c.nombre_cliente || '').toLowerCase().includes(q) ||
      (c.dni_cuit_cuil || '').toLowerCase().includes(q)
    );
    tabla.clear().rows.add(filtrados).draw();
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  btnEliminar?.addEventListener('click', async () => {
    const seleccionados = Array.from(document.querySelectorAll('.check-comprobante:checked'))
      .map(chk => chk.value);

    if (!seleccionados.length) {
      alert('Seleccione al menos un comprobante');
      return;
    }

    if (!confirm(`¿Eliminar ${seleccionados.length} comprobante(s)?`)) return;

    try {
      for (const id of seleccionados) {
        const resp = await fetchConAuth(`/admin/api/comprobantes_pago/${id}`, {
          method: 'DELETE'
        });
        if (!resp.ok) throw new Error('Error al eliminar');
      }
      if (typeof showAlert === 'function') {
        showAlert('exito-datos', 'Eliminados correctamente', false, 2400);
      }
      cargarComprobantes();
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'No se pudo eliminar', false, 2600);
      }
    }
  });

  btnEditar?.addEventListener('click', async () => {
    const seleccionado = document.querySelectorAll('.check-comprobante:checked');
    if (seleccionado.length !== 1) {
      alert('Seleccione exactamente un comprobante para editar');
      return;
    }

    const id = seleccionado[0].value;
    const registro = registros.find(r => String(r.id) === id);
    if (!registro) return;

    // Prellenar formulario
    document.getElementById('nombreAdmin').value = registro.nombre_cliente || '';
    document.getElementById('dniAdmin').value = registro.dni_cuit_cuil || '';

    mostrarFormulario();
    form.dataset.editing = id;
  });

  cargarComprobantes();
});
