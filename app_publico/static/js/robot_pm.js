// robot_pm.js - Widget PM - Portátiles Mercedes

const widget = document.getElementById('robot-pm-widget');
const globo = document.getElementById('robot-globo');
const globoContenido = document.getElementById('robot-globo-contenido');
const btnTX = document.getElementById('robot-btn-tx');
const btnAU = document.getElementById('robot-btn-au');
const btnClose = document.getElementById('robot-btn-close');
const formTexto = document.getElementById('robot-form-texto');
const inputTexto = document.getElementById('robot-input-texto');
const formAudio = document.getElementById('robot-form-audio');
const btnGrabar = document.getElementById('robot-btn-grabar');
const audioStatus = document.getElementById('robot-audio-status');

// Estado actual del robot (reposo, texto, audio)
let estado = "reposo";

// Mostrar el globo, texto o input
function mostrarGlobo(modo, mensaje = "") {
    globo.classList.remove('robot-globo-oculto');
    formTexto.style.display = 'none';
    formAudio.style.display = 'none';
    globoContenido.style.display = 'block';
    globoContenido.innerHTML = '';

    if (modo === 'reposo') {
        globoContenido.textContent = '¡Hola! Soy PM 😊 ¿En qué te ayudo?';
    } else if (modo === 'texto') {
        globoContenido.textContent = '';
        formTexto.style.display = 'flex';
        inputTexto.value = '';
        inputTexto.placeholder = "Escribí tu pregunta aquí...";
        inputTexto.focus();
    } else if (modo === 'audio') {
        globoContenido.textContent = '';
        formAudio.style.display = 'flex';
        audioStatus.textContent = "Presioná el micrófono para enviar tu pregunta.";
    } else if (modo === 'respuesta') {
        globoContenido.textContent = mensaje;
    }
}

// Mostrar saludo inicial al cargar
mostrarGlobo('reposo');

// --- BOTÓN TX (Texto) ---
btnTX.addEventListener('click', function() {
    estado = "texto";
    mostrarGlobo('texto');
});

// --- BOTÓN AU (Audio) ---
btnAU.addEventListener('click', function() {
    estado = "audio";
    mostrarGlobo('audio');
});

// --- BOTÓN CERRAR (X costado) ---
btnClose.addEventListener('click', function() {
    // Animación cohete y luego remover widget
    widget.classList.add('robot-cohete-out');
    setTimeout(() => { widget.remove(); }, 900);
});

// --- ENVIAR TEXTO ---
formTexto.addEventListener('submit', function(e) {
    e.preventDefault();
    const pregunta = inputTexto.value.trim();
    if (pregunta.length === 0) return;
    mostrarGlobo('respuesta', "Enviando tu pregunta...");
    // Acá deberías llamar al backend vía fetch/AJAX y luego mostrar respuesta:
    setTimeout(() => {
        mostrarGlobo('respuesta', "¡Recibí tu mensaje! Pronto te respondo.");
        estado = "reposo";
        setTimeout(() => mostrarGlobo('reposo'), 2600);
    }, 1200);
});

// --- GRABAR AUDIO (solo interfaz, sin STT) ---
btnGrabar.addEventListener('click', function() {
    mostrarGlobo('respuesta', "Grabando y enviando tu pregunta de audio...");
    // Simular backend respuesta:
    setTimeout(() => {
        mostrarGlobo('respuesta', "¡Audio recibido! Pronto te respondo.");
        estado = "reposo";
        setTimeout(() => mostrarGlobo('reposo'), 2600);
    }, 1400);
});
