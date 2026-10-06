(()=>{
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const API='http://localhost:3000/api';
  const user=(()=>{try{return JSON.parse(localStorage.getItem('usuario')||'null')}catch{return null}})();
  const logged=Boolean(localStorage.getItem('token')&&localStorage.getItem('portalSesion')==='tienda'&&String(user?.rol||'').toLowerCase()==='cliente');
  const guest=$('#sharedAccionesInvitado'), client=$('#sharedAccionesCliente');
  if(guest) guest.hidden=logged;
  if(client) client.hidden=!logged;
  if(logged && $('#sharedSaludoCliente')) $('#sharedSaludoCliente').textContent=`Hola, ${user?.nombre||'Cliente'}`;

  function cart(){try{return JSON.parse(localStorage.getItem('tiendapro_carrito_publico')||'[]')}catch{return []}}
  function updateCart(){const n=cart().reduce((a,x)=>a+Number(x.cantidad||0),0); if($('#sharedCartCount'))$('#sharedCartCount').textContent=n;if($('#sharedCartCountCliente'))$('#sharedCartCountCliente').textContent=n}
  updateCart();
  window.addEventListener('storage',updateCart);

  const menu=$('#sharedAccountDropdown'), trigger=$('#sharedAccountMenuTrigger');
  trigger?.addEventListener('click',e=>{e.stopPropagation();const open=menu?.hidden!==false;if(menu)menu.hidden=!open;trigger.setAttribute('aria-expanded',String(open))});
  document.addEventListener('click',e=>{if(menu&&!$('#sharedAccountMenu')?.contains(e.target)){menu.hidden=true;trigger?.setAttribute('aria-expanded','false')}});
  $('#sharedCerrarSesion')?.addEventListener('click',()=>{localStorage.removeItem('token');localStorage.removeItem('usuario');localStorage.removeItem('portalSesion');location.href='tienda_publica.html'});

  function goStore(params={},hash='catalogo'){
    const q=new URLSearchParams(params); location.href=`tienda_publica.html${q.toString()?`?${q}`:''}${hash?`#${hash}`:''}`;
  }
  function doSearch(){const q=$('#sharedBuscarPublico')?.value.trim(); if(q)goStore({search:q}); else goStore({},'catalogo')}
  $('#sharedBtnBuscar')?.addEventListener('click',doSearch);
  $('#sharedBuscarPublico')?.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch()});
  document.querySelectorAll('[data-shared-home]').forEach(b=>b.addEventListener('click',()=>{ location.href='tienda_publica.html'; }));
  function goCategoryByName(name){
    const q=new URLSearchParams({category_name:String(name||'')});
    location.href=`categoria.html?${q.toString()}`;
  }
  function goCategoryById(id){
    const q=new URLSearchParams({categoria_id:String(id)});
    location.href=`categoria.html?${q.toString()}`;
  }
  document.querySelectorAll('[data-shared-cat]').forEach(b=>b.addEventListener('click',()=>goCategoryByName(b.dataset.sharedCat)));
  $('#sharedOfertas')?.addEventListener('click',()=>{location.href='ofertas.html'});
  function openCart(){
    // Si la página actual implementa el carrito local, se abre aquí mismo.
    // Esto evita navegar a Inicio desde la ficha del producto.
    if(typeof window.abrirCarritoLocal==='function'){
      window.abrirCarritoLocal();
      return;
    }
    try{localStorage.setItem('tiendapro_carrito_origen',location.href)}catch(_){}
    localStorage.setItem('tiendapro_abrir_carrito','1');
    location.href='tienda_publica.html';
  }
  $('#sharedBtnCarrito')?.addEventListener('click',openCart);$('#sharedBtnCarritoCliente')?.addEventListener('click',openCart);

  // El encabezado compartido usa el mismo menú jerárquico de categorías que la tienda principal.
  let categorias=[];
  let ruta=[];
  const esc=t=>String(t??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

  function crearDrawer(){
    if($('#sharedCategoryDrawer')) return;
    const wrap=document.createElement('div');
    wrap.id='sharedCategoryDrawer';
    wrap.className='category-drawer';
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML=`
      <button class="category-drawer-backdrop" type="button" data-shared-category-close aria-label="Cerrar categorías"></button>
      <aside class="category-drawer-panel" role="dialog" aria-modal="true" aria-label="Categorías de TiendaPro">
        <div class="category-drawer-top">
          <div class="category-drawer-brand"><span class="brand-bag">M</span><strong>Market</strong></div>
          <button type="button" class="category-drawer-close" data-shared-category-close aria-label="Cerrar">×</button>
        </div>
        <div class="category-drawer-nav">
          <div class="category-drawer-backrow">
            <button type="button" id="sharedCategoryBackBtn" class="category-back-btn" hidden>← <span>Menú principal</span></button>
          </div>
          <div class="category-drawer-heading">
            <small id="sharedCategoryBreadcrumb">Categorías</small>
            <div class="category-drawer-heading-row">
              <h2 id="sharedCategoryDrawerTitle">Todas las categorías</h2>
              <button type="button" id="sharedCategoryDrawerAllLink" class="category-drawer-all-link" hidden><span class="category-all-text">Ver todos</span></button>
            </div>
          </div>
        </div>
        <div id="sharedCategoryDrawerList" class="category-drawer-list"><div class="category-drawer-empty">Cargando categorías...</div></div>
      </aside>`;
    document.body.appendChild(wrap);

    $$('[data-shared-category-close]').forEach(b=>b.addEventListener('click',cerrarCategorias));
    $('#sharedCategoryBackBtn')?.addEventListener('click',()=>{
      ruta.pop();
      const anterior=ruta.length?ruta[ruta.length-1].id:null;
      renderNivel(anterior);
    });
    $('#sharedCategoryDrawerAllLink')?.addEventListener('click',e=>{
      const id=e.currentTarget.dataset.categorySelect||'';
      const cat=porId(id);
      cerrarCategorias();
      cat?goCategoryById(cat.id):goStore({},'catalogo');
    });
    $('#sharedCategoryDrawerList')?.addEventListener('click',e=>{
      const all=e.target.closest('[data-category-select]');
      if(all){cerrarCategorias();goStore({},'catalogo');return;}
      const btn=e.target.closest('[data-category-id]');
      if(!btn)return;
      const cat=porId(btn.dataset.categoryId);if(!cat)return;
      if(hijos(cat.id).length){ruta.push(cat);renderNivel(cat.id);return;}
      cerrarCategorias();goCategoryById(cat.id);
    });
  }

  function hijos(parentId=null){
    return categorias.filter(c=>{
      const p=c.parent_id===null||c.parent_id===undefined||c.parent_id===''?null:Number(c.parent_id);
      return p===(parentId===null?null:Number(parentId));
    });
  }
  function porId(id){return categorias.find(c=>Number(c.id)===Number(id));}

  function marcarCategoriaHorizontalActiva(){
    $$('.category-links button').forEach(b=>b.classList.remove('active'));
    const file=(location.pathname.split('/').pop()||'').toLowerCase();
    const q=new URLSearchParams(location.search);
    if(file==='categoria.html'){
      // FASE109: primero marcamos por el nombre que viene en la URL. Esto no depende
      // de que la categoría tenga productos ni de que exista todavía en el catálogo devuelto.
      const requestedName=String(q.get('category_name')||'').trim().toLowerCase();
      if(requestedName){
        const direct=$$('.category-links [data-shared-cat]').find(b=>String(b.dataset.sharedCat||'').trim().toLowerCase()===requestedName);
        direct?.classList.add('active');
      }

      // Si tenemos el árbol real de categorías, refinamos la selección para que una
      // subcategoría deje marcada su categoría raíz (por ejemplo: Celulares -> Electrónica).
      let cat=null;
      const id=Number(q.get('categoria_id')||0);
      if(id)cat=porId(id);
      if(!cat && requestedName){
        cat=categorias.find(c=>String(c.name||c.nombre||'').trim().toLowerCase()===requestedName)||null;
      }
      if(cat){
        const byId=new Map(categorias.map(c=>[Number(c.id),c]));
        let root=cat, guard=0;
        while(root && root.parent_id!==null && root.parent_id!==undefined && root.parent_id!=='' && guard++<12){
          const next=byId.get(Number(root.parent_id));
          if(!next || next===root)break;
          root=next;
        }
        const rootName=String(root?.name||root?.nombre||cat.name||'').trim().toLowerCase();
        const btn=$$('.category-links [data-shared-cat]').find(b=>String(b.dataset.sharedCat||'').trim().toLowerCase()===rootName);
        if(btn){
          $$('.category-links button').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
        }
      }
      return;
    }
    if(file==='ofertas.html' || q.get('ofertas')==='1'){ $('#sharedOfertas')?.classList.add('active'); return; }
    if(file==='tienda_publica.html' || file===''){ $('.category-links [data-shared-home]')?.classList.add('active'); }
  }
  function renderNivel(parentId=null){
    const list=$('#sharedCategoryDrawerList');if(!list)return;
    const parent=parentId===null?null:porId(parentId);
    const items=hijos(parentId);
    const title=$('#sharedCategoryDrawerTitle'),crumb=$('#sharedCategoryBreadcrumb'),back=$('#sharedCategoryBackBtn'),allLink=$('#sharedCategoryDrawerAllLink'),nav=$('#sharedCategoryDrawer .category-drawer-nav');
    if(nav)nav.hidden=!parent;
    if(title)title.textContent=parent?parent.name:'Todas las categorías';
    if(crumb)crumb.textContent=parent?'Categorías › '+ruta.map(x=>x.name).join(' › '):'Categorías';
    if(back){back.hidden=ruta.length===0;const s=back.querySelector('span');if(s)s.textContent=ruta.length>1?ruta[ruta.length-2].name:'Menú principal';}
    if(allLink){allLink.hidden=!parent;allLink.dataset.categorySelect=parent?String(parent.id):'';}
    let html='';
    if(parentId===null)html+='<button type="button" class="category-drawer-all root" data-category-select="">Todas las categorías</button>';
    if(!items.length)html+='<div class="category-drawer-empty">No hay subcategorías.</div>';
    html+=items.map(c=>{
      const tiene=hijos(c.id).length>0;
      return `<button type="button" class="category-drawer-item" data-category-id="${c.id}" data-has-children="${tiene?'1':'0'}"><span>${esc(c.name)}</span>${tiene?'<b>›</b>':'<i>✓</i>'}</button>`;
    }).join('');
    list.innerHTML=html;
  }
  async function cargarCategorias(){
    if(categorias.length)return;
    try{
      const r=await fetch(`${API}/productos/publicos/categorias`);
      const data=await r.json();
      categorias=Array.isArray(data)?data:[];
      marcarCategoriaHorizontalActiva();
    }catch(_){categorias=[]; marcarCategoriaHorizontalActiva();}
  }
  async function abrirCategorias(e){
    e?.preventDefault();e?.stopPropagation();
    crearDrawer();
    ruta=[];
    const drawer=$('#sharedCategoryDrawer');
    drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');
    document.body.classList.add('category-menu-open');
    $('#sharedTodasCategorias')?.setAttribute('aria-expanded','true');
    await cargarCategorias();
    renderNivel(null);
  }
  function cerrarCategorias(){
    const drawer=$('#sharedCategoryDrawer');if(!drawer)return;
    drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');
    document.body.classList.remove('category-menu-open');
    $('#sharedTodasCategorias')?.setAttribute('aria-expanded','false');
  }

  $('#sharedTodasCategorias')?.setAttribute('aria-haspopup','dialog');
  $('#sharedTodasCategorias')?.setAttribute('aria-expanded','false');
  $('#sharedTodasCategorias')?.addEventListener('click',abrirCategorias);
  $('#sharedCategoriasMobile')?.addEventListener('click',abrirCategorias);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#sharedCategoryDrawer')?.classList.contains('open'))cerrarCategorias()});

  // FASE109: marcar inmediatamente por URL, incluso si la categoría está vacía.
  marcarCategoriaHorizontalActiva();

  // FASE108: cargar las categorías al iniciar para poder identificar y resaltar
  // la categoría horizontal activa sin necesidad de abrir primero el menú lateral.
  cargarCategorias();
})();
