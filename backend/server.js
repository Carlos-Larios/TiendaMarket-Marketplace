require("dotenv").config();          // ← SIEMPRE primera línea

const express          = require("express");
const cors             = require("cors");
const db               = require("./db");
const path             = require("path");

const authRoutes       = require("./routes/auth");
const productosRoutes  = require("./routes/productos");
const categoriasRoutes = require("./routes/categorias");
const usuariosRoutes   = require("./routes/usuarios");
const pedidosRoutes    = require("./routes/pedidos");
const dashboardRoutes  = require("./routes/dashboard");
const analiticasRoutes = require("./routes/analiticas");
const ventasRoutes     = require("./routes/ventas");
const facturasRoutes   = require("./routes/facturas");
const devolucionesRoutes = require("./routes/devoluciones");
const vendedoresRoutes = require("./routes/vendedores");
const configuracionRoutes = require("./routes/configuracion");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Rutas ────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/productos",  productosRoutes);

// Compatibilidad temporal con versiones anteriores del panel de vendedor.
// Ej.: /api/p_vendedor/3/editar -> /api/productos/vendedor/3/editar
// Mantiene los mismos middlewares de autenticación/propiedad definidos en productosRoutes.
app.use("/api/p_vendedor", (req, res, next) => {
    req.url = `/vendedor${req.url}`;
    return productosRoutes(req, res, next);
});
app.use("/api/categorias", categoriasRoutes);
app.use("/api/usuarios",   usuariosRoutes);
app.use("/api/pedidos",    pedidosRoutes);
app.use("/api/dashboard",  dashboardRoutes);
app.use("/api/analiticas", analiticasRoutes);
app.use("/api/ventas",     ventasRoutes);
app.use("/api/facturas",   facturasRoutes);
app.use("/api/devoluciones", devolucionesRoutes);
app.use("/api/vendedores", vendedoresRoutes);
app.use("/api/configuracion", configuracionRoutes);

// ── Diagnóstico ──────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ mensaje: "Servidor funcionando correctamente 🚀" });
});

// ── Iniciar ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📱 Desde el teléfono: http://192.168.1.188:${PORT}`);
});
