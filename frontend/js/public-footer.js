(()=>{
  const template=`<footer class="site-footer marketplace-footer" aria-label="Información de TiendaPro">
    <div class="footer-frame">
      <div class="footer-shell">
        <section class="footer-brand-block" aria-label="Market">
          <a class="brand footer-brand" href="tienda_publica.html" aria-label="Market inicio">
            <span class="brand-bag">M</span><span>Market</span>
          </a>
          <strong class="footer-tagline">Grandes marcas. Mejores historias.</strong>
          <p>Compras seguras, entregas rápidas y las mejores ofertas, siempre contigo.</p>
          <div class="footer-app">
            <strong>Descarga nuestra app</strong>
            <small>Compra desde donde estés.</small>
            <div class="app-buttons" aria-label="Aplicación móvil próximamente">
              <button type="button" data-footer-action="app-store">
                <span class="app-market-icon apple-mark" aria-hidden="true"></span>
                <span class="app-market-copy"><small>Descárgala en el</small><b>App Store</b></span>
              </button>
              <button type="button" data-footer-action="google-play">
                <span class="app-market-icon play-mark" aria-hidden="true"></span>
                <span class="app-market-copy"><small>Disponible en</small><b>Google Play</b></span>
              </button>
            </div>
          </div>
        </section>

        <section class="footer-center-block" aria-label="Beneficios y enlaces">
          <div class="footer-benefits">
            <button type="button" data-footer-info="envios">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17h4V5H2v12h3m9-8h4l4 4v4h-3M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>
              <span><strong>Envíos rápidos</strong><small>A todo el país</small></span>
            </button>
            <button type="button" data-footer-info="seguridad">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"/><path d="m9 12 2 2 4-4"/></svg>
              <span><strong>Compra 100%</strong><small>segura</small></span>
            </button>
            <button type="button" data-footer-info="devoluciones">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="m3 8 9 5v9l9-5V8M12 13v9"/></svg>
              <span><strong>Devoluciones</strong><small>fáciles</small></span>
            </button>
            <button type="button" data-footer-info="soporte">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M18 19c0 1.7-1.3 3-3 3h-3"/><path d="M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2Zm16 0a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z"/></svg>
              <span><strong>Soporte</strong><small>cuando lo necesites</small></span>
            </button>
          </div>

          <nav class="footer-links-grid" aria-label="Enlaces de TiendaPro">
            <div class="footer-link-column">
              <h3>Enlaces</h3>
              <a href="ofertas.html">Ofertas</a>
              <a href="#catalogo" data-footer-action="tiendas">Tiendas</a>
              <a href="#catalogo" data-footer-action="promociones">Promociones</a>
              <a href="#catalogo" data-footer-action="novedades">Novedades</a>
              <a href="#masVendidos" data-footer-action="vendidos">Más vendidos</a>
            </div>
            <div class="footer-link-column">
              <h3>Ayuda</h3>
              <a href="#ayuda" data-footer-info="ayuda">Centro de ayuda</a>
              <a href="#envios" data-footer-info="envios">Envíos y entregas</a>
              <a href="#devoluciones" data-footer-info="devoluciones">Cambios y devoluciones</a>
              <a href="#pagos" data-footer-info="pagos">Formas de pago</a>
              <a href="#seguimiento" data-footer-info="seguimiento">Seguimiento de pedido</a>
            </div>
            <div class="footer-link-column">
              <h3>Sobre nosotros</h3>
              <a href="#historia" data-footer-info="historia">Nuestra historia</a>
              <a href="#trabaja" data-footer-info="trabaja">Trabaja con nosotros</a>
              <a href="#terminos" data-footer-info="terminos">Términos y condiciones</a>
              <a href="#privacidad" data-footer-info="privacidad">Política de privacidad</a>
              <a href="#contacto" data-footer-info="contacto">Contacto</a>
            </div>
          </nav>
        </section>

        <section class="footer-subscribe" aria-label="Suscripción a promociones">
          <div class="footer-promo-art" aria-hidden="true"><span>%</span></div>
          <h2>¡No te pierdas<br>nuestras promociones!</h2>
          <p>Recibe ofertas exclusivas en tu correo.</p>
          <form id="footerPromoForm" class="footer-subscribe-form">
            <label class="sr-only" for="footerPromoEmail">Tu correo electrónico</label>
            <div class="footer-email-row">
              <input id="footerPromoEmail" type="email" placeholder="Tu correo electrónico" autocomplete="email" required>
              <button type="submit" aria-label="Suscribirme a promociones">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            <small id="footerPromoStatus" role="status" aria-live="polite"></small>
          </form>
        </section>
      </div>

      <div class="footer-bottom">
        <span>© 2026 TiendaPro. Todos los derechos reservados.</span>
        <span>Métodos de pago disponibles: se habilitarán cuando TiendaPro configure pagos en línea.</span>
        <span class="footer-country">El Salvador</span>
      </div>
    </div>
  </footer>`;
  const container=document.createElement('div');
  container.innerHTML=template;
  const footer=container.firstElementChild;
  footer.querySelectorAll('a[href^="#"]').forEach(link=>link.setAttribute('href','tienda_publica.html'+link.getAttribute('href')));
  const existing=document.querySelector('.marketplace-footer');
  if(existing)existing.replaceWith(footer);
  else document.body.appendChild(footer);
  document.querySelectorAll('.marketplace-footer').forEach(el=>{if(el!==footer)el.remove();});
  const layout=getComputedStyle(document.body);
  if(layout.display==='flex'&&layout.flexDirection.startsWith('row'))document.body.classList.add('marketplace-footer-row-layout');
  if(typeof window.configurarFooterMarketplace==='function'){
    window.configurarFooterMarketplace();
    return;
  }
  const $=(s)=>document.querySelector(s);
  const $$=(s)=>[...document.querySelectorAll(s)];
  const messages={
    envios:['Envíos y entregas','TiendaPro mostrará aquí cobertura, costos y tiempos de entrega disponibles para El Salvador.'],
    seguridad:['Compra segura','Protegemos tus datos durante la navegación y el proceso de compra.'],
    devoluciones:['Cambios y devoluciones','Aquí se publicará el proceso para cambios, devoluciones y reclamos postventa.'],
    soporte:['Soporte','Estamos preparando los canales de ayuda para compradores y vendedores.'],
    ayuda:['Centro de ayuda','Próximamente tendrás guías de compra, pedidos, cuenta y soporte en un solo lugar.'],
    pagos:['Formas de pago','Los métodos de pago en línea se habilitarán cuando TiendaPro complete su configuración.'],
    seguimiento:['Seguimiento de pedido','Inicia sesión en tu cuenta para revisar el estado de tus pedidos disponibles.'],
    historia:['Nuestra historia','TiendaPro nace para conectar tiendas y emprendedores salvadoreños con más compradores.'],
    trabaja:['Trabaja con nosotros','Las oportunidades para formar parte de TiendaPro se publicarán próximamente.'],
    terminos:['Términos y condiciones','Los términos oficiales de uso estarán disponibles cuando TiendaPro publique sus políticas finales.'],
    privacidad:['Política de privacidad','La política de privacidad oficial estará disponible en esta sección cuando se publique.'],
    contacto:['Contacto','Los canales oficiales de contacto de TiendaPro estarán disponibles próximamente.']
  };
  function info(key){const v=messages[key];if(!v)return;if(typeof window.abrirInfoPublica==='function')window.abrirInfoPublica(...v);else window.alert(`${v[0]}\n\n${v[1]}`);}
  $$('[data-footer-info]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();info(el.dataset.footerInfo);}));
  $$('[data-footer-action]').forEach(el=>el.addEventListener('click',e=>{
    const a=el.dataset.footerAction;
    if(a==='app-store'||a==='google-play'){e.preventDefault();window.alert('Aplicación móvil\n\nLa app móvil de TiendaPro estará disponible próximamente.');return;}
    if(a==='tiendas'||a==='promociones'){e.preventDefault();location.href='tienda_publica.html#catalogo';return;}
    if(a==='novedades'){e.preventDefault();location.href='tienda_publica.html#catalogo';return;}
    if(a==='vendidos'){e.preventDefault();location.href='tienda_publica.html#masVendidos';}
  }));
  $('#footerPromoForm')?.addEventListener('submit',e=>{
    e.preventDefault();const input=$('#footerPromoEmail'),status=$('#footerPromoStatus'),email=(input?.value||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){status.textContent='Ingresa un correo válido.';status.className='error';input?.focus();return;}
    try{localStorage.setItem('tiendapro_promos_email',email);}catch(_){}
    status.textContent='Listo. Te avisaremos cuando las promociones por correo estén disponibles.';status.className='ok';input.value='';
  });
})();
