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

// Funciones para cargar datos desde API y renderizar tablas
async function cargarDatos(url, tabla, errorId, mensajeVacio) {
  try {
    const resp = await fetchConAuth(url);
    if (!resp.ok) throw new Error('Error en petición');
    const datos = await resp.json();
    tabla.clear().rows.add(datos).draw();
    if (datos.length === 0) {
      document.getElementById(mensajeVacio).style.display = 'block';
    } else {
      document.getElementById(mensajeVacio).style.display = 'none';
    }
  } catch (error) {
    console.error(`Error cargando ${url}`, error);
    document.getElementById(errorId).style.display = 'block';
  }
}

// Función para inicializar eventos de filtrado rápido
function initBusquedaRapida(inputId, btnId, tablaKey, datos) {
  document.getElementById(btnId).addEventListener('click', () => {
    const q = document.getElementById(inputId).value.toLowerCase();
    const filtrados = datos.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(q))
    );
    tablas[tablaKey].clear().rows.add(filtrados).draw();
  });
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('access_token');
  if (!token) limpiarCredenciales();

  initTablas();

  try {
    const ver = await fetch('/verificar_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!ver.ok) limpiarCredenciales();
    const info = await ver.json();
    if (info.rol !== 'cliente') limpiarCredenciales();

    const email = info.email;
    const datosCliRes = await fetch(`/info_datos_cliente?email=${email}`);
    const datosCli = datosCliRes.ok ? await datosCliRes.json() : {};
    const dni = datosCli.dni_cuit_cuil;

    // Cargar datos personales automáticamente
    Object.keys(datosCli).forEach(key => {
      if (document.getElementById(key)) {
        document.getElementById(key).value = datosCli[key];
      }
    });

    // Cargar datos para tablas
    cargarDatos(`/alquileres_cliente?dni_cuit_cuil=${dni}`, tablas.alquileres, 'errorAlquileres', 'mensajeAlquileres');
    cargarDatos(`/facturas_pendientes_cliente?dni=${dni}`, tablas.facturas, 'errorFacturas', 'mensajeFacturas');
    cargarDatos(`/ventas_cliente?dni_cuit_cuil=${dni}`, tablas.ventas, 'errorVentas', 'mensajeVentas');
    cargarDatos(`/limpiezas_cliente?dni_cuit_cuil=${dni}`, tablas.limpiezas, 'errorServicios', 'mensajeServicios');
    cargarDatos('/cliente/api/limpiezas_programadas', tablas.programacion, '', '');
    cargarDatos(`/api/comprobantes_pago?dni_cuit_cuil=${dni}`, tablas.comprobantes, 'msgComprobante', '');

    // Inicialización búsqueda rápida (ejemplo para alquileres)
    let alquileresData = (await fetchConAuth(`/alquileres_cliente?dni_cuit_cuil=${dni}`)).json();
    initBusquedaRapida('busquedaAlquileres', 'btnBuscarAlquiler', 'alquileres', await alquileresData);

    // Formulario guardar datos personales
    document.getElementById('formDatos').addEventListener('submit', async e => {
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
    console.error(err);
    limpiarCredenciales();
  }

  document.getElementById('btnLogout')?.addEventListener('click', limpiarCredenciales);
});
