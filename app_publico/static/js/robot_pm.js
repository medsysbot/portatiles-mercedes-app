// WIDGET ROBOT PM - PORTÁTILES MERCEDES

const robotWidget = document.getElementById('robot-pm-widget');
const robotGlobo = document.getElementById('robot-globo');
const robotGloboTexto = document.getElementById('robot-globo-texto');
const robotGloboClose = document.getElementById('robot-globo-close');

const robotBtnAU = document.getElementById('robot-btn-au');
const robotBtnTX = document.getElementById('robot-btn-tx');
const robotBtnClose = document.getElementById('robot-btn-close');

const robotModalInput = robotGlobo.querySelector('.robot-modal-input');
const robotModalAudio = robotGlobo.querySelector('.robot-modal-audio');

// Estado: 'reposo', 'escribir', 'audio'
let estado = "reposo";

// ----- Mostrar saludo inicial (globo chico)
function mostrarSaludo() {
    robotGloboTexto.textContent = "¡Hola! Soy PM 😊";
    robotGlobo.classList.remove('modo-entrada', 'modo-audio', 'robot-globo-oculto');
    robotGloboClose.style.display = "none";
    estado = "reposo";
}
window.addEventListener('DOMContentLoaded', mostrarSaludo);

// ----- Botón TX (Texto)
robotBtnTX.onclick = () => {
    robotGlobo.classList.add('modo-entrada');
    robotGlobo.classList.remove('modo-audio', 'robot-globo-oculto');
    robotGloboTexto.textContent = ""; // Limpia saludo
    robotModalInput.style.display = "flex";
    robotModalAudio.style.display = "none";
    robotGloboClose.style.display = "block";
    estado = "escribir";
    setTimeout(() => {
        const input = document.getElementById('robot-input-texto');
        if (input) input.focus();
    }, 180);
};

// ----- Botón AU (Audio)
robotBtnAU.onclick = () => {
    robotGlobo.classList.add('modo-audio');
    robotGlobo.classList.remove('modo-entrada', 'robot-globo-oculto');
    robotGloboTexto.textContent = ""; // Limpia saludo
    robotModalInput.style.display = "none";
    robotModalAudio.style.display = "flex";
    robotGloboClose.style.display = "block";
    estado = "audio";
    // Aquí lógica para activar grabación audio (si usás grabador)
};

// ----- Botón Cerrar (costado robot)
robotBtnClose.onclick = () => {
    robotWidget.classList.add('robot-cohete-out');
    setTimeout(() => { robotWidget.style.display = 'none'; }, 900);
};

// ----- Botón X dentro del globo (modal)
robotGloboClose.onclick = () => {
    robotGlobo.classList.add('robot-globo-oculto');
    robotModalInput.style.display = "none";
    robotModalAudio.style.display = "none";
    setTimeout(mostrarSaludo, 350); // Vuelve al saludo chico
};

// ----- ENVIAR PREGUNTA TEXTO
const inputForm = robotGlobo.querySelector('.robot-modal-input');
if (inputForm) {
    inputForm.onsubmit = (e) => {
        e.preventDefault();
        const input = document.getElementById('robot-input-texto');
        if (!input.value.trim()) return;
        robotModalInput.style.display = "none";
        robotGloboTexto.textContent = "Enviando pregunta...";
        robotGloboClose.style.display = "none";
        // Aquí lógica de AJAX para enviar pregunta (demo: vuelve a saludo)
        setTimeout(mostrarSaludo, 1700);
    };
}

// ----- ENVIAR AUDIO (DEMO: solo muestra mensaje)
const audioBtn = robotGlobo.querySelector('#robot-enviar-audio');
if (audioBtn) {
    audioBtn.onclick = () => {
        robotModalAudio.style.display = "none";
        robotGloboTexto.textContent = "Enviando audio...";
        robotGloboClose.style.display = "none";
        setTimeout(mostrarSaludo, 1700);
    };
}
