// Archivo: static/js/comprobantes_pago_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('access_token')) {
    window.location.href = '/login';
    return;
  }

  function handleUnauthorized() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    localStorage.removeItem('nombre');
    window.location.href = '/login';
  }

  async function fetchConAuth(url, options = {}) {
    const token = localStorage.getItem('access_token');
    if (!token) {
      handleUnauthorized();
      throw new Error('Token faltante');
    }
    const resp = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
    });
    if (resp.status === 401) {
      handleUnauthorized();
      throw new Error('Unauthorized');
    }
    return resp;
  }

  const tabla = $('#tablaComprobantes').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      {
        data: 'id_comprobante',
        render: id => `<input type="checkbox" class="check-comprobante" value="${id}">`,
        orderable: false
      },
      { data: 'nombre_cliente' },
      { data: 'dni_cuit_cuil' },
      {
        data: 'factura_url',
        render: url => url ? `<a href="${url}" target="_blank">VER FACTURA</a>` : '—'
      },
      {
        data: 'comprobante_url',
        render: url => url ? `<a href="${url}" target="_blank">VER PAGO</a>` : '—'
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
  const checkTodos = document.getElementById('checkTodosComprobantes');
  let registros = [];

  function mostrarFormulario() {
    form.classList.remove('d-none');
    contTabla.classList.add('d-none');
    contControles.remove();
  }

  function ocultarFormulario() {
    form.classList.add('d-none');
    location.reload();
  }

  btnNuevo?.addEventListener('click', mostrarFormulario);
  btnCancelar?.addEventListener('click', ocultarFormulario);

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const formData = new FormData(form);
    try {
      const resp = await fetchConAuth('/admin/comprobantes', {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();
      if (resp.ok) {
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Comprobante agregado', false, 2600);
        }
        setTimeout(() => {
          window.location.href = '/admin/comprobantes_pago';
        }, 1600);
      } else {
        throw new Error(data.detail || 'Error');
      }
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al guardar comprobante', false, 2600);
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

  function actualizarEstadoEliminar() {
    const seleccionados = document.querySelectorAll('.check-comprobante:checked');
    btnEliminar.disabled = seleccionados.length === 0;
    btnEliminar.classList.toggle('d-none', seleccionados.length === 0);
  }

  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('check-comprobante') || e.target === checkTodos) {
      if (e.target === checkTodos) {
        const todos = document.querySelectorAll('.check-comprobante');
        todos.forEach(chk => chk.checked = checkTodos.checked);
      }
      actualizarEstadoEliminar();
    }
  });

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('.check-comprobante:checked'))
      .map(chk => parseInt(chk.value));

    if (ids.length === 0) return;

    const confirmar = confirm(`¿Eliminar ${ids.length} comprobante(s)?`);
    if (!confirmar) return;

    try {
      const resp = await fetchConAuth('/admin/api/comprobantes_pago', {
        method: 'DELETE',
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error eliminando');
      await cargarComprobantes();
      btnEliminar.disabled = true;
      btnEliminar.classList.add('d-none');
      checkTodos.checked = false;
      if (typeof showAlert === 'function') {
        showAlert('exito-datos', 'Comprobante(s) eliminado(s)', false, 2000);
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'No se pudo eliminar', false, 2600);
      }
    }
  });

  cargarComprobantes();
});
