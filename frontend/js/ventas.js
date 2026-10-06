/* =====================================================
   VENTAS / REPORTE POR AÑO -> MES -> PRODUCTOS
===================================================== */
(function () {
  const API = "http://localhost:3000/api";
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login-Panel.html";
    return;
  }

  let anioSeleccionado = null;
  let mesSeleccionado = null;
  let chartVentas = null;

  const dinero = (valor) => "$" + Number(valor || 0).toFixed(2);
  const numero = (valor) => Number(valor || 0).toLocaleString("es-SV");

  const colores = {
    azul: "#556ee6",
    verde: "#34c38f",
    celeste: "#50a5f1",
    amarillo: "#f1b44c",
    rojo: "#f46a6a"
  };

  function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.innerText = valor;
  }

  async function apiGet(ruta) {
    const res = await fetch(`${API}${ruta}`, {
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
      throw new Error(`${res.status} en ${ruta}: ${detalle}`);
    }

    return await res.json();
  }

  function cargarScript(src) {
    return new Promise((resolve, reject) => {
      if (window.Chart) return resolve();

      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error("No se pudo cargar Chart.js"));
      document.head.appendChild(script);
    });
  }

  function actualizarKpis(items) {
    const ventas = items.reduce((sum, x) => sum + Number(x.ventas_generadas || x.total_vendido || 0), 0);
    const ganancias = items.reduce((sum, x) => sum + Number(x.ganancias_confirmadas || x.total_vendido || 0), 0);
    const pedidos = items.reduce((sum, x) => sum + Number(x.pedidos_validos || x.pedidos || 0), 0);
    const productos = items.reduce((sum, x) => sum + Number(x.productos_vendidos || x.unidades_vendidas || 0), 0);

    setText("ventasTotalGeneradas", dinero(ventas));
    setText("ventasGananciasConfirmadas", dinero(ganancias));
    setText("ventasPedidosValidos", numero(pedidos));
    setText("ventasProductosVendidos", numero(productos));
  }

  function formatoFecha(fecha) {
    if (!fecha) return "Sin fecha";
    return new Date(fecha).toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function nombreMes(numeroMes) {
    const fecha = new Date(2026, Number(numeroMes) - 1, 1);
    return fecha.toLocaleDateString("es-SV", { month: "long" });
  }

  function activarCrumbs(nivel) {
    const btnAnios = document.getElementById("btnVentasAnios");
    const btnMeses = document.getElementById("btnVentasMeses");
    const btnProductos = document.getElementById("btnVentasProductos");

    [btnAnios, btnMeses, btnProductos].forEach(btn => btn && btn.classList.remove("active"));

    if (nivel === "anios") {
      btnAnios?.classList.add("active");
      if (btnMeses) btnMeses.disabled = true;
      if (btnProductos) btnProductos.disabled = true;
      setText("ventasVistaActual", "Años");
    }

    if (nivel === "meses") {
      btnMeses?.classList.add("active");
      if (btnMeses) btnMeses.disabled = false;
      if (btnProductos) btnProductos.disabled = true;
      setText("ventasVistaActual", String(anioSeleccionado));
    }

    if (nivel === "productos") {
      btnProductos?.classList.add("active");
      if (btnMeses) btnMeses.disabled = false;
      if (btnProductos) btnProductos.disabled = false;
      setText("ventasVistaActual", `${nombreMes(mesSeleccionado)} ${anioSeleccionado}`);
    }
  }

  function pintarGrafica(labels, datasets) {
    const canvas = document.getElementById("chartVentasNiveles");
    if (!canvas || !window.Chart) return;

    if (chartVentas) chartVentas.destroy();

    chartVentas = new Chart(canvas, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            labels: {
              color: "#f6f6f6",
              usePointStyle: true,
              boxWidth: 8,
              boxHeight: 8
            }
          },
          tooltip: {
            backgroundColor: "rgba(42,48,66,.98)",
            titleColor: "#ffffff",
            bodyColor: "#dbe2f4",
            borderColor: "rgba(85,110,230,.45)",
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function(ctx) {
                const label = ctx.dataset.label || "";
                const value = ctx.raw || 0;
                if (label.toLowerCase().includes("venta") || label.toLowerCase().includes("ganancia") || label.toLowerCase().includes("total")) {
                  return `${label}: ${dinero(value)}`;
                }
                return `${label}: ${numero(value)}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: "#a6b0cf" },
            grid: { color: "rgba(166,176,207,.08)" }
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#a6b0cf" },
            grid: { color: "rgba(166,176,207,.12)" }
          }
        }
      }
    });
  }

  function mostrarMensaje(texto) {
    const el = document.getElementById("ventasMensaje");
    if (el) el.innerText = texto || "";
  }

  function pintarAnios(data) {
    activarCrumbs("anios");
    anioSeleccionado = null;
    mesSeleccionado = null;

    document.getElementById("ventasDetalleMes")?.classList.add("oculto");

    setText("ventasTituloTabla", "Ventas por año");
    setText("ventasSubtituloTabla", "Haz clic en un año para abrir sus meses.");
    setText("ventasTituloGrafica", "Ventas y ganancias por año");

    document.getElementById("ventasTablaHead").innerHTML = `
      <tr>
        <th>Año</th>
        <th>Ventas generadas</th>
        <th>Ganancias confirmadas</th>
        <th>Pedidos</th>
        <th>Productos vendidos</th>
        <th>Ticket promedio</th>
      </tr>
    `;

    const body = document.getElementById("ventasTablaBody");

    if (!data.length) {
      body.innerHTML = `<tr><td colspan="6" class="sin-resultados">Aún no hay ventas registradas.</td></tr>`;
      actualizarKpis([]);
      pintarGrafica(["Sin datos"], [{ label: "Ventas", data: [0], backgroundColor: colores.azul }]);
      return;
    }

    body.innerHTML = data.map(row => `
      <tr class="fila-click" data-anio="${row.anio}">
        <td><strong>${row.anio}</strong></td>
        <td>${dinero(row.ventas_generadas)}</td>
        <td>${dinero(row.ganancias_confirmadas)}</td>
        <td>${numero(row.pedidos_validos)}</td>
        <td>${numero(row.productos_vendidos)}</td>
        <td>${dinero(row.ticket_promedio)}</td>
      </tr>
    `).join("");

    body.querySelectorAll("[data-anio]").forEach(fila => {
      fila.addEventListener("click", () => cargarMeses(fila.dataset.anio));
    });

    actualizarKpis(data);
    mostrarMensaje("Haz clic sobre cualquier año para ver el detalle mensual.");

    pintarGrafica(
      data.map(row => row.anio),
      [
        {
          label: "Ventas generadas",
          data: data.map(row => Number(row.ventas_generadas || 0)),
          backgroundColor: "rgba(85,110,230,.82)",
          borderRadius: 10
        },
        {
          label: "Ganancias confirmadas",
          data: data.map(row => Number(row.ganancias_confirmadas || 0)),
          backgroundColor: "rgba(52,195,143,.82)",
          borderRadius: 10
        },
        {
          type: "line",
          label: "Pedidos",
          data: data.map(row => Number(row.pedidos_validos || 0)),
          borderColor: colores.amarillo,
          pointBackgroundColor: colores.amarillo,
          tension: .35
        }
      ]
    );
  }

  function pintarMeses(data) {
    activarCrumbs("meses");

    document.getElementById("ventasDetalleMes")?.classList.add("oculto");

    setText("ventasTituloTabla", `Ventas de ${anioSeleccionado} por mes`);
    setText("ventasSubtituloTabla", "Haz clic en un mes para ver los productos vendidos.");
    setText("ventasTituloGrafica", `Ventas mensuales de ${anioSeleccionado}`);

    document.getElementById("ventasTablaHead").innerHTML = `
      <tr>
        <th>Mes</th>
        <th>Ventas generadas</th>
        <th>Ganancias confirmadas</th>
        <th>Pedidos</th>
        <th>Productos vendidos</th>
        <th>Ticket promedio</th>
      </tr>
    `;

    const body = document.getElementById("ventasTablaBody");

    if (!data.length) {
      body.innerHTML = `<tr><td colspan="6" class="sin-resultados">No hay ventas para este año.</td></tr>`;
      actualizarKpis([]);
      return;
    }

    body.innerHTML = data.map(row => `
      <tr class="fila-click" data-mes="${row.mes}">
        <td><strong>${nombreMes(row.mes)}</strong></td>
        <td>${dinero(row.ventas_generadas)}</td>
        <td>${dinero(row.ganancias_confirmadas)}</td>
        <td>${numero(row.pedidos_validos)}</td>
        <td>${numero(row.productos_vendidos)}</td>
        <td>${dinero(row.ticket_promedio)}</td>
      </tr>
    `).join("");

    body.querySelectorAll("[data-mes]").forEach(fila => {
      fila.addEventListener("click", () => cargarProductosMes(anioSeleccionado, fila.dataset.mes));
    });

    actualizarKpis(data);
    mostrarMensaje("Haz clic sobre un mes para ver todos los productos vendidos en ese mes.");

    pintarGrafica(
      data.map(row => nombreMes(row.mes)),
      [
        {
          label: "Ventas generadas",
          data: data.map(row => Number(row.ventas_generadas || 0)),
          backgroundColor: "rgba(80,165,241,.82)",
          borderRadius: 10
        },
        {
          label: "Ganancias confirmadas",
          data: data.map(row => Number(row.ganancias_confirmadas || 0)),
          backgroundColor: "rgba(52,195,143,.82)",
          borderRadius: 10
        },
        {
          type: "line",
          label: "Productos vendidos",
          data: data.map(row => Number(row.productos_vendidos || 0)),
          borderColor: colores.amarillo,
          pointBackgroundColor: colores.amarillo,
          tension: .35
        }
      ]
    );
  }

  function pintarProductos(data) {
    activarCrumbs("productos");

    setText("ventasTituloTabla", `Productos vendidos en ${nombreMes(mesSeleccionado)} ${anioSeleccionado}`);
    setText("ventasSubtituloTabla", "Detalle de productos vendidos durante el mes seleccionado.");
    setText("ventasTituloGrafica", "Top productos del mes");

    document.getElementById("ventasTablaHead").innerHTML = `
      <tr>
        <th>Producto</th>
        <th>Unidades vendidas</th>
        <th>Total vendido</th>
        <th>Precio promedio</th>
        <th>Pedidos</th>
      </tr>
    `;

    const body = document.getElementById("ventasTablaBody");
    const productos = data.productos || [];

    if (!productos.length) {
      body.innerHTML = `<tr><td colspan="5" class="sin-resultados">No hay productos vendidos en pedido_detalles para este mes.</td></tr>`;
      actualizarKpis([]);
      pintarGrafica(["Sin datos"], [{ label: "Productos", data: [0], backgroundColor: colores.celeste }]);
      mostrarMensaje(data.mensaje || "Para ver productos vendidos, debes llenar la tabla pedido_detalles.");
      return;
    }

    body.innerHTML = productos.map(row => `
      <tr>
        <td><strong>${row.nombre_producto || "Sin nombre"}</strong></td>
        <td>${numero(row.unidades_vendidas)}</td>
        <td>${dinero(row.total_vendido)}</td>
        <td>${dinero(row.precio_promedio)}</td>
        <td>${numero(row.pedidos)}</td>
      </tr>
    `).join("");

    actualizarKpis(productos);
    mostrarMensaje("Estos datos vienen de pedido_detalles, unidos con pedidos y productos.");

    pintarGrafica(
      productos.map(row => row.nombre_producto || "Sin nombre"),
      [
        {
          label: "Unidades vendidas",
          data: productos.map(row => Number(row.unidades_vendidas || 0)),
          backgroundColor: "rgba(34,211,238,.82)",
          borderRadius: 10
        },
        {
          type: "line",
          label: "Total vendido",
          data: productos.map(row => Number(row.total_vendido || 0)),
          borderColor: colores.verde,
          pointBackgroundColor: colores.verde,
          tension: .35
        }
      ]
    );
  }

  function pintarPedidosMes(pedidos) {
    const panel = document.getElementById("ventasDetalleMes");
    const body = document.getElementById("ventasPedidosMesBody");

    if (!panel || !body) return;

    panel.classList.remove("oculto");

    setText("ventasTituloPedidosMes", `Pedidos de ${nombreMes(mesSeleccionado)} ${anioSeleccionado}`);

    if (!pedidos.length) {
      body.innerHTML = `<tr><td colspan="6" class="sin-resultados">No hay pedidos para este mes.</td></tr>`;
      return;
    }

    body.innerHTML = pedidos.map(p => `
      <tr>
        <td>${p.codigo_pedido || "PED-" + p.id}</td>
        <td>${p.cliente || "Cliente no registrado"}</td>
        <td>${dinero(p.total)}</td>
        <td><span class="estado-pill">${p.estado || "Sin estado"}</span></td>
        <td>${p.metodo_pago || "Sin método"}</td>
        <td>${formatoFecha(p.fecha_pedido)}</td>
      </tr>
    `).join("");
  }

  async function cargarAnios() {
    try {
      const data = await apiGet("/ventas/anios");
      pintarAnios(data);
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al cargar ventas por año: " + error.message);
    }
  }

  async function cargarMeses(anio) {
    try {
      anioSeleccionado = Number(anio);
      const data = await apiGet(`/ventas/anios/${anioSeleccionado}/meses`);
      pintarMeses(data);
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al cargar meses: " + error.message);
    }
  }

  async function cargarProductosMes(anio, mes) {
    try {
      anioSeleccionado = Number(anio);
      mesSeleccionado = Number(mes);

      const [productos, pedidos] = await Promise.all([
        apiGet(`/ventas/anios/${anioSeleccionado}/meses/${mesSeleccionado}/productos`),
        apiGet(`/ventas/anios/${anioSeleccionado}/meses/${mesSeleccionado}/pedidos`)
      ]);

      pintarProductos(productos);
      pintarPedidosMes(pedidos);
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al cargar productos del mes: " + error.message);
    }
  }

  function activarBotones() {
    document.getElementById("btnVentasAnios")?.addEventListener("click", cargarAnios);

    document.getElementById("btnVentasMeses")?.addEventListener("click", () => {
      if (anioSeleccionado) cargarMeses(anioSeleccionado);
    });

    document.getElementById("btnVentasProductos")?.addEventListener("click", () => {
      if (anioSeleccionado && mesSeleccionado) cargarProductosMes(anioSeleccionado, mesSeleccionado);
    });
  }

  async function iniciarVentas() {
    try {
      await cargarScript("https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js");
      activarBotones();
      await cargarAnios();
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al iniciar ventas: " + error.message);
    }
  }

  iniciarVentas();
})();
