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

window.pmDatosPersonalesData = window.pmDatosPersonalesData || {};

// === Bloquea edición posterior ===
function bloquearEdicion() {
  const form = document.getElementById('formDatosCliente');
  if (!form) return;
  const inputs = form.querySelectorAll('input');
  const bloqueo = ev => {
    ev.preventDefault();
    ev.target.blur();
    if (typeof showAlert === 'function') {
      showAlert('error-registro', 'Los datos sólo pueden modificarse desde administración');
    }
    ev.target.value = window.pmDatosPersonalesData[ev.target.name] || '';
  };
  inputs.forEach(inp => {
    inp.readOnly = true;
    inp.addEventListener('focus', bloqueo);
    inp.addEventListener('keydown', bloqueo);
    inp.addEventListener('paste', bloqueo);
    inp.addEventListener('input', bloqueo);
  });
  const btn = document.getElementById('btnGuardarDatos');
  if (btn) btn.disabled = true;
}

// === Carga datos del cliente ===
async function cargarDatosCliente() {
  try {
    const resp = await fetchConAuth('/clientes/datos_personales_api');
    if (!resp) return;
    if (!resp.ok) {
      if (resp.status === 404) return; // Cliente sin datos cargados
      throw new Error('Error al obtener datos');
    }
    const datos = await resp.json();
    window.pmDatosPersonalesData = datos || {};
    document.getElementById('nombre').value = datos.nombre || '';
    document.getElementById('apellido').value = datos.apellido || '';
    document.getElementById('dni_cuit_cuil').value = datos.dni_cuit_cuil || '';
    document.getElementById('direccion').value = datos.direccion || '';
    document.getElementById('telefono').value = datos.telefono || '';
    document.getElementById('razon_social').value = datos.razon_social || '';
    document.getElementById('email').value = datos.email || '';
    bloquearEdicion();
  } catch (err) {
    console.error('Error al obtener datos', err);
  }
}

// === Guarda datos y muestra alertas ===
async function guardarDatosCliente(ev) {
  ev.preventDefault();
  const form = document.getElementById('formDatosCliente');
  const data = {};
  new FormData(form).forEach((v, k) => { data[k] = v; });

  if (typeof showAlert === 'function') {
    await showAlert('registrando-usuario', 'Registrando...', 2000);
  }

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
        await showAlert('exito-registro', 'Registro exitoso', 2200);
      }
      setTimeout(() => {
        window.location.href = '/panel/cliente';
      }, 2000);
    } else {
      throw new Error(resJson.detail || resJson.error || 'Error al guardar los datos');
    }
  } catch (error) {
    console.error('Error al guardar los datos', error);
    if (typeof showAlert === 'function') {
      await showAlert('error-registro', 'Error al registrarse', 2400);
    }
  }
}

// === Inicio ===
document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('access_token')) {
    window.location.href = '/login';
    return;
  }
  cargarDatosCliente();
  document.getElementById('formDatosCliente')?.addEventListener('submit', guardarDatosCliente);
});
