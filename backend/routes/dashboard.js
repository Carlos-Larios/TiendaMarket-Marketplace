const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { verificarToken, soloAdmin } = require("../middleware/auth.middleware");

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

async function existeTabla(nombreTabla) {
  const rows = await queryAsync(`
    SELECT COUNT(*) AS total
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ?
  `, [nombreTabla]);
  return Number(rows[0]?.total || 0) > 0;
}

async function existeColumna(nombreTabla, nombreColumna) {
  const rows = await queryAsync(`
    SELECT COUNT(*) AS total
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
  `, [nombreTabla, nombreColumna]);
  return Number(rows[0]?.total || 0) > 0;
}

async function columnasExistentes(tabla, columnas) {
  const disponibles = [];
  for (const columna of columnas) {
    if (await existeColumna(tabla, columna)) disponibles.push(columna);
  }
  return disponibles;
}

function escapeLike(valor = "") {
  return String(valor).replace(/[\\%_]/g, "\\$&");
}

function extraerNumeroBusqueda(valor = "") {
  const numeros = String(valor || "").match(/\d+/g);
  return numeros ? numeros.join("") : "";
}

function compactarCodigo(valor = "") {
  return String(valor || "").replace(/[^a-zA-Z0-9]/g, "");
}

function normalizarTipoBusqueda(tipo = "todos") {
  const permitido = new Set([
    "todos", "clientes", "vendedores", "empleados",
    "productos", "pedidos", "facturas", "inventario", "importaciones",
    "devoluciones", "disputas", "liquidaciones", "bitacora", "notificaciones"
  ]);
  return permitido.has(tipo) ? tipo : "todos";
}

function aplicaTipo(tipoActivo, tipoResultado) {
  return tipoActivo === "todos" || tipoActivo === tipoResultado;
}

function crearResultado({ tipo, id, titulo, descripcion, meta, vista, accion, registro }) {
  return {
    tipo,
    id: String(id),
    titulo: titulo || String(id),
    descripcion: descripcion || "",
    meta: meta || "",
    destino: {
      modulo: tipo,
      vista,
      accion,
      registro: registro || String(id)
    }
  };
}

function fechaCorta(fecha) {
  if (!fecha) return "Sin fecha";
  try { return new Date(fecha).toISOString().slice(0, 10); }
  catch { return "Sin fecha"; }
}

function expresionBusquedaCodigo(columna) {
  return `REPLACE(REPLACE(REPLACE(REPLACE(${columna}, '-', ''), '_', ''), ' ', ''), '#', '')`;
}

router.get("/health", (req, res) => {
  res.json({ ok: true, ruta: "/api/dashboard", mensaje: "Dashboard API activa" });
});

// Estadísticas generales — solo admin
router.get("/stats", verificarToken, soloAdmin, async (req, res) => {
  try {
    const [stats] = await queryAsync(`
      SELECT
        (SELECT COUNT(*) FROM productos) AS total_productos,
        (SELECT COUNT(*) FROM pedidos) AS total_pedidos,
        (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
        (SELECT IFNULL(SUM(total), 0) FROM pedidos WHERE LOWER(COALESCE(estado, '')) <> 'cancelado') AS ventas_totales,
        (SELECT IFNULL(SUM(total), 0) FROM pedidos WHERE LOWER(COALESCE(estado, '')) IN ('entregado', 'pagado', 'completado', 'finalizado')) AS ventas_confirmadas,
        (SELECT COUNT(*) FROM pedidos WHERE LOWER(COALESCE(estado, '')) = 'pendiente') AS pedidos_pendientes,
        (SELECT COUNT(*) FROM pedidos WHERE LOWER(COALESCE(estado, '')) = 'procesando') AS pedidos_procesando,
        (SELECT COUNT(*) FROM pedidos WHERE LOWER(COALESCE(estado, '')) = 'enviado') AS pedidos_enviados,
        (SELECT COUNT(*) FROM pedidos WHERE LOWER(COALESCE(estado, '')) = 'entregado') AS pedidos_entregados,
        (SELECT COUNT(*) FROM pedidos WHERE LOWER(COALESCE(estado, '')) = 'cancelado') AS pedidos_cancelados
    `);
    res.json(stats || {});
  } catch (error) {
    console.error("Error /api/dashboard/stats:", error);
    res.status(500).json({ mensaje: "Error al obtener estadísticas", detalle: error.message });
  }
});

