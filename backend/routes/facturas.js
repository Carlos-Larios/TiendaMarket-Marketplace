const express = require("express");
const router = express.Router();
const db = require("../db");
const { verificarToken, soloPanel } = require("../middleware/auth.middleware");
const PDFDocument = require("pdfkit");

function query(sql, values = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

function textoSeguro(valor) {
  return String(valor ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatoMoneda(valor) {
  return `$${Number(valor || 0).toFixed(2)}`;
}

function formatoFecha(valor) {
  if (!valor) return "Sin fecha";
  return new Date(valor).toLocaleString("es-SV", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function crearPdfFactura(factura, detalles) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 30,
      autoFirstPage: true,
      bufferPages: false,
      info: {
        Title: factura.numero_factura || "Factura",
        Author: "Sistema Ecommerce"
      }
    });

    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const margin = 36;
    const contentW = W - margin * 2;
    const rightX = W - margin;

    const colorPrincipal = "#0f172a";
    const colorSecundario = "#334155";
    const colorBorde = "#cbd5e1";
    const colorFondo = "#f1f5f9";
    const colorTexto = "#111827";
    const colorSuave = "#64748b";

    const normal = () => doc.font("Helvetica");
    const bold = () => doc.font("Helvetica-Bold");
    const safe = valor => textoSeguro(valor) || "—";
    const money = valor => formatoMoneda(valor);

    function labelValue(label, value, x, y, labelW, valueW, size = 8) {
      bold().fontSize(size).fillColor(colorSecundario).text(`${label}:`, x, y, { width: labelW, lineBreak: false });
      normal().fontSize(size).fillColor(colorTexto).text(safe(value), x + labelW, y, {
        width: valueW,
        height: 12,
        ellipsis: true,
        lineBreak: false
      });
    }

    function box(title, x, y, w, h) {
      doc.roundedRect(x, y, w, h, 5).strokeColor(colorBorde).lineWidth(1).stroke();
      doc.roundedRect(x, y, w, 22, 5).fill(colorFondo);
      bold().fontSize(9).fillColor(colorPrincipal).text(title, x + 10, y + 7, { width: w - 20, lineBreak: false });
    }

    // Fondo y borde general
    doc.rect(0, 0, W, H).fill("#ffffff");
    doc.roundedRect(margin, 24, contentW, H - 48, 8).strokeColor("#e2e8f0").lineWidth(1).stroke();

    // Encabezado
    doc.roundedRect(margin, 24, contentW, 76, 8).fill(colorPrincipal);
    bold().fontSize(20).fillColor("#ffffff").text("IXPANTIA STORE", margin + 18, 42, { width: 260, lineBreak: false });
    normal().fontSize(8.5).fillColor("#cbd5e1").text("Factura de venta generada desde el sistema ecommerce", margin + 18, 68, { width: 300, lineBreak: false });

    const numero = factura.numero_factura || "Sin número";
    const estado = (factura.estado || "pendiente").toUpperCase();
    bold().fontSize(17).fillColor("#ffffff").text("FACTURA", margin, 40, { width: contentW - 18, align: "right", lineBreak: false });
    normal().fontSize(8.5).fillColor("#e2e8f0").text(`No. ${numero}`, margin, 62, { width: contentW - 18, align: "right", lineBreak: false });
    doc.roundedRect(rightX - 110, 78, 92, 16, 4).fill("#ffffff");
    bold().fontSize(7.5).fillColor(colorPrincipal).text(estado, rightX - 106, 83, { width: 84, align: "center", lineBreak: false });

    // Datos comercio / fecha
    normal().fontSize(7.5).fillColor(colorSuave).text("Datos del comercio", margin + 18, 112, { lineBreak: false });
    bold().fontSize(8.5).fillColor(colorPrincipal).text("IXPANTIA STORE", margin + 18, 125, { lineBreak: false });
    normal().fontSize(7.5).fillColor(colorSuave).text("NIT: —   NRC: —   Teléfono: —   Correo: —", margin + 18, 139, { width: 310, lineBreak: false });
    normal().fontSize(8).fillColor(colorSuave).text(`Fecha: ${formatoFecha(factura.fecha_factura)}`, margin, 125, { width: contentW - 18, align: "right", lineBreak: false });

    const cliente = factura.cliente || factura.cliente_nombre || "Cliente no registrado";
    const pedido = factura.codigo_pedido || `#${factura.pedido_id}`;

    const gap = 14;
    const boxW = (contentW - 36 - gap) / 2;
    const boxY = 166;
    const boxH = 100;
    const leftX = margin + 18;
    const rightBoxX = leftX + boxW + gap;

    box("Datos del cliente", leftX, boxY, boxW, boxH);
    labelValue("Cliente", cliente, leftX + 10, boxY + 34, 58, boxW - 78);
    labelValue("Teléfono", factura.telefono || "Sin teléfono", leftX + 10, boxY + 50, 58, boxW - 78);
    labelValue("Email", factura.cliente_email || "No registrado", leftX + 10, boxY + 66, 58, boxW - 78);
    labelValue("Dirección", factura.direccion_envio || "Sin dirección", leftX + 10, boxY + 82, 58, boxW - 78);

    box("Datos del pedido", rightBoxX, boxY, boxW, boxH);
    labelValue("Pedido", pedido, rightBoxX + 10, boxY + 34, 66, boxW - 86);
    labelValue("Método", factura.metodo_pago || "No especificado", rightBoxX + 10, boxY + 50, 66, boxW - 86);
    labelValue("ID pedido", factura.pedido_id, rightBoxX + 10, boxY + 66, 66, boxW - 86);
    labelValue("ID factura", factura.id, rightBoxX + 10, boxY + 82, 66, boxW - 86);

    // Tabla en una sola página
    const tableX = leftX;
    const tableY = 292;
    const tableW = contentW - 36;
    const headerH = 24;
    const rowH = 26;
    const maxRows = 8;
    const items = detalles.length ? detalles : [{ nombre_producto: "Sin productos detallados", cantidad: 0, precio_unitario: 0, subtotal: 0 }];
    const visibles = items.slice(0, maxRows);
    const extra = Math.max(items.length - visibles.length, 0);

    bold().fontSize(11).fillColor(colorPrincipal).text("Detalle de productos", tableX, 276, { lineBreak: false });
    doc.roundedRect(tableX, tableY, tableW, headerH, 4).fill(colorPrincipal);

    const c1 = tableX;
    const c2 = tableX + 270;
    const c3 = tableX + 338;
    const c4 = tableX + 432;
    const w1 = 260;
    const w2 = 58;
    const w3 = 84;
    const w4 = tableW - 432;

    bold().fontSize(8).fillColor("#ffffff");
    doc.text("Producto", c1 + 10, tableY + 8, { width: w1, lineBreak: false });
    doc.text("Cant.", c2, tableY + 8, { width: w2, align: "center", lineBreak: false });
    doc.text("Precio unit.", c3, tableY + 8, { width: w3, align: "right", lineBreak: false });
    doc.text("Subtotal", c4, tableY + 8, { width: w4 - 10, align: "right", lineBreak: false });

    let y = tableY + headerH;
    visibles.forEach((item, index) => {
      if (index % 2 === 0) doc.rect(tableX, y, tableW, rowH).fill("#f8fafc");
      doc.rect(tableX, y, tableW, rowH).strokeColor(colorBorde).lineWidth(0.5).stroke();
      doc.moveTo(c2 - 8, y).lineTo(c2 - 8, y + rowH).strokeColor(colorBorde).stroke();
      doc.moveTo(c3 - 8, y).lineTo(c3 - 8, y + rowH).strokeColor(colorBorde).stroke();
      doc.moveTo(c4 - 8, y).lineTo(c4 - 8, y + rowH).strokeColor(colorBorde).stroke();

      normal().fontSize(8).fillColor(colorTexto).text(safe(item.nombre_producto || "Producto"), c1 + 10, y + 8, {
        width: w1,
        height: 10,
        ellipsis: true,
        lineBreak: false
      });
      doc.text(String(Number(item.cantidad || 0)), c2, y + 8, { width: w2, align: "center", lineBreak: false });
      doc.text(money(item.precio_unitario), c3, y + 8, { width: w3, align: "right", lineBreak: false });
      bold().fontSize(8).fillColor(colorTexto).text(money(item.subtotal), c4, y + 8, { width: w4 - 10, align: "right", lineBreak: false });
      y += rowH;
    });

    if (extra) {
      doc.rect(tableX, y, tableW, rowH).strokeColor(colorBorde).lineWidth(0.5).stroke();
      normal().fontSize(8).fillColor(colorSuave).text(`... y ${extra} productos más incluidos en el total`, c1 + 10, y + 8, { width: tableW - 20, lineBreak: false });
      y += rowH;
    }

    // Observaciones y resumen bien alineados
    const bottomY = 530;
    const panelH = 152;
    const obsW = 280;
    const resumenW = 210;

    box("Observaciones", tableX, bottomY, obsW, panelH);
    normal().fontSize(8).fillColor(colorSuave).text(
      "Gracias por su compra. Conserve este comprobante para consultas, garantía, soporte o reclamos del pedido.",
      tableX + 10,
      bottomY + 35,
      { width: obsW - 20, height: 40 }
    );
    bold().fontSize(8).fillColor(colorPrincipal).text("Nota:", tableX + 10, bottomY + 86, { continued: true });
    normal().fontSize(8).fillColor(colorSuave).text(" Documento generado por el sistema interno de ventas.");

    const resumenX = rightX - 18 - resumenW;
    box("Resumen de pago", resumenX, bottomY, resumenW, panelH);

    const rowLabelX = resumenX + 14;
    const rowValueX = resumenX + 104;
    const rowValueW = resumenW - 122;
    const rowsStartY = bottomY + 35;
    const rowGap = 17;

    function resumenRow(label, value, rowIndex) {
      const yy = rowsStartY + rowIndex * rowGap;
      normal().fontSize(8.7).fillColor(colorSecundario).text(label, rowLabelX, yy, { width: 86, lineBreak: false });
      normal().fontSize(8.7).fillColor(colorTexto).text(money(value), rowValueX, yy, {
        width: rowValueW,
        align: "right",
        lineBreak: false
      });
    }

    resumenRow("Subtotal:", factura.subtotal, 0);
    resumenRow("Descuento:", factura.descuento, 1);
    resumenRow("Envío:", factura.envio, 2);
    resumenRow("Impuesto:", factura.impuesto, 3);

    const totalBoxX = resumenX + 10;
    const totalBoxY = bottomY + 103;
    const totalBoxW = resumenW - 20;
    const totalBoxH = 34;
    doc.roundedRect(totalBoxX, totalBoxY, totalBoxW, totalBoxH, 5).fill(colorPrincipal);
    bold().fontSize(8.7).fillColor("#ffffff").text("TOTAL A PAGAR", totalBoxX + 10, totalBoxY + 12, {
      width: 86,
      lineBreak: false
    });
    bold().fontSize(15).fillColor("#ffffff").text(money(factura.total), totalBoxX + 92, totalBoxY + 9, {
      width: totalBoxW - 102,
      align: "right",
      lineBreak: false
    });

    // Pie de página fijo
    const footY = H - 46;
    doc.moveTo(margin + 18, footY - 8).lineTo(rightX - 18, footY - 8).strokeColor(colorBorde).lineWidth(0.5).stroke();
    normal().fontSize(7).fillColor(colorSuave)
      .text("PDF generado automáticamente por el módulo de facturación.", margin + 18, footY, { width: 320, lineBreak: false });
    doc.text("Página 1 de 1", margin + 18, footY, { width: contentW - 36, align: "right", lineBreak: false });

    doc.end();
  });
}
function crearNumeroFactura() {
  const anio = new Date().getFullYear();
  const consecutivo = Date.now().toString().slice(-8);
  return `FAC-${anio}-${consecutivo}`;
}

