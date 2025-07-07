// Archivo: static/js/cliente_panel.js
// Lógica e interacción del panel de clientes

// Navegación SPA
function ocultarTodasLasSecciones() {
  ['dashboard', 'datos-personales'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function mostrarSeccionDesdeHash() {
  ocultarTodasLasSecciones();
  const hash = window.location.hash || '#dashboard';
  const mapa = {
    '#dashboard': 'dashboard',
    '#datos-personales': 'datos-personales'
  };
  const id = mapa[hash] || 'dashboard';
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
  if (id === 'datos-personales') {
    document.getElementById('nombre')?.focus();
  }
}

// Sidebar navigation
function initSidebarNav() {
  document.querySelectorAll('.nav-sidebar .nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      window.location.hash = link.getAttribute('href');
    });
  });
}

// Cargar datos personales
async function cargarDatosCliente() {
  try {
    const usuario = localStorage.getItem('usuario');
    if (!usuario) throw new Error("Sesión expirada. Vuelva a iniciar sesión.");
    const resp = await fetch(`/info_datos_cliente?email=${encodeURIComponent(usuario)}`);
    if (!resp.ok) throw new Error("No se pudo obtener los datos del cliente");
    const datos = await resp.json();
    for (const [key, value] of Object.entries(datos)) {
      const el = document.getElementById(key);
      if (el) el.value = value || "";
    }
  } catch (error) {
    document.getElementById("mensajeErrorDatosCliente").textContent = error.message;
    document.getElementById("mensajeErrorDatosCliente").style.display = "inline";
  }
}

// Guardar datos personales
async function guardarDatosCliente(e) {
  e.preventDefault();
  document.getElementById("mensajeExitoDatosCliente").style.display = "none";
  document.getElementById("mensajeErrorDatosCliente").style.display = "none";
  try {
    const form = document.getElementById("formDatosCliente");
    const datos = Object.fromEntries(new FormData(form).entries());
    const resp = await fetch('/guardar_datos_cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const resultado = await resp.json();
    if (resp.ok) {
      document.getElementById("mensajeExitoDatosCliente").style.display = "inline";
    } else {
      throw new Error(resultado.error || "Error al guardar los datos");
    }
  } catch (error) {
    document.getElementById("mensajeErrorDatosCliente").textContent = error.message;
    document.getElementById("mensajeErrorDatosCliente").style.display = "inline";
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  ocultarTodasLasSecciones();
  document.getElementById('dashboard').style.display = 'block';
  initSidebarNav();
  window.addEventListener('hashchange', mostrarSeccionDesdeHash);
  mostrarSeccionDesdeHash();
  // Datos personales
  if (document.getElementById('formDatosCliente')) {
    cargarDatosCliente();
    document.getElementById('formDatosCliente').addEventListener('submit', guardarDatosCliente);
  }
});
