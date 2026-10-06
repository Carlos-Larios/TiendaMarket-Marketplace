const express = require("express");
const router = express.Router();
const db = require("../db");
const { verificarToken } = require("../middleware/auth.middleware");

function query(sql, values = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
}


async function columnaExiste(tabla, columna) {
    const rows = await query(`SHOW COLUMNS FROM ${tabla} LIKE ?`, [columna]);
    return rows.length > 0;
}

async function asegurarColumnasDevolucion() {
    await asegurarTablaDetalles();

    if (!(await columnaExiste('devoluciones', 'revision_producto'))) {
        await query(`ALTER TABLE devoluciones ADD COLUMN revision_producto ENUM('sin_revision','producto_bueno','danio_reparable','producto_danado','defecto_fabrica') DEFAULT 'sin_revision' AFTER resolucion`);
    }
    if (!(await columnaExiste('devoluciones', 'accion_inventario'))) {
        await query(`ALTER TABLE devoluciones ADD COLUMN accion_inventario ENUM('sin_accion','volver_a_stock','enviar_reparacion','devolver_proveedor','dar_baja') DEFAULT 'sin_accion' AFTER revision_producto`);
    }
    if (!(await columnaExiste('devoluciones', 'solucion_cliente'))) {
        await query(`ALTER TABLE devoluciones ADD COLUMN solucion_cliente ENUM('sin_solucion','solicitud_rechazada','reembolso_cliente','cambio_producto','credito_tienda') DEFAULT 'sin_solucion' AFTER accion_inventario`);
    }
    if (!(await columnaExiste('devoluciones', 'gestion_proveedor'))) {
        await query(`ALTER TABLE devoluciones ADD COLUMN gestion_proveedor ENUM('sin_reclamo','abrir_reclamo','solicitar_reemplazo','solicitar_reembolso','devolver_producto') DEFAULT 'sin_reclamo' AFTER solucion_cliente`);
    }

    await query(`UPDATE devoluciones SET revision_producto = 'producto_danado' WHERE revision_producto = 'danio_irreparable'`).catch(() => null);
    await query(`UPDATE devoluciones SET solucion_cliente = 'cambio_producto' WHERE solucion_cliente IN ('cambio_mismo_producto','cambio_producto_diferente')`).catch(() => null);
    await query(`ALTER TABLE devoluciones MODIFY COLUMN revision_producto ENUM('sin_revision','producto_bueno','danio_reparable','producto_danado','defecto_fabrica') DEFAULT 'sin_revision'`).catch(() => null);
    await query(`ALTER TABLE devoluciones MODIFY COLUMN accion_inventario ENUM('sin_accion','volver_a_stock','enviar_reparacion','devolver_proveedor','dar_baja') DEFAULT 'sin_accion'`).catch(() => null);
    await query(`ALTER TABLE devoluciones MODIFY COLUMN solucion_cliente ENUM('sin_solucion','solicitud_rechazada','reembolso_cliente','cambio_producto','credito_tienda') DEFAULT 'sin_solucion'`).catch(() => null);
    await query(`ALTER TABLE devoluciones MODIFY COLUMN gestion_proveedor ENUM('sin_reclamo','abrir_reclamo','solicitar_reemplazo','solicitar_reembolso','devolver_producto') DEFAULT 'sin_reclamo'`).catch(() => null);
}