function metodoPagoNormalizado(metodoPago) {
  return String(metodoPago || "").toLowerCase().trim();
}

function metodoPagoEsTarjeta(metodoPago) {
  const metodo = metodoPagoNormalizado(metodoPago);
  return metodo.includes("tarjeta") || metodo.includes("card") || metodo.includes("visa") || metodo.includes("mastercard");
}

function metodoPagoEsEfectivo(metodoPago) {
  const metodo = metodoPagoNormalizado(metodoPago);
  return metodo.includes("efectivo") || metodo.includes("contra entrega") || metodo.includes("cash");
}

function estadoFacturaSegunPedido(estadoPedido, metodoPago = "") {
  const estado = String(estadoPedido || "").toLowerCase().trim();

  if (estado === "cancelado") return "anulada";
  if (estado === "devolución solicitada" || estado === "devolucion solicitada") return "devolucion_solicitada";
  if (estado === "devuelto") return "reembolsada";

  // Si el cliente pagó con tarjeta, la factura nace y se mantiene pagada.
  if (metodoPagoEsTarjeta(metodoPago)) return "pagada";

  // En efectivo/contra entrega queda pendiente hasta que el pedido sea entregado.
  if (estado === "entregado") return "pagada";

  // Enviado todavía no significa pagado si el método es efectivo.
  return "pendiente";
}

