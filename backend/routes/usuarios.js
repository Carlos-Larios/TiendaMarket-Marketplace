const express = require("express");
const router = express.Router();
const db = require("../db");

const { verificarToken } = require("../middleware/auth.middleware");

// GET usuarios con paginación, búsqueda y filtro por rol
router.get("/", verificarToken, (req, res) => {
  const pagina = parseInt(req.query.page) || 1;
  const limite = parseInt(req.query.limit) || 20;
  const busqueda = req.query.search || "";
  const rol = req.query.rol || "";

  const offset = (pagina - 1) * limite;

  let where = "WHERE (nombre LIKE ? OR email LIKE ? OR rol LIKE ? OR id LIKE ?)";
  let valores = [`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`];

  if (rol) {
    where += " AND rol = ?";
    valores.push(rol);
  }

  const sqlTotal = `
    SELECT COUNT(*) AS total
    FROM usuarios
    ${where}
  `;

  const sqlUsuarios = `
    SELECT id, nombre, email, rol, fecha_registro
    FROM usuarios
    ${where}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  db.query(sqlTotal, valores, (errorTotal, totalResult) => {
    if (errorTotal) {
      return res.status(500).json({
        mensaje: "Error al contar usuarios"
      });
    }

    const total = totalResult[0].total;

    db.query(sqlUsuarios, [...valores, limite, offset], (error, results) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al obtener usuarios"
        });
      }

      res.json({
        usuarios: results,
        total,
        pagina,
        totalPaginas: Math.ceil(total / limite)
      });
    });
  });
});

module.exports = router;