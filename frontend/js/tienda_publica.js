const API='http://localhost:3000/api';
let productos=[];
let metaCatalogo={pagina:1,totalPaginas:1,total:0};
let paginaActual=1;
const PRODUCTOS_INICIALES=35; // 7 filas de 5 en escritorio: 3 filas más que la vista anterior.
const PRODUCTOS_POR_CARGA=15; // Cada clic en “Ver más” agrega 3 filas de 5.
let carrito=JSON.parse(localStorage.getItem('tiendapro_carrito_publico')||'[]');
let categoriasJerarquia=[];
let rutaCategorias=[];
let categoriaSeleccionadaId="";
let filtroOfertaSuperior=false;
let productosRelacionados=[];
let filtroRelacionado="todo";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const money=v=>`$${Number(v||0).toFixed(2)}`;
const precioFinal=p=>{const precio=Number((p?.coincidencia_variante?.precio ?? p.precio) || 0),d=Number(p.descuento||0);return Math.max(0,precio-(precio*d/100));};
const BACKEND=API.replace(/\/api\/?$/,'');
const imageUrl=path=>{if(!path)return '';const v=String(path).trim();if(/^(https?:|data:|blob:)/i.test(v))return v;return `${BACKEND}${v.startsWith('/')?'':'/'}${v}`;};
const imagenProducto=p=>imageUrl(p?.coincidencia_variante?.imagen||p.imagen||'');
const esc=t=>String(t??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

async function cargarCategorias(){
  try{
    const r=await fetch(`${API}/productos/publicos/categorias`);
    const cats=await r.json();
    categoriasJerarquia=Array.isArray(cats)?cats:[];
    const sel=$('#categoriaPublica');
    if(sel){
      sel.innerHTML='<option value="">Todas las categorías</option>';
      const porId=new Map(categoriasJerarquia.map(c=>[Number(c.id),c]));
      const nombreRuta=c=>{
        const partes=[c.name]; let p=c.parent_id?porId.get(Number(c.parent_id)):null; let guard=0;
        while(p&&guard++<20){partes.unshift(p.name);p=p.parent_id?porId.get(Number(p.parent_id)):null;}
        return partes.join(' › ');
      };
      categoriasJerarquia.forEach(c=>{
        const o=document.createElement('option');o.value=String(c.id);o.textContent=nombreRuta(c);sel.appendChild(o);
      });
    }
    renderCategoryLevel(null);
  }catch(_){ categoriasJerarquia=[]; }
}

function hijosCategoria(parentId=null){
  return categoriasJerarquia.filter(c=>{
    const p=c.parent_id===null||c.parent_id===undefined||c.parent_id===''?null:Number(c.parent_id);
    return p===(parentId===null?null:Number(parentId));
  });
}
function categoriaPorId(id){return categoriasJerarquia.find(c=>Number(c.id)===Number(id));}
function renderCategoryLevel(parentId=null){
  const list=$('#categoryDrawerList'),title=$('#categoryDrawerTitle'),crumb=$('#categoryBreadcrumb'),back=$('#categoryBackBtn'),allLink=$('#categoryDrawerAllLink'),nav=$('.category-drawer-nav');
  if(!list)return;
  const parent=parentId===null?null:categoriaPorId(parentId);
  const items=hijosCategoria(parentId);
  if(nav) nav.hidden=!parent;
  title.textContent=parent?parent.name:'';
  crumb.textContent=parent?'Categorías › '+rutaCategorias.map(x=>x.name).join(' › '):'';
  back.hidden=rutaCategorias.length===0;
  if(back){back.querySelector('span').textContent=rutaCategorias.length>1?rutaCategorias[rutaCategorias.length-2].name:'Menú principal';}
  if(allLink){
    allLink.hidden=!parent;
    allLink.dataset.categorySelect=parent?String(parent.id):'';
    allLink.setAttribute('aria-label',parent?`Ver todos los productos de ${parent.name}`:'Ver todas las categorías');
  }
  let html='';
  if(!items.length){html+=`<div class="category-drawer-empty">No hay subcategorías.</div>`;}
  html+=items.map(c=>{
    const tiene=hijosCategoria(c.id).length>0;
    return `<button type="button" class="category-drawer-item" data-category-id="${c.id}" data-category-name="${esc(c.name)}" data-has-children="${tiene?'1':'0'}"><span>${esc(c.name)}</span>${tiene?'<b>›</b>':'<i>✓</i>'}</button>`;
  }).join('');
  if(parentId===null){html=`<button type="button" class="category-drawer-all root" data-category-select="">Todas las categorías</button>`+html;}
  list.innerHTML=html;
}
function abrirMenuCategorias(){
  const d=$('#categoryDrawer');if(!d)return;
  rutaCategorias=[];renderCategoryLevel(null);d.classList.add('open');d.setAttribute('aria-hidden','false');document.body.classList.add('category-menu-open');$('#categoriaTrigger')?.setAttribute('aria-expanded','true');
}
function cerrarMenuCategorias(){
  const d=$('#categoryDrawer');if(!d)return;
  d.classList.remove('open');d.setAttribute('aria-hidden','true');document.body.classList.remove('category-menu-open');$('#categoriaTrigger')?.setAttribute('aria-expanded','false');
}
function normalizarCategoriaTexto(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function resolverCategoria(valor=''){
  if(valor===null||valor===undefined||String(valor).trim()==='')return null;
  const raw=String(valor).trim();
  if(/^\d+$/.test(raw)){const byId=categoriaPorId(Number(raw));if(byId)return byId;}
  const n=normalizarCategoriaTexto(raw);
  let cat=categoriasJerarquia.find(c=>normalizarCategoriaTexto(c.slug)===n||normalizarCategoriaTexto(c.name)===n);
  if(cat)return cat;
  // Accesos rápidos usan nombres cortos, pero se resuelven contra las categorías raíz reales.
  const roots=categoriasJerarquia.filter(c=>c.parent_id===null||c.parent_id===undefined||c.parent_id==='');
  const aliases={
    moda:'ropa-zapatos-y-joyeria',hogar:'hogar-y-cocina',belleza:'belleza-y-cuidado-personal',
    deportes:'deportes-y-aire-libre',juguetes:'juguetes-y-juegos',automotriz:'automotriz-y-motocicletas',
    electronica:'electronica',mascotas:'mascotas'
  };
  const slug=aliases[n];
  if(slug)cat=roots.find(c=>normalizarCategoriaTexto(c.slug)===slug);
  if(cat)return cat;
  return roots.find(c=>normalizarCategoriaTexto(c.name).startsWith(n)||normalizarCategoriaTexto(c.name).includes(n))||null;
}
function actualizarVisibilidadFiltrosCatalogo(){
  const layout=$('.catalog-layout');
  const panel=$('#panelFiltros');
  const btn=$('#btnFiltros');
  const resumen=$('#filtrosActivos');
  const hayBusqueda=Boolean(($('#buscarPublico')?.value||'').trim());
  const hayCategoria=Boolean(categoriaSeleccionadaId||$('#categoriaPublica')?.value||'');
  const mostrar=hayBusqueda||hayCategoria;
  layout?.classList.toggle('catalog-layout--con-filtros',mostrar);
  layout?.classList.toggle('catalog-layout--solo-productos',!mostrar);
  panel?.classList.toggle('filters-panel--hidden-home',!mostrar);
  if(btn)btn.hidden=!mostrar;
  if(resumen)resumen.hidden=!mostrar;
}

function actualizarFiltroSuperiorActivo(){
  const home=$('[data-store-home]');
  if(home){
    const sinCategoria=!categoriaSeleccionadaId;
    const sinOferta=!filtroOfertaSuperior;
    const sinBusqueda=!($('#buscarPublico')?.value||'').trim();
    home.classList.toggle('active',sinCategoria&&sinOferta&&sinBusqueda);
    home.setAttribute('aria-pressed',sinCategoria&&sinOferta&&sinBusqueda?'true':'false');
  }
  $$('.category-links [data-cat]').forEach(btn=>{
    const cat=resolverCategoria(btn.dataset.cat||'');
    const activo=!filtroOfertaSuperior && String(cat?.id||'')===String(categoriaSeleccionadaId||'') && Boolean(categoriaSeleccionadaId);
    btn.classList.toggle('active',activo);
    btn.setAttribute('aria-pressed',activo?'true':'false');
  });
  const ofertas=$('#btnOfertas');
  if(ofertas){
    ofertas.classList.toggle('active',filtroOfertaSuperior);
    ofertas.setAttribute('aria-pressed',filtroOfertaSuperior?'true':'false');
  }
}
function sincronizarMenuCategoria(valor=''){
  const sel=$('#categoriaPublica'),text=$('#categoriaTriggerText');
  const cat=resolverCategoria(valor);
  categoriaSeleccionadaId=cat?String(cat.id):'';
  if(sel)sel.value=categoriaSeleccionadaId;
  if(text)text.textContent=cat?cat.name:'Todas las categorías';
  actualizarFiltroSuperiorActivo();
}
function abrirSeccionCategoria(valor=''){
  const cat=resolverCategoria(valor);
  if(!cat){ cerrarMenuCategorias(); document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth'}); return; }
  cerrarMenuCategorias();
  location.href=`categoria.html?categoria_id=${encodeURIComponent(cat.id)}`;
}
function seleccionarCategoriaDrawer(valor=''){
  filtroOfertaSuperior=false;
  abrirSeccionCategoria(valor);
}
function configurarMenuCategoriasJerarquico(){
  $('#categoriaTrigger')?.addEventListener('click',abrirMenuCategorias);
  $$('[data-category-close]').forEach(b=>b.addEventListener('click',cerrarMenuCategorias));
  $('#categoryBackBtn')?.addEventListener('click',()=>{
    if(!rutaCategorias.length)return;
    rutaCategorias.pop();const anterior=rutaCategorias.length?rutaCategorias[rutaCategorias.length-1].id:null;renderCategoryLevel(anterior);
  });
  $('#categoryDrawerAllLink')?.addEventListener('click',e=>{
    const valor=e.currentTarget.dataset.categorySelect||'';
    seleccionarCategoriaDrawer(valor);
  });
  $('#categoryDrawerList')?.addEventListener('click',e=>{
    const all=e.target.closest('[data-category-select]');if(all){seleccionarCategoriaDrawer(all.dataset.categorySelect||'');return;}
    const btn=e.target.closest('[data-category-id]');if(!btn)return;
    const id=Number(btn.dataset.categoryId),cat=categoriaPorId(id);if(!cat)return;
    if(btn.dataset.hasChildren==='1'){rutaCategorias.push(cat);renderCategoryLevel(id);}else seleccionarCategoriaDrawer(String(cat.id));
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarMenuCategorias()});
}

async function cargarMarcas({reiniciarSeleccion=false}={}){
  const sel=$('#marcaPublica');if(!sel)return;
  const actual=reiniciarSeleccion?'':sel.value;
  sel.innerHTML='<option value="">Todas las marcas</option>';
  sel.disabled=true;
  const params=new URLSearchParams();
  const cat=categoriaSeleccionadaId||$('#categoriaPublica')?.value||'';
  const search=$('#buscarPublico')?.value.trim()||'';
  if(cat)params.set('categoria_id',cat);
  if(search)params.set('search',search);
  try{
    const url=`${API}/productos/publicos/marcas${params.toString()?`?${params.toString()}`:''}`;
    const r=await fetch(url);
    const marcas=await r.json();
    (marcas||[]).forEach(m=>{const o=document.createElement('option');o.value=m;o.textContent=m;sel.appendChild(o)});
    sel.options[0].textContent=search
      ? ((marcas||[]).length?'Todas las marcas encontradas':'Sin marcas para esta búsqueda')
      : 'Todas las marcas';
    sel.disabled=!(marcas||[]).length;
    sel.value=(marcas||[]).includes(actual)?actual:'';
  }catch(_){}
}
async function ejecutarBusquedaPublica(){
  cerrarBuscadorPredictivo();
  const marca=$('#marcaPublica');
  if(marca)marca.value='';
  await cargarMarcas({reiniciarSeleccion:true});
  // Esperar a que los resultados se rendericen antes de mover la vista.
  // Este desplazamiento solo pertenece al flujo de búsqueda; "Ver más" conserva
  // la posición actual y sigue agregando productos hacia abajo sin saltos.
  await cargarProductos(true);
  const catalogo=document.getElementById('catalogo');
  if(catalogo){
    const header=document.querySelector('.store-header, header');
    const offset=(header?.getBoundingClientRect().height||0)+12;
    const top=window.scrollY+catalogo.getBoundingClientRect().top-offset;
    window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
  }
}
function parametrosCatalogo({limit=PRODUCTOS_INICIALES,offset=null}={}){const p=new URLSearchParams();const search=$('#buscarPublico').value.trim(),cat=categoriaSeleccionadaId||$('#categoriaPublica').value,marca=$('#marcaPublica').value,orden=$('#ordenPublico').value,min=$('#precioMin').value,max=$('#precioMax').value;if(search)p.set('search',search);if(cat)p.set('categoria_id',cat);if(marca)p.set('marca',marca);if(min)p.set('precio_min',min);if(max)p.set('precio_max',max);if($('#soloOfertas').checked||filtroOfertaSuperior)p.set('ofertas','1');p.set('orden',orden);p.set('page','1');p.set('limit',String(limit));if(offset!==null)p.set('offset',String(offset));return p;}
function guardarBusquedaPublica(q){try{if(!q)return;let h=JSON.parse(localStorage.getItem('tiendapro_busquedas_publicas')||'[]');h=(Array.isArray(h)?h:[]).filter(x=>(typeof x==='string'?x:x?.q)!==q);h.unshift({q,ts:Date.now()});localStorage.setItem('tiendapro_busquedas_publicas',JSON.stringify(h.slice(0,20)))}catch(_){}}

function ultimaBusquedaPublica(){
  const actual=$('#buscarPublico')?.value?.trim();
  if(actual)return actual;
  try{
    const h=JSON.parse(localStorage.getItem('tiendapro_busquedas_publicas')||'[]');
    if(!Array.isArray(h)||!h.length)return '';
    const item=h[0];
    return String(typeof item==='string'?item:(item?.q||'')).trim();
  }catch(_){return '';}
}
let productosRelacionadosCache=[];
function renderProductosRelacionados(lista=productosRelacionadosCache,filtro=''){
  const host=$('#busquedaRelacionadaProductos');if(!host)return;
  const filtrados=filtro?lista.filter(p=>String(p.categoria||'').toLowerCase()===String(filtro).toLowerCase()):lista;
  if(!filtrados.length){host.innerHTML='<div class="search-match-empty">Aún no hay sugerencias relacionadas disponibles.</div>';return;}
  host.innerHTML=filtrados.slice(0,12).map((p,i)=>{
    const r=datosResenasProducto(p),agotado=Number(p.stock_fisico_disponible??p.stock??0)<=0&&!p.permite_bajo_pedido;
    return `<article class="search-match-card" role="link" tabindex="0" onclick="abrirProductoTarjeta(event,${p.id})" onkeydown="abrirProductoTarjeta(event,${p.id})"><div class="search-match-image">${imagenProducto(p)?`<img src="${imagenProducto(p)}" alt="${esc(p.nombre)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="ph" style="display:none">📦</span>`:'<span class="ph">📦</span>'}${i===0?'<span class="search-match-recommended">Recomendado</span>':''}</div><div class="search-match-body"><h3>${esc(p.nombre)}</h3><span class="search-match-store">${esc(p.tienda||p.marca||'TiendaPro')}</span><span class="search-match-rating">${estrellasProducto(r.promedio)} ${r.total?`(${r.total})`:''}</span><div class="search-match-bottom"><strong class="search-match-price">${money(precioFinal(p))}</strong><button class="search-match-cart" type="button" ${agotado?'disabled':''} aria-label="${agotado?'Producto agotado':'Agregar al carrito'}" onclick="agregarCarrito(event,${p.id})">🛒</button></div></div></article>`;
  }).join('');
}
async function cargarProductosRelacionados(){
  const seccion=$('#busquedaRelacionada'),host=$('#busquedaRelacionadaProductos'),texto=$('#busquedaRelacionadaTexto'),filtros=$('#busquedaRelacionadaFiltros');
  if(!seccion||!host)return;
  const q=ultimaBusquedaPublica();
  if(texto)texto.textContent=q||'Explora TiendaPro';
  try{
    let lista=[];
    if(q){
      const p=new URLSearchParams({search:q,orden:'relevancia',page:'1',limit:'12'});
      const r=await fetch(`${API}/productos/publicos?${p.toString()}`);
      if(r.ok){const d=await r.json();lista=d.productos||[];}
    }
    if(!lista.length)lista=(productos||[]).slice(0,12);
    productosRelacionadosCache=lista;
    const categorias=[...new Set(lista.map(p=>String(p.categoria||'').trim()).filter(Boolean))].slice(0,5);
    if(filtros){
      filtros.innerHTML=`<button class="search-match-filter active" type="button" data-related-cat="">Todo (${lista.length})</button>`+categorias.map(c=>`<button class="search-match-filter" type="button" data-related-cat="${esc(c)}">${esc(c)}</button>`).join('');
      filtros.querySelectorAll('[data-related-cat]').forEach(btn=>btn.addEventListener('click',()=>{filtros.querySelectorAll('.search-match-filter').forEach(x=>x.classList.remove('active'));btn.classList.add('active');renderProductosRelacionados(lista,btn.dataset.relatedCat||'');}));
    }
    renderProductosRelacionados(lista);
  }catch(_){
    productosRelacionadosCache=(productos||[]).slice(0,12);
    if(filtros)filtros.innerHTML='';
    renderProductosRelacionados(productosRelacionadosCache);
  }
}

function datosResenasProducto(p={}){
  const promedioRaw=p.calificacion_promedio ?? p.promedio_resenas ?? p.rating_promedio ?? p.rating ?? p.calificacion ?? 0;
  const totalRaw=p.total_resenas ?? p.cantidad_resenas ?? p.resenas ?? p.reviews_count ?? p.total_reviews ?? 0;
  const promedio=Math.max(0,Math.min(5,Number(promedioRaw)||0));
  const total=Math.max(0,Number(totalRaw)||0);
  return {promedio,total};
}
function estrellasProducto(promedio=0){
  const llenas=Math.max(0,Math.min(5,Math.round(Number(promedio)||0)));
  return `${'★'.repeat(llenas)}${'☆'.repeat(5-llenas)}`;
}
function textoResenasProducto(promedio,total){
  if(!total)return 'Sin reseñas';
  return `${Number(promedio).toFixed(1)} (${total} reseña${total===1?'':'s'})`;
}
function claveFavoritos(){
  const u=usuarioActual();
  return `tiendapro_favoritos_cliente_${u?.id||u?.email||'invitado'}`;
}
function leerFavoritos(){
  try{const lista=JSON.parse(localStorage.getItem(claveFavoritos())||'[]');return Array.isArray(lista)?lista:[];}catch(_){return [];}
}
function esFavorito(id){return leerFavoritos().some(p=>Number(p.id)===Number(id));}
function cantidadProductoEnCarrito(id){const item=carrito.find(p=>Number(p.id)===Number(id));return Math.max(0,Number(item?.cantidad||0));}
function actualizarCantidadesTarjetas(){
  document.querySelectorAll('[data-card-cart-id]').forEach(btn=>{
    const cantidad=cantidadProductoEnCarrito(btn.dataset.cardCartId),badge=btn.querySelector('.product-cart-quantity');
    btn.classList.toggle('has-items',cantidad>0);
    btn.setAttribute('aria-label',cantidad>0?`Producto en carrito: ${cantidad}. Agregar otra unidad`:'Agregar al carrito');
    if(badge){badge.textContent=String(cantidad);badge.hidden=cantidad===0;}
  });
}
function mostrarAviso(texto,tipo='ok'){
  let aviso=document.getElementById('avisoTiendaPublica');
  if(!aviso){aviso=document.createElement('div');aviso.id='avisoTiendaPublica';aviso.className='store-toast';aviso.setAttribute('role','status');aviso.setAttribute('aria-live','polite');document.body.appendChild(aviso);}
  aviso.textContent=texto;aviso.className=`store-toast ${tipo} show`;
  clearTimeout(mostrarAviso.timer);mostrarAviso.timer=setTimeout(()=>aviso.classList.remove('show'),2400);
}
window.alternarFavorito=(event,id)=>{
  event?.preventDefault();event?.stopPropagation();
  if(!tieneSesion()){mostrarAviso('Inicia sesión para guardar favoritos.','info');setTimeout(()=>location.href='login-cliente.html',700);return;}
  const p=productos.find(x=>Number(x.id)===Number(id));if(!p)return;
  let lista=leerFavoritos();const guardado=lista.some(x=>Number(x.id)===Number(id));
  if(guardado)lista=lista.filter(x=>Number(x.id)!==Number(id));
  else lista.unshift({id:p.id,nombre:p.nombre,precio:precioFinal(p),imagen:imagenProducto(p),tienda:p.tienda||p.marca||'TiendaPro',estado_visual:p.estado_visual||'',guardado_en:Date.now()});
  localStorage.setItem(claveFavoritos(),JSON.stringify(lista));
  const btn=event?.currentTarget;if(btn){btn.classList.toggle('active',!guardado);btn.setAttribute('aria-pressed',String(!guardado));btn.setAttribute('aria-label',guardado?'Agregar a favoritos':'Quitar de favoritos');btn.title=guardado?'Agregar a favoritos':'Quitar de favoritos';}
  mostrarAviso(guardado?'Producto eliminado de favoritos.':'Producto guardado en favoritos.');
};
function abrirProductoTarjeta(event,id,presentacionId=null,varianteId=null){
  if(event?.type==='keydown' && event.key!=='Enter' && event.key!==' ')return;
  if(event?.type==='keydown')event.preventDefault();
  verProducto(id,presentacionId,varianteId);
}
async function cargarProductos(resetPage=false){
  actualizarVisibilidadFiltrosCatalogo();
  if(resetPage)paginaActual=1;
  const qHist=$('#buscarPublico')?.value.trim(); if(resetPage&&qHist)guardarBusquedaPublica(qHist);
  const estado=$('#estadoPublico');
  if(estado)estado.hidden=true;
  const grid=$('#productosPublicos');
  if(grid)grid.replaceChildren();
  productos=[];
  metaCatalogo={pagina:1,totalPaginas:1,total:0};
  try{
    // La API ya funciona correctamente con lotes de 15 (el mismo tamaño usado por "Ver más").
    // Para la vista inicial solicitada de 35 productos cargamos 15 + 15 + 5 y los agregamos
    // progresivamente. Así la pantalla inicial no depende de una petición grande distinta al
    // flujo que ya sabemos que funciona al pulsar "Ver más productos".
    let offset=0;
    let totalEsperado=Infinity;
    while(offset<PRODUCTOS_INICIALES && offset<totalEsperado){
      const limite=Math.min(PRODUCTOS_POR_CARGA,PRODUCTOS_INICIALES-offset);
      const r=await fetch(`${API}/productos/publicos?${parametrosCatalogo({limit:limite,offset}).toString()}`);
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const d=await r.json();
      const lote=Array.isArray(d.productos)?d.productos:[];
      totalEsperado=Number(d.total??totalEsperado);
      const ids=new Set(productos.map(p=>Number(p.id)));
      const nuevos=lote.filter(p=>p&&p.id!=null&&!ids.has(Number(p.id)));
      const desde=productos.length;
      productos.push(...nuevos);
      metaCatalogo={...metaCatalogo,...d,total:Number(d.total??metaCatalogo.total??productos.length)};
      if(nuevos.length)renderProductos(desde,true);
      if(!lote.length)break;
      offset+=lote.length;
    }
    if(!productos.length)renderProductos(0,true);
    renderVerMas();renderMobileFlash();actualizarCantidadesTarjetas();
    cargarProductosRelacionados().catch(err=>console.warn('Sugerencias relacionadas:',err));
  }catch(err){
    console.error('Error al cargar catálogo inicial:',err);
    // Si algún lote posterior falla, conservar los productos que ya se cargaron correctamente.
    if(productos.length){renderVerMas();renderMobileFlash();return;}
    if(grid)grid.innerHTML='';
    if(estado){estado.hidden=false;estado.textContent='No se pudo conectar con el catálogo. Verifica que el servidor esté ejecutándose.';}
    $('#resumenProductos').textContent='Catálogo no disponible';
  }
}
function renderProductos(desde=0,forzarAppend=false){
  const grid=$('#productosPublicos');$('#resumenProductos').textContent=`${metaCatalogo.total||productos.length} producto${Number(metaCatalogo.total||productos.length)===1?'':'s'} encontrado${Number(metaCatalogo.total||productos.length)===1?'':'s'}`;
  if(!productos.length){grid.innerHTML='';const e=$('#estadoPublico');e.hidden=false;e.textContent='No encontramos productos con esos filtros.';return;}$('#estadoPublico').hidden=true;
  const html=productos.slice(desde).map(p=>{const final=precioFinal(p),d=Number(p.descuento||0),match=p.coincidencia_variante||null,stock=Number(match?.stock??p.stock_fisico_disponible??p.stock??0);const estado=match?(stock>0?'Disponible':(p.permite_bajo_pedido?'Bajo pedido':'Agotado')):(p.estado_visual==='en_stock'?'Disponible':p.estado_visual==='bajo_pedido'?'Bajo pedido':'Agotado');const precioBase=Number((match?.precio ?? p.precio) || 0);const matchLabel=match?.detalle||match?.presentacion||'';const entrega=String(p.tiempo_entrega||'Según disponibilidad').trim();const resenas=datosResenasProducto(p);const pid=match?.presentacion_id||'null',vid=match?.variante_id||'null',favorito=esFavorito(p.id),agotado=estado==='Agotado',cantidadCarrito=cantidadProductoEnCarrito(p.id);return `<article class="product-card product-card-clickable" role="link" tabindex="0" aria-label="Ver detalles de ${esc(p.nombre)}" onclick="abrirProductoTarjeta(event,${p.id},${pid},${vid})" onkeydown="abrirProductoTarjeta(event,${p.id},${pid},${vid})"><div class="product-image">${imagenProducto(p)?`<img src="${imagenProducto(p)}" alt="${esc(p.nombre)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="placeholder" style="display:none">📦</span>`:'<span class="placeholder">📦</span>'}${d>0?`<span class="product-discount-ribbon">-${d}%</span>`:''}<div class="product-actions" aria-label="Acciones de ${esc(p.nombre)}"><button class="product-action-favorite ${favorito?'active':''}" type="button" title="${favorito?'Quitar de favoritos':'Agregar a favoritos'}" aria-label="${favorito?'Quitar de favoritos':'Agregar a favoritos'}" aria-pressed="${favorito}" onclick="alternarFavorito(event,${p.id})">❤</button></div></div><div class="product-body"><div class="product-brand">${esc(p.tienda||p.marca||'TiendaPro')}</div><h3 class="product-title">${esc(p.nombre)}</h3><div class="product-delivery-time"><span aria-hidden="true">🚚</span><span>Entrega: ${esc(entrega)}</span></div>${matchLabel?`<div class="variant-search-match"><span>Coincidencia</span><strong>${esc(matchLabel)}</strong></div>`:`<div class="product-category">${esc(p.categoria||'Sin categoría')}</div>`}<div class="product-rating" aria-label="${resenas.total?`${resenas.promedio.toFixed(1)} de 5, ${resenas.total} reseñas`:'Sin reseñas'}"><span class="product-rating-stars">${estrellasProducto(resenas.promedio)}</span><span class="product-rating-text">${textoResenasProducto(resenas.promedio,resenas.total)}</span></div><div class="badges"><span class="badge ${estado==='Disponible'?'ok':'warn'}">${esc(estado)}</span>${stock>0?`<span class="badge">Stock ${stock}</span>`:''}</div><div class="price-row"><span class="price">${money(final)}</span>${d>0?`<span class="old-price">${money(precioBase)}</span>`:''}<button class="product-action-cart ${cantidadCarrito>0?'has-items':''}" type="button" data-card-cart-id="${p.id}" title="${agotado?'Producto agotado':'Agregar al carrito'}" aria-label="${agotado?'Producto agotado':cantidadCarrito>0?`Producto en carrito: ${cantidadCarrito}. Agregar otra unidad`:'Agregar al carrito'}" ${agotado?'disabled':''} onclick="agregarCarrito(event,${p.id})">🛒<span class="product-cart-quantity" ${cantidadCarrito>0?'':'hidden'}>${cantidadCarrito}</span></button></div></div></article>`}).join('');
  if(forzarAppend||desde>0) grid.insertAdjacentHTML('beforeend',html); else {grid.replaceChildren();grid.insertAdjacentHTML('beforeend',html);}
}
function renderVerMas(){
  const box=$('#paginacionPublica');if(!box)return;
  const total=Number(metaCatalogo.total||productos.length);
  if(!productos.length||productos.length>=total){box.innerHTML='';return;}
  box.innerHTML=`<button class="load-more-products" id="btnVerMasProductos" type="button"><span>Ver más productos</span><span aria-hidden="true">↓</span></button>`;
  $('#btnVerMasProductos').onclick=cargarMasProductos;
}
async function cargarMasProductos(){
  const btn=$('#btnVerMasProductos');if(btn){btn.disabled=true;btn.innerHTML='<span>Cargando productos...</span>';}
  try{
    const offset=productos.length;
    const r=await fetch(`${API}/productos/publicos?${parametrosCatalogo({limit:PRODUCTOS_POR_CARGA,offset}).toString()}`);if(!r.ok)throw new Error();
    const d=await r.json();const nuevos=d.productos||[];
    const ids=new Set(productos.map(p=>Number(p.id)));const nuevosUnicos=nuevos.filter(p=>!ids.has(Number(p.id)));
    const desde=productos.length;productos.push(...nuevosUnicos);
    metaCatalogo={...metaCatalogo,...d,total:Number(d.total??metaCatalogo.total??productos.length)};
    // Añade únicamente las tarjetas nuevas al final. No reconstruir la cuadrícula evita
    // saltos de scroll/foco y mantiene exactamente la posición del cliente.
    if(nuevosUnicos.length)renderProductos(desde);
    renderVerMas();actualizarCantidadesTarjetas();
  }catch(_){renderVerMas();mostrarAviso('No se pudieron cargar más productos. Inténtalo nuevamente.','error');}
}

function configurarProductosRelacionados(){
  const host=$('#busquedaRelacionadaProductos'),prev=$('#busquedaRelacionadaPrev'),next=$('#busquedaRelacionadaNext');
  const mover=dir=>host?.scrollBy({left:dir*Math.max(280,host.clientWidth*.75),behavior:'smooth'});if(prev)prev.onclick=()=>mover(-1);if(next)next.onclick=()=>mover(1);
  $('#busquedaRelacionadaVerTodos')?.addEventListener('click',()=>{const q=ultimaBusquedaPublica();if(q){$('#buscarPublico').value=q;cargarProductos(true);document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth'});}});
}


function renderMobileFlash(){
  const box=$('#mobileFlashGrid');
  if(!box)return;
  const lista=[...productos].sort((a,b)=>Number(b.descuento||0)-Number(a.descuento||0)).slice(0,6);
  box.innerHTML=lista.map(p=>{const d=Number(p.descuento||0),final=precioFinal(p);return `<article class="mobile-flash-card" onclick="verProducto(${p.id})"><div class="img">${imagenProducto(p)?`<img src="${imagenProducto(p)}" alt="${esc(p.nombre)}">`:'<span class="ph">📦</span>'}</div>${d>0?`<span class="off">-${d}%</span>`:''}<div class="info"><h4>${esc(p.nombre)}</h4><strong>${money(final)}</strong>${d>0?`<del>${money(p.precio)}</del>`:''}</div></article>`}).join('');
}
function ejecutarAccionMovil(accion){
  if(accion==='ofertas'){ location.href='ofertas.html'; return; }
  if(accion==='vendidos'){ document.querySelector('.more-section')?.scrollIntoView({behavior:'smooth'}); return; }
  if(accion==='nuevos'){ $('#ordenPublico').value='recientes'; cargarProductos(true); document.getElementById('catalogo').scrollIntoView({behavior:'smooth'}); return; }
  if(accion==='tiendas'){ document.querySelector('.promo-row')?.scrollIntoView({behavior:'smooth'}); return; }
  if(accion==='categorias'){ abrirCategoriasMovil(); return; }
}

function abrirCategoriasMovil(){abrirMenuCategorias();}
function cerrarCategoriasMovil(){cerrarMenuCategorias();}
function abrirInfoPublica(titulo,texto,icono='ℹ'){
  $('#infoPublicaTitulo').textContent=titulo;$('#infoPublicaTexto').textContent=texto;$('#infoPublicaIcon').textContent=icono;abrirModal('modalInfoPublica');
}
const infoFooterPublico={
  envios:['Envíos y entregas','TiendaPro mostrará aquí cobertura, costos y tiempos de entrega disponibles para El Salvador.','🚚'],
  seguridad:['Compra segura','Protegemos tus datos durante la navegación y el proceso de compra.','🛡'],
  devoluciones:['Cambios y devoluciones','Aquí se publicará el proceso para cambios, devoluciones y reclamos postventa.','↩'],
  soporte:['Soporte','Estamos preparando los canales de ayuda para compradores y vendedores.','🎧'],
  ayuda:['Centro de ayuda','Próximamente tendrás guías de compra, pedidos, cuenta y soporte en un solo lugar.','ℹ'],
  pagos:['Formas de pago','Los métodos de pago en línea se habilitarán cuando TiendaPro complete su configuración.','💳'],
  seguimiento:['Seguimiento de pedido','Inicia sesión en tu cuenta para revisar el estado de tus pedidos disponibles.','📦'],
  historia:['Nuestra historia','TiendaPro nace para conectar tiendas y emprendedores salvadoreños con más compradores.','✓'],
  trabaja:['Trabaja con nosotros','Las oportunidades para formar parte de TiendaPro se publicarán próximamente.','💼'],
  terminos:['Términos y condiciones','Los términos oficiales de uso estarán disponibles cuando TiendaPro publique sus políticas finales.','§'],
  privacidad:['Política de privacidad','La política de privacidad oficial estará disponible en esta sección cuando se publique.','🔒'],
  contacto:['Contacto','Los canales oficiales de contacto de TiendaPro estarán disponibles próximamente.','✉']
};
function configurarFooterMarketplace(){
  $$('[data-footer-action]').forEach(el=>el.addEventListener('click',e=>{
    const accion=el.dataset.footerAction;
    if(accion==='app-store'||accion==='google-play'){e.preventDefault();abrirInfoPublica('Aplicación móvil','La app móvil de TiendaPro estará disponible próximamente.','▣');return;}
    if(accion==='tiendas'){e.preventDefault();document.querySelector('.promo-row')?.scrollIntoView({behavior:'smooth'});return;}
    if(accion==='promociones'){e.preventDefault();document.querySelector('.promo-row')?.scrollIntoView({behavior:'smooth'});return;}
    if(accion==='novedades'){e.preventDefault();$('#ordenPublico').value='recientes';cargarProductos(true);document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth'});return;}
    if(accion==='vendidos'){e.preventDefault();document.querySelector('.more-section')?.scrollIntoView({behavior:'smooth'});return;}
  }));
  $$('[data-footer-info]').forEach(el=>el.addEventListener('click',e=>{
    e.preventDefault();const info=infoFooterPublico[el.dataset.footerInfo];if(info)abrirInfoPublica(...info);
  }));
  $('#footerPromoForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const input=$('#footerPromoEmail'),status=$('#footerPromoStatus'),email=(input?.value||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){status.textContent='Ingresa un correo válido.';status.className='error';input?.focus();return;}
    try{localStorage.setItem('tiendapro_promos_email',email);}catch(_){}
    status.textContent='Listo. Te avisaremos cuando las promociones por correo estén disponibles.';
    status.className='ok';
    input.value='';
  });
}
$$('[data-mobile-action]').forEach(b=>b.addEventListener('click',()=>ejecutarAccionMovil(b.dataset.mobileAction)));
$('#btnCarritoMovil')?.addEventListener('click',()=>{renderCarrito();abrirModal('modalCarrito')});
$('#btnCuentaMovil')?.addEventListener('click',()=>{location.href=$('#btnCuentaMovil').dataset.destino||'login-cliente.html'});


$$('.mobile-stores article').forEach(card=>{card.tabIndex=0;card.style.cursor='pointer';const abrir=()=>ejecutarAccionMovil('tiendas');card.addEventListener('click',abrir);card.addEventListener('keydown',e=>{if(e.key==='Enter')abrir()})});
const beneficios=$$('.benefits>div');
const infoBeneficios=[
  ['Compra segura','Tus datos y el proceso de compra se protegen durante la operación.','🛡'],
  ['Envíos rápidos','Aquí mostraremos las condiciones, cobertura y tiempos de entrega disponibles.','🚚'],
  ['Devoluciones fáciles','Aquí podrás consultar el proceso y las políticas de devolución de TiendaPro.','↩'],
  ['Atención al cliente','Aquí conectaremos los canales de ayuda y soporte para compradores.','🎧']
];
beneficios.forEach((b,i)=>{b.style.cursor='pointer';b.addEventListener('click',()=>abrirInfoPublica(...infoBeneficios[i]))});
window.verProducto=(id,presentacionId=null,varianteId=null)=>{const q=new URLSearchParams({id:String(id)});if(presentacionId)q.set('presentacion',String(presentacionId));if(varianteId)q.set('variante',String(varianteId));location.href=`producto.html?${q.toString()}`;};
window.agregarCarrito=(event,id)=>{event?.preventDefault();event?.stopPropagation();const p=productos.find(x=>Number(x.id)===Number(id));if(!p)return;const match=p.coincidencia_variante||null,stock=Number(match?.stock??p.stock_fisico_disponible??p.stock??0),agotado=stock<=0&&!p.permite_bajo_pedido;if(agotado){mostrarAviso('Este producto está agotado.','info');return;}const it=carrito.find(x=>Number(x.id)===Number(id));if(it)it.cantidad++;else carrito.push({id:p.id,nombre:p.nombre,precio:precioFinal(p),imagen:imagenProducto(p),cantidad:1});persistirCarrito();mostrarAviso('Producto agregado al carrito.');};
window.cambiarCantidad=(id,delta)=>{const it=carrito.find(x=>Number(x.id)===Number(id));if(!it)return;it.cantidad+=delta;if(it.cantidad<=0)carrito=carrito.filter(x=>Number(x.id)!==Number(id));persistirCarrito();renderCarrito();};
window.quitarCarrito=id=>{carrito=carrito.filter(x=>Number(x.id)!==Number(id));persistirCarrito();renderCarrito();};
function persistirCarrito(){localStorage.setItem('tiendapro_carrito_publico',JSON.stringify(carrito));actualizarContador();actualizarCantidadesTarjetas();}
function actualizarContador(){const n=carrito.reduce((a,b)=>a+b.cantidad,0);const a=$('#cartCount'),b=$('#cartCountCliente');if(a)a.textContent=n;if(b)b.textContent=n;const c=$('#cartCountMovil');if(c)c.textContent=n;}
function sincronizarBloqueoModal(){document.body.classList.toggle('modal-open',!!document.querySelector('.modal-overlay.open'));}
function abrirModal(id){const m=document.getElementById(id);if(!m)return;m.classList.add('open');m.setAttribute('aria-hidden','false');sincronizarBloqueoModal();}
function cerrarModal(id){const m=document.getElementById(id);if(!m)return;m.classList.remove('open');m.setAttribute('aria-hidden','true');sincronizarBloqueoModal();}
function renderCarrito(){const c=$('#listaCarrito');c.innerHTML=carrito.length?carrito.map(i=>`<div class="cart-item">${imageUrl(i.imagen)?`<img class="cart-thumb" src="${imageUrl(i.imagen)}" alt="">`:'<div class="cart-thumb" style="display:grid;place-items:center">📦</div>'}<div><div class="cart-name">${esc(i.nombre)}</div><div class="cart-meta">${money(i.precio)} c/u</div><div class="qty"><button onclick="cambiarCantidad(${i.id},-1)">−</button><span>${i.cantidad}</span><button onclick="cambiarCantidad(${i.id},1)">+</button></div></div><button class="remove" onclick="quitarCarrito(${i.id})">×</button></div>`).join(''):'<div class="empty-state">Tu carrito está vacío.</div>';$('#totalCarrito').textContent=money(carrito.reduce((s,i)=>s+i.precio*i.cantidad,0));}
const abrirCarrito=()=>{renderCarrito();abrirModal('modalCarrito')};$('#btnCarrito')?.addEventListener('click',abrirCarrito);$('#btnCarritoCliente')?.addEventListener('click',abrirCarrito);
function usuarioActual(){try{return JSON.parse(localStorage.getItem('usuario')||'null')}catch{return null}}
function tieneSesion(){const u=usuarioActual();return Boolean(localStorage.getItem('token')&&localStorage.getItem('portalSesion')==='tienda'&&String(u?.rol||'').toLowerCase()==='cliente');}
function actualizarSesionVisual(){const u=usuarioActual(),ok=tieneSesion();if($('#accionesInvitado'))$('#accionesInvitado').hidden=ok;if($('#accionesCliente'))$('#accionesCliente').hidden=!ok;if(ok&&$('#saludoCliente'))$('#saludoCliente').textContent=`Hola, ${u.nombre||'Cliente'}`;const cuenta=$('#btnCuentaMovil');if(cuenta){cuenta.dataset.destino=ok?'cuenta_cliente.html':'login-cliente.html';cuenta.setAttribute('aria-label',ok?'Abrir mi cuenta':'Iniciar sesión');}}
$('#btnCerrarSesion')?.addEventListener('click',()=>{localStorage.removeItem('token');localStorage.removeItem('usuario');localStorage.removeItem('portalSesion');actualizarSesionVisual()});
let direccionEnvioActual=null;
let direccionesGuardadas=[];
let direccionTemporalActual=null;
let direccionNuevaPendiente=null;
let direccionReemplazoSeleccionada=null;
let modoDireccion='temporal'; // temporal | nueva-favorita | editar
function authHeaders(extra={}){return {...extra,Authorization:`Bearer ${localStorage.getItem('token')||''}`};}
function textoDireccion(d){return [d?.direccion,d?.municipio,d?.departamento,d?.referencia?`Referencia: ${d.referencia}`:''].filter(Boolean).join(', ');}
function resumenDireccionHtml(d){
  if(!d)return '';
  return `<strong>${esc(d.nombre_receptor||'')}</strong><small>${esc(d.telefono||'')}</small><span>${esc(d.direccion||'')}</span><span>${esc([d.municipio,d.departamento].filter(Boolean).join(', '))}</span>${d.referencia?`<small>Referencia: ${esc(d.referencia)}</small>`:''}`;
}
async function cargarDireccionesGuardadas(){
  if(!tieneSesion()){direccionesGuardadas=[];direccionEnvioActual=null;return []}
  try{
    const r=await fetch(`${API}/auth/mis-direcciones`,{headers:authHeaders()});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.mensaje||'No se pudieron cargar tus direcciones');
    direccionesGuardadas=Array.isArray(data.direcciones)?data.direcciones:[];
    direccionEnvioActual=direccionesGuardadas.find(d=>Number(d.principal)===1)||direccionesGuardadas[0]||null;
    return direccionesGuardadas;
  }catch(err){console.warn(err);direccionesGuardadas=[];direccionEnvioActual=null;return []}
}
async function cargarDireccionEnvio(){await cargarDireccionesGuardadas();return direccionEnvioActual;}
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
function cargarMunicipiosDepartamento(departamento,seleccion=''){
  const select=$('#direccionMunicipio'); if(!select)return;
  const lista=MUNICIPIOS_POR_DEPARTAMENTO[departamento]||[];
  select.innerHTML=lista.length?'<option value="">Seleccionar municipio / distrito</option>'+lista.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join(''):'<option value="">Primero selecciona un departamento</option>';
  select.disabled=!lista.length;
  if(seleccion){
    if(!lista.includes(seleccion)){const op=document.createElement('option');op.value=seleccion;op.textContent=seleccion;select.appendChild(op);}
    select.value=seleccion;
  }
}
$('#direccionDepartamento')?.addEventListener('change',e=>cargarMunicipiosDepartamento(e.target.value,''));
function obtenerPayloadDireccion(){const numero=$('#direccionTelefono').value.replace(/\D/g,'').slice(0,8);return {nombre_receptor:$('#direccionNombre').value.trim(),telefono:numero.length===8?`+503${numero}`:numero,departamento:$('#direccionDepartamento').value,municipio:$('#direccionMunicipio').value.trim(),direccion:$('#direccionDetalle').value.trim(),referencia:$('#direccionReferencia').value.trim()};}
function formatearTelefonoSV(valor=''){const d=String(valor).replace(/\D/g,'').slice(0,8);return d.length>4?`${d.slice(0,4)}-${d.slice(4)}`:d;}
$('#direccionTelefono')?.addEventListener('input',e=>{e.target.value=formatearTelefonoSV(e.target.value);});
function prepararFormularioDireccion(d=null,{editar=false,temporal=true}={}){
  const u=usuarioActual()||{};
  $('#direccionIdEditar').value=editar&&d?.id?String(d.id):'';
  $('#direccionNombre').value=d?.nombre_receptor||u.nombre||'';
  $('#direccionTelefono').value=formatearTelefonoSV(String(d?.telefono||'').replace(/^\+?503/, ''));
  $('#direccionDepartamento').value=d?.departamento||'';
  cargarMunicipiosDepartamento($('#direccionDepartamento').value,d?.municipio||'');
  $('#direccionDetalle').value=d?.direccion||'';
  $('#direccionReferencia').value=d?.referencia||'';
  $('#direccionGuardarFavorita').checked=editar?true:false;
  $('#guardarFavoritaWrap').hidden=editar;
  $('#direccionMensaje').hidden=true;
  $('#direccionModalTitulo').textContent=editar?'Editar dirección':'Agregar dirección de envío';
  $('#direccionModalTexto').textContent=editar?'Actualiza los datos de esta dirección guardada.':'Puedes usarla solo para esta compra o guardarla como favorita.';
  $('#btnGuardarDireccion').textContent=editar?'Actualizar dirección':'Usar dirección';
  modoDireccion=editar?'editar':(temporal?'temporal':'nueva-favorita');
}
function abrirFormularioDireccion(d=null,opts={}){prepararFormularioDireccion(d,opts);cerrarModal('modalCarrito');cerrarModal('modalCheckout');cerrarModal('modalDirecciones');abrirModal('modalDireccionEnvio');}
function renderAddressHost(){
  const host=$('#checkoutAddressHost'); if(!host)return;
  const d=direccionTemporalActual||direccionEnvioActual;
  if(!d){host.innerHTML=`<button id="btnAgregarDireccionCheckout" class="empty-address-card" type="button"><span>＋</span><strong>Agregar dirección de envío</strong></button>`;$('#btnAgregarDireccionCheckout')?.addEventListener('click',()=>abrirFormularioDireccion(null,{temporal:true}));return;}
  host.innerHTML=`<button id="btnDireccionCheckout" class="selected-address-card" type="button"><div class="selected-address-main">${resumenDireccionHtml(d)}</div><span class="address-chevron">›</span></button>`;
  $('#btnDireccionCheckout')?.addEventListener('click',abrirLibroDirecciones);
}
function renderLibroDirecciones({modoReemplazo=false}={}){
  const host=$('#listaDirecciones');
  host.innerHTML=direccionesGuardadas.length?direccionesGuardadas.map(d=>`<article class="saved-address-card ${Number(d.id)===Number(direccionEnvioActual?.id)&&!direccionTemporalActual?'selected':''}"><button class="saved-address-select" type="button" data-address-select="${d.id}">${resumenDireccionHtml(d)}<span class="saved-address-mark">${Number(d.id)===Number(direccionEnvioActual?.id)&&!direccionTemporalActual?'✓':''}</span></button><div class="saved-address-actions"><button type="button" data-address-edit="${d.id}">Editar</button>${modoReemplazo?`<button class="danger-link" type="button" data-address-replace="${d.id}">Eliminar</button>`:''}</div></article>`).join(''):'<div class="empty-state">No tienes direcciones favoritas guardadas.</div>';
  host.querySelectorAll('[data-address-select]').forEach(b=>b.addEventListener('click',async()=>{const d=direccionesGuardadas.find(x=>Number(x.id)===Number(b.dataset.addressSelect));if(!d)return;direccionTemporalActual=null;direccionEnvioActual=d;try{await fetch(`${API}/auth/mis-direcciones/${d.id}/principal`,{method:'PUT',headers:authHeaders()})}catch(err){console.warn('No se pudo actualizar la dirección principal',err)}cerrarModal('modalDirecciones');abrirCheckout(d);}));
  host.querySelectorAll('[data-address-edit]').forEach(b=>b.addEventListener('click',()=>{const d=direccionesGuardadas.find(x=>Number(x.id)===Number(b.dataset.addressEdit));if(d)abrirFormularioDireccion(d,{editar:true,temporal:false})}));
  host.querySelectorAll('[data-address-replace]').forEach(b=>b.addEventListener('click',()=>{direccionReemplazoSeleccionada=direccionesGuardadas.find(x=>Number(x.id)===Number(b.dataset.addressReplace));if(!direccionReemplazoSeleccionada)return;$('#direccionAEliminarResumen').innerHTML=resumenDireccionHtml(direccionReemplazoSeleccionada);cerrarModal('modalDirecciones');abrirModal('modalConfirmarEliminarDireccion');}));
}
async function abrirLibroDirecciones(){await cargarDireccionesGuardadas();renderLibroDirecciones();cerrarModal('modalCheckout');abrirModal('modalDirecciones');}
function volverDesdeDirecciones(){cerrarModal('modalDirecciones');abrirCheckout(direccionTemporalActual||direccionEnvioActual);}
$('#btnVolverDirecciones')?.addEventListener('click',volverDesdeDirecciones);
$('#btnCerrarDirecciones')?.addEventListener('click',volverDesdeDirecciones);
function cambiarCantidadCheckout(id,delta){
  const it=carrito.find(x=>Number(x.id)===Number(id));
  if(!it)return;
  const nueva=Number(it.cantidad||1)+Number(delta||0);
  it.cantidad=Math.max(1,nueva);
  persistirCarrito();
  renderCarrito();
  abrirCheckout(direccionTemporalActual||direccionEnvioActual);
}
function quitarProductoCheckout(id){
  carrito=carrito.filter(x=>Number(x.id)!==Number(id));
  persistirCarrito();
  renderCarrito();
  if(!carrito.length){cerrarModal('modalCheckout');abrirModal('modalCarrito');return;}
  abrirCheckout(direccionTemporalActual||direccionEnvioActual);
}
window.cambiarCantidadCheckout=cambiarCantidadCheckout;
window.quitarProductoCheckout=quitarProductoCheckout;
function abrirCheckout(d=direccionEnvioActual){
  if(d)direccionEnvioActual=d;
  const sub=carrito.reduce((s,i)=>s+Number(i.precio)*i.cantidad,0);
  const productosHost=$('#checkoutProductos');
  productosHost.innerHTML=carrito.map(i=>{
    const src=imageUrl(i.imagen);
    return `<article class="checkout-product-card">${src?`<img class="checkout-product-thumb" src="${src}" alt="${esc(i.nombre)}">`:'<div class="checkout-product-thumb checkout-product-placeholder">📦</div>'}<div class="checkout-product-info"><strong title="${esc(i.nombre)}">${esc(i.nombre)}</strong><small>${money(i.precio)} c/u</small><div class="checkout-product-footer"><div class="checkout-qty" aria-label="Cantidad de ${esc(i.nombre)}"><button type="button" onclick="cambiarCantidadCheckout(${i.id},-1)" ${Number(i.cantidad)<=1?'disabled':''} aria-label="Disminuir cantidad">−</button><span>${i.cantidad}</span><button type="button" onclick="cambiarCantidadCheckout(${i.id},1)" aria-label="Aumentar cantidad">+</button></div><b>${money(i.precio*i.cantidad)}</b></div></div><button class="checkout-product-remove" type="button" onclick="quitarProductoCheckout(${i.id})" aria-label="Quitar ${esc(i.nombre)}" title="Quitar producto">×</button></article>`;
  }).join('');
  const unidades=carrito.reduce((n,i)=>n+Number(i.cantidad||0),0);
  const count=$('#checkoutProductCount');if(count)count.textContent=`(${unidades})`;
  const moverProductos=dir=>productosHost?.scrollBy({left:dir*Math.max(280,productosHost.clientWidth*.72),behavior:'smooth'});
  const prev=$('#checkoutProductosPrev'),next=$('#checkoutProductosNext');
  if(prev)prev.onclick=()=>moverProductos(-1);
  if(next)next.onclick=()=>moverProductos(1);
  const actualizarNavProductos=()=>{
    if(!productosHost||!prev||!next)return;
    const hayOverflow=productosHost.scrollWidth>productosHost.clientWidth+4;
    prev.hidden=!hayOverflow;next.hidden=!hayOverflow;
    if(hayOverflow){prev.disabled=productosHost.scrollLeft<=2;next.disabled=productosHost.scrollLeft+productosHost.clientWidth>=productosHost.scrollWidth-2;}
  };
  if(productosHost)productosHost.onscroll=actualizarNavProductos;
  requestAnimationFrame(actualizarNavProductos);
  $('#checkoutSubtotal').textContent=money(sub);$('#checkoutTotal').textContent=money(sub);$('#checkoutMensaje').hidden=true;
  renderAddressHost();cerrarModal('modalCarrito');cerrarModal('modalDireccionEnvio');cerrarModal('modalDirecciones');abrirModal('modalCheckout');localStorage.removeItem('tiendapro_checkout_pendiente');
}
async function asegurarDireccionYCheckout(){
  if(!carrito.length)return;
  if(!tieneSesion()){localStorage.setItem('tiendapro_checkout_pendiente','1');cerrarModal('modalCarrito');abrirModal('modalAcceso');return;}
  direccionTemporalActual=null;await cargarDireccionesGuardadas();abrirCheckout(direccionEnvioActual);
}
$('#btnFinalizar').addEventListener('click',asegurarDireccionYCheckout);
$('#btnCancelarDireccion')?.addEventListener('click',()=>{cerrarModal('modalDireccionEnvio');abrirCheckout(direccionTemporalActual||direccionEnvioActual);});
$('#btnOtraDireccion')?.addEventListener('click',()=>abrirFormularioDireccion(null,{temporal:true}));
$('#btnCancelarReemplazo')?.addEventListener('click',()=>{direccionNuevaPendiente=null;cerrarModal('modalLimiteDirecciones');direccionTemporalActual=obtenerPayloadDireccion();abrirCheckout(direccionTemporalActual)});
$('#btnElegirReemplazo')?.addEventListener('click',async()=>{cerrarModal('modalLimiteDirecciones');await cargarDireccionesGuardadas();renderLibroDirecciones({modoReemplazo:true});abrirModal('modalDirecciones');});
$('#btnCancelarEliminarDireccion')?.addEventListener('click',()=>{cerrarModal('modalConfirmarEliminarDireccion');renderLibroDirecciones({modoReemplazo:true});abrirModal('modalDirecciones');});
$('#btnConfirmarEliminarDireccion')?.addEventListener('click',async()=>{
  if(!direccionReemplazoSeleccionada||!direccionNuevaPendiente)return;
  const btn=$('#btnConfirmarEliminarDireccion');btn.disabled=true;btn.textContent='Guardando...';
  try{
    const r=await fetch(`${API}/auth/mis-direcciones/reemplazar/${direccionReemplazoSeleccionada.id}`,{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(direccionNuevaPendiente)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.mensaje||'No se pudo reemplazar la dirección');
    direccionTemporalActual=null;direccionEnvioActual=data.direccion;direccionNuevaPendiente=null;direccionReemplazoSeleccionada=null;await cargarDireccionesGuardadas();direccionEnvioActual=data.direccion;cerrarModal('modalConfirmarEliminarDireccion');abrirCheckout(direccionEnvioActual);
  }catch(err){alert(err.message)}finally{btn.disabled=false;btn.textContent='Eliminar y guardar';}
});
$('#formDireccionEnvio')?.addEventListener('submit',async e=>{
  e.preventDefault();const btn=$('#btnGuardarDireccion'),msg=$('#direccionMensaje');msg.hidden=true;const payload=obtenerPayloadDireccion();btn.disabled=true;btn.textContent='Guardando...';
  try{
    const editId=Number($('#direccionIdEditar').value||0);
    if(editId){
      const r=await fetch(`${API}/auth/mis-direcciones/${editId}`,{method:'PUT',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(payload)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.mensaje||'No se pudo actualizar la dirección');
      await cargarDireccionesGuardadas();direccionTemporalActual=null;direccionEnvioActual=direccionesGuardadas.find(x=>Number(x.id)===editId)||data.direccion;abrirCheckout(direccionEnvioActual);return;
    }
    if(!$('#direccionGuardarFavorita').checked){direccionTemporalActual={...payload,temporal:true};cerrarModal('modalDireccionEnvio');abrirCheckout(direccionTemporalActual);return;}
    if(direccionesGuardadas.length>=3){direccionNuevaPendiente={...payload};cerrarModal('modalDireccionEnvio');abrirModal('modalLimiteDirecciones');return;}
    const r=await fetch(`${API}/auth/mis-direcciones`,{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(payload)});const data=await r.json().catch(()=>({}));if(r.status===409&&data.codigo==='LIMITE_DIRECCIONES'){direccionNuevaPendiente={...payload};cerrarModal('modalDireccionEnvio');abrirModal('modalLimiteDirecciones');return;}if(!r.ok)throw new Error(data.mensaje||'No se pudo guardar la dirección');
    await cargarDireccionesGuardadas();direccionTemporalActual=null;direccionEnvioActual=data.direccion;abrirCheckout(direccionEnvioActual);
  }catch(err){msg.textContent=err.message;msg.hidden=false;}finally{btn.disabled=false;btn.textContent=$('#direccionIdEditar').value?'Actualizar dirección':'Usar dirección';}
});
$('#btnConfirmarCompra')?.addEventListener('click',()=>{});



// FASE 114: buscador predictivo. Muestra coincidencias mientras el cliente escribe
// sin alterar la búsqueda completa ni el desplazamiento del catálogo.
let temporizadorBuscadorPredictivo=null;
let solicitudBuscadorPredictivo=null;
let indiceSugerencia=-1;

function cerrarBuscadorPredictivo(){
  const panel=$('#buscadorPredictivo');
  if(!panel)return;
  panel.hidden=true; panel.innerHTML=''; indiceSugerencia=-1;
}
function marcarSugerenciaPredictiva(indice){
  const panel=$('#buscadorPredictivo'); if(!panel)return;
  const items=[...panel.querySelectorAll('[data-search-suggestion]')];
  if(!items.length)return;
  indiceSugerencia=Math.max(-1,Math.min(items.length-1,indice));
  items.forEach((el,i)=>el.classList.toggle('active',i===indiceSugerencia));
  if(indiceSugerencia>=0)items[indiceSugerencia].scrollIntoView({block:'nearest'});
}
function renderBuscadorPredictivo(lista,q){
  const panel=$('#buscadorPredictivo'); if(!panel)return;
  const unicos=[]; const vistos=new Set();
  (lista||[]).forEach(p=>{if(!p||vistos.has(Number(p.id)))return;vistos.add(Number(p.id));unicos.push(p)});
  const productosVista=unicos.slice(0,6);
  const productosHtml=productosVista.map((p,i)=>{
    const img=imagenProducto(p), precio=precioFinal(p), tienda=p.tienda||p.marca||'TiendaPro';
    return `<button type="button" class="search-suggest-item" role="option" data-search-suggestion="${i}" data-product-id="${p.id}"><span class="search-suggest-thumb">${img?`<img src="${img}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><i style="display:none">📦</i>`:'<i>📦</i>'}</span><span class="search-suggest-info"><strong>${esc(p.nombre)}</strong><small>${esc(tienda)}</small></span><b>${money(precio)}</b></button>`;
  }).join('');
  panel.innerHTML=`${productosHtml}${productosVista.length?'':'<div class="search-suggest-empty">No encontramos productos mientras escribes.</div>'}<button type="button" class="search-suggest-all" data-search-all>Ver todos los resultados para “${esc(q)}” <span>→</span></button>`;
  panel.hidden=false; indiceSugerencia=-1;
}
async function buscarMientrasEscribe(){
  const input=$('#buscarPublico'); const q=input?.value.trim()||'';
  if(q.length<2){if(solicitudBuscadorPredictivo)solicitudBuscadorPredictivo.abort();cerrarBuscadorPredictivo();return;}
  if(solicitudBuscadorPredictivo)solicitudBuscadorPredictivo.abort();
  solicitudBuscadorPredictivo=new AbortController();
  try{
    const p=new URLSearchParams({search:q,orden:'relevancia',page:'1',limit:'6'});
    const r=await fetch(`${API}/productos/publicos?${p.toString()}`,{signal:solicitudBuscadorPredictivo.signal});
    if(!r.ok)throw new Error('No se pudieron cargar sugerencias');
    const data=await r.json();
    if((input?.value.trim()||'')!==q)return;
    renderBuscadorPredictivo(data.productos||[],q);
  }catch(err){if(err.name!=='AbortError')cerrarBuscadorPredictivo();}
}
function configurarBuscadorPredictivo(){
  const input=$('#buscarPublico'),panel=$('#buscadorPredictivo'); if(!input||!panel)return;
  input.addEventListener('input',()=>{clearTimeout(temporizadorBuscadorPredictivo);temporizadorBuscadorPredictivo=setTimeout(buscarMientrasEscribe,280)});
  input.addEventListener('keydown',e=>{
    if(panel.hidden)return;
    const items=[...panel.querySelectorAll('[data-search-suggestion]')];
    if(e.key==='ArrowDown'){e.preventDefault();marcarSugerenciaPredictiva(indiceSugerencia+1);}
    else if(e.key==='ArrowUp'){e.preventDefault();marcarSugerenciaPredictiva(indiceSugerencia-1);}
    else if(e.key==='Escape'){e.preventDefault();cerrarBuscadorPredictivo();}
    else if(e.key==='Enter'&&indiceSugerencia>=0&&items[indiceSugerencia]){e.preventDefault();items[indiceSugerencia].click();}
  });
  panel.addEventListener('click',e=>{
    const item=e.target.closest('[data-product-id]');
    if(item){cerrarBuscadorPredictivo();abrirProductoTarjeta({target:item,currentTarget:item,type:'click',preventDefault(){},stopPropagation(){}},Number(item.dataset.productId));return;}
    if(e.target.closest('[data-search-all]')){cerrarBuscadorPredictivo();ejecutarBusquedaPublica();}
  });
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.header-search'))cerrarBuscadorPredictivo();});
  input.addEventListener('focus',()=>{if(input.value.trim().length>=2&&!panel.innerHTML)buscarMientrasEscribe();});
}

$('[data-store-home]')?.addEventListener('click',()=>{location.href='tienda_publica.html'});$('#btnBuscar').addEventListener('click',ejecutarBusquedaPublica);$('#buscarPublico').addEventListener('keydown',e=>{if(e.key==='Enter')ejecutarBusquedaPublica()});$('#buscarPublico').addEventListener('input',actualizarVisibilidadFiltrosCatalogo);$('#categoriaPublica').addEventListener('change',async e=>{filtroOfertaSuperior=false;sincronizarMenuCategoria(e.target.value);await cargarMarcas();cargarProductos(true)});$('#ordenPublico').addEventListener('change',()=>cargarProductos(true));$('#aplicarFiltros').addEventListener('click',()=>cargarProductos(true));$('#limpiarFiltros').addEventListener('click',()=>{$('#marcaPublica').value='';$('#precioMin').value='';$('#precioMax').value='';$('#soloOfertas').checked=false;cargarProductos(true)});$('#btnFiltros').addEventListener('click',()=>$('#panelFiltros').classList.toggle('open'));$('#btnOfertas').addEventListener('click',()=>{location.href='ofertas.html'});$$('.category-bar [data-cat]').forEach(b=>b.addEventListener('click',()=>{filtroOfertaSuperior=false;if(!b.dataset.cat){categoriaSeleccionadaId='';const sel=$('#categoriaPublica');if(sel)sel.value='';sincronizarMenuCategoria('');cargarProductos(true);return;}abrirSeccionCategoria(b.dataset.cat)}));
function cerrarCarritoYVolverSiCorresponde(){
  cerrarModal('modalCarrito');
  let origen='';try{origen=localStorage.getItem('tiendapro_carrito_origen')||'';localStorage.removeItem('tiendapro_carrito_origen')}catch(_){}
  if(origen && !/tienda_publica\.html(?:[?#]|$)/i.test(origen)){location.href=origen;}
}
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.close==='modalCarrito')cerrarCarritoYVolverSiCorresponde();else cerrarModal(b.dataset.close)}));$$('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target!==m)return;const bloqueantes=['modalCheckout','modalDireccionEnvio','modalDirecciones','modalLimiteDirecciones','modalConfirmarEliminarDireccion'];if(!bloqueantes.includes(m.id)){if(m.id==='modalCarrito')cerrarCarritoYVolverSiCorresponde();else cerrarModal(m.id)}}));

// En la portada normal de la tienda siempre comenzamos desde arriba para mostrar los banners.
// El navegador puede restaurar la posición anterior (por ejemplo, en el catálogo) al recargar/volver.
// No hacemos esto cuando existe un hash o parámetros que representan una navegación específica.
const esEntradaInicioTienda=!location.hash && !location.search;
if(esEntradaInicioTienda){
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  const volverArribaInicio=()=>window.scrollTo({top:0,left:0,behavior:'auto'});
  volverArribaInicio();
  requestAnimationFrame(volverArribaInicio);
  window.addEventListener('pageshow',volverArribaInicio,{once:true});
}

const paramsIniciales=new URLSearchParams(location.search);const qInicial=paramsIniciales.get('search');if(qInicial)$('#buscarPublico').value=qInicial;configurarMenuCategoriasJerarquico();configurarBuscadorPredictivo();configurarFooterMarketplace();configurarProductosRelacionados();actualizarSesionVisual();actualizarContador();
// El catálogo principal no debe depender de que termine la carga de marcas. En la página de
// inicio una petición lenta/fallida de marcas dejaba la cuadrícula vacía hasta cambiar de categoría.
cargarCategorias().finally(async()=>{const idCat=paramsIniciales.get('categoria_id');if(idCat)sincronizarMenuCategoria(idCat);const nombreCat=paramsIniciales.get('category_name');if(nombreCat){const cat=(categoriasJerarquia||[]).find(c=>String(c.nombre||c.name||'').toLowerCase()===String(nombreCat).toLowerCase());if(cat)sincronizarMenuCategoria(String(cat.id));}if(paramsIniciales.get('ofertas')==='1'){filtroOfertaSuperior=true;actualizarFiltroSuperiorActivo();}
  // Cargar primero los productos. Marcas es un filtro auxiliar y nunca debe bloquear el catálogo.
  actualizarVisibilidadFiltrosCatalogo();
  cargarProductos(true);
  await cargarMarcas();
});if(localStorage.getItem('tiendapro_abrir_carrito')==='1'){localStorage.removeItem('tiendapro_abrir_carrito');setTimeout(()=>abrirCarrito(),180);}if(paramsIniciales.get('checkout')==='1'||localStorage.getItem('tiendapro_checkout_pendiente')==='1'){setTimeout(()=>asegurarDireccionYCheckout(),120);}

document.addEventListener('DOMContentLoaded',()=>{
  const wrap=document.getElementById('accountMenuPublico'),trigger=document.getElementById('accountMenuTrigger'),drop=document.getElementById('accountDropdown');
  if(trigger&&drop&&wrap){
    trigger.addEventListener('click',e=>{e.stopPropagation();const open=drop.hidden;drop.hidden=!open;wrap.classList.toggle('open',open);trigger.setAttribute('aria-expanded',open?'true':'false')});
    document.addEventListener('click',e=>{if(!wrap.contains(e.target)){drop.hidden=true;wrap.classList.remove('open');trigger.setAttribute('aria-expanded','false')}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){drop.hidden=true;wrap.classList.remove('open');trigger.setAttribute('aria-expanded','false')}});
  }
  const closeMenu=document.getElementById('btnCerrarSesionMenu');
  const closeOld=document.getElementById('btnCerrarSesion');
  if(closeMenu&&closeOld)closeMenu.addEventListener('click',()=>closeOld.click());
});
