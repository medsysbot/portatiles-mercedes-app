document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const rol = document.querySelector("select[name='rol']").value;
  const email = document.querySelector("input[name='email']").value;
  const password = document.querySelector("input[name='password']").value;

  // Validación básica
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
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      // Redirigir según rol
      if (data.usuario.rol === "admin") {
        window.location.href = "/admin_splash";
      } else if (data.usuario.rol === "cliente") {
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
