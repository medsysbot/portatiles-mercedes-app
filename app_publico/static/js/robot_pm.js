// robot_pm.js - Widget Robot PM Portátiles Mercedes

document.addEventListener('DOMContentLoaded', function () {
  const robot = document.getElementById('robot-pm-widget');
  const btnTX = document.getElementById('robot-btn-tx');
  const btnAU = document.getElementById('robot-btn-au');
  const btnClose = document.getElementById('robot-btn-close');
  const globo = document.getElementById('robot-globo');
  const globoTexto = document.getElementById('robot-globo-texto');
  const formTexto = document.getElementById('robot-form-texto');
  const inputTexto = document.getElementById('robot-input-texto');
  const areaAudio = document.getElementById('robot-area-audio');
  const btnGrabar = document.getElementById('robot-btn-grabar');
  const btnEnviarAudio = document.getElementById('robot-btn-enviar-audio');
  const btnCancelarAudio = document.getElementById('robot-btn-cancelar-audio');
  const audioStatus = document.getElementById('robot-audio-status');

  let mediaRecorder = null;
  let audioChunks = [];
  let estado = "reposo"; // "texto", "audio", "grabando", "cerrado"

  // Inicialización: oculta todo menos la imagen
  ocultarTodo();
  mostrarGlobo('¡Hola! Soy PM 😊');

  // -- Áreas activas: muestran input correspondiente --
  btnTX.classList.add('robot-btn-visible');
  btnAU.classList.add('robot-btn-visible');
  btnClose.classList.add('robot-btn-visible');

  btnTX.addEventListener('click', function (e) {
    e.stopPropagation();
    ocultarTodo();
    formTexto.classList.add('robot-input-visible');
    inputTexto.focus();
    mostrarGlobo('¿En qué te ayudo? Escribí tu pregunta.');
    estado = "texto";
  });

  btnAU.addEventListener('click', function (e) {
    e.stopPropagation();
    ocultarTodo();
    areaAudio.classList.add('robot-input-visible');
    mostrarGlobo('Presioná el micrófono para grabar tu pregunta.');
    estado = "audio";
  });

  btnClose.addEventListener('click', function (e) {
    e.stopPropagation();
    // Animación de cohete
    robot.classList.add('robot-cohete-out');
    setTimeout(() => {
      robot.style.display = "none";
      estado = "cerrado";
    }, 950);
  });

  // -- Envío de texto --
  formTexto.addEventListener('submit', async function (e) {
    e.preventDefault();
    const pregunta = inputTexto.value.trim();
    if (!pregunta) return;
    mostrarGlobo('Enviando...');
    await enviarPregunta({ text: pregunta, want_audio: false });
    formTexto.classList.remove('robot-input-visible');
    inputTexto.value = '';
    estado = "reposo";
  });

  // -- Audio: grabar y enviar --
  btnGrabar.addEventListener('click', function () {
    if (mediaRecorder && mediaRecorder.state === "recording") return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      mostrarGlobo('Tu navegador no soporta grabación de audio.');
      return;
    }
    audioChunks = [];
    audioStatus.textContent = "Grabando... (soltá para enviar)";
    btnGrabar.style.background = "#e4cb85";
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        estado = "grabando";
        mediaRecorder.ondataavailable = e => {
          audioChunks.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          btnGrabar.style.background = "";
          audioStatus.textContent = "Enviando...";
          const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
          await enviarPregunta({ audio: audioBlob, want_audio: true });
          areaAudio.classList.remove('robot-input-visible');
          estado = "reposo";
        };
        // Parar grabación al soltar el botón
        btnGrabar.onmouseup = btnGrabar.onmouseleave = () => {
          if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
          }
        };
      })
      .catch(() => {
        mostrarGlobo('No se pudo acceder al micrófono.');
      });
  });

  // -- Cancelar audio (opcional) --
  btnCancelarAudio.addEventListener('click', function () {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    ocultarTodo();
    mostrarGlobo('Grabación cancelada.');
    estado = "reposo";
  });

  // -- Utilidades --
  function ocultarTodo() {
    formTexto.classList.remove('robot-input-visible');
    areaAudio.classList.remove('robot-input-visible');
    // Oculta globito por defecto
    globo.classList.remove('robot-globo-visible');
  }

  function mostrarGlobo(mensaje) {
    globoTexto.textContent = mensaje;
    globo.classList.add('robot-globo-visible');
    setTimeout(() => {
      if (globo.classList.contains('robot-globo-visible')) {
        globo.classList.remove('robot-globo-visible');
      }
    }, 4100);
  }

  // -- Enviar pregunta al backend --
  async function enviarPregunta({ text = null, audio = null, want_audio = false }) {
    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (audio) formData.append('audio', audio, 'pregunta.mp3');
      formData.append('want_audio', want_audio);

      mostrarGlobo('Pensando...');
      const response = await fetch('/api/widget_chat', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data && data.respuesta_texto) {
        mostrarGlobo(data.respuesta_texto);
        // Si hay audio y la respuesta incluye, reproducir audio
        if (data.respuesta_audio_url) {
          setTimeout(() => {
            const audioResp = new Audio(data.respuesta_audio_url);
            audioResp.play();
          }, 600);
        }
      } else if (data && data.error) {
        mostrarGlobo('Error: ' + data.error);
      } else {
        mostrarGlobo('No se recibió respuesta del robot.');
      }
    } catch (e) {
      mostrarGlobo('Error de conexión al robot.');
    }
  }
});
  const btnCloseTexto = document.getElementById('robot-close-texto');
  const btnCloseAudio = document.getElementById('robot-close-audio');

  // Cerrar modal de texto con X
  btnCloseTexto.addEventListener('click', function (e) {
    e.preventDefault();
    formTexto.classList.remove('robot-input-visible');
    mostrarGlobo('¿En qué te ayudo?');
    estado = "reposo";
  });

  // Cerrar modal de audio con X
  btnCloseAudio.addEventListener('click', function (e) {
    e.preventDefault();
    areaAudio.classList.remove('robot-input-visible');
    mostrarGlobo('¿En qué te ayudo?');
    estado = "reposo";
  });