function calcularDiasDesde(fecha) {
  if (!fecha) return null;
  return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
}

async function sincronizarFacturaDesdePedido(pedidoId) {
  const pedidos = await query("SELECT estado, metodo_pago FROM pedidos WHERE id = ? LIMIT 1", [pedidoId]);
  if (pedidos.length === 0) return null;

  const estadoFactura = estadoFacturaSegunPedido(pedidos[0].estado, pedidos[0].metodo_pago);
  await query("UPDATE facturas SET estado = ? WHERE pedido_id = ?", [estadoFactura, pedidoId]);
  return estadoFactura;
}

// GET — listar facturas con filtros y paginación
router.get("/", verificarToken, soloPanel, async (req, res) => {
  const pagina = Math.max(parseInt(req.query.page) || 1, 1);
  const limite = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
  const offset = (pagina - 1) * limite;

  const search = (req.query.search || "").trim();
  const estado = (req.query.estado || "").trim();
  const fecha = (req.query.fecha || "").trim();

  const condiciones = [];
  const valores = [];

  if (search) {
    condiciones.push(`(
      facturas.numero_factura LIKE ?
      OR pedidos.codigo_pedido LIKE ?
      OR usuarios.nombre LIKE ?
      OR pedidos.cliente_nombre LIKE ?
      OR pedidos.telefono LIKE ?
    )`);

    const valorBusqueda = `%${search}%`;
    valores.push(valorBusqueda, valorBusqueda, valorBusqueda, valorBusqueda, valorBusqueda);
  }

  if (estado) {
    condiciones.push("LOWER(facturas.estado) = LOWER(?)");
    valores.push(estado);
  }

  if (fecha) {
    condiciones.push("DATE(facturas.fecha_factura) = ?");
    valores.push(fecha);
  }

  const whereSql = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  try {
    const totalRows = await query(
      `SELECT COUNT(*) AS total
       FROM facturas
       LEFT JOIN pedidos ON pedidos.id = facturas.pedido_id
       LEFT JOIN usuarios ON usuarios.id = facturas.cliente_id
       ${whereSql}`,
      valores
    );

    const facturas = await query(
      `SELECT
          facturas.id,
          facturas.pedido_id,
          facturas.numero_factura,
          facturas.cliente_id,
          facturas.subtotal,
          facturas.descuento,
          facturas.envio,
          facturas.impuesto,
          facturas.total,
          facturas.metodo_pago,
          facturas.estado,
          facturas.fecha_factura,
          pedidos.codigo_pedido,
          pedidos.estado AS pedido_estado,
          pedidos.fecha_envio,
          pedidos.fecha_entregado,
          pedidos.fecha_devolucion,
          pedidos.motivo_devolucion,
          pedidos.telefono,
          pedidos.direccion_envio,
          COALESCE(usuarios.nombre, pedidos.cliente_nombre, 'Cliente no registrado') AS cliente
       FROM facturas
       LEFT JOIN pedidos ON pedidos.id = facturas.pedido_id
       LEFT JOIN usuarios ON usuarios.id = facturas.cliente_id
       ${whereSql}
       ORDER BY facturas.id DESC
       LIMIT ? OFFSET ?`,
      [...valores, limite, offset]
    );

    const total = totalRows[0]?.total || 0;

    res.json({
      facturas,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite) || 1
    });
  } catch (error) {
    console.error("Error al obtener facturas:", error);
    res.status(500).json({ mensaje: "Error al obtener facturas" });
  }
});

