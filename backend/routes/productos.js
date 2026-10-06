const express = require("express");
const router  = express.Router();
const db      = require("../db");
const fs      = require("fs");
const path    = require("path");
const crypto  = require("crypto");
const multer  = require("multer");
const { verificarToken, soloAdmin } = require("../middleware/auth.middleware");

const PRODUCT_UPLOAD_DIR = path.join(__dirname, "..", "uploads", "productos");
fs.mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });
const uploadSellerProducts = multer({
    dest: PRODUCT_UPLOAD_DIR,
    limits: { fileSize: 8 * 1024 * 1024, files: 60 },
    fileFilter: (_req, file, cb) => cb(null, /^image\//i.test(file.mimetype || ""))
});

function q(conn, sql, params = []) {
    return new Promise((resolve, reject) => conn.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
}

function getConnection() {
    return new Promise((resolve, reject) => db.getConnection((err, conn) => err ? reject(err) : resolve(conn)));
}

function begin(conn) { return new Promise((resolve, reject) => conn.beginTransaction(err => err ? reject(err) : resolve())); }
function commit(conn) { return new Promise((resolve, reject) => conn.commit(err => err ? reject(err) : resolve())); }
function rollback(conn) { return new Promise(resolve => conn.rollback(() => resolve())); }

async function sincronizarInventarioCantidadProducto(conn, productoId, vendedorId) {
    try {
        await q(conn, `INSERT INTO inventario_cantidades
            (vendedor_id,producto_id,presentacion_id,variante_id,disponible,reservado,vendido,stock_minimo,fecha_actualizacion)
            SELECT ?,pv.producto_id,pv.presentacion_id,pv.id,GREATEST(COALESCE(pv.stock,0),0),0,0,0,NOW()
            FROM producto_variantes pv
            WHERE pv.producto_id=? AND pv.activo=1
            ON DUPLICATE KEY UPDATE
              vendedor_id=VALUES(vendedor_id),producto_id=VALUES(producto_id),presentacion_id=VALUES(presentacion_id),fecha_actualizacion=NOW()`,
            [vendedorId, productoId]);
    } catch (error) {
        // La migración Fase 70 se ejecuta por separado. No bloqueamos crear/editar productos si aún no se aplicó.
        if (error && (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146)) return;
        throw error;
    }
}

async function recalcularStockProductoDesdeVariantes(conn, productoId) {
    const rows = await q(conn, `SELECT COALESCE(SUM(stock),0) stock FROM producto_variantes WHERE producto_id=? AND activo=1`, [productoId]);
    const stock = Number(rows[0]?.stock || 0);
    await q(conn, `UPDATE productos SET stock=?, disponibilidad=?, fecha_actualizacion=NOW() WHERE id=?`, [stock, stock > 0 ? 'Disponible' : 'Agotado', productoId]);
    return stock;
}

function sellerOnly(req, res, next) {
    const rol = String(req.usuario?.rol || "").toLowerCase().trim();
    if (req.usuario?.portal !== "tienda" || rol !== "vendedor") {
        return res.status(403).json({ mensaje: "Acceso exclusivo para vendedores" });
    }
    next();
}

function safeFileExt(file) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    return /^[.][a-z0-9]{2,5}$/.test(ext) ? ext : ".jpg";
}

function normalizeAudience(value) {
    const v = String(value || "general").toLowerCase();
    return ["hombre","mujer","nino","nina","unisex","general"].includes(v) ? v : "general";
}


function permitirAdminEmpleado(req, res, next) {
    const rol = String(
        req.usuario?.rol ||
        req.user?.rol ||
        req.usuario?.role ||
        req.user?.role ||
        req.rol ||
        req.role ||
        ""
    ).toLowerCase().trim();

    if (req.usuario?.portal === "panel" && ["admin", "administrador", "empleado"].includes(rol)) {
        return next();
    }

    return res.status(403).json({ mensaje: "Acceso denegado: se requiere rol admin o empleado" });
}

function calcularEstadoVisual({ stock, stock_fisico_disponible, tipo_venta, disponibilidad, permite_bajo_pedido, estado_visual, publicado }) {
    // Prioridad: inventario físico real. Si no viene ese dato, usamos stock como respaldo.
    const tieneInventarioFisico = stock_fisico_disponible !== undefined && stock_fisico_disponible !== null;
    const stockNum = tieneInventarioFisico ? Number(stock_fisico_disponible || 0) : Number(stock || 0);
    const tipo = (tipo_venta || "stock").toString().toLowerCase();
    const disp = (disponibilidad || "Disponible").toString().toLowerCase();
    const estado = (estado_visual || "auto").toString().toLowerCase();
    const permite = Number(permite_bajo_pedido || 0) === 1;

    if (estado === "bloqueado") return "bloqueado";
    if (estado === "en_revision" || estado === "en revisión") return "en_revision";
    if (Number(publicado) === 0) return "oculto";
    if (estado === "importando") return "importando";
    if (estado === "oculto") return "oculto";
    if (stockNum > 0 && disp !== "agotado") return "en_stock";
    if (tipo === "bajo_pedido" || tipo === "importacion" || permite) return "bajo_pedido";
    return "agotado";
}

// GET productos con paginación y búsqueda
router.get("/", verificarToken, (req, res) => {
    const pagina = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limit) || 20;
    const busqueda = req.query.search || "";
    const marca = req.query.marca || "";
    const tipoVenta = req.query.tipo_venta || "";

    const offset = (pagina - 1) * limite;
    const searchValue = `%${busqueda}%`;
    const marcaValue = `%${marca}%`;

    const filtros = [
        `(productos.nombre LIKE ? OR productos.marca LIKE ? OR productos.modelo LIKE ? OR productos.sku LIKE ? OR productos.codigo_barras LIKE ? OR productos.categoria LIKE ?)`
    ];
    const valores = [searchValue, searchValue, searchValue, searchValue, searchValue, searchValue];

    if (marca) {
        filtros.push(`productos.marca LIKE ?`);
        valores.push(marcaValue);
    }

    if (tipoVenta) {
        filtros.push(`tipo_venta = ?`);
        valores.push(tipoVenta);
    }

    const whereSql = filtros.join(" AND ");

    const sql = `
        SELECT
            productos.*,
            COALESCE(inv.stock_total_fisico, 0) AS stock_total_fisico,
            COALESCE(inv.stock_fisico_disponible, 0) AS stock_fisico_disponible
        FROM productos
        LEFT JOIN (
            SELECT
                producto_id,
                COUNT(*) AS stock_total_fisico,
                SUM(CASE WHEN estado = 'disponible' AND COALESCE(publicado, 0) = 1 THEN 1 ELSE 0 END) AS stock_fisico_disponible
            FROM inventario_fisico
            GROUP BY producto_id
        ) inv ON inv.producto_id = productos.id
        WHERE ${whereSql}
        ORDER BY productos.id DESC
        LIMIT ? OFFSET ?
    `;

    const totalSql = `
        SELECT COUNT(*) AS total
        FROM productos
        WHERE ${whereSql}
    `;

    db.query(
        totalSql,
        valores,
        (errorTotal, totalResult) => {
            if (errorTotal) {
                console.error(errorTotal);
                return res.status(500).json({ mensaje: "Error al contar productos" });
            }

            const total = totalResult[0].total;

            db.query(
                sql,
                [...valores, limite, offset],
                (error, resultados) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).json({ mensaje: "Error al obtener productos" });
                    }

                    const productosConEstado = resultados.map((producto) => ({
                        ...producto,
                        estado_visual: calcularEstadoVisual(producto)
                    }));

                    res.json({
                        productos: productosConEstado,
                        total,
                        pagina,
                        totalPaginas: Math.ceil(total / limite)
                    });
                }
            );
        }
    );
});



// GET público — catálogo navegable con búsqueda, filtros, orden y paginación
router.get("/publicos", (req, res) => {
    const busqueda = String(req.query.search || "").trim();
    const categoria = String(req.query.categoria || "").trim();
    const categoriaId = Number(req.query.categoria_id || 0);
    const marca = String(req.query.marca || "").trim();
    const vendedor = Number(req.query.vendedor || 0);
    const precioMin = Number(req.query.precio_min || 0);
    const precioMax = Number(req.query.precio_max || 0);
    const ofertas = String(req.query.ofertas || "") === "1";
    const orden = String(req.query.orden || "recientes");
    const pagina = Math.max(1, Number(req.query.page || 1));
    const limite = Math.min(48, Math.max(6, Number(req.query.limit || 18)));
    // Permite carga progresiva desde la tienda pública sin alterar la paginación existente.
    const offsetSolicitado = Number(req.query.offset);
    const offset = Number.isFinite(offsetSolicitado) && offsetSolicitado >= 0
        ? Math.floor(offsetSolicitado)
        : (pagina - 1) * limite;

    const filtros = [
        "p.estado = 'activo'",
        "COALESCE(p.publicado, 1) = 1",
        "COALESCE(p.estado_visual, 'auto') NOT IN ('bloqueado','en_revision','en revisión','oculto')"
    ];
    const valores = [];

    if (busqueda) {
        const q = `%${busqueda}%`;
        filtros.push(`(
            p.nombre LIKE ? OR p.marca LIKE ? OR p.modelo LIKE ? OR p.categoria LIKE ? OR p.descripcion LIKE ? OR COALESCE(v.tienda,'') LIKE ?
            OR EXISTS (
                SELECT 1 FROM producto_presentaciones ppb
                WHERE ppb.producto_id=p.id AND ppb.activo=1
                  AND (COALESCE(ppb.nombre,'') LIKE ? OR COALESCE(ppb.codigo,'') LIKE ?)
            )
            OR EXISTS (
                SELECT 1
                FROM producto_variantes pvb
                JOIN producto_variante_dimensiones pvdb ON pvdb.variante_id=pvb.id
                WHERE pvb.producto_id=p.id AND pvb.activo=1
                  AND COALESCE(pvdb.valor_texto,'') LIKE ?
            )
            OR EXISTS (
                SELECT 1
                FROM producto_atributos pab
                LEFT JOIN atributos ab ON ab.id=pab.atributo_id
                LEFT JOIN atributo_opciones aob ON aob.id=pab.opcion_id
                WHERE pab.producto_id=p.id
                  AND (
                    COALESCE(ab.nombre,'') LIKE ? OR COALESCE(pab.valor_texto,'') LIKE ? OR
                    CAST(COALESCE(pab.valor_numero,'') AS CHAR) LIKE ? OR
                    COALESCE(aob.valor,'') LIKE ? OR COALESCE(aob.etiqueta,'') LIKE ?
                  )
            )
        )`);
        valores.push(q,q,q,q,q,q,q,q,q,q,q,q,q,q);
    }
    if (categoriaId) {
        // Una categoría padre debe incluir todos los productos de sus descendientes.
        // Se compara contra la cadena de ancestros del categoria_id guardado en productos.
        filtros.push(`EXISTS (
            SELECT 1
            FROM categories c0
            LEFT JOIN categories c1 ON c1.id = c0.parent_id
            LEFT JOIN categories c2 ON c2.id = c1.parent_id
            LEFT JOIN categories c3 ON c3.id = c2.parent_id
            LEFT JOIN categories c4 ON c4.id = c3.parent_id
            LEFT JOIN categories c5 ON c5.id = c4.parent_id
            LEFT JOIN categories c6 ON c6.id = c5.parent_id
            WHERE c0.id = p.categoria_id
              AND ? IN (c0.id,c1.id,c2.id,c3.id,c4.id,c5.id,c6.id)
        )`);
        valores.push(categoriaId);
    } else if (categoria) {
        // Compatibilidad temporal con enlaces antiguos que todavía envían el nombre.
        filtros.push("p.categoria = ?");
        valores.push(categoria);
    }
    if (marca) { filtros.push("p.marca = ?"); valores.push(marca); }
    if (vendedor) { filtros.push("p.vendedor_id = ?"); valores.push(vendedor); }
    if (precioMin > 0) { filtros.push("(p.precio - (p.precio * COALESCE(p.descuento,0)/100)) >= ?"); valores.push(precioMin); }
    if (precioMax > 0) { filtros.push("(p.precio - (p.precio * COALESCE(p.descuento,0)/100)) <= ?"); valores.push(precioMax); }
    if (ofertas) filtros.push("COALESCE(p.descuento,0) > 0");

    const ordenSql = {
        recientes: "p.id DESC",
        precio_asc: "precio_final ASC, p.id DESC",
        precio_desc: "precio_final DESC, p.id DESC",
        descuento: "p.descuento DESC, p.id DESC",
        vendidos: "vendidos DESC, p.id DESC",
        nombre: "p.nombre ASC"
    }[orden] || "p.id DESC";

    const baseFrom = `
        FROM productos p
        LEFT JOIN vendedores v ON v.id = p.vendedor_id AND v.estado IN ('activo','advertencia')
        LEFT JOIN (
            SELECT producto_id, COUNT(*) AS stock_fisico_disponible
            FROM inventario_fisico
            WHERE estado = 'disponible' AND COALESCE(publicado,0) = 1
            GROUP BY producto_id
        ) inv ON inv.producto_id = p.id
        LEFT JOIN (
            SELECT producto_id, COALESCE(SUM(cantidad),0) AS vendidos
            FROM pedido_detalles
            GROUP BY producto_id
        ) ven ON ven.producto_id = p.id
        WHERE ${filtros.join(" AND ")}
    `;

    const select = `SELECT
        p.id,p.nombre,p.descripcion,p.precio,p.descuento,p.imagen,p.stock,p.fecha_fin_oferta,
        inv.stock_fisico_disponible AS stock_fisico_disponible,
        p.categoria,p.marca,p.modelo,p.condicion,p.color,p.talla,p.disponibilidad,
        p.tiempo_entrega,p.tipo_venta,p.estado_visual,p.permite_bajo_pedido,p.publicado,
        p.vendedor_id,COALESCE(v.tienda,'TiendaPro') AS tienda,
        COALESCE(v.nivel,'') AS vendedor_nivel,COALESCE(ven.vendidos,0) AS vendidos,
        (p.precio - (p.precio * COALESCE(p.descuento,0)/100)) AS precio_final`;

    const countSql = `SELECT COUNT(*) AS total ${baseFrom}`;
    const dataSql = `${select} ${baseFrom} ORDER BY ${ordenSql} LIMIT ? OFFSET ?`;

    db.query(countSql, valores, (errCount, countRows) => {
        if (errCount) {
            console.error('Error al contar productos públicos:', errCount);
            return res.status(500).json({ mensaje: 'Error al obtener el catálogo' });
        }
        db.query(dataSql, [...valores, limite, offset], (error, rows) => {
            if (error) {
                console.error('Error al obtener productos públicos:', error);
                return res.status(500).json({ mensaje: 'Error al obtener productos públicos' });
            }
            const finalizar = async () => {
                const productos = [];
                for (const row of rows) {
                    const p = { ...row, estado_visual: calcularEstadoVisual(row) };
                    if (busqueda) {
                        try {
                            const like = `%${busqueda}%`;
                            const matches = await q(db, `SELECT
                                pp.id AS presentacion_id, pp.nombre AS presentacion_nombre, pp.codigo AS presentacion_codigo,
                                pv.id AS variante_id, pv.precio AS variante_precio, pv.stock AS variante_stock,
                                (SELECT pi.ruta_imagen FROM producto_imagenes pi WHERE pi.presentacion_id=pp.id ORDER BY pi.es_principal DESC,pi.orden,pi.id LIMIT 1) AS variante_imagen,
                                (SELECT pvd2.valor_texto FROM producto_variante_dimensiones pvd2 WHERE pvd2.variante_id=pv.id AND COALESCE(pvd2.valor_texto,'') LIKE ? ORDER BY pvd2.id LIMIT 1) AS dimension_coincidente
                                FROM producto_presentaciones pp
                                LEFT JOIN producto_variantes pv ON pv.presentacion_id=pp.id AND pv.producto_id=pp.producto_id AND pv.activo=1
                                WHERE pp.producto_id=? AND pp.activo=1
                                  AND (
                                    COALESCE(pp.nombre,'') LIKE ? OR COALESCE(pp.codigo,'') LIKE ? OR
                                    EXISTS (SELECT 1 FROM producto_variante_dimensiones pvd WHERE pvd.variante_id=pv.id AND COALESCE(pvd.valor_texto,'') LIKE ?)
                                  )
                                ORDER BY
                                  CASE WHEN EXISTS (SELECT 1 FROM producto_variante_dimensiones pvd3 WHERE pvd3.variante_id=pv.id AND COALESCE(pvd3.valor_texto,'') LIKE ?) THEN 0 ELSE 1 END,
                                  CASE WHEN COALESCE(pp.nombre,'') LIKE ? THEN 0 ELSE 1 END,
                                  pp.orden,pp.id,pv.orden,pv.id
                                LIMIT 1`, [like, p.id, like, like, like, like, like]);
                            if (matches.length) {
                                const m = matches[0];
                                p.coincidencia_variante = {
                                    presentacion_id: Number(m.presentacion_id),
                                    presentacion: m.presentacion_nombre || '',
                                    codigo: m.presentacion_codigo || '',
                                    variante_id: m.variante_id ? Number(m.variante_id) : null,
                                    precio: m.variante_precio != null ? Number(m.variante_precio) : null,
                                    stock: m.variante_stock != null ? Number(m.variante_stock) : null,
                                    imagen: m.variante_imagen || '',
                                    detalle: m.dimension_coincidente || m.presentacion_nombre || ''
                                };
                            }
                        } catch (e) {
                            console.warn('No se pudo resolver la variante coincidente del producto', p.id, e.message);
                        }
                    }
                    productos.push(p);
                }
                res.json({ productos, total:Number(countRows[0]?.total||0), pagina, limite, totalPaginas:Math.max(1,Math.ceil(Number(countRows[0]?.total||0)/limite)) });
            };
            finalizar().catch(error => {
                console.error('Error al preparar coincidencias de variantes:', error);
                res.status(500).json({ mensaje: 'Error al preparar el catálogo' });
            });
        });
    });
});

