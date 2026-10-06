/* =====================================================
   ANALÍTICAS DEL NEGOCIO
   Archivo frontend/js/analiticas.js
   - No usa import para evitar errores al cargar vistas con fetch.
   - Usa fetch nativo + Chart.js cargado dinámicamente.
===================================================== */

(function () {
  const API = "http://localhost:3000/api";
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login-Panel.html";
    return;
  }

  let chartPrincipal = null;
  let chartProductos = null;
  let chartEstados = null;
  let chartMetodos = null;

  const dinero = (valor) => "$" + Number(valor || 0).toFixed(2);
  const numero = (valor) => Number(valor || 0).toLocaleString("es-SV");

  const colorTexto = "#f6f6f6";
  const colorMuted = "#a6b0cf";
  const gridColor = "rgba(166,176,207,.12)";

  const colores = {
    azul: "#556ee6",
    celeste: "#50a5f1",
    verde: "#34c38f",
    amarillo: "#f1b44c",
    rojo: "#f46a6a",
    morado: "#74788d"
  };

  function setText(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.innerText = valor;
  }

  function mostrarError(mensaje) {
    console.error(mensaje);
    setText("anaVentasGeneradas", "$0.00");
    const panel = document.getElementById("listaActividadAnaliticas");
    if (panel) {
      panel.innerHTML = `<p class="chart-note">⚠️ ${mensaje}</p>`;
    }
  }

  async function apiGet(ruta) {
    const res = await fetch(`${API}${ruta}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      let detalle = "";
      try {
        const data = await res.json();
        detalle = data.mensaje || data.error || JSON.stringify(data);
      } catch (e) {
        detalle = await res.text();
      }
      throw new Error(`${res.status} ${res.statusText} en ${ruta}. ${detalle}`);
    }

    return await res.json();
  }

  function cargarScript(src) {
    return new Promise((resolve, reject) => {
      const existente = [...document.scripts].find(s => s.src === src);
      if (existente && window.Chart) return resolve();

      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error("No se pudo cargar " + src));
      document.head.appendChild(script);
    });
  }

  function opcionesBase() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: colorTexto,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(42,48,66,.98)",
          titleColor: "#fff",
          bodyColor: "#dbe2f4",
          borderColor: "rgba(85,110,230,.45)",
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || "";
              const value = context.raw || 0;
              if (label.toLowerCase().includes("venta") || label.toLowerCase().includes("ganancia") || label.toLowerCase().includes("ingreso")) {
                return `${label}: ${dinero(value)}`;
              }
              return `${label}: ${numero(value)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: colorMuted },
          grid: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          ticks: { color: colorMuted },
          grid: { color: gridColor }
        }
      }
    };
  }

  function crearGradiente(canvas, color1, color2) {
    const ctx = canvas.getContext("2d");
    const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.height || 260);
    gradiente.addColorStop(0, color1);
    gradiente.addColorStop(1, color2);
    return gradiente;
  }

  function destruir(chart) {
    if (chart) chart.destroy();
    return null;
  }

  function crearGraficaPrincipal(labels, ventas, ganancias, pedidos) {
    const canvas = document.getElementById("chartPrincipalVentas");
    if (!canvas || !window.Chart) return;

    chartPrincipal = destruir(chartPrincipal);

    chartPrincipal = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            type: "bar",
            label: "Ventas generadas",
            data: ventas,
            backgroundColor: crearGradiente(canvas, "rgba(91,108,255,.95)", "rgba(91,108,255,.35)"),
            borderRadius: 12,
            borderSkipped: false
          },
          {
            type: "bar",
            label: "Ganancias confirmadas",
            data: ganancias,
            backgroundColor: crearGradiente(canvas, "rgba(52,211,153,.95)", "rgba(52,211,153,.35)"),
            borderRadius: 12,
            borderSkipped: false
          },
          {
            type: "line",
            label: "Pedidos",
            data: pedidos,
            yAxisID: "pedidosAxis",
            borderColor: colores.amarillo,
            backgroundColor: "rgba(251,191,36,.18)",
            pointBackgroundColor: colores.amarillo,
            pointRadius: 4,
            tension: .35,
            fill: false
          }
        ]
      },
      options: {
        ...opcionesBase(),
        scales: {
          ...opcionesBase().scales,
          pedidosAxis: {
            position: "right",
            beginAtZero: true,
            ticks: { color: colorMuted },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  function crearGraficaBarras(id, labels, datos, etiqueta) {
    const canvas = document.getElementById(id);
    if (!canvas || !window.Chart) return;

    if (id === "chartProductosVendidos") chartProductos = destruir(chartProductos);

    const nueva = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: etiqueta,
          data: datos,
          backgroundColor: crearGradiente(canvas, "rgba(34,211,238,.95)", "rgba(91,108,255,.35)"),
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: opcionesBase()
    });

    if (id === "chartProductosVendidos") chartProductos = nueva;
  }

  function crearGraficaDona(id, labels, datos, etiqueta) {
    const canvas = document.getElementById(id);
    if (!canvas || !window.Chart) return;

    if (id === "chartEstadosPedidos") chartEstados = destruir(chartEstados);
    if (id === "chartMetodosPago") chartMetodos = destruir(chartMetodos);

    const nueva = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          label: etiqueta,
          data: datos,
          backgroundColor: [colores.azul, colores.verde, colores.amarillo, colores.celeste, colores.rojo, colores.morado],
          borderColor: "rgba(15,23,42,.9)",
          borderWidth: 3,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "64%",
        plugins: opcionesBase().plugins
      }
    });

    if (id === "chartEstadosPedidos") chartEstados = nueva;
    if (id === "chartMetodosPago") chartMetodos = nueva;
  }

  async function cargarResumen() {
    const data = await apiGet("/analiticas/resumen");

    setText("anaVentasGeneradas", dinero(data.ventas_generadas));
    setText("anaGananciasConfirmadas", dinero(data.ganancias_confirmadas));
    setText("anaVentasHoy", dinero(data.ventas_hoy));
    setText("anaProductosVendidos", numero(data.productos_vendidos));
    setText("anaPedidosValidos", numero(data.pedidos_validos));
    setText("anaTicketPromedio", dinero(data.ticket_promedio));
    setText("anaVentasMes", dinero(data.ventas_mes));
    setText("anaVentasAnio", dinero(data.ventas_anio));
    setText("anaPedidosHoy", `${numero(data.pedidos_hoy)} pedidos hoy`);
  }

  async function cargarGraficaPorPeriodo(periodo = "dia") {
    const rutas = {
      dia: "/analiticas/ventas-dia",
      mes: "/analiticas/ventas-mes",
      anio: "/analiticas/ventas-anio"
    };

    const titulos = {
      dia: ["Ventas y ganancias por día", "Últimos 30 días"],
      mes: ["Ventas y ganancias por mes", "Últimos 12 meses"],
      anio: ["Ventas y ganancias por año", "Comparación anual"]
    };

    const data = await apiGet(rutas[periodo]);

    const labels = data.map(item => {
      if (periodo === "dia") return item.fecha_label || item.fecha;
      if (periodo === "mes") return item.mes_label || item.mes;
      return item.anio;
    });

    setText("tituloGraficaPrincipal", titulos[periodo][0]);
    setText("subtituloGraficaPrincipal", titulos[periodo][1]);

    crearGraficaPrincipal(
      labels,
      data.map(item => Number(item.ventas || 0)),
      data.map(item => Number(item.ganancias || 0)),
      data.map(item => Number(item.pedidos || 0))
    );
  }

  async function cargarProductosVendidos() {
    const data = await apiGet("/analiticas/productos-vendidos");
    const mensaje = document.getElementById("mensajeProductosVendidos");

    if (!data.disponible || !data.productos.length) {
      if (mensaje) mensaje.innerText = data.mensaje || "Aún no hay productos vendidos.";
      crearGraficaBarras("chartProductosVendidos", ["Sin datos"], [0], "Unidades vendidas");
      return;
    }

    if (mensaje) mensaje.innerText = "Pasa el mouse sobre cada barra para ver unidades vendidas.";
    crearGraficaBarras(
      "chartProductosVendidos",
      data.productos.map(item => item.nombre || "Sin nombre"),
      data.productos.map(item => Number(item.unidades_vendidas || 0)),
      "Unidades vendidas"
    );
  }

  async function cargarEstadosPedidos() {
    const data = await apiGet("/analiticas/estado-pedidos");
    crearGraficaDona(
      "chartEstadosPedidos",
      data.map(item => item.estado || "Sin estado"),
      data.map(item => Number(item.total || 0)),
      "Pedidos"
    );
  }

  async function cargarMetodosPago() {
    const data = await apiGet("/analiticas/metodos-pago");
    const mensaje = document.getElementById("mensajeMetodosPago");

    if (!data.disponible || !data.metodos.length) {
      if (mensaje) mensaje.innerText = data.mensaje || "Aún no hay métodos de pago.";
      crearGraficaDona("chartMetodosPago", ["Sin datos"], [0], "Pedidos");
      return;
    }

    if (mensaje) mensaje.innerText = "Distribución de pedidos por método de pago.";
    crearGraficaDona(
      "chartMetodosPago",
      data.metodos.map(item => item.metodo_pago || "Sin método"),
      data.metodos.map(item => Number(item.total || 0)),
      "Pedidos"
    );
  }

  async function cargarActividad() {
    const contenedor = document.getElementById("listaActividadAnaliticas");
    if (!contenedor) return;

    const data = await apiGet("/analiticas/pedidos-recientes");

    if (!data.length) {
      contenedor.innerHTML = `<p class="chart-note">Aún no hay pedidos recientes.</p>`;
      return;
    }

    contenedor.innerHTML = data.map(pedido => `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div>
          <strong>${pedido.codigo_pedido || "Pedido #" + pedido.id}</strong>
          <span>${pedido.cliente || "Cliente no registrado"} · ${pedido.estado || "Sin estado"}</span>
        </div>
        <b>${dinero(pedido.total)}</b>
      </div>
    `).join("");
  }

  function activarTabs() {
    document.querySelectorAll(".chart-tabs button").forEach(btn => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll(".chart-tabs button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        await cargarGraficaPorPeriodo(btn.dataset.periodo);
      });
    });
  }

  async function iniciarAnaliticas() {
    try {
      setText("anaFechaActual", new Date().toLocaleDateString("es-SV", { weekday: "long", day: "2-digit", month: "long" }));
      await cargarScript("https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js");
      activarTabs();

      await Promise.all([
        cargarResumen(),
        cargarGraficaPorPeriodo("dia"),
        cargarProductosVendidos(),
        cargarEstadosPedidos(),
        cargarMetodosPago(),
        cargarActividad()
      ]);
    } catch (error) {
      mostrarError("Error al cargar analíticas: " + error.message);
    }
  }

  iniciarAnaliticas();
})();
