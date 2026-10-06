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

const totalNumerico = "CAST(REPLACE(REPLACE(COALESCE(p.total, 0), '$', ''), ',', '') AS DECIMAL(12,2))";
const estadoNormalizado = "LOWER(TRIM(COALESCE(p.estado, '')))";
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

function manejarError(res, error, mensaje) {
  console.error(mensaje, error);
  res.status(500).json({ mensaje });
}

/*
  GET /api/ventas/anios
  Nivel 1: resumen por año.
*/
router.get("/anios", verificarToken, async (req, res) => {
  try {
    const tieneDetalles = await existeTabla("pedido_detalles");
    const tieneCantidad = tieneDetalles && await existeColumna("pedido_detalles", "cantidad");

    const anios = await query(`
      SELECT
        YEAR(p.fecha_pedido) AS anio,
        COUNT(CASE WHEN ${estadoVenta} THEN 1 END) AS pedidos_validos,
        COALESCE(SUM(CASE WHEN ${estadoVenta} THEN ${totalNumerico} ELSE 0 END), 0) AS ventas_generadas,
        COALESCE(SUM(CASE WHEN ${estadoGanancia} THEN ${totalNumerico} ELSE 0 END), 0) AS ganancias_confirmadas,
        COALESCE(AVG(CASE WHEN ${estadoVenta} THEN ${totalNumerico} END), 0) AS ticket_promedio
      FROM pedidos p
      WHERE p.fecha_pedido IS NOT NULL
      GROUP BY YEAR(p.fecha_pedido)
      ORDER BY anio DESC
    `);

    if (!tieneDetalles || !tieneCantidad) {
      return res.json(anios.map(row => ({
        ...row,
        productos_vendidos: 0
      })));
    }

    const productosPorAnio = await query(`
      SELECT
        YEAR(p.fecha_pedido) AS anio,
        COALESCE(SUM(pd.cantidad), 0) AS productos_vendidos
      FROM pedido_detalles pd
      INNER JOIN pedidos p ON p.id = pd.pedido_id
      WHERE p.fecha_pedido IS NOT NULL
        AND ${estadoVenta}
      GROUP BY YEAR(p.fecha_pedido)
    `);

    const mapaProductos = new Map(productosPorAnio.map(row => [String(row.anio), Number(row.productos_vendidos || 0)]));

    res.json(anios.map(row => ({
      anio: Number(row.anio),
      pedidos_validos: Number(row.pedidos_validos || 0),
      ventas_generadas: Number(row.ventas_generadas || 0),
      ganancias_confirmadas: Number(row.ganancias_confirmadas || 0),
      ticket_promedio: Number(row.ticket_promedio || 0),
      productos_vendidos: mapaProductos.get(String(row.anio)) || 0
    })));
  } catch (error) {
    manejarError(res, error, "Error al obtener ventas por año");
  }
});

/*
  GET /api/ventas/anios/:anio/meses
  Nivel 2: al hacer clic en un año, muestra resumen por mes.
*/
router.get("/anios/:anio/meses", verificarToken, async (req, res) => {
  try {
    const anio = Number(req.params.anio);
    if (!anio) return res.status(400).json({ mensaje: "Año inválido" });

    const tieneDetalles = await existeTabla("pedido_detalles");
    const tieneCantidad = tieneDetalles && await existeColumna("pedido_detalles", "cantidad");

    const meses = await query(`
      SELECT
        MONTH(p.fecha_pedido) AS mes,
        DATE_FORMAT(p.fecha_pedido, '%M') AS nombre_mes,
        COUNT(CASE WHEN ${estadoVenta} THEN 1 END) AS pedidos_validos,
        COALESCE(SUM(CASE WHEN ${estadoVenta} THEN ${totalNumerico} ELSE 0 END), 0) AS ventas_generadas,
        COALESCE(SUM(CASE WHEN ${estadoGanancia} THEN ${totalNumerico} ELSE 0 END), 0) AS ganancias_confirmadas,
        COALESCE(AVG(CASE WHEN ${estadoVenta} THEN ${totalNumerico} END), 0) AS ticket_promedio
      FROM pedidos p
      WHERE YEAR(p.fecha_pedido) = ?
      GROUP BY MONTH(p.fecha_pedido), DATE_FORMAT(p.fecha_pedido, '%M')
      ORDER BY mes ASC
    `, [anio]);

    let mapaProductos = new Map();

    if (tieneDetalles && tieneCantidad) {
      const productosPorMes = await query(`
        SELECT
          MONTH(p.fecha_pedido) AS mes,
          COALESCE(SUM(pd.cantidad), 0) AS productos_vendidos
        FROM pedido_detalles pd
        INNER JOIN pedidos p ON p.id = pd.pedido_id
        WHERE YEAR(p.fecha_pedido) = ?
          AND ${estadoVenta}
        GROUP BY MONTH(p.fecha_pedido)
      `, [anio]);

      mapaProductos = new Map(productosPorMes.map(row => [String(row.mes), Number(row.productos_vendidos || 0)]));
    }

    res.json(meses.map(row => ({
      anio,
      mes: Number(row.mes),
      nombre_mes: row.nombre_mes,
      pedidos_validos: Number(row.pedidos_validos || 0),
      ventas_generadas: Number(row.ventas_generadas || 0),
      ganancias_confirmadas: Number(row.ganancias_confirmadas || 0),
      ticket_promedio: Number(row.ticket_promedio || 0),
      productos_vendidos: mapaProductos.get(String(row.mes)) || 0
    })));
  } catch (error) {
    manejarError(res, error, "Error al obtener ventas por mes");
  }
});

