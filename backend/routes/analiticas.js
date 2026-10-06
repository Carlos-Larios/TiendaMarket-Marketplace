const express = require("express");
const router = express.Router();
const db = require("../db");
const { verificarToken } = require("../middleware/auth.middleware");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

// Total puede venir numérico o como texto "$46.99". Esto lo convierte seguro a número.
const totalNumerico = "CAST(REPLACE(REPLACE(COALESCE(total, 0), '$', ''), ',', '') AS DECIMAL(12,2))";
const estadoNormalizado = "LOWER(TRIM(COALESCE(estado, '')))";
const estadoVenta = `${estadoNormalizado} <> 'cancelado'`;
const estadoGanancia = `${estadoNormalizado} IN ('entregado', 'pagado', 'completado', 'finalizado')`;

async function existeTabla(nombreTabla) {
  const rows = await query(`
    SELECT COUNT(*) AS total
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ?
  `, [nombreTabla]);
  return Number(rows[0]?.total || 0) > 0;
}

async function existeColumna(nombreTabla, nombreColumna) {
  const rows = await query(`
    SELECT COUNT(*) AS total
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
  `, [nombreTabla, nombreColumna]);
  return Number(rows[0]?.total || 0) > 0;
}

function esFechaValida(fecha) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(fecha || ""));
}

function obtenerPeriodo(req) {
  const periodo = String(req.query.periodo || "dia").toLowerCase();
  const fechaQuery = String(req.query.fecha || "");
  const fecha = esFechaValida(fechaQuery) ? fechaQuery : fechaLocalHoy();

  // También aceptamos "rango" para los filtros Desde / Hasta del dashboard.
  const periodoFinal = ["dia", "mes", "anio", "rango"].includes(periodo) ? periodo : "dia";
  return { periodo: periodoFinal, fecha };
}

function fechaLocalHoy() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sumarDias(fecha, dias) {
  const [y, m, d] = fecha.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dias);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function inicioMes(fecha) {
  return `${fecha.slice(0, 7)}-01`;
}

