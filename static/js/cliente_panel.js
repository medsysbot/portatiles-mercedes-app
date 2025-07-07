// Archivo: cliente_panel.js
// Proyecto: Portátiles Mercedes
// Descripción: Lógica del dashboard de clientes. 
// Sigue el patrón modular y de comentarios de la referencia.

// =================== 1. Utilidades y Autenticación ===================

/**
 * Limpia las credenciales almacenadas y redirige al login.
 */
function limpiarCredenciales() {
  localStorage.clear();
  window.location.href = '/login';
}

/**
 * Realiza una petición fetch con autorización por token JWT.
 * @param {string} url - Endpoint a consultar.
 * @param {object} [options={}] - Opciones fetch (headers, method, etc).
 * @returns {Promise<Response>}
 */
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
    throw new Error('No autorizado');
  }
  return resp;
}

// =================== 2. Inicialización de tablas ===================

/**
 * Almacén global de instancias DataTable.
 * @type {Object.<string, DataTable>}
 */
let tablas = {};

/**
 * Inicializa todas las tablas del panel del cliente.
 */
function inicializarTablas() {
  const opcionesBase = {
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
  };

  tablas = {
    alquileres: $('#tablaAlquileres').DataTable(opcionesBase),
    facturas: $('#tablaFacturasPendientes').DataTable(opcionesBase),
    ventas: $('#tablaVentasCliente').DataTable(opcionesBase),
    limpiezas: $('#tablaServicios').DataTable(opcionesBase),
    programacion: $('#tablaProgramacion').DataTable(opcionesBase),
    comprobantes: $('#tablaComprobantes').DataTable({
      ...opcionesBase,
      columnDefs: [{ targets: 0, orderable: false }],
    }),
  };
}

// =================== 3. Navegación entre secciones ===================

/**
 * Oculta todas las secciones del dashboard de clientes.
 */
function ocultarTodasLasSecciones() {
  const ids = [
    'dashboard-resumen',
    'seccion-alquileres',
    'seccion-datos-personales',
    'seccion-facturas-pendientes',
    'seccion-comprobantes',
    'seccion-ventas',
    'seccion-limpiezas',
    'seccion-programacion-limpiezas',
    'seccion-reportes',
    'seccion-emails'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

/**
 * Mapeo entre hash de URL y el id de la sección a mostrar.
 */
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
  '#seccion-emails': 'seccion-emails'
};

/**
 * Muestra la sección correspondiente según el hash en la URL.
 */
function mostrarSeccionDesdeHash() {
  ocultarTodasLasSecciones();
  let hash = window.location.hash || '#dashboard';
  if (!mapaSecciones[hash]) hash = '#dashboard';
  const id = mapaSecciones[hash];
  const seccion = document.getElementById(id);
  if (seccion) seccion.style.display = 'block';

  // Enfocar el primer campo de datos personales si aplica
  if (hash === '#seccion-datos-personales') {
    document.getElementById('nombre')?.focus();
  }
}

// =================== 4. Petición y renderizado de datos ===================

/**
 * Carga datos desde una API y los pinta en una tabla DataTable.
 * @param {string} url - Endpoint a consultar.
 * @param {DataTable} tabla - Instancia DataTable.
 * @param {string} errorId - id del elemento donde mostrar error.
 * @param {string} mensajeVacio - id de mensaje de "sin resultados".
 */
async function cargarDatosTabla(url, tabla, errorId, mensajeVacio) {
  try {
    const resp = await fetchConAuth(url);
    if (!resp.ok) throw new Error('Error en la petición');
    const datos = await resp.json();
    tabla.clear().rows.add(datos).draw();
    // Mostrar mensaje si la tabla está vacía
    if (mensajeVacio && document.getElementById(mensajeVacio)) {
      document.getElementById(mensajeVacio).style.display = (datos.length === 0) ? 'block' : 'none';
    }
  } catch (error) {
    console.error(`Error cargando datos de ${url}`, error);
    if (errorId && document.getElementById(errorId)) {
      document.getElementById(errorId).style.display = 'block';
    }
  }
}

/**
 * Inicializa la búsqueda rápida para una tabla (filtrado por texto).
 * @param {string} inputId - id del input de búsqueda.
 * @param {string} btnId - id del botón de búsqueda.
 * @param {string} tablaKey - clave de la tabla en el objeto global "tablas".
 * @param {Array<Object>} datos - array de datos originales.
 */
function inicializarBusquedaRapida(inputId, btnId, tablaKey, datos) {
  document.getElementById(btnId)?.addEventListener('click', () => {
    const q = document.getElementById(inputId).value.toLowerCase();
    const filtrados = datos.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(q))
    );
    tablas[tablaKey].clear().rows.add(filtrados).draw();
  });
}

