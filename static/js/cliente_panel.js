// Archivo: static/js/cliente_panel.js
// Lógica del panel de clientes, siguiendo el patrón modular del panel de empleados.

/**
 * Oculta todas las secciones del dashboard de clientes.
 */
function ocultarTodasLasSecciones() {
  [
    'dashboard-resumen',
    'seccion-datos-personales',
    'seccion-alquileres',
    'seccion-facturas-pendientes',
    'seccion-comprobantes',
    'seccion-ventas',
    'seccion-limpiezas',
    'seccion-emails'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

/**
 * Muestra la sección correspondiente según el hash.
 */
function mostrarSeccionDesdeHash() {
  ocultarTodasLasSecciones();
  const hash = window.location.hash || '#dashboard';
  const mapa = {
    '#dashboard': 'dashboard-resumen',
    '#seccion-datos-personales': 'seccion-datos-personales',
    '#seccion-alquileres': 'seccion-alquileres',
    '#seccion-facturas-pendientes': 'seccion-facturas-pendientes',
    '#seccion-comprobantes': 'seccion-comprobantes',
    '#seccion-ventas': 'seccion-ventas',
    '#seccion-limpiezas': 'seccion-limpiezas',
    '#seccion-emails': 'seccion-emails'
  };
  const id = mapa[hash] || 'dashboard-resumen';
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
  if (id === 'seccion-datos-personales') {
    document.getElementById('nombre')?.focus();
  }
}

/**
 * Inicializa listeners de navegación lateral.
 */
function initSidebarNav() {
  document.querySelectorAll('.nav-sidebar .nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      window.location.hash = link.getAttribute('href');
    });
  });
}

// ========== Lógica de carga y guardado de datos personales ==========
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

// ========== Inicialización general ==========
document.addEventListener('DOMContentLoaded', () => {
  ocultarTodasLasSecciones();
  document.getElementById('dashboard-resumen').style.display = 'block';
  initSidebarNav();
  window.addEventListener('hashchange', mostrarSeccionDesdeHash);
  mostrarSeccionDesdeHash();

  // Inicialización de datos personales
  if (document.getElementById('formDatosCliente')) {
    cargarDatosCliente();
    document.getElementById('formDatosCliente').addEventListener('submit', guardarDatosCliente);
  }

  // Aquí podés inicializar otras tablas, componentes y lógica SPA del panel de clientes
});
