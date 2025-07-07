/*
Archivo: login.js
Descripción: Login con almacenamiento correcto del JWT.
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-07-07
*/
const form = document.getElementById("loginForm") || document.getElementById("form-login");
if (form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const rol = document.getElementById("rol").value.trim();

        const datos = { email, password, rol };

        const errorEl = document.getElementById("errorMsg");
        if (errorEl) errorEl.textContent = "";

        fetch("/login", {
            method: "POST",
            body: JSON.stringify(datos),
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(async res => {
            const data = await res.json();
            if (res.ok && data.token) {  // Aquí claramente está la mejora del manejo de token JWT
                localStorage.setItem("token", data.token);  // Token JWT almacenado correctamente
                localStorage.setItem("email", email);
                if (data.rol) localStorage.setItem("rol", data.rol);
                if (data.nombre) localStorage.setItem("nombre", data.nombre);
                if (data.id) localStorage.setItem("user_id", data.id);

                if (data.rol === "Administrador") {
                    window.location.href = "/splash";
                } else if (data.rol.toLowerCase() === "empleado") {
                    window.location.href = "/empleado/panel";
                } else {
                    window.location.href = "/splash_cliente";
                }
            } else {
                if (errorEl) errorEl.textContent = data.detail || "Credenciales incorrectas.";
            }
        })
        .catch(error => {
            console.error("Error en login:", error);
            if (errorEl) errorEl.textContent = "Error al iniciar sesión.";
        });
    });
}