// =================== 5. Lógica principal del dashboard ===================

/**
 * Función principal que se ejecuta al cargar el DOM.
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Oculta todas las secciones salvo el dashboard por defecto
  ocultarTodasLasSecciones();
  document.getElementById('dashboard-resumen')?.style.display = 'block';

  // Inicializa las tablas de datos
  inicializarTablas();

  // Listeners para navegación lateral (hash en URL)
  document.querySelectorAll('.nav-sidebar .nav-link[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      window.location.hash = link.getAttribute('href');
    });
  });

  // Detecta cambios de hash para mostrar la sección correspondiente
  window.addEventListener('hashchange', mostrarSeccionDesdeHash);

  // Al cargar, muestra la sección correcta según el hash actual
  mostrarSeccionDesdeHash();

  // ------------- Lógica autenticación cliente -------------
  const token = localStorage.getItem('access_token');
  if (!token) return limpiarCredenciales();

  try {
    // Verifica token y rol cliente
    const ver = await fetch('/verificar_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!ver.ok) return limpiarCredenciales();
    const info = await ver.json();
    if (info.rol !== 'cliente') return limpiarCredenciales();

    const email = info.email;
    // Carga los datos personales
    const datosCliRes = await fetch(`/info_datos_cliente?email=${email}`);
    const datosCli = datosCliRes.ok ? await datosCliRes.json() : {};
    const dni = datosCli.dni_cuit_cuil;

    // Auto-rellena formulario de datos personales si existen campos en el DOM
    Object.keys(datosCli).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.value = datosCli[key];
    });

    // ----- Cargar datos en tablas -----
    cargarDatosTabla(`/alquileres_cliente?dni_cuit_cuil=${dni}`, tablas.alquileres, 'errorAlquileres', 'mensajeAlquileres');
    cargarDatosTabla(`/facturas_pendientes_cliente?dni=${dni}`, tablas.facturas, 'errorFacturas', 'mensajeFacturas');
    cargarDatosTabla(`/ventas_cliente?dni_cuit_cuil=${dni}`, tablas.ventas, 'errorVentas', 'mensajeVentas');
    cargarDatosTabla(`/limpiezas_cliente?dni_cuit_cuil=${dni}`, tablas.limpiezas, 'errorServicios', 'mensajeServicios');
    cargarDatosTabla('/cliente/api/limpiezas_programadas', tablas.programacion, '', '');
    cargarDatosTabla(`/api/comprobantes_pago?dni_cuit_cuil=${dni}`, tablas.comprobantes, 'msgComprobante', '');

    // Búsqueda rápida de alquileres
    const alquileresDataResp = await fetchConAuth(`/alquileres_cliente?dni_cuit_cuil=${dni}`);
    const alquileresData = alquileresDataResp.ok ? await alquileresDataResp.json() : [];
    inicializarBusquedaRapida('busquedaAlquileres', 'btnBuscarAlquiler', 'alquileres', alquileresData);

    // Guardado de datos personales desde formulario
    document.getElementById('formDatos')?.addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const datos = Object.fromEntries(formData.entries());
      const resp = await fetchConAuth('/guardar_datos_cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const resultado = await resp.json();
      alert(resultado.mensaje || 'Datos actualizados correctamente.');
    });

  } catch (err) {
    console.error('Error general de autenticación o carga:', err);
    limpiarCredenciales();
  }

  // Logout seguro
  document.getElementById('btnLogout')?.addEventListener('click', limpiarCredenciales);

  // [Opcional] Lógica extra: emails, reportes, etc.
});
