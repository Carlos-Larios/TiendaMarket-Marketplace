const API = "http://localhost:3000/api";
const loginForm = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await axios.post(`${API}/auth/login-panel`, { email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("usuario", JSON.stringify(res.data.usuario));
    localStorage.setItem("portalSesion", "panel");

    mensaje.style.color = "#4ade80";
    mensaje.textContent = "Acceso autorizado";
    setTimeout(() => window.location.replace("dashboard.html"), 500);
  } catch (error) {
    mensaje.style.color = "#f87171";
    mensaje.textContent = error.response?.data?.mensaje || "No se pudo iniciar sesión";
  }
});