// GET público — categorías y subcategorías reales
router.get("/publicos/categorias", (req, res) => {
    db.query("SELECT id,name,slug,parent_id FROM categories ORDER BY parent_id IS NOT NULL, parent_id, name", (error, rows) => {
        if (error) return res.status(500).json({ mensaje:'Error al obtener categorías' });
        res.json(rows);
    });
});

// GET público — marcas disponibles
router.get("/publicos/marcas", (req, res) => {
    const busqueda = String(req.query.search || "").trim();
    const categoria = String(req.query.categoria || "").trim();
    const categoriaId = Number(req.query.categoria_id || 0);
    const filtros = [
        "p.estado='activo'",
        "COALESCE(p.publicado,1)=1",
        "COALESCE(p.estado_visual, 'auto') NOT IN ('bloqueado','en_revision','en revisión','oculto')",
        "p.marca IS NOT NULL",
        "TRIM(p.marca)<>''"
    ];
    const valores = [];

    if (busqueda) {
        const q = `%${busqueda}%`;
        filtros.push(`(
            p.nombre LIKE ? OR p.marca LIKE ? OR p.modelo LIKE ? OR p.categoria LIKE ? OR p.descripcion LIKE ? OR COALESCE(v.tienda,'') LIKE ?
            OR EXISTS (
                SELECT 1 FROM producto_presentaciones ppb
                WHERE ppb.producto_id=p.id AND ppb.activo=1
                  AND (COALESCE(ppb.nombre,'') LIKE ? OR COALESCE(ppb.codigo,'') LIKE ?)
            )
            OR EXISTS (
                SELECT 1
                FROM producto_variantes pvb
                JOIN producto_variante_dimensiones pvdb ON pvdb.variante_id=pvb.id
                WHERE pvb.producto_id=p.id AND pvb.activo=1
                  AND COALESCE(pvdb.valor_texto,'') LIKE ?
            )
            OR EXISTS (
                SELECT 1
                FROM producto_atributos pab
                LEFT JOIN atributos ab ON ab.id=pab.atributo_id
                LEFT JOIN atributo_opciones aob ON aob.id=pab.opcion_id
                WHERE pab.producto_id=p.id
                  AND (
                    COALESCE(ab.nombre,'') LIKE ? OR COALESCE(pab.valor_texto,'') LIKE ? OR
                    CAST(COALESCE(pab.valor_numero,'') AS CHAR) LIKE ? OR
                    COALESCE(aob.valor,'') LIKE ? OR COALESCE(aob.etiqueta,'') LIKE ?
                  )
            )
        )`);
        valores.push(q,q,q,q,q,q,q,q,q,q,q,q,q,q);
    }

    if (categoriaId) {
        filtros.push(`EXISTS (
            SELECT 1
            FROM categories c0
            LEFT JOIN categories c1 ON c1.id = c0.parent_id
            LEFT JOIN categories c2 ON c2.id = c1.parent_id
            LEFT JOIN categories c3 ON c3.id = c2.parent_id
            LEFT JOIN categories c4 ON c4.id = c3.parent_id
            LEFT JOIN categories c5 ON c5.id = c4.parent_id
            LEFT JOIN categories c6 ON c6.id = c5.parent_id
            WHERE c0.id = p.categoria_id
              AND ? IN (c0.id,c1.id,c2.id,c3.id,c4.id,c5.id,c6.id)
        )`);
        valores.push(categoriaId);
    } else if (categoria) {
        filtros.push("p.categoria = ?");
        valores.push(categoria);
    }

    const sql = `SELECT DISTINCT p.marca
        FROM productos p
        LEFT JOIN vendedores v ON v.id = p.vendedor_id AND v.estado IN ('activo','advertencia')
        WHERE ${filtros.join(" AND ")}
        ORDER BY p.marca`;

    db.query(sql, valores, (error, rows) => {
        if (error) return res.status(500).json({ mensaje:'Error al obtener marcas' });
        res.json(rows.map(r=>r.marca));
    });
});

// GET público — productos más vendidos
router.get("/publicos/mas-vendidos", (req, res) => {
    const limit=Math.min(12,Math.max(1,Number(req.query.limit||6)));
    const sql=`SELECT p.id,p.nombre,p.precio,p.descuento,p.imagen,p.categoria,p.marca,p.vendedor_id,
        COALESCE(v.tienda,'TiendaPro') tienda,COALESCE(SUM(pd.cantidad),0) vendidos
        FROM productos p LEFT JOIN pedido_detalles pd ON pd.producto_id=p.id
        LEFT JOIN vendedores v ON v.id=p.vendedor_id AND v.estado IN ('activo','advertencia')
        WHERE p.estado='activo' AND COALESCE(p.publicado,1)=1
        GROUP BY p.id ORDER BY vendidos DESC,p.id DESC LIMIT ?`;
    db.query(sql,[limit],(error,rows)=>error?res.status(500).json({mensaje:'Error al obtener más vendidos'}):res.json(rows));
});

// FASE 116 — reseñas verificadas de productos
function clienteTienda(req, res, next) {
    const rol = String(req.usuario?.rol || '').toLowerCase();
    if (req.usuario?.portal !== 'tienda' || rol !== 'cliente') {
        return res.status(403).json({ mensaje: 'Acceso exclusivo para clientes' });
    }
    next();
}

async function compraEntregadaParaResena(usuarioId, productoId) {
    const rows = await q(db, `SELECT p.id pedido_id,pd.id pedido_detalle_id,p.fecha_entregado
        FROM pedidos p
        JOIN pedido_detalles pd ON pd.pedido_id=p.id
        WHERE p.usuario_id=? AND pd.producto_id=? AND LOWER(p.estado)='entregado'
        ORDER BY COALESCE(p.fecha_entregado,p.fecha_pedido) DESC,p.id DESC LIMIT 1`, [usuarioId, productoId]);
    return rows[0] || null;
}

router.get('/:id/resenas', async (req, res) => {
    const productoId=Number(req.params.id); if(!productoId)return res.status(400).json({mensaje:'Producto no válido'});
    try {
        const resumen=await q(db, `SELECT COUNT(*) total,COALESCE(AVG(calificacion),0) promedio,
          SUM(calificacion=5) cinco,SUM(calificacion=4) cuatro,SUM(calificacion=3) tres,SUM(calificacion=2) dos,SUM(calificacion=1) uno
          FROM producto_resenas WHERE producto_id=? AND estado='publicada'`, [productoId]);
        const rows=await q(db, `SELECT r.id,r.calificacion,r.comentario,r.fecha_creacion,r.fecha_actualizacion,
          COALESCE(NULLIF(TRIM(u.nombre),''),'Cliente TiendaPro') cliente
          FROM producto_resenas r JOIN usuarios u ON u.id=r.usuario_id
          WHERE r.producto_id=? AND r.estado='publicada'
          ORDER BY r.fecha_creacion DESC,r.id DESC LIMIT 100`, [productoId]);
        const x=resumen[0]||{};
        res.json({resumen:{total:Number(x.total||0),promedio:Number(x.promedio||0),distribucion:{5:Number(x.cinco||0),4:Number(x.cuatro||0),3:Number(x.tres||0),2:Number(x.dos||0),1:Number(x.uno||0)}},resenas:rows.map(r=>({...r,compra_verificada:true}))});
    } catch(error) {
        if(error?.code==='ER_NO_SUCH_TABLE') return res.status(503).json({mensaje:'Ejecuta database/FASE116_RESENAS_PRODUCTOS.sql para activar las reseñas.'});
        console.error('Error al obtener reseñas:',error); res.status(500).json({mensaje:'Error al obtener las reseñas'});
    }
});

router.get('/:id/resenas/mi-estado', verificarToken, clienteTienda, async (req,res)=>{
    const productoId=Number(req.params.id); if(!productoId)return res.status(400).json({mensaje:'Producto no válido'});
    try {
        const compra=await compraEntregadaParaResena(req.usuario.id,productoId);
        const propia=await q(db, `SELECT id,calificacion,comentario,fecha_creacion,fecha_actualizacion FROM producto_resenas WHERE producto_id=? AND usuario_id=? LIMIT 1`,[productoId,req.usuario.id]);
        res.json({puede_resenar:Boolean(compra),motivo:compra?'Compra entregada verificada':'Podrás reseñar este producto cuando una compra figure como Entregada.',resena:propia[0]||null});
    } catch(error) {
        if(error?.code==='ER_NO_SUCH_TABLE') return res.status(503).json({mensaje:'Ejecuta la migración FASE116 de reseñas.'});
        console.error('Error al verificar reseña:',error);res.status(500).json({mensaje:'Error al verificar la compra'});
    }
});

router.post('/:id/resenas', verificarToken, clienteTienda, async (req,res)=>{
    const productoId=Number(req.params.id),calificacion=Number(req.body?.calificacion),comentario=String(req.body?.comentario||'').trim();
    if(!productoId)return res.status(400).json({mensaje:'Producto no válido'});
    if(!Number.isInteger(calificacion)||calificacion<1||calificacion>5)return res.status(400).json({mensaje:'Selecciona una calificación de 1 a 5 estrellas'});
    if(comentario.length<3||comentario.length>1500)return res.status(400).json({mensaje:'La reseña debe tener entre 3 y 1500 caracteres'});
    try {
        const compra=await compraEntregadaParaResena(req.usuario.id,productoId);
        if(!compra)return res.status(403).json({mensaje:'Solo puedes reseñar productos de pedidos entregados'});
        const existe=await q(db,'SELECT id FROM producto_resenas WHERE producto_id=? AND usuario_id=? LIMIT 1',[productoId,req.usuario.id]);
        if(existe.length)return res.status(409).json({mensaje:'Ya publicaste una reseña. Puedes editarla.'});
        const r=await q(db,`INSERT INTO producto_resenas (producto_id,usuario_id,pedido_id,pedido_detalle_id,calificacion,comentario) VALUES (?,?,?,?,?,?)`,[productoId,req.usuario.id,compra.pedido_id,compra.pedido_detalle_id,calificacion,comentario]);
        res.status(201).json({mensaje:'Reseña publicada',id:r.insertId});
    }catch(error){console.error('Error al publicar reseña:',error);res.status(500).json({mensaje:'Error al guardar la reseña'});}
});

