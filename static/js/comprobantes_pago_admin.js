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
        data: null,
        orderable: false,
        render: d => `<input type="checkbox" class="pm-check" data-id="${d.id}">`
      },
      { data: 'nombre_cliente' },
      { data: 'dni_cuit_cuil' },
      { data: 'razon_social', defaultContent: '' },
      { data: 'numero_de_factura' },
      {
        data: 'comprobante_url',
        render: d => d ? `<a href="${d}" target="_blank">VER PAGO</a>` : ''
      },
      {
        data: 'fecha_envio',
        render: fecha => {
          if (!fecha) return '';
          const f = new Date(fecha);
          return `${f.toLocaleDateString('es-AR')} ${f.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
        }
      }
    ]
  });

  const buscador = document.getElementById('busquedaComprobantes');
  const btnBuscar = document.getElementById('btnBuscarComprobante');
  const form = document.getElementById('formComprobanteAdmin');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const contTabla = document.getElementById('contenedorTabla');
  const contControles = document.getElementById('contenedorControles');
  const btnCancelar = document.getElementById('btnCancelarForm');
  const btnEliminar = document.getElementById('btnEliminarComprobantes');
  const checkTodos = document.getElementById('checkTodosComprobantes');
  let registros = [];

  function actualizarBtnEliminar() {
    if (!btnEliminar) return;
    const marcados = document.querySelectorAll('.pm-check:checked').length;
    btnEliminar.disabled = marcados === 0;
  }

  document.addEventListener('change', ev => {
    if (ev.target.matches('.pm-check')) actualizarBtnEliminar();
  });

  btnEliminar?.addEventListener('click', async () => {
    const checks = document.querySelectorAll('.pm-check:checked');
    if (!checks.length) return;

    for (const ch of checks) {
      const id = ch.dataset.id;
      try {
        await fetchConAuth(`/admin/api/comprobantes_pago/${id}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.error('Error eliminando', e);
      }
    }

    await cargarComprobantes();
    actualizarBtnEliminar();
  });

  btnNuevo?.addEventListener('click', () => {
    form?.classList.remove('d-none');
    contTabla?.classList.add('d-none');
    contControles?.remove();
  });

  btnCancelar?.addEventListener('click', () => {
    form?.classList.add('d-none');
    location.href = '/admin/comprobantes';
  });

  function mostrarComprobantes(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
    const filtrados = registros.filter(c =>
      (c.nombre_cliente || '').toLowerCase().includes(q) ||
      (c.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (c.razon_social || '').toLowerCase().includes(q) ||
      (c.numero_de_factura || '').toLowerCase().includes(q) ||
      (c.comprobante_url || '').toLowerCase().includes(q)
    );
    mostrarComprobantes(filtrados);
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  async function cargarComprobantes() {
    try {
      const resp = await fetchConAuth('/admin/api/comprobantes_pago');
      if (!resp.ok) throw new Error('Error consultando comprobantes');
      registros = await resp.json();
      mostrarComprobantes(registros);
      document.querySelectorAll('.pm-check').forEach(c => (c.checked = false));
      actualizarBtnEliminar();
    } catch (err) {
      console.error('Error cargando comprobantes:', err);
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'No se pudo cargar el listado', false, 2600);
      }
    }
  }

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const datos = new FormData(form);
    try {
      const resp = await fetch('/admin/comprobantes', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (resp.ok && res.ok) {
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Comprobante subido correctamente', false, 2600);
        }
        setTimeout(() => {
          location.href = '/admin/comprobantes';
        }, 1600);
      } else {
        throw new Error(res.detail || 'Error al subir comprobante');
      }
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al subir comprobante', false, 2600);
      }
    }
  });

  checkTodos?.addEventListener('change', () => {
    const val = checkTodos.checked;
    document.querySelectorAll('.pm-check').forEach(c => (c.checked = val));
    actualizarBtnEliminar();
  });

  cargarComprobantes();
});
