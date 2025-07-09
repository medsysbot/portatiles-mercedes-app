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

function mostrarConfirmacionPersonalizada(tipoIcono, mensaje) {
  return new Promise(resolve => {
    colaAlertas.push({ mensaje, tipoIcono, confirm: true, resolver: resolve });
    procesarCola();
  });
}

function procesarCola() {
  if (alertaActiva || colaAlertas.length === 0) return;
  const item = colaAlertas.shift();
  alertaActiva = true;
  const cont = document.getElementById('alerta-personalizada');
  const icono = cont.querySelector('.alerta-icono');
  const texto = cont.querySelector('.alerta-texto');
  const botones = cont.querySelector('.alerta-botones');
  icono.src = obtenerRutaIcono(item.tipoIcono);
  texto.textContent = item.mensaje;
  cont.style.display = 'flex';
  requestAnimationFrame(() => cont.classList.add('mostrar'));
  if (item.confirm) {
    botones.innerHTML =
      '<button class="btn btn-primary btn-sm" id="alerta-si">Sí</button>' +
      '<button class="btn btn-secondary btn-sm" id="alerta-no">No</button>';
    const cerrar = val => {
      cont.classList.remove('mostrar');
      cont.classList.add('ocultar');
      setTimeout(() => {
        cont.classList.remove('ocultar');
        cont.style.display = 'none';
        botones.innerHTML = '';
        alertaActiva = false;
        setTimeout(procesarCola, 500);
        item.resolver(val);
      }, 300);
    };
    document.getElementById('alerta-si').addEventListener('click', () => cerrar(true));
    document.getElementById('alerta-no').addEventListener('click', () => cerrar(false));
  } else {
    botones.innerHTML = '';
    setTimeout(() => {
      cont.classList.remove('mostrar');
      cont.classList.add('ocultar');
      setTimeout(() => {
        cont.classList.remove('ocultar');
        cont.style.display = 'none';
        alertaActiva = false;
        setTimeout(procesarCola, 500);
      }, 300);
    }, 2500);
  }
}
