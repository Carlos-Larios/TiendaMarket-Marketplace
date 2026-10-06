const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { verificarToken, soloAdmin } = require('../middleware/auth.middleware');

const estados = ['activo','advertencia','suspendido','cerro','expulsado','archivado'];

function actorAuditoriaId(req) {
  // Los usuarios internos viven en usuarios_panel; no reutilizamos su id como FK de la tabla pública usuarios.
  return req.usuario?.portal === 'panel' ? null : (req.usuario?.id || null);
}

function log(vendedorId, req, accion, detalle, motivo = null) {
  const actorId = actorAuditoriaId(req);
  const actorNombre = req.usuario?.nombre || req.usuario?.email || 'Administrador';
  db.query('INSERT INTO vendedores_bitacora (vendedor_id, actor_usuario_id, actor_nombre, accion, detalle, motivo) VALUES (?,?,?,?,?,?)',
    [vendedorId, actorId, actorNombre, accion, detalle, motivo], () => {});
}


const uploadDir = path.resolve(__dirname, '../uploads/vendedores');
fs.mkdirSync(uploadDir, { recursive: true });
const registroStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `sol_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});
const tiposPermitidos = new Set(['application/pdf','image/jpeg','image/png','image/webp']);
const registroUpload = multer({
  storage: registroStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => tiposPermitidos.has(file.mimetype) ? cb(null,true) : cb(new Error('Solo se permiten PDF, JPG, PNG o WEBP'))
});

router.post('/registro/solicitud', registroUpload.fields([
  {name:'dui_frente_documento',maxCount:1},{name:'dui_reverso_documento',maxCount:1},
  {name:'dui_documento',maxCount:1},{name:'nit_documento',maxCount:1},
  {name:'nrc_documento',maxCount:1},{name:'negocio_documento',maxCount:1}
]), (req,res)=>{
  const b=req.body||{};
  const required=['nombre','correo','telefono','dui','tienda','tipo_vendedor','direccion','contribuyente_iva'];
  const faltan=required.filter(k=>!String(b[k]||'').trim());
  if(faltan.length) return res.status(400).json({mensaje:`Faltan campos obligatorios: ${faltan.join(', ')}`});
  const tipoVendedor=String(b.tipo_vendedor||'').trim();
  const contribuyenteIva=String(b.contribuyente_iva||'').trim().toLowerCase();
  if(!['Emprendedor','Comercial'].includes(tipoVendedor)) return res.status(400).json({mensaje:'Tipo de vendedor no válido'});
  if(!['si','no'].includes(contribuyenteIva)) return res.status(400).json({mensaje:'Debes indicar si estás inscrito como contribuyente de IVA'});
  if(tipoVendedor==='Comercial' && !String(b.nit||'').trim()) return res.status(400).json({mensaje:'El NIT es obligatorio para un negocio o empresa formal'});
  if(contribuyenteIva==='si' && (!String(b.nrc||'').trim() || !String(b.actividad_economica||'').trim())) return res.status(400).json({mensaje:'NRC y actividad económica son obligatorios si estás inscrito como contribuyente de IVA'});
  const email=String(b.correo).trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({mensaje:'Correo no válido'});
  const duiFrente=req.files?.dui_frente_documento?.[0]||req.files?.dui_documento?.[0];
  const duiReverso=req.files?.dui_reverso_documento?.[0];
  if(!duiFrente) return res.status(400).json({mensaje:'Debes adjuntar el frente del DUI'});
  if(!duiReverso) return res.status(400).json({mensaje:'Debes adjuntar el reverso del DUI'});
  if(tipoVendedor==='Comercial' && !req.files?.nit_documento?.[0]) return res.status(400).json({mensaje:'Debes adjuntar el NIT de la empresa'});
  if(tipoVendedor==='Comercial' && !req.files?.negocio_documento?.[0]) return res.status(400).json({mensaje:'Debes adjuntar el documento legal del negocio'});
  if(contribuyenteIva==='si' && !req.files?.nrc_documento?.[0]) return res.status(400).json({mensaje:'Debes adjuntar el NRC o constancia de inscripción de IVA'});
  const bancosPermitidos=['Banco Apoyo Integral, S.A.','Banco Agrícola, S.A.','Banco Atlántida El Salvador, S.A.','Banco ABANK, S.A.','Banco Azul de El Salvador, S.A.','Banco Cuscatlán de El Salvador, S.A.','Banco Davivienda Salvadoreño, S.A.','Banco de América Central, S.A.','Banco de Fomento Agropecuario','Banco Hipotecario de El Salvador, S.A.','Banco Industrial El Salvador, S.A.','Banco Promerica, S.A.','Citibank, N.A. Sucursal El Salvador'];
  const bancoIngresado=String(b.banco||'').trim();
  if(bancoIngresado && !bancosPermitidos.includes(bancoIngresado)) return res.status(400).json({mensaje:'Selecciona un banco válido de la lista de entidades disponibles'});
  db.query("SELECT id FROM vendedor_solicitudes WHERE (correo=? OR dui=?) AND estado IN ('pendiente','revision','correccion','aprobada') LIMIT 1",[email,String(b.dui).trim()],(e,dup)=>{
    if(e)return res.status(500).json({mensaje:'No se pudo validar la solicitud',error:e.message});
    if(dup.length)return res.status(409).json({mensaje:'Ya existe una solicitud activa con ese correo o DUI'});
    // Compatibilidad con instalaciones que aún no han aplicado todas las columnas
    // del formulario. Se usan únicamente columnas que realmente existen en MySQL,
    // para que la solicitud nunca deje de registrarse por una migración pendiente.
    db.query('SHOW COLUMNS FROM vendedor_solicitudes',(schemaErr,columnas)=>{
      if(schemaErr)return res.status(500).json({mensaje:'No se pudo revisar la estructura de vendedor_solicitudes',error:schemaErr.message});
      const disponibles=new Set((columnas||[]).map(c=>c.Field));
      const datos={
        nombre:b.nombre.trim(), correo:email, telefono:b.telefono.trim(), dui:b.dui.trim(),
        tienda:b.tienda.trim(), estado:'pendiente', direccion:b.direccion.trim(),
        nit:tipoVendedor==='Comercial'?String(b.nit||'').trim()||null:null,
        nrc:contribuyenteIva==='si'?String(b.nrc||'').trim()||null:null,
        cuenta_bancaria:String(b.cuenta_bancaria||'').trim()||null,
        tipo_vendedor:tipoVendedor,
        tipo_negocio:tipoVendedor,
        contribuyente_iva:contribuyenteIva,
        actividad_economica:String(b.actividad_economica||'').trim()||null,
        categoria:String(b.categoria||'').trim()||null,
        descripcion_negocio:String(b.descripcion_negocio||'').trim()||null,
        banco:String(b.banco||'').trim()||null,
        titular_cuenta:String(b.titular_cuenta||'').trim()||null
      };
      const campos=Object.keys(datos).filter(k=>disponibles.has(k));
      const vals=campos.map(k=>datos[k]);
      if(!campos.includes('nombre')||!campos.includes('correo')||!campos.includes('tienda')){
        return res.status(500).json({mensaje:'La tabla vendedor_solicitudes no tiene la estructura mínima requerida. Importa la actualización SQL incluida con el proyecto.'});
      }
      const sql=`INSERT INTO vendedor_solicitudes (${campos.map(c=>'`'+c+'`').join(',')}) VALUES (${campos.map(()=>'?').join(',')})`;
      db.query(sql,vals,(e2,r)=>{
        if(e2)return res.status(500).json({mensaje:'No se pudo guardar la solicitud en MySQL',error:e2.message,codigo:e2.code});
      const docs=[
        ['DUI - Frente',req.files?.dui_frente_documento?.[0]?'dui_frente_documento':'dui_documento',1],
        ['DUI - Reverso','dui_reverso_documento',1],
        ['NIT','nit_documento',tipoVendedor==='Comercial'?1:0],
        ['NRC / constancia de IVA','nrc_documento',contribuyenteIva==='si'?1:0],
        ['Documento legal del negocio','negocio_documento',tipoVendedor==='Comercial'?1:0]
      ].filter(([,field])=>req.files?.[field]?.[0]);
      if(!docs.length)return res.status(201).json({mensaje:'Solicitud enviada',solicitudId:r.insertId});
      let pendientes=docs.length, fallo=false;
      docs.forEach(([tipo,field,obligatorio])=>{
        const f=req.files[field][0];
        db.query(`INSERT INTO vendedor_solicitud_documentos
          (solicitud_id,tipo,nombre_archivo,ruta_archivo,estado,obligatorio)
          VALUES (?,?,?,?, 'pendiente', ?)`,
          [r.insertId,tipo,f.originalname,f.filename,obligatorio],err=>{
            if(err)fallo=true;
            if(--pendientes===0){
              db.query('INSERT INTO vendedor_solicitud_bitacora (solicitud_id,actor_nombre,accion,detalle) VALUES (?,?,?,?)',
                [r.insertId,'Solicitante','registro','Solicitud enviada desde el formulario público'],()=>{});
              res.status(201).json({mensaje:fallo?'Solicitud guardada; algunos documentos requieren revisión':'Solicitud enviada correctamente',solicitudId:r.insertId,codigo:`SOL-${String(r.insertId).padStart(4,'0')}`});
            }
          });
      });
      });
    });
  });
});

// FASE 58 — perfil visual de la tienda del vendedor y carga de logo.
// Estas rutas se mantienen compatibles con instalaciones donde aún no se aplicó la migración.
function soloVendedorTienda(req,res,next){
  const rol=String(req.usuario?.rol||'').toLowerCase();
  if(req.usuario?.portal!=='tienda'||rol!=='vendedor') return res.status(403).json({mensaje:'Se requiere sesión de vendedor'});
  next();
}

router.get('/mi-tienda/perfil', verificarToken, soloVendedorTienda, async (req,res)=>{
  try{
    const cols=await new Promise((resolve,reject)=>db.query("SHOW COLUMNS FROM vendedores LIKE 'logo_tienda'",(e,r)=>e?reject(e):resolve(r||[])));
    const extras=await new Promise((resolve,reject)=>db.query("SHOW COLUMNS FROM vendedores",(e,r)=>e?reject(e):resolve(r||[])));
    const campos=new Set(extras.map(c=>c.Field));
    const perfilCampos=["banner_tienda","descripcion_publica","perfil_publico"].filter(c=>campos.has(c)).map(c=>", v."+c).join("");
    const campoLogo=cols.length?', v.logo_tienda':'';
    db.query(`SELECT v.id,v.tienda,v.nombre,v.nivel,v.estado${campoLogo}${perfilCampos} FROM vendedores v WHERE v.usuario_id=? LIMIT 1`,[req.usuario.id],(e,r)=>{
      if(e)return res.status(500).json({mensaje:'No se pudo cargar el perfil de la tienda'});
      if(!r.length)return res.status(404).json({mensaje:'Tienda no encontrada'});
      res.json({tienda:{...r[0],logo_tienda:r[0].logo_tienda||''},logo_habilitado:cols.length>0});
    });
  }catch(e){res.status(500).json({mensaje:'No se pudo revisar el perfil de la tienda'});}
});

router.post('/mi-tienda/logo', verificarToken, soloVendedorTienda, registroUpload.single('logo_tienda'), (req,res)=>{
  if(!req.file)return res.status(400).json({mensaje:'Selecciona una imagen JPG, PNG o WEBP'});
  if(!String(req.file.mimetype||'').startsWith('image/')){try{fs.unlinkSync(req.file.path)}catch(_){};return res.status(400).json({mensaje:'El logo debe ser una imagen'});}
  db.query("SHOW COLUMNS FROM vendedores LIKE 'logo_tienda'",(schemaErr,cols)=>{
    if(schemaErr||!cols?.length){try{fs.unlinkSync(req.file.path)}catch(_){};return res.status(409).json({mensaje:'Falta aplicar FASE58_LOGO_TIENDA.sql en MySQL'});}
    const ruta=`/uploads/vendedores/${req.file.filename}`;
    db.query('SELECT id,logo_tienda FROM vendedores WHERE usuario_id=? LIMIT 1',[req.usuario.id],(e,r)=>{
      if(e||!r.length){try{fs.unlinkSync(req.file.path)}catch(_){};return res.status(404).json({mensaje:'Tienda no encontrada'});}
      db.query('UPDATE vendedores SET logo_tienda=?,actualizado_en=NOW() WHERE id=?',[ruta,r[0].id],e2=>{
        if(e2){try{fs.unlinkSync(req.file.path)}catch(_){};return res.status(500).json({mensaje:'No se pudo guardar el logo'});}
        const viejo=String(r[0].logo_tienda||'');
        if(viejo.startsWith('/uploads/vendedores/')){try{const f=path.join(uploadDir,path.basename(viejo));if(fs.existsSync(f))fs.unlinkSync(f)}catch(_){}}
        res.json({mensaje:'Logo actualizado',logo_tienda:ruta});
      });
    });
  });
});


// FASE 124 — edición exclusiva del perfil público por su propietario.
const perfilUpload=multer({storage:registroStorage,limits:{fileSize:8*1024*1024,files:2},fileFilter:(_req,file,cb)=>{
  const extensiones={'image/jpeg':['.jpg','.jpeg'],'image/png':['.png'],'image/webp':['.webp']};
  cb(null,!!extensiones[file.mimetype]?.includes(path.extname(file.originalname).toLowerCase()));
}}).fields([{name:'logo_tienda',maxCount:1},{name:'banner_tienda',maxCount:1}]);
router.put('/mi-tienda/perfil',verificarToken,soloVendedorTienda,(req,res)=>{
  perfilUpload(req,res,async error=>{
    const archivos=Object.values(req.files||{}).flat();
    const limpiar=()=>archivos.forEach(f=>{try{fs.unlinkSync(f.path)}catch(_){}});
    if(error){limpiar();return res.status(400).json({mensaje:'Las imágenes deben ser JPG, PNG o WEBP, de máximo 8 MB.'});}
    const tienda=String(req.body.tienda||'').trim();
    const descripcion=String(req.body.descripcion_publica||'').trim();
    if(!tienda||tienda.length>100||descripcion.length>2000){limpiar();return res.status(400).json({mensaje:'Introduce un nombre de hasta 100 caracteres y una descripción de hasta 2000.'});}
    const query=(sql,params=[])=>new Promise((resolve,reject)=>db.query(sql,params,(e,r)=>e?reject(e):resolve(r)));
    try{
      const columnas=await query('SHOW COLUMNS FROM vendedores');
      if(!['logo_tienda','banner_tienda','descripcion_publica','perfil_publico'].every(c=>columnas.some(x=>x.Field===c))){limpiar();return res.status(409).json({mensaje:'Importa database/FASE125_PERFIL_ESTRUCTURADO.sql antes de guardar.'});}
      const rows=await query('SELECT id,logo_tienda,banner_tienda FROM vendedores WHERE usuario_id=? LIMIT 1',[req.usuario.id]);
      if(!rows.length){limpiar();return res.status(404).json({mensaje:'Tienda no encontrada'});}
      const nombres=['pais','ubicacion','direccion_publica','horario_semana','horario_sabado','horario_domingo','tiempo_respuesta','whatsapp','correo_publico','sitio_web','instagram','facebook','politica_envios','politica_devoluciones','garantia'];
      const perfil={};
      for(const c of nombres){const valor=String(req.body[c]||'').trim();if(valor.length>(c.startsWith('politica_')||c==='garantia'?2000:500)){limpiar();return res.status(400).json({mensaje:'El campo '+c+' excede la longitud permitida.'});}perfil[c]=valor;}
      const mapaLat=String(req.body.mapa_latitud??'').trim(),mapaLng=String(req.body.mapa_longitud??'').trim();
      if(mapaLat||mapaLng){
        if(!mapaLat||!mapaLng||!Number.isFinite(Number(mapaLat))||!Number.isFinite(Number(mapaLng))||Math.abs(Number(mapaLat))>90||Math.abs(Number(mapaLng))>180){limpiar();return res.status(400).json({mensaje:'La ubicación del mapa no contiene coordenadas válidas.'});}
        perfil.mapa_latitud=Number(mapaLat);perfil.mapa_longitud=Number(mapaLng);
      }
      for(const c of ['mostrar_tienda','mostrar_productos','mostrar_contacto'])perfil[c]=req.body[c]==='1';
      if(perfil.sitio_web&&!/^https?:\/\//i.test(perfil.sitio_web)){limpiar();return res.status(400).json({mensaje:'El sitio web debe comenzar con https:// o http://.'});}
      const datos={tienda,descripcion_publica:descripcion,perfil_publico:JSON.stringify(perfil)};
      for(const campo of ['logo_tienda','banner_tienda']){
        if(req.files?.[campo]?.[0])datos[campo]='/uploads/vendedores/'+req.files[campo][0].filename;
        else if(req.body['eliminar_'+campo]==='1')datos[campo]=null;
      }
      await query('UPDATE vendedores SET '+Object.keys(datos).map(c=>'`'+c+'`=?').join(',')+' WHERE id=?',[...Object.values(datos),rows[0].id]);
      for(const campo of ['logo_tienda','banner_tienda'])if(campo in datos&&rows[0][campo]?.startsWith('/uploads/vendedores/')){try{fs.unlinkSync(path.join(uploadDir,path.basename(rows[0][campo])))}catch(_){}}
      res.json({mensaje:'Perfil de la tienda actualizado',tienda:{id:rows[0].id,...rows[0],...datos}});
    }catch(e){limpiar();res.status(500).json({mensaje:'No se pudo guardar el perfil de la tienda'});}
  });
});

// FASE 75 — configuración de logística propia del vendedor.
// Se crean las tablas si aún no existen para mantener compatible una instalación existente.
function asegurarTablasEnvio(){
  const metodo=`CREATE TABLE IF NOT EXISTS vendedor_metodos_envio (
    id INT AUTO_INCREMENT PRIMARY KEY, vendedor_id INT NOT NULL, nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500) NULL, preparacion_min INT NOT NULL DEFAULT 0, preparacion_max INT NOT NULL DEFAULT 1,
    dias_reparto VARCHAR(100) NULL, hora_corte TIME NULL, seguimiento TINYINT(1) NOT NULL DEFAULT 1, activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP, actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_vendedor_metodo (vendedor_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
  const zonas=`CREATE TABLE IF NOT EXISTS vendedor_envio_zonas (
    id INT AUTO_INCREMENT PRIMARY KEY, metodo_id INT NOT NULL, departamento VARCHAR(40) NOT NULL,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0.00, entrega_min INT NOT NULL DEFAULT 1, entrega_max INT NOT NULL DEFAULT 2,
    UNIQUE KEY uq_metodo_departamento (metodo_id, departamento), KEY idx_departamento (departamento)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
  return new Promise((resolve,reject)=>db.query(metodo,e=>e?reject(e):db.query(zonas,e2=>{if(e2)return reject(e2);db.query('ALTER TABLE vendedor_metodos_envio ADD COLUMN seguimiento TINYINT(1) NOT NULL DEFAULT 1',e3=>{if(e3 && e3.code!=='ER_DUP_FIELDNAME')return reject(e3);resolve();});})));
}
function vendedorActualId(req){return new Promise((resolve,reject)=>db.query('SELECT id FROM vendedores WHERE usuario_id=? LIMIT 1',[req.usuario.id],(e,r)=>e?reject(e):resolve(r?.[0]?.id||null)))}

router.get('/mi-tienda/envios', verificarToken, soloVendedorTienda, async (req,res)=>{
  try{
    await asegurarTablasEnvio(); const vendedorId=await vendedorActualId(req);
    if(!vendedorId)return res.status(404).json({mensaje:'Tienda no encontrada'});
    db.query('SELECT * FROM vendedor_metodos_envio WHERE vendedor_id=? LIMIT 1',[vendedorId],(e,r)=>{
      if(e)return res.status(500).json({mensaje:'No se pudo cargar el método de envío'});
      if(!r.length)return res.json({metodo:null}); const m=r[0];
      db.query('SELECT departamento,precio,entrega_min,entrega_max FROM vendedor_envio_zonas WHERE metodo_id=? ORDER BY departamento',[m.id],(e2,z)=>{
        if(e2)return res.status(500).json({mensaje:'No se pudieron cargar las zonas'});
        res.json({metodo:{id:m.id,nombre:m.nombre,seguimiento:m.seguimiento!==0,activo:!!m.activo,zonas:z}});
      });
    });
  }catch(e){res.status(500).json({mensaje:'No se pudo preparar la configuración de envíos',error:e.message})}
});

router.put('/mi-tienda/envios', verificarToken, soloVendedorTienda, async (req,res)=>{
  const b=req.body||{}, departamentos=new Set(['Ahuachapán','Cabañas','Chalatenango','Cuscatlán','La Libertad','La Paz','La Unión','Morazán','San Miguel','San Salvador','San Vicente','Santa Ana','Sonsonate','Usulután']);
  const nombre=String(b.nombre||'').trim(), zonas=Array.isArray(b.zonas)?b.zonas:[];
  const seguimiento=b.seguimiento!==false;
  if(!nombre)return res.status(400).json({mensaje:'El nombre del método es obligatorio'});
  if(!zonas.length)return res.status(400).json({mensaje:'Selecciona al menos un departamento de cobertura'});
  for(const z of zonas){const pr=Number(z.precio),mi=Number(z.entrega_min),ma=Number(z.entrega_max);if(!departamentos.has(z.departamento)||!Number.isFinite(pr)||pr<0||!Number.isInteger(mi)||!Number.isInteger(ma)||mi<1||ma<mi||ma>30)return res.status(400).json({mensaje:`Datos de cobertura no válidos para ${z.departamento||'una zona'}`})}
  try{
    await asegurarTablasEnvio(); const vendedorId=await vendedorActualId(req); if(!vendedorId)return res.status(404).json({mensaje:'Tienda no encontrada'});
    db.getConnection((err,conn)=>{if(err)return res.status(500).json({mensaje:'No se pudo iniciar el guardado'});conn.beginTransaction(e=>{if(e){conn.release();return res.status(500).json({mensaje:'No se pudo iniciar la transacción'})}
      const sql=`INSERT INTO vendedor_metodos_envio (vendedor_id,nombre,descripcion,preparacion_min,preparacion_max,dias_reparto,hora_corte,seguimiento,activo) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE nombre=VALUES(nombre),descripcion=NULL,preparacion_min=0,preparacion_max=0,dias_reparto=NULL,hora_corte=NULL,seguimiento=VALUES(seguimiento),activo=VALUES(activo)`;
      conn.query(sql,[vendedorId,nombre,null,0,0,null,null,seguimiento?1:0,b.activo?1:0],(e1)=>{if(e1)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo guardar el método',error:e1.message})});
        conn.query('SELECT id FROM vendedor_metodos_envio WHERE vendedor_id=? LIMIT 1',[vendedorId],(e2,r)=>{if(e2||!r.length)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo recuperar el método'})});const mid=r[0].id;
          conn.query('DELETE FROM vendedor_envio_zonas WHERE metodo_id=?',[mid],e3=>{if(e3)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudieron actualizar las zonas'})});
            const vals=zonas.map(z=>[mid,z.departamento,Number(z.precio).toFixed(2),Number(z.entrega_min),Number(z.entrega_max)]);conn.query('INSERT INTO vendedor_envio_zonas (metodo_id,departamento,precio,entrega_min,entrega_max) VALUES ?',[vals],e4=>{if(e4)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudieron guardar las zonas',error:e4.message})});conn.commit(e5=>{if(e5)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo confirmar el guardado'})});conn.release();res.json({mensaje:'Método de envío guardado correctamente',metodo_id:mid})})});
          });
        });
      });
    })});
  }catch(e){res.status(500).json({mensaje:'No se pudo guardar la configuración de envíos',error:e.message})}
});


router.patch('/mi-tienda/envios/estado', verificarToken, soloVendedorTienda, async (req,res)=>{
  try{
    await asegurarTablasEnvio(); const vendedorId=await vendedorActualId(req);
    if(!vendedorId)return res.status(404).json({mensaje:'Tienda no encontrada'});
    const activo=req.body?.activo?1:0;
    db.query('UPDATE vendedor_metodos_envio SET activo=? WHERE vendedor_id=?',[activo,vendedorId],(e,r)=>{
      if(e)return res.status(500).json({mensaje:'No se pudo cambiar el estado del método'});
      if(!r.affectedRows)return res.status(404).json({mensaje:'No tienes un método de envío configurado'});
      res.json({mensaje:activo?'Método de envío activado':'Método de envío desactivado',activo:!!activo});
    });
  }catch(e){res.status(500).json({mensaje:'No se pudo actualizar el método de envío',error:e.message})}
});

router.delete('/mi-tienda/envios', verificarToken, soloVendedorTienda, async (req,res)=>{
  try{
    await asegurarTablasEnvio(); const vendedorId=await vendedorActualId(req);
    if(!vendedorId)return res.status(404).json({mensaje:'Tienda no encontrada'});
    db.getConnection((err,conn)=>{if(err)return res.status(500).json({mensaje:'No se pudo iniciar la eliminación'});conn.beginTransaction(e=>{if(e){conn.release();return res.status(500).json({mensaje:'No se pudo iniciar la transacción'})}
      conn.query('SELECT id FROM vendedor_metodos_envio WHERE vendedor_id=? LIMIT 1',[vendedorId],(e1,r)=>{if(e1)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo localizar el método'})});if(!r.length)return conn.rollback(()=>{conn.release();res.status(404).json({mensaje:'No tienes un método de envío configurado'})});const mid=r[0].id;
        conn.query('DELETE FROM vendedor_envio_zonas WHERE metodo_id=?',[mid],e2=>{if(e2)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudieron eliminar las zonas'})});
          conn.query('DELETE FROM vendedor_metodos_envio WHERE id=?',[mid],e3=>{if(e3)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo eliminar el método'})});conn.commit(e4=>{if(e4)return conn.rollback(()=>{conn.release();res.status(500).json({mensaje:'No se pudo confirmar la eliminación'})});conn.release();res.json({mensaje:'Método de envío eliminado correctamente'})})});
        });
      });
    })});
  }catch(e){res.status(500).json({mensaje:'No se pudo eliminar el método de envío',error:e.message})}
});

router.get('/', verificarToken, soloAdmin, (req,res)=>{
  const search = String(req.query.search || '').trim();
  const estado = String(req.query.estado || '').trim();
  const nivel = String(req.query.nivel || '').trim();
  let where = 'WHERE 1=1'; const vals=[];
  if(search){ where += ' AND (v.nombre LIKE ? OR v.tienda LIKE ? OR u.email LIKE ? OR v.dui LIKE ?)'; vals.push(...Array(4).fill(`%${search}%`)); }
  if(estado && estado !== 'todos'){ where += ' AND v.estado=?'; vals.push(estado); }
  if(nivel && nivel !== 'todos'){ where += ' AND v.nivel=?'; vals.push(nivel); }
  db.query(`SELECT v.id, CONCAT('UV-',LPAD(v.id,3,'0')) codigo, v.nombre, v.tienda, u.email correo, v.dui, v.telefono, v.estado, v.nivel, v.cuenta_estado cuenta, v.seguridad_estado seguridad, v.seguridad_tipo, v.ultimo_acceso, v.dos_factores, v.permisos, u.id usuario_id
            FROM vendedores v JOIN usuarios u ON u.id=v.usuario_id ${where} ORDER BY v.id DESC`, vals, (e,rows)=>{
    if(e) return res.status(500).json({mensaje:'Error al obtener vendedores', error:e.message});
    res.json({vendedores: rows.map(r=>({...r, permisos: (()=>{try{return JSON.parse(r.permisos||'[]')}catch{return []}})()}))});
  });
});

router.get('/:id/bitacora', verificarToken, soloAdmin, (req,res)=>{
  db.query('SELECT id, accion, detalle, motivo, actor_nombre, fecha FROM vendedores_bitacora WHERE vendedor_id=? ORDER BY fecha DESC, id DESC LIMIT 100',[req.params.id],(e,rows)=>{
    if(e) return res.status(500).json({mensaje:'Error al obtener bitácora'}); res.json({bitacora:rows});
  });
});

router.put('/:id', verificarToken, soloAdmin, (req,res)=>{
  const {nombre,tienda,correo,telefono}=req.body;
  if(!nombre || !correo) return res.status(400).json({mensaje:'Nombre y correo son obligatorios'});
  db.query('SELECT usuario_id FROM vendedores WHERE id=?',[req.params.id],(e,r)=>{
    if(e||!r.length) return res.status(404).json({mensaje:'Vendedor no encontrado'});
    db.query('UPDATE usuarios SET nombre=?, email=? WHERE id=?',[nombre,correo,r[0].usuario_id],e2=>{
      if(e2) return res.status(500).json({mensaje:'No se pudo actualizar el usuario',error:e2.message});
      db.query('UPDATE vendedores SET nombre=?, tienda=?, telefono=?, actualizado_en=NOW() WHERE id=?',[nombre,tienda||'',telefono||'',req.params.id],e3=>{
        if(e3) return res.status(500).json({mensaje:'No se pudo actualizar el vendedor'});
        log(req.params.id,req,'edicion','Datos permitidos de la cuenta actualizados'); res.json({mensaje:'Vendedor actualizado'});
      });
    });
  });
});

router.patch('/:id/estado', verificarToken, soloAdmin, (req,res)=>{
  const {estado,motivo}=req.body;
  if(!estados.includes(estado)) return res.status(400).json({mensaje:'Estado no válido'});
  if(!String(motivo||'').trim()) return res.status(400).json({mensaje:'El motivo es obligatorio'});
  db.query('SELECT estado FROM vendedores WHERE id=?',[req.params.id],(e,r)=>{
    if(e||!r.length) return res.status(404).json({mensaje:'Vendedor no encontrado'});
    const anterior=r[0].estado;
    db.query('UPDATE vendedores SET estado=?, cuenta_estado=?, actualizado_en=NOW() WHERE id=?',[estado, estado==='activo'?'Vinculada':estado, req.params.id],e2=>{
      if(e2) return res.status(500).json({mensaje:'No se pudo cambiar el estado'});
      log(req.params.id,req,'cambio_estado',`Estado cambiado: ${anterior} → ${estado}`,motivo); res.json({mensaje:'Estado actualizado'});
    });
  });
});

router.post('/:id/restablecer', verificarToken, soloAdmin, (req,res)=>{
  const motivo=String(req.body.motivo||'').trim(); const reset2fa=!!req.body.reset2fa;
  if(!motivo) return res.status(400).json({mensaje:'El motivo es obligatorio'});
  db.query('SELECT usuario_id FROM vendedores WHERE id=?',[req.params.id],async(e,r)=>{
    if(e||!r.length) return res.status(404).json({mensaje:'Vendedor no encontrado'});
    const temporal='TP-'+crypto.randomBytes(5).toString('hex')+'!';
    const hash=await bcrypt.hash(temporal,10);
    db.query('UPDATE usuarios SET password=? WHERE id=?',[hash,r[0].usuario_id],e2=>{
      if(e2) return res.status(500).json({mensaje:'No se pudo restablecer el acceso'});
      const seguridad=reset2fa?'2FA pendiente de configurar':'Contraseña temporal pendiente';
      db.query('UPDATE vendedores SET seguridad_estado=?, seguridad_tipo="warn", dos_factores=IF(?,0,dos_factores), actualizado_en=NOW() WHERE id=?',[seguridad,reset2fa?1:0,req.params.id],e3=>{
        if(e3) return res.status(500).json({mensaje:'Acceso actualizado, pero no se pudo actualizar seguridad'});
        log(req.params.id,req,'restablecimiento',reset2fa?'Contraseña temporal generada y 2FA reiniciado':'Contraseña temporal generada',motivo);
        res.json({mensaje:'Acceso restablecido', passwordTemporal:temporal});
      });
    });
  });
});

// Solicitudes de nuevos vendedores
router.get('/solicitudes/listado', verificarToken, soloAdmin, (req,res)=>{
  const estado=String(req.query.estado||'').trim();
  let sql=`SELECT s.*, CONCAT('SOL-',LPAD(s.id,4,'0')) codigo,
    (SELECT COUNT(*) FROM vendedor_solicitud_documentos d WHERE d.solicitud_id=s.id) documentos_total,
    (SELECT COUNT(*) FROM vendedor_solicitud_documentos d WHERE d.solicitud_id=s.id AND d.estado='verificado') documentos_verificados,
    (SELECT COUNT(*) FROM vendedor_solicitud_documentos d WHERE d.solicitud_id=s.id AND d.obligatorio=1 AND d.estado<>'verificado') documentos_obligatorios_pendientes
    FROM vendedor_solicitudes s`;
  const vals=[];
  if(estado){sql+=' WHERE s.estado=?'; vals.push(estado)}
  sql+=' ORDER BY s.fecha_solicitud DESC,s.id DESC';
  db.query(sql,vals,(e,rows)=>{if(e)return res.status(500).json({mensaje:'Error al obtener solicitudes',error:e.message});res.json({solicitudes:rows});});
});

router.get('/solicitudes/contador/pendientes', verificarToken, soloAdmin, (req,res)=>{
  db.query("SELECT COUNT(*) total FROM vendedor_solicitudes WHERE estado IN ('pendiente','revision','correccion')",(e,r)=>{if(e)return res.status(500).json({mensaje:'Error al contar solicitudes'});res.json({total:Number(r[0]?.total||0)});});
});

router.get('/solicitudes/:id', verificarToken, soloAdmin, (req,res)=>{
  db.query("SELECT *,CONCAT('SOL-',LPAD(id,4,'0')) codigo FROM vendedor_solicitudes WHERE id=?",[req.params.id],(e,r)=>{
    if(e||!r.length)return res.status(404).json({mensaje:'Solicitud no encontrada'});
    db.query('SELECT * FROM vendedor_solicitud_documentos WHERE solicitud_id=? ORDER BY obligatorio DESC,id',[req.params.id],(e2,docs)=>{
      if(e2)return res.status(500).json({mensaje:'Error al obtener documentos'});
      db.query('SELECT * FROM vendedor_solicitud_bitacora WHERE solicitud_id=? ORDER BY fecha DESC,id DESC',[req.params.id],(e3,bit)=>{
        if(e3)return res.status(500).json({mensaje:'Error al obtener bitácora'});res.json({solicitud:r[0],documentos:docs,bitacora:bit});
      });
    });
  });
});

router.get('/solicitudes/:id/documentos/:docId/archivo', verificarToken, soloAdmin, (req,res)=>{
  db.query('SELECT ruta_archivo,nombre_archivo FROM vendedor_solicitud_documentos WHERE id=? AND solicitud_id=?',[req.params.docId,req.params.id],(e,r)=>{
    if(e||!r.length)return res.status(404).json({mensaje:'Documento no encontrado'});
    if(!r[0].ruta_archivo)return res.status(404).json({mensaje:'Esta solicitud DEMO no tiene archivo físico adjunto'});
    const base=path.resolve(__dirname,'../uploads/vendedores');
    const file=path.resolve(base,r[0].ruta_archivo);
    if(!file.startsWith(base+path.sep) || !fs.existsSync(file))return res.status(404).json({mensaje:'Archivo no disponible'});
    res.sendFile(file);
  });
});

router.patch('/solicitudes/:id/documentos/:docId', verificarToken, soloAdmin, (req,res)=>{
  const estado=String(req.body.estado||''); const observacion=String(req.body.observacion||'').trim();
  if(!['pendiente','verificado','rechazado','correccion'].includes(estado))return res.status(400).json({mensaje:'Estado de documento no válido'});
  db.query('UPDATE vendedor_solicitud_documentos SET estado=?,observacion=?,revisado_por=?,revisado_en=NOW() WHERE id=? AND solicitud_id=?',[estado,observacion,actorAuditoriaId(req),req.params.docId,req.params.id],(e,r)=>{
    if(e)return res.status(500).json({mensaje:'No se pudo revisar el documento'});if(!r.affectedRows)return res.status(404).json({mensaje:'Documento no encontrado'});
    db.query('INSERT INTO vendedor_solicitud_bitacora (solicitud_id,actor_usuario_id,actor_nombre,accion,detalle) VALUES (?,?,?,?,?)',[req.params.id,actorAuditoriaId(req),req.usuario?.nombre||req.usuario?.email||'Administrador','revision_documento',`Documento #${req.params.docId}: ${estado}${observacion?' · '+observacion:''}`],()=>{});
    res.json({mensaje:'Documento actualizado'});
  });
});

