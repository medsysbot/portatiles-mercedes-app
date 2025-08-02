// ╔═══════════════════════════════════════════════════════╗
// ║ ALERTAS PERSONALIZADAS · PORTÁTILES MERCEDES · v2     ║
// ╚═══════════════════════════════════════════════════════╝

let alertTimeout = null;
let alertaActiva = false;

// === ICONOS Y MENSAJES PERSONALIZADOS ===
const ALERT_ICONS = {
  "registrando-usuario":    { icon: "/static/iconos/registrando-usuario.png",   msg: "Registrando..." },
  "error-registro":         { icon: "/static/iconos/error-registro.png",        msg: "Error al registrarse" },
  "exito-registro":         { icon: "/static/iconos/exito-registro.png",        msg: "Registro exitoso" },
  "email-exito":            { icon: "/static/iconos/email-exito.png",           msg: "E-mail enviado" },
  "email-envio":            { icon: "/static/iconos/email-envio.png",           msg: "Enviando email" },
  "error-informe":          { icon: "/static/iconos/error-informe.png",         msg: "Error al enviar informe" },
  "repote-error":           { icon: "/static/iconos/reporte-error.png",         msg: "Error al enviar el formulario" },
  "reporte-exito":          { icon: "/static/iconos/reporte-exito.png",         msg: "Exito al enviar el formulario" },
  "formulario-error":       { icon: "/static/iconos/formulario-error.png",      msg: "Error al cargar el formulario" },
  "error-conexion":         { icon: "/static/iconos/error-conexion.png",        msg: "Error en la conexión" },
  "formulario-abierto":     { icon: "/static/iconos/formulario-abierto.png",    msg: "Formulario abierto" },
  "abriendo-formulario":    { icon: "/static/iconos/abriendo-formulario.png",   msg: "Abriendo formulario" },
  "error-sesion":           { icon: "/static/iconos/error-sesion.png",          msg: "Error al iniciar sesión" },
  "exito-sesion":           { icon: "/static/iconos/exito-sesion.png",          msg: "Sesión iniciada" },
  "inicio-sesion":          { icon: "/static/iconos/inicio-sesion.png",         msg: "Iniciando sesión" },
  "email-incorrecto":       { icon: "/static/iconos/email-error.png",           msg: "E-mail no enviado" },
  "enviando-informe":       { icon: "/static/iconos/enviando-informe.png",      msg: "Enviando informe..." },
  "enviando-mensaje":       { icon: "/static/iconos/enviando-mensaje.png",      msg: "Enviando mensaje..." },
  "enviando-reporte":       { icon: "/static/iconos/enviando-reporte.png",      msg: "Enviando datos..." },
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
  "informe-enviado":        { icon: "/static/iconos/exito-informe.png",         msg: "Informe enviado" },
  "verifique-contrasena":   { icon: "/static/iconos/verifique-contrasena.png",  msg: "Verifique su contraseña" }
};

// === FUNCIÓN PRINCIPAL (espera completa) ===
let alertTimeout = null;
let alertaActiva = false;

async function showAlert(type, customMessage = null, bloquear = true, tiempo = 2600) {
  const alertBox = document.getElementById("alert-manager");
  const alertIcon = document.getElementById("alert-icon");
  const alertText = document.getElementById("alert-text");

  // Icono y texto
  const info = ALERT_ICONS[type] || { icon: "", msg: "Alerta desconocida" };
  alertIcon.src = info.icon;
  alertIcon.alt = type;
  alertText.textContent = customMessage || info.msg;

  // Mostrar alerta
  alertBox.style.visibility = "visible";
  alertBox.style.display = "flex";

  // Si hay otra alerta activa, la reemplazamos (NUNCA bloqueamos con infinito)
  if (alertTimeout) clearTimeout(alertTimeout);

  // Si el tiempo es 'infinito', no hacemos await ni marcamos como activa
  if (tiempo === "infinito") {
    alertaActiva = false; // Permitir nuevas alertas
    return;
  }

  // Carteles normales: bloquear nuevas alertas mientras se muestra
  alertaActiva = true;
  await new Promise(resolve => {
    alertTimeout = setTimeout(() => {
      alertBox.style.display = "none";
      alertBox.style.visibility = "hidden";
      alertaActiva = false;
      resolve();
    }, tiempo);
  });
}

// === ALERTA CON REDIRECCIÓN ===
async function showAlertAndRedirect(type, url, customMessage = null, tiempo = 2600, postDelay = 500) {
  await showAlert(type, customMessage, true, tiempo);
  setTimeout(() => { window.location.href = url; }, postDelay);
}

// === INICIAL: ocultar al cargar por seguridad ===
document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("alert-manager");
  if (box) {
    box.style.display = "none";
    box.style.visibility = "hidden";
  }
});
