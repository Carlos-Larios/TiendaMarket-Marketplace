(() => {
  const API = 'http://localhost:3000/api/configuracion/apariencia';
  const $ = id => document.getElementById(id), form = $('themeForm'), frame = $('homePreview');
  const original = () => ({ version: 1, name: 'Personalizada', kicker: '', title: '', description: '', button: '', announcement: '', catalogTitle: '', accent: '#22b455', buttonText: '#ffffff', background: '#ffffff', heroBackground: '#f6f7f8', heroText: '#111827', radius: 8, heroHeight: 330, fontSize: 43, imagePosition: 50, align: 'left', heroImage: '', logo: '', order: ['hero', 'benefits', 'catalog', 'related'] });
  const numeric = new Set(['radius', 'heroHeight', 'fontSize', 'imagePosition']);
  const labels = { hero: 'Banner', benefits: 'Beneficios', catalog: 'Catálogo', related: 'Sugerencias' };
  let theme = original(), busy = false, loading = true, dirty = false, previewReady = false, allowed = false, loadedSettings = false, generation = 0, previewOriginal = true;
  try { allowed = localStorage.getItem('portalSesion') === 'panel' && ['admin', 'dueño'].includes(JSON.parse(localStorage.getItem('usuario') || '{}').rol); } catch (_) {}
  function status(text, error = false) { $('themeStatus').textContent = text; $('themeStatus').dataset.error = error; }
  function controls() {
    const disabled = busy || loading;
    form.querySelectorAll('input,textarea,select,button').forEach(el => el.disabled = disabled);
    ['saveDraft', 'publish', 'restore', 'previous', 'bannerFile', 'logoFile'].forEach(id => $(id).disabled = disabled || !allowed || !loadedSettings);
    $('preset').disabled = disabled;
    $('moveUp').disabled = disabled || theme.order.indexOf($('sectionSelect').value) === 0;
    $('moveDown').disabled = disabled || theme.order.indexOf($('sectionSelect').value) === theme.order.length - 1;
  }
  function preview() { if (previewReady) frame.contentWindow.postMessage({ type: 'tiendapro:appearance-preview', theme: previewOriginal ? null : theme }, location.origin); }
  function render() {
    for (const el of form.elements) if (el.name && Object.hasOwn(theme, el.name)) el.value = theme[el.name];
    $('sectionOrder').replaceChildren(...theme.order.map(id => { const li = document.createElement('li'); li.textContent = labels[id]; return li; }));
    controls(); preview();
  }
  function modified() { generation++; dirty = true; previewOriginal = false; $('publicationState').textContent = 'Cambios sin publicar'; status('Cambios en la vista previa'); controls(); preview(); }
  async function request(path, method = 'GET', body) {
    const headers = { Authorization: 'Bearer ' + (localStorage.getItem('token') || '') };
    if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await fetch(API + path, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    const result = await response.json(); if (!response.ok) throw new Error(result.mensaje || 'No se pudo guardar.'); return result;
  }
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('input', e => { const el = e.target; if (busy || loading || !el.name) return; theme[el.name] = numeric.has(el.name) ? Number(el.value) : el.value; modified(); });
  $('sectionSelect').addEventListener('change', controls);
  for (const [id, direction] of [['moveUp', -1], ['moveDown', 1]]) $(id).addEventListener('click', () => {
    const index = theme.order.indexOf($('sectionSelect').value), next = index + direction;
    if (busy || next < 0 || next >= theme.order.length) return;
    [theme.order[index], theme.order[next]] = [theme.order[next], theme.order[index]]; modified(); render();
  });
  $('preset').addEventListener('change', () => {
    if (busy) return;
    theme = original();
    if ($('preset').value === 'christmas') Object.assign(theme, { name: 'Navidad', kicker: 'Temporada navideña', title: 'TiendaPro en Navidad', description: 'Encuentra regalos para compartir esta temporada.', button: 'Explorar regalos', announcement: 'Celebra la Navidad con TiendaPro', catalogTitle: 'Regalos para esta Navidad', accent: '#b52636', heroBackground: '#123e2c', heroText: '#ffffff' });
    if ($('preset').value === 'sale') Object.assign(theme, { name: 'Temporada de ofertas', kicker: 'Selección de temporada', title: 'Ofertas en TiendaPro', description: 'Descubre los productos con descuentos disponibles en la tienda.', button: 'Explorar productos', accent: '#b52636', heroBackground: '#fbecee', heroText: '#402128', catalogTitle: 'Productos de temporada' });
    modified(); previewOriginal = $('preset').value === 'default'; render();
  });
  for (const [id, key] of [['bannerFile', 'heroImage'], ['logoFile', 'logo']]) $(id).addEventListener('change', async e => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file || !allowed || !loadedSettings || busy) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { status('Usa PNG, JPG o WebP de hasta 5 MB.', true); return; }
    busy = true; controls(); status('Subiendo imagen...');
    try { const body = new FormData(); body.append('image', file); const result = await request('/imagen', 'POST', body); theme[key] = result.url; modified(); }
    catch (error) { status(error.message, true); } finally { busy = false; controls(); }
  });
  for (const [id, key] of [['removeBanner', 'heroImage'], ['removeLogo', 'logo']]) $(id).addEventListener('click', () => { if (busy) return; theme[key] = ''; modified(); });
  async function persist(action) {
    if (!allowed || !loadedSettings || busy || loading) return;
    if (action === 'publicar' && previewOriginal) action = 'restaurar';
    if (action !== 'borrador' && !confirm(action === 'publicar' ? '¿Publicar esta apariencia para todos los visitantes del inicio?' : '¿Cambiar la apariencia publicada del inicio?')) return;
    busy = true; controls(); status('Guardando...');
    try {
      const result = await request('/' + action, 'POST', ['borrador', 'publicar'].includes(action) ? { ...theme, original: previewOriginal } : undefined);
      if (action !== 'borrador') { theme = result.published || original(); previewOriginal = !result.published; generation++; }
      dirty = false; render(); status(result.mensaje); $('publicationState').textContent = action === 'borrador' ? 'Borrador guardado' : 'Publicado';
    } catch (error) { status(error.message, true); } finally { busy = false; controls(); }
  }
  $('saveDraft').addEventListener('click', () => persist('borrador')); $('publish').addEventListener('click', () => persist('publicar')); $('restore').addEventListener('click', () => persist('restaurar')); $('previous').addEventListener('click', () => persist('anterior'));
  for (const id of ['desktop', 'mobile']) $(id).addEventListener('click', () => { frame.classList.toggle('mobile', id === 'mobile'); $('desktop').setAttribute('aria-pressed', id === 'desktop'); $('mobile').setAttribute('aria-pressed', id === 'mobile'); });
  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow || event.origin !== location.origin) return;
    if (event.data?.type === 'tiendapro:appearance-ready') { previewReady = true; preview(); }
    if (event.data?.type === 'tiendapro:appearance-select') {
      const field = [...form.elements].find(el => el.name === event.data.field);
      if (field) { field.scrollIntoView({ block: 'center', behavior: 'smooth' }); field.focus({ preventScroll: true }); }
      else status('Selecciona un campo del banner, aviso o título. Los datos y acciones de productos están protegidos.');
    }
  });
  frame.addEventListener('load', () => { previewReady = true; preview(); });
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  controls();
  (async () => {
    if (!allowed) { loading = false; render(); status('Vista previa sin sesión. Inicia sesión en el panel para guardar o publicar.'); return; }
    const start = generation;
    try { const config = await request(''); loadedSettings = true; if (generation === start) { theme = config.draft || config.published || original(); previewOriginal = !!theme.original || (!config.draft && !config.published); } status(config.draft ? 'Borrador recuperado' : 'Sin cambios pendientes'); }
    catch (error) { status(error.message, true); }
    finally { loading = false; render(); }
  })();
})();
