document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", async function(event) {
      event.preventDefault();

      const rol = document.querySelector("select[name='rol']").value;
      const email = document.querySelector("input[name='email']").value;
      const password = document.querySelector("input[name='password']").value;

      if (!rol || !email || !password) {
        alert("Por favor completá todos los campos.");
        return;
      }

      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rol, email, password })
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("access_token", data.access_token);
          if (data.rol) {
            localStorage.setItem("rol", data.rol);
          }
          if (data.nombre) {
            localStorage.setItem("nombre", data.nombre);
          }
          if (data.rol === "admin") {
            window.location.href = "/admin_splash";
          } else if (data.rol === "cliente") {
            window.location.href = "/cliente_panel";
          } else {
            window.location.href = "/";
          }
        } else {
          alert(data.detail || "Credenciales incorrectas o error al ingresar.");
        }
      } catch (error) {
        alert("No se pudo conectar con el servidor.");
      }
    });
  }
});
