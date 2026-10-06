(() => {
  const API = 'http://localhost:3000';
  const preview = new URLSearchParams(location.search).has('appearancePreview') && window.parent !== window;
  const hero = document.querySelector('.hero-minimal');
  if (!hero) return;
  const textOriginals = new Map(), styles = new Map();
  const selectors = { hero: '.hero-minimal', benefits: '.benefits', catalog: '#catalogo', related: '#busquedaRelacionada' };
  const nodes = Object.fromEntries(Object.entries(selectors).map(([id, selector]) => [id, document.querySelector(selector)]));
  const slots = Object.values(nodes).filter(Boolean).map(node => { const slot = document.createComment('appearance-slot'); node.before(slot); return slot; });
  const defaults = Object.keys(nodes).filter(id => nodes[id]);
  const notice = document.createElement('div'); notice.className = 'campaign-notice'; notice.hidden = true;
  document.querySelector('main').prepend(notice);
  const style = document.createElement('style'); document.head.append(style);
  function paint(el, key, value) {
    if (!styles.has(el)) styles.set(el, el.getAttribute('style'));
    el.style.setProperty(key, value);
  }
  function copy(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach(el => {
      if (!textOriginals.has(el)) textOriginals.set(el, [...el.childNodes].map(n => n.cloneNode(true)));
      el.textContent = value;
    });
  }
  const imageUrl = value => /^\/uploads\/branding\/[a-f0-9-]+\.(png|jpg|webp)$/.test(value || '') ? API + value : '';
  function apply(theme) {
    if (theme?.original) theme = null;
    styles.forEach((value, el) => { if (value === null) el.removeAttribute('style'); else el.setAttribute('style', value); });
    textOriginals.forEach((children, el) => el.replaceChildren(...children.map(n => n.cloneNode(true))));
    style.textContent = ''; notice.hidden = true;
    const order = theme?.order?.length === defaults.length && new Set(theme.order).size === defaults.length && theme.order.every(id => defaults.includes(id)) ? theme.order : defaults;
    order.forEach((id, index) => slots[index].after(nodes[id]));
    window.TiendaProBranding?.setSeasonalLogo(theme?.logo || null);
    if (!theme) return;
    const validColor = value => /^#[a-f0-9]{6}$/i.test(value || '');
    if (![theme.accent, theme.buttonText, theme.heroText, theme.heroBackground, theme.background].every(validColor)) return;
    paint(document.body, 'background-color', theme.background);
    paint(hero, 'background', theme.heroBackground);
    const image = imageUrl(theme.heroImage);
    if (image) {
      paint(hero, 'background-image', `url("${image}")`); paint(hero, 'background-size', 'cover'); paint(hero, 'background-position', `${Math.max(0, Math.min(100, theme.imagePosition))}% center`);
      document.querySelectorAll('.hero-visual,.hero-dots').forEach(el => paint(el, 'display', 'none'));
    }
    paint(hero, 'min-height', Math.max(200, Math.min(600, theme.heroHeight)) + 'px'); paint(hero, 'height', 'auto');
    copy('.hero-copy .hero-kicker', theme.kicker); copy('.hero-copy h1', theme.title); copy('.hero-copy p', theme.description); copy('.hero-cta', theme.button); copy('#catalogo > .section-title-row h2', theme.catalogTitle);
    document.querySelectorAll('.hero-copy').forEach(el => {
      paint(el, 'text-align', ['left', 'center', 'right'].includes(theme.align) ? theme.align : 'left');
      paint(el, 'max-width', image || theme.align !== 'left' ? '100%' : '48%');
      paint(el, 'margin-left', theme.align === 'left' ? '0' : 'auto'); paint(el, 'margin-right', theme.align === 'right' ? '0' : 'auto');
    });
    if (theme.align !== 'left') document.querySelectorAll('.hero-visual').forEach(el => paint(el, 'display', 'none'));
    document.querySelectorAll('.hero-copy h1').forEach(el => paint(el, 'font-size', Math.max(18, Math.min(56, theme.fontSize)) + 'px'));
    if (theme.announcement) { notice.textContent = theme.announcement; notice.hidden = false; }
    const radius = Math.max(0, Math.min(40, theme.radius));
    const mobileStyle = `@media(max-width:820px){.hero-copy h1{font-size:${Math.min(28, theme.fontSize)}px!important}.hero-copy{max-width:100%!important}.hero-visual{display:none!important}}`;
    style.textContent = `.hero-copy h1,.hero-copy h1 span,.hero-copy p,.hero-copy .hero-kicker{color:${theme.heroText}!important;letter-spacing:0}.hero-cta,.btn-signup,.apply-filter{background:${theme.accent}!important;color:${theme.buttonText}!important;border-radius:${radius}px!important}.brand-bag,.cart-icon span{background:${theme.accent}!important}.campaign-notice{padding:12px 24px;text-align:center;background:${theme.accent};color:${theme.buttonText};font-weight:700;overflow-wrap:anywhere}.hero-minimal{border-radius:${radius}px!important}.hero-copy h1{overflow-wrap:anywhere}@media(max-width:620px){.hero-copy h1{font-size:${Math.min(28, theme.fontSize)}px!important}.hero-minimal{padding:28px 20px!important}.hero-copy{max-width:100%!important}}`;
    style.textContent += mobileStyle;
  }
  async function refresh() {
    if (preview) return;
    try { const response = await fetch(API + '/api/configuracion/apariencia/publicada', { cache: 'no-store' }); if (response.ok) apply((await response.json()).theme); }
    catch (_) { /* The original storefront remains usable when configuration is unavailable. */ }
  }
  if (preview) {
    document.addEventListener('click', event => {
      event.preventDefault(); event.stopImmediatePropagation();
      const mappings = [['.hero-cta', 'button'], ['.hero-copy h1', 'title'], ['.hero-copy p', 'description'], ['.hero-kicker', 'kicker'], ['.campaign-notice', 'announcement'], ['#catalogo > .section-title-row h2', 'catalogTitle'], ['.hero-minimal', 'heroHeight']];
      const field = mappings.find(([selector]) => event.target.closest(selector))?.[1];
      window.parent.postMessage({ type: 'tiendapro:appearance-select', field: field || null }, location.origin);
    }, true);
    document.addEventListener('submit', event => { event.preventDefault(); event.stopImmediatePropagation(); }, true);
    window.addEventListener('message', event => {
      if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'tiendapro:appearance-preview') return;
      apply(event.data.theme);
    });
    window.parent.postMessage({ type: 'tiendapro:appearance-ready' }, location.origin);
  } else { refresh(); document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); }); }
})();
