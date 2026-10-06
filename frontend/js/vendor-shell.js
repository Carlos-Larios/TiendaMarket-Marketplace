(function(){
  const body = document.body;
  if (!body || body.dataset.vendorShell === 'off') return;
  const section = body.dataset.vendorSection || '';
  body.classList.add('vendor-shell-active');

  const sidebar = document.createElement('aside');
  sidebar.className = 'vendor-shell-sidebar';
  sidebar.innerHTML = `
    <div class="vendor-shell-brand"><div class="vendor-shell-brand-icon">M</div><div><strong>Market</strong><small>Panel de Vendedor</small></div></div>
    <nav class="vendor-shell-nav">
      <button class="vendor-shell-link ${section==='dashboard'?'active':''}" data-go="panel-vendedor.html"><span class="vendor-shell-ico">⌂</span>Dashboard</button>
      <button class="vendor-shell-group" type="button"><span class="vendor-shell-ico">▣</span>Ventas<span class="vendor-shell-chev">⌃</span></button>
      <div class="vendor-shell-sub"><button class="is-placeholder" data-placeholder="Mis pedidos">Mis pedidos</button></div>
      <button class="vendor-shell-group" type="button"><span class="vendor-shell-ico">♧</span>Catálogo<span class="vendor-shell-chev">⌃</span></button>
      <div class="vendor-shell-sub"><button class="${section==='mis-productos'?'active':''}" data-go="catalogo-vendedor.html">Mis productos</button><button class="${section==='inventario'?'active':''}" data-go="inventario-vendedor.html">Inventario</button></div>
      <button class="vendor-shell-group" type="button"><span class="vendor-shell-ico">＄</span>Finanzas<span class="vendor-shell-chev">⌄</span></button>
      <div class="vendor-shell-sub"><button class="is-placeholder" data-placeholder="Liquidaciones">Liquidaciones</button></div>
      <button class="vendor-shell-group" type="button"><span class="vendor-shell-ico">◯</span>Postventa<span class="vendor-shell-chev">⌄</span></button>
      <div class="vendor-shell-sub"><button class="is-placeholder" data-placeholder="Casos y devoluciones">Casos y devoluciones</button></div>
      <button class="vendor-shell-group" type="button"><span class="vendor-shell-ico">⚙</span>Mi tienda<span class="vendor-shell-chev">⌄</span></button>
      <div class="vendor-shell-sub"><button class="${section==='ajustes'?'active':''}" data-go="ajustes-vendedor.html">Ajustes</button><button class="is-placeholder" data-placeholder="Estadísticas">Estadísticas</button></div>
      <button class="vendor-shell-group" type="button"><span class="vendor-shell-ico">♙</span>Cuenta<span class="vendor-shell-chev">⌄</span></button>
      <div class="vendor-shell-sub"><button class="is-placeholder" data-placeholder="Perfil">Perfil</button><button class="is-placeholder" data-placeholder="Documentos">Documentos</button><button class="is-placeholder" data-placeholder="Seguridad">Seguridad</button></div>
    </nav>
    <div class="vendor-shell-spacer"></div>
    <button class="vendor-shell-logout" type="button" data-logout>Cerrar sesión</button>`;
  body.insertBefore(sidebar, body.firstChild);

  const mobile = document.createElement('div');
  mobile.className = 'vendor-shell-mobilebar';
  mobile.innerHTML = `
    <strong>Market · Vendedor</strong>
    <nav class="vendor-shell-mobilelinks" aria-label="Navegación rápida del vendedor">
      <button class="${section==='dashboard'?'active':''}" type="button" data-go="panel-vendedor.html">Dashboard</button>
      <button class="${section==='mis-productos'?'active':''}" type="button" data-go="catalogo-vendedor.html">Productos</button>
      <button class="${section==='inventario'?'active':''}" type="button" data-go="inventario-vendedor.html">Inventario</button>
      <button class="${section==='ajustes'?'active':''}" type="button" data-go="ajustes-vendedor.html">Ajustes</button>
    </nav>`;
  body.insertBefore(mobile, sidebar.nextSibling);

  function toast(text){
    const old=document.querySelector('.vendor-shell-toast'); if(old) old.remove();
    const el=document.createElement('div'); el.className='vendor-shell-toast'; el.textContent=text; document.body.appendChild(el);
    setTimeout(()=>el.remove(),2200);
  }
  body.addEventListener('click', (e)=>{
    const go=e.target.closest('[data-go]');
    if(go){ const url=go.dataset.go; if(url) window.location.href=url; return; }
    const ph=e.target.closest('[data-placeholder]');
    if(ph){ toast(`${ph.dataset.placeholder}: módulo pendiente de integrar al panel del vendedor.`); return; }
    const lo=e.target.closest('[data-logout]');
    if(lo){
      ['token','jwt','authToken','sellerToken','vendedorToken','usuario','user'].forEach(k=>{try{localStorage.removeItem(k)}catch{}});
      window.location.href='login-vendedor.html';
    }
  });
})();
