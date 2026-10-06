const jwt = require("jsonwebtoken");

/**
 * Middleware: verifica que el request tenga un JWT válido.
 * Uso: router.get("/ruta", verificarToken, handler)
 * Uso solo admin: router.get("/ruta", verificarToken, soloAdmin, handler)
 */
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ mensaje: "Token requerido" });
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    try {
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verificado;
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: "Token inválido o expirado" });
    }
};

/**
 * Middleware: permite solo al rol 'admin' o 'dueño'.
 * Siempre se usa DESPUÉS de verificarToken.
 */
const soloAdmin = (req, res, next) => {
    const rolesPermitidos = ["admin", "dueño"];
    const rol = String(req.usuario?.rol || "").toLowerCase();

    // Un token de la tienda pública nunca debe autorizar operaciones del panel,
    // aunque el contenido del navegador sea manipulado.
    if (req.usuario?.portal !== "panel" || !rolesPermitidos.includes(rol)) {
        return res.status(403).json({ mensaje: "Acceso denegado: se requiere sesión autorizada del panel" });
    }

    next();
};

const soloPanel = (req, res, next) => {
    const rolesPermitidos = ["admin", "dueño", "empleado"];
    const rol = String(req.usuario?.rol || "").toLowerCase();

    if (req.usuario?.portal !== "panel" || !rolesPermitidos.includes(rol)) {
        return res.status(403).json({ mensaje: "Acceso denegado: se requiere sesión del panel" });
    }

    next();
};

module.exports = { verificarToken, soloAdmin, soloPanel };
