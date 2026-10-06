(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('pageCanvas');
  const KEY = 'tiendapro_editor_visual_demo_v1';
  const photo = '../backend/uploads/productos/1788742296506_8b43c647-b3cc-4ef9-8416-f3f16a8382c5.webp';
  const icons = { heart: '❤', star: '★', check: '✓', arrow: '→' };
  const fresh = () => ({ version: 1, styles: { desktop: { elements: {}, types: {} }, mobile: { elements: {}, types: {} } }, text: {}, images: {}, icons: {}, links: {}, added: [], order: {} });
  let state = fresh(), selected = 'logo', viewport = 'desktop', preview = false, drag = null;
  let undo = [], redo = [];
  const demoFavorites = new Set();
  const clone = value => JSON.parse(JSON.stringify(value));
  const number = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const validImage = value => typeof value === 'string' && (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) || value === photo);
  const hex = value => /^#[a-f0-9]{6}$/i.test(value || '');
  function status(text) { $('editorStatus').textContent = text; }
  try {
    const draft = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (draft?.version === 1 && draft.styles?.desktop?.elements && draft.styles?.mobile?.elements && Array.isArray(draft.added)) {
      state = { ...fresh(), ...draft }; state.added = state.added.slice(0, 30); status('Borrador recuperado');
    }
  } catch (_) { status('No se pudo recuperar el borrador'); }
  function remember() { undo.push(clone(state)); if (undo.length > 30) undo.shift(); redo = []; }
  function element(id = selected) { return [...canvas.querySelectorAll('[data-edit]')].find(el => el.dataset.edit === id); }
  const locked = id => /^(image|title|store|rating|price)-(main|detail|seller)-[12]$/.test(id);
  const shapes = ['rectangle', 'circle', 'line', 'triangle'];
  function linkable(el) { return el && !locked(el.dataset.edit) && !el.closest('[data-demo-action]') && !el.querySelector('button,[data-demo-action],[data-link]'); }
  function safeLink(value) {
    if (!value) return true;
    if (/[\s\\\u0000-\u001f]/.test(value) || value.startsWith('//')) return false;
    return /^https?:\/\/[^/]+/i.test(value) || /^mailto:[^@]+@[^@]+$/i.test(value) || /^tel:\+?[\d()-]+$/i.test(value) || /^#[a-z0-9_-]+$/i.test(value);
  }
  const cssAllowed = new Set('color background-color font-size font-weight font-style text-decoration text-align line-height border border-width border-style border-color border-radius padding padding-top padding-right padding-bottom padding-left margin margin-top margin-right margin-bottom margin-left width min-width max-width height min-height max-height opacity box-shadow object-fit display flex-direction flex-wrap align-items justify-content gap grid-template-columns'.split(' '));
  function parseCss(raw) {
    if (typeof raw !== 'string' || raw.length > 4000 || /[{}@<>\\]|url\s*\(|expression\s*\(|!important|\/\*/i.test(raw)) throw new Error('Usa propiedades CSS de apariencia, sin reglas, enlaces ni scripts.');
    const result = [];
    for (const declaration of raw.split(';').filter(s => s.trim())) {
      const colon = declaration.indexOf(':');
      const name = declaration.slice(0, colon).trim().toLowerCase(), value = declaration.slice(colon + 1).trim();
      if (colon < 0 || !cssAllowed.has(name) || !value || !CSS.supports(name, value) || /(?:var|attr)\s*\(/i.test(value)) throw new Error('Propiedad no permitida o valor inválido: ' + name);
      if (name === 'display' && !['block', 'inline-block', 'flex', 'inline-flex', 'grid'].includes(value)) throw new Error('Esta distribución no está permitida.');
      result.push([name, value]);
    }
    return result;
  }
  function editable(tag, id, label, text, cls = '') {
    return `<${tag} class="editable ${cls}" data-edit="${id}" data-label="${label}"><span class="editable-copy">${text}</span></${tag}>`;
  }
  function cards(type, label) {
    return `<section class="sample-section editable" data-edit="section-${type}" data-label="${label}">${editable('h2', 'heading-' + type, 'Título de ' + label, label)}<div class="sample-grid editable" data-edit="grid-${type}" data-label="Grupo de tarjetas ${label}">${[1, 2].map(n => {
      const id = type + '-' + n;
      return `<article class="sample-card ${type} editable" data-edit="${id}" data-card-type="${type}" data-label="Tarjeta ${label} ${n}">
        <img class="sample-image editable" src="${photo}" alt="Red Magic 11s Pro" data-edit="image-${id}" data-label="Imagen ${label} ${n}" draggable="false">
        <button type="button" class="sample-heart editable" data-edit="favorite-${id}" data-label="Corazón ${label} ${n}" data-demo-action="favorite" aria-label="Guardar favorito" aria-pressed="false">❤</button>
        ${editable('h3', 'title-' + id, 'Nombre del producto ' + n, 'Red Magic 11s Pro')}
        ${editable('p', 'store-' + id, 'Nombre del vendedor ' + n, 'Tienda de ejemplo', 'sample-store')}
        ${editable('p', 'rating-' + id, 'Reseñas ' + n, '★★★★★', 'sample-rating')}
        ${editable('strong', 'price-' + id, 'Precio ' + n, '$800.02', 'sample-price')}
        <button type="button" class="sample-cart editable" data-edit="cart-${id}" data-label="Botón del carrito ${n}" data-demo-action="cart"><span class="editable-copy">Agregar al carrito</span></button>
      </article>`;
    }).join('')}</div></section>`;
  }
  function props(el) {
    const mode = state.styles[viewport];
    return { ...(el.dataset.cardType ? mode.types?.[el.dataset.cardType] : {}), ...mode.elements[el.dataset.edit] };
  }
  function applyStyles() {
    canvas.querySelectorAll('[data-edit]').forEach(el => {
      const p = props(el);
      el.removeAttribute('style');
      el.style.transform = `translate(${number(p.x, -600, 600)}px,${number(p.y, -600, 600)}px) rotate(${number(p.rotate, -180, 180)}deg)`;
      if (p.z !== undefined) el.style.zIndex = number(p.z, -20, 100);
      if (hex(p.color)) el.style.color = p.color;
      if (hex(p.background)) el.style.backgroundColor = p.background;
      if (p.fontSize !== undefined) el.style.fontSize = number(p.fontSize, 9, 80) + 'px';
      if (p.radius !== undefined) el.style.borderRadius = number(p.radius, 0, 80) + 'px';
      if (p.padding !== undefined) el.style.padding = number(p.padding, 0, 48) + 'px';
      if (p.width !== undefined) el.style.width = `min(100%,${number(p.width, 24, 1200)}px)`;
      if (p.height !== undefined) { el.style.height = number(p.height, 24, 1000) + 'px'; el.style.minHeight = '0'; }
      if (['left', 'center', 'right'].includes(p.align)) { el.style.textAlign = p.align; if (el.tagName === 'BUTTON') el.style.justifyContent = p.align === 'left' ? 'flex-start' : p.align === 'right' ? 'flex-end' : 'center'; }
      if (p.opacity !== undefined) el.style.opacity = number(p.opacity, 0, 100) / 100;
      if (p.backgroundAlpha !== undefined) { const color = hex(p.background) ? p.background : colorValue(getComputedStyle(el).backgroundColor, '#ffffff'); el.style.backgroundColor = color + Math.round(number(p.backgroundAlpha, 0, 100) * 2.55).toString(16).padStart(2, '0'); }
      if (p.borderWidth !== undefined) { el.style.borderWidth = number(p.borderWidth, 0, 24) + 'px'; el.style.borderStyle = p.borderStyle || 'solid'; }
      if (hex(p.borderColor)) el.style.borderColor = p.borderColor;
      if (['solid', 'dashed', 'dotted', 'double', 'none'].includes(p.borderStyle)) el.style.borderStyle = p.borderStyle;
      if (p.shadow !== undefined) { const s = number(p.shadow, 0, 40); el.style.boxShadow = s ? `0 ${s / 3}px ${s}px #17283235` : 'none'; }
      if (p.blur !== undefined) el.style.filter = `blur(${number(p.blur, 0, 12)}px)`;
      if (p.weight !== undefined) el.style.fontWeight = number(p.weight, 100, 900);
      if (p.textStyle !== undefined) { el.style.fontStyle = p.textStyle === 'italic' ? 'italic' : 'normal'; el.style.textDecoration = p.textStyle === 'underline' ? 'underline' : 'none'; }
      if (['contain', 'cover'].includes(p.fit)) el.style.objectFit = p.fit;
      if (['block', 'row', 'column', 'grid'].includes(p.layout)) { el.style.display = ['row', 'column'].includes(p.layout) ? 'flex' : p.layout; if (['row', 'column'].includes(p.layout)) { el.style.flexDirection = p.layout; el.style.flexWrap = 'wrap'; } }
      if (p.gap !== undefined) el.style.gap = number(p.gap, 0, 80) + 'px';
      if (p.columns !== undefined) el.style.gridTemplateColumns = `repeat(${number(p.columns, 1, 6)},minmax(0,1fr))`;
      try { parseCss(p.css || '').forEach(([key, value]) => el.style.setProperty(key, value)); } catch (_) { /* Ignore invalid styles in older drafts. */ }
    });
  }
  function render() {
    canvas.className = 'page-canvas' + (viewport === 'mobile' ? ' mobile' : '') + (preview ? ' preview' : '');
    canvas.innerHTML = `<header class="sample-header editable" data-edit="header" data-label="Encabezado">${editable('div', 'logo', 'Logo', '✓', 'sample-logo')}${editable('div', 'brand', 'Nombre de la tienda', 'TiendaPro', 'sample-brand')}${editable('div', 'navigation', 'Texto de navegación', 'Inicio · Productos · Mi cuenta', 'sample-nav')}</header>
      <section class="sample-intro editable" data-edit="intro" data-label="Contenedor de presentación">${editable('h1', 'headline', 'Título principal', 'Tecnología para tu día a día')}${editable('p', 'description', 'Descripción', 'Descubre los productos de nuestras tiendas.')}
      <button type="button" class="sample-cta editable" data-edit="seller-link" data-label="Ver vendedor" data-demo-action="seller"><span class="editable-copy">Ver vendedor</span></button></section>
      ${cards('main', 'Inicio')}${cards('detail', 'Detalle del producto')}${cards('seller', 'Perfil del vendedor')}
      ${editable('footer', 'footer', 'Pie de página', 'TiendaPro · El Salvador', 'sample-footer')}`;
    canvas.querySelectorAll('[data-demo-action="favorite"]').forEach(button => { const saved = demoFavorites.has(button.dataset.edit); button.classList.toggle('saved', saved); button.setAttribute('aria-pressed', saved); });
    state.added.forEach(item => {
      if (!item || !/^added-[a-z0-9-]+$/.test(item.id || '')) return;
      const parent = element(item.parent);
      if (!parent || parent.tagName === 'IMG' || locked(item.parent) || !['text', 'image', 'container', 'button', ...shapes].includes(item.type) || (item.type === 'button' && parent.closest('button,[data-link]'))) return;
      const node = document.createElement(item.type === 'image' ? 'img' : item.type === 'button' ? 'button' : 'span');
      node.dataset.edit = item.id; node.dataset.label = item.type === 'image' ? 'Imagen añadida' : item.type === 'container' ? 'Contenedor añadido' : 'Texto añadido';
      node.className = 'editable is-added added-' + item.type;
      if (item.type === 'image') { node.src = photo; node.alt = 'Imagen añadida'; node.draggable = false; }
      else if (!shapes.includes(item.type)) { const copy = document.createElement('span'); copy.className = 'editable-copy'; copy.textContent = item.type === 'container' ? 'Contenedor' : item.type === 'button' ? 'Nuevo botón' : 'Nuevo texto'; node.append(copy); }
      if (item.type === 'button') node.type = 'button';
      if (shapes.includes(item.type)) node.dataset.label = { rectangle: 'Rectángulo', circle: 'Círculo', line: 'Línea', triangle: 'Triángulo' }[item.type];
      parent.append(node);
    });
    canvas.querySelectorAll('[data-edit]').forEach(el => {
      const id = el.dataset.edit, copy = el.querySelector(':scope > .editable-copy');
      if (locked(id)) return;
      if (copy && typeof state.text[id] === 'string') copy.textContent = state.text[id].slice(0, 1200);
      if (el.tagName === 'IMG' && validImage(state.images[id])) el.src = state.images[id];
      if (icons[state.icons[id]] && el.tagName !== 'IMG') {
        const icon = document.createElement('span'); icon.className = 'element-icon'; icon.textContent = icons[state.icons[id]]; icon.setAttribute('aria-hidden', 'true'); el.prepend(icon);
      }
    });
    canvas.querySelectorAll('[data-edit]').forEach(el => {
      const link = state.links[el.dataset.edit];
      if (!link?.url || !safeLink(link.url) || !linkable(el) || el.parentElement.closest('[data-link]')) return;
      el.dataset.link = link.url; el.dataset.newTab = String(!!link.newTab); el.tabIndex = 0; if (el.tagName !== 'BUTTON') el.setAttribute('role', 'link');
    });
    Object.entries(state.order).forEach(([parentId, ids]) => {
      const parent = parentId === 'canvas' ? canvas : element(parentId);
      if (parent && Array.isArray(ids)) ids.forEach(id => {
        const child = id === '$copy' ? parent.querySelector(':scope > .editable-copy') : id === '$icon' ? parent.querySelector(':scope > .element-icon') : element(id);
        if (child?.parentElement === parent) parent.append(child);
      });
    });
    applyStyles();
    if (!element()) selected = 'logo';
    element()?.classList.add('selected');
    const select = $('elementSelect'); select.replaceChildren();
    canvas.querySelectorAll('[data-edit]').forEach(el => { const option = document.createElement('option'); option.value = el.dataset.edit; option.textContent = el.dataset.label; select.append(option); });
    select.value = selected;
    $('undo').disabled = !undo.length; $('redo').disabled = !redo.length;
  }
  function colorValue(value, fallback) {
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return match ? '#' + match.slice(1).map(v => Number(v).toString(16).padStart(2, '0')).join('') : fallback;
  }
  function sync() {
    const el = element(); if (!el) return;
    const css = getComputedStyle(el), p = props(el), copy = el.querySelector(':scope > .editable-copy');
    $('selectionName').textContent = el.dataset.label;
    $('selectionType').textContent = el.dataset.cardType ? { main: 'Tarjetas de inicio', detail: 'Tarjetas del detalle', seller: 'Tarjetas del vendedor' }[el.dataset.cardType] : 'Elemento individual';
    $('groupLabel').hidden = !el.dataset.cardType;
    $('copy').disabled = !copy || locked(selected); $('copy').value = copy?.textContent || '';
    $('contentLock').hidden = !locked(selected); $('imageUpload').disabled = locked(selected);
    $('iconSelect').disabled = el.tagName === 'IMG' || locked(selected); $('iconSelect').value = state.icons[selected] || '';
    const canLink = linkable(el) && !el.parentElement.closest('[data-link]');
    $('actionLock').hidden = !el.closest('[data-demo-action]');
    ['linkUrl', 'linkNewTab', 'applyLink'].forEach(id => $(id).disabled = !canLink);
    $('linkUrl').value = state.links[selected]?.url || ''; $('linkNewTab').checked = !!state.links[selected]?.newTab;
    $('customCss').value = p.css || ''; $('cssError').textContent = '';
    document.querySelectorAll('[data-add]').forEach(button => button.disabled = locked(selected) || el.tagName === 'IMG' || (button.dataset.add === 'button' && !!el.closest('button,[data-link]')));
    ['borderWidth', 'opacity', 'backgroundAlpha', 'shadow', 'blur', 'rotate', 'gap', 'columns'].forEach(id => $(id).value = p[id] ?? ({ borderWidth: parseFloat(css.borderWidth) || 0, opacity: Number(css.opacity) * 100, backgroundAlpha: css.backgroundColor === 'rgba(0, 0, 0, 0)' ? 0 : 100, columns: 2 }[id] ?? 0));
    $('borderColor').value = p.borderColor || colorValue(css.borderColor, '#dce3e8');
    $('borderStyle').value = p.borderStyle || css.borderStyle || 'solid'; $('weight').value = p.weight || [400, 500, 700, 900].reduce((best, weight) => Math.abs(weight - parseFloat(css.fontWeight)) < Math.abs(best - parseFloat(css.fontWeight)) ? weight : best, 400); $('textStyle').value = p.textStyle || 'normal'; $('fit').value = p.fit || (css.objectFit === 'cover' ? 'cover' : 'contain'); $('layout').value = p.layout || 'default';
    $('color').value = p.color || colorValue(css.color, '#20272d');
    $('background').value = p.background || colorValue(css.backgroundColor, '#ffffff');
    $('fontSize').value = p.fontSize ?? Math.round(parseFloat(css.fontSize));
    $('radius').value = p.radius ?? (Math.round(parseFloat(css.borderRadius)) || 0);
    $('width').value = p.width ?? Math.round(el.offsetWidth);
    $('height').value = p.height ?? Math.round(el.offsetHeight);
    $('padding').value = p.padding ?? (parseFloat(css.paddingTop) || 0);
    $('x').value = p.x || 0; $('y').value = p.y || 0;
    $('align').value = p.align || (['left', 'center', 'right'].includes(css.textAlign) ? css.textAlign : 'left');
    $('deleteAdded').hidden = !selected.startsWith('added-');
    $('before').disabled = !el.previousElementSibling;
    $('after').disabled = !el.nextElementSibling;
  }
  function select(id) { selected = id; canvas.querySelector('.selected')?.classList.remove('selected'); element()?.classList.add('selected'); $('elementSelect').value = id; sync(); }
  function target() {
    const el = element(), mode = state.styles[viewport];
    if (el.dataset.cardType && $('applyGroup').checked) {
      return mode.types[el.dataset.cardType] ||= {};
    }
    return mode.elements[selected] ||= {};
  }
  function setProperty(key, value) {
    const el = element();
    target()[key] = value;
    if (el.dataset.cardType && $('applyGroup').checked) {
      canvas.querySelectorAll('[data-card-type]').forEach(card => {
        if (card.dataset.cardType === el.dataset.cardType && state.styles[viewport].elements[card.dataset.edit]) delete state.styles[viewport].elements[card.dataset.edit][key];
      });
    }
  }
  const fields = { color: ['color'], background: ['background'], fontSize: ['fontSize', 9, 80], radius: ['radius', 0, 80], width: ['width', 24, 1200], height: ['height', 24, 1000], padding: ['padding', 0, 48], x: ['x', -600, 600], y: ['y', -600, 600], align: ['align'] };
  Object.assign(fields, { borderWidth: ['borderWidth', 0, 24], borderColor: ['borderColor'], borderStyle: ['borderStyle'], opacity: ['opacity', 0, 100], backgroundAlpha: ['backgroundAlpha', 0, 100], shadow: ['shadow', 0, 40], blur: ['blur', 0, 12], rotate: ['rotate', -180, 180], weight: ['weight', 100, 900], textStyle: ['textStyle'], fit: ['fit'], layout: ['layout'], gap: ['gap', 0, 80], columns: ['columns', 1, 6] });
  Object.entries(fields).forEach(([id, rule]) => $(id).addEventListener('input', () => {
    if (!element()) return; remember();
    setProperty(rule[0], rule.length > 1 ? number($(id).value, rule[1], rule[2]) : $(id).value);
    applyStyles(); $('undo').disabled = false; $('redo').disabled = true; status('Cambios sin guardar');
  }));
  $('copy').addEventListener('input', () => { if (locked(selected)) return; remember(); state.text[selected] = $('copy').value; const copy = element().querySelector(':scope > .editable-copy'); if (copy) copy.textContent = $('copy').value; status('Cambios sin guardar'); $('undo').disabled = false; $('redo').disabled = true; });
  $('iconSelect').addEventListener('change', () => { if (locked(selected)) return; remember(); state.icons[selected] = $('iconSelect').value; render(); sync(); status('Cambios sin guardar'); });
  $('applyCss').addEventListener('click', () => {
    try { const raw = $('customCss').value; parseCss(raw); remember(); setProperty('css', raw); applyStyles(); $('cssError').textContent = ''; $('undo').disabled = false; $('redo').disabled = true; status('CSS aplicado al elemento'); }
    catch (error) { $('cssError').textContent = error.message; }
  });
  $('clearCss').addEventListener('click', () => { remember(); setProperty('css', ''); applyStyles(); sync(); $('undo').disabled = false; $('redo').disabled = true; status('CSS eliminado'); });
  $('applyLink').addEventListener('click', () => {
    const url = $('linkUrl').value.trim();
    if (!linkable(element()) || element().parentElement.closest('[data-link]')) return;
    if (!safeLink(url)) { status('Enlace inválido. Usa https://, mailto:, tel: o #seccion'); return; }
    remember(); state.links[selected] = { url, newTab: $('linkNewTab').checked }; render(); sync(); status(url ? 'Enlace aplicado' : 'Enlace eliminado');
  });
  $('elementSelect').addEventListener('change', e => select(e.target.value));
  $('applyGroup').addEventListener('change', sync);
  canvas.addEventListener('click', e => {
    if (!preview) { e.preventDefault(); const el = e.target.closest('[data-edit]'); if (el) select(el.dataset.edit); return; }
    const link = e.target.closest('[data-link]');
    if (link) { openLink(link); return; }
    const action = e.target.closest('[data-demo-action]');
    if (!action) return;
    if (action.dataset.demoAction === 'favorite') { const saved = action.classList.toggle('saved'); if (saved) demoFavorites.add(action.dataset.edit); else demoFavorites.delete(action.dataset.edit); action.setAttribute('aria-pressed', saved); status(saved ? 'Favorito de prueba guardado' : 'Favorito de prueba eliminado'); }
    if (action.dataset.demoAction === 'cart') status('Producto añadido al carrito de prueba');
    if (action.dataset.demoAction === 'seller') { element('section-seller').scrollIntoView({ behavior: 'smooth', block: 'start' }); status('Perfil del vendedor de prueba'); }
  });
  function openLink(el) {
    const url = el.dataset.link; if (!safeLink(url)) return;
    if (url.startsWith('#')) { const target = element(url.slice(1)); if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' }); else status('La sección de destino no existe en este ejemplo'); }
    else if (el.dataset.newTab === 'true') window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.assign(url);
  }
  canvas.addEventListener('keydown', e => { const link = e.target.closest('[data-link]'); if (preview && link && e.key === 'Enter' && link.tagName !== 'BUTTON') { e.preventDefault(); openLink(link); } });
  canvas.addEventListener('pointerdown', e => {
    if (preview || e.button !== 0) return;
    const el = e.target.closest('[data-edit]'); if (!el) return;
    select(el.dataset.edit);
    const p = props(el); drag = { id: selected, pointer: e.pointerId, startX: e.clientX, startY: e.clientY, x: Number(p.x || 0), y: Number(p.y || 0), moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag || drag.pointer !== e.pointerId) return;
    const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    if (!drag.moved) { remember(); drag.moved = true; }
    setProperty('x', number(Math.round(drag.x + dx), -600, 600)); setProperty('y', number(Math.round(drag.y + dy), -600, 600)); const p = props(element());
    applyStyles(); $('x').value = p.x; $('y').value = p.y;
  });
  function endDrag(e) { if (!drag || e.pointerId !== drag.pointer) return; if (drag.moved) { status('Posición modificada'); $('undo').disabled = false; $('redo').disabled = true; } drag = null; }
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  ['front', 'back'].forEach(id => $(id).addEventListener('click', () => { remember(); const p = props(element()); setProperty('z', number((Number(p.z) || 0) + (id === 'front' ? 1 : -1), -20, 100)); applyStyles(); status('Orden de capas modificado'); $('undo').disabled = false; $('redo').disabled = true; }));
  ['before', 'after'].forEach(id => $(id).addEventListener('click', () => {
    const el = element(), sibling = id === 'before' ? el.previousElementSibling : el.nextElementSibling; if (!sibling) return;
    remember(); const parent = el.parentElement;
    if (id === 'before') parent.insertBefore(el, sibling); else parent.insertBefore(sibling, el);
    const parentId = parent.dataset.edit || (parent === canvas ? 'canvas' : null);
    if (parentId) state.order[parentId] = [...parent.children].map(child => child.dataset.edit || (child.classList.contains('editable-copy') ? '$copy' : child.classList.contains('element-icon') ? '$icon' : null)).filter(Boolean);
    render(); sync(); status('Orden del contenido modificado');
  }));
  document.querySelectorAll('[data-viewport]').forEach(button => button.addEventListener('click', () => { viewport = button.dataset.viewport; document.querySelectorAll('[data-viewport]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); render(); sync(); }));
  $('preview').addEventListener('click', () => { preview = !preview; $('preview').setAttribute('aria-pressed', preview); canvas.classList.toggle('preview', preview); status(preview ? 'Vista previa de prueba' : 'Edición de prueba'); });
  function add(type, image) {
    const parent = element(); if (!parent || parent.tagName === 'IMG' || locked(selected) || state.added.length >= 30 || (type === 'button' && parent.closest('button,[data-link]'))) { status('Selecciona un contenedor disponible'); return; }
    remember(); const id = 'added-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    state.added.push({ id, parent: selected, type }); if (image) state.images[id] = image;
    selected = id; render(); sync(); status('Elemento añadido');
  }
  document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => add(button.dataset.add)));
  $('imageUpload').addEventListener('change', async e => {
    const file = e.target.files[0], id = selected; e.target.value = ''; if (!file || locked(id)) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) { status('Selecciona PNG, JPG o WebP de hasta 1 MB'); return; }
    try {
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const img = new Image(); img.src = data; await img.decode();
      if (!element(id)) return; select(id);
      if (element().tagName === 'IMG') { remember(); state.images[id] = data; render(); sync(); }
      else add('image', data);
      status('Imagen actualizada');
    } catch (_) { status('No se pudo abrir la imagen'); }
  });
  $('restoreElement').addEventListener('click', () => {
    remember(); const el = element(), mode = state.styles[viewport]; delete mode.elements[selected];
    if (el.dataset.cardType && $('applyGroup').checked) delete mode.types[el.dataset.cardType];
    delete state.text[selected]; delete state.images[selected]; delete state.icons[selected]; delete state.links[selected]; render(); sync(); status('Elemento restaurado');
  });
  $('deleteAdded').addEventListener('click', () => {
    remember(); const removed = new Set([selected]); let count;
    do { count = removed.size; state.added.forEach(item => { if (removed.has(item.parent)) removed.add(item.id); }); } while (count !== removed.size);
    state.added = state.added.filter(item => !removed.has(item.id)); selected = 'logo'; render(); sync(); status('Elemento añadido eliminado');
  });
  $('undo').addEventListener('click', () => { if (!undo.length) return; redo.push(clone(state)); state = undo.pop(); render(); sync(); status('Cambio deshecho'); });
  $('redo').addEventListener('click', () => { if (!redo.length) return; undo.push(clone(state)); state = redo.pop(); render(); sync(); status('Cambio rehecho'); });
  $('save').addEventListener('click', () => { try { localStorage.setItem(KEY, JSON.stringify(state)); status('Borrador de prueba guardado en este navegador'); } catch (_) { status('No hay espacio para guardar. Reduce el tamaño de las imágenes.'); } });
  $('reset').addEventListener('click', () => { remember(); state = fresh(); render(); sync(); status('Ejemplo restaurado. Puedes deshacer este cambio.'); });
  render(); sync();
})();
