(() => {
  if (window.TiendaProBranding) return;
  const API = 'http://localhost:3000';
  const KEY = 'tiendapro_marca_global';
  const selectors = '.brand-bag,.brand-mark,.brand-icon,.vendor-shell-brand-icon,.sidebar > .logo';
  const originals = new WeakMap();
  const originalIcon = document.querySelector('link[rel~="icon"]');
  const originalIconHref = originalIcon?.getAttribute('href');
  let icon = originalIcon;
  let config = { logo_url: '' }, pending = null, seasonalLogo = null;
  function logoUrl(value) {
    return /^\/uploads\/branding\/[a-f0-9-]+\.(png|jpg|webp)$/.test(value || '') ? API + value : '';
  }
  function render(root = document) {
    const elements = [...root.querySelectorAll(selectors)];
    if (root.matches?.(selectors)) elements.unshift(root);
    const url = logoUrl(seasonalLogo || config.logo_url);
    elements.forEach(el => {
      if (!originals.has(el)) originals.set(el, { children: [...el.childNodes].map(n => n.cloneNode(true)), url: '' });
      const saved = originals.get(el);
      if (saved.url === url) return;
      saved.url = url;
      el.replaceChildren(...saved.children.map(n => n.cloneNode(true)));
      el.classList.toggle('has-site-logo', Boolean(url));
      if (!url) return;
      const image = document.createElement('img');
      image.src = url;
      image.alt = 'Logo de Market';
      image.className = 'site-branding-image';
      image.addEventListener('error', () => {
        if (saved.url !== url) return;
        el.classList.remove('has-site-logo');
        el.replaceChildren(...saved.children.map(n => n.cloneNode(true)));
      }, { once: true });
      if (el.matches('.sidebar > .logo')) el.prepend(image);
      else el.replaceChildren(image);
    });
  }
  function update(value, persist = true) {
    config = { logo_url: logoUrl(value?.logo_url) ? value.logo_url : '', updated_at: value?.updated_at || null };
    if (persist) try { localStorage.setItem(KEY, JSON.stringify(config)); } catch (_) {}
    const url = logoUrl(seasonalLogo || config.logo_url);
    if (url) {
      if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon); }
      icon.removeAttribute('type');
      icon.href = url;
    } else if (icon) {
      if (originalIconHref) icon.setAttribute('href', originalIconHref);
      else { icon.remove(); icon = null; }
    }
    render();
    window.dispatchEvent(new CustomEvent('tiendapro:branding', { detail: config }));
  }
  async function refresh() {
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetch(`${API}/api/configuracion/marca`, { cache: 'no-store' });
        if (!response.ok) throw new Error('No se pudo cargar el logo.');
        if (!new URLSearchParams(location.search).has('appearancePreview')) {
          try { const themeResponse = await fetch(`${API}/api/configuracion/apariencia/publicada`, { cache: 'no-store' }); if (themeResponse.ok) { const theme = (await themeResponse.json()).theme; seasonalLogo = logoUrl(theme?.logo) ? theme.logo : null; } } catch (_) {}
        }
        update(await response.json());
      } catch (_) { /* Preserve the last logo while the server is unavailable. */ }
      finally { pending = null; }
      return config;
    })();
    return pending;
  }
  window.TiendaProBranding = { update, refresh, get: () => ({ ...config }), logoUrl, setSeasonalLogo: value => { seasonalLogo = logoUrl(value) ? value : null; update(config, false); } };
  try { update(JSON.parse(localStorage.getItem(KEY) || '{}'), false); } catch (_) {}
  const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType === 1) render(node);
  })));
  function watchBranding() { if (document.body) { observer.observe(document.body, { childList: true, subtree: true }); render(); } }
  if (document.body) watchBranding();
  else document.addEventListener('DOMContentLoaded', watchBranding, { once: true });
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    try { update(JSON.parse(e.newValue || '{}'), false); } catch (_) {}
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  refresh();
})();
