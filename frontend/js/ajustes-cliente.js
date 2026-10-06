const API='http://localhost:3000/api';
const token=localStorage.getItem('token');
const usuario=(()=>{try{return JSON.parse(localStorage.getItem('usuario')||'null')}catch{return null}})();
const $=s=>document.querySelector(s);
const esc=t=>String(t??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
function sesionCliente(){return Boolean(token&&localStorage.getItem('portalSesion')==='tienda'&&String(usuario?.rol||'').toLowerCase()==='cliente')}
function salir(){localStorage.removeItem('token');localStorage.removeItem('usuario');localStorage.removeItem('portalSesion');location.href='login-cliente.html'}
if(!sesionCliente()) location.href='login-cliente.html';

let direcciones=[];
let direccionEliminar=null;

const MUNICIPIOS_POR_DEPARTAMENTO={
  'Ahuachapán':['Ahuachapán','Apaneca','Atiquizaya','Concepción de Ataco','El Refugio','Guaymango','Jujutla','San Francisco Menéndez','San Lorenzo','San Pedro Puxtla','Tacuba','Turín'],
  'Cabañas':['Cinquera','Dolores','Guacotecti','Ilobasco','Jutiapa','San Isidro','Sensuntepeque','Tejutepeque','Victoria'],
  'Chalatenango':['Agua Caliente','Arcatao','Azacualpa','Chalatenango','Citalá','Comalapa','Concepción Quezaltepeque','Dulce Nombre de María','El Carrizal','El Paraíso','La Laguna','La Palma','La Reina','Las Flores','Las Vueltas','Nombre de Jesús','Nueva Concepción','Nueva Trinidad','Ojos de Agua','Potonico','San Antonio de la Cruz','San Antonio Los Ranchos','San Fernando','San Francisco Lempa','San Francisco Morazán','San Ignacio','San Isidro Labrador','San José Cancasque','San Luis del Carmen','San Miguel de Mercedes','San Rafael','Santa Rita','Tejutla'],
  'Cuscatlán':['Candelaria','Cojutepeque','El Carmen','El Rosario','Monte San Juan','Oratorio de Concepción','San Bartolomé Perulapía','San Cristóbal','San José Guayabal','San Pedro Perulapán','San Rafael Cedros','San Ramón','Santa Cruz Analquito','Santa Cruz Michapa','Suchitoto','Tenancingo'],
  'La Libertad':['Antiguo Cuscatlán','Chiltiupán','Ciudad Arce','Colón','Comasagua','Huizúcar','Jayaque','Jicalapa','La Libertad','Nuevo Cuscatlán','Quezaltepeque','Sacacoyo','San José Villanueva','San Juan Opico','San Matías','San Pablo Tacachico','Santa Tecla','Talnique','Tamanique','Teotepeque','Tepecoyo','Zaragoza'],
  'La Paz':['Cuyultitán','El Rosario','Jerusalén','Mercedes La Ceiba','Olocuilta','Paraíso de Osorio','San Antonio Masahuat','San Emigdio','San Francisco Chinameca','San Juan Nonualco','San Juan Talpa','San Juan Tepezontes','San Luis La Herradura','San Luis Talpa','San Miguel Tepezontes','San Pedro Masahuat','San Pedro Nonualco','San Rafael Obrajuelo','Santa María Ostuma','Santiago Nonualco','Tapalhuaca','Zacatecoluca'],
  'La Unión':['Anamorós','Bolívar','Concepción de Oriente','Conchagua','El Carmen','El Sauce','Intipucá','La Unión','Lislique','Meanguera del Golfo','Nueva Esparta','Pasaquina','Polorós','San Alejo','San José','Santa Rosa de Lima','Yayantique','Yucuaiquín'],
  'Morazán':['Arambala','Cacaopera','Chilanga','Corinto','Delicias de Concepción','El Divisadero','El Rosario','Gualococti','Guatajiagua','Joateca','Jocoaitique','Jocoro','Lolotiquillo','Meanguera','Osicala','Perquín','San Carlos','San Fernando','San Francisco Gotera','San Isidro','San Simón','Sensembra','Sociedad','Torola','Yamabal','Yoloaiquín'],
  'San Miguel':['Carolina','Chapeltique','Chinameca','Chirilagua','Ciudad Barrios','Comacarán','El Tránsito','Lolotique','Moncagua','Nueva Guadalupe','Nuevo Edén de San Juan','Quelepa','San Antonio','San Gerardo','San Jorge','San Luis de la Reina','San Miguel','San Rafael Oriente','Sesori','Uluazapa'],
  'San Salvador':['Aguilares','Apopa','Ayutuxtepeque','Ciudad Delgado','Cuscatancingo','El Paisnal','Guazapa','Ilopango','Mejicanos','Nejapa','Panchimalco','Rosario de Mora','San Marcos','San Martín','San Salvador','Santiago Texacuangos','Santo Tomás','Soyapango','Tonacatepeque'],
  'San Vicente':['Apastepeque','Guadalupe','San Cayetano Istepeque','San Esteban Catarina','San Ildefonso','San Lorenzo','San Sebastián','San Vicente','Santa Clara','Santo Domingo','Tecoluca','Tepetitán','Verapaz'],
  'Santa Ana':['Candelaria de la Frontera','Chalchuapa','Coatepeque','El Congo','El Porvenir','Masahuat','Metapán','San Antonio Pajonal','San Sebastián Salitrillo','Santa Ana','Santa Rosa Guachipilín','Santiago de la Frontera','Texistepeque'],
  'Sonsonate':['Acajutla','Armenia','Caluco','Cuisnahuat','Izalco','Juayúa','Nahuizalco','Nahulingo','Salcoatitán','San Antonio del Monte','San Julián','Santa Catarina Masahuat','Santa Isabel Ishuatán','Santo Domingo de Guzmán','Sonsonate','Sonzacate'],
  'Usulután':['Alegría','Berlín','California','Concepción Batres','El Triunfo','Ereguayquín','Estanzuelas','Jiquilisco','Jucuapa','Jucuarán','Mercedes Umaña','Nueva Granada','Ozatlán','Puerto El Triunfo','San Agustín','San Buenaventura','San Dionisio','San Francisco Javier','Santa Elena','Santa María','Santiago de María','Tecapán','Usulután']
};

function formatearTelefonoSV(valor=''){const d=String(valor).replace(/\D/g,'').replace(/^503(?=\d{8}$)/,'').slice(0,8);return d.length>4?`${d.slice(0,4)}-${d.slice(4)}`:d;}
function cargarMunicipios(departamento,seleccion=''){
  const select=$('#direccionCuentaMunicipio');
  const lista=MUNICIPIOS_POR_DEPARTAMENTO[departamento]||[];
  select.innerHTML=lista.length?'<option value="">Seleccionar municipio / distrito</option>'+lista.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join(''):'<option value="">Primero selecciona un departamento</option>';
  select.disabled=!lista.length;
  if(seleccion){if(!lista.includes(seleccion)){const op=document.createElement('option');op.value=seleccion;op.textContent=seleccion;select.appendChild(op)}select.value=seleccion;}
}

async function api(path,opts={}){
  const r=await fetch(`${API}${path}`,{...opts,headers:{...(opts.headers||{}),Authorization:`Bearer ${token}`}});
  if(r.status===401||r.status===403){salir();throw new Error('Sesión no válida')}
  const data=await r.json().catch(()=>({}));
  if(!r.ok){const err=new Error(data.mensaje||'No se pudo completar la solicitud');err.status=r.status;err.codigo=data.codigo;throw err}
  return data;
}
function mostrarMensaje(texto,tipo=''){const m=$('#mensajeDirecciones');m.textContent=texto;m.className=`settings-message ${tipo}`;m.hidden=false;clearTimeout(m._timer);m._timer=setTimeout(()=>m.hidden=true,4200)}
function mensajeModal(texto){const m=$('#direccionCuentaMensaje');m.textContent=texto;m.className='settings-message error';m.hidden=false}
function resumenHtml(d){return `<strong>${esc(d.nombre_receptor||'')}</strong><span>${esc(d.telefono||'')}</span><span>${esc(d.direccion||'')}</span><span>${esc([d.municipio,d.departamento].filter(Boolean).join(', '))}</span>${d.referencia?`<small>Referencia: ${esc(d.referencia)}</small>`:''}`;}

function renderDirecciones(){
  const host=$('#listaDireccionesCuenta');
  const total=direcciones.length;
  $('#contadorDirecciones').textContent=`${total} de 3`;
  const add=$('#btnAgregarDireccionCuenta');
  add.disabled=total>=3;
  add.querySelector('small').textContent=total>=3?'Límite de 3 direcciones alcanzado':'Guarda una nueva dirección favorita';
  if(!total){host.innerHTML='<div class="address-empty"><strong>Aún no tienes direcciones guardadas.</strong><br>Agrega una para usarla rápidamente en tus próximas compras.</div>';return;}
  host.innerHTML=direcciones.map(d=>`<article class="account-address-card ${Number(d.principal)===1?'principal':''}">
    <div class="account-address-main"><div class="account-address-data">${resumenHtml(d)}</div>${Number(d.principal)===1?'<span class="account-address-badge">Principal</span>':''}</div>
    <div class="account-address-actions">
      ${Number(d.principal)!==1?`<button type="button" data-principal="${d.id}">Usar como principal</button>`:''}
      <button type="button" data-editar="${d.id}">Editar</button>
      <button type="button" class="danger-link" data-eliminar="${d.id}">Eliminar</button>
    </div>
  </article>`).join('');
  host.querySelectorAll('[data-principal]').forEach(b=>b.addEventListener('click',()=>hacerPrincipal(Number(b.dataset.principal))));
  host.querySelectorAll('[data-editar]').forEach(b=>b.addEventListener('click',()=>abrirFormulario(direcciones.find(x=>Number(x.id)===Number(b.dataset.editar)))));
  host.querySelectorAll('[data-eliminar]').forEach(b=>b.addEventListener('click',()=>abrirEliminar(direcciones.find(x=>Number(x.id)===Number(b.dataset.eliminar)))));
}
async function cargarDirecciones(){
  $('#listaDireccionesCuenta').innerHTML='<div class="address-loading">Cargando direcciones...</div>';
  try{const data=await api('/auth/mis-direcciones');direcciones=Array.isArray(data.direcciones)?data.direcciones:[];renderDirecciones()}catch(e){$('#listaDireccionesCuenta').innerHTML='<div class="address-empty">No se pudieron cargar tus direcciones.</div>';mostrarMensaje(e.message,'error')}
}

function abrirModal(id){const m=$(id);m.classList.add('open');m.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function cerrarModal(id){const m=$(id);m.classList.remove('open');m.setAttribute('aria-hidden','true');if(!document.querySelector('.account-modal.open'))document.body.style.overflow=''}
function abrirFormulario(d=null){
  $('#direccionCuentaId').value=d?.id||'';
  $('#direccionCuentaTitulo').textContent=d?'Editar dirección':'Agregar dirección';
  $('#direccionCuentaTexto').textContent=d?'Actualiza los datos de esta dirección favorita.':'Esta dirección quedará guardada como favorita en tu cuenta.';
  $('#direccionCuentaNombre').value=d?.nombre_receptor||usuario?.nombre||'';
  $('#direccionCuentaTelefono').value=formatearTelefonoSV(String(d?.telefono||'').replace(/^\+?503/,''));
  $('#direccionCuentaDepartamento').value=d?.departamento||'';
  cargarMunicipios($('#direccionCuentaDepartamento').value,d?.municipio||'');
  $('#direccionCuentaDetalle').value=d?.direccion||'';
  $('#direccionCuentaReferencia').value=d?.referencia||'';
  $('#direccionCuentaPrincipal').checked=d?Number(d.principal)===1:direcciones.length===0;
  $('#direccionCuentaPrincipal').disabled=Boolean(d&&Number(d.principal)===1);
  $('#direccionCuentaMensaje').hidden=true;
  $('#btnGuardarDireccionCuenta').textContent=d?'Actualizar dirección':'Guardar dirección';
  abrirModal('#modalDireccionCuenta');
}
function abrirEliminar(d){if(!d)return;direccionEliminar=d;$('#direccionEliminarResumen').innerHTML=resumenHtml(d);abrirModal('#modalEliminarDireccionCuenta')}

async function hacerPrincipal(id){
  try{await api(`/auth/mis-direcciones/${id}/principal`,{method:'PUT'});await cargarDirecciones();mostrarMensaje('Dirección principal actualizada.','success')}catch(e){mostrarMensaje(e.message,'error')}
}

$('#formDireccionCuenta').addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=$('#btnGuardarDireccionCuenta');
  const numero=$('#direccionCuentaTelefono').value.replace(/\D/g,'').slice(0,8);
  const payload={nombre_receptor:$('#direccionCuentaNombre').value.trim(),telefono:numero.length===8?`+503${numero}`:numero,departamento:$('#direccionCuentaDepartamento').value,municipio:$('#direccionCuentaMunicipio').value,direccion:$('#direccionCuentaDetalle').value.trim(),referencia:$('#direccionCuentaReferencia').value.trim()};
  if(numero.length!==8){mensajeModal('Ingresa los 8 dígitos del número de teléfono.');return;}
  const id=Number($('#direccionCuentaId').value||0);
  btn.disabled=true;btn.textContent='Guardando...';$('#direccionCuentaMensaje').hidden=true;
  try{
    const data=await api(id?`/auth/mis-direcciones/${id}`:'/auth/mis-direcciones',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const saved=data.direccion;
    if($('#direccionCuentaPrincipal').checked&&saved?.id&&Number(saved.principal)!==1)await api(`/auth/mis-direcciones/${saved.id}/principal`,{method:'PUT'});
    cerrarModal('#modalDireccionCuenta');await cargarDirecciones();mostrarMensaje(id?'Dirección actualizada.':'Dirección guardada.','success');
  }catch(err){if(err.codigo==='LIMITE_DIRECCIONES')mensajeModal('Ya tienes 3 direcciones guardadas. Elimina una dirección antes de agregar otra.');else mensajeModal(err.message)}
  finally{btn.disabled=false;btn.textContent=id?'Actualizar dirección':'Guardar dirección'}
});

$('#btnConfirmarEliminarDireccion').addEventListener('click',async()=>{
  if(!direccionEliminar)return;
  const btn=$('#btnConfirmarEliminarDireccion');btn.disabled=true;btn.textContent='Eliminando...';
  try{await api(`/auth/mis-direcciones/${direccionEliminar.id}`,{method:'DELETE'});direccionEliminar=null;cerrarModal('#modalEliminarDireccionCuenta');await cargarDirecciones();mostrarMensaje('Dirección eliminada.','success')}catch(e){mostrarMensaje(e.message,'error')}finally{btn.disabled=false;btn.textContent='Eliminar dirección'}
});

$('#btnAgregarDireccionCuenta').addEventListener('click',()=>{if(direcciones.length>=3){mostrarMensaje('Has alcanzado el límite de 3 direcciones guardadas. Elimina una para agregar otra.','error');return}abrirFormulario()});
$('#direccionCuentaDepartamento').addEventListener('change',e=>cargarMunicipios(e.target.value,''));
$('#direccionCuentaTelefono').addEventListener('input',e=>e.target.value=formatearTelefonoSV(e.target.value));
document.querySelectorAll('[data-close-address]').forEach(b=>b.addEventListener('click',()=>cerrarModal('#modalDireccionCuenta')));
document.querySelectorAll('[data-close-delete]').forEach(b=>b.addEventListener('click',()=>cerrarModal('#modalEliminarDireccionCuenta')));

function activarTab(nombre){document.querySelectorAll('[data-settings-tab]').forEach(b=>b.classList.toggle('active',b.dataset.settingsTab===nombre));document.querySelectorAll('[data-settings-panel]').forEach(p=>{const active=p.dataset.settingsPanel===nombre;p.classList.toggle('active',active);p.hidden=!active});if(nombre==='direcciones')cargarDirecciones();history.replaceState(null,'',`#${nombre}`)}
document.querySelectorAll('[data-settings-tab]').forEach(b=>b.addEventListener('click',()=>activarTab(b.dataset.settingsTab)));
const tabInicial=location.hash==='#direcciones'?'direcciones':'apariencia';activarTab(tabInicial);
