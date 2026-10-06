(() => {
  const root = document.getElementById('brandingSettings');
  if (!root) return;
  const get = id => root.querySelector('#' + id);
  const fileInput = get('brandingFile'), preview = get('brandingPreview'), fallback = get('brandingDefault');
  const save = get('brandingSave'), reset = get('brandingReset'), status = get('brandingStatus');
  let user = null, selected = null, previewUrl = '', busy = false, loading = true;
  try { user = JSON.parse(localStorage.getItem('usuario') || 'null'); } catch (_) {}
  const allowed = localStorage.getItem('portalSesion') === 'panel' && ['admin', 'dueño'].includes(String(user?.rol || '').toLowerCase());
  const api = 'http://localhost:3000/api/configuracion/marca';
  function message(text, error = false) { status.textContent = text; status.dataset.error = String(error); }
  function controls() { fileInput.disabled = !allowed || busy || loading; save.disabled = !allowed || busy || loading || !selected; reset.disabled = !allowed || busy || loading || !window.TiendaProBranding?.get().logo_url; }
  function show(url) { preview.hidden = !url; fallback.hidden = Boolean(url); if (url) preview.src = url; else preview.removeAttribute('src'); }
  function clearPreview() { if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = ''; selected = null; fileInput.value = ''; }
  fileInput.addEventListener('change', async () => {
    clearPreviewSelection();
    show(window.TiendaProBranding?.logoUrl(window.TiendaProBranding.get().logo_url));
    const file = fileInput.files?.[0];
    if (!file) { show(window.TiendaProBranding?.logoUrl(window.TiendaProBranding.get().logo_url)); controls(); return; }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      message('Selecciona una imagen PNG, JPG o WebP de hasta 5 MB.', true); controls(); return;
    }
    const candidate = URL.createObjectURL(file), image = new Image();
    image.src = candidate;
    try {
      await image.decode();
      if (fileInput.files?.[0] !== file) { URL.revokeObjectURL(candidate); return; }
      previewUrl = candidate; selected = file; show(candidate); message('');
    } catch (_) { URL.revokeObjectURL(candidate); message('No se pudo abrir esa imagen.', true); }
    controls();
  });
  function clearPreviewSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = ''; selected = null;
  }
  async function request(method, body) {
    busy = true; controls(); message('Guardando...');
    try {
      const response = await fetch(api + '/logo', { method, headers: { Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }, body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.mensaje || 'No se pudo guardar el logo.');
      window.TiendaProBranding.update(result);
      clearPreview(); show(window.TiendaProBranding.logoUrl(result.logo_url)); message(result.mensaje);
    } catch (error) { message(error.message, true); }
    finally { busy = false; controls(); }
  }
  get('brandingForm').addEventListener('submit', e => {
    e.preventDefault(); if (!allowed || busy || !selected) return;
    const body = new FormData(); body.append('logo', selected); request('POST', body);
  });
  reset.addEventListener('click', () => { if (allowed && !busy) request('DELETE'); });
  (async () => {
    controls();
    try {
      const response = await fetch(api, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar la configuración.');
      const config = await response.json(); window.TiendaProBranding?.update(config);
      show(window.TiendaProBranding?.logoUrl(config.logo_url));
      if (!allowed) message('Solo administradores y el dueño pueden cambiar el logo.');
    } catch (_) { message('No se pudo conectar con la configuración de la tienda.', true); }
    finally { loading = false; controls(); }
  })();
})();