router.patch('/solicitudes/:id/correccion', verificarToken, soloAdmin, (req,res)=>{
  const motivo=String(req.body.motivo||'').trim();if(!motivo)return res.status(400).json({mensaje:'Indica qué debe corregir el solicitante'});
  db.query("UPDATE vendedor_solicitudes SET estado='correccion',motivo_revision=?,revisado_por=?,revisado_en=NOW() WHERE id=? AND estado NOT IN ('aprobada','rechazada')",[motivo,actorAuditoriaId(req),req.params.id],(e,r)=>{if(e)return res.status(500).json({mensaje:'No se pudo actualizar la solicitud'});if(!r.affectedRows)return res.status(400).json({mensaje:'La solicitud ya fue cerrada'});db.query('INSERT INTO vendedor_solicitud_bitacora (solicitud_id,actor_usuario_id,actor_nombre,accion,detalle) VALUES (?,?,?,?,?)',[req.params.id,actorAuditoriaId(req),req.usuario?.nombre||req.usuario?.email||'Administrador','solicitar_correccion',motivo],()=>{});res.json({mensaje:'Corrección solicitada'});});
});

router.patch('/solicitudes/:id/rechazar', verificarToken, soloAdmin, (req,res)=>{
  const motivo=String(req.body.motivo||'').trim();if(!motivo)return res.status(400).json({mensaje:'El motivo del rechazo es obligatorio'});
  db.query("UPDATE vendedor_solicitudes SET estado='rechazada',motivo_revision=?,revisado_por=?,revisado_en=NOW() WHERE id=? AND estado<>'aprobada'",[motivo,actorAuditoriaId(req),req.params.id],(e,r)=>{if(e)return res.status(500).json({mensaje:'No se pudo rechazar'});if(!r.affectedRows)return res.status(400).json({mensaje:'La solicitud ya fue aprobada'});db.query('INSERT INTO vendedor_solicitud_bitacora (solicitud_id,actor_usuario_id,actor_nombre,accion,detalle) VALUES (?,?,?,?,?)',[req.params.id,actorAuditoriaId(req),req.usuario?.nombre||req.usuario?.email||'Administrador','rechazo',motivo],()=>{});res.json({mensaje:'Solicitud rechazada'});});
});