async function asegurarTablaDetalles() {
    await query(`
        CREATE TABLE IF NOT EXISTS devolucion_detalles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            devolucion_id INT NOT NULL,
            pedido_detalle_id INT NULL,
            pedido_id INT NOT NULL,
            producto_id INT NOT NULL,
            nombre_producto VARCHAR(255) NULL,
            codigo_producto VARCHAR(150) NULL,
            motivo TEXT NULL,
            estado_revision ENUM('pendiente','recibida','en_revision','aprobada','rechazada','finalizada') DEFAULT 'recibida',
            resolucion ENUM('sin_resolver','volver_a_stock','marcar_dañado','reembolso_cliente','cambio_producto','devolucion_proveedor','reembolso_proveedor') DEFAULT 'sin_resolver',
            observaciones TEXT NULL,
            proveedor VARCHAR(150) NULL,
            proveedor_url TEXT NULL,
            numero_orden VARCHAR(150) NULL,
            precio_compra DECIMAL(10,2) DEFAULT 0.00,
            fecha_compra DATE NULL,
            garantia_hasta DATE NULL,
            fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_devolucion_id (devolucion_id),
            INDEX idx_pedido_id (pedido_id),
            INDEX idx_codigo_producto (codigo_producto)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
}

async function migrarDevolucionesAntiguas() {
    await asegurarTablaDetalles();
    const faltantes = await query(`
        SELECT d.*
        FROM devoluciones d
        LEFT JOIN devolucion_detalles dd ON dd.devolucion_id = d.id
        WHERE dd.id IS NULL AND d.producto_id IS NOT NULL AND d.codigo_producto IS NOT NULL
    `);

    for (const d of faltantes) {
        const producto = await query("SELECT nombre FROM productos WHERE id = ? LIMIT 1", [d.producto_id]);
        const detallePedido = await query(`
            SELECT id FROM pedido_detalles
            WHERE pedido_id = ? AND producto_id = ?
            LIMIT 1
        `, [d.pedido_id, d.producto_id]);

        await query(`
            INSERT INTO devolucion_detalles
            (devolucion_id, pedido_detalle_id, pedido_id, producto_id, nombre_producto, codigo_producto, motivo,
             estado_revision, resolucion, observaciones, proveedor, proveedor_url, numero_orden, precio_compra, fecha_compra, garantia_hasta)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            d.id,
            detallePedido[0]?.id || null,
            d.pedido_id,
            d.producto_id,
            producto[0]?.nombre || null,
            d.codigo_producto,
            d.motivo,
            d.estado === "pendiente" ? "pendiente" : (d.estado === "rechazada" ? "rechazada" : (d.estado === "finalizada" ? "finalizada" : "recibida")),
            d.resolucion || "sin_resolver",
            d.observaciones || null,
            d.proveedor || null,
            d.proveedor_url || null,
            d.numero_orden || null,
            d.precio_compra || 0,
            d.fecha_compra || null,
            d.garantia_hasta || null
        ]);
    }
}

async function recalcularStockProducto(productoId) {
    if (!productoId) return;
    await query(`
        UPDATE productos
        SET stock = (
            SELECT COUNT(*)
            FROM inventario_fisico
            WHERE producto_id = ? AND estado = 'disponible'
        )
        WHERE id = ?
    `, [productoId, productoId]);
}

function resolverEstadoInventario(resolucion, revisionProducto = '', accionInventario = '') {
    if (accionInventario) {
        switch (accionInventario) {
            case "volver_a_stock": return "disponible";
            case "enviar_reparacion": return "en_revision";
            case "devolver_proveedor": return "reclamo_proveedor";
            case "dar_baja": return "dañado";
            default: break;
        }
    }

    switch (resolucion) {
        case "volver_a_stock": return "disponible";
        case "marcar_dañado": return "dañado";
        case "devolucion_proveedor":
        case "reembolso_proveedor": return "reclamo_proveedor";
        case "reembolso_cliente":
        case "cambio_producto": return revisionProducto === "producto_bueno" ? "disponible" : "devuelto";
        default: return null;
    }
}

