const express = require("express");
const router  = express.Router();
const db      = require("../db");
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const { verificarToken } = require("../middleware/auth.middleware");

const ROLES_TIENDA = new Set(["cliente", "vendedor"]);
const ROLES_PANEL = new Set(["admin", "dueño", "empleado"]);

function firmarToken(usuario, portal) {
    // El formulario completo de publicación puede permanecer abierto durante bastante tiempo.
    // Los vendedores reciben una sesión más larga para evitar que el JWT expire mientras
    // preparan imágenes, variantes, tallas y atributos. Panel/clientes conservan el valor general.
    const rol = String(usuario?.rol || "").toLowerCase();
    const expiresIn = rol === "vendedor" && portal === "tienda"
        ? (process.env.JWT_EXPIRES_IN_VENDEDOR || "8h")
        : (process.env.JWT_EXPIRES_IN || "2h");

    return jwt.sign(
        {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            portal
        },
        process.env.JWT_SECRET,
        { expiresIn }
    );
}

function respuestaUsuario(usuario) {
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
    };
}

async function passwordValida(password, hash) {
    try {
        return await bcrypt.compare(password, hash);
    } catch (_) {
        return false;
    }
}

// ── Registro de clientes ────────────────────────────────
router.post("/register", async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Un mismo correo no puede existir a la vez como cuenta pública y cuenta interna.
        // Solo comprobamos existencia; nunca consultamos ni comparamos la contraseña del panel.
        db.query("SELECT id FROM usuarios_panel WHERE email = ? LIMIT 1", [email], (panelError, panelRows) => {
            if (panelError) return res.status(500).json({ mensaje: "Error del servidor" });
            if (panelRows.length) return res.status(400).json({ mensaje: "Este correo no está disponible" });

            // El registro público SIEMPRE crea clientes. Nunca permite elegir un rol privilegiado.
            const sql = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'cliente')";

            db.query(sql, [nombre, email, hashedPassword], (error) => {
                if (error) {
                    if (error.code === "ER_DUP_ENTRY") {
                        return res.status(400).json({ mensaje: "Este correo ya está registrado" });
                    }
                    return res.status(500).json({ mensaje: "Error al registrar usuario" });
                }

                res.json({ mensaje: "Usuario registrado correctamente 🚀" });
            });
        });
    } catch (error) {
        res.status(500).json({ mensaje: "Error del servidor" });
    }
});

// ── Login separados de la TIENDA PÚBLICA ──────────────────
// Cliente y vendedor tienen endpoints independientes. Ninguno consulta usuarios_panel.
function loginTiendaPorRol(rolPermitido) {
    return (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
        }

        db.query(
            "SELECT * FROM usuarios WHERE email = ? AND rol = ? LIMIT 1",
            [email, rolPermitido],
            async (error, results) => {
                if (error) return res.status(500).json({ mensaje: "Error del servidor" });
                if (!results.length) return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });

                const usuario = results[0];
                const correcta = await passwordValida(password, usuario.password);
                if (!correcta) return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });

                const emitir = () => {
                    const token = firmarToken(usuario, "tienda");
                    return res.json({
                        mensaje: "Login exitoso 🚀",
                        token,
                        portal: "tienda",
                        usuario: respuestaUsuario(usuario)
                    });
                };

                if (rolPermitido === "vendedor") {
                    db.query(
                        "SELECT estado FROM vendedores WHERE usuario_id = ? LIMIT 1",
                        [usuario.id],
                        (errVend, rowsVend) => {
                            if (errVend) return res.status(500).json({ mensaje: "Error del servidor" });
                            if (!rowsVend.length) return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });
                            const estado = String(rowsVend[0].estado || "").toLowerCase();
                            if (!["activo", "advertencia"].includes(estado)) {
                                return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });
                            }
                            emitir();
                        }
                    );
                    return;
                }

                emitir();
            }
        );
    };
}

router.post("/login-cliente", loginTiendaPorRol("cliente"));
router.post("/login-vendedor", loginTiendaPorRol("vendedor"));