/*
  GET /api/ventas/anios/:anio/meses/:mes/productos
  Nivel 3: al hacer clic en un mes, muestra productos vendidos en ese mes.
*/
router.get("/anios/:anio/meses/:mes/productos", verificarToken, async (req, res) => {
  try {
    const anio = Number(req.params.anio);
    const mes = Number(req.params.mes);

    if (!anio || !mes) return res.status(400).json({ mensaje: "Año o mes inválido" });

    const tieneDetalles = await existeTabla("pedido_detalles");
    const tieneCantidad = tieneDetalles && await existeColumna("pedido_detalles", "cantidad");

    if (!tieneDetalles || !tieneCantidad) {
      return res.json({
        disponible: false,
        mensaje: "No hay detalle de productos vendidos porque falta la tabla pedido_detalles o la columna cantidad.",
        productos: []
      });
    }

    const productos = await query(`
      SELECT
        pd.producto_id,
        COALESCE(pd.nombre_producto, productos.nombre, CONCAT('Producto #', pd.producto_id)) AS nombre_producto,
        COALESCE(SUM(pd.cantidad), 0) AS unidades_vendidas,
        COALESCE(SUM(COALESCE(pd.subtotal, pd.cantidad * pd.precio_unitario)), 0) AS total_vendido,
        COALESCE(AVG(pd.precio_unitario), 0) AS precio_promedio,
        COUNT(DISTINCT pd.pedido_id) AS pedidos
      FROM pedido_detalles pd
      INNER JOIN pedidos p ON p.id = pd.pedido_id
      LEFT JOIN productos ON productos.id = pd.producto_id
      WHERE YEAR(p.fecha_pedido) = ?
        AND MONTH(p.fecha_pedido) = ?
        AND ${estadoVenta}
      GROUP BY pd.producto_id, COALESCE(pd.nombre_producto, productos.nombre, CONCAT('Producto #', pd.producto_id))
      ORDER BY unidades_vendidas DESC, total_vendido DESC
    `, [anio, mes]);

    res.json({
      disponible: true,
      anio,
      mes,
      productos: productos.map(row => ({
        producto_id: row.producto_id,
        nombre_producto: row.nombre_producto,
        unidades_vendidas: Number(row.unidades_vendidas || 0),
        total_vendido: Number(row.total_vendido || 0),
        precio_promedio: Number(row.precio_promedio || 0),
        pedidos: Number(row.pedidos || 0)
      }))
    });
  } catch (error) {
    manejarError(res, error, "Error al obtener productos vendidos del mes");
  }
});

/*
  GET /api/ventas/anios/:anio/meses/:mes/pedidos
  Extra: lista los pedidos del mes seleccionado.
*/
router.get("/anios/:anio/meses/:mes/pedidos", verificarToken, async (req, res) => {
  try {
    const anio = Number(req.params.anio);
    const mes = Number(req.params.mes);

    if (!anio || !mes) return res.status(400).json({ mensaje: "Año o mes inválido" });

    const pedidos = await query(`
      SELECT
        p.id,
        p.codigo_pedido,
        p.usuario_id,
        usuarios.nombre AS cliente,
        p.total,
        p.estado,
        p.metodo_pago,
        p.telefono,
        p.fecha_pedido
      FROM pedidos p
      LEFT JOIN usuarios ON usuarios.id = p.usuario_id
      WHERE YEAR(p.fecha_pedido) = ?
        AND MONTH(p.fecha_pedido) = ?
      ORDER BY p.fecha_pedido DESC, p.id DESC
    `, [anio, mes]);

    res.json(pedidos.map(row => ({
      ...row,
      total: Number(String(row.total || 0).replace("$", "").replace(",", ""))
    })));
  } catch (error) {
    manejarError(res, error, "Error al obtener pedidos del mes");
  }
});

module.exports = router;
