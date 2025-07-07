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
      { data: 'nombre_cliente' },
      { data: 'dni_cuit_cuil' },
      { data: 'numero_factura' },
      { data: 'comprobante_url', render: d => `<a href="${d}" target="_blank">Ver</a>` },
      { data: 'fecha_envio' }
    ]
  });

  const form = document.getElementById('formComprobante');
  const msg = document.getElementById('msgComprobante');
  const btnNuevo = document.getElementById('btnMostrarForm');
  const contTabla = document.getElementById('contenedorTabla');
  const btnCancelar = document.getElementById('btnCancelarForm');

  if (form) form.style.display = 'none';

  btnNuevo?.addEventListener('click', () => {
    form.style.display = 'block';
    contTabla.style.display = 'none';
    btnNuevo.style.display = 'none';
  });

  btnCancelar?.addEventListener('click', () => {
    form.style.display = 'none';
    contTabla.style.display = 'block';
    btnNuevo.style.display = 'inline-block';
  });

  async function cargarComprobantes() {
    const dni = localStorage.getItem('dni_cuit_cuil');
    if (!dni) {
      console.error('No se encontró DNI del cliente en localStorage');
      return;
    }
    try {
      const resp = await fetchConAuth(`/api/comprobantes_pago?dni_cuit_cuil=${dni}`);
      if (!resp.ok) throw new Error('Error consultando comprobantes');
      const datos = await resp.json();
      tabla.clear();
      tabla.rows.add(datos).draw();
      const mensaje = document.getElementById('mensajeComprobantes');
      if (mensaje) {
        mensaje.style.display = datos.length ? 'none' : 'block';
        mensaje.textContent = datos.length ? '' : 'Sin registros';
      }
      const errorDiv = document.getElementById('errorComprobantes');
      if (errorDiv) errorDiv.classList.add('d-none');
    } catch (err) {
      console.error('Error cargando comprobantes:', err);
      const div = document.getElementById('errorComprobantes');
      if (div) {
        div.textContent = 'No se pudo cargar el listado';
        div.classList.remove('d-none');
      }
    }
  }

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    msg.classList.add('d-none');
    const datos = new FormData(form);
    try {
      const resp = await fetch('/api/comprobantes_pago', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: datos
      });
      const res = await resp.json();
      if (resp.ok && res.ok) {
        msg.textContent = 'Comprobante cargado correctamente';
        msg.className = 'alert alert-success';
        form.reset();
        await cargarComprobantes();
        btnCancelar?.click();
      } else {
        throw new Error(res.detail || 'Error al subir');
      }
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'alert alert-danger';
    }
    msg.classList.remove('d-none');
  });

  cargarComprobantes();
});