router.put('/:id/resenas/mia', verificarToken, clienteTienda, async (req,res)=>{
    const productoId=Number(req.params.id),calificacion=Number(req.body?.calificacion),comentario=String(req.body?.comentario||'').trim();
    if(!Number.isInteger(calificacion)||calificacion<1||calificacion>5)return res.status(400).json({mensaje:'Selecciona una calificación de 1 a 5 estrellas'});
    if(comentario.length<3||comentario.length>1500)return res.status(400).json({mensaje:'La reseña debe tener entre 3 y 1500 caracteres'});
    try{
        const compra=await compraEntregadaParaResena(req.usuario.id,productoId);if(!compra)return res.status(403).json({mensaje:'La compra debe estar entregada'});
        const r=await q(db,`UPDATE producto_resenas SET calificacion=?,comentario=?,estado='publicada',fecha_actualizacion=NOW() WHERE producto_id=? AND usuario_id=?`,[calificacion,comentario,productoId,req.usuario.id]);
        if(!r.affectedRows)return res.status(404).json({mensaje:'Todavía no has publicado una reseña'});
        res.json({mensaje:'Reseña actualizada'});
    }catch(error){console.error('Error al editar reseña:',error);res.status(500).json({mensaje:'Error al actualizar la reseña'});}
});

// GET público — detalle completo del producto, variantes, atributos y productos similares
router.get("/publicos/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ mensaje: 'Producto no válido' });
    try {
        const rows = await q(db, `SELECT p.id,p.nombre,p.descripcion,p.precio,p.descuento,p.imagen,p.stock,p.categoria,p.marca,p.modelo,p.condicion,
            p.color,p.talla,p.disponibilidad,p.tiempo_entrega,p.tipo_venta,p.permite_bajo_pedido,p.estado_visual,p.publicado,
            p.garantia_dias,p.sin_garantia,p.vendedor_id,COALESCE(v.tienda,'TiendaPro') tienda,COALESCE(v.nombre,'TiendaPro') vendedor_nombre,
            COALESCE(v.nivel,'') vendedor_nivel,COALESCE(v.estado,'activo') vendedor_estado,
            inv.stock_fisico_disponible stock_fisico_disponible,COALESCE(ven.vendidos,0) vendidos
            FROM productos p
            LEFT JOIN vendedores v ON v.id=p.vendedor_id
            LEFT JOIN (SELECT producto_id,COUNT(*) stock_fisico_disponible FROM inventario_fisico WHERE estado='disponible' AND COALESCE(publicado,0)=1 GROUP BY producto_id) inv ON inv.producto_id=p.id
            LEFT JOIN (SELECT producto_id,SUM(cantidad) vendidos FROM pedido_detalles GROUP BY producto_id) ven ON ven.producto_id=p.id
            WHERE p.id=? AND p.estado='activo' AND COALESCE(p.publicado,1)=1 LIMIT 1`, [id]);
        if (!rows.length) return res.status(404).json({ mensaje: 'Producto no encontrado' });
        const producto = { ...rows[0], estado_visual: calcularEstadoVisual(rows[0]), logo_tienda: '' };
        // Fase 58: logo de tienda opcional. Compatible con BD aún sin migración.
        try {
            if (producto.vendedor_id) {
                const logoCol = await q(db, "SHOW COLUMNS FROM vendedores LIKE 'logo_tienda'");
                if (logoCol.length) {
                    const logoRows = await q(db, 'SELECT logo_tienda FROM vendedores WHERE id=? LIMIT 1', [producto.vendedor_id]);
                    producto.logo_tienda = logoRows[0]?.logo_tienda || '';
                }
            }
        } catch (_) {}

        const presentacionesRows = await q(db, `SELECT id,nombre,codigo,orden FROM producto_presentaciones WHERE producto_id=? AND activo=1 ORDER BY orden,id`, [id]);
        const presentaciones = [];
        for (const pr of presentacionesRows) {
            const imagenes = await q(db, `SELECT id,ruta_imagen,orden,es_principal,texto_alt FROM producto_imagenes WHERE presentacion_id=? ORDER BY es_principal DESC,orden,id`, [pr.id]);
            const variantesRows = await q(db, `SELECT id,precio,precio_comparacion,stock,permite_bajo_pedido,orden FROM producto_variantes WHERE producto_id=? AND presentacion_id=? AND activo=1 ORDER BY orden,id`, [id, pr.id]);
            const variantes = [];
            for (const vr of variantesRows) {
                const dimensiones = await q(db, `SELECT dimension_codigo,valor_texto,tallaje_sistema_codigo FROM producto_variante_dimensiones WHERE variante_id=? ORDER BY id`, [vr.id]);
                const publico = dimensiones.find(x => x.dimension_codigo === 'publico')?.valor_texto || 'general';
                const talla = dimensiones.find(x => x.dimension_codigo === 'talla')?.valor_texto || '';
                const sistemaTalla = dimensiones.find(x => x.dimension_codigo === 'talla')?.tallaje_sistema_codigo || '';
                variantes.push({ ...vr, publico, talla, sistema_talla: sistemaTalla });
            }
            const precioMin = variantes.length ? Math.min(...variantes.map(v => Number(v.precio || 0)).filter(v => v >= 0)) : Number(producto.precio || 0);
            const stockTotal = variantes.reduce((sum, v) => sum + Number(v.stock || 0), 0);
            presentaciones.push({ id:Number(pr.id), nombre:pr.nombre || '', codigo:pr.codigo || '', imagenes, variantes, precio_min:precioMin, stock_total:stockTotal });
        }

        const attrRows = await q(db, `SELECT pa.id,a.nombre,a.tipo_valor,a.unidad,a.prefijo,pa.valor_texto,pa.valor_numero,pa.valor_booleano,pa.opcion_id,
            ao.valor opcion_valor,ao.etiqueta opcion_etiqueta
            FROM producto_atributos pa JOIN atributos a ON a.id=pa.atributo_id
            LEFT JOIN atributo_opciones ao ON ao.id=pa.opcion_id WHERE pa.producto_id=? ORDER BY pa.id`, [id]);
        const atributos = [];
        for (const ar of attrRows) {
            const multi = await q(db, `SELECT ao.valor,ao.etiqueta FROM producto_atributo_opciones pao JOIN atributo_opciones ao ON ao.id=pao.opcion_id WHERE pao.producto_atributo_id=? ORDER BY ao.orden,ao.id`, [ar.id]);
            let valor='';
            if (multi.length) valor = multi.map(x => x.etiqueta || x.valor).join(', ');
            else if (ar.opcion_id) valor = ar.opcion_etiqueta || ar.opcion_valor || '';
            else if (ar.valor_numero != null) valor = `${ar.prefijo || ''}${Number(ar.valor_numero)}${ar.unidad ? ' ' + ar.unidad : ''}`;
            else if (ar.valor_booleano != null) valor = Number(ar.valor_booleano) ? 'Sí' : 'No';
            else valor = ar.valor_texto || '';
            if (String(valor).trim()) atributos.push({ nombre:ar.nombre, valor:String(valor).trim() });
        }

        const cuidados = await q(db, `SELECT cc.codigo,cc.categoria,cc.icono,cc.nombre,cc.descripcion FROM producto_cuidados pc JOIN cuidados_catalogo cc ON cc.id=pc.cuidado_id WHERE pc.producto_id=? AND cc.activo=1 ORDER BY cc.categoria,cc.orden,cc.nombre`, [id]);
        const detalles = await q(db, `SELECT titulo,detalle FROM producto_detalles_adicionales WHERE producto_id=? AND activo=1 ORDER BY orden,id`, [id]);
        const cuidadosPersonalizados = await q(db, `SELECT texto FROM producto_cuidados_personalizados WHERE producto_id=? AND activo=1 ORDER BY orden,id`, [id]);
        const relacionados = await q(db, `SELECT p.id,p.nombre,p.precio,p.descuento,p.imagen,p.marca,p.categoria,p.vendedor_id,p.stock,p.permite_bajo_pedido,inv.stock_fisico_disponible,COALESCE(v.tienda,'TiendaPro') tienda
            FROM productos p LEFT JOIN vendedores v ON v.id=p.vendedor_id AND v.estado IN ('activo','advertencia')
            LEFT JOIN (SELECT producto_id,COUNT(*) stock_fisico_disponible FROM inventario_fisico WHERE estado='disponible' AND COALESCE(publicado,0)=1 GROUP BY producto_id) inv ON inv.producto_id=p.id
            WHERE p.id<>? AND p.estado='activo' AND COALESCE(p.publicado,1)=1 AND p.categoria=?
            ORDER BY CASE WHEN p.marca=? THEN 0 ELSE 1 END, CASE WHEN p.vendedor_id<>? THEN 0 ELSE 1 END, p.id DESC LIMIT 10`,
            [id, producto.categoria, producto.marca || '', producto.vendedor_id || 0]);

        res.json({ producto:{...producto, presentaciones, atributos, cuidados, cuidados_personalizados:cuidadosPersonalizados, detalles_adicionales:detalles}, relacionados });
    } catch (error) {
        console.error('Error al obtener detalle público:', error);
        res.status(500).json({ mensaje:'Error al obtener el producto' });
    }
});

// GET público — página pública de una tienda/vendedor
router.get("/publicos/tiendas/:id", async (req,res)=>{
 const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({mensaje:'Tienda no válida'});
 try{
  const cols=await q(db,'SHOW COLUMNS FROM vendedores');const fields=new Set(cols.map(c=>c.Field));
  const extra=['logo_tienda','banner_tienda','descripcion_publica','perfil_publico','creado_en'].filter(c=>fields.has(c)).map(c=>','+c).join('');
  const rows=await q(db,`SELECT id,tienda,nivel,estado${extra} FROM vendedores WHERE id=? AND estado IN ('activo','advertencia') LIMIT 1`,[id]);
  if(!rows.length)return res.status(404).json({mensaje:'Tienda no encontrada'});
  const tienda=rows[0];let config={};try{config=JSON.parse(tienda.perfil_publico||'{}')}catch(_){}
  if(config.mostrar_tienda===false)return res.status(404).json({mensaje:'Esta tienda no tiene un perfil público disponible'});
  const permitidos=['mapa_latitud','mapa_longitud','pais','ubicacion','direccion_publica','horario_semana','horario_sabado','horario_domingo','tiempo_respuesta','politica_envios','politica_devoluciones','garantia','mostrar_productos','mostrar_contacto'];
  if(config.mostrar_contacto!==false)permitidos.push('whatsapp','correo_publico','sitio_web','instagram','facebook');
  tienda.perfil_publico=Object.fromEntries(permitidos.filter(c=>c in config).map(c=>[c,config[c]]));
  const productos=config.mostrar_productos===false?[]:await q(db,`SELECT p.id,p.nombre,p.precio,p.descuento,p.imagen,p.categoria,p.marca,p.stock,p.permite_bajo_pedido,p.vendedor_id,
   COALESCE(v.vendidos,0) vendidos FROM productos p LEFT JOIN (SELECT pd.producto_id,SUM(pd.cantidad) vendidos FROM pedido_detalles pd JOIN pedidos pe ON pe.id=pd.pedido_id WHERE LOWER(pe.estado)='entregado' GROUP BY pd.producto_id) v ON v.producto_id=p.id
   WHERE p.vendedor_id=? AND p.estado='activo' AND COALESCE(p.publicado,1)=1 ORDER BY p.id DESC`,[id]);
  const ventas=await q(db,`SELECT COALESCE(SUM(pd.cantidad),0) ventas FROM pedido_detalles pd JOIN productos p ON p.id=pd.producto_id JOIN pedidos pe ON pe.id=pd.pedido_id WHERE p.vendedor_id=? AND LOWER(pe.estado)='entregado'`,[id]);
  let resumen={total:0,promedio:0,distribucion:{1:0,2:0,3:0,4:0,5:0},satisfaccion:null},resenas=[],ratings=[];
  const pagina=Math.max(1,Math.min(10000,parseInt(req.query.resenas_pagina)||1));
  try{
   const grouped=await q(db,`SELECT r.calificacion,COUNT(*) total FROM producto_resenas r JOIN productos p ON p.id=r.producto_id WHERE p.vendedor_id=? AND r.estado='publicada' GROUP BY r.calificacion`,[id]);
   for(const row of grouped){resumen.distribucion[row.calificacion]=Number(row.total);resumen.total+=Number(row.total);resumen.promedio+=Number(row.calificacion)*Number(row.total);}
   if(resumen.total){resumen.promedio/=resumen.total;resumen.satisfaccion=Math.round(100*(resumen.distribucion[4]+resumen.distribucion[5])/resumen.total);}
   resenas=await q(db,`SELECT r.id,r.calificacion,r.comentario,r.fecha_creacion,u.nombre cliente,p.nombre producto,p.id producto_id FROM producto_resenas r JOIN productos p ON p.id=r.producto_id JOIN usuarios u ON u.id=r.usuario_id WHERE p.vendedor_id=? AND r.estado='publicada' ORDER BY r.fecha_creacion DESC,r.id DESC LIMIT 10 OFFSET ?`,[id,(pagina-1)*10]);
   ratings=await q(db,`SELECT r.producto_id,AVG(r.calificacion) promedio,COUNT(*) total FROM producto_resenas r JOIN productos p ON p.id=r.producto_id WHERE p.vendedor_id=? AND r.estado='publicada' GROUP BY r.producto_id`,[id]);
  }catch(e){if(e.code!=='ER_NO_SUCH_TABLE')throw e;}
  const map=new Map(ratings.map(x=>[Number(x.producto_id),x]));
  res.json({tienda,productos:productos.map(p=>({...p,resenas:map.get(Number(p.id))||{promedio:0,total:0}})),ventas:Number(ventas[0].ventas),resumen,resenas,resenas_pagina:pagina,resenas_paginas:Math.ceil(resumen.total/10)});
 }catch(e){console.error('Perfil público de tienda:',e);res.status(500).json({mensaje:'No se pudo cargar el perfil de la tienda'});}
});

