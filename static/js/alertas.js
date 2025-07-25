// ╔════════════════════════════════════╗ 
// ║ALERTAS PERSONALIZADAS PORTÁTILES MERCEDES   ║
// ╚════════════════════════════════════╝
let alertTimeout = null;
// === ICONOS Y MENSAJES ===
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
// === FUNCIÓN PRINCIPAL: mostrar alerta ===
function showAlert(type, customMessage = null, duration = 2500) {
  if (arguments.length === 4) {
    duration = arguments[3]; // compatibilidad con versiones viejas
  }
  const alertBox   = document.getElementById("alert-manager");
  const alertIcon  = document.getElementById("alert-icon");
  const alertText  = document.getElementById("alert-text");
  const info = ALERT_ICONS[type] || { icon: "", msg: "Alerta" };
  alertIcon.src = info.icon;
  alertIcon.alt = type;
  alertIcon.style.display = info.icon ? "block" : "none";
  alertText.textContent = customMessage || info.msg;
  alertBox.style.display = "flex";
  clearTimeout(alertTimeout);
  if (typeof duration === "number" && duration > 0) {
  alertTimeout = setTimeout(() => {
    alertBox.style.display = "none";
  }, duration);
}
// === FUNCIÓN EXTENDIDA: mostrar y redirigir ===
function showAlertAndRedirect(type, redirectUrl, customMessage = null, duration = 2500, delayAfter = 500) {
  showAlert(type, customMessage, duration);
  setTimeout(() => {
    window.location.href = redirectUrl;
  }, duration + delayAfter);
}
// === UTILIDADES PARA CARGA DE DATOS ===
function startDataLoad() {
  if (typeof showAlert === 'function') {
    showAlert('cargando-datos', 'Cargando datos...', false);
  }
  return Date.now();
}
function dataLoadDelay() {
  return new Promise(resolve => {
    const tiempo = Math.floor(Math.random() * 301) + 500; // 500-800 ms
    setTimeout(resolve, tiempo);
  });
}
function endDataLoad(inicio, ok = true) {
  const delay = Math.max(0, 600 - (Date.now() - inicio));
  setTimeout(() => {
    if (typeof showAlert === 'function') {
      if (ok) {
        showAlert('exito-datos', 'Datos cargados correctamente', false, 2600);
      } else {
        showAlert('error-datos', 'No se pudieron cargar los datos', false, 2600);
      }
    }
  }, delay);
}
// Ya no forzamos el display:none porque ahora showAlert lo maneja bien
window.addEventListener("load", () => {
  const box = document.getElementById("alert-manager");
  if (box && box.style.visibility === "hidden") {
    box.style.display = "none";
  }
});