// ── Login exclusivo del PANEL INTERNO ───────────────────
// Clientes y vendedores jamás reciben un token de panel desde aquí.
router.post("/login-panel", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
    }

    // SEGURIDAD: el login del panel consulta EXCLUSIVAMENTE usuarios_panel.
    // La tabla pública `usuarios` no participa en esta autenticación.
    db.query("SELECT * FROM usuarios_panel WHERE email = ? LIMIT 1", [email], async (error, results) => {
        if (error) return res.status(500).json({ mensaje: "Error del servidor" });
        if (!results.length) return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });

        const usuario = results[0];
        const rol = String(usuario.rol || "").toLowerCase();
        const estado = String(usuario.estado || "activo").toLowerCase();

        if (!ROLES_PANEL.has(rol) || estado !== "activo") {
            return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });
        }

        const correcta = await passwordValida(password, usuario.password);
        if (!correcta) return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });

        const token = firmarToken(usuario, "panel");
        res.json({
            mensaje: "Acceso autorizado",
            token,
            portal: "panel",
            usuario: respuestaUsuario(usuario)
        });
    });
});

// ── Mi cuenta del cliente ─────────────────────────────────
// Solo una sesión de cliente emitida desde la tienda puede consultar estos datos.
router.get("/mi-cuenta", verificarToken, (req, res) => {
    const rol = String(req.usuario?.rol || "").toLowerCase();
    if (req.usuario?.portal !== "tienda" || rol !== "cliente") {
        return res.status(403).json({ mensaje: "Acceso no autorizado" });
    }

    db.query(
        "SELECT id, nombre, email, rol FROM usuarios WHERE id = ? AND rol = 'cliente' LIMIT 1",
        [req.usuario.id],
        (error, rows) => {
            if (error) return res.status(500).json({ mensaje: "Error del servidor" });
            if (!rows.length) return res.status(404).json({ mensaje: "Cuenta no encontrada" });
            res.json({ usuario: rows[0] });
        }
    );
});



// ── Direcciones de entrega del cliente · FASE 82 ─────────────
// Máximo 3 direcciones favoritas. Las direcciones temporales del checkout no se guardan.
const DEPARTAMENTOS_ES = new Set(['Ahuachapán','Cabañas','Chalatenango','Cuscatlán','La Libertad','La Paz','La Unión','Morazán','San Miguel','San Salvador','San Vicente','Santa Ana','Sonsonate','Usulután']);
function validarDireccionCliente(body = {}) {
    const d = {
        nombre_receptor: String(body.nombre_receptor || '').trim(),
        telefono: String(body.telefono || '').trim(),
        departamento: String(body.departamento || '').trim(),
        municipio: String(body.municipio || '').trim(),
        direccion: String(body.direccion || '').trim(),
        referencia: String(body.referencia || '').trim()
    };
    if (!d.nombre_receptor || !d.telefono || !d.departamento || !d.municipio || !d.direccion) return { error: 'Completa los campos obligatorios de la dirección' };
    const telefonoDigitos = d.telefono.replace(/\D/g, '');
    if (!/^503\d{8}$/.test(telefonoDigitos)) return { error: 'Ingresa un número de teléfono válido de 8 dígitos' };
    d.telefono = `+${telefonoDigitos}`;
    if (!DEPARTAMENTOS_ES.has(d.departamento)) return { error: 'Selecciona un departamento válido' };
    return { data: d };
}
function validarClienteTienda(req, res) {
    const rol = String(req.usuario?.rol || '').toLowerCase();
    if (req.usuario?.portal !== 'tienda' || rol !== 'cliente') {
        res.status(403).json({ mensaje: 'Acceso no autorizado' });
        return false;
    }
    return true;
}