// POST vendedor — guardar una sesión completa del formulario Fase 43.
// Todo el lote es atómico: si cualquier producto falla, no se guarda ninguno.
router.post("/vendedor/lote", verificarToken, sellerOnly, uploadSellerProducts.any(), async (req, res) => {
    let payload;
    try {
        payload = JSON.parse(req.body.payload || "{}");
    } catch (_) {
        return res.status(400).json({ mensaje: "Datos de publicación no válidos" });
    }

    const products = Array.isArray(payload.productos) ? payload.productos : [];
    if (!products.length) return res.status(400).json({ mensaje: "No hay productos para guardar" });
    if (products.length > 25) return res.status(400).json({ mensaje: "Máximo 25 productos por sesión" });

    const filesByField = {};
    for (const file of (req.files || [])) {
        (filesByField[file.fieldname] ||= []).push(file);
    }

    const conn = await getConnection().catch(() => null);
    if (!conn) return res.status(500).json({ mensaje: "No se pudo conectar con la base de datos" });
    const savedFiles = [];

    try {
        const sellerRows = await q(conn,
            `SELECT id, estado FROM vendedores WHERE usuario_id = ? LIMIT 1`,
            [req.usuario.id]
        );
        if (!sellerRows.length || !["activo","advertencia"].includes(String(sellerRows[0].estado || "").toLowerCase())) {
            return res.status(403).json({ mensaje: "La cuenta de vendedor no está habilitada para publicar" });
        }
        const vendedorId = Number(sellerRows[0].id);
        await begin(conn);

        const created = [];
        for (let pi = 0; pi < products.length; pi++) {
            const item = products[pi] || {};
            const nombre = String(item.nombre || "").trim();
            const descripcion = String(item.descripcion || "").trim();
            const marca = String(item.marca || "").trim() || null;
            const modelo = String(item.modelo || "").trim() || null;
            const condicion = String(item.condicion || "Nuevo").trim() || "Nuevo";
            const categoryPath = Array.isArray(item.categoryPath) ? item.categoryPath.map(x => String(x || "").trim()).filter(Boolean) : [];
            if (!nombre || !categoryPath.length) throw new Error(`Producto ${pi + 1}: nombre y categoría son obligatorios`);

            // Resolver la categoría por la ruta completa para evitar ambigüedad de nombres repetidos.
            let parentId = null;
            let categoriaId = null;
            for (const segment of categoryPath) {
                const rows = parentId == null
                    ? await q(conn, `SELECT id FROM categories WHERE name=? AND parent_id IS NULL AND activo=1 LIMIT 1`, [segment])
                    : await q(conn, `SELECT id FROM categories WHERE name=? AND parent_id=? AND activo=1 LIMIT 1`, [segment, parentId]);
                if (!rows.length) throw new Error(`Producto ${pi + 1}: categoría no encontrada (${segment})`);
                categoriaId = Number(rows[0].id);
                parentId = categoriaId;
            }

            // Compatibilidad temporal con marketplace legacy: resumen de precio/stock y primera imagen.
            const presentations = Array.isArray(item.variants) ? item.variants : [];
            if (!presentations.length) throw new Error(`Producto ${pi + 1}: agrega al menos una presentación`);
            const allPrices = [];
            let totalStock = 0;
            for (const pres of presentations) {
                const audienceEntries = Object.entries(pres.audiences || {});
                const hasSizes = audienceEntries.some(([, a]) => Object.keys(a?.sizes || {}).length);
                if (hasSizes) {
                    for (const [, a] of audienceEntries) {
                        for (const d of Object.values(a?.sizes || {})) {
                            const price = Number(d?.price);
                            const stock = Number(d?.stock);
                            if (Number.isFinite(price) && price > 0) allPrices.push(price);
                            totalStock += Number.isFinite(stock) && stock >= 0 ? stock : 0;
                        }
                    }
                } else {
                    const price = Number(pres.price);
                    const stock = Number(pres.stock);
                    if (Number.isFinite(price) && price > 0) allPrices.push(price);
                    totalStock += Number.isFinite(stock) && stock >= 0 ? stock : 0;
                }
            }
            if (!allPrices.length) throw new Error(`Producto ${pi + 1}: falta precio válido`);
            const minPrice = Math.min(...allPrices);

            const prodResult = await q(conn, `INSERT INTO productos
                (vendedor_id,nombre,descripcion,precio,stock,categoria,categoria_id,marca,modelo,condicion,
                 garantia_dias,sin_garantia,estado_publicacion,estado,publicado,estado_visual,disponibilidad)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'borrador','activo',0,'oculto',?)`, [
                vendedorId, nombre, descripcion || null, minPrice, totalStock,
                categoryPath[categoryPath.length - 1], categoriaId, marca, modelo, condicion,
                item.sinGarantia ? null : (Number(item.garantiaDias) || null), item.sinGarantia ? 1 : 0,
                totalStock > 0 ? 'Disponible' : 'Agotado'
            ]);
            const productoId = Number(prodResult.insertId);

            // Atributos generales del producto.
            const attrRows = await q(conn, `SELECT a.id,a.codigo_base,a.tipo_valor
                FROM categoria_perfiles cp
                JOIN perfil_atributos pa ON pa.perfil_clave=cp.perfil_clave
                JOIN atributos a ON a.id=pa.atributo_id
                WHERE cp.categoria_id=?`, [categoriaId]);
            const attrs = item.categoryAttributes || {};
            for (const attr of attrRows) {
                const directKey = Object.prototype.hasOwnProperty.call(attrs, attr.codigo_base) ? attr.codigo_base : null;
                const scopedKey = directKey || Object.keys(attrs).find(k => k.endsWith(`::${attr.codigo_base}`));
                if (!scopedKey) continue;
                const raw = attrs[scopedKey];
                if (raw === "" || raw == null || (Array.isArray(raw) && !raw.length)) continue;
                if (Array.isArray(raw)) {
                    const pattr = await q(conn, `INSERT INTO producto_atributos (producto_id,atributo_id) VALUES (?,?)`, [productoId, attr.id]);
                    for (const val of raw) {
                        const opt = await q(conn, `SELECT id FROM atributo_opciones WHERE atributo_id=? AND (valor=? OR etiqueta=?) LIMIT 1`, [attr.id, String(val), String(val)]);
                        if (opt.length) await q(conn, `INSERT IGNORE INTO producto_atributo_opciones (producto_atributo_id,opcion_id) VALUES (?,?)`, [pattr.insertId, opt[0].id]);
                    }
                } else {
                    const numberLike = ["decimal","entero"].includes(String(attr.tipo_valor));
                    const opt = await q(conn, `SELECT id FROM atributo_opciones WHERE atributo_id=? AND (valor=? OR etiqueta=?) LIMIT 1`, [attr.id, String(raw), String(raw)]);
                    await q(conn, `INSERT INTO producto_atributos (producto_id,atributo_id,valor_texto,valor_numero,opcion_id)
                        VALUES (?,?,?,?,?)`, [productoId, attr.id, numberLike ? null : String(raw), numberLike && Number.isFinite(Number(raw)) ? Number(raw) : null, opt[0]?.id || null]);
                }
            }

            // Cuidados y advertencias universales seleccionados del catálogo TiendaPro.
            const cuidados = Array.isArray(item.cuidados) ? [...new Set(item.cuidados.map(x => String(x || "").trim()).filter(Boolean))] : [];
            for (const codigo of cuidados) {
                const care = await q(conn, `SELECT id FROM cuidados_catalogo WHERE codigo=? AND activo=1 LIMIT 1`, [codigo]);
                if (!care.length) throw new Error(`Producto ${pi + 1}: cuidado/advertencia no válido (${codigo})`);
                await q(conn, `INSERT IGNORE INTO producto_cuidados (producto_id,cuidado_id) VALUES (?,?)`, [productoId, care[0].id]);
            }

            // Cuidados personalizados: opcionales y escritos por el vendedor cuando no existe un icono oficial.
            const cuidadosPersonalizados = Array.isArray(item.cuidadosPersonalizados) ? item.cuidadosPersonalizados : [];
            let cuidadoPersonalizadoOrden = 1;
            for (const raw of cuidadosPersonalizados) {
                const texto = String(raw || "").trim().slice(0, 300);
                if (!texto) continue;
                await q(conn, `INSERT INTO producto_cuidados_personalizados (producto_id,texto,orden,activo) VALUES (?,?,?,1)`, [productoId, texto, cuidadoPersonalizadoOrden++]);
            }

            // Detalles adicionales escritos por el vendedor.
            const detalles = Array.isArray(item.detallesAdicionales) ? item.detallesAdicionales : [];
            let detalleOrden = 1;
            for (const d of detalles) {
                const titulo = String(d?.titulo || "").trim();
                const detalle = String(d?.detalle || "").trim();
                if (!titulo && !detalle) continue;
                if (titulo.length > 80 || detalle.length > 500) throw new Error(`Producto ${pi + 1}: un detalle adicional excede el límite permitido`);
                await q(conn, `INSERT INTO producto_detalles_adicionales (producto_id,titulo,detalle,orden,activo) VALUES (?,?,?,?,1)`, [productoId, titulo || 'Detalle', detalle, detalleOrden++]);
            }

            // Perfil de tallaje de esta categoría, si aplica.
            const tallaProfileRows = await q(conn, `SELECT perfil_clave FROM categoria_tallaje WHERE categoria_id=? LIMIT 1`, [categoriaId]);
            const tallaProfile = tallaProfileRows[0]?.perfil_clave || null;
            const sizeSystem = String(item.sizeSystem || "").trim();
            const sizeDbSystem = tallaProfile && sizeSystem ? `${tallaProfile}__${sizeSystem}` : null;

            let firstImagePath = null;
            for (let vi = 0; vi < presentations.length; vi++) {
                const pres = presentations[vi] || {};
                const presName = String(pres.color || `Presentación ${vi + 1}`).trim();
                if (!presName) throw new Error(`Producto ${pi + 1}: presentación ${vi + 1} sin nombre`);
                const pr = await q(conn, `INSERT INTO producto_presentaciones (producto_id,nombre,orden,activo) VALUES (?,?,?,1)`, [productoId,presName,vi+1]);
                const presentacionId = Number(pr.insertId);

                const field = `image_${pi}_${vi}`;
                const imgs = filesByField[field] || [];
                if (!imgs.length) throw new Error(`Producto ${pi + 1}: presentación ${vi + 1} requiere al menos una imagen`);
                if (imgs.length > 5) throw new Error(`Producto ${pi + 1}: máximo 5 imágenes por presentación`);
                for (let ii=0; ii<imgs.length; ii++) {
                    const f = imgs[ii];
                    const finalName = `${Date.now()}_${crypto.randomUUID()}${safeFileExt(f)}`;
                    const finalPath = path.join(PRODUCT_UPLOAD_DIR, finalName);
                    fs.renameSync(f.path, finalPath);
                    savedFiles.push(finalPath);
                    const webPath = `/uploads/productos/${finalName}`;
                    if (!firstImagePath) firstImagePath = webPath;
                    await q(conn, `INSERT INTO producto_imagenes (presentacion_id,ruta_imagen,orden,es_principal,texto_alt) VALUES (?,?,?,?,?)`,
                        [presentacionId,webPath,ii+1,ii===0?1:0,`${nombre} - ${presName}`]);
                }

                const audienceEntries = Object.entries(pres.audiences || {});
                const hasSizes = audienceEntries.some(([, a]) => Object.keys(a?.sizes || {}).length);
                if (hasSizes) {
                    for (const [audKey, aud] of audienceEntries) {
                        const sizes = Object.entries(aud?.sizes || {});
                        for (const [size, d] of sizes) {
                            const price = Number(d?.price), stock = Number(d?.stock);
                            if (!(price > 0) || !Number.isInteger(stock) || stock < 0) throw new Error(`Producto ${pi + 1}: variante ${presName}/${size} incompleta`);
                            const hashSource = `publico=${audKey}|talla=${sizeDbSystem || sizeSystem}:${size}`;
                            const keyHash = crypto.createHash('sha256').update(hashSource).digest('hex');
                            const vr = await q(conn, `INSERT INTO producto_variantes
                                (producto_id,presentacion_id,clave_combinacion,precio,stock,activo,orden)
                                VALUES (?,?,?,?,?,1,?)`, [productoId,presentacionId,keyHash,price,stock,vi+1]);
                            const varianteId = Number(vr.insertId);
                            await q(conn, `INSERT INTO producto_variante_dimensiones (variante_id,dimension_codigo,valor_texto) VALUES (?,?,?)`, [varianteId,'publico',normalizeAudience(audKey)]);
                            if (sizeDbSystem) {
                                const tv = await q(conn, `SELECT id FROM tallaje_valores WHERE sistema_codigo=? AND publico=? AND valor=? LIMIT 1`, [sizeDbSystem,normalizeAudience(audKey),String(size)]);
                                await q(conn, `INSERT INTO producto_variante_dimensiones
                                    (variante_id,dimension_codigo,valor_texto,tallaje_sistema_codigo,tallaje_valor_id)
                                    VALUES (?,?,?,?,?)`, [varianteId,'talla',String(size),sizeDbSystem,tv[0]?.id || null]);
                            } else {
                                await q(conn, `INSERT INTO producto_variante_dimensiones (variante_id,dimension_codigo,valor_texto) VALUES (?,?,?)`, [varianteId,'talla',String(size)]);
                            }
                        }
                    }
                } else {
                    const price = Number(pres.price), stock = Number(pres.stock);
                    if (!(price > 0) || !Number.isInteger(stock) || stock < 0) throw new Error(`Producto ${pi + 1}: presentación ${presName} incompleta`);
                    const keyHash = crypto.createHash('sha256').update(`presentacion=${presentacionId}`).digest('hex');
                    await q(conn, `INSERT INTO producto_variantes
                        (producto_id,presentacion_id,clave_combinacion,precio,stock,activo,orden)
                        VALUES (?,?,?,?,?,1,?)`, [productoId,presentacionId,keyHash,price,stock,vi+1]);
                }
            }

            if (firstImagePath) await q(conn, `UPDATE productos SET imagen=? WHERE id=?`, [firstImagePath,productoId]);
            await sincronizarInventarioCantidadProducto(conn, productoId, vendedorId);
            created.push({ id: productoId, nombre });
        }

        await commit(conn);
        return res.status(201).json({ mensaje: `${created.length} producto(s) guardado(s) como borrador`, productos: created });
    } catch (error) {
        await rollback(conn);
        for (const f of savedFiles) { try { fs.unlinkSync(f); } catch (_) {} }
        for (const file of (req.files || [])) { try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (_) {} }
        console.error("Error al guardar productos del vendedor:", error);
        return res.status(500).json({ mensaje: error.message || "No se pudieron guardar los productos" });
    } finally {
        conn.release();
    }
});