// GET — PDF de una factura perteneciente al cliente autenticado
router.get("/mias/:id/pdf", verificarToken, async (req, res) => {
  const rol = String(req.usuario?.rol || "").toLowerCase();
  if (req.usuario?.portal !== "tienda" || rol !== "cliente") {
    return res.status(403).json({ mensaje: "Acceso no autorizado" });
  }

  try {
    const facturas = await query(
      `SELECT
          facturas.*,
          pedidos.codigo_pedido, pedidos.estado AS pedido_estado,
          pedidos.fecha_envio, pedidos.fecha_entregado, pedidos.fecha_devolucion,
          pedidos.motivo_devolucion, pedidos.cliente_nombre, pedidos.cliente_email,
          pedidos.telefono, pedidos.direccion_envio, pedidos.resumen_pedido,
          COALESCE(usuarios.nombre, pedidos.cliente_nombre, 'Cliente no registrado') AS cliente
       FROM facturas
       INNER JOIN pedidos ON pedidos.id = facturas.pedido_id
       LEFT JOIN usuarios ON usuarios.id = facturas.cliente_id
       WHERE facturas.id = ? AND pedidos.usuario_id = ?
       LIMIT 1`,
      [req.params.id, req.usuario.id]
    );

    if (!facturas.length) return res.status(404).json({ mensaje: "Factura no encontrada" });

    const factura = facturas[0];
    const estadoSincronizado = await sincronizarFacturaDesdePedido(factura.pedido_id);
    if (estadoSincronizado) factura.estado = estadoSincronizado;

    const detalles = await query(
      `SELECT nombre_producto, cantidad, precio_unitario, subtotal
       FROM pedido_detalles WHERE pedido_id = ? ORDER BY id ASC`,
      [factura.pedido_id]
    );

    const pdfBuffer = await crearPdfFactura(factura, detalles);
    const nombreArchivo = `${factura.numero_factura || "factura"}.pdf`.replace(/[^a-zA-Z0-9._-]/g, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${nombreArchivo}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error al generar PDF del cliente:", error);
    res.status(500).json({ mensaje: "Error al generar la factura" });
  }
});

// GET — descargar factura en PDF
router.get("/:id/pdf", verificarToken, soloPanel, async (req, res) => {
  const { id } = req.params;

  try {
    const facturas = await query(
      `SELECT
          facturas.*,
          pedidos.codigo_pedido,
          pedidos.estado AS pedido_estado,
          pedidos.fecha_envio,
          pedidos.fecha_entregado,
          pedidos.fecha_devolucion,
          pedidos.motivo_devolucion,
          pedidos.cliente_nombre,
          pedidos.cliente_email,
          pedidos.telefono,
          pedidos.direccion_envio,
          pedidos.resumen_pedido,
          COALESCE(usuarios.nombre, pedidos.cliente_nombre, 'Cliente no registrado') AS cliente
       FROM facturas
       LEFT JOIN pedidos ON pedidos.id = facturas.pedido_id
       LEFT JOIN usuarios ON usuarios.id = facturas.cliente_id
       WHERE facturas.id = ?`,
      [id]
    );

    if (facturas.length === 0) {
      return res.status(404).json({ mensaje: "Factura no encontrada" });
    }

    const factura = facturas[0];
    const estadoSincronizado = await sincronizarFacturaDesdePedido(factura.pedido_id);
    if (estadoSincronizado) factura.estado = estadoSincronizado;

    const detalles = await query(
      `SELECT
          pedido_detalles.nombre_producto,
          pedido_detalles.cantidad,
          pedido_detalles.precio_unitario,
          pedido_detalles.subtotal
       FROM pedido_detalles
       WHERE pedido_detalles.pedido_id = ?
       ORDER BY pedido_detalles.id ASC`,
      [factura.pedido_id]
    );

    const pdfBuffer = await crearPdfFactura(factura, detalles);
    const nombreArchivo = `${factura.numero_factura || "factura"}.pdf`.replace(/[^a-zA-Z0-9._-]/g, "_");

    const modoDescarga = req.query.download === "1";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${modoDescarga ? "attachment" : "inline"}; filename="${nombreArchivo}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error al generar PDF de factura:", error);
    res.status(500).json({ mensaje: "Error al generar PDF de factura" });
  }
});