function inicioMesSiguiente(fecha) {
  const [y, m] = fecha.split("-").map(Number);
  const date = new Date(y, m, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function inicioAnio(fecha) {
  return `${fecha.slice(0, 4)}-01-01`;
}

function inicioAnioSiguiente(fecha) {
  return `${Number(fecha.slice(0, 4)) + 1}-01-01`;
}

function rangoPeriodo(periodo, fecha, desdeQuery = "", hastaQuery = "") {
  if (periodo === "rango") {
    const desde = esFechaValida(desdeQuery) ? desdeQuery : fecha;
    const hastaBase = esFechaValida(hastaQuery) ? hastaQuery : desde;
    // El input "Hasta" se entiende inclusivo. En SQL usamos < día siguiente.
    return { desde, hasta: sumarDias(hastaBase, 1), hasta_visible: hastaBase };
  }

  if (periodo === "mes") return { desde: inicioMes(fecha), hasta: inicioMesSiguiente(fecha) };
  if (periodo === "anio") return { desde: inicioAnio(fecha), hasta: inicioAnioSiguiente(fecha) };
  return { desde: fecha, hasta: sumarDias(fecha, 1) };
}

async function columnaFechaPedidos() {
  const candidatas = ["fecha_pedido", "fecha", "created_at", "fecha_creacion"];
  for (const columna of candidatas) {
    if (await existeColumna("pedidos", columna)) return columna;
  }
  return "fecha_pedido";
}

function filtroRangoSql(alias = "pedidos", columna = "fecha_pedido") {
  return `${alias}.${columna} >= ? AND ${alias}.${columna} < ?`;
}

function obtenerRangoDesdeReq(req, periodo, fecha) {
  return rangoPeriodo(periodo, fecha, req.query.desde, req.query.hasta);
}

function paramsRango(periodo, fecha, req = null) {
  const r = req ? obtenerRangoDesdeReq(req, periodo, fecha) : rangoPeriodo(periodo, fecha);
  return [r.desde, r.hasta];
}

async function filtroPeriodo(req, alias = "pedidos") {
  const { periodo, fecha } = obtenerPeriodo(req);
  const columna = await columnaFechaPedidos();
  const rango = obtenerRangoDesdeReq(req, periodo, fecha);

  return {
    periodo,
    fecha,
    columna,
    where: filtroRangoSql(alias, columna),
    params: [rango.desde, rango.hasta],
    desde: rango.desde,
    hasta: rango.hasta,
    hasta_visible: rango.hasta_visible || null
  };
}

router.get("/", verificarToken, (req, res) => {
  res.json({
    mensaje: "Ruta de analíticas funcionando",
    uso: "Puedes usar ?periodo=dia|mes|anio&fecha=YYYY-MM-DD o ?periodo=rango&desde=YYYY-MM-DD&hasta=YYYY-MM-DD",
    endpoints: [
      "/api/analiticas/resumen",
      "/api/analiticas/ventas-dia",
      "/api/analiticas/ventas-mes",
      "/api/analiticas/ventas-anio",
      "/api/analiticas/productos-vendidos",
      "/api/analiticas/estado-pedidos",
      "/api/analiticas/metodos-pago",
      "/api/analiticas/pedidos-recientes"
    ]
  });
});

router.get("/resumen", verificarToken, async (req, res) => {
  try {
    const filtro = await filtroPeriodo(req, "pedidos");
    const tieneDetalles = await existeTabla("pedido_detalles");
    const tieneCantidad = tieneDetalles && await existeColumna("pedido_detalles", "cantidad");

    const [resumen] = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN ${estadoVenta} THEN ${totalNumerico} ELSE 0 END), 0) AS ventas_generadas,
        COALESCE(SUM(CASE WHEN ${estadoGanancia} THEN ${totalNumerico} ELSE 0 END), 0) AS ganancias_confirmadas,
        COUNT(CASE WHEN ${estadoVenta} THEN 1 END) AS pedidos_validos,
        COALESCE(AVG(CASE WHEN ${estadoVenta} THEN ${totalNumerico} END), 0) AS ticket_promedio,
        COALESCE(SUM(CASE WHEN ${estadoVenta} THEN ${totalNumerico} ELSE 0 END), 0) AS ventas_periodo,
        COUNT(CASE WHEN ${estadoVenta} THEN 1 END) AS pedidos_periodo
      FROM pedidos
      WHERE ${filtro.where}
    `, filtro.params);

    let productos_vendidos = 0;
    if (tieneDetalles && tieneCantidad) {
      const [productos] = await query(`
        SELECT COALESCE(SUM(pd.cantidad), 0) AS productos_vendidos
        FROM pedido_detalles pd
        INNER JOIN pedidos p ON p.id = pd.pedido_id
        WHERE ${filtroRangoSql("p", filtro.columna)}
          AND LOWER(TRIM(COALESCE(p.estado, ''))) <> 'cancelado'
      `, filtro.params);
      productos_vendidos = productos?.productos_vendidos || 0;
    }

    const ventasPeriodo = Number(resumen.ventas_periodo || 0);
    res.json({
      periodo: filtro.periodo,
      fecha: filtro.fecha,
      ventas_generadas: Number(resumen.ventas_generadas || 0),
      ganancias_confirmadas: Number(resumen.ganancias_confirmadas || 0),
      pedidos_validos: Number(resumen.pedidos_validos || 0),
      ticket_promedio: Number(resumen.ticket_promedio || 0),
      ventas_hoy: filtro.periodo === "dia" ? ventasPeriodo : 0,
      pedidos_hoy: filtro.periodo === "dia" ? Number(resumen.pedidos_periodo || 0) : 0,
      ventas_mes: filtro.periodo === "mes" ? ventasPeriodo : 0,
      ventas_anio: filtro.periodo === "anio" ? ventasPeriodo : 0,
      ventas_periodo: ventasPeriodo,
      pedidos_periodo: Number(resumen.pedidos_periodo || 0),
      productos_vendidos: Number(productos_vendidos || 0)
    });
  } catch (error) {
    console.error("Error resumen analíticas:", error);
    res.status(500).json({ mensaje: "Error al obtener resumen de analíticas", detalle: error.message });
  }
});

router.get("/ventas-dia", verificarToken, async (req, res) => {
  try {
    const { periodo, fecha } = obtenerPeriodo(req);
    const columna = await columnaFechaPedidos();
    const [desde, hasta] = paramsRango(periodo === "rango" ? "rango" : "dia", fecha, req);
    const data = await query(`
      SELECT
        DATE(${columna}) AS fecha,
        DATE_FORMAT(${columna}, '%d/%m') AS fecha_label,
        COALESCE(SUM(CASE WHEN ${estadoVenta} THEN ${totalNumerico} ELSE 0 END), 0) AS ventas,
        COALESCE(SUM(CASE WHEN ${estadoGanancia} THEN ${totalNumerico} ELSE 0 END), 0) AS ganancias,
        COUNT(CASE WHEN ${estadoVenta} THEN 1 END) AS pedidos
      FROM pedidos
      WHERE ${columna} >= ? AND ${columna} < ?
      GROUP BY DATE(${columna}), DATE_FORMAT(${columna}, '%d/%m')
      ORDER BY fecha ASC
    `, [desde, hasta]);
    res.json(data);
  } catch (error) {
    console.error("Error ventas día:", error);
    res.status(500).json({ mensaje: "Error al obtener ventas por día", detalle: error.message });
  }
});

router.get("/ventas-mes", verificarToken, async (req, res) => {
  try {
    const { periodo, fecha } = obtenerPeriodo(req);
    const columna = await columnaFechaPedidos();
    const [desde, hasta] = paramsRango(periodo === "rango" ? "rango" : "mes", fecha, req);
    const data = await query(`
      SELECT
        DATE(${columna}) AS fecha,
        DATE_FORMAT(${columna}, '%d/%m') AS fecha_label,
        COALESCE(SUM(CASE WHEN ${estadoVenta} THEN ${totalNumerico} ELSE 0 END), 0) AS ventas,
        COALESCE(SUM(CASE WHEN ${estadoGanancia} THEN ${totalNumerico} ELSE 0 END), 0) AS ganancias,
        COUNT(CASE WHEN ${estadoVenta} THEN 1 END) AS pedidos
      FROM pedidos
      WHERE ${columna} >= ? AND ${columna} < ?
      GROUP BY DATE(${columna}), DATE_FORMAT(${columna}, '%d/%m')
      ORDER BY fecha ASC
    `, [desde, hasta]);
    res.json(data);
  } catch (error) {
    console.error("Error ventas mes:", error);
    res.status(500).json({ mensaje: "Error al obtener ventas por mes", detalle: error.message });
  }
});

router.get("/ventas-anio", verificarToken, async (req, res) => {
  try {
    const { periodo, fecha } = obtenerPeriodo(req);
    const columna = await columnaFechaPedidos();
    const [desde, hasta] = paramsRango(periodo === "rango" ? "rango" : "anio", fecha, req);
    const data = await query(`
      SELECT
        DATE_FORMAT(${columna}, '%Y-%m') AS mes,
        DATE_FORMAT(${columna}, '%m/%Y') AS mes_label,
        COALESCE(SUM(CASE WHEN ${estadoVenta} THEN ${totalNumerico} ELSE 0 END), 0) AS ventas,
        COALESCE(SUM(CASE WHEN ${estadoGanancia} THEN ${totalNumerico} ELSE 0 END), 0) AS ganancias,
        COUNT(CASE WHEN ${estadoVenta} THEN 1 END) AS pedidos
      FROM pedidos
      WHERE ${columna} >= ? AND ${columna} < ?
      GROUP BY DATE_FORMAT(${columna}, '%Y-%m'), DATE_FORMAT(${columna}, '%m/%Y')
      ORDER BY mes ASC
    `, [desde, hasta]);
    res.json(data);
  } catch (error) {
    console.error("Error ventas año:", error);
    res.status(500).json({ mensaje: "Error al obtener ventas por año", detalle: error.message });
  }
});

router.get("/productos-vendidos", verificarToken, async (req, res) => {
  try {
    const filtro = await filtroPeriodo(req, "p");
    const tieneDetalles = await existeTabla("pedido_detalles");
    if (!tieneDetalles) {
      return res.json({ disponible: false, mensaje: "No existe la tabla pedido_detalles todavía.", productos: [] });
    }

    const productos = await query(`
      SELECT
        COALESCE(pd.nombre_producto, pr.nombre, 'Sin nombre') AS nombre,
        COALESCE(SUM(pd.cantidad), 0) AS unidades_vendidas
      FROM pedido_detalles pd
      INNER JOIN pedidos p ON p.id = pd.pedido_id
      LEFT JOIN productos pr ON pr.id = pd.producto_id
      WHERE ${filtro.where}
        AND LOWER(TRIM(COALESCE(p.estado, ''))) <> 'cancelado'
      GROUP BY COALESCE(pd.nombre_producto, pr.nombre, 'Sin nombre')
      ORDER BY unidades_vendidas DESC
      LIMIT 10
    `, filtro.params);

    res.json({
      disponible: productos.length > 0,
      mensaje: productos.length ? "" : "No hay productos vendidos en este período.",
      productos
    });
  } catch (error) {
    console.error("Error productos vendidos:", error);
    res.json({ disponible: false, mensaje: "No se pudieron leer productos vendidos: " + error.message, productos: [] });
  }
});

router.get("/estado-pedidos", verificarToken, async (req, res) => {
  try {
    const filtro = await filtroPeriodo(req, "pedidos");
    const data = await query(`
      SELECT COALESCE(NULLIF(TRIM(estado), ''), 'Sin estado') AS estado, COUNT(*) AS total
      FROM pedidos
      WHERE ${filtro.where}
      GROUP BY COALESCE(NULLIF(TRIM(estado), ''), 'Sin estado')
      ORDER BY total DESC
    `, filtro.params);
    res.json(data);
  } catch (error) {
    console.error("Error estados pedidos:", error);
    res.status(500).json({ mensaje: "Error al obtener estados de pedidos", detalle: error.message });
  }
});

router.get("/metodos-pago", verificarToken, async (req, res) => {
  try {
    const existeMetodoPago = await existeColumna("pedidos", "metodo_pago");
    if (!existeMetodoPago) {
      return res.json({ disponible: false, mensaje: "La tabla pedidos no tiene columna metodo_pago.", metodos: [] });
    }

    const filtro = await filtroPeriodo(req, "pedidos");
    const metodos = await query(`
      SELECT COALESCE(NULLIF(TRIM(metodo_pago), ''), 'Sin método') AS metodo_pago, COUNT(*) AS total
      FROM pedidos
      WHERE ${filtro.where}
      GROUP BY COALESCE(NULLIF(TRIM(metodo_pago), ''), 'Sin método')
      ORDER BY total DESC
    `, filtro.params);

    res.json({ disponible: metodos.length > 0, mensaje: metodos.length ? "" : "No hay métodos de pago en este período.", metodos });
  } catch (error) {
    console.error("Error métodos pago:", error);
    res.json({ disponible: false, mensaje: "No se pudo leer metodo_pago: " + error.message, metodos: [] });
  }
});

router.get("/pedidos-recientes", verificarToken, async (req, res) => {
  try {
    const existeClienteNombre = await existeColumna("pedidos", "cliente_nombre");
    const clienteSelect = existeClienteNombre ? "cliente_nombre AS cliente" : "'Cliente no registrado' AS cliente";
    const filtro = await filtroPeriodo(req, "pedidos");

    const data = await query(`
      SELECT
        id,
        codigo_pedido,
        ${clienteSelect},
        estado,
        ${totalNumerico} AS total,
        ${filtro.columna} AS fecha_pedido
      FROM pedidos
      WHERE ${filtro.where}
      ORDER BY ${filtro.columna} DESC, id DESC
      LIMIT 8
    `, filtro.params);

    res.json(data);
  } catch (error) {
    console.error("Error pedidos recientes:", error);
    res.status(500).json({ mensaje: "Error al obtener pedidos recientes", detalle: error.message });
  }
});

module.exports = router;