router.get('/mis-direcciones', verificarToken, (req, res) => {
    if (!validarClienteTienda(req, res)) return;
    db.query(`SELECT id, usuario_id, nombre_receptor, telefono, departamento, municipio, direccion, referencia, principal
              FROM cliente_direcciones WHERE usuario_id = ? ORDER BY principal DESC, id DESC`, [req.usuario.id], (error, rows) => {
        if (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') return res.status(500).json({ mensaje: 'Falta ejecutar FASE81_DIRECCIONES_CLIENTE.sql' });
            return res.status(500).json({ mensaje: 'Error del servidor' });
        }
        res.json({ direcciones: rows || [], limite: 3 });
    });
});

// Compatibilidad con FASE 81: devuelve la principal o la más reciente.
router.get('/mi-direccion', verificarToken, (req, res) => {
    if (!validarClienteTienda(req, res)) return;
    db.query(`SELECT id, usuario_id, nombre_receptor, telefono, departamento, municipio, direccion, referencia, principal
              FROM cliente_direcciones WHERE usuario_id = ? ORDER BY principal DESC, id DESC LIMIT 1`, [req.usuario.id], (error, rows) => {
        if (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') return res.status(500).json({ mensaje: 'Falta ejecutar FASE81_DIRECCIONES_CLIENTE.sql' });
            return res.status(500).json({ mensaje: 'Error del servidor' });
        }
        if (!rows.length) return res.status(404).json({ mensaje: 'Aún no tienes una dirección de envío' });
        res.json({ direccion: rows[0] });
    });
});

router.post('/mis-direcciones', verificarToken, (req, res) => {
    if (!validarClienteTienda(req, res)) return;
    const v = validarDireccionCliente(req.body); if (v.error) return res.status(400).json({ mensaje: v.error });
    db.query('SELECT COUNT(*) AS total FROM cliente_direcciones WHERE usuario_id = ?', [req.usuario.id], (countErr, rows) => {
        if (countErr) return res.status(500).json({ mensaje: 'No se pudo validar el límite de direcciones' });
        if (Number(rows?.[0]?.total || 0) >= 3) return res.status(409).json({ codigo: 'LIMITE_DIRECCIONES', mensaje: 'Has alcanzado el límite de 3 direcciones guardadas' });
        const d=v.data;
        db.query('SELECT COUNT(*) AS total FROM cliente_direcciones WHERE usuario_id = ? AND principal = 1', [req.usuario.id], (pErr, prow) => {
            if (pErr) return res.status(500).json({ mensaje: 'No se pudo guardar la dirección' });
            const principal = Number(prow?.[0]?.total || 0) === 0 ? 1 : 0;
            db.query(`INSERT INTO cliente_direcciones (usuario_id,nombre_receptor,telefono,departamento,municipio,direccion,referencia,principal)
                      VALUES (?,?,?,?,?,?,?,?)`, [req.usuario.id,d.nombre_receptor,d.telefono,d.departamento,d.municipio,d.direccion,d.referencia||null,principal], (err, result) => {
                if(err) return res.status(500).json({ mensaje:'No se pudo guardar la dirección' });
                const nuevaDireccionId = Number(result?.insertId || 0);
                if(!nuevaDireccionId) return res.status(500).json({ mensaje:'La dirección se guardó, pero no se pudo identificar' });
                db.query(`SELECT id,usuario_id,nombre_receptor,telefono,departamento,municipio,direccion,referencia,principal FROM cliente_direcciones WHERE id=? AND usuario_id=?`,[nuevaDireccionId,req.usuario.id],(rErr,saved)=>{
                    if(rErr||!saved.length) return res.status(500).json({ mensaje:'La dirección se guardó, pero no pudo leerse' });
                    res.status(201).json({ mensaje:'Dirección guardada', direccion:saved[0] });
                });
            });
        });
    });
});

