// TiendaPro FASE104 - detalle producto, archivo único para evitar caché de versiones antiguas.
const API='http://localhost:3000/api';
const BACKEND=API.replace(/\/api\/?$/,'');
const imageUrl=path=>{if(!path)return '';const v=String(path).trim();if(/^(https?:|data:|blob:)/i.test(v))return v;return `${BACKEND}${v.startsWith('/')?'':'/'}${v}`;};
const $=s=>document.querySelector(s);
const esc=t=>String(t??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
const money=v=>`$${Number(v||0).toFixed(2)}`;
function careSvg(code){
  const common='viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
  const wrap=x=>`<svg class="care-symbol" ${common}>${x}</svg>`;
  code=String(code||'');
  if(/no_cloro/.test(code))return wrap('<path d="M24 8 8 38h32L24 8Z"/><path d="m10 36 28-24M14 12l24 24"/>');
  if(/lavar_mano/.test(code))return wrap('<path d="M7 18h34l-3 21H10L7 18Z"/><path d="M7 18c5 4 9-4 14 0s9-4 14 0 6 0 6 0"/><path d="m19 24 2-9c.5-2 3-2 3 0v7l2-11c.5-2 3-2 3 0l-1 12 3-9c.6-2 3-1 3 1l-2 11"/>');
  if(/lavar_frio|ciclo_delicado/.test(code))return wrap('<path d="M7 17h34l-3 22H10L7 17Z"/><path d="M7 17c5 4 9-4 14 0s9-4 14 0 6 0 6 0"/><path d="M13 43h22"/>');
  if(/no_secadora/.test(code))return wrap('<rect x="9" y="9" width="30" height="30"/><circle cx="24" cy="24" r="10"/><path d="m8 8 32 32"/>');
  if(/secadora_baja/.test(code))return wrap('<rect x="9" y="9" width="30" height="30"/><circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="1.8" fill="currentColor" stroke="none"/>');
  if(/no_planchar/.test(code))return wrap('<path d="M9 32h30l-5-14H18c-5 0-8 4-9 14Z"/><path d="M22 18v-5h9"/><path d="m8 8 32 32"/>');
  if(/plancha_baja/.test(code))return wrap('<path d="M9 32h30l-5-14H18c-5 0-8 4-9 14Z"/><path d="M22 18v-5h9"/><circle cx="25" cy="26" r="1.7" fill="currentColor" stroke="none"/>');
  if(/no_lavado_seco/.test(code))return wrap('<circle cx="24" cy="24" r="15"/><path d="m10 10 28 28"/>');
  if(/reciclar|bateria_reciclaje|basura|ambiente/.test(code))return wrap('<path d="m22 7 5 7-4 2M27 14h7l5 9M39 23l-8 1 1-4M32 35H17l-3-6M14 29l-4 7-4-7M10 29l7-12h7"/>');
  if(/agua|sumergir|seco|polvo|secar/.test(code))return wrap('<path d="M24 6S13 20 13 29a11 11 0 0 0 22 0C35 20 24 6 24 6Z"/><path d="m8 8 32 32"/>');
  if(/calor|fuego|inflamable|sol/.test(code))return wrap('<path d="M26 5c2 8-5 9-2 16 2-4 7-5 8-10 7 8 9 15 5 23-3 6-9 9-15 8-8-1-13-8-11-16 2-7 8-10 15-21Z"/>');
  if(/frio|refriger|congel/.test(code))return wrap('<path d="M24 6v36M8 15l32 18M40 15 8 33M18 9l6 5 6-5M18 39l6-5 6 5"/>');
  if(/ninos/.test(code))return wrap('<circle cx="24" cy="17" r="7"/><path d="M12 40c1-10 6-15 12-15s11 5 12 15"/><path d="m8 8 32 32"/>');
  if(/ingerir|vencimiento|consumir/.test(code))return wrap('<path d="M13 9h22v30H13z"/><path d="M18 15h12M18 22h12M18 29h7"/><path d="M32 31l7 7M39 31l-7 7"/>');
  if(/golpes|fragil|caer|arriba|apilar|perforar/.test(code))return wrap('<path d="M9 14 24 6l15 8v20l-15 8-15-8V14Z"/><path d="m9 14 15 8 15-8M24 22v20"/>');
  if(/interior|exterior|lugar/.test(code))return wrap('<path d="m7 23 17-15 17 15"/><path d="M11 20v20h26V20M20 40V28h8v12"/>');
  if(/leer_manual/.test(code))return wrap('<path d="M7 10c7-2 12 0 17 4v27c-5-4-10-6-17-4V10ZM41 10c-7-2-12 0-17 4v27c5-4 10-6 17-4V10Z"/>');
  if(/peso/.test(code))return wrap('<path d="M10 40h28l-3-24H13l-3 24Z"/><path d="M19 16a5 5 0 0 1 10 0"/>');
  if(/desconectar/.test(code))return wrap('<path d="M18 8v13M30 8v13M14 21h20v5c0 6-4 10-10 10s-10-4-10-10v-5ZM24 36v7"/>');
  return wrap('<path d="M24 5 44 41H4L24 5Z"/><path d="M24 17v12M24 35h.01"/>');
}

let producto=null, presentacionActiva=null, varianteActiva=null, imagenActiva='';
let cantidadSeleccionada=1;
let datosResenas={resumen:{total:0,promedio:0,distribucion:{5:0,4:0,3:0,2:0,1:0}},resenas:[]};
let estadoResenaCliente=null;
let estrellasResenaSeleccionadas=0;
let carrito=JSON.parse(localStorage.getItem('tiendapro_carrito_publico')||'[]');


// FASE 65 · Sincroniza la sesión del cliente con el encabezado de la tienda pública.
function usuarioActualDetalle(){
  try{return JSON.parse(localStorage.getItem('usuario')||'null')}catch(_){return null}
}
function tieneSesionClienteDetalle(){
  const u=usuarioActualDetalle();
  return Boolean(
    localStorage.getItem('token') &&
    localStorage.getItem('portalSesion')==='tienda' &&
    String(u?.rol||'').toLowerCase()==='cliente'
  );
}
function actualizarSesionVisualDetalle(){
  const u=usuarioActualDetalle();
  const ok=tieneSesionClienteDetalle();
  const invitado=$('#accionesInvitadoDetalle');
  const cliente=$('#accionesClienteDetalle');
  if(invitado) invitado.hidden=ok;
  if(cliente) cliente.hidden=!ok;
  if(ok && $('#saludoClienteDetalle')) $('#saludoClienteDetalle').textContent=`Hola, ${u?.nombre||'Cliente'}`;
}
function cerrarSesionClienteDetalle(){
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('portalSesion');
  actualizarSesionVisualDetalle();
}

function count(){
  const n=carrito.reduce((s,i)=>s+Number(i.cantidad||0),0);
  // El detalle usa el encabezado público compartido. Actualizamos solamente
  // los contadores que realmente existan y conservamos compatibilidad con
  // versiones antiguas del encabezado.
  ['#sharedCartCount','#sharedCartCountCliente','#countDetalle'].forEach(sel=>{
    const el=$(sel);
    if(!el) return;
    el.textContent=n;
    el.hidden=n<=0;
  });
}
function toast(t){const x=$('#toastProducto');x.textContent=t;x.hidden=false;clearTimeout(window.__tpToast);window.__tpToast=setTimeout(()=>x.hidden=true,1800)}
function finalPrecio(base,descuento=0){const p=Number(base||0),d=Number(descuento||0);return Math.max(0,p-(p*d/100));}
function estadoProducto(p,stock){if(Number(stock)>0)return 'Disponible';if(p.estado_visual==='bajo_pedido'||Number(p.permite_bajo_pedido)===1)return 'Bajo pedido';return 'Agotado'}

function sellerLogo(p,cls='seller-logo'){
  const src=imageUrl(p?.logo_tienda||'');
  if(src)return `<img class="${cls}" src="${esc(src)}" alt="Logo de ${esc(p?.tienda||'tienda')}">`;
  return `<span class="seller-logo-fallback">${esc((p?.tienda||'T').charAt(0).toUpperCase())}</span>`;
}

function guardarVista(p){try{let h=JSON.parse(localStorage.getItem('tiendapro_productos_vistos')||'[]');h=h.filter(x=>Number(x.id)!==Number(p.id));h.unshift({id:p.id,categoria:p.categoria||'',marca:p.marca||'',vendedor_id:p.vendedor_id||null,ts:Date.now()});localStorage.setItem('tiendapro_productos_vistos',JSON.stringify(h.slice(0,30)))}catch(_){}}

async function cargar(){
  const id=new URLSearchParams(location.search).get('id');
  if(!id){$('#estadoProducto').textContent='Producto no válido';return}
  try{
    const r=await fetch(`${API}/productos/publicos/${encodeURIComponent(id)}`);
    const d=await r.json().catch(()=>({})); if(!r.ok)throw new Error(d.mensaje||'Producto no encontrado');
    producto=d.producto; guardarVista(producto); await cargarResenas(producto.id); render(producto,d.relacionados||[]); cargarPersonalizados(producto);
  }catch(e){$('#estadoProducto').textContent=e.message}
}

function presentaciones(p){return Array.isArray(p.presentaciones)?p.presentaciones:[]}
function primeraVariante(pr){return pr?.variantes?.[0]||null}
function precioPresentacion(pr){const v=varianteActiva&&Number(varianteActiva.presentacion_id||pr?.id)===Number(pr?.id)?varianteActiva:null;return Number(v?.precio??pr?.precio_min??producto?.precio??0)}
function stockPresentacion(pr){if(varianteActiva)return Number(varianteActiva.stock||0);return Number(pr?.stock_total??producto?.stock_fisico_disponible??producto?.stock??0)}
function imagenPrincipal(pr){const imgs=pr?.imagenes||[];return imageUrl(imgs.find(i=>Number(i.es_principal)===1)?.ruta_imagen||imgs[0]?.ruta_imagen||producto?.imagen||'')}
function thumbsGaleria(pr){return (pr?.imagenes||[]).map(i=>imageUrl(i.ruta_imagen)).filter(Boolean)}

function render(p,rel){
  $('#estadoProducto').hidden=true; $('#fichaProducto').hidden=false;
  $('#breadCategoria').textContent=p.categoria||'Producto'; $('#breadNombre').textContent=p.nombre; document.title=`${p.nombre} | TiendaPro`;
  const prs=presentaciones(p);
  const qs=new URLSearchParams(location.search), wantedPresentation=Number(qs.get('presentacion')||0), wantedVariant=Number(qs.get('variante')||0);
  presentacionActiva=(wantedPresentation?prs.find(x=>Number(x.id)===wantedPresentation):null)||prs[0]||null;
  varianteActiva=(wantedVariant?(presentacionActiva?.variantes||[]).find(x=>Number(x.id)===wantedVariant):null)||primeraVariante(presentacionActiva);
  imagenActiva=imagenPrincipal(presentacionActiva);
  dibujarFicha(); dibujarAcordeones(); dibujarTienda(); dibujarRelacionados(rel); bindFicha();
}

function textoPlano(v){return String(v??'').replace(/\s+/g,' ').trim()}
function resumenProducto(p){
  const descripcion=textoPlano(p?.descripcion||'');
  const attrs=Array.isArray(p?.atributos)?p.atributos:[];
  const detalles=Array.isArray(p?.detalles_adicionales)?p.detalles_adicionales:[];
  const chips=[];
  if(p?.modelo)chips.push(['Modelo',p.modelo]);
  for(const a of attrs.slice(0,3)) if(a?.nombre&&a?.valor) chips.push([a.nombre,a.valor]);
  if(!chips.length&&p?.marca)chips.push(['Marca',p.marca]);
  if(detalles.length&&chips.length<3)chips.push([detalles[0]?.titulo||'Detalle',detalles[0]?.detalle||'']);
  const largo=descripcion.length>210||attrs.length>3||detalles.length>1||(p?.cuidados||[]).length>2||presentaciones(p).length>1;
  return {descripcion:descripcion||'El vendedor todavía no ha agregado una descripción ampliada para este producto.',chips:chips.slice(0,3),largo};
}
function garantiaTexto(p){return Number(p?.sin_garantia)===1?'Sin garantía':Number(p?.garantia_dias)>0?`${Number(p.garantia_dias)} días`:'Consultar con vendedor'}
function abrirInfoCompleta(){
  const p=producto;if(!p)return;
  const modal=$('#modalInfoProducto'),root=$('#modalInfoContenido');
  const attrs=Array.isArray(p.atributos)?p.atributos:[], det=Array.isArray(p.detalles_adicionales)?p.detalles_adicionales:[], care=Array.isArray(p.cuidados)?p.cuidados:[], custom=Array.isArray(p.cuidados_personalizados)?p.cuidados_personalizados:[], prs=presentaciones(p);
  const basics=[['Marca',p.marca],['Modelo',p.modelo],['Categoría',p.categoria],['Condición',p.condicion],['Garantía',garantiaTexto(p)],['Tipo de venta',p.tipo_venta],['Entrega',p.tiempo_entrega||'Según disponibilidad']].filter(x=>x[1]);
  const variantesHtml=prs.length?prs.map(pr=>{
    const vars=Array.isArray(pr.variantes)?pr.variantes:[];
    const sub=vars.length?vars.map(v=>`<div class="modal-variant-row"><span>${esc([v.publico&&v.publico!=='general'?v.publico:'',v.talla].filter(Boolean).join(' · ')||'Presentación estándar')}</span><strong>${money(v.precio)}</strong><small>${Number(v.stock||0)} en stock</small></div>`).join(''):'<div class="modal-empty">Sin variantes adicionales.</div>';
    return `<div class="modal-presentation"><h4>${esc(pr.nombre||'Presentación')}</h4>${sub}</div>`;
  }).join(''):'';
  root.innerHTML=`
    <section class="modal-info-section"><h3>Descripción</h3><p>${esc(p.descripcion||'Este producto todavía no tiene una descripción ampliada.')}</p></section>
    ${basics.length?`<section class="modal-info-section"><h3>Datos principales</h3><div class="modal-spec-grid">${basics.map(x=>`<div><span>${esc(x[0])}</span><strong>${esc(x[1])}</strong></div>`).join('')}</div></section>`:''}
    ${attrs.length?`<section class="modal-info-section"><h3>Características</h3><div class="modal-spec-grid">${attrs.map(a=>`<div><span>${esc(a.nombre)}</span><strong>${esc(a.valor)}</strong></div>`).join('')}</div></section>`:''}
    ${prs.length?`<section class="modal-info-section"><h3>Presentaciones y variantes</h3><div class="modal-presentations">${variantesHtml}</div></section>`:''}
    ${det.length?`<section class="modal-info-section"><h3>Información adicional</h3><div class="modal-spec-grid">${det.map(d=>`<div><span>${esc(d.titulo||'Detalle')}</span><strong>${esc(d.detalle||'')}</strong></div>`).join('')}</div></section>`:''}
    ${(care.length||custom.length)?`<section class="modal-info-section"><h3>Cuidados y advertencias</h3><div class="modal-care-grid">${care.map(c=>`<div class="modal-care-item"><span>${careSvg(c.codigo)}</span><div><strong>${esc(c.nombre)}</strong><small>${esc(c.descripcion||'')}</small></div></div>`).join('')}${custom.map(c=>`<div class="modal-care-item"><span>${careSvg('custom')}</span><div><strong>Indicación del vendedor</strong><small>${esc(c.texto||'')}</small></div></div>`).join('')}</div></section>`:''}`;
  modal.hidden=false;modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-product-open');
}
function cerrarInfoCompleta(){const modal=$('#modalInfoProducto');if(!modal)return;modal.hidden=true;modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-product-open')}

function dibujarFicha(){
  const p=producto,prs=presentaciones(p),pr=presentacionActiva;
  const gallery=thumbsGaleria(pr); if(!imagenActiva)imagenActiva=gallery[0]||imageUrl(p.imagen||'');
  const tieneVariantes=prs.length>1;
  const variantes=pr?.variantes||[];
  const publicos=[...new Set(variantes.map(v=>String(v.publico||'general')).filter(Boolean))];
  const publicoActivo=String(varianteActiva?.publico||publicos[0]||'general');
  const varsPublico=variantes.filter(v=>String(v.publico||'general')===publicoActivo);
  const tallas=varsPublico.filter(v=>v.talla).map(v=>({id:v.id,talla:v.talla,stock:Number(v.stock||0)}));
  if(varianteActiva && !varsPublico.some(v=>Number(v.id)===Number(varianteActiva.id))) varianteActiva=varsPublico[0]||variantes[0]||null;
  const precio=Number(varianteActiva?.precio??pr?.precio_min??p.precio??0), desc=Number(p.descuento||0), stock=stockPresentacion(pr), estado=estadoProducto(p,stock);
  const garantia=Number(p.sin_garantia)===1?'Sin garantía':Number(p.garantia_dias)>0?`${Number(p.garantia_dias)} días`:'Consultar con vendedor';
  const maxCantidad=estado==='Bajo pedido'?99:Math.max(1,Number(stock||0));
  cantidadSeleccionada=Math.max(1,Math.min(Number(cantidadSeleccionada||1),maxCantidad));
  const vendedor=esc(p.tienda||p.vendedor_nombre||'TiendaPro');
  const nivel=p.vendedor_nivel?`Nivel ${esc(p.vendedor_nivel)}`:'Vendedor verificado';

  $('#fichaProducto').innerHTML=`
    <div class="media-area">
      <div class="gallery-thumbs ${gallery.length<=1?'single':''}">${gallery.map((src,i)=>`<button class="gallery-thumb ${src===imagenActiva?'active':''}" data-image="${esc(src)}"><img src="${esc(src)}" alt="Vista ${i+1}"></button>`).join('')}</div>
      <div class="gallery-main">${imagenActiva?`<img id="imagenPrincipal" src="${esc(imagenActiva)}" alt="${esc(p.nombre)}">`:'<div class="no-image">📦</div>'}</div>
    </div>

    <div class="product-info">
      <button class="store-mini" ${p.vendedor_id?`data-store="${p.vendedor_id}"`:''}>${vendedor} <span>›</span></button>
      <h1>${esc(p.nombre)}</h1>
      <div class="product-rating-row"><span class="rating-stars">${estrellasVisuales(datosResenas.resumen.promedio)}</span><span class="rating-muted">${datosResenas.resumen.total?`${datosResenas.resumen.promedio.toFixed(1)} (${datosResenas.resumen.total} reseñas)`:'Sin reseñas'}</span><span class="rating-sep">|</span><span class="rating-muted">${Number(p.vendidos||0)} vendidos</span></div>
      <div class="meta-row"><span class="pill">${esc(p.marca||'Sin marca')}</span><span class="pill">${esc(p.categoria||'Sin categoría')}</span>${p.vendidos?`<span class="pill">${Number(p.vendidos)} vendidos</span>`:'<span class="pill">Nuevo en TiendaPro</span>'}</div>
      <div class="price-box"><span class="final-price">${money(finalPrecio(precio,desc))}</span>${desc>0?`<span class="old-price">${money(precio)}</span><span class="discount">-${desc}%</span><small class="price-saving">Ahorras ${money(precio-finalPrecio(precio,desc))}</small>`:''}</div>

      ${tieneVariantes?`<div class="option-block"><div class="option-title"><strong>Color / presentación</strong><span>${esc(pr?.nombre||'')}</span></div><div class="variant-tiles">${prs.map(x=>{const src=imagenPrincipal(x);return `<button class="variant-tile ${Number(x.id)===Number(pr?.id)?'active':''}" data-presentation="${x.id}" title="${esc(x.nombre)}">${src?`<img src="${esc(src)}" alt="${esc(x.nombre)}">`:'<span>📦</span>'}<small>${esc(x.nombre)}</small></button>`}).join('')}</div></div>`:''}
      ${publicos.length>1?`<div class="option-block"><div class="option-title"><strong>Público</strong><span>${esc(publicoActivo)}</span></div><div class="choice-row">${publicos.map(x=>`<button class="choice ${x===publicoActivo?'active':''}" data-publico="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`:''}
      ${tallas.length?`<div class="option-block"><div class="option-title"><strong>Talla</strong><span>${esc(varianteActiva?.talla||'Selecciona')}</span></div><div class="size-grid">${tallas.map(x=>`<button class="size-choice ${Number(varianteActiva?.id)===Number(x.id)?'active':''}" data-variant="${x.id}" ${x.stock<=0?'disabled':''}>${esc(x.talla)}</button>`).join('')}</div></div>`:''}

      <div class="feature-strip">
        <div class="feature-chip"><b>✓ ${esc(p.condicion||'Nuevo')}</b><span>Condición</span></div>
        <div class="feature-chip"><b>🛡 ${esc(garantia)}</b><span>Garantía</span></div>
        <div class="feature-chip"><b>📦 ${esc(estado)}</b><span>Disponibilidad</span></div>
        <div class="feature-chip"><b>🚚 ${esc(p.tiempo_entrega||'Según disponibilidad')}</b><span>Entrega estimada</span></div>
      </div>
      <div class="stock-banner"><span>✓ ${estado==='Bajo pedido'?'Disponible bajo pedido':estado==='Agotado'?'Sin stock disponible':`Stock disponible: ${Number(stock||0)} ${Number(stock)===1?'unidad':'unidades'}`}</span><small>Información actual del producto</small></div>
      ${(()=>{const r=resumenProducto(p);return `<section class="product-summary-card"><div class="summary-head"><strong>Resumen del producto</strong>${r.largo?'<button type="button" id="verMasProducto" class="summary-more">Ver más</button>':''}</div><p>${esc(r.descripcion)}</p>${r.chips.length?`<div class="summary-facts">${r.chips.map(x=>`<div><span>${esc(x[0])}</span><strong>${esc(x[1])}</strong></div>`).join('')}</div>`:''}</section>`})()}
    </div>

    <aside class="purchase-side">
      <div class="seller-box">
        <div class="seller-topline"><div class="side-label">Vendido por</div>${p.vendedor_id?`<button class="seller-view" data-store="${p.vendedor_id}">Ver perfil del vendedor</button>`:""}</div>
        <div class="seller-brand-row">${sellerLogo(p)}<div><button class="seller-name" ${p.vendedor_id?`data-store="${p.vendedor_id}"`:''}>${vendedor}</button><div class="seller-status">✓ ${nivel}</div></div></div>
      </div>
      <div class="side-divider"></div>
      <div class="side-status ${estado==='Disponible'?'ok':estado==='Bajo pedido'?'warn':'off'}">${esc(estado)}</div>
      <div class="side-line"><span class="side-icon">▣</span><div><strong>Envío</strong><small>${esc(p.tiempo_entrega||'Se confirma según disponibilidad y ubicación.')}</small></div></div>
      <div class="side-line"><span class="side-icon">↩</span><div><strong>Devoluciones</strong><small>Las condiciones aplicables se mostrarán durante la compra.</small></div></div>
      <div class="side-line"><span class="side-icon">✓</span><div><strong>Compra segura</strong><small>Tu pedido se procesa dentro de TiendaPro.</small></div></div>
      <div class="side-divider"></div>
      <div class="quantity-block">
        <div><strong>Cantidad</strong><small>${estado==='Bajo pedido'?'Sujeto a confirmación':`${stock} disponible${Number(stock)===1?'':'s'}`}</small></div>
        <div class="qty-control"><button id="menosCantidad" ${cantidadSeleccionada<=1?'disabled':''}>−</button><span id="cantidadDetalle">${cantidadSeleccionada}</span><button id="masCantidad" ${(estado!=='Bajo pedido' && cantidadSeleccionada>=maxCantidad)||estado==='Agotado'?'disabled':''}>+</button></div>
      </div>
      <button id="agregarDetalle" class="add-cart side-add" ${estado==='Agotado'?'disabled':''}>${estado==='Agotado'?'Producto agotado':'Agregar al carrito'}</button>
      <button id="comprarAhoraDetalle" class="back-shop side-back buy-now" type="button" ${estado==='Agotado'?'disabled':''}>${estado==='Agotado'?'Producto agotado':'Comprar ahora'}</button>
      <div class="payment-safe"><span>Compra protegida dentro de TiendaPro</span><div class="payment-badges"><b>🔒 Pago seguro</b><b>✓ Protección de compra</b></div></div>
    </aside>`;
}
function bindFicha(){
  document.querySelectorAll('[data-store]').forEach(b=>b.onclick=()=>location.href=`tienda.html?id=${b.dataset.store}`);
  document.querySelectorAll('.gallery-thumb').forEach(b=>b.onclick=()=>{imagenActiva=b.dataset.image;document.querySelectorAll('.gallery-thumb').forEach(x=>x.classList.toggle('active',x===b));const im=$('#imagenPrincipal');if(im)im.src=imagenActiva});
  document.querySelectorAll('[data-presentation]').forEach(b=>b.onclick=()=>{presentacionActiva=presentaciones(producto).find(x=>Number(x.id)===Number(b.dataset.presentation))||presentacionActiva;varianteActiva=primeraVariante(presentacionActiva);imagenActiva=imagenPrincipal(presentacionActiva);cantidadSeleccionada=1;dibujarFicha();bindFicha()});
  document.querySelectorAll('[data-publico]').forEach(b=>b.onclick=()=>{const vars=presentacionActiva?.variantes||[];varianteActiva=vars.find(v=>String(v.publico||'general')===b.dataset.publico)||vars[0]||null;cantidadSeleccionada=1;dibujarFicha();bindFicha()});
  document.querySelectorAll('[data-variant]').forEach(b=>b.onclick=()=>{varianteActiva=(presentacionActiva?.variantes||[]).find(v=>Number(v.id)===Number(b.dataset.variant))||varianteActiva;cantidadSeleccionada=1;dibujarFicha();bindFicha()});
  $('#menosCantidad')?.addEventListener('click',()=>{cantidadSeleccionada=Math.max(1,cantidadSeleccionada-1);dibujarFicha();bindFicha()});
  $('#masCantidad')?.addEventListener('click',()=>{const stock=stockPresentacion(presentacionActiva);const max=estadoProducto(producto,stock)==='Bajo pedido'?99:Math.max(1,stock);cantidadSeleccionada=Math.min(max,cantidadSeleccionada+1);dibujarFicha();bindFicha()});
  $('#agregarDetalle')?.addEventListener('click',add);
  $('#comprarAhoraDetalle')?.addEventListener('click',comprarAhora);
  $('#verMasProducto')?.addEventListener('click',abrirInfoCompleta);
}
function add(){
  if(!producto)return; const pr=presentacionActiva,vr=varianteActiva,precio=Number(vr?.precio??pr?.precio_min??producto.precio??0),desc=Number(producto.descuento||0);
  const key=`${producto.id}:${pr?.id||0}:${vr?.id||0}`; const it=carrito.find(i=>i.key===key);
  const nombreVar=[pr?.nombre,vr?.talla].filter(Boolean).join(' · ');
  const qty=Math.max(1,Number(cantidadSeleccionada||1));
  if(it)it.cantidad=Number(it.cantidad||0)+qty;else carrito.push({key,id:producto.id,variante_id:vr?.id||null,presentacion_id:pr?.id||null,nombre:producto.nombre+(nombreVar?` (${nombreVar})`:''),precio:finalPrecio(precio,desc),imagen:imagenActiva||imageUrl(producto.imagen||''),cantidad:qty});
  localStorage.setItem('tiendapro_carrito_publico',JSON.stringify(carrito));count();toast(`${qty} ${qty===1?'producto agregado':'productos agregados'} al carrito`);
}
function comprarAhora(){
  if(!producto)return;
  const pr=presentacionActiva,vr=varianteActiva,precio=Number(vr?.precio??pr?.precio_min??producto.precio??0),desc=Number(producto.descuento||0);
  const key=`${producto.id}:${pr?.id||0}:${vr?.id||0}`;
  const nombreVar=[pr?.nombre,vr?.talla].filter(Boolean).join(' · ');
  const qty=Math.max(1,Number(cantidadSeleccionada||1));
  const it=carrito.find(i=>i.key===key);
  if(it)it.cantidad=Math.max(Number(it.cantidad||0),qty);
  else carrito.push({key,id:producto.id,variante_id:vr?.id||null,presentacion_id:pr?.id||null,nombre:producto.nombre+(nombreVar?` (${nombreVar})`:''),precio:finalPrecio(precio,desc),imagen:imagenActiva||imageUrl(producto.imagen||''),cantidad:qty});
  localStorage.setItem('tiendapro_carrito_publico',JSON.stringify(carrito));
  localStorage.setItem('tiendapro_checkout_pendiente','1');
  location.href='tienda_publica.html?checkout=1';
}
function estrellasVisuales(valor){const n=Math.max(0,Math.min(5,Math.round(Number(valor)||0)));return '★'.repeat(n)+'☆'.repeat(5-n)}
function fechaResena(v){try{return new Intl.DateTimeFormat('es-SV',{year:'numeric',month:'short',day:'numeric'}).format(new Date(v))}catch(_){return ''}}
async function cargarResenas(id){
  try{const r=await fetch(`${API}/productos/${id}/resenas`);if(r.ok)datosResenas=await r.json()}catch(_){}
  estadoResenaCliente=null;
  if(tieneSesionClienteDetalle())try{const r=await fetch(`${API}/productos/${id}/resenas/mi-estado`,{headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}});if(r.ok){estadoResenaCliente=await r.json();estrellasResenaSeleccionadas=Number(estadoResenaCliente.resena?.calificacion||0)}}catch(_){}
}
function htmlResenas(){
  const r=datosResenas.resumen||{},total=Number(r.total||0),prom=Number(r.promedio||0),dist=r.distribucion||{};
  const bars=[5,4,3,2,1].map(n=>{const c=Number(dist[n]||0),pct=total?Math.round(c*100/total):0;return `<div class="review-bar"><span>${n}★</span><div class="review-bar-track"><div class="review-bar-fill" style="width:${pct}%"></div></div><span>${c}</span></div>`}).join('');
  let compose='';
  if(!tieneSesionClienteDetalle()) compose='<div class="review-compose"><p class="review-help">Inicia sesión como cliente para comprobar si puedes reseñar esta compra.</p></div>';
  else if(!estadoResenaCliente?.puede_resenar) compose=`<div class="review-compose"><p class="review-help">${esc(estadoResenaCliente?.motivo||'Podrás escribir una reseña cuando el pedido haya sido entregado.')}</p></div>`;
  else {const propia=estadoResenaCliente.resena;compose=`<div class="review-compose"><strong>${propia?'Editar tu reseña':'Escribir una reseña'}</strong><div class="review-star-picker" aria-label="Calificación">${[1,2,3,4,5].map(n=>`<button type="button" data-review-star="${n}" class="${n<=estrellasResenaSeleccionadas?'active':''}" aria-label="${n} estrellas">★</button>`).join('')}</div><textarea id="reviewComment" maxlength="1500" placeholder="Cuéntanos tu experiencia con el producto...">${esc(propia?.comentario||'')}</textarea><button type="button" id="reviewSubmit" class="review-submit">${propia?'Guardar cambios':'Publicar reseña'}</button><p id="reviewMessage" class="review-help"></p></div>`}
  const list=(datosResenas.resenas||[]).map(x=>`<article class="review-card"><div class="review-head"><div><span class="review-author">${esc(x.cliente)}</span><span class="verified-purchase">✓ Compra verificada</span><div class="review-stars">${estrellasVisuales(x.calificacion)}</div></div><time class="review-date">${fechaResena(x.fecha_creacion)}</time></div><p>${esc(x.comentario)}</p></article>`).join('')||'<div class="reviews-empty">Este producto todavía no tiene reseñas. Las reseñas aparecerán aquí después de compras entregadas.</div>';
  return `<div class="reviews-layout"><aside class="reviews-summary"><div class="reviews-score"><strong>${prom.toFixed(1)}</strong><span>de 5</span></div><div class="reviews-stars">${estrellasVisuales(prom)}</div><p class="review-help">${total} ${total===1?'reseña':'reseñas'} verificadas</p><div class="review-bars">${bars}</div>${compose}</aside><div class="reviews-list">${list}</div></div>`;
}
function bindResenas(root){
  root.querySelectorAll('[data-review-star]').forEach(b=>b.addEventListener('click',()=>{estrellasResenaSeleccionadas=Number(b.dataset.reviewStar);root.querySelectorAll('[data-review-star]').forEach(x=>x.classList.toggle('active',Number(x.dataset.reviewStar)<=estrellasResenaSeleccionadas))}));
  root.querySelector('#reviewSubmit')?.addEventListener('click',async()=>{const msg=root.querySelector('#reviewMessage'),comentario=(root.querySelector('#reviewComment')?.value||'').trim();if(!estrellasResenaSeleccionadas){msg.textContent='Selecciona de 1 a 5 estrellas.';return}const btn=root.querySelector('#reviewSubmit');btn.disabled=true;try{const edit=Boolean(estadoResenaCliente?.resena);const resp=await fetch(`${API}/productos/${producto.id}/resenas${edit?'/mia':''}`,{method:edit?'PUT':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('token')}`},body:JSON.stringify({calificacion:estrellasResenaSeleccionadas,comentario})});const d=await resp.json().catch(()=>({}));if(!resp.ok)throw new Error(d.mensaje||'No se pudo guardar la reseña');await cargarResenas(producto.id);dibujarFicha();bindFicha();dibujarAcordeones();const tab=document.querySelector('[data-tab="resenas"]');tab?.click();toast(edit?'Reseña actualizada':'Reseña publicada')}catch(e){msg.textContent=e.message}finally{btn.disabled=false}});
}
function dibujarAcordeones(){
  const p=producto,attrs=p.atributos||[],care=p.cuidados||[],custom=p.cuidados_personalizados||[],det=p.detalles_adicionales||[];
  const basics=[['Marca',p.marca],['Modelo',p.modelo],['Condición',p.condicion],['Tipo de venta',p.tipo_venta],...attrs.map(a=>[a.nombre,a.valor])].filter(x=>x[1]);
  const highlights=basics.slice(0,6);
  const root=$('#informacionProducto'); root.hidden=false; root.className='product-info-premium';
  root.innerHTML=`
    <nav class="product-tabs" aria-label="Información del producto">
      <button class="product-tab active" data-tab="descripcion">Descripción</button>
      <button class="product-tab" data-tab="caracteristicas">Características${basics.length?` (${basics.length})`:''}</button>
      ${(care.length||custom.length)?'<button class="product-tab" data-tab="cuidados">Cuidados</button>':''}
      <button class="product-tab" data-tab="resenas">Reseñas (${datosResenas.resumen.total})</button>
      <button class="product-tab" data-tab="envios">Envíos y devoluciones</button>
    </nav>
    <section class="product-tab-panel" data-panel="descripcion">
      <div class="premium-description"><div><h3>Descripción del producto</h3><p>${esc(p.descripcion||'Este producto todavía no tiene una descripción ampliada.')}</p></div><div><h3>Lo más destacado</h3><div class="premium-points">${highlights.length?highlights.map(x=>`<div class="premium-point"><i>✓</i><div><strong>${esc(x[0])}</strong><br><span>${esc(x[1])}</span></div></div>`).join(''):'<div class="premium-point"><i>✓</i><div><strong>Compra en TiendaPro</strong><br><span>Consulta disponibilidad, entrega y garantía antes de comprar.</span></div></div>'}</div></div></div>
    </section>
    <section class="product-tab-panel" data-panel="caracteristicas" hidden><h3>Características y detalles</h3><div class="premium-spec-grid">${basics.length?basics.map(x=>`<div class="premium-spec"><span>${esc(x[0])}</span><strong>${esc(x[1])}</strong></div>`).join(''):'<p>El vendedor todavía no ha agregado especificaciones adicionales.</p>'}${det.map(d=>`<div class="premium-spec"><span>${esc(d.titulo||'Detalle')}</span><strong>${esc(d.detalle||'')}</strong></div>`).join('')}</div></section>
    ${(care.length||custom.length)?`<section class="product-tab-panel" data-panel="cuidados" hidden><h3>Cuidados y advertencias</h3><div class="premium-spec-grid">${care.map(c=>`<div class="premium-spec"><span>${esc(c.nombre)}</span><strong>${esc(c.descripcion||'')}</strong></div>`).join('')}${custom.map(c=>`<div class="premium-spec"><span>Indicación del vendedor</span><strong>${esc(c.texto||'')}</strong></div>`).join('')}</div></section>`:''}
    <section class="product-tab-panel" data-panel="resenas" hidden>${htmlResenas()}</section>
    <section class="product-tab-panel" data-panel="envios" hidden><h3>Envíos, devoluciones y compra segura</h3><div class="premium-policy-grid"><div class="premium-policy"><b>🚚 Envío</b><span>${esc(p.tiempo_entrega||'El tiempo se confirma según disponibilidad, ubicación y método de envío.')}</span></div><div class="premium-policy"><b>↩ Devoluciones</b><span>Las condiciones aplicables se mostrarán durante la compra y posteriormente en tu pedido.</span></div><div class="premium-policy"><b>🛡 Compra segura</b><span>Tu compra y los datos del pedido se procesan dentro de TiendaPro.</span></div></div></section>`;
  root.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{root.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===btn));root.querySelectorAll('[data-panel]').forEach(pn=>pn.hidden=pn.dataset.panel!==btn.dataset.tab)}));
  bindResenas(root);
}
function dibujarTienda(){const p=producto;const logo=imageUrl(p.logo_tienda||'');$('#tiendaProducto').hidden=false;$('#tiendaProducto').innerHTML=`<div class="store-card"><div class="store-avatar ${logo?'has-logo':''}">${logo?`<img src="${esc(logo)}" alt="Logo de ${esc(p.tienda||'tienda')}">`:esc((p.tienda||'T').charAt(0).toUpperCase())}</div><div class="store-info"><h3>${esc(p.tienda||'TiendaPro')}</h3><p><span class="verified">✓ Vendedor verificado</span>${p.vendedor_nivel?` · Nivel ${esc(p.vendedor_nivel)}`:''}</p></div>${p.vendedor_id?`<button class="store-button" data-store-button="${p.vendedor_id}">Ver perfil del vendedor</button>`:''}</div>`;document.querySelector('[data-store-button]')?.addEventListener('click',e=>location.href=`tienda.html?id=${e.currentTarget.dataset.storeButton}`)}
let recomendadosCache=[];
function favoritosRecomendados(){try{const lista=JSON.parse(localStorage.getItem('tiendapro_productos_favoritos')||'[]');return Array.isArray(lista)?lista:[]}catch(_){return []}}
function esFavoritoRecomendado(id){return favoritosRecomendados().some(x=>Number(x)===Number(id)||Number(x?.id)===Number(id))}
function alternarFavoritoRecomendado(btn,id){
  let lista=favoritosRecomendados();
  const pid=Number(id),guardado=lista.some(x=>Number(x)===pid||Number(x?.id)===pid);
  lista=guardado?lista.filter(x=>Number(x)!==pid&&Number(x?.id)!==pid):[...lista,pid];
  localStorage.setItem('tiendapro_productos_favoritos',JSON.stringify(lista));
  btn.classList.toggle('active',!guardado);
  btn.textContent='❤';
  btn.setAttribute('aria-pressed',String(!guardado));
  btn.setAttribute('aria-label',guardado?'Guardar en favoritos':'Quitar de favoritos');
  toast(guardado?'Producto quitado de favoritos':'Favorito guardado en este navegador');
}
function card(x){
  if(x&&!recomendadosCache.some(p=>Number(p.id)===Number(x.id)))recomendadosCache.push(x);
  const base=Number(x.precio||0),final=finalPrecio(x.precio,x.descuento),desc=Number(x.descuento||0);
  const rating=Math.max(0,Math.min(5,Number(x.calificacion_promedio??x.promedio_resenas??x.rating_promedio??x.rating??x.calificacion??0)||0));
  const reviews=Math.max(0,Number(x.total_resenas??x.cantidad_resenas??x.resenas??x.reviews_count??x.total_reviews??0)||0);
  const favorito=esFavoritoRecomendado(x.id),stock=Number(Number(x.vendedor_id||0)>0?x.stock??0:x.stock_fisico_disponible??x.stock??0);
  const estado=x.estado_visual==='en_stock'?'Disponible':x.estado_visual==='bajo_pedido'?'Bajo pedido':x.estado_visual==='agotado'?'Agotado':stock>0?'Disponible':x.permite_bajo_pedido?'Bajo pedido':'Agotado';
  const stars=Math.round(rating),src=imageUrl(x.imagen);
  return `<article class="product-card product-card-clickable rec-catalog-card" data-product="${x.id}" role="link" tabindex="0" aria-label="Ver detalles de ${esc(x.nombre)}">
    <div class="product-image">${src?`<img loading="lazy" src="${esc(src)}" alt="${esc(x.nombre)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="placeholder" style="display:none">📦</span>`:'<span class="placeholder">📦</span>'}
      ${desc>0?`<span class="product-discount-ribbon">-${desc}%</span>`:''}
      <div class="product-actions"><button type="button" class="product-action-favorite ${favorito?'active':''}" title="${favorito?'Quitar de favoritos':'Agregar a favoritos'}" aria-label="${favorito?'Quitar de favoritos':'Agregar a favoritos'}" aria-pressed="${favorito}">❤</button></div>
    </div>
    <div class="product-body"><div class="product-brand">${esc(x.tienda||x.marca||'TiendaPro')}</div><h3 class="product-title">${esc(x.nombre)}</h3>
      <div class="product-delivery-time"><span aria-hidden="true">🚚</span><span>Entrega: ${esc(String(x.tiempo_entrega||'Según disponibilidad').trim())}</span></div>
      <div class="product-category">${esc(x.categoria||'Sin categoría')}</div>
      <div class="product-rating"><span class="product-rating-stars">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</span><span class="product-rating-text">${reviews?`${rating.toFixed(1)} (${reviews} reseña${reviews===1?'':'s'})`:'Sin reseñas'}</span></div>
      <div class="badges"><span class="badge ${estado==='Disponible'?'ok':'warn'}">${estado}</span>${stock>0?`<span class="badge">Stock ${stock}</span>`:''}</div>
      <div class="price-row"><span class="price">${money(final)}</span>${desc>0?`<span class="old-price">${money(base)}</span>`:''}<button type="button" class="product-action-cart" title="${estado==='Agotado'?'Producto agotado':'Agregar al carrito'}" aria-label="${estado==='Agotado'?'Producto agotado':'Agregar al carrito'}" ${estado==='Agotado'?'disabled':''}>🛒</button></div>
    </div>
  </article>`;
}
function agregarRecomendadoAlCarrito(x){
  if(!x)return;
  sincronizarCarritoLocal();
  // Los vendedores manejan inventario por cantidad (p.stock). El inventario físico
  // solo corresponde a productos propios de TiendaPro. No usar stock_fisico_disponible
  // de un vendedor porque el listado público puede devolverlo como 0 aunque sí tenga stock.
  const esVendedor=Number(x.vendedor_id||0)>0;
  const stock=esVendedor
    ? Number(x.stock??0)
    : Number(x.stock_fisico_disponible??x.stock??0);
  if(stock<=0 && !x.permite_bajo_pedido){toast('Este producto está agotado.');return;}
  const key=`${x.id}:0:0`;
  let it=carrito.find(i=>i.key===key) || carrito.find(i=>Number(i.id)===Number(x.id) && !i.variante_id && !i.presentacion_id);
  if(it)it.cantidad=Number(it.cantidad||0)+1;
  else carrito.push({key,id:x.id,variante_id:null,presentacion_id:null,nombre:x.nombre,precio:finalPrecio(x.precio,x.descuento),imagen:imageUrl(x.imagen||''),cantidad:1});
  guardarCarritoLocal();
  count();
  renderCarritoLocal();
  toast('Producto agregado al carrito.');
}
function bindCards(root){root.querySelectorAll('[data-product]').forEach(c=>c.addEventListener('click',e=>{if(e.target.closest('.product-action-favorite,.product-action-cart'))return;location.href=`producto.html?id=${c.dataset.product}`}));root.querySelectorAll('.product-action-favorite').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const c=b.closest('[data-product]');alternarFavoritoRecomendado(b,c?.dataset.product)}));root.querySelectorAll('.product-action-cart').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const c=b.closest('[data-product]');const x=recomendadosCache.find(p=>Number(p.id)===Number(c?.dataset.product));agregarRecomendadoAlCarrito(x)}))}
function bindRecommendCarousel(){document.querySelectorAll('[data-rec-prev],[data-rec-next]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',()=>{const id=b.dataset.recPrev||b.dataset.recNext,root=document.getElementById(id);if(!root)return;const amount=Math.max(260,root.clientWidth*.82);root.scrollBy({left:b.dataset.recPrev?-amount:amount,behavior:'smooth'})})})}
document.addEventListener('keydown',e=>{
  if(!e.target.matches('.rec-catalog-card')||!['Enter',' '].includes(e.key))return;
  e.preventDefault();
  location.href=`producto.html?id=${e.target.dataset.product}`;
});
function dibujarRelacionados(rel){if(!rel.length)return;$('#relacionadosSection').hidden=false;const root=$('#productosRelacionados');root.innerHTML=rel.map(card).join('');bindCards(root);bindRecommendCarousel()}

async function cargarPersonalizados(p){
  let terms=[];try{terms=JSON.parse(localStorage.getItem('tiendapro_busquedas_publicas')||'[]')}catch(_){}
  terms=(Array.isArray(terms)?terms:[]).map(x=>typeof x==='string'?x:x?.q).filter(Boolean).slice(0,4);
  if(!terms.length)return;
  try{
    const lists=await Promise.all(terms.map(q=>fetch(`${API}/productos/publicos?search=${encodeURIComponent(q)}&limit=10`).then(r=>r.ok?r.json():{productos:[]})));
    const seen=new Set([Number(p.id)]),sellerSeen=new Set();const candidates=[];
    for(const d of lists){for(const x of (d.productos||[])){const id=Number(x.id);if(seen.has(id))continue;seen.add(id);const seller=String(x.vendedor_id??'tp');if(sellerSeen.has(seller)&&candidates.length<5)continue;sellerSeen.add(seller);candidates.push(x);if(candidates.length>=10)break}if(candidates.length>=10)break}
    if(!candidates.length)return;$('#historialSection').hidden=false;const root=$('#productosHistorial');root.innerHTML=candidates.map(card).join('');bindCards(root);bindRecommendCarousel();
  }catch(_){}
}

document.querySelectorAll('[data-close-product-info]').forEach(x=>x.addEventListener('click',cerrarInfoCompleta));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modalInfoProducto')?.hidden)cerrarInfoCompleta()});

// Compatibilidad con el encabezado antiguo del detalle.
// Desde FASE94 el detalle usa el encabezado público compartido, cuyos controles
// se enlazan en public-header-pages.js; por eso estos elementos pueden no existir.
const legacyBuscarBtn=$('#buscarDesdeDetalle');
const legacyBuscarInput=$('#buscarDetalle');
legacyBuscarBtn?.addEventListener('click',()=>{
  const q=(legacyBuscarInput?.value||'').trim();
  if(q) guardarBusqueda(q);
  location.href=`tienda_publica.html?search=${encodeURIComponent(q)}`;
});
legacyBuscarInput?.addEventListener('keydown',e=>{if(e.key==='Enter')legacyBuscarBtn?.click()});
function guardarBusqueda(q){try{let h=JSON.parse(localStorage.getItem('tiendapro_busquedas_publicas')||'[]');h=(Array.isArray(h)?h:[]).filter(x=>(typeof x==='string'?x:x?.q)!==q);h.unshift({q,ts:Date.now()});localStorage.setItem('tiendapro_busquedas_publicas',JSON.stringify(h.slice(0,20)))}catch(_){}}
$('#carritoDetalle')?.addEventListener('click',()=>window.abrirCarritoLocal?.());
$('#btnCerrarSesionDetalle')?.addEventListener('click',cerrarSesionClienteDetalle);
// También se actualiza al volver desde otra pestaña o desde el login.
window.addEventListener('storage',e=>{if(['token','usuario','portalSesion'].includes(e.key))actualizarSesionVisualDetalle()});
window.addEventListener('pageshow',actualizarSesionVisualDetalle);
actualizarSesionVisualDetalle();
count();
cargar();


// FASE 119 · Carrito local en la ficha del producto.
// Se sincroniza siempre desde localStorage antes de renderizar para que refleje
// inmediatamente productos agregados desde cualquier página de la tienda.
function sincronizarCarritoLocal(){
  try{
    const lista=JSON.parse(localStorage.getItem('tiendapro_carrito_publico')||'[]');
    carrito=Array.isArray(lista)?lista:[];
  }catch(_){carrito=[];}
}
function guardarCarritoLocal(){
  localStorage.setItem('tiendapro_carrito_publico',JSON.stringify(carrito));
  count();
}
function renderCarritoLocal(){
  sincronizarCarritoLocal();
  const host=$('#listaCarrito');
  const total=$('#totalCarrito');
  if(!host||!total)return;
  host.innerHTML=carrito.length?carrito.map((i,idx)=>`<div class="cart-item">${imageUrl(i.imagen)?`<img class="cart-thumb" src="${esc(imageUrl(i.imagen))}" alt="">`:'<div class="cart-thumb" style="display:grid;place-items:center">📦</div>'}<div><div class="cart-name">${esc(i.nombre)}</div><div class="cart-meta">${money(i.precio)} c/u</div><div class="qty"><button type="button" data-cart-minus="${idx}">−</button><span>${Number(i.cantidad||0)}</span><button type="button" data-cart-plus="${idx}">+</button></div></div><button class="remove" type="button" data-cart-remove="${idx}" aria-label="Quitar producto">×</button></div>`).join(''):'<div class="empty-state">Tu carrito está vacío.</div>';
  total.textContent=money(carrito.reduce((sum,i)=>sum+Number(i.precio||0)*Number(i.cantidad||0),0));
  host.querySelectorAll('[data-cart-minus]').forEach(b=>b.addEventListener('click',()=>cambiarCantidadCarritoLocal(Number(b.dataset.cartMinus),-1)));
  host.querySelectorAll('[data-cart-plus]').forEach(b=>b.addEventListener('click',()=>cambiarCantidadCarritoLocal(Number(b.dataset.cartPlus),1)));
  host.querySelectorAll('[data-cart-remove]').forEach(b=>b.addEventListener('click',()=>quitarCarritoLocal(Number(b.dataset.cartRemove))));
}
function cambiarCantidadCarritoLocal(idx,delta){
  sincronizarCarritoLocal();
  const it=carrito[idx]; if(!it)return;
  it.cantidad=Number(it.cantidad||0)+delta;
  if(it.cantidad<=0)carrito.splice(idx,1);
  guardarCarritoLocal(); renderCarritoLocal();
}
function quitarCarritoLocal(idx){
  sincronizarCarritoLocal();
  if(idx>=0&&idx<carrito.length)carrito.splice(idx,1);
  guardarCarritoLocal(); renderCarritoLocal();
}
function cerrarCarritoLocal(){
  const modal=$('#modalCarrito'); if(!modal)return;
  modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
}
window.abrirCarritoLocal=function(){
  renderCarritoLocal();
  const modal=$('#modalCarrito'); if(!modal)return;
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
};
document.addEventListener('click',e=>{
  if(e.target.matches('[data-close="modalCarrito"]'))cerrarCarritoLocal();
  if(e.target.id==='modalCarrito')cerrarCarritoLocal();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#modalCarrito')?.classList.contains('open'))cerrarCarritoLocal();});
$('#btnFinalizarCarritoProducto')?.addEventListener('click',()=>{
  sincronizarCarritoLocal();
  if(!carrito.length){toast('Tu carrito está vacío');return;}
  localStorage.setItem('tiendapro_abrir_carrito','1');
  location.href='tienda_publica.html';
});
