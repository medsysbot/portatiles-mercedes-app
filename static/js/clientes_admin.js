// Archivo: static/js/clientes_admin.js
// Proyecto: Portátiles Mercedes
// Requiere que la plantilla cargue /static/js/alertas.js para usar showAlert

function handleUnauthorized() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
  localStorage.removeItem('nombre');
  window.location.href = '/login';
}

window.pmClientesAdminData = window.pmClientesAdminData || [];
let tablaClientes = null;

function inicializarTablaClientes() {
  if (tablaClientes) return;
  tablaClientes = $('#tabla-clientes').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
    paging: true,
    searching: false,
    ordering: true,
    columns: [
      {
        data: 'dni_cuit_cuil',
        render: data => `<input type="checkbox" class="fila-check" value="${data}">`,
        orderable: false
      },
      { data: 'dni_cuit_cuil' },
      { data: 'nombre' },
      { data: 'apellido' },
      { data: 'direccion' },
      { data: 'telefono' },
      { data: 'razon_social' },
      { data: 'email' }
    ]
  });
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarTablaClientes();
  const tabla = tablaClientes;

  const btnEliminar = document.getElementById('btnEliminarSeleccionados');

  function actualizarBoton() {
    const checks = document.querySelectorAll('#tabla-clientes tbody .fila-check:checked');
    if (btnEliminar) btnEliminar.disabled = checks.length === 0;
  }

  $('#tabla-clientes tbody').on('change', '.fila-check', actualizarBoton);

  btnEliminar?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('#tabla-clientes tbody .fila-check:checked')).map(c => c.value);
    if (!ids.length) return;
    try {
      if (typeof showAlert === 'function') {
        await showAlert('borrando', 'Eliminando clientes...', true);
      }
      const resp = await fetch('/admin/api/clientes/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('access_token') },
        body: JSON.stringify({ ids })
      });
      if (!resp.ok) throw new Error('Error al eliminar');
      await obtenerClientes();
      if (typeof showAlert === 'function') {
        await showAlert('borrado-exito', 'Clientes eliminados', true);
      }
    } catch (err) {
      if (typeof showAlert === 'function') {
        await showAlert('borrado-error', 'Error eliminando clientes', true);
      }
    } finally {
      if (btnEliminar) btnEliminar.disabled = true;
    }
  });

  async function obtenerClientes() {
    try {
      if (typeof showAlert === 'function') {
        await showAlert('cargando-datos', 'Cargando clientes...', true);
      }
      const resp = await fetch('/clientes');
      const data = await resp.json();
      window.pmClientesAdminData = data || [];
      mostrarClientes(window.pmClientesAdminData);
      if (typeof showAlert === 'function') {
        await showAlert('exito-datos', 'Clientes cargados', true);
      }
    } catch (error) {
      if (typeof showAlert === 'function') {
        await showAlert('error-datos', 'Error al cargar clientes', true);
      }
      if (window.pmClientesAdminData.length === 0) tabla.clear().draw();
    }
  }

  function mostrarClientes(lista) {
    tabla.clear();
    tabla.rows.add(lista).draw();
  }

  function filtrarClientes(texto) {
    const q = texto.toLowerCase();
    const filtrados = window.pmClientesAdminData.filter(c =>
      (c.nombre || '').toLowerCase().includes(q) ||
      (c.dni_cuit_cuil || '').toLowerCase().includes(q) ||
      (c.razon_social || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
    mostrarClientes(filtrados);
  }

  const buscador = document.getElementById('busquedaCliente');
  const btnBuscar = document.getElementById('btnBuscarCliente');
  if (buscador) buscador.addEventListener('input', () => filtrarClientes(buscador.value.trim()));
  if (btnBuscar) btnBuscar.addEventListener('click', () => filtrarClientes(buscador.value.trim()));

  if (window.pmClientesAdminData.length === 0) {
    obtenerClientes();
  } else {
    mostrarClientes(window.pmClientesAdminData);
  }
});