// GET vendedor — listar únicamente los productos de la tienda autenticada.
router.get("/vendedor/mis-productos", verificarToken, sellerOnly, (req, res) => {
    const busqueda = String(req.query.search || "").trim();
    const estado = String(req.query.estado || "todos").toLowerCase().trim();
    const valores = [req.usuario.id];
    const filtros = ["v.usuario_id = ?"];

    if (busqueda) {
        filtros.push("(p.nombre LIKE ? OR COALESCE(p.marca,'') LIKE ? OR COALESCE(p.modelo,'') LIKE ? OR COALESCE(p.categoria,'') LIKE ?)");
        const qv = `%${busqueda}%`;
        valores.push(qv, qv, qv, qv);
    }
    if (["borrador","publicado","pausado","pendiente_revision","rechazado","archivado"].includes(estado)) {
        filtros.push("p.estado_publicacion = ?");
        valores.push(estado);
    }

    const sql = `SELECT
        p.id,p.nombre,p.descripcion,p.precio,p.stock,p.categoria,p.marca,p.modelo,p.imagen,
        p.estado_publicacion,p.publicado,p.estado_visual,p.disponibilidad,p.fecha_creacion,p.fecha_actualizacion,
        p.tipo_venta,p.permite_bajo_pedido,
        COALESCE((SELECT COUNT(*) FROM producto_presentaciones pp WHERE pp.producto_id=p.id AND pp.activo=1),0) AS presentaciones,
        COALESCE((SELECT COUNT(*) FROM producto_variantes pv WHERE pv.producto_id=p.id AND pv.activo=1),0) AS variantes,
        COALESCE((SELECT SUM(pv.stock) FROM producto_variantes pv WHERE pv.producto_id=p.id AND pv.activo=1),p.stock,0) AS stock_variantes
        FROM productos p
        INNER JOIN vendedores v ON v.id=p.vendedor_id
        WHERE ${filtros.join(" AND ")}
        ORDER BY p.fecha_actualizacion DESC,p.id DESC`;

    db.query(sql, valores, (error, rows) => {
        if (error) {
            console.error("Error al listar productos del vendedor:", error);
            return res.status(500).json({ mensaje: "Error al cargar tus productos" });
        }
        res.json(rows);
    });
});

// GET vendedor — inventario por cantidades de sus productos y variantes.
router.get("/vendedor/inventario", verificarToken, sellerOnly, async (req, res) => {
    const search = String(req.query.search || "").trim();
    const estado = String(req.query.estado || "todos").toLowerCase().trim();
    try {
        const sellers = await q(db, `SELECT id FROM vendedores WHERE usuario_id=? LIMIT 1`, [req.usuario.id]);
        if (!sellers.length) return res.status(404).json({ mensaje:"No se encontró la tienda del vendedor" });
        const vendedorId = Number(sellers[0].id);
        const filtros = ["p.vendedor_id=?", "pv.activo=1", "pp.activo=1"];
        const valores = [vendedorId];
        if (search) {
            const like = `%${search}%`;
            filtros.push(`(p.nombre LIKE ? OR COALESCE(p.marca,'') LIKE ? OR COALESCE(p.modelo,'') LIKE ? OR COALESCE(pp.nombre,'') LIKE ? OR EXISTS (SELECT 1 FROM producto_variante_dimensiones d WHERE d.variante_id=pv.id AND COALESCE(d.valor_texto,'') LIKE ?))`);
            valores.push(like,like,like,like,like);
        }
        if (estado === 'agotado') filtros.push('COALESCE(ic.disponible,pv.stock,0)=0');
        if (estado === 'bajo') filtros.push('COALESCE(ic.disponible,pv.stock,0)>0 AND COALESCE(ic.disponible,pv.stock,0)<=GREATEST(COALESCE(ic.stock_minimo,0),1)');
        if (estado === 'disponible') filtros.push('COALESCE(ic.disponible,pv.stock,0)>GREATEST(COALESCE(ic.stock_minimo,0),0)');
        if (estado === 'reservado') filtros.push('COALESCE(ic.reservado,0)>0');

        const rows = await q(db, `SELECT
            p.id producto_id,p.nombre producto,p.marca,p.modelo,p.categoria,p.publicado,p.estado_publicacion,p.imagen producto_imagen,
            pp.id presentacion_id,pp.nombre presentacion,
            pv.id variante_id,pv.precio,pv.stock stock_variante,
            COALESCE(ic.disponible,pv.stock,0) disponible,COALESCE(ic.reservado,0) reservado,COALESCE(ic.vendido,0) vendido,
            COALESCE(ic.stock_minimo,0) stock_minimo,
            (COALESCE(ic.disponible,pv.stock,0)+COALESCE(ic.reservado,0)) stock_actual,
            (SELECT GROUP_CONCAT(d.valor_texto ORDER BY d.id SEPARATOR ' · ') FROM producto_variante_dimensiones d WHERE d.variante_id=pv.id AND COALESCE(d.valor_texto,'')<>'') variante_detalle,
            COALESCE((SELECT pi.ruta_imagen FROM producto_imagenes pi WHERE pi.presentacion_id=pp.id ORDER BY pi.es_principal DESC,pi.orden,pi.id LIMIT 1),p.imagen) imagen
            FROM productos p
            JOIN producto_presentaciones pp ON pp.producto_id=p.id
            JOIN producto_variantes pv ON pv.producto_id=p.id AND pv.presentacion_id=pp.id
            LEFT JOIN inventario_cantidades ic ON ic.variante_id=pv.id
            WHERE ${filtros.join(' AND ')}
            ORDER BY p.nombre,pp.orden,pp.id,pv.orden,pv.id`, valores);
        const summary = rows.reduce((a,r)=>{
            a.variantes++;
            a.disponible += Number(r.disponible||0);
            a.reservado += Number(r.reservado||0);
            a.vendido += Number(r.vendido||0);
            if (Number(r.disponible||0)===0) a.agotadas++;
            else if (Number(r.disponible||0)<=Math.max(Number(r.stock_minimo||0),1)) a.bajas++;
            return a;
        }, {variantes:0,disponible:0,reservado:0,vendido:0,agotadas:0,bajas:0});
        res.json({ inventario:rows, resumen:summary });
    } catch (error) {
        console.error('Error inventario vendedor:', error);
        if (error && (error.code==='ER_NO_SUCH_TABLE' || error.errno===1146)) return res.status(409).json({ mensaje:'Falta ejecutar FASE70_INVENTARIO_CANTIDADES.sql en MySQL.' });
        res.status(500).json({ mensaje:'No se pudo cargar el inventario' });
    }
});

// PUT vendedor — ajustar stock disponible y mínimo de una variante propia.
router.put("/vendedor/inventario/:varianteId", verificarToken, sellerOnly, async (req, res) => {
    const varianteId = Number(req.params.varianteId);
    const disponible = Number(req.body.disponible);
    const stockMinimo = Math.max(0, Number(req.body.stock_minimo || 0));
    if (!varianteId || !Number.isInteger(disponible) || disponible < 0) return res.status(400).json({ mensaje:'La cantidad disponible debe ser un entero mayor o igual a 0' });
    const conn = await getConnection().catch(()=>null);
    if (!conn) return res.status(500).json({ mensaje:'No se pudo conectar a la base de datos' });
    try {
        await begin(conn);
        const own = await q(conn, `SELECT pv.id,pv.producto_id,pv.presentacion_id,p.vendedor_id
            FROM producto_variantes pv JOIN productos p ON p.id=pv.producto_id JOIN vendedores v ON v.id=p.vendedor_id
            WHERE pv.id=? AND pv.activo=1 AND v.usuario_id=? LIMIT 1`, [varianteId,req.usuario.id]);
        if (!own.length) { await rollback(conn); return res.status(404).json({ mensaje:'Variante no encontrada en tu tienda' }); }
        const x=own[0];
        await q(conn, `INSERT INTO inventario_cantidades (vendedor_id,producto_id,presentacion_id,variante_id,disponible,reservado,vendido,stock_minimo,fecha_actualizacion)
            VALUES (?,?,?,?,?,0,0,?,NOW())
            ON DUPLICATE KEY UPDATE disponible=VALUES(disponible),stock_minimo=VALUES(stock_minimo),fecha_actualizacion=NOW()`,
            [x.vendedor_id,x.producto_id,x.presentacion_id,varianteId,disponible,stockMinimo]);
        await q(conn, `UPDATE producto_variantes SET stock=? WHERE id=?`, [disponible,varianteId]);
        const stockProducto = await recalcularStockProductoDesdeVariantes(conn, x.producto_id);
        await commit(conn);
        res.json({ mensaje:'Inventario actualizado', variante_id:varianteId, disponible, stock_minimo:stockMinimo, stock_producto:stockProducto });
    } catch(error) {
        await rollback(conn);
        console.error('Error ajustando inventario vendedor:',error);
        if (error && (error.code==='ER_NO_SUCH_TABLE' || error.errno===1146)) return res.status(409).json({ mensaje:'Falta ejecutar FASE70_INVENTARIO_CANTIDADES.sql en MySQL.' });
        res.status(500).json({ mensaje:'No se pudo actualizar el inventario' });
    } finally { conn.release(); }
});

// GET vendedor — resumen e historial de ventas de un producto propio.
router.get("/vendedor/:id/ventas", verificarToken, sellerOnly, async (req, res) => {
    const productoId = Number(req.params.id);
    if (!productoId) return res.status(400).json({ mensaje: "Producto no válido" });

    const limit = Math.min(Math.max(Number(req.query.limit || 5), 1), 200);
    const estado = String(req.query.estado || "todos").trim();
    const desde = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.desde || "")) ? String(req.query.desde) : "";
    const hasta = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.hasta || "")) ? String(req.query.hasta) : "";

    try {
        const own = await q(db, `SELECT p.id,p.nombre FROM productos p
            INNER JOIN vendedores v ON v.id=p.vendedor_id
            WHERE p.id=? AND v.usuario_id=? LIMIT 1`, [productoId, req.usuario.id]);
        if (!own.length) return res.status(404).json({ mensaje: "Producto no encontrado en tu tienda" });

        const colRows = await q(db, `SELECT COLUMN_NAME nombre FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pedido_detalles'`);
        const cols = new Set(colRows.map(x => x.nombre));
        const hasPresentation = cols.has('presentacion_id');
        const hasVariant = cols.has('variante_id');
        const hasPresentationName = cols.has('presentacion_nombre');
        const hasVariantDetail = cols.has('variante_detalle');

        const joins = [];
        if (hasPresentation) joins.push('LEFT JOIN producto_presentaciones pp_hist ON pp_hist.id=pd.presentacion_id');
        if (hasVariant) joins.push('LEFT JOIN producto_variantes pv_hist ON pv_hist.id=pd.variante_id');

        const presentationExpr = hasPresentationName
            ? `COALESCE(NULLIF(pd.presentacion_nombre,''), ${hasPresentation ? "NULLIF(pp_hist.nombre,'')" : 'NULL'})`
            : (hasPresentation ? `NULLIF(pp_hist.nombre,'')` : `NULL`);
        const variantExpr = hasVariantDetail
            ? `NULLIF(pd.variante_detalle,'')`
            : `NULL`;
        const presentationIdExpr = hasPresentation ? 'pd.presentacion_id' : 'NULL';
        const variantIdExpr = hasVariant ? 'pd.variante_id' : 'NULL';

        const filtros = ['pd.producto_id=?'];
        const valores = [productoId];
        if (estado && estado.toLowerCase() !== 'todos') { filtros.push('LOWER(pe.estado)=LOWER(?)'); valores.push(estado); }
        if (desde) { filtros.push('DATE(pe.fecha_pedido)>=?'); valores.push(desde); }
        if (hasta) { filtros.push('DATE(pe.fecha_pedido)<=?'); valores.push(hasta); }
        const where = filtros.join(' AND ');

        // El resumen considera pedidos no cancelados como venta válida.
        const resumenRows = await q(db, `SELECT
            COALESCE(SUM(CASE WHEN LOWER(COALESCE(pe.estado,''))<>'cancelado' THEN pd.cantidad ELSE 0 END),0) unidades_vendidas,
            COALESCE(SUM(CASE WHEN LOWER(COALESCE(pe.estado,''))<>'cancelado' THEN pd.subtotal ELSE 0 END),0) ingresos,
            COUNT(DISTINCT CASE WHEN LOWER(COALESCE(pe.estado,''))<>'cancelado' THEN pe.id END) pedidos,
            MAX(CASE WHEN LOWER(COALESCE(pe.estado,''))<>'cancelado' THEN pe.fecha_pedido END) ultima_venta
            FROM pedido_detalles pd INNER JOIN pedidos pe ON pe.id=pd.pedido_id
            WHERE ${where}`, valores);

        const countRows = await q(db, `SELECT COUNT(*) total FROM pedido_detalles pd
            INNER JOIN pedidos pe ON pe.id=pd.pedido_id WHERE ${where}`, valores);

        const ventas = await q(db, `SELECT
            pd.id pedido_detalle_id,pd.pedido_id,pe.codigo_pedido,pe.estado,pe.fecha_pedido,
            pd.cantidad,pd.precio_unitario,pd.subtotal,pd.codigo_producto,
            ${presentationIdExpr} presentacion_id,${variantIdExpr} variante_id,
            ${presentationExpr} presentacion_nombre,${variantExpr} variante_detalle
            FROM pedido_detalles pd
            INNER JOIN pedidos pe ON pe.id=pd.pedido_id
            ${joins.join('\n            ')}
            WHERE ${where}
            ORDER BY pe.fecha_pedido DESC,pd.id DESC LIMIT ?`, [...valores, limit]);

        res.json({
            producto: own[0],
            resumen: resumenRows[0] || { unidades_vendidas:0, ingresos:0, pedidos:0, ultima_venta:null },
            ventas,
            total_historial: Number(countRows[0]?.total || 0),
            soporte_variantes: hasPresentation || hasVariant
        });
    } catch (error) {
        console.error('Error al obtener ventas del producto del vendedor:', error);
        res.status(500).json({ mensaje: 'No se pudo cargar el historial de ventas del producto' });
    }
});

