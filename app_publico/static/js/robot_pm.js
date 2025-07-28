// WIDGET ROBOT PM - PORTÁTILES MERCEDES

const robotOverlay = document.getElementById('robot-overlay');
const robotWidget = document.getElementById('robot-pm-widget');
const robotGlobo = document.getElementById('robot-globo');
const robotGloboTexto = document.getElementById('robot-globo-texto');
const robotGloboClose = document.getElementById('robot-globo-close');
const robotBtnAU = document.getElementById('robot-btn-au');
const robotBtnTX = document.getElementById('robot-btn-tx');
const robotBtnClose = document.getElementById('robot-btn-close');
const robotFormTexto = document.getElementById('robot-form-texto');
const robotInputTexto = document.getElementById('robot-input-texto');
const robotModalAudio = document.getElementById('robot-modal-audio');

// --- Estado: 'reposo', 'texto', 'audio' ---
let estado = "reposo";

// Mostrar saludo inicial
function mostrarSaludo() {
    robotWidget.classList.remove('centrado');
    robotOverlay.classList.remove('visible');
    robotGlobo.classList.remove('modo-entrada', 'modo-audio');
    robotGloboTexto.style.display = '';
    robotFormTexto.style.display = 'none';
    robotModalAudio.style.display = 'none';
    robotGloboClose.style.display = 'none';
    robotGloboTexto.innerHTML = "¡Hola! Soy PM <span style='font-size:1em'>😊</span><br>¿En qué te ayudo?";
    estado = "reposo";
}

// Activar modal centrado: texto o audio
function activarModal(tipo) {
    robotWidget.classList.add('centrado');
    robotOverlay.classList.add('visible');
    robotGlobo.classList.add('modo-entrada');
    robotGloboTexto.style.display = 'none';
    robotGloboClose.style.display = 'block';
    if (tipo === "texto") {
        robotFormTexto.style.display = 'flex';
        robotModalAudio.style.display = 'none';
        estado = "texto";
        setTimeout(() => { robotInputTexto.focus(); }, 160);
    } else if (tipo === "audio") {
        robotFormTexto.style.display = 'none';
        robotModalAudio.style.display = 'flex';
        estado = "audio";
    }
}

// Eventos: click en robot o globo = abrir modal (texto)
robotWidget.addEventListener('click', function(e) {
    // Evita activar si ya está centrado o clic en X costado
    if (estado !== "reposo" || e.target === robotBtnClose) return;
    activarModal('texto');
});
robotGlobo.addEventListener('click', function(e) {
    if (estado !== "reposo") return;
    activarModal('texto');
});

// Botón de texto
robotBtnTX.onclick = function(e) {
    e.stopPropagation();
    activarModal('texto');
};
// Botón de audio
robotBtnAU.onclick = function(e) {
    e.stopPropagation();
    activarModal('audio');
};
// Botón de cerrar (costado, desaparece para siempre con animación cohete)
robotBtnClose.onclick = function(e) {
    e.stopPropagation();
    robotWidget.classList.add('robot-cohete-out');
    setTimeout(() => { robotWidget.style.display = 'none'; robotOverlay.classList.remove('visible'); }, 900);
};
// Botón X del globo/modal (vuelve a estado minimizado)
robotGloboClose.onclick = function(e) {
    e.stopPropagation();
    mostrarSaludo();
};

// Envío pregunta escrita
robotFormTexto.onsubmit = function(e) {
    e.preventDefault();
    robotFormTexto.style.display = 'none';
    robotGloboTexto.style.display = '';
    robotGloboTexto.innerHTML = "Enviando pregunta...";
    // Aquí lógica AJAX
    setTimeout(mostrarSaludo, 1800);
};

// Cierre overlay al click fuera del modal
robotOverlay.onclick = mostrarSaludo;

// Iniciar saludo al cargar
window.addEventListener('DOMContentLoaded', mostrarSaludo);
