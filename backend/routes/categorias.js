const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { verificarToken, soloAdmin } = require("../middleware/auth.middleware");

function crearSlug(name) {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// GET — cualquier usuario autenticado
router.get("/", verificarToken, (req, res) => {
    const sql = "SELECT * FROM categories ORDER BY parent_id ASC, name ASC";

    db.query(sql, (error, results) => {
        if (error) {
            console.error("Error al obtener categorías:", error);
            return res.status(500).json({ mensaje: "Error al obtener categorías" });
        }

        res.json(results);
    });
});

// POST — solo admin
router.post("/", verificarToken, soloAdmin, (req, res) => {
    const { name, parent_id } = req.body;

    if (!name?.trim()) {
        return res.status(400).json({ mensaje: "El nombre de la categoría es obligatorio" });
    }

    const nombreLimpio = name.trim();
    const slug         = crearSlug(nombreLimpio);

    db.query(
        "INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)",
        [nombreLimpio, slug, parent_id || null],
        (error, result) => {
            if (error) {
                console.error("Error al crear categoría:", error);
                return res.status(500).json({ mensaje: "Error al crear categoría" });
            }

            res.json({
                mensaje: "Categoría creada correctamente",
                categoria: { id: result.insertId, name: nombreLimpio, slug, parent_id: parent_id || null }
            });
        }
    );
});

// POST buscar-o-crear — usuario autenticado del panel
// Se permite sin soloAdmin para evitar bloqueo 403 cuando el panel crea subcategorías automáticamente.
router.post("/buscar-o-crear", verificarToken, (req, res) => {
    const { name, parent_id } = req.body;

    if (!name?.trim()) {
        return res.status(400).json({ mensaje: "El nombre de la categoría es obligatorio" });
    }

    const nombreLimpio = name.trim();
    const parentId     = parent_id || null;

    const buscarSql = `
        SELECT * FROM categories
        WHERE LOWER(name) = LOWER(?)
        AND (
            (parent_id IS NULL AND ? IS NULL)
            OR parent_id = ?
        )
        LIMIT 1
    `;

    db.query(buscarSql, [nombreLimpio, parentId, parentId], (error, results) => {
        if (error) {
            console.error("Error al buscar categoría:", error);
            return res.status(500).json({ mensaje: "Error al buscar categoría" });
        }

        if (results.length > 0) {
            return res.json({ mensaje: "Categoría existente", categoria: results[0] });
        }

        const slug = crearSlug(nombreLimpio);

        db.query(
            "INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)",
            [nombreLimpio, slug, parentId],
            (errorInsert, result) => {
                if (errorInsert) {
                    console.error("Error al crear categoría automáticamente:", errorInsert);
                    return res.status(500).json({ mensaje: "Error al crear categoría" });
                }

                res.json({
                    mensaje: "Categoría creada automáticamente",
                    categoria: { id: result.insertId, name: nombreLimpio, slug, parent_id: parentId }
                });
            }
        );
    });
});

module.exports = router;
