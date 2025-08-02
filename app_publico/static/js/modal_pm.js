// Archivo: static/js/robot_pm.js
// Proyecto: Portátiles Mercedes

window.pmContextoPublico = null;

document.addEventListener('DOMContentLoaded', () => {
  cargarContextoPublico();

  // MODAL PRINCIPAL (PREGUNTA)
  const robotWidget    = document.getElementById('widget-robot-pm');
  const modalPM        = document.getElementById('modal-pm');
  const btnMic         = document.getElementById('modal-btn-mic');
  const btnSend        = document.getElementById('modal-btn-send');
  const textarea       = document.getElementById('modal-pm-textarea');
  const statusArea     = document.getElementById('modal-statusarea');
  const imgGrabando    = document.getElementById('img-grabando');
  const imgPregunta    = document.getElementById('img-pregunta');

  // MODAL RESPUESTA
  const modalRespuesta         = document.getElementById('modal-respuesta');
  const imgEsperandoRespuesta  = document.getElementById('img-esperando-respuesta');
  const textareaRespuesta      = document.getElementById('modal-respuesta-textarea');
  const btnCerrarRespuesta     = document.getElementById('modal-btn-cerrar-respuesta');

  // Cambia el texto del botón cerrar por icono a la izquierda
  if (btnCerrarRespuesta) {
    btnCerrarRespuesta.innerHTML = `<img src="/app_publico/static/icons/cerrar_ai.png" alt="Cerrar" style="width:1.2em;vertical-align:middle;margin-right:6px;">Cerrar`;
  }

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
    if (e.target === modalPM) cerrarModalPregunta();
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
    if (texto.length === 0) return;
    mostrarEnviandoPregunta();
    cerrarModalPregunta();
    abrirModalRespuesta();
    await enviarPreguntaTexto(texto);
    // El fetch muestra la respuesta luego.
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
          setTimeout(cerrarModalPregunta, 1500);
        };
      })
      .catch(() => {
        grabando = false;
        cerrarModalPregunta();
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
      abrirModalRespuesta();
      const resp = await fetch('/api/widget_chat', { method: 'POST', body: formData });
      if (!resp.ok) {
        mostrarRespuestaEscrita("Error al recibir la respuesta.");
        return;
      }
      const data = await resp.json();
      mostrarRespuestaEscrita(data.respuesta_texto || "No hubo respuesta.");
    } catch {
      mostrarRespuestaEscrita("Error de conexión.");
    }
  }

  async function enviarAudioGrabado(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'pregunta.mp3');
      formData.append('want_audio', 'true');
      const resp = await fetch('/api/widget_chat', { method: 'POST', body: formData });
      if (!resp.ok) return;
      const data = await resp.json();
      if (data.respuesta_audio_url) {
        reproducirAudioRespuesta(data.respuesta_audio_url);
      }
    } catch { /* Silencio */ }
  }

  function reproducirAudioRespuesta(url) {
    try {
      const audio = new Audio(url);
      audio.play();
    } catch {/* Silencio */}
  }

  function mostrarGrabando() {
    statusArea.style.display = 'none';
    imgGrabando.style.display = 'block';
    imgPregunta.style.display = 'none';
  }
  function mostrarEnviandoPregunta() {
    statusArea.style.display = 'none';
    imgGrabando.style.display = 'none';
    imgPregunta.style.display = 'block';
  }

  // ---- MODAL DE RESPUESTA ----
  function abrirModalRespuesta() {
    textareaRespuesta.value = '';
    imgEsperandoRespuesta.style.display = 'block';
    modalRespuesta.style.display = 'flex'; // CORRECTO, para que funcione con flex en CSS
    // Fondo e imagen de modal de respuesta siempre visibles al abrir
    document.querySelector('.modal-respuesta-img').style.display = 'block';
    btnCerrarRespuesta.style.display = 'flex';
  }

  function mostrarRespuestaEscrita(texto) {
    imgEsperandoRespuesta.style.display = 'none';
    textareaRespuesta.value = texto;
    document.querySelector('.modal-respuesta-img').style.display = 'block';
    btnCerrarRespuesta.style.display = 'flex';
  }

  function cerrarModalRespuesta() {
    modalRespuesta.style.display = 'none';
    textareaRespuesta.value = '';
    imgEsperandoRespuesta.style.display = 'none';
    document.querySelector('.modal-respuesta-img').style.display = 'none';
    btnCerrarRespuesta.style.display = 'none';
  }

  btnCerrarRespuesta.addEventListener('click', cerrarModalRespuesta);

  function cerrarModalPregunta() {
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

  async function cargarContextoPublico() {
    try {
      const resp = await fetch('/api/contexto_publico');
      if (!resp.ok) throw new Error("No se pudo cargar el contexto");
      let data = await resp.json();
      if (typeof data === 'string') data = JSON.parse(data);
      window.pmContextoPublico = data;
    } catch (err) {
      window.pmContextoPublico = null;
    }
  }
});
