// Archivo: static/js/comprobantes_pago_admin.js
// Proyecto: Portátiles Mercedes

window.pmComprobantesAdminData = window.pmComprobantesAdminData || [];

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

  const tabla = window.pmTablaComprobantesAdmin
    ? window.pmTablaComprobantesAdmin
    : $('#tablaComprobantes').DataTable({
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
  window.pmTablaComprobantesAdmin = tabla;

  const buscador = document.getElementById('busquedaComprobantes');
  const btnBuscar = document.getElementById('btnBuscarComprobante');
  const form = document.getElementById('formComprobanteAdmin');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const contTabla = document.getElementById('contenedorTabla');
  const contControles = document.getElementById('contenedorControles');
  const btnCancelar = document.getElementById('btnCancelarForm');
  const btnEliminar = document.getElementById('btnEliminarComprobantes');
  const checkTodos = document.getElementById('checkTodosComprobantes');
  const btnBuscarCliente = document.getElementById('btnBuscarClienteComprobante');
  const btnAgregarCliente = document.getElementById('btnAgregarClienteComprobante');
  const filtroClientes = document.getElementById('filtroClientesComprobante');
  window.pmComprobantesAdminData = window.pmComprobantesAdminData || [];
  let clientesModal = [];
  let tablaClientes = null;

  async function cargarClientesModal(texto = '') {
    try {
      const resp = await fetch(`/admin/api/clientes/busqueda?q=${encodeURIComponent(texto)}`);
      if (!resp.ok) throw new Error('Error');
      const data = await resp.json();
      clientesModal = data.clientes || [];
      tablaClientes.clear();
      tablaClientes.rows.add(clientesModal).draw();
    } catch (err) {
      console.error('Error al buscar clientes', err);
    }
  }

  function abrirModalClientes() {
    tablaClientes = $('#tablaClientesComprobante').DataTable({
      language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
      paging: true,
      searching: false,
      ordering: true,
      columns: [
        { data: 'dni_cuit_cuil', render: d => `<input type="checkbox" class="seleccion-cliente" value="${d}">`, orderable: false },
        { data: 'nombre' },
        { data: 'dni_cuit_cuil' },
        { data: 'razon_social' }
      ]
    });

    cargarClientesModal('');

    filtroClientes?.addEventListener('input', () => {
      cargarClientesModal(filtroClientes.value.trim());
    });

    $('#tablaClientesComprobante tbody').on('change', '.seleccion-cliente', function() {
      $('#tablaClientesComprobante tbody .seleccion-cliente').not(this).prop('checked', false);
      if (btnAgregarCliente) btnAgregarCliente.disabled = !this.checked;
    });

    $('#modalClientesComprobante').on('hidden.bs.modal', function() {
      $('#tablaClientesComprobante').DataTable().destroy();
      this.remove();
    });

    $('#modalClientesComprobante').modal('show');
  }

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

    const start = Date.now();

    try {
      for (const ch of checks) {
        const id = ch.dataset.id;
        await fetchConAuth(`/admin/api/comprobantes_pago/${id}`, {
          method: 'DELETE'
        });
      }

      await cargarComprobantes();
      actualizarBtnEliminar();
      const delay = Math.max(0, 1600 - (Date.now() - start));
      setTimeout(() => {
      }, delay);
    } catch (e) {
      const delay = Math.max(0, 1600 - (Date.now() - start));
      setTimeout(() => {
      }, delay);
      console.error('Error eliminando', e);
    }
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
    const filtrados = window.pmComprobantesAdminData.filter(c =>
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
      window.pmComprobantesAdminData = await resp.json();
      mostrarComprobantes(window.pmComprobantesAdminData);
      document.querySelectorAll('.pm-check').forEach(c => (c.checked = false));
      actualizarBtnEliminar();
    } catch (err) {
      console.error('Error cargando comprobantes:', err);
    }
  }

  btnBuscarCliente?.addEventListener('click', abrirModalClientes);

  btnAgregarCliente?.addEventListener('click', () => {
    const seleccionado = document.querySelector('#tablaClientesComprobante tbody .seleccion-cliente:checked');
    if (!seleccionado) return;
    const cliente = clientesModal.find(c => c.dni_cuit_cuil == seleccionado.value);
    if (cliente) {
      document.querySelector('input[name="dni_cuit_cuil"]').value = cliente.dni_cuit_cuil;
      document.querySelector('input[name="nombre_cliente"]').value = cliente.nombre;
      document.querySelector('input[name="razon_social"]').value = cliente.razon_social;
    }
    $('#modalClientesComprobante').modal('hide');
    seleccionado.checked = false;
    if (btnAgregarCliente) btnAgregarCliente.disabled = true;
  });

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const datos = new FormData(form);

    for (const [_, v] of datos.entries()) {
      if (!v) {
        return;
      }
    }

    try {
      const resp = await fetch('/admin/comprobantes', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (resp.ok && res.ok) {
        setTimeout(() => {
          location.href = '/admin/comprobantes';
        }, 1500);
      } else {
        throw new Error(res.detail || 'Error al subir comprobante');
      }
    } catch (err) {
    }
  });

  checkTodos?.addEventListener('change', () => {
    const val = checkTodos.checked;
    document.querySelectorAll('.pm-check').forEach(c => (c.checked = val));
    actualizarBtnEliminar();
  });

  if (window.pmComprobantesAdminData.length === 0) {
    cargarComprobantes();
  } else {
    mostrarComprobantes(window.pmComprobantesAdminData);
    actualizarBtnEliminar();
  }
});
