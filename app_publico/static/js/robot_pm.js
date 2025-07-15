function animarRobot() {
    const robot = document.getElementById("robot-pm-img");
    if (!robot) return;

    robot.animate([
        { transform: "translateY(0px)" },
        { transform: "translateY(-10px)" },
        { transform: "translateY(0px)" }
    ], {
        duration: 3000,
        iterations: Infinity
    });
}

function reproducirSaludo() {
    const audio = document.getElementById("audioBienvenida");
    if (!audio) return;

    audio.play().then(() => {
        console.log("Audio reproducido automáticamente.");
    }).catch((error) => {
        console.warn("Autoplay bloqueado. Esperando clic del usuario...");
        document.addEventListener("click", () => {
            audio.play().then(() => {
                console.log("Audio reproducido tras clic.");
            }).catch(err => {
                console.error("No se pudo reproducir el audio tras clic:", err);
            });
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
    animarRobot();
    reproducirSaludo();
    parpadear();
});
