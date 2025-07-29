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
let grabando = false;
let mediaRecorder = null;
let audioChunks = [];

// Mostrar saludo inicial
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

// Input texto: el globo entero es un input, ENTER envía pregunta
function activarInputTexto() {
  modo = "texto";
  robotGloboTexto.style.display = "none";
  robotInputTexto.style.display = "inline-block";
  robotInputTexto.value = "";
  robotInputTexto.focus();
  robotModalAudio.style.display = "none";
  limpiarTimeout();

  robotInputTexto.onkeydown = function(e) {
    if (e.key === "Enter" && robotInputTexto.value.trim().length > 0) {
      enviarPreguntaTexto(robotInputTexto.value.trim());
    }
  }
}

function enviarPreguntaTexto(texto) {
  robotInputTexto.style.display = "none";
  robotGloboTexto.style.display = "inline";
  robotGloboTexto.innerHTML = "Enviando pregunta...";
  fetchWidgetAPI({ text: texto, want_audio: false });
}

// Grabación y envío de audio
function activarAudio() {
  modo = "audio";
  robotGloboTexto.style.display = "none";
  robotInputTexto.style.display = "none";
  robotModalAudio.style.display = "flex";
  limpiarTimeout();
  setAudioUIGrabando(false);

  // Si ya hay evento, lo quita
  robotMicIcono.onclick = null;
  robotMicIcono.onclick = () => {
    if (!grabando) {
      iniciarGrabacion();
    } else {
      detenerGrabacion();
    }
  }
}

function setAudioUIGrabando(estaGrabando) {
  grabando = estaGrabando;
  if (grabando) {
    robotModalAudio.querySelector("#robot-audio-status").innerText = "Grabando... Tocá el micrófono para enviar.";
    robotMicIcono.classList.add("grabando");
  } else {
    robotModalAudio.querySelector("#robot-audio-status").innerText = "Tocá el micrófono para grabar tu pregunta.";
    robotMicIcono.classList.remove("grabando");
  }
}

function iniciarGrabacion() {
  setAudioUIGrabando(true);
  audioChunks = [];
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        let audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        enviarAudioGrabado(audioBlob);
      };
    })
    .catch(err => {
      setAudioUIGrabando(false);
      robotModalAudio.querySelector("#robot-audio-status").innerText = "No se pudo acceder al micrófono.";
    });
}

function detenerGrabacion() {
  setAudioUIGrabando(false);
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  // mediaRecorder.onstop envía automáticamente el audio
}

function enviarAudioGrabado(audioBlob) {
  robotModalAudio.style.display = "none";
  robotGloboTexto.style.display = "inline";
  robotGloboTexto.innerHTML = "Enviando audio...";
  fetchWidgetAPI({ audioBlob, want_audio: true });
}

// Lógica fetch para enviar texto/audio
function fetchWidgetAPI({ text, audioBlob, want_audio }) {
  const formData = new FormData();
  if (text) formData.append('text', text);
  if (audioBlob) formData.append('audio', audioBlob, "pregunta.mp3");
  formData.append('want_audio', want_audio ? "true" : "false");

  fetch("/api/widget_chat", {
    method: "POST",
    body: formData
  })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        robotGloboTexto.innerHTML = data.error || "Error al procesar la respuesta.";
        setTimeout(mostrarSaludo, 2300);
        return;
      }
      // Mostrar respuesta textual
      robotGloboTexto.innerHTML = data.respuesta_texto ? data.respuesta_texto.replace(/\n/g, "<br>") : "Sin respuesta";
      // Si hay respuesta de audio y el usuario lo pidió
      if (want_audio && data.respuesta_audio_url) {
        let audio = new Audio(data.respuesta_audio_url);
        audio.play();
      }
      setTimeout(mostrarSaludo, 8000);
    })
    .catch(() => {
      robotGloboTexto.innerHTML = "Error de conexión.";
      setTimeout(mostrarSaludo, 2000);
    });
}

function limpiarTimeout() {
  if (timeoutSaludo) clearTimeout(timeoutSaludo);
  timeoutSaludo = null;
}

// --- EVENTOS ---
// Botón TX (texto)
robotBtnTX.onclick = activarInputTexto;

// Botón AU (audio)
robotBtnAU.onclick = activarAudio;

// Botón CLOSE (cerrar robot)
robotBtnClose.onclick = () => {
  robotWidget.style.display = "none";
};

// Clic en globo: instrucciones si está en modo saludo
robotGlobo.onclick = () => {
  if (modo === "saludo") mostrarExplicacion();
};

window.addEventListener('DOMContentLoaded', mostrarSaludo);
