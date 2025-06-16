/*
Archivo: login.js
Descripción: Lógica de validación y envío del login público
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-06-15
*/
const form = document.getElementById("loginForm") || document.getElementById("form-login");
if (form) {
// ==== Eventos de UI ==== 
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const datos = {
            email: document.getElementById("email").value,
            // IMPORTANTE: El campo debe llamarse "password" (sin ñ ni tilde) en todo el flujo
            password: document.getElementById("password").value,
            rol: form.querySelector('select[name="rol"]').value
        };

        // Log de depuración para verificar los datos antes del envío
        console.log("Datos enviados al backend:", datos);

        const errorEl = document.getElementById("errorMsg");
        if (errorEl) errorEl.textContent = "";

// ==== Envío de datos ====
        fetch("/login", {
            method: "POST",
            body: JSON.stringify(datos),
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(async res => {
                const data = await res.json();
                if (res.ok && data.access_token) {
                    localStorage.setItem("access_token", data.access_token);
                    if (data.rol) {
                        localStorage.setItem("rol", data.rol);
                    }
                    if (data.nombre) {
                        localStorage.setItem("nombre", data.nombre);
                    }
                    window.location.href = "/admin_panel";
                } else {
                    if (errorEl) {
                        errorEl.textContent = data.detail || "Credenciales incorrectas.";
                    }
                }
            })
            .catch(error => {
                console.error("Error en login:", error);
                if (errorEl) errorEl.textContent = "Error al iniciar sesión.";
            });
    });
}