router.put('/mis-direcciones/:id', verificarToken, (req, res) => {
    if (!validarClienteTienda(req, res)) return;
    const id=Number(req.params.id); if(!id) return res.status(400).json({mensaje:'Dirección inválida'});
    const v=validarDireccionCliente(req.body); if(v.error) return res.status(400).json({mensaje:v.error}); const d=v.data;
    db.query(`UPDATE cliente_direcciones SET nombre_receptor=?,telefono=?,departamento=?,municipio=?,direccion=?,referencia=? WHERE id=? AND usuario_id=?`,
      [d.nombre_receptor,d.telefono,d.departamento,d.municipio,d.direccion,d.referencia||null,id,req.usuario.id],(err,result)=>{
        if(err) return res.status(500).json({mensaje:'No se pudo actualizar la dirección'});
        if(!result.affectedRows) return res.status(404).json({mensaje:'Dirección no encontrada'});
        db.query(`SELECT id,usuario_id,nombre_receptor,telefono,departamento,municipio,direccion,referencia,principal FROM cliente_direcciones WHERE id=? AND usuario_id=?`,[id,req.usuario.id],(rErr,rows)=>{
          if(rErr||!rows.length) return res.status(500).json({mensaje:'No se pudo leer la dirección actualizada'}); res.json({mensaje:'Dirección actualizada',direccion:rows[0]});
        });
      });
});

router.put('/mis-direcciones/:id/principal', verificarToken, (req, res) => {
    if (!validarClienteTienda(req, res)) return;
    const id=Number(req.params.id); if(!id) return res.status(400).json({mensaje:'Dirección inválida'});
    db.getConnection((connErr,conn)=>{
      if(connErr) return res.status(500).json({mensaje:'Error del servidor'});
      conn.beginTransaction(err=>{ if(err){conn.release();return res.status(500).json({mensaje:'Error del servidor'});} 
        conn.query('SELECT id FROM cliente_direcciones WHERE id=? AND usuario_id=?',[id,req.usuario.id],(sErr,rows)=>{
          if(sErr||!rows.length) return conn.rollback(()=>{conn.release();res.status(404).json({mensaje:'Dirección no encontrada'});});
          conn.query('UPDATE cliente_direcciones SET principal=0 WHERE usuario_id=?',[req.usuario.id],e1=>{
            if(e1) return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo actualizar la dirección'});});
            conn.query('UPDATE cliente_direcciones SET principal=1 WHERE id=? AND usuario_id=?',[id,req.usuario.id],e2=>{
              if(e2) return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo actualizar la dirección'});});
              conn.commit(cErr=>{if(cErr)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo actualizar la dirección'});});conn.release();res.json({mensaje:'Dirección seleccionada'});});
            });
          });
        });
      });
    });
});

router.delete('/mis-direcciones/:id', verificarToken, (req, res) => {
    if (!validarClienteTienda(req, res)) return;
    const id=Number(req.params.id); if(!id) return res.status(400).json({mensaje:'Dirección inválida'});
    db.query('SELECT principal FROM cliente_direcciones WHERE id=? AND usuario_id=?',[id,req.usuario.id],(sErr,rows)=>{
      if(sErr) return res.status(500).json({mensaje:'No se pudo eliminar la dirección'}); if(!rows.length)return res.status(404).json({mensaje:'Dirección no encontrada'});
      const eraPrincipal=Number(rows[0].principal)===1;
      db.query('DELETE FROM cliente_direcciones WHERE id=? AND usuario_id=?',[id,req.usuario.id],err=>{
        if(err)return res.status(500).json({mensaje:'No se pudo eliminar la dirección'});
        if(!eraPrincipal)return res.json({mensaje:'Dirección eliminada'});
        db.query('UPDATE cliente_direcciones SET principal=1 WHERE usuario_id=? ORDER BY id DESC LIMIT 1',[req.usuario.id],()=>res.json({mensaje:'Dirección eliminada'}));
      });
    });
});

// Reemplazo atómico: elimina una favorita existente y guarda la nueva en su lugar.
router.post('/mis-direcciones/reemplazar/:id', verificarToken, (req, res) => {
    if (!validarClienteTienda(req, res)) return;
    const id=Number(req.params.id); if(!id)return res.status(400).json({mensaje:'Dirección inválida'});
    const v=validarDireccionCliente(req.body); if(v.error)return res.status(400).json({mensaje:v.error}); const d=v.data;
    db.getConnection((connErr,conn)=>{
      if(connErr)return res.status(500).json({mensaje:'Error del servidor'});
      conn.beginTransaction(err=>{if(err){conn.release();return res.status(500).json({mensaje:'Error del servidor'});} 
        conn.query('SELECT principal FROM cliente_direcciones WHERE id=? AND usuario_id=? FOR UPDATE',[id,req.usuario.id],(sErr,rows)=>{
          if(sErr||!rows.length)return conn.rollback(()=>{conn.release();res.status(404).json({mensaje:'Dirección a reemplazar no encontrada'});});
          const principal=Number(rows[0].principal)===1?1:0;
          conn.query('DELETE FROM cliente_direcciones WHERE id=? AND usuario_id=?',[id,req.usuario.id],dErr=>{
            if(dErr)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo reemplazar la dirección'});});
            conn.query(`INSERT INTO cliente_direcciones (usuario_id,nombre_receptor,telefono,departamento,municipio,direccion,referencia,principal) VALUES (?,?,?,?,?,?,?,?)`,
              [req.usuario.id,d.nombre_receptor,d.telefono,d.departamento,d.municipio,d.direccion,d.referencia||null,principal],(iErr, result)=>{
                if(iErr)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo guardar la nueva dirección'});});
                const newId=Number(result?.insertId || 0);
                if(!newId)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'La nueva dirección se guardó, pero no se pudo identificar'});});
                conn.commit(cErr=>{if(cErr)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo completar el reemplazo'});});
                  conn.query(`SELECT id,usuario_id,nombre_receptor,telefono,departamento,municipio,direccion,referencia,principal FROM cliente_direcciones WHERE id=? AND usuario_id=?`,[newId,req.usuario.id],(rErr,saved)=>{conn.release();if(rErr||!saved.length)return res.status(500).json({mensaje:'La dirección se guardó, pero no pudo leerse'});res.json({mensaje:'Dirección reemplazada',direccion:saved[0]});});
                });
              });
          });
        });
      });
    });
});