function showAlert(tipo, texto = '', esperar = false, tiempo = 2800) {
    const contenedor = document.getElementById('alert-manager');
    const icono = document.getElementById('alert-icon');
    const mensaje = document.getElementById('alert-text');

    const ALERT_ICONS = {
        "formulario-error":      { icon: "/static/iconos/formulario-error.png",      msg: "Error al cargar el formulario" },
        "error-conexion":        { icon: "/static/iconos/error-conexion.png",        msg: "Error en la conexion" },
        "formulario-abierto":    { icon: "/static/iconos/formulario-abierto.png",    msg: "Formulario abierto" },
        "abriendo-formulario":   { icon: "/static/iconos/abriendo-formulario.png",   msg: "Abriendo formulario" },
        "error-sesion":          { icon: "/static/iconos/error-sesion.png",          msg: "Error al iniciar sesion" },
        "exito-sesion":          { icon: "/static/iconos/exito-sesion.png",          msg: "Sesion iniciada" },
        "inicio-sesion":         { icon: "/static/iconos/inicio-sesion.png",         msg: "Iniciando sesion" },
        "email-incorrecto":      { icon: "/static/iconos/email-incorrecto.png",      msg: "E-mail incorrecto" },
        "enviando-informe":      { icon: "/static/iconos/enviando-informe.png",      msg: "Enviando informe..." },
        "enviando-mensaje":      { icon: "/static/iconos/enviando-mensaje.png",      msg: "Enviando mensaje..." },
        "enviando-reporte":      { icon: "/static/iconos/enviando-reporte.png",      msg: "Enviando reporte..." },
        "error-mensaje":         { icon: "/static/iconos/error-mensaje.png",         msg: "Error al enviar mensaje" },
        "error-datos":           { icon: "/static/iconos/error-datos.png",           msg: "Error en los datos" },
        "error-validacion":      { icon: "/static/iconos/formulario-error.png",      msg: "Validación incorrecta" },
        "error-informe-limpieza":{ icon: "/static/iconos/error-informe-limpieza.png",msg: "Error al enviar informe de limpieza" },
        "error-registro":        { icon: "/static/iconos/error-registro.png",        msg: "Error en el registro" },
        "exito-datos":           { icon: "/static/iconos/exito-datos.png",           msg: "Datos guardados correctamente" },
        "exito-informe":         { icon: "/static/iconos/exito-informe.png",         msg: "Informe enviado con éxito" },
        "exito-mensaje":         { icon: "/static/iconos/exito-mensaje.png",         msg: "Mensaje enviado correctamente" },
        "exito-registro":        { icon: "/static/iconos/exito-registro.png",        msg: "Registro realizado con éxito" },
        "guardando-datos":       { icon: "/static/iconos/guardando-datos.png",       msg: "Guardando datos..." },
        "password-error":        { icon: "/static/iconos/password-error.png",        msg: "Contraseña incorrecta" },
        "registrando-usuario":   { icon: "/static/iconos/registrando-usuario.png",   msg: "Registrando usuario..." },
        "registro-ok":           { icon: "/static/iconos/registro-ok.png",           msg: "Usuario registrado correctamente" },
        "reporte-error":         { icon: "/static/iconos/reporte-error.png",         msg: "Error al enviar reporte" },
        "reporte-exito":         { icon: "/static/iconos/reporte-exito.png",         msg: "Reporte enviado con éxito" },
        "seleccionar-rol":       { icon: "/static/iconos/seleccionar-rol.png",       msg: "Seleccione un rol para continuar" },
        "borrando":              { icon: "/static/iconos/borrado.png",               msg: "Eliminando registros..." },
        "borrado-exito":         { icon: "/static/iconos/borrado-exito.png",         msg: "Registros eliminados" },
        "borrado-error":         { icon: "/static/iconos/borrado-error.png",         msg: "Error al eliminar" },
        "info-cargando":         { icon: "/static/iconos/enviando-reporte.png",      msg: "Cargando datos..." },
        "cargando-datos":        { icon: "/static/iconos/enviando-reporte.png",      msg: "Cargando datos, por favor espere..." },
        "verifique-contrasena":  { icon: "/static/iconos/verifique-contrasena.png",  msg: "Verifique su contraseña" }
    };

    const config = ALERT_ICONS[tipo] || { icon: '', msg: texto };
    icono.src = config.icon;
    mensaje.textContent = texto || config.msg || "Mensaje";

    contenedor.style.display = 'flex';

    const duracion = (tiempo === 'infinito') ? null : (typeof tiempo === 'number' ? tiempo : 2600);

    if (duracion) {
        setTimeout(() => {
            contenedor.style.display = 'none';
        }, duracion);
    }

    if (esperar && duracion) {
        return new Promise(resolve => setTimeout(resolve, duracion));
    }
}
