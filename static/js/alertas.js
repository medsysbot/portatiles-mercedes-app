// ╔════════════════════════════════════╗
// ║ ALERTAS PERSONALIZADAS PORTÁTILES MERCEDES ║
// ╚════════════════════════════════════╝

let alertTimeout = null;

// === ICONOS Y MENSAJES PERSONALIZADOS ===
const ALERT_ICONS = {
  "repote-error":           { icon: "/static/iconos/reporte-error.png",         msg: "Error al enviar el formulario" },
  "reporte-exito":          { icon: "/static/iconos/reporte-exito.png",         msg: "Exito al enviar el formulario" },
  "formulario-error":       { icon: "/static/iconos/formulario-error.png",      msg: "Error al cargar el formulario" },
  "error-conexion":         { icon: "/static/iconos/error-conexion.png",        msg: "Error en la conexión" },
  "formulario-abierto":     { icon: "/static/iconos/formulario-abierto.png",    msg: "Formulario abierto" },
  "abriendo-formulario":    { icon: "/static/iconos/abriendo-formulario.png",   msg: "Abriendo formulario" },
  "error-sesion":           { icon: "/static/iconos/error-sesion.png",          msg: "Error al iniciar sesión" },
  "exito-sesion":           { icon: "/static/iconos/exito-sesion.png",          msg: "Sesión iniciada" },
  "inicio-sesion":          { icon: "/static/iconos/inicio-sesion.png",         msg: "Iniciando sesión" },
  "email-incorrecto":       { icon: "/static/iconos/email-incorrecto.png",      msg: "E-mail incorrecto" },
  "enviando-informe":       { icon: "/static/iconos/enviando-informe.png",      msg: "Enviando informe..." },
  "enviando-mensaje":       { icon: "/static/iconos/enviando-mensaje.png",      msg: "Enviando mensaje..." },
  "enviando-reporte":       { icon: "/static/iconos/enviando-reporte.png",      msg: "Enviando datos..." },
  "enviando-email":         { icon: "/static/iconos/enviando-email.png",        msg: "Enviando correo..." },
  "email-exito":            { icon: "/static/iconos/email-enviado.png",         msg: "Correo enviado correctamente" },
  "error-mensaje":          { icon: "/static/iconos/error-mensaje.png",         msg: "Error al enviar mensaje" },
  "error-datos":            { icon: "/static/iconos/error-datos.png",           msg: "Error en los datos" },
  "error-validacion":       { icon: "/static/iconos/formulario-error.png",      msg: "Validación incorrecta" },
  "exito-datos":            { icon: "/static/iconos/exito-datos.png",           msg: "Formulario enviado correctamente" },
  "guardando-datos":        { icon: "/static/iconos/guardando-datos.png",       msg: "Guardando datos..." },
  "password-error":         { icon: "/static/iconos/password-error.png",        msg: "Contraseña incorrecta" },
  "seleccionar-rol":        { icon: "/static/iconos/seleccionar-rol.png",       msg: "Seleccione un rol para continuar" },
  "borrando":               { icon: "/static/iconos/borrado.png",               msg: "Eliminando registros..." },
  "borrado-exito":          { icon: "/static/iconos/borrado-exito.png",         msg: "Registros eliminados" },
  "borrado-error":          { icon: "/static/iconos/borrado-error.png",         msg: "Error al eliminar" },
  "info-cargando":          { icon: "/static/iconos/enviando-reporte.png",      msg: "Cargando información..." },
  "cargando-datos":         { icon: "/static/iconos/enviando-reporte.png",      msg: "Cargando datos..." },
  "verifique-contrasena":   { icon: "/static/iconos/verifique-contrasena.png",  msg: "Verifique su contraseña" }
};

// === FUNCIÓN PRINCIPAL DE ALERTA ===
function showAlert(type, customMessage = null, duration = 2500) {
  const alertBox = document.getElementById("alert-manager");
  const alertIcon = document.getElementById("alert-icon");
  const alertText = document.getElementById("alert-text");

  const info = ALERT_ICONS[type] || { icon: "", msg: "Mensaje desconocido" };

  alertIcon.src = info.icon;
  alertIcon.alt = type;
  alertText.textContent = customMessage || info.msg;
  alertBox.style.visibility = "visible";
  alertBox.style.display = "flex";

  clearTimeout(alertTimeout);

  if (duration !== false && duration !== "infinito") {
    alertTimeout = setTimeout(() => {
      alertBox.style.display = "none";
      alertBox.style.visibility = "hidden";
    }, duration);
  }
}

// === ALERTA CON REDIRECCIÓN ===
function showAlertAndRedirect(type, redirectUrl, customMessage = null, duration = 2500, delayAfter = 500) {
  showAlert(type, customMessage, duration);
  setTimeout(() => {
    window.location.href = redirectUrl;
  }, duration + delayAfter);
}

// === UTILIDADES DE CARGA DE DATOS ===
function startDataLoad() {
  showAlert('cargando-datos', 'Cargando datos...', false);
  return Date.now();
}

function endDataLoad(startTime, ok = true) {
  const delay = Math.max(0, 600 - (Date.now() - startTime));
  setTimeout(() => {
    showAlert(ok ? 'exito-datos' : 'error-datos');
  }, delay);
}

// === OCULTAR ALERTA AL CARGAR ===
document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("alert-manager");
  if (box) {
    box.style.display = "none";
    box.style.visibility = "hidden";
  }
});
