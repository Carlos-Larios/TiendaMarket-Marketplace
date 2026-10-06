import "./style.css";

document.querySelector("#app").innerHTML = `
  <div class="container">
    <h1>Login 🚀</h1>

    <input type="email" id="email" placeholder="Correo" />

    <input type="password" id="password" placeholder="Contraseña" />

    <button id="loginBtn">Iniciar sesión</button>

    <p id="mensaje"></p>
  </div>
`;

import axios from "axios";

const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await axios.post(
      "http://localhost:3000/api/auth/login",
      {
        email,
        password,
      }
    );

    document.getElementById("mensaje").innerText =
      response.data.mensaje;

    console.log(response.data);
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("usuario", JSON.stringify(response.data.usuario));

    window.location.href = "/dashboard.html";
  } catch (error) {
    document.getElementById("mensaje").innerText =
      "Error al iniciar sesión";
  }
});