function resolverResolucionLegacy(revisionProducto, accionInventario, solucionCliente, gestionProveedor) {
    if (accionInventario === "volver_a_stock") return "volver_a_stock";
    if (accionInventario === "dar_baja") return "marcar_dañado";
    if (accionInventario === "devolver_proveedor" || gestionProveedor !== "sin_reclamo") return "devolucion_proveedor";
    if (solucionCliente === "reembolso_cliente") return "reembolso_cliente";
    if (solucionCliente === "cambio_producto") return "cambio_producto";
    if (["producto_danado", "danio_reparable", "defecto_fabrica"].includes(revisionProducto)) return "marcar_dañado";
    return "sin_resolver";
}

function generarNumeroCasoDevolucion(id, fecha = new Date()) {
    const anio = fecha.getFullYear();
    const correlativo = String(id).padStart(6, "0");
    return `DEV-${anio}-${correlativo}`;
}

function normalizarDevolucion(row, detalles) {
    return {
        ...row,
        detalle_count: detalles.length,
        productos_resumen: detalles.map(d => d.nombre_producto || d.codigo_producto).filter(Boolean).join(", "),
        detalles
    };
}

router.get("/", verificarToken, async (req, res) => {
    try {
        await asegurarColumnasDevolucion();
        await migrarDevolucionesAntiguas();

        const search = String(req.query.search || "").trim();
        const estado = String(req.query.estado || "").trim();
        const resolucion = String(req.query.resolucion || "").trim();
        const fechaDesde = String(req.query.fecha_desde || "").trim();
        const fechaHasta = String(req.query.fecha_hasta || "").trim();

        const condiciones = [];
        const valores = [];

        if (search) {
            condiciones.push(`(
                d.id LIKE ? OR d.numero_caso_cliente LIKE ? OR d.motivo LIKE ? OR d.observaciones LIKE ?
                OR p.codigo_pedido LIKE ? OR COALESCE(u.nombre, p.cliente_nombre, '') LIKE ?
                OR EXISTS (
                    SELECT 1 FROM devolucion_detalles ddx
                    WHERE ddx.devolucion_id = d.id
                    AND (ddx.codigo_producto LIKE ? OR ddx.nombre_producto LIKE ? OR COALESCE(ddx.proveedor, '') LIKE ? OR COALESCE(ddx.numero_orden, '') LIKE ?)
                )
            )`);
            const value = `%${search}%`;
            valores.push(value, value, value, value, value, value, value, value, value, value);
        }

        if (estado) { condiciones.push("d.estado = ?"); valores.push(estado); }
        if (resolucion) { condiciones.push("d.resolucion = ?"); valores.push(resolucion); }
        if (fechaDesde) { condiciones.push("DATE(d.fecha_creacion) >= ?"); valores.push(fechaDesde); }
        if (fechaHasta) { condiciones.push("DATE(d.fecha_creacion) <= ?"); valores.push(fechaHasta); }

        const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

        const rows = await query(`
            SELECT
                d.*,
                p.codigo_pedido,
                p.total AS pedido_total,
                COALESCE(u.nombre, p.cliente_nombre, 'Cliente no registrado') AS cliente,
                COUNT(dd.id) AS detalle_count,
                GROUP_CONCAT(DISTINCT dd.nombre_producto ORDER BY dd.id SEPARATOR ', ') AS productos_resumen
            FROM devoluciones d
            LEFT JOIN pedidos p ON p.id = d.pedido_id
            LEFT JOIN usuarios u ON u.id = p.usuario_id
            LEFT JOIN devolucion_detalles dd ON dd.devolucion_id = d.id
            ${where}
            GROUP BY d.id
            ORDER BY d.id DESC
        `, valores);

        if (rows.length === 0) return res.json([]);

        const ids = rows.map(r => r.id);
        const placeholders = ids.map(() => "?").join(",");
        const detalles = await query(`
            SELECT
                dd.*,
                pr.nombre AS producto_nombre,
                inv.estado AS estado_inventario,
                inv.codigo_barra
            FROM devolucion_detalles dd
            LEFT JOIN productos pr ON pr.id = dd.producto_id
            LEFT JOIN inventario_fisico inv ON inv.codigo_producto = dd.codigo_producto
            WHERE dd.devolucion_id IN (${placeholders})
            ORDER BY dd.devolucion_id DESC, dd.id ASC
        `, ids);

        const porDev = new Map();
        for (const item of detalles) {
            if (!porDev.has(item.devolucion_id)) porDev.set(item.devolucion_id, []);
            porDev.get(item.devolucion_id).push({
                ...item,
                nombre_producto: item.nombre_producto || item.producto_nombre || "—"
            });
        }

        res.json(rows.map(row => normalizarDevolucion(row, porDev.get(row.id) || [])));
    } catch (error) {
        console.error("Error al listar devoluciones:", error);
        res.status(500).json({ mensaje: "Error al obtener devoluciones" });
    }
});

