// === ROBOT PM WIDGET - Portátiles Mercedes ===
// Este JS controla el widget fijo, botones AU/TX/X y el globo-modal
document.addEventListener('DOMContentLoaded', function () {
    const widget = document.getElementById('robot-pm-widget');
    const btnTX = document.getElementById('robot-btn-tx');
    const btnAU = document.getElementById('robot-btn-au');
    const btnClose = document.getElementById('robot-btn-close');
    const globo = document.getElementById('robot-globo');
    const globoContenido = document.getElementById('robot-globo-contenido');
    const globoClose = document.getElementById('robot-globo-close');
    let modo = null; // 'texto' | 'audio'

    // Utilidad: mostrar el globo
    function mostrarGlobo(contenidoHTML, mostrarCerrar = true) {
        globoContenido.innerHTML = contenidoHTML;
        globo.classList.remove('robot-globo-oculto');
        if (mostrarCerrar) globoClose.style.display = "block";
        else globoClose.style.display = "none";
    }

    // Utilidad: ocultar globo
    function ocultarGlobo() {
        globo.classList.add('robot-globo-oculto');
        globoContenido.innerHTML = '';
        modo = null;
    }

    // Mostrar globo de saludo inicial
    mostrarGlobo('¡Hola! Soy PM 😊 ¿En qué te ayudo?', false);

    // --- BOTÓN TEXTO ---
    btnTX.addEventListener('click', function (e) {
        e.preventDefault();
        modo = 'texto';
        mostrarGlobo(`
            <form id="robot-form-texto" autocomplete="off" style="display:flex;align-items:center;width:100%;">
              <input type="text" id="robot-input-texto" class="robot-input-texto" maxlength="180" placeholder="Escribí tu pregunta aquí">
              <button type="submit" class="robot-btn-enviar" title="Enviar pregunta">&#8594;</button>
            </form>
        `);
        document.getElementById('robot-input-texto').focus();

        // Listener del form (una sola vez)
        setTimeout(() => {
            const formTexto = document.getElementById('robot-form-texto');
            if (formTexto) {
                formTexto.onsubmit = async function(ev) {
                    ev.preventDefault();
                    const texto = document.getElementById('robot-input-texto').value.trim();
                    if (!texto) return;
                    mostrarGlobo('<span>Enviando...</span><span style="font-size:27px;vertical-align:middle;">&#8594;</span>');
                    // Aquí deberías enviar la pregunta al backend
                    setTimeout(() => mostrarGlobo('¡Pregunta enviada! 😊'), 1200);
                };
            }
        }, 80);
    });

    // --- BOTÓN AUDIO ---
    btnAU.addEventListener('click', function (e) {
        e.preventDefault();
        modo = 'audio';
        mostrarGlobo(`
            <div style="display:flex;align-items:center;">
                <span class="robot-microfono">&#127908;</span>
                <span style="font-size:17px;margin-left:7px;">Presioná el micrófono para grabar tu pregunta.</span>
            </div>
        `);
        // Aquí agregar lógica de grabación si hace falta
    });

    // --- BOTÓN CIERRE (costado del robot) ---
    btnClose.addEventListener('click', function (e) {
        e.preventDefault();
        widget.classList.add('robot-cohete-out');
        setTimeout(() => { widget.style.display = 'none'; }, 950);
    });

    // --- BOTÓN CIERRE DEL GLOBO ---
    globoClose.addEventListener('click', function (e) {
        e.preventDefault();
        ocultarGlobo();
        setTimeout(() => {
            mostrarGlobo('¡Hola! Soy PM 😊 ¿En qué te ayudo?', false);
        }, 300);
    });

    // Saludo inicial
    setTimeout(() => {
        mostrarGlobo('¡Hola! Soy PM 😊 ¿En qué te ayudo?', false);
    }, 900);
});
