// Archivo: static/js/clientes_datos_personales.js
// Proyecto: Portátiles Mercedes

function handleUnauthorized() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario_obj');
  window.location.href = '/login';
}

async function fetchConAuth(url, options = {}) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    handleUnauthorized();
    return null;
  }
  const resp = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: 'Bearer ' + token }
  });
  if (resp.status === 401) {
    handleUnauthorized();
    return null;
  }
  return resp;
}

async function cargarDatosCliente() {
  try {
    const resp = await fetchConAuth('/clientes/datos_personales_api');
    if (!resp) return;
    if (!resp.ok) throw new Error('Error al obtener datos');
    const datos = await resp.json();
    document.getElementById('nombre').value = datos.nombre || '';
    document.getElementById('apellido').value = datos.apellido || '';
    document.getElementById('dni_cuit_cuil').value = datos.dni_cuit_cuil || '';
    document.getElementById('direccion').value = datos.direccion || '';
    document.getElementById('telefono').value = datos.telefono || '';
    document.getElementById('razon_social').value = datos.razon_social || '';
    document.getElementById('email').value = datos.email || '';
  } catch (_) {
    if (typeof showAlert === 'function') {
      showAlert('error-datos', 'Error al obtener datos', false, 2500);
    }
  }
}

async function guardarDatosCliente(ev) {
  ev.preventDefault();
  const form = document.getElementById('formDatosCliente');
  const data = {};
  new FormData(form).forEach((v, k) => { data[k] = v; });

  if (typeof showAlert === 'function') {
    showAlert('enviando-mensaje', 'Enviando datos...', false, 2500);
  }
  await new Promise(r => setTimeout(r, 2500));

  try {
    const resp = await fetchConAuth('/clientes/guardar_datos_personales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!resp) return;
    const resJson = await resp.json();
    if (resp.ok) {
      if (typeof showAlert === 'function') {
        showAlert('exito-datos', 'Datos guardados correctamente', false, 2500);
      }
      await new Promise(r => setTimeout(r, 2500));
      window.location.href = '/cliente/panel';
    } else {
      throw new Error(resJson.detail || resJson.error || 'Error al guardar los datos');
    }
  } catch (error) {
    if (typeof showAlert === 'function') {
      showAlert('error-datos', 'Error al guardar los datos', false, 2500);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('access_token')) {
    window.location.href = '/login';
    return;
  }
  cargarDatosCliente();
  document.getElementById('formDatosCliente')?.addEventListener('submit', guardarDatosCliente);
});
