// Archivo: cliente_panel.js
// Proyecto: Portátiles Mercedes

// Función para limpiar credenciales
function limpiarCredenciales() {
  localStorage.clear();
  window.location.href = '/login';
}

// Peticiones con autorización
async function fetchConAuth(url, options = {}) {
  const token = localStorage.getItem('access_token');
  const resp = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
  if (resp.status === 401) {
    limpiarCredenciales();
    throw new Error('Unauthorized');
  }
  return resp;
}

// Inicialización de tablas DataTables
let tablas = {};
function initTablas() {
  const opciones = {
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
  };

  tablas = {
    alquileres: $('#tablaAlquileres').DataTable(opciones),
    facturas: $('#tablaFacturasPendientes').DataTable(opciones),
    ventas: $('#tablaVentasCliente').DataTable(opciones),
    limpiezas: $('#tablaServicios').DataTable(opciones),
    programacion: $('#tablaProgramacion').DataTable(opciones),
    comprobantes: $('#tablaComprobantes').DataTable({
      ...opciones,
      columnDefs: [{ targets: 0, orderable: false }],
    }),
  };
}

// Mostrar una sola sección a la vez (Dashboard por defecto)
function ocultarTodasSecciones() {
  document.getElementById('dashboard-resumen').style.display = 'none';
  document.getElementById('seccion-alquileres').style.display = 'none';
  document.getElementById('seccion-datos-personales').style.display = 'none';
  document.getElementById('seccion-facturas-pendientes').style.display = 'none';
  document.getElementById('seccion-comprobantes').style.display = 'none';
  document.getElementById('seccion-ventas').style.display = 'none';
  document.getElementById('seccion-limpiezas').style.display = 'none';
  document.getElementById('seccion-programacion-limpiezas').style.display = 'none';
  document.getElementById('seccion-reportes').style.display = 'none';
  document.getElementById('seccion-emails').style.display = 'none';
}

// Mapear anchor hash a id de sección
const mapaSecciones = {
  '#dashboard': 'dashboard-resumen',
  '#seccion-alquileres': 'seccion-alquileres',
  '#seccion-datos-personales': 'seccion-datos-personales',
  '#seccion-facturas-pendientes': 'seccion-facturas-pendientes',
  '#seccion-comprobantes': 'seccion-comprobantes',
  '#seccion-ventas': 'seccion-ventas',
  '#seccion-limpiezas': 'seccion-limpiezas',
  '#seccion-programacion-limpiezas': 'seccion-programacion-limpiezas',
  '#seccion-reportes': 'seccion-reportes',
  '#seccion-emails': 'seccion-emails',
};

// Navegación entre secciones
function mostrarSeccionDesdeHash() {
  ocultarTodasSecciones();
  let hash = window.location.hash || '#dashboard';
  if (!mapaSecciones[hash]) hash = '#dashboard';
  document.getElementById(mapaSecciones[hash]).style.display = 'block';
  // Enfocar el primer campo del form si es datos personales
  if (hash === '#seccion-datos-personales') {
    document.getElementById('nombre')?.focus();
  }
}

// Listener para los links del sidebar
document.addEventListener('DOMContentLoaded', () => {
  // Oculta todas menos el dashboard al inicio
  ocultarTodasSecciones();
  document.getElementById('dashboard-resumen').style.display = 'block';

  // Inicializa tablas
  initTablas();

  // Manejo de navegación
  document.querySelectorAll('.nav-sidebar .nav-link[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      window.location.hash = link.getAttribute('href');
    });
  });

  // Cuando cambia el hash (URL ancla), mostrar la sección correspondiente
  window.addEventListener('hashchange', mostrarSeccionDesdeHash);

  // Mostrar la sección correcta al cargar la página
  mostrarSeccionDesdeHash();

  // ... El resto de tu código EXISTENTE para cargar datos, manejar forms, etc ...
  // (Pegar acá todo tu código JS original, sin la lógica de ocultar/secciones)

  // ----- Copia aquí todo lo de DataTables, fetch, forms, etc -----
  // ----- (desde la versión que me pasaste arriba) -----
  // [PEGA EL RESTO DE TU JS ACÁ]
});