router.get("/unidad/:codigo", verificarToken, async (req, res) => {
    try {
        await asegurarColumnasDevolucion();
        const codigo = String(req.params.codigo || "").trim();
        if (!codigo) return res.status(400).json({ mensaje: "Código requerido" });

        const rows = await query(`
            SELECT
                inv.*,
                pr.nombre AS producto_nombre,
                pr.precio,
                p.codigo_pedido,
                p.estado AS estado_pedido,
                p.total AS pedido_total,
                p.fecha_pedido,
                p.fecha_entregado,
                COALESCE(u.nombre, p.cliente_nombre, 'Cliente no registrado') AS cliente,
                COALESCE(u.email, p.cliente_email, '') AS cliente_email
            FROM inventario_fisico inv
            LEFT JOIN productos pr ON pr.id = inv.producto_id
            LEFT JOIN pedidos p ON p.id = inv.pedido_id
            LEFT JOIN usuarios u ON u.id = p.usuario_id
            WHERE inv.codigo_producto = ?
            LIMIT 1
        `, [codigo]);

        if (rows.length === 0) return res.status(404).json({ mensaje: "No se encontró esa unidad física" });

        const unidad = rows[0];
        const activa = await query(`
            SELECT d.id, d.estado
            FROM devolucion_detalles dd
            INNER JOIN devoluciones d ON d.id = dd.devolucion_id
            WHERE dd.codigo_producto = ? AND d.estado NOT IN ('rechazada', 'finalizada')
            ORDER BY d.id DESC
            LIMIT 1
        `, [codigo]);

        res.json({
            unidad,
            puede_devolver: unidad.estado === "vendido" && !!unidad.pedido_id && activa.length === 0,
            devolucion_activa: activa[0] || null
        });
    } catch (error) {
        console.error("Error al buscar unidad para devolución:", error);
        res.status(500).json({ mensaje: "Error al buscar unidad" });
    }
});

