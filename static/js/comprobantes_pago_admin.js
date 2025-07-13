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
      headers: { ...options.headers, Authorization: 'Bearer ' + token }
    });
    if (resp.status === 401) {
      handleUnauthorized();
      throw new Error('Unauthorized');
    }
    return resp;
  }

  // Inicialización DataTable
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
  const btnCancelar = document.getElementById('btnCancelarForm');
  const buscador = document.getElementById('busquedaComprobantes');
  const btnBuscar = document.getElementById('btnBuscarComprobantes');
  const btnEditar = document.getElementById('btnEditarComprobante');
  const btnEliminar = document.getElementById('btnEliminarComprobantes');
  let registros = [];

  // Mostrar solo la tabla al inicio
  form.classList.add('d-none');
  contTabla.classList.remove('d-none');

  btnNuevo?.addEventListener('click', () => {
    form.classList.remove('d-none');
    contTabla.classList.add('d-none');
    btnNuevo.classList.add('d-none');
    buscador?.classList.add('d-none');
    btnBuscar?.classList.add('d-none');
    btnEditar?.classList.add('d-none');
    btnEliminar?.classList.add('d-none');
  });

  btnCancelar?.addEventListener('click', () => {
    window.location.href = '/admin/comprobantes_pago';
  });

  // Filtrar comprobantes por texto
  function filtrar() {
    const q = (buscador.value || '').toLowerCase();
    const filtrados = registros.filter(c =>
      (c.nombre_cliente || '').toLowerCase().includes(q) ||
      (c.dni_cuit_cuil || '').toLowerCase().includes(q)
    );
    mostrarComprobantes(filtrados);
  }
  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  // Cargar registros desde la API
  async function cargarComprobantes() {
    try {
      const resp = await fetchConAuth('/admin/api/comprobantes_pago');
      if (!resp.ok) throw new Error('Error consultando');
      registros = await resp.json();
      mostrarComprobantes(registros);
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'No se pudo cargar el listado', false, 2600);
      }
    }
  }

  function mostrarComprobantes(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  // Envío de formulario
  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    const formData = new FormData(form);
    try {
      const resp = await fetchConAuth('/admin/api/comprobantes_pago', {
        method: 'POST',
        body: formData
      });
      if (resp.ok) {
        if (typeof showAlert === 'function') {
          showAlert('exito-datos', 'Comprobante agregado', false, 2600);
        }
        setTimeout(() => {
          window.location.href = '/admin/comprobantes_pago';
        }, 1600);
      } else {
        throw new Error('Error al guardar');
      }
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al guardar comprobante', false, 2600);
      }
    }
  });

  // Conexión del botón Editar (lógica futura, solo referencia)
  btnEditar?.addEventListener('click', () => {
    // Aquí deberías implementar la lógica de edición cuando esté disponible
    alert('Funcionalidad de edición próximamente');
  });

  cargarComprobantes();
});
