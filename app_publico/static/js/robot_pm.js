// WIDGET ROBOT PM - PORTÁTILES MERCEDES

const robotGlobo      = document.getElementById('robot-globo');
const robotGloboTexto = document.getElementById('robot-globo-texto');
const robotInputTexto = document.getElementById('robot-input-texto');
const robotModalAudio = document.getElementById('robot-modal-audio');
const robotMicIcono   = document.getElementById('robot-mic-icono');
const robotBtnAU      = document.getElementById('robot-btn-au');
const robotBtnTX      = document.getElementById('robot-btn-tx');
const robotBtnClose   = document.getElementById('robot-btn-close');
const robotWidget     = document.getElementById('robot-pm-widget');

let modo = "saludo";
let timeoutSaludo = null;

function mostrarSaludo() {
  modo = "saludo";
  robotGloboTexto.style.display = "inline";
  robotGloboTexto.innerHTML = "¡Hola! Soy PM <span style='font-size:1em'>😊</span><br>¿En qué te ayudo?";
  robotInputTexto.style.display = "none";
  robotModalAudio.style.display = "none";
}
function mostrarExplicacion() {
  modo = "explicacion";
  robotGloboTexto.style.display = "inline";
  robotGloboTexto.innerHTML = "Bienvenido. Usá mis botones laterales:<br>TX para escribir, AU para grabar audio, X para cerrar.";
  robotInputTexto.style.display = "none";
  robotModalAudio.style.display = "none";
  limpiarTimeout();
  timeoutSaludo = setTimeout(mostrarSaludo, 9000);
}

// Globo entero input, enviar con ENTER, sin flecha ni X
function activarInputTexto() {
  modo = "texto";
  robotGloboTexto.style.display = "none";
  robotInputTexto.style.display = "inline-block";
  robotInputTexto.value = "";
  robotInputTexto.focus();
  robotModalAudio.style.display = "none";
  limpiarTimeout();
  robotInputTexto.onkeydown = function(e) {
    if (e.key === "Enter") {
      // Aquí envías la pregunta
      robotInputTexto.style.display = "none";
      robotGloboTexto.style.display = "inline";
      robotGloboTexto.innerHTML = "Enviando pregunta...";
      setTimeout(mostrarSaludo, 1800); // Simula respuesta
    }
  }
}

function activarAudio() {
  modo = "audio";
  robotGloboTexto.style.display = "none";
  robotInputTexto.style.display = "none";
  robotModalAudio.style.display = "flex";
  limpiarTimeout();
  // Aquí lógica de grabación de audio
  robotMicIcono.onclick = () => {
    // Simular grabación
    robotModalAudio.querySelector("#robot-audio-status").innerText = "Grabando... Tocá de nuevo para enviar.";
    setTimeout(() => {
      robotModalAudio.querySelector("#robot-audio-status").innerText = "Enviado. ¡Gracias!";
      setTimeout(mostrarSaludo, 1700);
    }, 1700);
  };
}

function limpiarTimeout() {
  if (timeoutSaludo) clearTimeout(timeoutSaludo);
  timeoutSaludo = null;
}

// --- EVENTOS ---
robotBtnTX.onclick = activarInputTexto;
robotBtnAU.onclick = activarAudio;
robotBtnClose.onclick = () => {
  robotWidget.style.display = "none";
};
robotGlobo.onclick = () => {
  if (modo === "saludo") mostrarExplicacion();
};

window.addEventListener('DOMContentLoaded', mostrarSaludo);
