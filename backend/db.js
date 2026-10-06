require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
    host:               process.env.DB_HOST     || "localhost",
    user:               process.env.DB_USER     || "root",
    password:           process.env.DB_PASSWORD || "",
    database:           process.env.DB_NAME     || "tienda_online",
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0
});

// Verificar conexión al iniciar
pool.getConnection((error, connection) => {
    if (error) {
        console.error("❌ Error al conectar a MySQL:", error.message);
        return;
    }
    console.log("✅ Pool MySQL conectado correctamente");
    connection.release();
});

module.exports = pool;
