// Archivo: static/js/clientes_comprobantes.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  // Verificar token, si falta redirigir a login
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
      headers: { ...options.headers, Authorization: 'Bearer ' + token }
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
        data: null,
        orderable: false,
        render: d => `<input type="checkbox" class="pm-check" data-id="${d.id}">`
      },
      { data: 'nombre_cliente' },
      { data: 'dni_cuit_cuil' },
      { data: 'numero_factura' },
      { data: 'comprobante_url', render: d => `<a href="${d}" target="_blank">Ver</a>` },
      { data: 'fecha_envio' }
    ]
  });

  const buscador = document.getElementById('busquedaComprobantes');
  const btnBuscar = document.getElementById('btnBuscarComprobante');
  let registros = [];

  const form = document.getElementById('formComprobante');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const contTabla = document.getElementById('contenedorTabla');
  const btnCancelar = document.getElementById('btnCancelarForm');
  const btnEliminar = document.getElementById('btnEliminarComprobantes');

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
    let dni = localStorage.getItem('dni_cuit_cuil');
    if (!dni) {
      const usr = localStorage.getItem('usuario_obj');
      if (usr) {
        try { dni = JSON.parse(usr).dni_cuit_cuil; } catch (e) {}
      }
    }
    for (const ch of checks) {
      const id = ch.dataset.id;
      try {
        await fetchConAuth(`/api/comprobantes_pago/${id}?dni_cuit_cuil=${dni}`, {
          method: 'DELETE'
        });
      } catch (e) { console.error('Error eliminando', e); }
    }
    await cargarComprobantes();
    actualizarBtnEliminar();
  });

  if (form) form.classList.add('d-none');

  btnNuevo?.addEventListener('click', () => {
    form?.classList.remove('d-none');
    contTabla?.classList.add('d-none');
    btnNuevo?.classList.add('d-none');
  });

  btnCancelar?.addEventListener('click', () => {
    form?.classList.add('d-none');
    contTabla?.classList.remove('d-none');
    btnNuevo?.classList.remove('d-none');
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
      String(c.numero_factura || '').toLowerCase().includes(q)
    );
    mostrarComprobantes(filtrados);
    if (filtrados.length === 0) {
    }
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);


  async function cargarComprobantes() {
    let dni = localStorage.getItem('dni_cuit_cuil');
    if (!dni) {
      const usr = localStorage.getItem('usuario_obj');
      if (usr) {
        try {
          dni = JSON.parse(usr).dni_cuit_cuil;
        } catch (e) { /* ignore */ }
      }
    }
    if (!dni) {
      console.error('No se encontró DNI del cliente en localStorage');
      return;
    }
    try {
      const resp = await fetchConAuth(`/api/comprobantes_pago?dni_cuit_cuil=${dni}`);
      if (!resp.ok) throw new Error('Error consultando comprobantes');
      registros = await resp.json();
      mostrarComprobantes(registros);
      document.querySelectorAll('.pm-check').forEach(c => (c.checked = false));
      actualizarBtnEliminar();
      if (registros.length === 0) {
      }
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
      const resp = await fetch('/api/comprobantes_pago', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (resp.ok && res.ok) {
        form.reset();
        await cargarComprobantes();
        btnCancelar?.click();
        actualizarBtnEliminar();
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Comprobante subido', false, 2600);
        }
      } else {
        throw new Error(res.detail || 'Error al subir');
      }
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al subir comprobante', false, 2600);
      }
    }
  });

  cargarComprobantes();
});
