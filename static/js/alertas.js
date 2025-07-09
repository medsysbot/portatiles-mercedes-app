const colaAlertas = [];
let alertaActiva = false;

const ICONOS_ALERTA = {
  exito: '/static/iconos/exito-datos.png',
  error: '/static/iconos/error-datos.png',
  enviando: '/static/iconos/enviando-mensaje.png',
  registro: '/static/iconos/registro-ok.png'
};

function obtenerRutaIcono(nombre) {
  const iconos = {
    'email-incorrecto': 'email-incorrecto .png',
    'enviando-informe': 'enviando-informe.png',
    'enviando-mensaje': 'enviando-mensaje.png',
    'enviando-reporte': 'enviando-reporte .png',
    'error-mensaje': 'error -mensaje.png',
    'error-datos': 'error-datos.png',
    'error-informe-limpieza': 'error-informe -limpieza .png',
    'error-registro': 'error-registro .png',
    'exito-datos': 'exito-datos .png',
    'exito-informe': 'exito-informe .png',
    'exito-mensaje': 'exito-mensaje.png',
    'exito-registro': 'exito-registro.png',
    'guardando-datos': 'guardando-datos .png',
    'password-error': 'password-error.png',
    'registrando-usuario': 'registrando-usuario.png',
    'registro-ok': 'registro-ok.png',
    'reporte-error': 'reporte-error.png',
    'reporte-exito': 'reporte-exito.png',
    'seleccionar-rol': 'seleccionar-rol.png',
    'verifique-contrasena': 'verifique-contrasena.png'
  };
  if (ICONOS_ALERTA[nombre]) return ICONOS_ALERTA[nombre];
  const archivo = iconos[nombre] || nombre + '.png';
  return '/static/iconos/' + encodeURIComponent(archivo);
}

function mostrarAlertaPersonalizada(tipoIcono, mensaje) {
  colaAlertas.push({ mensaje, tipoIcono });
  procesarCola();
}


function procesarCola() {
  if (alertaActiva || colaAlertas.length === 0) return;
  const item = colaAlertas.shift();
  alertaActiva = true;
  const contenedor = document.getElementById('alertaPersonalizada');
  const icono = document.getElementById('iconoAlertaPersonalizada');
  const texto = document.getElementById('mensajeAlertaPersonalizada');
  const botones = contenedor.querySelector('.alerta-botones');
  if (!contenedor || !icono || !texto) return;
  icono.src = obtenerRutaIcono(item.tipoIcono);
  icono.style.display = item.tipoIcono ? 'block' : 'none';
  texto.textContent = item.mensaje;
  contenedor.classList.remove('d-none');
  contenedor.style.display = 'flex';
  contenedor.style.opacity = '1';
  if (botones) botones.innerHTML = '';
  setTimeout(() => {
    contenedor.style.opacity = '0';
    setTimeout(() => {
      contenedor.classList.add('d-none');
      contenedor.style.display = 'none';
      alertaActiva = false;
      setTimeout(procesarCola, 500);
    }, 300);
  }, 2500);
}