router.post("/", verificarToken, async (req, res) => {
    const codigoProducto = String(req.body.codigo_producto || "").trim();
    const motivo = String(req.body.motivo || "").trim();
    const observaciones = String(req.body.observaciones || "").trim() || null;

    if (!codigoProducto || !motivo) return res.status(400).json({ mensaje: "Código de unidad y motivo son obligatorios" });

    try {
        await asegurarColumnasDevolucion();
        const unidades = await query("SELECT * FROM inventario_fisico WHERE codigo_producto = ? LIMIT 1", [codigoProducto]);
        if (unidades.length === 0) return res.status(404).json({ mensaje: "Unidad física no encontrada" });

        const unidad = unidades[0];
        if (unidad.estado !== "vendido") return res.status(400).json({ mensaje: `La unidad no está vendida. Estado actual: ${unidad.estado}` });
        if (!unidad.pedido_id) return res.status(400).json({ mensaje: "La unidad vendida no tiene pedido asociado" });

        const activa = await query(`
            SELECT d.id FROM devolucion_detalles dd
            INNER JOIN devoluciones d ON d.id = dd.devolucion_id
            WHERE dd.codigo_producto = ? AND d.estado NOT IN ('rechazada', 'finalizada')
            LIMIT 1
        `, [codigoProducto]);
        if (activa.length > 0) return res.status(400).json({ mensaje: "Ya existe una devolución activa para esta unidad" });

        const detallePedido = await query(`
            SELECT id, nombre_producto FROM pedido_detalles
            WHERE pedido_id = ? AND producto_id = ?
            LIMIT 1
        `, [unidad.pedido_id, unidad.producto_id]);

        const insert = await query(`
            INSERT INTO devoluciones
            (pedido_id, producto_id, codigo_producto, motivo, estado, resolucion, observaciones,
             proveedor, proveedor_url, numero_orden, precio_compra, fecha_compra, garantia_hasta, fecha_recepcion)
            VALUES (?, ?, ?, ?, 'recibida', 'sin_resolver', ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            unidad.pedido_id,
            unidad.producto_id,
            codigoProducto,
            motivo,
            observaciones,
            unidad.proveedor || null,
            unidad.proveedor_url || null,
            unidad.numero_orden || null,
            unidad.precio_compra || 0,
            unidad.fecha_compra || null,
            unidad.garantia_hasta || null
        ]);

        const numeroCaso = generarNumeroCasoDevolucion(insert.insertId);
        await query("UPDATE devoluciones SET numero_caso_cliente = ? WHERE id = ?", [numeroCaso, insert.insertId]);

        await query(`
            INSERT INTO devolucion_detalles
            (devolucion_id, pedido_detalle_id, pedido_id, producto_id, nombre_producto, codigo_producto, motivo,
             estado_revision, resolucion, observaciones, proveedor, proveedor_url, numero_orden, precio_compra, fecha_compra, garantia_hasta)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'recibida', 'sin_resolver', ?, ?, ?, ?, ?, ?, ?)
        `, [
            insert.insertId,
            detallePedido[0]?.id || null,
            unidad.pedido_id,
            unidad.producto_id,
            detallePedido[0]?.nombre_producto || null,
            codigoProducto,
            motivo,
            observaciones,
            unidad.proveedor || null,
            unidad.proveedor_url || null,
            unidad.numero_orden || null,
            unidad.precio_compra || 0,
            unidad.fecha_compra || null,
            unidad.garantia_hasta || null
        ]);

        await query("UPDATE inventario_fisico SET estado = 'en_revision' WHERE codigo_producto = ?", [codigoProducto]);
        await query(`
            UPDATE pedidos
            SET estado = 'Devolución solicitada', motivo_devolucion = ?, fecha_devolucion = COALESCE(fecha_devolucion, NOW())
            WHERE id = ?
        `, [motivo, unidad.pedido_id]);
        await query("UPDATE facturas SET estado = 'devolucion_solicitada' WHERE pedido_id = ?", [unidad.pedido_id]).catch(() => null);
        await recalcularStockProducto(unidad.producto_id);

        res.status(201).json({ mensaje: "Devolución creada correctamente", devolucion_id: insert.insertId, numero_caso: numeroCaso });
    } catch (error) {
        console.error("Error al crear devolución:", error);
        res.status(500).json({ mensaje: "Error al crear devolución" });
    }
});

router.put("/:id/estado", verificarToken, async (req, res) => {
    const id = Number(req.params.id);
    const estado = String(req.body.estado || "").trim();
    const estadosValidos = ["pendiente", "recibida", "en_revision", "aprobada", "rechazada", "reclamo_proveedor", "finalizada"];
    if (!id || !estadosValidos.includes(estado)) return res.status(400).json({ mensaje: "Estado no válido" });

    try {
        await asegurarColumnasDevolucion();
        const rows = await query("SELECT * FROM devoluciones WHERE id = ? LIMIT 1", [id]);
        if (rows.length === 0) return res.status(404).json({ mensaje: "Devolución no encontrada" });

        let extra = "";
        if (estado === "recibida" || estado === "en_revision") extra = ", fecha_recepcion = COALESCE(fecha_recepcion, NOW())";
        if (estado === "rechazada" || estado === "finalizada") extra += ", fecha_resolucion = COALESCE(fecha_resolucion, NOW())";

        await query(`UPDATE devoluciones SET estado = ? ${extra} WHERE id = ?`, [estado, id]);
        await query("UPDATE devolucion_detalles SET estado_revision = ? WHERE devolucion_id = ?", [estado === "reclamo_proveedor" ? "en_revision" : estado, id]).catch(() => null);

        if (estado === "recibida" || estado === "en_revision") {
            await query(`
                UPDATE inventario_fisico inv
                INNER JOIN devolucion_detalles dd ON dd.codigo_producto = inv.codigo_producto
                SET inv.estado = 'en_revision'
                WHERE dd.devolucion_id = ?
            `, [id]);
        }

        if (estado === "rechazada") {
            await query(`
                UPDATE inventario_fisico inv
                INNER JOIN devolucion_detalles dd ON dd.codigo_producto = inv.codigo_producto
                SET inv.estado = 'vendido'
                WHERE dd.devolucion_id = ?
            `, [id]);
            await query("UPDATE devoluciones SET solucion_cliente = 'solicitud_rechazada', accion_inventario = 'sin_accion' WHERE id = ?", [id]).catch(() => null);
            await query("UPDATE pedidos SET estado = 'Entregado' WHERE id = ?", [rows[0].pedido_id]).catch(() => null);
            await query("UPDATE facturas SET estado = 'pagada' WHERE pedido_id = ? AND estado = 'devolucion_solicitada'", [rows[0].pedido_id]).catch(() => null);
        }


        res.json({ mensaje: "Estado de devolución actualizado" });
    } catch (error) {
        console.error("Error al cambiar estado de devolución:", error);
        res.status(500).json({ mensaje: "Error al actualizar devolución" });
    }
});

router.put("/:id/resolver", verificarToken, async (req, res) => {
    const id = Number(req.params.id);
    const revisionProducto = String(req.body.revision_producto || "").trim();
    const accionInventario = String(req.body.accion_inventario || "").trim();
    const solucionCliente = String(req.body.solucion_cliente || "").trim();
    const gestionProveedor = String(req.body.gestion_proveedor || "sin_reclamo").trim() || "sin_reclamo";
    const observaciones = String(req.body.observaciones || "").trim() || null;
    const proveedorRespuesta = String(req.body.proveedor_respuesta || "").trim() || null;

    const revisionesValidas = ["producto_bueno", "danio_reparable", "producto_danado", "defecto_fabrica"];
    const accionesValidas = ["volver_a_stock", "enviar_reparacion", "devolver_proveedor", "dar_baja"];
    const solucionesValidas = ["solicitud_rechazada", "reembolso_cliente", "cambio_producto", "credito_tienda"];
    const gestionesValidas = ["sin_reclamo", "abrir_reclamo", "solicitar_reemplazo", "solicitar_reembolso", "devolver_producto"];

    if (!id) return res.status(400).json({ mensaje: "Devolución no válida" });
    if (!revisionesValidas.includes(revisionProducto)) return res.status(400).json({ mensaje: "Selecciona el estado real del producto" });
    if (!solucionesValidas.includes(solucionCliente)) return res.status(400).json({ mensaje: "Selecciona la solución para el cliente" });
    if (solucionCliente !== "solicitud_rechazada" && !accionesValidas.includes(accionInventario)) {
        return res.status(400).json({ mensaje: "Selecciona la acción sobre el inventario" });
    }
    if (!gestionesValidas.includes(gestionProveedor)) return res.status(400).json({ mensaje: "Gestión de proveedor no válida" });

    try {
        await asegurarColumnasDevolucion();
        const rows = await query("SELECT * FROM devoluciones WHERE id = ? LIMIT 1", [id]);
        if (rows.length === 0) return res.status(404).json({ mensaje: "Devolución no encontrada" });

        const devolucion = rows[0];
        const resolucionLegacy = resolverResolucionLegacy(revisionProducto, accionInventario, solucionCliente, gestionProveedor);
        const requiereProveedor = gestionProveedor !== "sin_reclamo" || accionInventario === "devolver_proveedor";
        const nuevoEstadoDevolucion = solucionCliente === "solicitud_rechazada" ? "rechazada" : (requiereProveedor ? "reclamo_proveedor" : "finalizada");
        const accionFinal = solucionCliente === "solicitud_rechazada" ? "sin_accion" : accionInventario;
        const nuevoEstadoInventario = solucionCliente === "solicitud_rechazada"
            ? "vendido"
            : resolverEstadoInventario(resolucionLegacy, revisionProducto, accionFinal);

        await query(`
            UPDATE devoluciones
            SET resolucion = ?, revision_producto = ?, accion_inventario = ?, solucion_cliente = ?, gestion_proveedor = ?,
                estado = ?, reclamo_proveedor = ?, proveedor_respuesta = ?, observaciones = ?,
                fecha_resolucion = IF(? IN ('finalizada','rechazada'), NOW(), fecha_resolucion),
                fecha_reclamo_proveedor = IF(? = 1, COALESCE(fecha_reclamo_proveedor, NOW()), fecha_reclamo_proveedor)
            WHERE id = ?
        `, [
            resolucionLegacy,
            revisionProducto,
            accionFinal,
            solucionCliente,
            gestionProveedor,
            nuevoEstadoDevolucion,
            requiereProveedor ? 1 : 0,
            proveedorRespuesta,
            observaciones,
            nuevoEstadoDevolucion,
            requiereProveedor ? 1 : 0,
            id
        ]);

        await query(`
            UPDATE devolucion_detalles
            SET resolucion = ?, estado_revision = ?, observaciones = COALESCE(?, observaciones)
            WHERE devolucion_id = ?
        `, [resolucionLegacy, nuevoEstadoDevolucion === "finalizada" ? "finalizada" : (nuevoEstadoDevolucion === "rechazada" ? "rechazada" : "en_revision"), observaciones, id]);

        if (nuevoEstadoInventario) {
            await query(`
                UPDATE inventario_fisico inv
                INNER JOIN devolucion_detalles dd ON dd.codigo_producto = inv.codigo_producto
                SET inv.estado = ?
                WHERE dd.devolucion_id = ?
            `, [nuevoEstadoInventario, id]);
        }

        const detalles = await query("SELECT DISTINCT producto_id FROM devolucion_detalles WHERE devolucion_id = ?", [id]);
        for (const detalle of detalles) await recalcularStockProducto(detalle.producto_id);

        if (solucionCliente === "solicitud_rechazada") {
            await query("UPDATE pedidos SET estado = 'Entregado' WHERE id = ?", [devolucion.pedido_id]);
            await query("UPDATE facturas SET estado = 'pagada' WHERE pedido_id = ? AND estado = 'devolucion_solicitada'", [devolucion.pedido_id]).catch(() => null);
        } else if (["reembolso_cliente", "cambio_producto", "credito_tienda"].includes(solucionCliente)) {
            await query("UPDATE pedidos SET estado = 'Devuelto' WHERE id = ?", [devolucion.pedido_id]);
            if (solucionCliente === "reembolso_cliente") {
                await query("UPDATE facturas SET estado = 'reembolsada' WHERE pedido_id = ?", [devolucion.pedido_id]).catch(() => null);
            }
        }

        res.json({ mensaje: "Devolución resuelta correctamente" });
    } catch (error) {
        console.error("Error al resolver devolución:", error);
        res.status(500).json({ mensaje: "Error al resolver devolución" });
    }
});

module.exports = router;