router.post('/solicitudes/:id/aprobar', verificarToken, soloAdmin, (req,res)=>{
  db.query('SELECT * FROM vendedor_solicitudes WHERE id=?',[req.params.id],async(e,r)=>{
    if(e||!r.length)return res.status(404).json({mensaje:'Solicitud no encontrada'});
    const s=r[0];
    if(s.estado==='aprobada')return res.status(400).json({mensaje:'La solicitud ya fue aprobada'});

    db.query("SELECT COUNT(*) pendientes FROM vendedor_solicitud_documentos WHERE solicitud_id=? AND obligatorio=1 AND estado<>'verificado'",[s.id],async(e2,c)=>{
      if(e2)return res.status(500).json({mensaje:'No se pudieron validar los documentos'});
      if(Number(c[0].pendientes)>0)return res.status(400).json({mensaje:'Faltan documentos obligatorios por verificar'});

      // Un correo reservado para el panel interno nunca puede convertirse en cuenta pública de vendedor.
      const panelEmail = await new Promise((resolve) => {
        db.query('SELECT id FROM usuarios_panel WHERE email=? LIMIT 1',[s.correo],(ep,rp)=>resolve({ep,rp}));
      });
      if(panelEmail.ep) return res.status(500).json({mensaje:'No se pudo validar el correo'});
      if(panelEmail.rp.length) return res.status(409).json({mensaje:'El correo no está disponible para una cuenta de vendedor'});

      const temporal='TP-'+crypto.randomBytes(5).toString('hex')+'!';
      const hash=await bcrypt.hash(temporal,10);

      // Las transacciones pertenecen a una conexión individual del pool,
      // no al objeto pool directamente.
      db.getConnection((connErr, conn)=>{
        if(connErr)return res.status(500).json({mensaje:'No se pudo obtener conexión para aprobar la solicitud'});

        const liberar=()=>{ try{ conn.release(); }catch(_){} };
        const rollback=(respuesta)=>{
          conn.rollback(()=>{
            liberar();
            respuesta();
          });
        };

        conn.beginTransaction(err=>{
          if(err){
            liberar();
            return res.status(500).json({mensaje:'No se pudo iniciar la aprobación'});
          }

          conn.query('INSERT INTO usuarios (nombre,email,password,rol) VALUES (?,?,?,\'vendedor\')',[s.nombre,s.correo,hash],(e3,u)=>{
            if(e3)return rollback(()=>res.status(400).json({
              mensaje:e3.code==='ER_DUP_ENTRY'?'El correo ya pertenece a una cuenta':'No se pudo crear el usuario',
              error:e3.message
            }));

            conn.query("INSERT INTO vendedores (usuario_id,nombre,tienda,dui,telefono,estado,nivel,cuenta_estado,seguridad_estado,seguridad_tipo,dos_factores,permisos) VALUES (?,?,?,?,?,'activo','basico','Vinculada','Contraseña temporal pendiente','warn',0,?)",[
              u.insertId,s.nombre,s.tienda,s.dui,s.telefono,
              JSON.stringify(['Publicar productos','Editar publicaciones','Ver pedidos','Responder clientes','Solicitar liquidación','Abrir soporte'])
            ],(e4,v)=>{
              if(e4)return rollback(()=>res.status(500).json({mensaje:'No se pudo crear el vendedor',error:e4.message}));

              conn.query("UPDATE vendedor_solicitudes SET estado='aprobada',vendedor_id=?,revisado_por=?,revisado_en=NOW(),motivo_revision=NULL WHERE id=?",[
                v.insertId,actorAuditoriaId(req),s.id
              ],e5=>{
                if(e5)return rollback(()=>res.status(500).json({mensaje:'No se pudo cerrar la solicitud'}));

                conn.query('INSERT INTO vendedor_solicitud_bitacora (solicitud_id,actor_usuario_id,actor_nombre,accion,detalle) VALUES (?,?,?,?,?)',[
                  s.id,actorAuditoriaId(req),req.usuario?.nombre||req.usuario?.email||'Administrador','aprobacion',`Solicitud aprobada y vendedor #${v.insertId} creado`
                ],eBit=>{
                  if(eBit)return rollback(()=>res.status(500).json({mensaje:'No se pudo registrar la aprobación en bitácora'}));

                  conn.commit(e6=>{
                    if(e6)return rollback(()=>res.status(500).json({mensaje:'No se pudo confirmar la aprobación'}));
                    liberar();
                    res.json({mensaje:'Vendedor aprobado y activado',vendedorId:v.insertId,passwordTemporal:temporal});
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

module.exports=router;
