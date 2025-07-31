document.addEventListener('DOMContentLoaded', () => {
  // --- Referencias a elementos ---
  const robotWidget = document.getElementById('widget-robot-pm');
  const modalPM     = document.getElementById('modal-pm');
  const btnMic      = document.getElementById('modal-btn-mic');
  const btnSend     = document.getElementById('modal-btn-send');
  const textarea    = document.getElementById('modal-pm-textarea');
  const statusArea  = document.getElementById('modal-statusarea');
  const imgGrabando = document.getElementById('img-grabando');
  const imgPregunta = document.getElementById('img-pregunta');

  let grabando = false;
  let mediaRecorder = null;
  let audioChunks = [];

  // --- Abrir modal al tocar el robot ---
  robotWidget?.addEventListener('click', () => {
    modalPM.style.display = 'flex';
    resetModal();
  });

  // --- Cerrar modal si se toca fuera del contenido ---
  modalPM.addEventListener('click', (e) => {
    if (e.target === modalPM) cerrarModal();
  });

  // --- Botón micrófono: iniciar/detener grabación ---
  btnMic.addEventListener('click', () => {
    if (!grabando) {
      mostrarGrabando();
      iniciarGrabacion();
    } else {
      detenerGrabacion();
    }
  });

  // --- Botón SEND - envía texto ---
  btnSend.addEventListener('click', async () => {
    if (grabando) {
      detenerGrabacion();
      mostrarEnviandoPregunta();
      return;
    }
    const texto = textarea.value.trim();
    if (texto.length === 0) {
      // No mostrar nada si está vacío
      return;
    }
    mostrarEnviandoPregunta();
    await enviarPreguntaTexto(texto);
    setTimeout(cerrarModal, 1500); // Espera 1.5s y cierra
  });

  // === Grabación de audio ===
  function iniciarGrabacion() {
    grabando = true;
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
          mostrarEnviandoPregunta();
          setTimeout(cerrarModal, 1500);
        };
      })
      .catch(() => {
        // Si NO quieres mostrar nada ni siquiera por error, borra la línea siguiente:
        // mostrarStatusTexto("No se pudo acceder al micrófono.");
        grabando = false;
        cerrarModal();
      });
  }

  function detenerGrabacion() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    grabando = false;
  }

  // === Enviar texto ===
  async function enviarPreguntaTexto(texto) {
    try {
      const formData = new FormData();
      formData.append('text', texto);
      formData.append('want_audio', 'false');
      await fetch('/api/widget_chat', { method: 'POST', body: formData });
      // Respuesta escrita: el modal se cierra, NO muestra ningún mensaje
    } catch {
      // No mostrar ningún texto de error
    }
  }

  // === Enviar audio grabado ===
  async function enviarAudioGrabado(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'pregunta.mp3');
      formData.append('want_audio', 'true');
      await fetch('/api/widget_chat', { method: 'POST', body: formData });
      // Respuesta de audio: el modal se cierra, NO muestra ningún mensaje
    } catch {
      // No mostrar ningún texto de error
    }
  }

  // --- Mostrar "grabando" (PNG, oculta lo demás) ---
  function mostrarGrabando() {
    statusArea.style.display = 'none';
    imgGrabando.style.display = 'block';
    imgPregunta.style.display = 'none';
  }
  // --- Mostrar "enviando pregunta" (PNG, oculta lo demás) ---
  function mostrarEnviandoPregunta() {
    statusArea.style.display = 'none';
    imgGrabando.style.display = 'none';
    imgPregunta.style.display = 'block';
  }

  // --- Cerrar y limpiar modal ---
  function cerrarModal() {
    modalPM.style.display = 'none';
    resetModal();
  }
  function resetModal() {
    textarea.value = '';
    statusArea.value = '';
    statusArea.style.display = 'block';
    imgGrabando.style.display = 'none';
    imgPregunta.style.display = 'none';
    grabando = false;
  }
});
