/*
Archivo: login.js
Descripción: Lógica de validación y envío del login público
Acceso: Público
Proyecto: Portátiles Mercedes
Última modificación: 2025-07-07 (ajuste: guarda usuario_obj con dni_cuit_cuil)
*/
const form = document.getElementById("loginForm") || document.getElementById("form-login");
if (form) {
// ==== Eventos de UI ==== 
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        // IMPORTANTE: El campo debe llamarse "password" (sin ñ ni tilde) en todo el flujo
        const password = document.getElementById("password").value;
        const rol = document.getElementById("rol").value.trim();

        // Log de depuración para verificar los datos antes del envío
        console.log("Datos enviados al backend:", { email, password, rol });

        const datos = { email, password, rol };

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
                    
                    // ==== GUARDADO UNIFICADO DE USUARIO SEGÚN ROL ====
                    // Para clientes: data.usuario contiene dni_cuit_cuil, email, nombre
                    // Para empleados/administrador: data.rol, data.nombre, etc.

                    if (data.usuario && data.usuario.dni_cuit_cuil) {
                        // CLIENTE: Guardar usuario_obj para panel clientes
                        localStorage.setItem("usuario_obj", JSON.stringify({
                            dni_cuit_cuil: data.usuario.dni_cuit_cuil,
                            email: data.usuario.email,
                            nombre: data.usuario.nombre
                        }));
                    } else if (data.rol && (data.rol === "empleado" || data.rol === "Empleado" || data.rol === "Administrador")) {
                        // EMPLEADO o ADMINISTRADOR: (ajusta aquí si querés guardar otros datos)
                        localStorage.setItem("usuario_obj", JSON.stringify({
                            email: data.email || email,
                            nombre: data.nombre || "",
                            rol: data.rol,
                            id: data.id || ""
                        }));
                    }

                    // Guardar campos individuales para compatibilidad vieja
                    if (data.rol) {
                        localStorage.setItem("rol", data.rol);
                    }
                    if (data.nombre) {
                        localStorage.setItem("nombre", data.nombre);
                    }
                    if (data.id) {
                        localStorage.setItem("user_id", data.id);
                    }

                    // ==== REDIRECCIONES SEGÚN ROL ====
                    if (data.rol === "Administrador") {
                        window.location.href = "/splash";
                    } else if (data.rol === "empleado" || data.rol === "Empleado") {
                        window.location.href = "/empleado/panel";
                    } else if (data.usuario && data.usuario.dni_cuit_cuil) {
                        window.location.href = "/cliente/panel";
                    } else {
                        window.location.href = "/splash_cliente";
                    }
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
