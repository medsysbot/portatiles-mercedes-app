function animarRobotFlotacionConstante() {
    const robot = document.getElementById("robot-pm-img");
    if (!robot) return;

    robot.animate([
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
    if (!contenedor) return;

    // Subida rápida
    contenedor.animate([
        { transform: "translateY(0)" },
        { transform: "translateY(-100vh)" }
    ], {
        duration: 400,
        easing: "ease-in"
    });

    // Bajada lenta (empezamos justo después)
    setTimeout(() => {
        contenedor.animate([
            { transform: "translateY(-100vh)" },
            { transform: "translateY(0)" }
        ], {
            duration: 3000, // 👈 bien despacito
            easing: "ease-out"
        });
    }, 400);
}

function reproducirSaludo() {
    const audio = document.getElementById("audioBienvenida");
    if (!audio) return;

    audio.play().catch(() => {
        document.addEventListener("click", () => {
            audio.play();
        }, { once: true });
    });
}

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
    reproducirSaludo();
    parpadear();

    // Subida cada 75 segundos (1 minuto y 15 segundos)
    setInterval(() => {
        animacionSubidaYCaida();
    }, 75000);
});