// GET — detalle de una factura
router.get("/:id", verificarToken, soloPanel, async (req, res) => {
  const { id } = req.params;

  try {
    const facturas = await query(
      `SELECT
          facturas.*,
          pedidos.codigo_pedido,
          pedidos.estado AS pedido_estado,
          pedidos.fecha_envio,
          pedidos.fecha_entregado,
          pedidos.fecha_devolucion,
          pedidos.motivo_devolucion,
          pedidos.cliente_nombre,
          pedidos.cliente_email,
          pedidos.telefono,
          pedidos.direccion_envio,
          pedidos.resumen_pedido,
          COALESCE(usuarios.nombre, pedidos.cliente_nombre, 'Cliente no registrado') AS cliente
       FROM facturas
       LEFT JOIN pedidos ON pedidos.id = facturas.pedido_id
       LEFT JOIN usuarios ON usuarios.id = facturas.cliente_id
       WHERE facturas.id = ?`,
      [id]
    );

    if (facturas.length === 0) {
      return res.status(404).json({ mensaje: "Factura no encontrada" });
    }

    const factura = facturas[0];
    const estadoSincronizado = await sincronizarFacturaDesdePedido(factura.pedido_id);
    if (estadoSincronizado) factura.estado = estadoSincronizado;
    factura.dias_desde_entrega = calcularDiasDesde(factura.fecha_entregado);
    factura.devolucion_disponible = factura.pedido_estado === "Entregado" && factura.dias_desde_entrega !== null && factura.dias_desde_entrega <= 15;

    const detalles = await query(
      `SELECT
          pedido_detalles.id,
          pedido_detalles.producto_id,
          pedido_detalles.nombre_producto,
          pedido_detalles.cantidad,
          pedido_detalles.precio_unitario,
          pedido_detalles.subtotal
       FROM pedido_detalles
       WHERE pedido_detalles.pedido_id = ?
       ORDER BY pedido_detalles.id ASC`,
      [factura.pedido_id]
    );

    res.json({ factura, detalles });
  } catch (error) {
    console.error("Error al obtener detalle de factura:", error);
    res.status(500).json({ mensaje: "Error al obtener detalle de factura" });
  }
});

