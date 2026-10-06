const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { verificarToken, soloAdmin, soloPanel } = require("../middleware/auth.middleware");

function query(sql, values = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
}

let columnasProductosCache = null;


async function sincronizarStockProductoCantidad(productoId) {
    const rows = await query(`SELECT COALESCE(SUM(stock),0) stock FROM producto_variantes WHERE producto_id=? AND activo=1`, [productoId]);
    const stock = Number(rows[0]?.stock || 0);
    await query(`UPDATE productos SET stock=?, disponibilidad=? WHERE id=?`, [stock, stock>0?'Disponible':'Agotado', productoId]);
}

async function moverInventarioCantidadPorEstado(pedidoId, estadoAnterior, estadoNuevo) {
    const prev = String(estadoAnterior || '').toLowerCase();
    const next = String(estadoNuevo || '').toLowerCase();
    if (prev === next) return;
    const detalles = await query(`SELECT pd.producto_id,pd.variante_id,pd.cantidad,p.vendedor_id
        FROM pedido_detalles pd JOIN productos p ON p.id=pd.producto_id
        WHERE pd.pedido_id=? AND p.vendedor_id IS NOT NULL AND pd.variante_id IS NOT NULL`, [pedidoId]);
    const productosAfectados = new Set();
    for (const d of detalles) {
        const qty=Math.max(0,Number(d.cantidad||0));
        if (!qty) continue;
        if (next === 'entregado' && prev !== 'entregado') {
            await query(`UPDATE inventario_cantidades SET reservado=GREATEST(reservado-?,0), vendido=vendido+?, fecha_actualizacion=NOW() WHERE variante_id=?`, [qty,qty,d.variante_id]);
        } else if (next === 'cancelado' && prev !== 'cancelado') {
            if (prev === 'entregado') {
                await query(`UPDATE inventario_cantidades SET vendido=GREATEST(vendido-?,0), disponible=disponible+?, fecha_actualizacion=NOW() WHERE variante_id=?`, [qty,qty,d.variante_id]);
            } else {
                await query(`UPDATE inventario_cantidades SET reservado=GREATEST(reservado-?,0), disponible=disponible+?, fecha_actualizacion=NOW() WHERE variante_id=?`, [qty,qty,d.variante_id]);
            }
            await query(`UPDATE producto_variantes pv JOIN inventario_cantidades ic ON ic.variante_id=pv.id SET pv.stock=ic.disponible WHERE pv.id=?`, [d.variante_id]);
            productosAfectados.add(Number(d.producto_id));
        }
    }
    for (const id of productosAfectados) await sincronizarStockProductoCantidad(id);
}

async function obtenerColumnasProductos() {
    if (columnasProductosCache) return columnasProductosCache;

    try {
        const columnas = await query(`
            SELECT COLUMN_NAME AS nombre
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos'
        `);

        columnasProductosCache = new Set(columnas.map(col => col.nombre));
    } catch (error) {
        columnasProductosCache = new Set();
    }

    return columnasProductosCache;
}

let columnasPedidoDetallesCache = null;

async function obtenerColumnasPedidoDetalles() {
    if (columnasPedidoDetallesCache) return columnasPedidoDetallesCache;
    try {
        const columnas = await query(`
            SELECT COLUMN_NAME AS nombre
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedido_detalles'
        `);
        columnasPedidoDetallesCache = new Set(columnas.map(col => col.nombre));
    } catch (error) {
        columnasPedidoDetallesCache = new Set();
    }
    return columnasPedidoDetallesCache;
}

function columnaProductoExiste(columnas, nombre) {
    return columnas instanceof Set && columnas.has(nombre);
}

function expresionNombreTiendaProducto(columnas) {
    const opciones = [];

    ['nombre_tienda', 'tienda', 'vendedor', 'nombre_vendedor', 'nombre_emprendimiento', 'propietario'].forEach(columna => {
        if (columnaProductoExiste(columnas, columna)) opciones.push(`productos.${columna}`);
    });

    return opciones.length ? `COALESCE(${opciones.join(', ')}, 'Mi tienda')` : `'Mi tienda'`;
}

function expresionTipoPropietarioProducto(columnas) {
    if (columnaProductoExiste(columnas, 'propietario_tipo')) return 'productos.propietario_tipo';
    if (columnaProductoExiste(columnas, 'tipo_propietario')) return 'productos.tipo_propietario';
    if (columnaProductoExiste(columnas, 'tipo_tienda')) return 'productos.tipo_tienda';
    return `'mi_tienda'`;
}