// PUT vendedor — publicar o pausar únicamente un producto propio.
router.put("/vendedor/:id/publicacion", verificarToken, sellerOnly, (req, res) => {
    const productoId = Number(req.params.id);
    const publicar = Number(req.body.publicado || 0) === 1 ? 1 : 0;
    if (!productoId) return res.status(400).json({ mensaje: "Producto no válido" });

    const buscarSql = `SELECT p.id,p.stock,p.tipo_venta,p.permite_bajo_pedido,p.estado_publicacion,v.id AS vendedor_id,v.estado AS vendedor_estado
        FROM productos p
        INNER JOIN vendedores v ON v.id=p.vendedor_id
        WHERE p.id=? AND v.usuario_id=? LIMIT 1`;

    db.query(buscarSql, [productoId, req.usuario.id], (errorBuscar, rows) => {
        if (errorBuscar) {
            console.error(errorBuscar);
            return res.status(500).json({ mensaje: "Error al verificar el producto" });
        }
        if (!rows.length) return res.status(404).json({ mensaje: "Producto no encontrado en tu tienda" });

        const producto = rows[0];
        const vendedorEstado = String(producto.vendedor_estado || "").toLowerCase();
        if (!['activo','advertencia'].includes(vendedorEstado)) {
            return res.status(403).json({ mensaje: "Tu cuenta de vendedor no está habilitada para publicar" });
        }
        if (['rechazado','archivado'].includes(String(producto.estado_publicacion || '').toLowerCase()) && publicar) {
            return res.status(409).json({ mensaje: "Este producto no se puede publicar en su estado actual" });
        }

        const nuevoEstadoPublicacion = publicar ? 'publicado' : (String(producto.estado_publicacion).toLowerCase()==='borrador' ? 'borrador' : 'pausado');
        const estadoVisual = publicar ? 'auto' : 'oculto';
        const disponibilidad = Number(producto.stock || 0) > 0 || Number(producto.permite_bajo_pedido || 0) === 1 || ['bajo_pedido','importacion'].includes(String(producto.tipo_venta || '').toLowerCase())
            ? 'Disponible' : 'Agotado';

        db.query(`UPDATE productos
                  SET publicado=?, estado='activo', estado_visual=?, estado_publicacion=?, disponibilidad=?
                  WHERE id=? AND vendedor_id=?`,
            [publicar, estadoVisual, nuevoEstadoPublicacion, disponibilidad, productoId, producto.vendedor_id],
            (errorUpdate, result) => {
                if (errorUpdate) {
                    console.error(errorUpdate);
                    return res.status(500).json({ mensaje: "Error al actualizar la publicación" });
                }
                if (!result.affectedRows) return res.status(404).json({ mensaje: "Producto no encontrado" });
                res.json({
                    mensaje: publicar ? "Producto publicado correctamente" : "Producto pausado correctamente",
                    producto_id: productoId,
                    publicado: publicar,
                    estado_publicacion: nuevoEstadoPublicacion,
                    estado_visual: estadoVisual
                });
            }
        );
    });
});


// GET vendedor — cargar un producto propio para edición.
router.get("/vendedor/:id/editar", verificarToken, sellerOnly, async (req, res) => {
    const productoId = Number(req.params.id);
    if (!productoId) return res.status(400).json({ mensaje: "Producto no válido" });
    const conn = await getConnection().catch(() => null);
    if (!conn) return res.status(500).json({ mensaje: "No se pudo conectar con la base de datos" });
    try {
        const rows = await q(conn, `SELECT p.id,p.nombre,p.descripcion,p.categoria,p.categoria_id,p.marca,p.modelo,p.condicion,
            p.garantia_dias,p.sin_garantia,p.estado_publicacion,p.publicado,p.imagen,p.vendedor_id
            FROM productos p INNER JOIN vendedores v ON v.id=p.vendedor_id
            WHERE p.id=? AND v.usuario_id=? LIMIT 1`, [productoId, req.usuario.id]);
        if (!rows.length) return res.status(404).json({ mensaje: "Producto no encontrado en tu tienda" });
        const producto = rows[0];

        // Ruta completa de categoría, desde raíz hasta la categoría hoja.
        const categoryPath = [];
        let catId = Number(producto.categoria_id || 0) || null;
        const guard = new Set();
        while (catId && !guard.has(catId)) {
            guard.add(catId);
            const cat = await q(conn, `SELECT id,name,parent_id FROM categories WHERE id=? LIMIT 1`, [catId]);
            if (!cat.length) break;
            categoryPath.unshift(cat[0].name);
            catId = cat[0].parent_id ? Number(cat[0].parent_id) : null;
        }
        if (!categoryPath.length && producto.categoria) categoryPath.push(producto.categoria);

        // Atributos guardados, usando codigo_base para que el mismo formulario pueda hidratarlos.
        const attrRows = await q(conn, `SELECT pa.id,a.codigo_base,a.tipo_valor,pa.valor_texto,pa.valor_numero,pa.opcion_id,
            ao.valor AS opcion_valor,ao.etiqueta AS opcion_etiqueta
            FROM producto_atributos pa
            JOIN atributos a ON a.id=pa.atributo_id
            LEFT JOIN atributo_opciones ao ON ao.id=pa.opcion_id
            WHERE pa.producto_id=? ORDER BY pa.id`, [productoId]);
        const categoryAttributes = {};
        for (const ar of attrRows) {
            const multi = await q(conn, `SELECT ao.valor,ao.etiqueta FROM producto_atributo_opciones pao
                JOIN atributo_opciones ao ON ao.id=pao.opcion_id WHERE pao.producto_atributo_id=? ORDER BY ao.orden,ao.id`, [ar.id]);
            if (multi.length) categoryAttributes[ar.codigo_base] = multi.map(x => x.valor || x.etiqueta);
            else if (ar.opcion_id) categoryAttributes[ar.codigo_base] = ar.opcion_valor || ar.opcion_etiqueta || '';
            else if (["decimal","entero"].includes(String(ar.tipo_valor || ''))) categoryAttributes[ar.codigo_base] = ar.valor_numero == null ? '' : String(ar.valor_numero);
            else categoryAttributes[ar.codigo_base] = ar.valor_texto || '';
        }

        const careRows = await q(conn, `SELECT cc.codigo FROM producto_cuidados pc JOIN cuidados_catalogo cc ON cc.id=pc.cuidado_id
            WHERE pc.producto_id=? AND cc.activo=1 ORDER BY cc.categoria,cc.orden,cc.nombre`, [productoId]);
        const customCareRows = await q(conn, `SELECT texto FROM producto_cuidados_personalizados WHERE producto_id=? AND activo=1 ORDER BY orden,id`, [productoId]);
        const detailRows = await q(conn, `SELECT titulo,detalle FROM producto_detalles_adicionales WHERE producto_id=? AND activo=1 ORDER BY orden,id`, [productoId]);

        const presRows = await q(conn, `SELECT id,nombre,orden FROM producto_presentaciones WHERE producto_id=? AND activo=1 ORDER BY orden,id`, [productoId]);
        const presentations = [];
        let sizeSystem = 'US';
        for (const pr of presRows) {
            const imgs = await q(conn, `SELECT id,ruta_imagen,orden,es_principal FROM producto_imagenes WHERE presentacion_id=? ORDER BY orden,id`, [pr.id]);
            const vars = await q(conn, `SELECT id,precio,stock,orden FROM producto_variantes WHERE producto_id=? AND presentacion_id=? AND activo=1 ORDER BY orden,id`, [productoId, pr.id]);
            const presentation = { id: Number(pr.id), color: pr.nombre || '', files: [], existingImages: imgs.map(x => ({id:Number(x.id),ruta_imagen:x.ruta_imagen,orden:Number(x.orden||0),es_principal:Number(x.es_principal||0)})), audiences:{} };
            let hasSizes = false;
            for (const vr of vars) {
                const dims = await q(conn, `SELECT dimension_codigo,valor_texto,tallaje_sistema_codigo FROM producto_variante_dimensiones WHERE variante_id=?`, [vr.id]);
                const pub = normalizeAudience(dims.find(x => x.dimension_codigo === 'publico')?.valor_texto || 'general');
                const tallaDim = dims.find(x => x.dimension_codigo === 'talla');
                if (tallaDim) {
                    hasSizes = true;
                    const fullSystem = String(tallaDim.tallaje_sistema_codigo || '');
                    if (fullSystem.includes('__')) sizeSystem = fullSystem.split('__').pop() || sizeSystem;
                    (presentation.audiences[pub] ||= {sizes:{}}).sizes[String(tallaDim.valor_texto || '')] = {price:String(vr.precio),stock:String(vr.stock)};
                } else {
                    presentation.price = String(vr.precio);
                    presentation.stock = String(vr.stock);
                }
            }
            if (!hasSizes && presentation.price == null && vars[0]) {
                presentation.price = String(vars[0].precio); presentation.stock = String(vars[0].stock);
            }
            presentations.push(presentation);
        }

        res.json({
            producto,
            wizard: {
                nombre: producto.nombre || '', marca: producto.marca || '', modelo: producto.modelo || '', condicion: producto.condicion || 'Nuevo',
                descripcion: producto.descripcion || '', garantiaDias: producto.garantia_dias, sinGarantia: Number(producto.sin_garantia) === 1,
                categoryPath, categoryAttributes,
                cuidados: careRows.map(x => x.codigo),
                cuidadosPersonalizados: customCareRows.map(x => x.texto),
                detallesAdicionales: detailRows,
                sizeSystem,
                variants: presentations
            }
        });
    } catch (error) {
        console.error("Error al cargar producto completo para edición:", error);
        res.status(500).json({ mensaje: "No se pudo cargar el producto para editar" });
    } finally { conn.release(); }
});