// POST — generar factura desde un pedido
router.post("/generar/:pedido_id", verificarToken, soloPanel, async (req, res) => {
  const { pedido_id } = req.params;
  const impuestoPorcentaje = Math.max(Number(req.body.impuesto_porcentaje || 0), 0);
  const descuentoExtra = Math.max(Number(req.body.descuento || 0), 0);

  try {
    const pedidoRows = await query(
      `SELECT
          pedidos.*,
          COALESCE(usuarios.nombre, pedidos.cliente_nombre, 'Cliente no registrado') AS cliente
       FROM pedidos
       LEFT JOIN usuarios ON usuarios.id = pedidos.usuario_id
       WHERE pedidos.id = ?`,
      [pedido_id]
    );

    if (pedidoRows.length === 0) {
      return res.status(404).json({ mensaje: "Pedido no encontrado" });
    }

    const facturaExistente = await query(
      "SELECT id, numero_factura FROM facturas WHERE pedido_id = ? LIMIT 1",
      [pedido_id]
    );

    if (facturaExistente.length > 0) {
      return res.status(409).json({
        mensaje: "Este pedido ya tiene factura",
        factura_id: facturaExistente[0].id,
        numero_factura: facturaExistente[0].numero_factura
      });
    }

    const pedido = pedidoRows[0];

    const detalles = await query(
      `SELECT cantidad, precio_unitario, subtotal
       FROM pedido_detalles
       WHERE pedido_id = ?`,
      [pedido_id]
    );

    let subtotal = detalles.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);

    if (subtotal <= 0) {
      subtotal = Number(pedido.total || 0);
    }

    const totalPedido = Number(pedido.total || 0);
    const envio = Math.max(totalPedido - subtotal, 0);
    const impuesto = Number(((subtotal - descuentoExtra) * (impuestoPorcentaje / 100)).toFixed(2));
    const total = Number((subtotal - descuentoExtra + envio + impuesto).toFixed(2));
    const numeroFactura = crearNumeroFactura();
    const estadoInicialFactura = estadoFacturaSegunPedido(pedido.estado, pedido.metodo_pago);

    const insert = await query(
      `INSERT INTO facturas
       (pedido_id, numero_factura, cliente_id, subtotal, descuento, envio, impuesto, total, metodo_pago, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pedido.id,
        numeroFactura,
        pedido.usuario_id || null,
        subtotal,
        descuentoExtra,
        envio,
        impuesto,
        total,
        pedido.metodo_pago || "No especificado",
        estadoInicialFactura
      ]
    );

    res.status(201).json({
      mensaje: "Factura generada correctamente",
      factura_id: insert.insertId,
      numero_factura: numeroFactura,
      total
    });
  } catch (error) {
    console.error("Error al generar factura:", error);
    res.status(500).json({ mensaje: "Error al generar factura" });
  }
});

// PUT — editar datos permitidos de la factura antes de su emisión/validación DTE
router.put("/:id/editar", verificarToken, soloPanel, async (req, res) => {
  const { id } = req.params;
  const descuento = Math.max(Number(req.body.descuento || 0), 0);
  const impuesto = Math.max(Number(req.body.impuesto || 0), 0);
  const metodoPago = String(req.body.metodo_pago || "").trim();

  try {
    const rows = await query(
      `SELECT id, estado, subtotal, envio, pedido_id
       FROM facturas
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Factura no encontrada" });
    }

    const factura = rows[0];
    // No bloquear por el estado comercial de la factura. Ese estado refleja
    // pago/devolución y es independiente del futuro estado de emisión DTE.
    // Cuando se implemente DTE, el bloqueo se hará con su estado/sello real.

    const subtotal = Number(factura.subtotal || 0);
    const envio = Number(factura.envio || 0);
    if (descuento > subtotal) {
      return res.status(400).json({ mensaje: "El descuento no puede ser mayor que el subtotal" });
    }

    const total = Number((subtotal - descuento + envio + impuesto).toFixed(2));
    await query(
      `UPDATE facturas
       SET descuento = ?, impuesto = ?, total = ?, metodo_pago = ?
       WHERE id = ?`,
      [descuento, impuesto, total, metodoPago || "No especificado", id]
    );

    res.json({ mensaje: "Factura actualizada correctamente", total });
  } catch (error) {
    console.error("Error al editar factura:", error);
    res.status(500).json({ mensaje: "Error al editar factura" });
  }
});