// Compatibilidad FASE81: actualiza/crea la dirección principal sin superar el máximo.
router.put('/mi-direccion', verificarToken, (req, res) => {
    if (!validarClienteTienda(req, res)) return;
    const v=validarDireccionCliente(req.body); if(v.error)return res.status(400).json({mensaje:v.error}); const d=v.data;
    db.query('SELECT id FROM cliente_direcciones WHERE usuario_id=? AND principal=1 ORDER BY id DESC LIMIT 1',[req.usuario.id],(e,rows)=>{
      if(e)return res.status(500).json({mensaje:'Error del servidor'});
      if(rows.length){return db.query(`UPDATE cliente_direcciones SET nombre_receptor=?,telefono=?,departamento=?,municipio=?,direccion=?,referencia=? WHERE id=?`,[d.nombre_receptor,d.telefono,d.departamento,d.municipio,d.direccion,d.referencia||null,rows[0].id],err=>err?res.status(500).json({mensaje:'No se pudo guardar la dirección'}):res.json({mensaje:'Dirección guardada'}));}
      db.query('SELECT COUNT(*) total FROM cliente_direcciones WHERE usuario_id=?',[req.usuario.id],(cErr,cRows)=>{if(cErr)return res.status(500).json({mensaje:'Error del servidor'});if(Number(cRows[0].total)>=3)return res.status(409).json({codigo:'LIMITE_DIRECCIONES',mensaje:'Has alcanzado el límite de 3 direcciones guardadas'});db.query(`INSERT INTO cliente_direcciones (usuario_id,nombre_receptor,telefono,departamento,municipio,direccion,referencia,principal) VALUES (?,?,?,?,?,?,?,1)`,[req.usuario.id,d.nombre_receptor,d.telefono,d.departamento,d.municipio,d.direccion,d.referencia||null],err=>err?res.status(500).json({mensaje:'No se pudo guardar la dirección'}):res.json({mensaje:'Dirección guardada'}));});
    });
});

// Permite que cada frontend confirme que la sesión pertenece al portal correcto.
router.get("/me", verificarToken, (req, res) => {
    res.json({ usuario: req.usuario });
});

module.exports = router;