// PUT vendedor — edición completa usando el mismo modelo del formulario de alta.
router.put("/vendedor/:id/editar", verificarToken, sellerOnly, uploadSellerProducts.any(), async (req, res) => {
    const productoId = Number(req.params.id);
    if (!productoId) return res.status(400).json({ mensaje: "Producto no válido" });
    let item;
    try { item = JSON.parse(req.body.payload || '{}'); }
    catch (_) { return res.status(400).json({ mensaje: "Datos de edición no válidos" }); }

    const nombre = String(item.nombre || '').trim();
    const categoryPath = Array.isArray(item.categoryPath) ? item.categoryPath.map(x=>String(x||'').trim()).filter(Boolean) : [];
    const presentations = Array.isArray(item.variants) ? item.variants : [];
    if (!nombre || !categoryPath.length) return res.status(400).json({ mensaje: "Nombre y categoría son obligatorios" });
    if (!presentations.length) return res.status(400).json({ mensaje: "Agrega al menos una presentación" });

    const filesByField = {};
    for (const file of (req.files || [])) (filesByField[file.fieldname] ||= []).push(file);
    const conn = await getConnection().catch(() => null);
    if (!conn) return res.status(500).json({ mensaje: "No se pudo conectar con la base de datos" });
    const savedFiles = [];
    try {
        const own = await q(conn, `SELECT p.id,p.vendedor_id,p.publicado,p.estado_visual,p.estado_publicacion FROM productos p
            INNER JOIN vendedores v ON v.id=p.vendedor_id WHERE p.id=? AND v.usuario_id=? LIMIT 1`, [productoId, req.usuario.id]);
        if (!own.length) return res.status(404).json({ mensaje: "Producto no encontrado en tu tienda" });
        const vendedorId = Number(own[0].vendedor_id);

        // Resolver la categoría nueva por ruta completa.
        let parentId = null, categoriaId = null;
        for (const segment of categoryPath) {
            const rows = parentId == null
                ? await q(conn, `SELECT id FROM categories WHERE name=? AND parent_id IS NULL AND activo=1 LIMIT 1`, [segment])
                : await q(conn, `SELECT id FROM categories WHERE name=? AND parent_id=? AND activo=1 LIMIT 1`, [segment,parentId]);
            if (!rows.length) throw new Error(`Categoría no encontrada (${segment})`);
            categoriaId = Number(rows[0].id); parentId = categoriaId;
        }

        const allPrices=[]; let totalStock=0;
        for (const pres of presentations) {
            const audienceEntries=Object.entries(pres.audiences||{});
            const hasSizes=audienceEntries.some(([,a])=>Object.keys(a?.sizes||{}).length);
            if (hasSizes) {
                for (const [,a] of audienceEntries) for (const d of Object.values(a?.sizes||{})) {
                    const price=Number(d?.price),stock=Number(d?.stock);
                    if (Number.isFinite(price)&&price>0) allPrices.push(price);
                    totalStock += Number.isInteger(stock)&&stock>=0 ? stock : 0;
                }
            } else {
                const price=Number(pres.price),stock=Number(pres.stock);
                if (Number.isFinite(price)&&price>0) allPrices.push(price);
                totalStock += Number.isInteger(stock)&&stock>=0 ? stock : 0;
            }
        }
        if (!allPrices.length) throw new Error('Falta un precio válido');
        const minPrice=Math.min(...allPrices);
        await begin(conn);

        // Atributos: se reemplaza la configuración actual por la del formulario.
        const oldAttrs = await q(conn, `SELECT id FROM producto_atributos WHERE producto_id=?`, [productoId]);
        for (const a of oldAttrs) await q(conn, `DELETE FROM producto_atributo_opciones WHERE producto_atributo_id=?`, [a.id]);
        await q(conn, `DELETE FROM producto_atributos WHERE producto_id=?`, [productoId]);
        const attrRows = await q(conn, `SELECT a.id,a.codigo_base,a.tipo_valor FROM categoria_perfiles cp
            JOIN perfil_atributos pa ON pa.perfil_clave=cp.perfil_clave JOIN atributos a ON a.id=pa.atributo_id WHERE cp.categoria_id=?`, [categoriaId]);
        const attrs=item.categoryAttributes||{};
        for (const attr of attrRows) {
            const direct=Object.prototype.hasOwnProperty.call(attrs,attr.codigo_base)?attr.codigo_base:null;
            const key=direct||Object.keys(attrs).find(k=>k.endsWith(`::${attr.codigo_base}`));
            if (!key) continue; const raw=attrs[key];
            if (raw===''||raw==null||(Array.isArray(raw)&&!raw.length)) continue;
            if (Array.isArray(raw)) {
                const pa=await q(conn,`INSERT INTO producto_atributos (producto_id,atributo_id) VALUES (?,?)`,[productoId,attr.id]);
                for(const val of raw){const op=await q(conn,`SELECT id FROM atributo_opciones WHERE atributo_id=? AND (valor=? OR etiqueta=?) LIMIT 1`,[attr.id,String(val),String(val)]);if(op.length)await q(conn,`INSERT IGNORE INTO producto_atributo_opciones (producto_atributo_id,opcion_id) VALUES (?,?)`,[pa.insertId,op[0].id]);}
            } else {
                const numberLike=['decimal','entero'].includes(String(attr.tipo_valor));
                const op=await q(conn,`SELECT id FROM atributo_opciones WHERE atributo_id=? AND (valor=? OR etiqueta=?) LIMIT 1`,[attr.id,String(raw),String(raw)]);
                await q(conn,`INSERT INTO producto_atributos (producto_id,atributo_id,valor_texto,valor_numero,opcion_id) VALUES (?,?,?,?,?)`,[productoId,attr.id,numberLike?null:String(raw),numberLike&&Number.isFinite(Number(raw))?Number(raw):null,op[0]?.id||null]);
            }
        }

        await q(conn, `DELETE FROM producto_cuidados WHERE producto_id=?`, [productoId]);
        for (const codigo of [...new Set((item.cuidados||[]).map(x=>String(x||'').trim()).filter(Boolean))]) {
            const care=await q(conn,`SELECT id FROM cuidados_catalogo WHERE codigo=? AND activo=1 LIMIT 1`,[codigo]);
            if(care.length)await q(conn,`INSERT IGNORE INTO producto_cuidados (producto_id,cuidado_id) VALUES (?,?)`,[productoId,care[0].id]);
        }
        await q(conn, `DELETE FROM producto_cuidados_personalizados WHERE producto_id=?`, [productoId]);
        let ord=1; for(const raw of (item.cuidadosPersonalizados||[])){const texto=String(raw||'').trim().slice(0,300);if(texto)await q(conn,`INSERT INTO producto_cuidados_personalizados (producto_id,texto,orden,activo) VALUES (?,?,?,1)`,[productoId,texto,ord++]);}
        await q(conn, `DELETE FROM producto_detalles_adicionales WHERE producto_id=?`, [productoId]);
        ord=1; for(const d of (item.detallesAdicionales||[])){const titulo=String(d?.titulo||'').trim(),detalle=String(d?.detalle||'').trim();if(titulo||detalle)await q(conn,`INSERT INTO producto_detalles_adicionales (producto_id,titulo,detalle,orden,activo) VALUES (?,?,?,?,1)`,[productoId,titulo||'Detalle',detalle,ord++]);}

        // Desactivar la estructura anterior: preserva referencias históricas de pedidos y crea la versión activa nueva.
        await q(conn, `UPDATE producto_variantes SET activo=0 WHERE producto_id=?`, [productoId]);
        await q(conn, `UPDATE producto_presentaciones SET activo=0 WHERE producto_id=?`, [productoId]);
        const tallaRows=await q(conn,`SELECT perfil_clave FROM categoria_tallaje WHERE categoria_id=? LIMIT 1`,[categoriaId]);
        const tallaProfile=tallaRows[0]?.perfil_clave||null,sizeSystem=String(item.sizeSystem||'').trim(),sizeDbSystem=tallaProfile&&sizeSystem?`${tallaProfile}__${sizeSystem}`:null;
        let firstImagePath=null;
        for(let vi=0;vi<presentations.length;vi++){
            const pres=presentations[vi]||{},presName=String(pres.color||`Presentación ${vi+1}`).trim();
            if(!presName)throw new Error(`Presentación ${vi+1} sin nombre`);
            const pr=await q(conn,`INSERT INTO producto_presentaciones (producto_id,nombre,orden,activo) VALUES (?,?,?,1)`,[productoId,presName,vi+1]);
            const presentacionId=Number(pr.insertId);
            const retained=Array.isArray(pres.existingImages)?pres.existingImages.map(x=>String(x?.ruta_imagen||x||'').trim()).filter(Boolean):[];
            const uploads=filesByField[`image_0_${vi}`]||[];
            if(retained.length+uploads.length<1)throw new Error(`Presentación ${vi+1} requiere al menos una imagen`);
            if(retained.length+uploads.length>5)throw new Error(`Presentación ${vi+1}: máximo 5 imágenes`);
            let imageOrder=1;
            for(const webPath of retained){if(!firstImagePath)firstImagePath=webPath;await q(conn,`INSERT INTO producto_imagenes (presentacion_id,ruta_imagen,orden,es_principal,texto_alt) VALUES (?,?,?,?,?)`,[presentacionId,webPath,imageOrder,imageOrder===1?1:0,`${nombre} - ${presName}`]);imageOrder++;}
            for(const f of uploads){const finalName=`${Date.now()}_${crypto.randomUUID()}${safeFileExt(f)}`,finalPath=path.join(PRODUCT_UPLOAD_DIR,finalName);fs.renameSync(f.path,finalPath);savedFiles.push(finalPath);const webPath=`/uploads/productos/${finalName}`;if(!firstImagePath)firstImagePath=webPath;await q(conn,`INSERT INTO producto_imagenes (presentacion_id,ruta_imagen,orden,es_principal,texto_alt) VALUES (?,?,?,?,?)`,[presentacionId,webPath,imageOrder,imageOrder===1?1:0,`${nombre} - ${presName}`]);imageOrder++;}
            const audienceEntries=Object.entries(pres.audiences||{}),hasSizes=audienceEntries.some(([,a])=>Object.keys(a?.sizes||{}).length);
            if(hasSizes){for(const [audKey,aud] of audienceEntries){for(const [size,d] of Object.entries(aud?.sizes||{})){const price=Number(d?.price),stock=Number(d?.stock);if(!(price>0)||!Number.isInteger(stock)||stock<0)throw new Error(`Variante ${presName}/${size} incompleta`);const hash=crypto.createHash('sha256').update(`publico=${audKey}|talla=${sizeDbSystem||sizeSystem}:${size}`).digest('hex');const vr=await q(conn,`INSERT INTO producto_variantes (producto_id,presentacion_id,clave_combinacion,precio,stock,activo,orden) VALUES (?,?,?,?,?,1,?)`,[productoId,presentacionId,hash,price,stock,vi+1]);const varianteId=Number(vr.insertId);await q(conn,`INSERT INTO producto_variante_dimensiones (variante_id,dimension_codigo,valor_texto) VALUES (?,?,?)`,[varianteId,'publico',normalizeAudience(audKey)]);if(sizeDbSystem){const tv=await q(conn,`SELECT id FROM tallaje_valores WHERE sistema_codigo=? AND publico=? AND valor=? LIMIT 1`,[sizeDbSystem,normalizeAudience(audKey),String(size)]);await q(conn,`INSERT INTO producto_variante_dimensiones (variante_id,dimension_codigo,valor_texto,tallaje_sistema_codigo,tallaje_valor_id) VALUES (?,?,?,?,?)`,[varianteId,'talla',String(size),sizeDbSystem,tv[0]?.id||null]);}else await q(conn,`INSERT INTO producto_variante_dimensiones (variante_id,dimension_codigo,valor_texto) VALUES (?,?,?)`,[varianteId,'talla',String(size)]);}}}
            else{const price=Number(pres.price),stock=Number(pres.stock);if(!(price>0)||!Number.isInteger(stock)||stock<0)throw new Error(`Presentación ${presName} incompleta`);const hash=crypto.createHash('sha256').update(`presentacion=${presentacionId}`).digest('hex');await q(conn,`INSERT INTO producto_variantes (producto_id,presentacion_id,clave_combinacion,precio,stock,activo,orden) VALUES (?,?,?,?,?,1,?)`,[productoId,presentacionId,hash,price,stock,vi+1]);}
        }
        const sinGarantia=item.sinGarantia?1:0,garantia=sinGarantia?null:(Number(item.garantiaDias)||null),disponibilidad=totalStock>0?'Disponible':'Agotado';
        let estadoVisual=Number(own[0].publicado)===1?(totalStock>0?'auto':own[0].estado_visual):'oculto';
        await q(conn,`UPDATE productos SET nombre=?,descripcion=?,precio=?,stock=?,categoria=?,categoria_id=?,marca=?,modelo=?,condicion=?,garantia_dias=?,sin_garantia=?,imagen=?,disponibilidad=?,estado_visual=?,fecha_actualizacion=NOW() WHERE id=? AND vendedor_id=?`,[nombre,String(item.descripcion||'').trim()||null,minPrice,totalStock,categoryPath[categoryPath.length-1],categoriaId,String(item.marca||'').trim()||null,String(item.modelo||'').trim()||null,String(item.condicion||'Nuevo').trim()||'Nuevo',garantia,sinGarantia,firstImagePath,disponibilidad,estadoVisual,productoId,vendedorId]);
        await sincronizarInventarioCantidadProducto(conn, productoId, vendedorId);
        await commit(conn);
        res.json({mensaje:'Producto actualizado correctamente',producto_id:productoId,precio:minPrice,stock:totalStock});
    } catch(error){await rollback(conn);for(const f of savedFiles){try{fs.unlinkSync(f)}catch(_){}}for(const file of(req.files||[])){try{if(fs.existsSync(file.path))fs.unlinkSync(file.path)}catch(_){}}console.error('Error al editar producto completo del vendedor:',error);res.status(400).json({mensaje:error.message||'No se pudo actualizar el producto'});}
    finally{conn.release();}
});

// GET — unidades físicas de un producto
router.get("/:id/inventario-fisico", verificarToken, (req, res) => {
    const sql = `
        SELECT
            inv.id,
            inv.producto_id,
            inv.codigo_barra,
            inv.codigo_producto,
            inv.estado,
            inv.pedido_id,
            pedidos.codigo_pedido,
            inv.fecha_ingreso,
            inv.fecha_venta,
            inv.proveedor,
            inv.proveedor_url,
            inv.numero_orden,
            inv.precio_compra,
            inv.fecha_compra,
            inv.garantia_hasta,
            inv.notas,
            COALESCE(inv.publicado, 0) AS publicado
        FROM inventario_fisico inv
        LEFT JOIN pedidos ON pedidos.id = inv.pedido_id
        WHERE inv.producto_id = ?
        ORDER BY inv.id DESC
    `;

    db.query(sql, [req.params.id], (error, unidades) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ mensaje: "Error al obtener inventario físico" });
        }

        res.json(unidades);
    });
});

