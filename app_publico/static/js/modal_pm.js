// Archivo: modal_pm.js
document.addEventListener('DOMContentLoaded', () => {
  const robotWidget = document.getElementById('widget-robot-pm');
  const modalPM     = document.getElementById('modal-pm');
  const btnMic      = document.getElementById('modal-btn-mic');
  const btnSend     = document.getElementById('modal-btn-send');
  const textarea    = document.getElementById('modal-pm-textarea');
  const statusDiv   = document.getElementById('modal-pm-status');

  let grabando = false;
  let mediaRecorder = null;
  let audioChunks = [];

  // --- Abrir modal al tocar el robot ---
  robotWidget?.addEventListener('click', () => {
    modalPM.style.display = 'flex';
    resetModal();
  });

  // --- Cerrar modal si se toca fuera del contenido (modal overlay) ---
  modalPM.addEventListener('click', (e) => {
    if (e.target === modalPM) {
      cerrarModal();
    }
  });

  // --- Botón micrófono - iniciar/detener grabación ---
  btnMic.addEventListener('click', () => {
    if (!grabando) {
      iniciarGrabacion();
    } else {
      detenerGrabacion();
    }
  });

  // --- Botón SEND - envía texto o audio según lo que haya ---
  btnSend.addEventListener('click', async () => {
    if (grabando) {
      detenerGrabacion(); // terminar grabación y luego enviar audio
      return;
    }
    const texto = textarea.value.trim();
    if (texto.length === 0) {
      statusDiv.textContent = 'Ingrese una pregunta o use el micrófono.';
      return;
    }
    statusDiv.textContent = 'Enviando pregunta...';
    await enviarPreguntaTexto(texto);
    cerrarModal();
    // Aquí puedes abrir el modal de respuesta si hace falta
  });

  // === GRABACIÓN DE AUDIO ===
  function iniciarGrabacion() {
    statusDiv.textContent = 'Grabando...';
    btnMic.classList.add('grabando');
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
          cerrarModal();
        };
      })
      .catch(() => {
        statusDiv.textContent = "No se pudo acceder al micrófono.";
        grabando = false;
        btnMic.classList.remove('grabando');
      });
  }

  function detenerGrabacion() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    grabando = false;
    btnMic.classList.remove('grabando');
    statusDiv.textContent = "Procesando audio...";
  }

  // === ENVÍO DE TEXTO Y AUDIO (AJUSTA ENDPOINT Y RESPUESTA SEGÚN TU BACKEND) ===
  async function enviarPreguntaTexto(texto) {
    try {
      const formData = new FormData();
      formData.append('text', texto);
      formData.append('want_audio', 'false');
      await fetch('/api/widget_chat', { method: 'POST', body: formData });
      // Aquí deberías mostrar el modal de respuesta, etc.
    } catch (err) {
      statusDiv.textContent = "Error al enviar la pregunta.";
    }
  }

  async function enviarAudioGrabado(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'pregunta.mp3');
      formData.append('want_audio', 'true');
      await fetch('/api/widget_chat', { method: 'POST', body: formData });
      // Aquí NO abras modal, la respuesta vendría por audio
    } catch (err) {
      statusDiv.textContent = "Error al enviar el audio.";
    }
  }

  // --- Cerrar modal (ocultar y limpiar) ---
  function cerrarModal() {
    modalPM.style.display = 'none';
    resetModal();
  }

  // --- Limpiar modal al abrir/cerrar ---
  function resetModal() {
    textarea.value = '';
    statusDiv.textContent = '';
    grabando = false;
    btnMic.classList.remove('grabando');
    // Si quieres limpiar mediaRecorder, hazlo aquí si hay leak
  }
});
