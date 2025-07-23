function animarRobotFlotacionConstante() {
    const contenedor = document.getElementById("robot-pm-widget");
    if (!contenedor) return;

    contenedor.animate([
        { transform: "translateY(0)" },
        { transform: "translateY(-12px)" },
        { transform: "translateY(0)" }
    ], {
        duration: 3000,
        iterations: Infinity
    });
}

function animacionSubidaYCaida() {
    const contenedor = document.getElementById("robot-pm-widget");
    const estela = document.getElementById("robot-estela");

    if (!contenedor || !estela) return;

    // 🔥 Mostrar estela
    estela.style.opacity = "1";

    // Subida rápida
    contenedor.animate([
        { transform: "translateY(0)" },
        { transform: "translateY(-100vh)" }
    ], {
        duration: 400,
        easing: "ease-in"
    });

    // Bajada suave y ocultar estela
    setTimeout(() => {
        contenedor.animate([
            { transform: "translateY(-100vh)" },
            { transform: "translateY(0)" }
        ], {
            duration: 3000,
            easing: "ease-out"
        });

        estela.style.opacity = "0";
    }, 400);
}

// Funcionalidad de audio temporalmente deshabilitada
/*
function reproducirSaludo() {
    const audio = document.getElementById("audioBienvenida");
    if (!audio) return;

    audio.play().catch(() => {
        document.addEventListener("click", () => {
            audio.play();
        }, { once: true });
    });
}
*/

function parpadear() {
    const ojos = document.getElementById("robotOjos");
    if (!ojos) return;

    setInterval(() => {
        ojos.style.visibility = "hidden";
        setTimeout(() => {
            ojos.style.visibility = "visible";
        }, 150);
    }, 4000);
}

document.addEventListener("DOMContentLoaded", () => {
    animarRobotFlotacionConstante();
    // reproducirSaludo(); // audio deshabilitado
    parpadear();
    setInterval(animacionSubidaYCaida, 75000); // cada 75 segundos
});
