// Archivo: static/js/comprobantes_pago_admin.js
// Proyecto: Portátiles Mercedes

document.addEventListener('DOMContentLoaded', () => {
  // Si el token no existe, se redirige al login
  if (!localStorage.getItem('access_token')) {
    window.location.href = '/login';
    return;
  }

  // Maneja expiración o ausencia de token durante las peticiones
  function handleUnauthorized() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    localStorage.removeItem('nombre');
    window.location.href = '/login';
  }

  // Helper para realizar fetch con la cabecera de autenticación
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
      { data: 'nombre_cliente' },
      { data: 'dni_cuit_cuil' },
      { data: 'numero_factura' },
      { data: 'comprobante_url', render: d => `<a href="${d}" target="_blank">Ver</a>` },
      { data: 'fecha_envio' }
    ]
  });

  const form = document.getElementById('formComprobanteAdmin');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const contTabla = document.getElementById('contenedorTabla');
  const btnCancelar = document.getElementById('btnCancelarForm');
  const buscador = document.getElementById('busquedaComprobantes');
  const btnBuscar = document.getElementById('btnBuscarComprobantes');
  const esRutaNuevo = window.location.pathname.endsWith('/admin/comprobantes/nuevo');
  let registros = [];

  form.style.display = 'none';

  if (esRutaNuevo) {
    form.style.display = 'block';
    contTabla.style.display = 'none';
    if (btnNuevo) btnNuevo.style.display = 'none';
  }

  btnNuevo.addEventListener('click', () => {
    window.location.href = '/admin/comprobantes/nuevo';
  });

  btnCancelar.addEventListener('click', () => {
    if (esRutaNuevo) {
      window.location.href = '/admin/comprobantes';
    } else {
      form.style.display = 'none';
      contTabla.style.display = 'block';
      btnNuevo.style.display = 'inline-block';
    }
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
  }

  buscador?.addEventListener('input', filtrar);
  btnBuscar?.addEventListener('click', filtrar);

  async function cargarComprobantes() {
    try {
      const resp = await fetchConAuth('/admin/api/comprobantes_pago');
      if (!resp.ok) throw new Error('Error consultando');
      registros = await resp.json();
      mostrarComprobantes(registros);
      document.getElementById('mensajeComprobantes').style.display = registros.length ? 'none' : 'block';
      document.getElementById('mensajeComprobantes').textContent = registros.length ? '' : 'Sin registros';
      document.getElementById('errorComprobantes').classList.add('d-none');
    } catch (err) {
      console.error('Error cargando comprobantes:', err);
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'No se pudo cargar el listado', false, 2600);
      }
    }
  }

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
        if (esRutaNuevo) {
          if (typeof showAlert === 'function') {
            showAlert('exito-datos', 'Comprobante agregado', false, 2600);
          }
          setTimeout(() => {
            window.location.href = '/admin/comprobantes';
          }, 1600);
        } else {
          form.reset();
          cargarComprobantes();
          btnCancelar.click();
          if (typeof showAlert === 'function') {
            showAlert('exito-datos', 'Comprobante agregado', false, 2600);
          }
        }
      } else {
        throw new Error(data.detail || 'Error');
      }
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('error-datos', 'Error al guardar comprobante', false, 2600);
      }
    }
  });

  cargarComprobantes();
});