// Últimos pedidos — solo admin
router.get("/pedidos-recientes", verificarToken, soloAdmin, async (req, res) => {
  try {
    const tieneClienteNombre = await existeColumna("pedidos", "cliente_nombre");
    const clienteSelect = tieneClienteNombre ? "p.cliente_nombre" : "u.nombre";
    const rows = await queryAsync(`
      SELECT
        p.id,
        p.codigo_pedido,
        p.total,
        p.estado,
        p.metodo_pago,
        p.fecha_pedido,
        ${clienteSelect} AS cliente
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      ORDER BY p.id DESC
      LIMIT 6
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error /api/dashboard/pedidos-recientes:", error);
    res.status(500).json({ mensaje: "Error al obtener pedidos recientes", detalle: error.message });
  }
});

/* =====================================================
   BUSCADOR GLOBAL REAL / RECONSTRUIDO
   Ruta: GET /api/dashboard/busqueda-global?q=texto&tipo=todos
   - Sin UNION.
   - Sin ESCAPE mezclados.
   - Consultas separadas por módulo para evitar errores SQL.
   - Compatible con códigos tipo PED-2026-0001, FAC-2026-0001 o solo números.
   ===================================================== */
function likeParam(valor = "") {
  return `%${String(valor || "").trim()}%`;
}

function compactSql(expr) {
  return `REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(${expr}, ''), '-', ''), '_', ''), ' ', ''), '#', '')`;
}

function addLike(where, params, expr, value) {
  where.push(`${expr} LIKE ?`);
  params.push(likeParam(value));
}

function addCompactLike(where, params, expr, value) {
  const limpio = compactarCodigo(value);
  if (!limpio) return;
  where.push(`${compactSql(expr)} LIKE ?`);
  params.push(likeParam(limpio));
}

async function buscarEnUsuarios({ termino, numero, tipo, limite, resultados }) {
  if (!await existeTabla("usuarios")) return;

  const cols = await columnasExistentes("usuarios", ["id", "nombre", "email", "correo", "telefono", "rol", "estado", "fecha_registro", "created_at"]);
  if (!cols.includes("id")) return;

  const nombreExpr = cols.includes("nombre") ? "nombre" : "CAST(id AS CHAR)";
  const emailExpr = cols.includes("email") ? "email" : (cols.includes("correo") ? "correo" : "''");
  const telefonoExpr = cols.includes("telefono") ? "telefono" : "''";
  const rolExpr = cols.includes("rol") ? "rol" : "''";
  const fechaExpr = cols.includes("fecha_registro") ? "fecha_registro" : (cols.includes("created_at") ? "created_at" : "NULL");

  async function buscar(tipoResultado, roles, vista, accion, prefijo, tituloRol) {
    if (!aplicaTipo(tipo, tipoResultado)) return;

    const where = [];
    const params = [];
    addLike(where, params, `COALESCE(${nombreExpr}, '')`, termino);
    addLike(where, params, `COALESCE(${emailExpr}, '')`, termino);
    addLike(where, params, `COALESCE(${telefonoExpr}, '')`, termino);
    if (numero) addLike(where, params, "CAST(id AS CHAR)", numero);

    const rolesLower = roles.map(r => r.toLowerCase());
    const rolesSql = rolesLower.map(() => "?").join(",");

    const rows = await queryAsync(`
      SELECT id, ${nombreExpr} AS nombre, ${emailExpr} AS email, ${rolExpr} AS rol, ${fechaExpr} AS fecha_registro
      FROM usuarios
      WHERE LOWER(COALESCE(${rolExpr}, '')) IN (${rolesSql})
        AND (${where.join(" OR ")})
      ORDER BY id DESC
      LIMIT ?
    `, [...rolesLower, ...params, limite]);

    rows.forEach(row => resultados.push(crearResultado({
      tipo: tipoResultado,
      id: `${prefijo}-${String(row.id).padStart(4, "0")}`,
      titulo: row.nombre || `${prefijo}-${row.id}`,
      descripcion: `${tituloRol} · ${row.email || "Sin correo"}`,
      meta: `Registro: ${fechaCorta(row.fecha_registro)}`,
      vista,
      accion,
      registro: row.id
    })));
  }

  await buscar("clientes", ["cliente"], "clientes_view.html", "abrirCliente", "CLI", "Cliente");
  await buscar("empleados", ["empleado", "admin", "administrador"], "empleados_view.html", "abrirEmpleado", "EMP", "Empleado");
  await buscar("vendedores", ["vendedor"], "usuarios_vendedores_view.html", "abrirUsuarioVendedor", "UV", "Usuario vendedor");
}

async function buscarEnProductos({ termino, numero, tipo, limite, resultados }) {
  if (!await existeTabla("productos")) return;

  const cols = await columnasExistentes("productos", ["id", "nombre", "marca", "modelo", "categoria", "precio", "stock", "estado", "tipo_venta", "sku", "codigo_barras", "proveedor", "tiempo_entrega"]);
  if (!cols.includes("id")) return;

  const campos = ["nombre", "marca", "modelo", "categoria", "sku", "codigo_barras", "proveedor"].filter(c => cols.includes(c));
  const where = [];
  const params = [];

  campos.forEach(c => addLike(where, params, `COALESCE(${c}, '')`, termino));
  campos.forEach(c => addCompactLike(where, params, c, termino));
  if (numero) addLike(where, params, "CAST(id AS CHAR)", numero);
  if (!where.length) return;

  const nombreExpr = cols.includes("nombre") ? "nombre" : "CAST(id AS CHAR)";
  const marcaExpr = cols.includes("marca") ? "marca" : "''";
  const modeloExpr = cols.includes("modelo") ? "modelo" : "''";
  const categoriaExpr = cols.includes("categoria") ? "categoria" : "''";
  const precioExpr = cols.includes("precio") ? "precio" : "0";
  const stockExpr = cols.includes("stock") ? "stock" : "0";
  const tipoVentaExpr = cols.includes("tipo_venta") ? "tipo_venta" : "'stock'";
  const proveedorExpr = cols.includes("proveedor") ? "proveedor" : "''";
  const entregaExpr = cols.includes("tiempo_entrega") ? "tiempo_entrega" : "''";

  if (aplicaTipo(tipo, "productos")) {
    const rows = await queryAsync(`
      SELECT id, ${nombreExpr} AS nombre, ${marcaExpr} AS marca, ${modeloExpr} AS modelo,
             ${categoriaExpr} AS categoria, ${precioExpr} AS precio, ${stockExpr} AS stock,
             ${tipoVentaExpr} AS tipo_venta
      FROM productos
      WHERE ${where.join(" OR ")}
      ORDER BY id DESC
      LIMIT ?
    `, [...params, limite]);

    rows.forEach(row => resultados.push(crearResultado({
      tipo: "productos",
      id: `PRO-${String(row.id).padStart(4, "0")}`,
      titulo: row.nombre || `Producto ${row.id}`,
      descripcion: `${row.marca || "Sin marca"} ${row.modelo || ""} · ${row.categoria || "Sin categoría"}`.trim(),
      meta: `Precio: $${Number(row.precio || 0).toFixed(2)} · Stock: ${row.stock ?? 0} · ${row.tipo_venta || "stock"}`,
      vista: "productos_view.html",
      accion: "abrirProducto",
      registro: row.id
    })));
  }

  if (aplicaTipo(tipo, "importaciones") && cols.includes("tipo_venta")) {
    const rows = await queryAsync(`
      SELECT id, ${nombreExpr} AS nombre, ${precioExpr} AS precio, ${proveedorExpr} AS proveedor, ${entregaExpr} AS tiempo_entrega
      FROM productos
      WHERE LOWER(COALESCE(tipo_venta, '')) IN ('importacion', 'importación', 'bajo_pedido', 'mixto')
        AND (${where.join(" OR ")})
      ORDER BY id DESC
      LIMIT ?
    `, [...params, limite]);

    rows.forEach(row => resultados.push(crearResultado({
      tipo: "importaciones",
      id: `IMP-${String(row.id).padStart(4, "0")}`,
      titulo: row.nombre || `Importación ${row.id}`,
      descripcion: `Producto bajo pedido/importación · ${row.proveedor || "Proveedor no definido"}`,
      meta: `Entrega: ${row.tiempo_entrega || "Sin definir"} · Precio: $${Number(row.precio || 0).toFixed(2)}`,
      vista: "importacion_view.html",
      accion: "abrirImportacion",
      registro: row.id
    })));
  }
}

async function buscarEnPedidos({ termino, numero, tipo, limite, resultados }) {
  if (!await existeTabla("pedidos") || !aplicaTipo(tipo, "pedidos")) return;

  const cols = await columnasExistentes("pedidos", ["id", "codigo_pedido", "cliente_nombre", "cliente_email", "total", "estado", "metodo_pago", "fecha_pedido", "usuario_id"]);
  if (!cols.includes("id")) return;

  const tieneUsuarios = await existeTabla("usuarios");
  const colsU = tieneUsuarios ? await columnasExistentes("usuarios", ["id", "nombre", "email", "correo"]) : [];
  const joinUsuarios = cols.includes("usuario_id") && colsU.includes("id") ? "LEFT JOIN usuarios u ON u.id = p.usuario_id" : "";

  const codigoExpr = cols.includes("codigo_pedido") ? "p.codigo_pedido" : "CAST(p.id AS CHAR)";
  const clienteNombreExpr = cols.includes("cliente_nombre") ? "p.cliente_nombre" : (joinUsuarios && colsU.includes("nombre") ? "u.nombre" : "''");
  const clienteEmailExpr = cols.includes("cliente_email") ? "p.cliente_email" : (joinUsuarios && colsU.includes("email") ? "u.email" : (joinUsuarios && colsU.includes("correo") ? "u.correo" : "''"));
  const totalExpr = cols.includes("total") ? "p.total" : "0";
  const estadoExpr = cols.includes("estado") ? "p.estado" : "'Pendiente'";
  const metodoExpr = cols.includes("metodo_pago") ? "p.metodo_pago" : "''";
  const fechaExpr = cols.includes("fecha_pedido") ? "p.fecha_pedido" : "NULL";

  const where = [];
  const params = [];
  addLike(where, params, `COALESCE(${codigoExpr}, '')`, termino);
  addCompactLike(where, params, codigoExpr, termino);
  addLike(where, params, `COALESCE(${clienteNombreExpr}, '')`, termino);
  addLike(where, params, `COALESCE(${clienteEmailExpr}, '')`, termino);
  if (numero) addLike(where, params, "CAST(p.id AS CHAR)", numero);

  const rows = await queryAsync(`
    SELECT p.id, ${codigoExpr} AS codigo_pedido, ${clienteNombreExpr} AS cliente_nombre,
           ${clienteEmailExpr} AS cliente_email, ${totalExpr} AS total, ${estadoExpr} AS estado,
           ${metodoExpr} AS metodo_pago, ${fechaExpr} AS fecha_pedido
    FROM pedidos p
    ${joinUsuarios}
    WHERE ${where.join(" OR ")}
    ORDER BY p.id DESC
    LIMIT ?
  `, [...params, limite]);

  rows.forEach(row => resultados.push(crearResultado({
    tipo: "pedidos",
    id: row.codigo_pedido || `PED-${String(row.id).padStart(6, "0")}`,
    titulo: `Pedido ${row.codigo_pedido || row.id}`,
    descripcion: `Cliente ${row.cliente_nombre || "Sin cliente"} · ${row.metodo_pago || "Sin método de pago"}`,
    meta: `Estado: ${row.estado || "Pendiente"} · Total: $${Number(row.total || 0).toFixed(2)}`,
    vista: "pedidos_view.html",
    accion: "abrirPedido",
    registro: row.id
  })));
}

async function buscarEnFacturas({ termino, numero, tipo, limite, resultados }) {
  if (!await existeTabla("facturas") || !aplicaTipo(tipo, "facturas")) return;

  const colsF = await columnasExistentes("facturas", ["id", "numero_factura", "pedido_id", "cliente_id", "total", "estado", "fecha_factura"]);
  if (!colsF.includes("id")) return;

  const tienePedidos = await existeTabla("pedidos");
  const tieneUsuarios = await existeTabla("usuarios");
  const colsP = tienePedidos ? await columnasExistentes("pedidos", ["id", "codigo_pedido", "cliente_nombre"]) : [];
  const colsU = tieneUsuarios ? await columnasExistentes("usuarios", ["id", "nombre"]) : [];

  const joinPedidos = colsF.includes("pedido_id") && colsP.includes("id") ? "LEFT JOIN pedidos p ON p.id = f.pedido_id" : "";
  const joinUsuarios = colsF.includes("cliente_id") && colsU.includes("id") ? "LEFT JOIN usuarios u ON u.id = f.cliente_id" : "";

  const numeroExpr = colsF.includes("numero_factura") ? "f.numero_factura" : "CAST(f.id AS CHAR)";
  const pedidoIdExpr = colsF.includes("pedido_id") ? "f.pedido_id" : "NULL";
  const totalExpr = colsF.includes("total") ? "f.total" : "0";
  const estadoExpr = colsF.includes("estado") ? "f.estado" : "'Pendiente'";
  const fechaExpr = colsF.includes("fecha_factura") ? "f.fecha_factura" : "NULL";
  const codigoPedidoExpr = joinPedidos && colsP.includes("codigo_pedido") ? "p.codigo_pedido" : "''";
  const clientePedidoExpr = joinPedidos && colsP.includes("cliente_nombre") ? "p.cliente_nombre" : "''";
  const clienteUsuarioExpr = joinUsuarios && colsU.includes("nombre") ? "u.nombre" : "''";

  const where = [];
  const params = [];
  addLike(where, params, `COALESCE(${numeroExpr}, '')`, termino);
  addCompactLike(where, params, numeroExpr, termino);
  addLike(where, params, `COALESCE(${codigoPedidoExpr}, '')`, termino);
  addCompactLike(where, params, codigoPedidoExpr, termino);
  addLike(where, params, `COALESCE(${clientePedidoExpr}, '')`, termino);
  addLike(where, params, `COALESCE(${clienteUsuarioExpr}, '')`, termino);
  if (numero) addLike(where, params, "CAST(f.id AS CHAR)", numero);

  const rows = await queryAsync(`
    SELECT f.id, ${numeroExpr} AS numero_factura, ${pedidoIdExpr} AS pedido_id, ${totalExpr} AS total,
           ${estadoExpr} AS estado, ${fechaExpr} AS fecha_factura,
           ${codigoPedidoExpr} AS codigo_pedido, ${clientePedidoExpr} AS cliente_nombre, ${clienteUsuarioExpr} AS cliente_usuario
    FROM facturas f
    ${joinPedidos}
    ${joinUsuarios}
    WHERE ${where.join(" OR ")}
    ORDER BY f.id DESC
    LIMIT ?
  `, [...params, limite]);

  rows.forEach(row => resultados.push(crearResultado({
    tipo: "facturas",
    id: row.numero_factura || `FAC-${String(row.id).padStart(6, "0")}`,
    titulo: `Factura ${row.numero_factura || row.id}`,
    descripcion: `Pedido ${row.codigo_pedido || row.pedido_id || "N/A"} · Cliente ${row.cliente_nombre || row.cliente_usuario || "Sin cliente"}`,
    meta: `Estado: ${row.estado || "Pendiente"} · Total: $${Number(row.total || 0).toFixed(2)}`,
    vista: "facturacion_view.html",
    accion: "abrirFactura",
    registro: row.id
  })));
}

async function buscarEnInventario({ termino, numero, tipo, limite, resultados }) {
  if (!await existeTabla("inventario_fisico") || !aplicaTipo(tipo, "inventario")) return;

  const cols = await columnasExistentes("inventario_fisico", ["id", "codigo_producto", "codigo_barra", "estado", "proveedor", "numero_orden", "producto_id"]);
  if (!cols.includes("id")) return;

  const tieneProductos = await existeTabla("productos");
  const colsP = tieneProductos ? await columnasExistentes("productos", ["id", "nombre"]) : [];
  const joinProductos = cols.includes("producto_id") && colsP.includes("id") ? "LEFT JOIN productos pr ON pr.id = inv.producto_id" : "";

  const codigoExpr = cols.includes("codigo_producto") ? "inv.codigo_producto" : "CAST(inv.id AS CHAR)";
  const barraExpr = cols.includes("codigo_barra") ? "inv.codigo_barra" : "''";
  const estadoExpr = cols.includes("estado") ? "inv.estado" : "''";
  const proveedorExpr = cols.includes("proveedor") ? "inv.proveedor" : "''";
  const ordenExpr = cols.includes("numero_orden") ? "inv.numero_orden" : "''";
  const productoExpr = joinProductos && colsP.includes("nombre") ? "pr.nombre" : "''";

  const where = [];
  const params = [];
  [codigoExpr, barraExpr, proveedorExpr, ordenExpr, productoExpr].forEach(expr => addLike(where, params, `COALESCE(${expr}, '')`, termino));
  [codigoExpr, barraExpr, ordenExpr].forEach(expr => addCompactLike(where, params, expr, termino));
  if (numero) addLike(where, params, "CAST(inv.id AS CHAR)", numero);

  const rows = await queryAsync(`
    SELECT inv.id, ${codigoExpr} AS codigo_producto, ${barraExpr} AS codigo_barra,
           ${estadoExpr} AS estado, ${proveedorExpr} AS proveedor, ${ordenExpr} AS numero_orden,
           ${productoExpr} AS producto
    FROM inventario_fisico inv
    ${joinProductos}
    WHERE ${where.join(" OR ")}
    ORDER BY inv.id DESC
    LIMIT ?
  `, [...params, limite]);

  rows.forEach(row => resultados.push(crearResultado({
    tipo: "inventario",
    id: row.codigo_producto || `INV-${String(row.id).padStart(4, "0")}`,
    titulo: row.codigo_producto || `Unidad ${row.id}`,
    descripcion: `${row.producto || "Producto no vinculado"} · ${row.estado || "Sin estado"}`,
    meta: `Código barras: ${row.codigo_barra || "N/A"} · Proveedor: ${row.proveedor || "N/A"}`,
    vista: "inventario_fisico_view.html",
    accion: "abrirUnidad",
    registro: row.id
  })));
}

async function buscarEnDevoluciones({ termino, numero, tipo, limite, resultados }) {
  if (!await existeTabla("devoluciones") || !aplicaTipo(tipo, "devoluciones")) return;

  const cols = await columnasExistentes("devoluciones", ["id", "numero_caso_cliente", "pedido_id", "producto_id", "codigo_producto", "motivo", "estado", "resolucion", "fecha_creacion"]);
  if (!cols.includes("id")) return;

  const tienePedidos = await existeTabla("pedidos");
  const tieneProductos = await existeTabla("productos");
  const colsP = tienePedidos ? await columnasExistentes("pedidos", ["id", "codigo_pedido", "cliente_nombre"]) : [];
  const colsPr = tieneProductos ? await columnasExistentes("productos", ["id", "nombre"]) : [];

  const joinPedidos = cols.includes("pedido_id") && colsP.includes("id") ? "LEFT JOIN pedidos p ON p.id = d.pedido_id" : "";
  const joinProductos = cols.includes("producto_id") && colsPr.includes("id") ? "LEFT JOIN productos pr ON pr.id = d.producto_id" : "";

  const casoExpr = cols.includes("numero_caso_cliente") ? "d.numero_caso_cliente" : "CAST(d.id AS CHAR)";
  const pedidoIdExpr = cols.includes("pedido_id") ? "d.pedido_id" : "NULL";
  const codigoProductoExpr = cols.includes("codigo_producto") ? "d.codigo_producto" : "''";
  const motivoExpr = cols.includes("motivo") ? "d.motivo" : "''";
  const estadoExpr = cols.includes("estado") ? "d.estado" : "'Pendiente'";
  const resolucionExpr = cols.includes("resolucion") ? "d.resolucion" : "''";
  const codigoPedidoExpr = joinPedidos && colsP.includes("codigo_pedido") ? "p.codigo_pedido" : "''";
  const clienteExpr = joinPedidos && colsP.includes("cliente_nombre") ? "p.cliente_nombre" : "''";
  const productoExpr = joinProductos && colsPr.includes("nombre") ? "pr.nombre" : "''";

  const where = [];
  const params = [];
  [casoExpr, codigoProductoExpr, motivoExpr, codigoPedidoExpr, clienteExpr, productoExpr].forEach(expr => addLike(where, params, `COALESCE(${expr}, '')`, termino));
  [casoExpr, codigoProductoExpr, codigoPedidoExpr].forEach(expr => addCompactLike(where, params, expr, termino));
  if (numero) addLike(where, params, "CAST(d.id AS CHAR)", numero);

  const rows = await queryAsync(`
    SELECT d.id, ${casoExpr} AS numero_caso_cliente, ${pedidoIdExpr} AS pedido_id,
           ${codigoProductoExpr} AS codigo_producto, ${motivoExpr} AS motivo,
           ${estadoExpr} AS estado, ${resolucionExpr} AS resolucion,
           ${codigoPedidoExpr} AS codigo_pedido, ${clienteExpr} AS cliente_nombre, ${productoExpr} AS producto
    FROM devoluciones d
    ${joinPedidos}
    ${joinProductos}
    WHERE ${where.join(" OR ")}
    ORDER BY d.id DESC
    LIMIT ?
  `, [...params, limite]);

  rows.forEach(row => resultados.push(crearResultado({
    tipo: "devoluciones",
    id: row.numero_caso_cliente || `DEV-${String(row.id).padStart(6, "0")}`,
    titulo: `Devolución ${row.numero_caso_cliente || row.id}`,
    descripcion: `${row.producto || "Producto no definido"} · Pedido ${row.codigo_pedido || row.pedido_id || "N/A"} · Cliente ${row.cliente_nombre || "Sin cliente"}`,
    meta: `Estado: ${row.estado || "Pendiente"} · Resolución: ${row.resolucion || "Sin resolver"}`,
    vista: "devoluciones_view.html",
    accion: "abrirDevolucion",
    registro: row.id
  })));
}

router.get("/busqueda-global", verificarToken, soloAdmin, async (req, res) => {
  try {
    const termino = String(req.query.q || "").trim();
    const tipo = normalizarTipoBusqueda(String(req.query.tipo || "todos").trim());
    const limite = Math.min(Math.max(Number(req.query.limit || 8), 1), 20);

    if (!termino) return res.json({ resultados: [] });

    const numero = extraerNumeroBusqueda(termino);
    const contexto = { termino, numero, tipo, limite, resultados: [] };

    await buscarEnUsuarios(contexto);
    await buscarEnProductos(contexto);
    await buscarEnPedidos(contexto);
    await buscarEnFacturas(contexto);
    await buscarEnInventario(contexto);
    await buscarEnDevoluciones(contexto);

    res.json({ resultados: contexto.resultados.slice(0, 80) });
  } catch (error) {
    console.error("Error en búsqueda global:", error);
    res.status(500).json({
      mensaje: "Error al buscar en la plataforma",
      detalle: error.message
    });
  }
});


module.exports = router;
