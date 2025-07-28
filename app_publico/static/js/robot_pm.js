// WIDGET ROBOT PM - PORTÁTILES MERCEDES

const robotGlobo = document.getElementById('robot-globo');
const robotGloboTexto = document.getElementById('robot-globo-texto');
const robotGloboClose = document.getElementById('robot-globo-close');

const robotBtnAU = document.getElementById('robot-btn-au');
const robotBtnTX = document.getElementById('robot-btn-tx');
const robotBtnClose = document.getElementById('robot-btn-close');

// Estado: 'reposo', 'escribir', 'audio'
let estado = "reposo";

// Saludo inicial (globo chico)
function mostrarSaludo() {
    robotGloboTexto.innerHTML = "¡Hola! Soy PM <span style='font-size:1em'>😊</span><br>¿En qué te ayudo?";
    robotGlobo.classList.remove('robot-globo-oculto');
    estado = "reposo";
}
window.addEventListener('DOMContentLoaded', mostrarSaludo);

// Botón TX (Texto)
robotBtnTX.onclick = () => {
    robotGloboTexto.innerHTML =
      `<form id="robot-form-texto" class="robot-globo-input" autocomplete="off">
         <input id="robot-input-texto" type="text" maxlength="180" placeholder="Escribí tu pregunta aquí" required>
         <button class="robot-btn-enviar" type="submit" title="Enviar pregunta">&#8594;</button>
       </form>`;
    robotGlobo.classList.remove('robot-globo-oculto');
    estado = "escribir";
    setTimeout(() => { document.getElementById('robot-input-texto').focus(); }, 180);
    // Submit pregunta escrita
    const formTexto = document.getElementById('robot-form-texto');
    formTexto.onsubmit = (e) => {
        e.preventDefault();
        // Aquí lógica para enviar pregunta escrita (AJAX)
        robotGloboTexto.innerHTML = "Enviando pregunta...";
        setTimeout(mostrarSaludo, 1800); // Demo: vuelve a saludo
    };
};

// Botón AU (Audio)
robotBtnAU.onclick = () => {
    robotGloboTexto.innerHTML =
      `<div class="robot-globo-audio">
         <span id="robot-mic-icono">&#127908;</span>
         <span id="robot-audio-status">Presioná el micrófono para grabar tu pregunta.</span>
       </div>`;
    robotGlobo.classList.remove('robot-globo-oculto');
    estado = "audio";
    // Aquí lógica para activar grabación audio
};

// Botón Cerrar (costado robot)
robotBtnClose.onclick = () => {
    // Animación cohete
    const robot = document.getElementById('robot-pm-widget');
    robot.classList.add('robot-cohete-out');
    setTimeout(() => { robot.style.display = 'none'; }, 900);
};

// Botón X dentro del globo
robotGloboClose.onclick = () => {
    robotGlobo.classList.add('robot-globo-oculto');
    if (estado !== "reposo") mostrarSaludo();
};

