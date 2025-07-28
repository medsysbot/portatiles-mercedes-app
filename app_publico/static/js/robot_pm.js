// robot_pm.js - Portátiles Mercedes

const widget = document.getElementById('robot-pm-widget');
const globo = document.getElementById('robot-globo');
const globoContenido = document.getElementById('robot-globo-contenido');
const globoTexto = document.getElementById('robot-globo-texto');
const globoClose = document.getElementById('robot-close-modal');

const btnTX = document.getElementById('robot-btn-tx');
const btnAU = document.getElementById('robot-btn-au');
const btnCLOSE = document.getElementById('robot-btn-close');

// Estado actual del widget
let estado = 'reposo';

// ---- FUNCIONES GLOBO Y MODAL ----

function mostrarGlobo(html) {
  globoContenido.innerHTML = html;
  globo.classList.remove('robot-globo-oculto');
}

function ocultarGlobo() {
  globo.classList.add('robot-globo-oculto');
}

// Globo saludo (inicio)
function saludoInicial() {
  mostrarGlobo(`<span id="robot-globo-texto">¡Hola! Soy PM 😊<br>¿En qué te ayudo?</span>`);
  globo.classList.remove('robot-globo-oculto');
  estado = 'reposo';
}

// Modal para escribir pregunta (TX)
function mostrarModalTexto() {
  mostrarGlobo(`
    <form id="robot-form-texto" class="robot-form-entrada" autocomplete="off">
      <input type="text" id="robot-input-texto" maxlength="180" placeholder="Escribí tu pregunta aquí" autofocus />
      <button type="submit" class="robot-btn-enviar" title="Enviar pregunta">&#8594;</button>
    </form>
  `);
  document.getElementById('robot-form-texto').onsubmit = enviarTexto;
  estado = 'texto';
}

// Modal para grabar audio (AU)
function mostrarModalAudio() {
  mostrarGlobo(`
    <div class="robot-form-entrada robot-area-audio">
      <button id="robot-btn-grabar" type="button" class="robot-btn-enviar" title="Presioná para grabar">
        <img src="/app_publico/static/icons/microfono.png" alt="Grabar" style="width:34px;height:34px;">
      </button>
      <span id="robot-audio-status" class="robot-audio-status">Presioná el micrófono para grabar tu pregunta.</span>
    </div>
  `);
  document.getElementById('robot-btn-grabar').onclick = simularGrabacionAudio;
  estado = 'audio';
}

// ---- MANEJO DE BOTONES ----

// Cerrar solo el globo/modal (no el robot)
globoClose.onclick = () => {
  if (estado === 'texto' || estado === 'audio') {
    saludoInicial();
  }
}

// Cerrar todo el widget y "volar"
btnCLOSE.onclick = () => {
  widget.classList.add('robot-cohete-out');
  setTimeout(() => {
    widget.style.display = 'none';
  }, 900);
}

// Mostrar globo para escribir (TX)
btnTX.onclick = () => {
  mostrarModalTexto();
}

// Mostrar globo para grabar (AU)
btnAU.onclick = () => {
  mostrarModalAudio();
}

// ---- FUNCIONES MODAL ----

// Simulación grabación audio (puedes conectar aquí la lógica real)
function simularGrabacionAudio() {
  const status = document.getElementById('robot-audio-status');
  status.innerText = 'Enviando pregunta...';
  setTimeout(() => {
    saludoInicial();
    mostrarGlobo(`<span id="robot-globo-texto">Respuesta simulada por audio 🎤</span>`);
    setTimeout(saludoInicial, 2200);
  }, 2000);
}

// Enviar texto (puedes conectar aquí la lógica real)
function enviarTexto(e) {
  e.preventDefault();
  const input = document.getElementById('robot-input-texto');
  const pregunta = input.value.trim();
  if (!pregunta) return;
  mostrarGlobo(`<span id="robot-globo-texto">Enviando pregunta...</span>`);
  setTimeout(() => {
    saludoInicial();
    mostrarGlobo(`<span id="robot-globo-texto">Respuesta simulada: ${pregunta}</span>`);
    setTimeout(saludoInicial, 2500);
  }, 1800);
}

// ---- INICIO ----
saludoInicial();