// PUT — cambiar estado de factura con reglas enlazadas al pedido
router.put("/:id/estado", verificarToken, soloPanel, async (req, res) => {
  const { id } = req.params;
  const { estado, motivo_devolucion } = req.body;
  const estadoSolicitado = String(estado || "").toLowerCase();
  const estadosValidos = ["pendiente", "pagada", "anulada", "devolucion_solicitada", "reembolsada"];

  if (!estadosValidos.includes(estadoSolicitado)) {
    return res.status(400).json({ mensaje: "Estado de factura no válido" });
  }

  try {
    const rows = await query(
      `SELECT
          facturas.id,
          facturas.pedido_id,
          facturas.estado AS estado_factura,
          pedidos.estado AS estado_pedido,
          pedidos.fecha_entregado
       FROM facturas
       LEFT JOIN pedidos ON pedidos.id = facturas.pedido_id
       WHERE facturas.id = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Factura no encontrada" });
    }

    const registro = rows[0];
    const estadoPedido = String(registro.estado_pedido || "");
    const pedidoLower = estadoPedido.toLowerCase();

    if (estadoSolicitado === "pagada") {
      if (["enviado", "entregado", "devolución solicitada", "devolucion solicitada", "devuelto", "cancelado"].includes(pedidoLower)) {
        return res.status(400).json({ mensaje: "Esta factura ya depende del estado actual del pedido" });
      }

      await query("UPDATE facturas SET estado = ? WHERE id = ?", ["pagada", id]);
      return res.json({ mensaje: "Factura marcada como pagada" });
    }

    if (estadoSolicitado === "anulada") {
      if (["enviado", "entregado", "devolución solicitada", "devolucion solicitada", "devuelto"].includes(pedidoLower)) {
        return res.status(400).json({ mensaje: "No se puede anular una factura de un pedido enviado, entregado o en devolución" });
      }

      await query("UPDATE pedidos SET estado = ? WHERE id = ?", ["Cancelado", registro.pedido_id]);
      await query("UPDATE facturas SET estado = ? WHERE id = ?", ["anulada", id]);
      return res.json({ mensaje: "Factura anulada y pedido cancelado" });
    }

    if (estadoSolicitado === "devolucion_solicitada") {
      if (estadoPedido !== "Entregado") {
        return res.status(400).json({ mensaje: "Solo se puede solicitar devolución cuando el pedido está entregado" });
      }

      if (!registro.fecha_entregado) {
        return res.status(400).json({ mensaje: "El pedido no tiene fecha de entrega registrada" });
      }

      const dias = calcularDiasDesde(registro.fecha_entregado);
      if (dias === null || dias > 15) {
        return res.status(400).json({ mensaje: "El plazo de devolución de 15 días ya venció" });
      }

      await query(
        `UPDATE pedidos
         SET estado = ?, motivo_devolucion = ?, fecha_devolucion = NOW()
         WHERE id = ?`,
        ["Devolución solicitada", motivo_devolucion || null, registro.pedido_id]
      );
      await query("UPDATE facturas SET estado = ? WHERE id = ?", ["devolucion_solicitada", id]);
      return res.json({ mensaje: "Devolución solicitada correctamente" });
    }

    if (estadoSolicitado === "reembolsada") {
      await query("UPDATE pedidos SET estado = ?, fecha_devolucion = COALESCE(fecha_devolucion, NOW()) WHERE id = ?", ["Devuelto", registro.pedido_id]);
      await query("UPDATE facturas SET estado = ? WHERE id = ?", ["reembolsada", id]);
      return res.json({ mensaje: "Factura marcada como reembolsada" });
    }

    await query("UPDATE facturas SET estado = ? WHERE id = ?", [estadoSolicitado, id]);
    res.json({ mensaje: "Estado de factura actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar factura:", error);
    res.status(500).json({ mensaje: "Error al actualizar factura" });
  }
});

module.exports = router;