// POST — agregar una unidad física escaneada
router.post("/:id/inventario-fisico", verificarToken, (req, res) => {
    const productoId = Number(req.params.id);
    const codigoBarra = String(req.body.codigo_barra || "").trim();
    const codigoProducto = String(req.body.codigo_producto || codigoBarra).trim();

    const proveedor = String(req.body.proveedor || "").trim() || null;
    const proveedorUrl = String(req.body.proveedor_url || "").trim() || null;
    const numeroOrden = String(req.body.numero_orden || "").trim() || null;
    const precioCompra = Number(req.body.precio_compra || 0);
    const fechaCompra = req.body.fecha_compra || null;
    const garantiaHasta = req.body.garantia_hasta || null;
    const notas = String(req.body.notas || "").trim() || null;

    if (!productoId || !codigoBarra) {
        return res.status(400).json({ mensaje: "Producto y código de barra son obligatorios" });
    }

    const sql = `
        INSERT INTO inventario_fisico
        (
            producto_id, codigo_barra, codigo_producto, estado,
            proveedor, proveedor_url, numero_orden, precio_compra,
            fecha_compra, garantia_hasta, notas, publicado
        )
        VALUES (?, ?, ?, 'disponible', ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    db.query(sql, [
        productoId,
        codigoBarra,
        codigoProducto,
        proveedor,
        proveedorUrl,
        numeroOrden,
        precioCompra,
        fechaCompra,
        garantiaHasta,
        notas
    ], (error) => {
        if (error) {
            console.error(error);
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(400).json({ mensaje: "Ese código ya existe en el inventario" });
            }
            return res.status(500).json({ mensaje: "Error al guardar unidad física" });
        }

        db.query(`
            UPDATE productos
            SET stock = (
                SELECT COUNT(*)
                FROM inventario_fisico
                WHERE producto_id = ? AND estado = 'disponible'
            )
            WHERE id = ?
        `, [productoId, productoId]);

        res.json({ mensaje: "Unidad física agregada correctamente", codigo_producto: codigoProducto });
    });
});


// PUT — publicar u ocultar todas las unidades disponibles de un producto
router.put("/:id/inventario-fisico/publicacion", verificarToken, (req, res) => {
    const productoId = Number(req.params.id);
    const publicar = Number(req.body.publicado || 0) === 1 ? 1 : 0;

    if (!productoId) {
        return res.status(400).json({ mensaje: "Producto no válido" });
    }

    db.query(
        `UPDATE inventario_fisico
         SET publicado = ?
         WHERE producto_id = ? AND estado = 'disponible'`,
        [publicar, productoId],
        (error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ mensaje: "Error al actualizar publicación del inventario" });
            }

            db.query(
                `SELECT COUNT(*) AS publicadas
                 FROM inventario_fisico
                 WHERE producto_id = ? AND estado = 'disponible' AND COALESCE(publicado, 0) = 1`,
                [productoId],
                (errorConteo, conteo) => {
                    if (errorConteo) {
                        console.error(errorConteo);
                        return res.status(500).json({ mensaje: "Unidades actualizadas, pero no se pudo sincronizar el producto" });
                    }

                    const productoPublicado = Number(conteo[0]?.publicadas || 0) > 0 ? 1 : 0;

                    db.query(
                        `UPDATE productos
                         SET publicado = ?, estado = 'activo', disponibilidad = 'Disponible', estado_visual = 'auto'
                         WHERE id = ?`,
                        [productoPublicado, productoId],
                        (errorProducto) => {
                            if (errorProducto) {
                                console.error(errorProducto);
                                return res.status(500).json({ mensaje: "Unidades actualizadas, pero no se pudo sincronizar el producto" });
                            }

                            res.json({
                                mensaje: publicar
                                    ? "Producto publicado con sus unidades disponibles"
                                    : "Producto ocultado de la vista del cliente",
                                publicado: productoPublicado
                            });
                        }
                    );
                }
            );
        }
    );
});

// PUT — publicar u ocultar una unidad física específica
router.put("/inventario-fisico/unidad/:unidadId/publicacion", verificarToken, (req, res) => {
    const unidadId = Number(req.params.unidadId);
    const publicar = Number(req.body.publicado || 0) === 1 ? 1 : 0;

    if (!unidadId) {
        return res.status(400).json({ mensaje: "Unidad no válida" });
    }

    db.query(
        `SELECT id, producto_id, estado
         FROM inventario_fisico
         WHERE id = ?
         LIMIT 1`,
        [unidadId],
        (errorBuscar, unidades) => {
            if (errorBuscar) {
                console.error(errorBuscar);
                return res.status(500).json({ mensaje: "Error al buscar unidad" });
            }

            if (!unidades.length) {
                return res.status(404).json({ mensaje: "Unidad no encontrada" });
            }

            const unidad = unidades[0];

            if (publicar === 1 && unidad.estado !== "disponible") {
                return res.status(400).json({ mensaje: "Solo se pueden publicar unidades disponibles" });
            }

            db.query(
                `UPDATE inventario_fisico
                 SET publicado = ?
                 WHERE id = ?`,
                [publicar, unidadId],
                (errorUpdate) => {
                    if (errorUpdate) {
                        console.error(errorUpdate);
                        return res.status(500).json({ mensaje: "Error al actualizar unidad" });
                    }

                    db.query(
                        `SELECT COUNT(*) AS publicadas
                         FROM inventario_fisico
                         WHERE producto_id = ? AND estado = 'disponible' AND COALESCE(publicado, 0) = 1`,
                        [unidad.producto_id],
                        (errorConteo, conteo) => {
                            if (errorConteo) {
                                console.error(errorConteo);
                                return res.status(500).json({ mensaje: "Unidad actualizada, pero no se pudo sincronizar producto" });
                            }

                            const productoPublicado = Number(conteo[0]?.publicadas || 0) > 0 ? 1 : 0;

                            db.query(
                                `UPDATE productos
                                 SET publicado = ?, estado = 'activo', disponibilidad = 'Disponible', estado_visual = 'auto'
                                 WHERE id = ?`,
                                [productoPublicado, unidad.producto_id],
                                (errorProducto) => {
                                    if (errorProducto) {
                                        console.error(errorProducto);
                                        return res.status(500).json({ mensaje: "Unidad actualizada, pero no se pudo sincronizar producto" });
                                    }

                                    res.json({
                                        mensaje: publicar ? "Unidad publicada" : "Unidad oculta",
                                        publicado: publicar,
                                        producto_publicado: productoPublicado
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});


// PUT — publicar, ocultar o dejar en revisión/bloquear producto completo
// Preparado para marketplace: el administrador puede intervenir cualquier publicación.
// En el futuro, cuando existan vendedores externos, aquí se validará que el vendedor solo cambie sus productos.
router.put("/:id/publicacion", verificarToken, (req, res) => {
    const productoId = Number(req.params.id);
    const publicado = Number(req.body.publicado || 0) === 1 ? 1 : 0;
    const estadoModeracion = String(req.body.estado_visual || "").toLowerCase().trim();

    if (!productoId) {
        return res.status(400).json({ mensaje: "Producto no válido" });
    }

    let estadoVisual = publicado ? "auto" : "oculto";
    let estado = publicado ? "activo" : "oculto";
    let disponibilidad = publicado ? "Disponible" : "Agotado";

    if (estadoModeracion === "en_revision" || estadoModeracion === "en revisión") {
        estadoVisual = "en_revision";
        estado = "revision";
        disponibilidad = "Agotado";
    }

    if (estadoModeracion === "bloqueado") {
        estadoVisual = "bloqueado";
        estado = "bloqueado";
        disponibilidad = "Agotado";
    }

    db.query(
        `UPDATE productos
         SET publicado = ?, estado = ?, estado_visual = ?, disponibilidad = ?
         WHERE id = ?`,
        [publicado, estado, estadoVisual, disponibilidad, productoId],
        (error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ mensaje: "Error al actualizar publicación del producto" });
            }

            db.query(
                `UPDATE inventario_fisico
                 SET publicado = ?
                 WHERE producto_id = ? AND estado = 'disponible'`,
                [publicado, productoId],
                (errorInv) => {
                    if (errorInv) {
                        console.error(errorInv);
                        return res.status(500).json({ mensaje: "Producto actualizado, pero no se pudo sincronizar el inventario" });
                    }

                    res.json({
                        mensaje: publicado ? "Producto publicado" : "Producto ocultado",
                        publicado,
                        estado_visual: estadoVisual
                    });
                }
            );
        }
    );
});

// GET por ID
router.get("/:id", verificarToken, (req, res) => {
    const sql = "SELECT * FROM productos WHERE id = ?";

    db.query(sql, [req.params.id], (error, resultado) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ mensaje: "Error al buscar producto" });
        }

        if (!resultado[0]) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        res.json(resultado[0]);
    });
});

// POST — agregar producto
router.post("/", verificarToken, (req, res) => {
    const {
        nombre, descripcion, precio, descuento, imagen,
        stock, categoria, genero, marca, modelo, condicion,
        sku, codigo_barras, color, talla, disponibilidad,
        proveedor, pais_origen, precio_compra, costo_envio,
        costo_aduana, tiempo_entrega, tipo_venta,
        publicado, stock_minimo, permite_bajo_pedido, estado_visual
    } = req.body;

    if (!nombre || !precio) {
        return res.status(400).json({ mensaje: "Nombre y precio son obligatorios" });
    }

    const precioVenta = parseFloat(precio) || 0;
    const compra = parseFloat(precio_compra) || 0;
    const envio = parseFloat(costo_envio) || 0;
    const aduana = parseFloat(costo_aduana) || 0;

    const costo_total = compra + envio + aduana;
    const ganancia_estimada = precioVenta - costo_total;
    const margen_ganancia = precioVenta > 0
        ? ((ganancia_estimada / precioVenta) * 100).toFixed(2)
        : 0;

    const publicadoFinal = publicado === undefined ? 1 : Number(publicado);

    const estadoVisual = calcularEstadoVisual({
        stock,
        tipo_venta,
        disponibilidad,
        permite_bajo_pedido,
        estado_visual,
        publicado: publicadoFinal
    });

    const sql = `
        INSERT INTO productos
        (
            nombre, descripcion, precio, descuento, imagen, stock, categoria,
            genero, marca, modelo, condicion, sku, codigo_barras, color, talla,
            disponibilidad, proveedor, pais_origen, precio_compra, costo_envio,
            costo_aduana, costo_total, ganancia_estimada, margen_ganancia,
            tiempo_entrega, tipo_venta, publicado, stock_minimo, permite_bajo_pedido, estado_visual
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        nombre,
        descripcion || null,
        precioVenta,
        descuento || 0,
        imagen || null,
        stock || 0,
        categoria || null,
        genero || null,
        marca || null,
        modelo || null,
        condicion || "Nuevo",
        sku || null,
        codigo_barras || null,
        color || null,
        talla || null,
        disponibilidad || "Disponible",
        proveedor || null,
        pais_origen || null,
        compra,
        envio,
        aduana,
        costo_total,
        ganancia_estimada,
        margen_ganancia,
        tiempo_entrega || null,
        tipo_venta || "stock",
        publicadoFinal,
        stock_minimo || 0,
        permite_bajo_pedido || 0,
        estadoVisual
    ], (error, result) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ mensaje: "Error al agregar producto" });
        }

        res.json({
            mensaje: "Producto agregado correctamente 🚀",
            id: result.insertId,
            producto_id: result.insertId,
            producto: { id: result.insertId }
        });
    });
});

// PUT — editar producto
router.put("/:id", verificarToken, (req, res) => {
    const {
        nombre, descripcion, precio, descuento, imagen,
        stock, categoria, genero, estado, marca, modelo,
        condicion, sku, codigo_barras, color, talla, disponibilidad,
        proveedor, pais_origen, precio_compra, costo_envio,
        costo_aduana, tiempo_entrega, tipo_venta,
        publicado, stock_minimo, permite_bajo_pedido, estado_visual
    } = req.body;

    const precioVenta = parseFloat(precio) || 0;
    const compra = parseFloat(precio_compra) || 0;
    const envio = parseFloat(costo_envio) || 0;
    const aduana = parseFloat(costo_aduana) || 0;

    const costo_total = compra + envio + aduana;
    const ganancia_estimada = precioVenta - costo_total;
    const margen_ganancia = precioVenta > 0
        ? ((ganancia_estimada / precioVenta) * 100).toFixed(2)
        : 0;

    const publicadoFinal = publicado === undefined ? 1 : Number(publicado);

    const estadoVisual = calcularEstadoVisual({
        stock,
        tipo_venta,
        disponibilidad,
        permite_bajo_pedido,
        estado_visual,
        publicado: publicadoFinal
    });

    const sql = `
        UPDATE productos
        SET 
            nombre=?,
            descripcion=?,
            precio=?,
            descuento=?,
            imagen=?,
            stock=?,
            categoria=?,
            genero=?,
            estado=COALESCE(?, estado),
            marca=?,
            modelo=?,
            condicion=?,
            sku=?,
            codigo_barras=?,
            color=?,
            talla=?,
            disponibilidad=?,
            proveedor=?,
            pais_origen=?,
            precio_compra=?,
            costo_envio=?,
            costo_aduana=?,
            costo_total=?,
            ganancia_estimada=?,
            margen_ganancia=?,
            tiempo_entrega=?,
            tipo_venta=?,
            publicado=?,
            stock_minimo=?,
            permite_bajo_pedido=?,
            estado_visual=?
        WHERE id=?
    `;

    db.query(sql, [
        nombre,
        descripcion || null,
        precioVenta,
        descuento || 0,
        imagen || null,
        stock || 0,
        categoria || null,
        genero || null,
        estado || null,
        marca || null,
        modelo || null,
        condicion || "Nuevo",
        sku || null,
        codigo_barras || null,
        color || null,
        talla || null,
        disponibilidad || "Disponible",
        proveedor || null,
        pais_origen || null,
        compra,
        envio,
        aduana,
        costo_total,
        ganancia_estimada,
        margen_ganancia,
        tiempo_entrega || null,
        tipo_venta || "stock",
        publicadoFinal,
        stock_minimo || 0,
        permite_bajo_pedido || 0,
        estadoVisual,
        req.params.id
    ], (error) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ mensaje: "Error al editar producto" });
        }

        res.json({ mensaje: "Producto actualizado correctamente" });
    });
});

// DELETE — ocultar/eliminar producto del catálogo interno
// No borra físicamente el registro para no romper pedidos, facturas, devoluciones o inventario asociado.
router.delete("/:id", verificarToken, (req, res) => {
    const productoId = Number(req.params.id);

    if (!productoId) {
        return res.status(400).json({ mensaje: "Producto no válido" });
    }

    db.query(
        `UPDATE inventario_fisico SET publicado = 0 WHERE producto_id = ?`,
        [productoId],
        (errorInv) => {
            if (errorInv) {
                console.error(errorInv);
                return res.status(500).json({ mensaje: "No se pudo ocultar el inventario del producto" });
            }

            db.query(
                `UPDATE productos
                 SET publicado = 0, estado = 'eliminado', estado_visual = 'oculto', disponibilidad = 'Agotado'
                 WHERE id = ?`,
                [productoId],
                (error) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).json({ mensaje: "Error al eliminar producto" });
                    }

                    res.json({ mensaje: "Producto eliminado del catálogo correctamente" });
                }
            );
        }
    );
});

module.exports = router;
