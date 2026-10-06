const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'inventario_fisico_view.html');
if (!fs.existsSync(file)) {
  console.error('No encontré inventario_fisico_view.html en esta carpeta. Ejecuta este script dentro de la carpeta donde está ese archivo.');
  process.exit(1);
}

let s = fs.readFileSync(file, 'utf8');

const cssOld = `.btn-publicar, .btn-ocultar { border: none; border-radius: 10px; padding: 8px 10px; font-weight: 900; cursor: pointer; white-space: nowrap; }
  .btn-publicar { color: #062f1a; background: linear-gradient(135deg, #22c55e, #86efac); }
  .btn-ocultar { color: #fff; background: rgba(239, 68, 68, .85); }
  .badge-publicado { background: rgba(34, 197, 94, .18); color: #86efac; }
  .badge-oculto { background: rgba(100, 116, 139, .25); color: #cbd5e1; }
  .acciones-publicacion { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }`;

const cssNew = `.badge-publicado { background: rgba(34, 197, 94, .18); color: #86efac; }
  .badge-oculto { background: rgba(100, 116, 139, .25); color: #cbd5e1; }
  .acciones-publicacion { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .switch-publicacion { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-weight: 900; color: #cbd5e1; }
  .switch-publicacion input { display: none; }
  .switch-slider { width: 48px; height: 26px; border-radius: 999px; background: rgba(100,116,139,.55); border: 1px solid rgba(148,163,184,.35); position: relative; transition: .2s; flex: none; }
  .switch-slider::after { content: ""; width: 20px; height: 20px; border-radius: 50%; background: #e2e8f0; position: absolute; top: 2px; left: 3px; transition: .2s; box-shadow: 0 4px 10px rgba(0,0,0,.28); }
  .switch-publicacion input:checked + .switch-slider { background: linear-gradient(135deg, #16a34a, #22c55e); border-color: rgba(34,197,94,.55); }
  .switch-publicacion input:checked + .switch-slider::after { left: 23px; background: #f0fdf4; }
  .switch-publicacion.disabled { opacity: .45; cursor: not-allowed; }
  .switch-text { min-width: 92px; font-size: 13px; }`;

if (s.includes(cssOld)) {
  s = s.replace(cssOld, cssNew);
} else if (!s.includes('.switch-publicacion')) {
  s = s.replace('.btn-primary, .btn-secondary, .btn-filter {', cssNew + '\n  .btn-primary, .btn-secondary, .btn-filter {');
}

const start = s.indexOf('  function botonPublicacionGrupo');
const end = s.indexOf('  window.cambiarPublicacionProducto', start);
if (start === -1 || end === -1) {
  console.error('No pude encontrar las funciones botonPublicacionGrupo/botonPublicacionUnidad para reemplazarlas.');
  process.exit(1);
}

const newFunctions = `  function botonPublicacionGrupo(grupo) {
    const publicado = Number(grupo.publicadas || 0) > 0;
    const disabled = Number(grupo.disponibles || 0) <= 0;
    const badge = publicado
      ? \`<span class="badge-estado badge-publicado">Publicado (\${grupo.publicadas})</span>\`
      : \`<span class="badge-estado badge-oculto">No publicado</span>\`;

    if (disabled) {
      return \`
        <div class="acciones-publicacion">
          \${badge}
          <label class="switch-publicacion disabled" title="No hay unidades disponibles para publicar">
            <input type="checkbox" disabled>
            <span class="switch-slider"></span>
            <span class="switch-text">Sin stock</span>
          </label>
        </div>
      \`;
    }

    return \`
      <div class="acciones-publicacion">
        \${badge}
        <label class="switch-publicacion">
          <input
            type="checkbox"
            \${publicado ? 'checked' : ''}
            onchange="window.cambiarPublicacionProducto(\${Number(grupo.producto_id)}, this.checked ? 1 : 0)"
          >
          <span class="switch-slider"></span>
          <span class="switch-text">\${publicado ? 'Publicado' : 'No publicado'}</span>
        </label>
      </div>
    \`;
  }

  function botonPublicacionUnidad(item) {
    const publicado = Number(item.publicado || 0) === 1;
    const disponible = item.estado === 'disponible';
    const badge = publicado
      ? '<span class="badge-estado badge-publicado">Publicado</span>'
      : '<span class="badge-estado badge-oculto">No publicado</span>';

    if (!disponible) {
      return \`
        <div class="acciones-publicacion">
          \${badge}
          <label class="switch-publicacion disabled" title="Solo se publican unidades disponibles">
            <input type="checkbox" \${publicado ? 'checked' : ''} disabled>
            <span class="switch-slider"></span>
            <span class="switch-text">No publicable</span>
          </label>
        </div>
      \`;
    }

    return \`
      <div class="acciones-publicacion">
        \${badge}
        <label class="switch-publicacion">
          <input
            type="checkbox"
            \${publicado ? 'checked' : ''}
            onchange="window.cambiarPublicacionUnidad(\${Number(item.id)}, this.checked ? 1 : 0)"
          >
          <span class="switch-slider"></span>
          <span class="switch-text">\${publicado ? 'Publicado' : 'No publicado'}</span>
        </label>
      </div>
    \`;
  }

`;
s = s.slice(0, start) + newFunctions + s.slice(end);

// Evita alertas molestas después de cambiar el switch.
s = s.replace(/\n\s*alert\(data\.mensaje \|\| 'Publicación actualizada\.'\);/g, '');

// Si la función de producto no refresca el detalle abierto, agrega refresco simple antes del catch.
const productFnStart = s.indexOf('window.cambiarPublicacionProducto');
const catchPos = s.indexOf('    } catch (error) {', productFnStart);
if (productFnStart !== -1 && catchPos !== -1) {
  const block = s.slice(productFnStart, catchPos);
  if (!block.includes('productoIdActual')) {
    const needle = '      await cargarInventario();';
    const add = `      await cargarInventario();
      if (grupoDetalleActivo) {
        const productoIdActual = grupoDetalleActivo.producto_id;
        grupoDetalleActivo = grupos.find(g => Number(g.producto_id) === Number(productoIdActual));
        if (grupoDetalleActivo) {
          $('detalleResumenProducto').innerHTML = \`
            <div class="detalle-resumen-card"><small>Total unidades</small><strong>\${grupoDetalleActivo.unidades.length}</strong></div>
            <div class="detalle-resumen-card"><small>Disponibles</small><strong>\${grupoDetalleActivo.disponibles}</strong></div>
            <div class="detalle-resumen-card"><small>Vendidas</small><strong>\${grupoDetalleActivo.vendidas}</strong></div>
            <div class="detalle-resumen-card"><small>Costo total</small><strong>\${formatearDinero(grupoDetalleActivo.costo_total)}</strong></div>
            <div class="detalle-resumen-card"><small>Publicadas</small><strong>\${grupoDetalleActivo.publicadas}</strong></div>
          \`;
          renderDetalleUnidades();
        }
      }`;
    const rel = s.indexOf(needle, productFnStart);
    if (rel !== -1 && rel < catchPos) s = s.slice(0, rel) + add + s.slice(rel + needle.length);
  }
}

fs.writeFileSync(file, s, 'utf8');
console.log('Listo: inventario_fisico_view.html fue actualizado con switch de publicación.');
