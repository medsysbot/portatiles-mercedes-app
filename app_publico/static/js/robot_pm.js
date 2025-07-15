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
    const robot = document.getElementById("robot-pm-img");
    if (!robot) return;

    robot.animate([
        { transform: "translateY(0)" },
        { transform: "translateY(-100vh)" }, // Sale rápido hacia arriba
        { transform: "translateY(0)" }       // Vuelve suavemente
    ], {
        duration: 2200,
        easing: "ease-in-out"
    });
}

function reproducirSaludo() {
    const audio = document.getElementById("audioBienvenida");
    if (!audio) return;

    audio.play().then(() => {
        console.log("✅ Audio reproducido automáticamente.");
    }).catch(() => {
        document.addEventListener("click", () => {
            audio.play().then(() => {
                console.log("✅ Audio reproducido tras clic.");
            }).catch(err => {
                console.error("❌ No se pudo reproducir el audio tras clic:", err);
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
    animarRobotFlotacionConstante();
    reproducirSaludo();
    parpadear();

    // Lanzar subida/captura cada 15 segundos
    setInterval(() => {
        animacionSubidaYCaida();
    }, 15000);
});