function condicionProductosMiTienda(columnas) {
    const condiciones = [];

    if (columnaProductoExiste(columnas, 'propietario_tipo')) {
        condiciones.push(`LOWER(COALESCE(productos.propietario_tipo, 'mi_tienda')) IN ('mi_tienda', 'admin', 'plataforma', 'interno')`);
    }

    if (columnaProductoExiste(columnas, 'tipo_propietario')) {
        condiciones.push(`LOWER(COALESCE(productos.tipo_propietario, 'mi_tienda')) IN ('mi_tienda', 'admin', 'plataforma', 'interno')`);
    }

    if (columnaProductoExiste(columnas, 'vendedor_id')) {
        condiciones.push(`productos.vendedor_id IS NULL`);
    }

    if (columnaProductoExiste(columnas, 'emprendedor_id')) {
        condiciones.push(`productos.emprendedor_id IS NULL`);
    }

    return condiciones.length ? `(${condiciones.join(' AND ')})` : '';
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

function calcularEstadoVisualProducto(producto) {
    const tieneInventarioFisico = !producto.vendedor_id && producto.stock_fisico_disponible !== undefined && producto.stock_fisico_disponible !== null;
    const stockNum = tieneInventarioFisico ? Number(producto.stock_fisico_disponible || 0) : Number(producto.stock || 0);
    const tipo = String(producto.tipo_venta || "stock").toLowerCase().trim();
    const disp = String(producto.disponibilidad || "Disponible").toLowerCase().trim();
    const estadoGuardado = String(producto.estado_visual || "auto").toLowerCase().trim();

    if (estadoGuardado === "oculto") return "oculto";
    if (tipo === "importacion" || tipo === "mixto" || tipo === "bajo_pedido") return "importacion";
    if (estadoGuardado === "importando") return "importando";
    if (disp === "agotado") return "agotado";
    if (stockNum > 0) return "en_stock";
    return "agotado";
}

function tipoEntregaProducto(producto, estadoVisual) {
    const tipo = String(producto.tipo_venta || "stock").toLowerCase().trim();
    if (tipo === "importacion" || tipo === "mixto" || tipo === "bajo_pedido" || estadoVisual === "importacion") return "importacion";
    return "stock";
}

function estadoFacturaSegunPedido(estadoPedido, metodoPago = "") {
    const estado = String(estadoPedido || '').toLowerCase();

    if (estado === 'cancelado') return 'anulada';
    if (estado === 'devolución solicitada' || estado === 'devolucion solicitada') return 'devolucion_solicitada';
    if (estado === 'devuelto') return 'reembolsada';
    if (estado === 'enviado' || estado === 'entregado') return 'pagada';

    // La factura nace pagada si el cliente pagó con tarjeta.
    // Efectivo/transferencia quedan pendientes hasta confirmación o entrega.
    if (metodoPagoEsTarjeta(metodoPago)) return 'pagada';

    return 'pendiente';
}

async function crearFacturaAutomaticaDesdePedido(pedidoId) {
    const existente = await query('SELECT id FROM facturas WHERE pedido_id = ? LIMIT 1', [pedidoId]);
    if (existente.length > 0) return existente[0].id;

    const pedidos = await query(`
        SELECT pedidos.*, COALESCE(usuarios.nombre, pedidos.cliente_nombre, 'Cliente no registrado') AS cliente
        FROM pedidos
        LEFT JOIN usuarios ON usuarios.id = pedidos.usuario_id
        WHERE pedidos.id = ?
        LIMIT 1
    `, [pedidoId]);

    if (pedidos.length === 0) return null;

    const pedido = pedidos[0];
    const detalles = await query(`
        SELECT cantidad, precio_unitario, subtotal
        FROM pedido_detalles
        WHERE pedido_id = ?
    `, [pedidoId]);

    let subtotal = detalles.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
    if (subtotal <= 0) subtotal = Number(pedido.total || 0);

    const totalPedido = Number(pedido.total || 0);
    const envio = Math.max(totalPedido - subtotal, 0);
    const descuento = 0;
    const impuesto = 0;
    const total = Number((subtotal - descuento + envio + impuesto).toFixed(2));
    const estadoFactura = estadoFacturaSegunPedido(pedido.estado, pedido.metodo_pago);

    const insert = await query(`
        INSERT INTO facturas
        (pedido_id, numero_factura, cliente_id, subtotal, descuento, envio, impuesto, total, metodo_pago, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        pedido.id,
        crearNumeroFactura(),
        pedido.usuario_id || null,
        subtotal,
        descuento,
        envio,
        impuesto,
        total,
        pedido.metodo_pago || 'No especificado',
        estadoFactura
    ]);

    return insert.insertId;
}

async function sincronizarFacturaConPedido(pedidoId, estadoPedido) {
    await crearFacturaAutomaticaDesdePedido(pedidoId);

    const pedidos = await query("SELECT metodo_pago FROM pedidos WHERE id = ? LIMIT 1", [pedidoId]);
    const metodoPago = pedidos[0]?.metodo_pago || "";
    const estadoFactura = estadoFacturaSegunPedido(estadoPedido, metodoPago);

    await query(`
        UPDATE facturas
        SET estado = ?
        WHERE pedido_id = ?
    `, [estadoFactura, pedidoId]);

    return estadoFactura;
}


function generarNumeroCasoDevolucion(id, fecha = new Date()) {
    const anio = fecha.getFullYear();
    const correlativo = String(id).padStart(6, "0");
    return `DEV-${anio}-${correlativo}`;
}

function dividirCodigosProducto(codigoProducto, cantidad = 1, pedidoCodigo = "", productoId = "") {
    const codigos = String(codigoProducto || "")
        .split(",")
        .map(codigo => codigo.trim())
        .filter(Boolean);

    if (codigos.length > 0) return codigos;

    // Para pedidos de importación/bajo pedido que aún no tienen unidad física asignada.
    // Se crea un código temporal para que el caso aparezca en Postventa/Devoluciones.
    // Más adelante, cuando llegue el producto, se podrá reemplazar por el código físico real.
    const total = Math.max(Number(cantidad || 1), 1);
    const base = String(pedidoCodigo || "PEDIDO").replace(/[^a-zA-Z0-9-]/g, "");
    return Array.from({ length: total }, (_, index) => `${base}-IMP-${productoId}-${index + 1}`);
}

// GET — pedidos con paginación, búsqueda y filtros
router.get("/", verificarToken, soloPanel, async (req, res) => {
    const pagina = Math.max(parseInt(req.query.page) || 1, 1);
    const limite = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = (pagina - 1) * limite;

    const search = (req.query.search || "").trim();
    const estado = (req.query.estado || "").trim();
    const metodo_pago = (req.query.metodo_pago || "").trim();
    const fecha = (req.query.fecha || "").trim();
    const scope = String(req.query.scope || "").toLowerCase().trim();

    try {
        const columnasProductos = await obtenerColumnasProductos();
        const nombreTiendaSql = expresionNombreTiendaProducto(columnasProductos);
        const tipoPropietarioSql = expresionTipoPropietarioProducto(columnasProductos);
        const condicionMiTienda = scope === "mi_tienda" ? condicionProductosMiTienda(columnasProductos) : "";

        const condiciones = [];
        const valores = [];

        if (search) {
            condiciones.push(`(
                pedidos.id LIKE ?
                OR pedidos.codigo_pedido LIKE ?
                OR usuarios.nombre LIKE ?
                OR pedidos.telefono LIKE ?
                OR pedidos.direccion_envio LIKE ?
            )`);

            const valorBusqueda = `%${search}%`;
            valores.push(valorBusqueda, valorBusqueda, valorBusqueda, valorBusqueda, valorBusqueda);
        }

        if (estado) {
            condiciones.push("LOWER(pedidos.estado) = LOWER(?)");
            valores.push(estado);
        }

        if (metodo_pago) {
            condiciones.push("LOWER(pedidos.metodo_pago) = LOWER(?)");
            valores.push(metodo_pago);
        }

        if (fecha) {
            condiciones.push("DATE(pedidos.fecha_pedido) = ?");
            valores.push(fecha);
        }

        if (condicionMiTienda) {
            condiciones.push(`EXISTS (
                SELECT 1
                FROM pedido_detalles pd_scope
                INNER JOIN productos productos ON productos.id = pd_scope.producto_id
                WHERE pd_scope.pedido_id = pedidos.id
                AND ${condicionMiTienda}
            )`);
        }

        const whereSql = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

        const sql = `
            SELECT
                pedidos.id,
                pedidos.codigo_pedido,
                pedidos.usuario_id,
                pedidos.total,
                pedidos.estado,
                pedidos.metodo_pago,
                pedidos.direccion_envio,
                pedidos.telefono,
                pedidos.nota_cliente,
                pedidos.nota_admin,
                pedidos.resumen_pedido,
                pedidos.fecha_pedido,
                pedidos.fecha_envio,
                pedidos.fecha_entregado,
                pedidos.motivo_devolucion,
                pedidos.fecha_devolucion,
                COALESCE(usuarios.nombre, pedidos.cliente_nombre, 'Cliente no registrado') AS cliente,
                GROUP_CONCAT(DISTINCT ${nombreTiendaSql} ORDER BY ${nombreTiendaSql} SEPARATOR ', ') AS tiendas_pedido,
                GROUP_CONCAT(DISTINCT ${tipoPropietarioSql} ORDER BY ${tipoPropietarioSql} SEPARATOR ', ') AS tipos_propietario_pedido,
                CASE
                    WHEN SUM(CASE WHEN productos.tipo_venta IN ('bajo_pedido', 'importacion', 'mixto') THEN 1 ELSE 0 END) > 0
                    THEN 'importacion'
                    ELSE 'stock'
                END AS tipo_pedido
            FROM pedidos
            LEFT JOIN usuarios ON pedidos.usuario_id = usuarios.id
            LEFT JOIN pedido_detalles ON pedido_detalles.pedido_id = pedidos.id
            LEFT JOIN productos ON productos.id = pedido_detalles.producto_id
            ${whereSql}
            GROUP BY pedidos.id
            ORDER BY pedidos.id DESC
            LIMIT ? OFFSET ?
        `;

        const totalSql = `
            SELECT COUNT(DISTINCT pedidos.id) AS total
            FROM pedidos
            LEFT JOIN usuarios ON pedidos.usuario_id = usuarios.id
            ${whereSql}
        `;

        const totalResults = await query(totalSql, valores);
        const total = totalResults[0]?.total || 0;
        const results = await query(sql, [...valores, limite, offset]);

        res.json({
            pedidos: results,
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite) || 1
        });
    } catch (error) {
        console.error("Error al obtener pedidos:", error);
        res.status(500).json({ mensaje: "Error al obtener pedidos" });
    }
});




// GET — pedidos del cliente autenticado en la tienda pública
router.get("/mis-pedidos", verificarToken, async (req, res) => {
    const rol = String(req.usuario?.rol || "").toLowerCase();
    if (req.usuario?.portal !== "tienda" || rol !== "cliente") {
        return res.status(403).json({ mensaje: "Acceso no autorizado" });
    }

    try {
        const pedidos = await query(`
            SELECT
                p.id, p.codigo_pedido, p.total, p.estado, p.metodo_pago,
                p.direccion_envio, p.telefono, p.nota_cliente,
                p.fecha_pedido, p.fecha_envio, p.fecha_entregado,
                f.id AS factura_id, f.numero_factura, f.estado AS factura_estado
            FROM pedidos p
            LEFT JOIN facturas f ON f.pedido_id = p.id
            WHERE p.usuario_id = ?
            ORDER BY p.id DESC
        `, [req.usuario.id]);
        res.json({ pedidos });
    } catch (error) {
        console.error("Error al obtener pedidos del cliente:", error);
        res.status(500).json({ mensaje: "Error al obtener tus pedidos" });
    }
});

// GET — detalle de un pedido perteneciente al cliente autenticado
router.get("/mis-pedidos/:id/detalles", verificarToken, async (req, res) => {
    const rol = String(req.usuario?.rol || "").toLowerCase();
    if (req.usuario?.portal !== "tienda" || rol !== "cliente") {
        return res.status(403).json({ mensaje: "Acceso no autorizado" });
    }

    try {
        const pedidos = await query(`
            SELECT
                p.id, p.codigo_pedido, p.total, p.estado, p.metodo_pago,
                p.direccion_envio, p.telefono, p.nota_cliente,
                p.fecha_pedido, p.fecha_envio, p.fecha_entregado,
                f.id AS factura_id, f.numero_factura, f.estado AS factura_estado
            FROM pedidos p
            LEFT JOIN facturas f ON f.pedido_id = p.id
            WHERE p.id = ? AND p.usuario_id = ?
            LIMIT 1
        `, [req.params.id, req.usuario.id]);

        if (!pedidos.length) return res.status(404).json({ mensaje: "Pedido no encontrado" });

        const detalles = await query(`
            SELECT id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal
            FROM pedido_detalles
            WHERE pedido_id = ?
            ORDER BY id ASC
        `, [req.params.id]);

        res.json({ pedido: pedidos[0], detalles });
    } catch (error) {
        console.error("Error al obtener detalle del pedido del cliente:", error);
        res.status(500).json({ mensaje: "Error al obtener el detalle del pedido" });
    }
});

// GET — detalles de un pedido para seleccionar productos en devolución
router.get("/:id/detalles", verificarToken, soloPanel, async (req, res) => {
    const { id } = req.params;

    try {
        const pedidos = await query(`
            SELECT id, codigo_pedido, estado, fecha_entregado
            FROM pedidos
            WHERE id = ?
            LIMIT 1
        `, [id]);

        if (pedidos.length === 0) {
            return res.status(404).json({ mensaje: "Pedido no encontrado" });
        }

        const pedido = pedidos[0];

        const columnasProductos = await obtenerColumnasProductos();
        const nombreTiendaSql = expresionNombreTiendaProducto(columnasProductos).replaceAll('productos.', 'p.');
        const tipoPropietarioSql = expresionTipoPropietarioProducto(columnasProductos).replaceAll('productos.', 'p.');

        const detalles = await query(`
            SELECT
                pd.id AS pedido_detalle_id,
                pd.producto_id,
                pd.nombre_producto,
                pd.cantidad,
                pd.precio_unitario,
                pd.subtotal,
                pd.codigo_producto,
                p.tipo_venta,
                p.tiempo_entrega,
                ${nombreTiendaSql} AS tienda,
                ${tipoPropietarioSql} AS tipo_propietario
            FROM pedido_detalles pd
            LEFT JOIN productos p ON p.id = pd.producto_id
            WHERE pd.pedido_id = ?
            ORDER BY tienda ASC, pd.id ASC
        `, [id]);

        const detallesNormalizados = detalles.map(detalle => {
            const codigos = dividirCodigosProducto(
                detalle.codigo_producto,
                detalle.cantidad,
                pedido.codigo_pedido,
                detalle.producto_id
            );

            return {
                ...detalle,
                codigos_producto: codigos
            };
        });

        res.json({ pedido, detalles: detallesNormalizados });
    } catch (error) {
        console.error("Error al obtener detalles del pedido:", error);
        res.status(500).json({ mensaje: "Error al obtener detalles del pedido" });
    }
});

// POST — crear pedido desde la tienda/simulador
// Esta ruta es pública porque representa al cliente comprando desde la página de compras.
router.post("/simulacion", verificarToken, async (req, res) => {
    const rolCompra = String(req.usuario?.rol || "").toLowerCase();
    if (req.usuario?.portal !== "tienda" || rolCompra !== "cliente") {
        return res.status(403).json({ mensaje: "Debes iniciar sesión con una cuenta de cliente para comprar" });
    }
    const {
        cliente_nombre,
        cliente_email,
        telefono,
        direccion_envio,
        metodo_pago,
        nota_cliente,
        productos
    } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ mensaje: "El carrito está vacío" });
    }

    if (!cliente_nombre || !telefono || !direccion_envio) {
        return res.status(400).json({ mensaje: "Nombre, teléfono y dirección son obligatorios" });
    }


    try {
        const usuariosPedido = await query("SELECT id, nombre, email, rol FROM usuarios WHERE id = ? LIMIT 1", [req.usuario.id]);
        if (!usuariosPedido.length) {
            return res.status(401).json({ mensaje: "La cuenta ya no está disponible" });
        }
        const usuarioCompra = usuariosPedido[0];
        const nombreCompra = usuarioCompra.nombre || cliente_nombre;
        const emailCompra = usuarioCompra.email || cliente_email || null;

        const ids = productos.map(item => Number(item.producto_id || item.id)).filter(Boolean);

        if (ids.length === 0) {
            return res.status(400).json({ mensaje: "No hay productos válidos" });
        }

        const placeholders = ids.map(() => "?").join(",");
        const productosDB = await query(
            `SELECT
                productos.id,
                productos.nombre,
                productos.precio,
                productos.descuento,
                productos.stock,
                COALESCE(inv.stock_fisico_disponible, 0) AS stock_fisico_disponible,
                productos.tipo_venta,
                productos.estado_visual,
                productos.disponibilidad,
                productos.permite_bajo_pedido,
                productos.tiempo_entrega,
                productos.publicado,
                productos.vendedor_id
             FROM productos
             LEFT JOIN (
                SELECT producto_id, COUNT(*) AS stock_fisico_disponible
                FROM inventario_fisico
                WHERE estado = 'disponible' AND COALESCE(publicado, 0) = 1
                GROUP BY producto_id
             ) inv ON inv.producto_id = productos.id
             WHERE productos.id IN (${placeholders})`,
            ids
        );

        const mapaProductos = new Map(productosDB.map(producto => [Number(producto.id), producto]));
        const detalles = [];
        let subtotal = 0;

        for (const item of productos) {
            const productoId = Number(item.producto_id || item.id);
            const cantidad = Math.max(Number(item.cantidad || 1), 1);
            const productoDB = mapaProductos.get(productoId);

            if (!productoDB) {
                return res.status(404).json({ mensaje: `Producto no encontrado: ${productoId}` });
            }

            let presentacionId = Number(item.presentacion_id || 0) || null;
            let varianteId = Number(item.variante_id || 0) || null;
            let presentacionNombre = null;
            let varianteDetalle = null;

            let variantePrecio = null;
            let varianteDisponible = null;
            if (productoDB.vendedor_id && !varianteId) {
                const def = await query(`SELECT pv.id FROM producto_variantes pv WHERE pv.producto_id=? AND pv.activo=1 ORDER BY pv.orden,pv.id LIMIT 1`, [productoId]);
                if (def.length) varianteId = Number(def[0].id);
            }
            if (varianteId) {
                const vr = await query(`
                    SELECT pv.id, pv.presentacion_id, pv.precio, pv.stock, pp.nombre AS presentacion_nombre,
                           COALESCE(ic.disponible,pv.stock,0) AS disponible,
                           (SELECT GROUP_CONCAT(CONCAT(pvd.dimension_codigo, ': ', pvd.valor_texto) ORDER BY pvd.id SEPARATOR ' · ')
                            FROM producto_variante_dimensiones pvd WHERE pvd.variante_id=pv.id) AS variante_detalle
                    FROM producto_variantes pv
                    LEFT JOIN producto_presentaciones pp ON pp.id=pv.presentacion_id
                    LEFT JOIN inventario_cantidades ic ON ic.variante_id=pv.id
                    WHERE pv.id=? AND pv.producto_id=? AND pv.activo=1 LIMIT 1
                `, [varianteId, productoId]);
                if (vr.length) {
                    presentacionId = Number(vr[0].presentacion_id || presentacionId) || null;
                    presentacionNombre = vr[0].presentacion_nombre || null;
                    varianteDetalle = vr[0].variante_detalle || null;
                    variantePrecio = Number(vr[0].precio || 0);
                    varianteDisponible = Number(vr[0].disponible || 0);
                } else {
                    varianteId = null;
                }
            }
            if (presentacionId && !presentacionNombre) {
                const pr = await query(`SELECT id,nombre FROM producto_presentaciones WHERE id=? AND producto_id=? LIMIT 1`, [presentacionId, productoId]);
                if (pr.length) presentacionNombre = pr[0].nombre || null;
                else presentacionId = null;
            }

            const estadoVisualCompra = calcularEstadoVisualProducto(productoDB);
            const tipoEntrega = tipoEntregaProducto(productoDB, estadoVisualCompra);

            if (Number(productoDB.publicado) === 0 || estadoVisualCompra === "oculto") {
                return res.status(400).json({ mensaje: `El producto no está publicado: ${productoDB.nombre}` });
            }

            if (estadoVisualCompra === "agotado") {
                return res.status(400).json({ mensaje: `Producto agotado: ${productoDB.nombre}` });
            }

            // Productos de vendedores: inventario por cantidades y por variante.
            // Productos internos/legacy: conservan el inventario físico existente.
            if (estadoVisualCompra === "en_stock") {
                if (productoDB.vendedor_id) {
                    if (!varianteId) return res.status(400).json({ mensaje:`Selecciona una variante disponible de: ${productoDB.nombre}` });
                    if (cantidad > Number(varianteDisponible || 0)) return res.status(400).json({ mensaje:`Stock insuficiente para la variante seleccionada de: ${productoDB.nombre}` });
                } else if (cantidad > Number(productoDB.stock_fisico_disponible || 0)) {
                    return res.status(400).json({ mensaje: `Stock físico insuficiente para: ${productoDB.nombre}` });
                }
            }

            const precio = variantePrecio != null && variantePrecio > 0 ? variantePrecio : Number(productoDB.precio || 0);
            const descuento = Number(productoDB.descuento || 0);
            const precioFinal = precio - (precio * descuento / 100);
            const subtotalProducto = precioFinal * cantidad;

            subtotal += subtotalProducto;

            detalles.push({
                producto_id: productoDB.id,
                nombre_producto: productoDB.nombre,
                cantidad,
                precio_unitario: precioFinal,
                subtotal: subtotalProducto,
                estado_visual: estadoVisualCompra,
                tipo_venta: productoDB.tipo_venta,
                tipo_entrega: tipoEntrega,
                tiempo_entrega: productoDB.tiempo_entrega || null,
                codigos_producto: [],
                presentacion_id: presentacionId,
                variante_id: varianteId,
                presentacion_nombre: presentacionNombre,
                variante_detalle: varianteDetalle,
                vendedor_id: productoDB.vendedor_id || null
            });
        }

        const envioLocal = detalles.length > 0 ? 5 : 0;
        const total = subtotal + envioLocal;
        const codigoPedido = `PED-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;

        const resumenPedido = [
            `Código pedido: ${codigoPedido}`,
            `Cliente: ${nombreCompra}`,
            `Teléfono: ${telefono}`,
            `Correo: ${emailCompra || "Sin correo"}`,
            `Dirección: ${direccion_envio}`,
            `Método de pago: ${metodo_pago || "No especificado"}`,
            `Nota cliente: ${nota_cliente || "Sin nota"}`,
            "",
            "Productos:",
            ...detalles.map(item => `- ${item.nombre_producto} x${item.cantidad} | $${item.subtotal.toFixed(2)} | ${item.tipo_entrega} | ${item.estado_visual}${item.tiempo_entrega ? ' | Entrega estimada: ' + item.tiempo_entrega : ''}`),
            "",
            `Subtotal: $${subtotal.toFixed(2)}`,
            `Envío local: $${envioLocal.toFixed(2)}`,
            `Total: $${total.toFixed(2)}`
        ].join("\n");

        const pedidoResult = await query(
            `INSERT INTO pedidos
             (usuario_id, codigo_pedido, cliente_nombre, cliente_email, total, estado, metodo_pago, direccion_envio, telefono, nota_cliente, resumen_pedido)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuarioCompra.id,
                codigoPedido,
                nombreCompra,
                emailCompra,
                total,
                "Pendiente",
                metodo_pago || "No especificado",
                direccion_envio,
                telefono,
                nota_cliente || null,
                resumenPedido
            ]
        );

        const pedidoId = pedidoResult.insertId;

        for (const item of detalles) {
            if (item.estado_visual === "en_stock" && item.tipo_entrega === "stock") {
                if (item.vendedor_id) {
                    const moved = await query(`UPDATE inventario_cantidades
                        SET disponible=disponible-?, reservado=reservado+?, fecha_actualizacion=NOW()
                        WHERE variante_id=? AND disponible>=?`, [item.cantidad,item.cantidad,item.variante_id,item.cantidad]);
                    if (!moved.affectedRows) return res.status(409).json({ mensaje:`El stock cambió mientras realizabas la compra. Revisa la variante de ${item.nombre_producto}.` });
                    await query(`UPDATE producto_variantes pv JOIN inventario_cantidades ic ON ic.variante_id=pv.id SET pv.stock=ic.disponible WHERE pv.id=?`, [item.variante_id]);
                    await sincronizarStockProductoCantidad(item.producto_id);
                } else {
                    const unidades = await query(
                        `SELECT id, codigo_producto
                         FROM inventario_fisico
                         WHERE producto_id = ? AND estado = 'disponible' AND COALESCE(publicado, 0) = 1
                         ORDER BY id ASC
                         LIMIT ?`, [item.producto_id, item.cantidad]);
                    if (unidades.length < item.cantidad) return res.status(400).json({ mensaje:`Stock físico insuficiente para: ${item.nombre_producto}` });
                    item.codigos_producto = unidades.map(unidad => unidad.codigo_producto);
                    const idsUnidades = unidades.map(unidad => unidad.id);
                    const placeholdersUnidades = idsUnidades.map(() => "?").join(",");
                    await query(`UPDATE inventario_fisico SET estado='vendido',pedido_id=?,fecha_venta=NOW() WHERE id IN (${placeholdersUnidades})`, [pedidoId,...idsUnidades]);
                    await query(`UPDATE productos SET stock=(SELECT COUNT(*) FROM inventario_fisico WHERE producto_id=? AND estado='disponible') WHERE id=?`, [item.producto_id,item.producto_id]);
                }
            }

            const columnasDetalle = await obtenerColumnasPedidoDetalles();
            const guardaVariante = columnasDetalle.has('presentacion_id') && columnasDetalle.has('variante_id')
                && columnasDetalle.has('presentacion_nombre') && columnasDetalle.has('variante_detalle');
            if (guardaVariante) {
                await query(
                    `INSERT INTO pedido_detalles
                     (pedido_id, producto_id, presentacion_id, variante_id, nombre_producto, presentacion_nombre, variante_detalle, cantidad, precio_unitario, subtotal, codigo_producto)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [pedidoId,item.producto_id,item.presentacion_id,item.variante_id,item.nombre_producto,item.presentacion_nombre,item.variante_detalle,
                     item.cantidad,item.precio_unitario,item.subtotal,item.codigos_producto.length ? item.codigos_producto.join(", ") : null]
                );
            } else {
                await query(
                    `INSERT INTO pedido_detalles
                     (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal, codigo_producto)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [pedidoId,item.producto_id,item.nombre_producto,item.cantidad,item.precio_unitario,item.subtotal,
                     item.codigos_producto.length ? item.codigos_producto.join(", ") : null]
                );
            }
        }

        const facturaId = await crearFacturaAutomaticaDesdePedido(pedidoId);

        res.status(201).json({
            mensaje: "Pedido generado correctamente",
            pedido_id: pedidoId,
            codigo_pedido: codigoPedido,
            factura_id: facturaId,
            total,
            resumen_pedido: resumenPedido
        });
    } catch (error) {
        console.error("Error al crear pedido desde simulación:", error);
        res.status(500).json({ mensaje: "Error al crear pedido" });
    }
});

// PUT — actualizar estado del pedido (solo admin)
router.put("/:id/estado", verificarToken, soloPanel, async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = [
        "Pendiente",
        "Confirmado",
        "Pedido al proveedor",
        "Importando",
        "Preparando",
        "Procesando",
        "Enviado",
        "Entregado",
        "Devolución solicitada",
        "Devuelto",
        "Cancelado"
    ];

    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ mensaje: "Estado no válido" });
    }

    try {
        const anteriorRows = await query("SELECT estado FROM pedidos WHERE id=? LIMIT 1", [id]);
        if (!anteriorRows.length) return res.status(404).json({ mensaje:"Pedido no encontrado" });
        const estadoAnterior = anteriorRows[0].estado;
        let sql = "UPDATE pedidos SET estado = ? WHERE id = ?";
        let valores = [estado, id];

        if (estado === "Enviado") {
            sql = "UPDATE pedidos SET estado = ?, fecha_envio = COALESCE(fecha_envio, NOW()) WHERE id = ?";
        }

        if (estado === "Entregado") {
            sql = "UPDATE pedidos SET estado = ?, fecha_entregado = COALESCE(fecha_entregado, NOW()) WHERE id = ?";
        }

        if (estado === "Devolución solicitada" || estado === "Devuelto") {
            sql = "UPDATE pedidos SET estado = ?, fecha_devolucion = COALESCE(fecha_devolucion, NOW()) WHERE id = ?";
        }

        await query(sql, valores);
        await moverInventarioCantidadPorEstado(id, estadoAnterior, estado);
        const estadoFactura = await sincronizarFacturaConPedido(id, estado);

        res.json({
            mensaje: "Estado actualizado correctamente",
            estado_pedido: estado,
            estado_factura: estadoFactura
        });
    } catch (error) {
        console.error("Error al actualizar estado del pedido:", error);
        res.status(500).json({ mensaje: "Error al actualizar estado" });
    }
});

// PUT — registrar devolución del pedido
router.put("/:id/devolucion", verificarToken, soloPanel, async (req, res) => {
    const { id } = req.params;
    const { motivo_devolucion, observaciones, productos_devueltos } = req.body;

    const motivo = String(motivo_devolucion || "").trim();
    const notas = String(observaciones || "").trim() || null;

    if (!motivo) {
        return res.status(400).json({ mensaje: "El motivo de devolución es obligatorio" });
    }

    try {
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

        const pedidos = await query(`
            SELECT id, codigo_pedido, estado, fecha_entregado
            FROM pedidos
            WHERE id = ?
            LIMIT 1
        `, [id]);

        if (pedidos.length === 0) {
            return res.status(404).json({ mensaje: "Pedido no encontrado" });
        }

        const pedido = pedidos[0];
        if (pedido.estado !== "Entregado") {
            return res.status(400).json({ mensaje: "Solo se puede solicitar devolución cuando el pedido está entregado" });
        }

        if (!pedido.fecha_entregado) {
            return res.status(400).json({ mensaje: "El pedido no tiene fecha de entrega registrada" });
        }

        const dias = Math.floor((Date.now() - new Date(pedido.fecha_entregado).getTime()) / (1000 * 60 * 60 * 24));
        if (dias > 15) {
            return res.status(400).json({ mensaje: "El plazo de devolución de 15 días ya venció" });
        }

        // IMPORTANTE:
        // productos_devueltos debe traer SOLO los productos/unidades que el cliente quiere devolver.
        // Ejemplo:
        // [{ pedido_detalle_id: 2, codigos_producto: ["413554211"] }]
        // o [{ producto_id: 1, codigos_producto: ["413554211"] }]
        if (!Array.isArray(productos_devueltos) || productos_devueltos.length === 0) {
            return res.status(400).json({
                mensaje: "Selecciona al menos un producto del pedido para devolver. No se creará devolución de todo el pedido automáticamente."
            });
        }

        const detallesPedido = await query(`
            SELECT id, producto_id, nombre_producto, cantidad, codigo_producto
            FROM pedido_detalles
            WHERE pedido_id = ?
        `, [id]);

        if (detallesPedido.length === 0) {
            return res.status(400).json({ mensaje: "Este pedido no tiene productos para devolver" });
        }

        const detallesSeleccionados = [];

        for (const item of productos_devueltos) {
            const pedidoDetalleId = Number(item.pedido_detalle_id || item.detalle_id || 0);
            const productoId = Number(item.producto_id || 0);
            const detalle = detallesPedido.find(d =>
                (pedidoDetalleId && Number(d.id) === pedidoDetalleId) ||
                (productoId && Number(d.producto_id) === productoId)
            );

            if (!detalle) continue;

            let codigos = [];
            if (Array.isArray(item.codigos_producto)) {
                codigos = item.codigos_producto.map(c => String(c || "").trim()).filter(Boolean);
            } else if (item.codigo_producto) {
                codigos = [String(item.codigo_producto).trim()].filter(Boolean);
            } else if (detalle.codigo_producto) {
                codigos = String(detalle.codigo_producto).split(",").map(c => c.trim()).filter(Boolean);
            }

            // Para importación sin unidad física asignada, se crea un código temporal por detalle.
            if (codigos.length === 0) {
                codigos = [`${String(pedido.codigo_pedido || `PED-${id}`).replace(/[^a-zA-Z0-9-]/g, "")}-IMP-${detalle.producto_id}-${detalle.id}`];
            }

            for (const codigo of codigos) {
                detallesSeleccionados.push({
                    pedido_detalle_id: detalle.id,
                    producto_id: detalle.producto_id,
                    nombre_producto: detalle.nombre_producto,
                    codigo_producto: codigo,
                    motivo: String(item.motivo || motivo).trim()
                });
            }
        }

        if (detallesSeleccionados.length === 0) {
            return res.status(400).json({ mensaje: "No se encontraron productos válidos para devolver en este pedido" });
        }

        const existentes = [];
        for (const detalle of detallesSeleccionados) {
            const activa = await query(`
                SELECT d.numero_caso_cliente, d.id
                FROM devolucion_detalles dd
                INNER JOIN devoluciones d ON d.id = dd.devolucion_id
                WHERE dd.codigo_producto = ? AND d.estado NOT IN ('rechazada', 'finalizada')
                LIMIT 1
            `, [detalle.codigo_producto]);

            if (activa.length > 0) existentes.push(activa[0].numero_caso_cliente || `#${activa[0].id}`);
        }

        if (existentes.length > 0) {
            return res.status(400).json({ mensaje: `Ya existe devolución activa para: ${existentes.join(", ")}` });
        }

        const primera = detallesSeleccionados[0];
        const insert = await query(`
            INSERT INTO devoluciones
            (pedido_id, producto_id, codigo_producto, motivo, estado, resolucion, observaciones, fecha_recepcion)
            VALUES (?, ?, ?, ?, 'recibida', 'sin_resolver', ?, NOW())
        `, [id, primera.producto_id, primera.codigo_producto, motivo, notas]);

        const numeroCaso = generarNumeroCasoDevolucion(insert.insertId);
        await query("UPDATE devoluciones SET numero_caso_cliente = ? WHERE id = ?", [numeroCaso, insert.insertId]);

        for (const detalle of detallesSeleccionados) {
            const unidad = await query("SELECT * FROM inventario_fisico WHERE codigo_producto = ? LIMIT 1", [detalle.codigo_producto]);
            const inv = unidad[0] || {};

            await query(`
                INSERT INTO devolucion_detalles
                (devolucion_id, pedido_detalle_id, pedido_id, producto_id, nombre_producto, codigo_producto, motivo,
                 estado_revision, resolucion, observaciones, proveedor, proveedor_url, numero_orden, precio_compra, fecha_compra, garantia_hasta)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'recibida', 'sin_resolver', ?, ?, ?, ?, ?, ?, ?)
            `, [
                insert.insertId,
                detalle.pedido_detalle_id,
                id,
                detalle.producto_id,
                detalle.nombre_producto,
                detalle.codigo_producto,
                detalle.motivo,
                notas,
                inv.proveedor || null,
                inv.proveedor_url || null,
                inv.numero_orden || null,
                inv.precio_compra || 0,
                inv.fecha_compra || null,
                inv.garantia_hasta || null
            ]);

            await query(`
                UPDATE inventario_fisico
                SET estado = 'en_revision'
                WHERE codigo_producto = ?
            `, [detalle.codigo_producto]);
        }

        await query(
            `UPDATE pedidos
             SET estado = ?, motivo_devolucion = ?, fecha_devolucion = COALESCE(fecha_devolucion, NOW())
             WHERE id = ?`,
            ["Devolución solicitada", motivo, id]
        );

        await sincronizarFacturaConPedido(id, "Devolución solicitada");

        res.json({
            mensaje: "Devolución creada correctamente en Postventa",
            numero_caso: numeroCaso,
            devolucion_id: insert.insertId,
            productos_devueltos: detallesSeleccionados.length
        });
    } catch (error) {
        console.error("Error al registrar devolución:", error);
        res.status(500).json({ mensaje: "Error al registrar devolución" });
    }
});

// PUT — guardar nota interna del administrador/empleado
router.put("/:id/nota-admin", verificarToken, soloPanel, (req, res) => {
    const { id } = req.params;
    const { nota_admin } = req.body;

    db.query(
        "UPDATE pedidos SET nota_admin = ? WHERE id = ?",
        [nota_admin || null, id],
        (error) => {
            if (error) {
                return res.status(500).json({ mensaje: "Error al guardar nota interna" });
            }

            res.json({ mensaje: "Nota interna guardada correctamente" });
        }
    );
});

module.exports = router;
