// ALERTAS PERSONALIZADAS PORTÁTILES MERCEDES

let alertTimeout = null;

const ALERT_ICONS = {
  "email-incorrecto":        { icon: "/static/iconos/email-incorrecto%20.png", msg: "E-mail incorrecto" },
  "enviando-informe":        { icon: "/static/iconos/enviando-informe.png", msg: "Enviando informe..." },
  "enviando-mensaje":        { icon: "/static/iconos/enviando-mensaje.png", msg: "Enviando mensaje..." },
  "enviando-reporte":        { icon: "/static/iconos/enviando-reporte%20.png", msg: "Enviando reporte..." },
  "error-mensaje":           { icon: "/static/iconos/error%20-mensaje.png", msg: "Error al enviar mensaje" },
  "error-datos":             { icon: "/static/iconos/error-datos.png", msg: "Error en los datos" },
  "error-informe-limpieza":  { icon: "/static/iconos/error-informe%20-limpieza%20.png", msg: "Error al enviar informe de limpieza" },
  "error-registro":          { icon: "/static/iconos/error-registro%20.png", msg: "Error en el registro" },
  "exito-datos":             { icon: "/static/iconos/exito-datos%20.png", msg: "Datos guardados correctamente" },
  "exito-informe":           { icon: "/static/iconos/exito-informe%20.png", msg: "Informe enviado con éxito" },
  "exito-mensaje":           { icon: "/static/iconos/exito-mensaje.png", msg: "Mensaje enviado correctamente" },
  "exito-registro":          { icon: "/static/iconos/exito-registro.png", msg: "Registro realizado con éxito" },
  "guardando-datos":         { icon: "/static/iconos/guardando-datos%20.png", msg: "Guardando datos..." },
  "password-error":          { icon: "/static/iconos/password-error.png", msg: "Contraseña incorrecta" },
  "registrando-usuario":     { icon: "/static/iconos/registrando-usuario.png", msg: "Registrando usuario..." },
  "registro-ok":             { icon: "/static/iconos/registro-ok.png", msg: "Usuario registrado correctamente" },
  "reporte-error":           { icon: "/static/iconos/reporte-error.png", msg: "Error al enviar reporte" },
  "reporte-exito":           { icon: "/static/iconos/reporte-exito.png", msg: "Reporte enviado con éxito" },
  "seleccionar-rol":         { icon: "/static/iconos/seleccionar-rol.png", msg: "Seleccione un rol para continuar" },
  "verifique-contrasena":    { icon: "/static/iconos/verifique-contrasena.png", msg: "Verifique su contraseña" }
};

function showAlert(type, customMessage = null, duration = 2500) {
  const alertBox = document.getElementById("alert-manager");
  const alertIcon = document.getElementById("alert-icon");
  const alertText = document.getElementById("alert-text");
  const info = ALERT_ICONS[type] || { icon: "", msg: "Alerta" };

  alertIcon.src = info.icon;
  alertIcon.alt = type;
  alertText.textContent = customMessage || info.msg;

  alertBox.style.display = "flex";
  clearTimeout(alertTimeout);

  if (duration !== "infinito") {
    alertTimeout = setTimeout(() => {
      alertBox.style.display = "none";
    }, duration);
  }
}

// Mantener oculto el contenedor de alertas hasta que se dispare showAlert
document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("alert-manager");
  if (box) {
    box.style.display = "none";
  }
});
