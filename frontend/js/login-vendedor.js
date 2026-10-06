const API = "http://localhost:3000/api";

const loginForm = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    // Login exclusivo para vendedores.
    const res = await axios.post(`${API}/auth/login-vendedor`, { email, password });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("usuario", JSON.stringify(res.data.usuario));
    localStorage.setItem("portalSesion", "tienda");

    mensaje.style.color = "#4ade80";
    mensaje.textContent = new URLSearchParams(location.search).get("renovar") === "1"
      ? "Sesión renovada. Ya puedes volver a la pestaña del producto."
      : "Inicio de sesión correcto";

    const renovando = new URLSearchParams(location.search).get("renovar") === "1";
    if (!renovando) {
      setTimeout(() => {
        // Nunca se redirige desde este login hacia dashboard.html.
        window.location.href = "panel-vendedor.html";
      }, 700);
    }
  } catch (error) {
    mensaje.style.color = "#f87171";
    if (error.response && [401, 403].includes(error.response.status)) {
      mensaje.textContent = "Correo o contraseña incorrectos";
    } else if (error.response) {
      mensaje.textContent = error.response.data.mensaje || "No se pudo iniciar sesión";
    } else {
      mensaje.textContent = "Error al conectar con el servidor";
    }
  }
});
