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
  const msg = document.getElementById('msgComprobanteAdmin');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const contTabla = document.getElementById('contenedorTabla');
  const btnCancelar = document.getElementById('btnCancelarForm');

  form.style.display = 'none';

  btnNuevo.addEventListener('click', () => {
    form.style.display = 'block';
    contTabla.style.display = 'none';
    btnNuevo.style.display = 'none';
  });

  btnCancelar.addEventListener('click', () => {
    form.style.display = 'none';
    contTabla.style.display = 'block';
    btnNuevo.style.display = 'inline-block';
  });

  async function cargarComprobantes() {
    try {
      // Siempre enviamos el token en la cabecera Authorization
      const resp = await fetchConAuth('/admin/api/comprobantes_pago');
      if (!resp.ok) throw new Error('Error consultando');
      const datos = await resp.json();
      tabla.clear();
      tabla.rows.add(datos).draw();
      document.getElementById('mensajeComprobantes').style.display = datos.length ? 'none' : 'block';
      document.getElementById('mensajeComprobantes').textContent = datos.length ? '' : 'Sin registros';
      document.getElementById('errorComprobantes').classList.add('d-none');
    } catch (err) {
      console.error('Error cargando comprobantes:', err);
      const div = document.getElementById('errorComprobantes');
      div.textContent = 'No se pudo cargar el listado';
      div.classList.remove('d-none');
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
        msg.textContent = 'Comprobante cargado correctamente';
        msg.className = 'alert alert-success';
        form.reset();
        cargarComprobantes();
        btnCancelar.click();
      } else {
        throw new Error(data.detail || 'Error');
      }
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'alert alert-danger';
    }
    msg.style.display = 'block';
  });

  cargarComprobantes();
});
