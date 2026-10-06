// =====================================================
// DASHBOARD FRONTEND / NAVEGACIÓN INTERNA CON HISTORIAL
// Este archivo debe ir en: frontend/js/dashboard.js
// =====================================================

const token = localStorage.getItem("token");
let usuarioPanel = null;
try { usuarioPanel = JSON.parse(localStorage.getItem("usuario") || "null"); } catch (_) {}
const portalSesion = localStorage.getItem("portalSesion");
const rolesPanelPermitidos = ["admin", "dueño", "empleado"];

if (!token || portalSesion !== "panel" || !rolesPanelPermitidos.includes(String(usuarioPanel?.rol || "").toLowerCase())) {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  localStorage.removeItem("portalSesion");
  window.location.replace("login-Panel.html");
}

const contenidoPrincipal = document.getElementById("contenidoPrincipal");
const tituloVista = document.getElementById("tituloVista");
const menuLinks = document.querySelectorAll(".menu a[data-vista]");
const menuLinksPendientes = document.querySelectorAll(".menu-link-disabled");
const fechaActual = document.getElementById("dashboardFechaActual");

function obtenerTextoFechaActual() {
  return new Date().toLocaleDateString("es-SV", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function crearPillFechaVista() {
  const pill = document.createElement("div");
  pill.className = "tiendapro-fecha-vista";
  pill.innerHTML = `<span>Datos en vivo</span><strong>${obtenerTextoFechaActual()}</strong>`;
  return pill;
}

function insertarFechaEnEncabezadoVista() {
  if (!contenidoPrincipal) return;
  contenidoPrincipal.querySelectorAll(".tiendapro-fecha-vista").forEach(el => el.remove());

  const encabezado = contenidoPrincipal.querySelector(
    ".analiticas-head, .vendedores-hero, .vendedores-head, .solicitudes-hero, .liquidaciones-hero, .disputas-hero, .postventa-hero, .administradores-hero, .empleados-hero, .usuarios-vendedores-hero, .clientes-hero, .notificaciones-hero, .bitacora-hero, .emprendedores-head, .pedidos-header, .productos-header, .usuarios-header, .configuracion-header, .devoluciones-header, .importacion-header, .inventario-header"
  );

  if (!encabezado) return;
  encabezado.classList.add("tiendapro-head-con-fecha");
  encabezado.appendChild(crearPillFechaVista());
}

function limpiarElementosFlotantesDeVistas() {
  // Evita que elementos creados por una vista anterior (toast, modales o overlays)
  // queden pegados al body y provoquen scroll horizontal en todo el dashboard.
  [
    "toastCodigoCopiado",
    "filtrosPedidosOverlay",
    "filtrosPedidosPanel"
  ].forEach((id) => {
    const elemento = document.getElementById(id);
    if (elemento && !contenidoPrincipal?.contains(elemento)) elemento.remove();
  });

  document.querySelectorAll(".toast-codigo-copiado").forEach((elemento) => elemento.remove());

  if (window.toastCodigoCopiadoTimer) {
    clearTimeout(window.toastCodigoCopiadoTimer);
    window.toastCodigoCopiadoTimer = null;
  }

  document.body.classList.remove("swal2-shown", "swal2-height-auto");
  document.documentElement.style.overflowX = "hidden";
  document.body.style.overflowX = "hidden";
}

const sidebar = document.querySelector(".sidebar");
const btnMenuMobile = document.getElementById("btnMenuMobile");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function abrirMenuMobile() {
  if (!sidebar) return;
  sidebar.classList.add("sidebar-open");
  document.body.classList.add("menu-mobile-abierto");
}

function cerrarMenuMobile() {
  if (!sidebar) return;
  sidebar.classList.remove("sidebar-open");
  document.body.classList.remove("menu-mobile-abierto");
}

if (btnMenuMobile) {
  btnMenuMobile.addEventListener("click", () => {
    if (sidebar && sidebar.classList.contains("sidebar-open")) cerrarMenuMobile();
    else abrirMenuMobile();
  });
}

if (sidebarOverlay) sidebarOverlay.addEventListener("click", cerrarMenuMobile);

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) cerrarMenuMobile();
});

const vistaInicial = "analiticas_view.html";

const titulosVistas = {
  "analiticas_view.html": "Inicio / Resumen",
  "productos_view.html": "Productos",
  "importacion_view.html": "Importación",
  "pedidos_view.html": "Pedidos",
  "usuarios_view.html": "Usuarios",
  "inventario_fisico_view.html": "Inventario físico",
  "ventas_view.html": "Ventas",
  "facturacion_view.html": "Facturación",
  "configuracion_view.html": "Configuración",
  "apariencia_inicio_view.html": "Apariencia del inicio",
  "editor_visual_view.html": "Editor visual de prueba",
  "devoluciones_view.html": "Devoluciones",
  "emprendedores_view.html": "Emprendedores",
  "vendedores_dashboard_view.html": "Dashboard vendedores",
  "vendedores_view.html": "Vendedores",
  "solicitudes_vendedores_view.html": "Solicitudes de vendedores",
  "liquidaciones_vendedores_view.html": "Liquidaciones",
  "disputas_vendedores_view.html": "Disputas",
  "postventa_dashboard_view.html": "Dashboard postventa",
  "administradores_view.html": "Administradores",
  "empleados_view.html": "Empleados",
  "usuarios_vendedores_view.html": "Usuarios vendedores",
  "clientes_view.html": "Clientes",
  "notificaciones_view.html": "Centro de Notificaciones",
  "bitacora_global_view.html": "Bitácora Global"
};

function obtenerVistaDesdeHash() {
  const hash = window.location.hash.replace("#", "").trim();
  if (!hash) return vistaInicial;
  const posibleVista = hash.endsWith(".html") ? hash : `${hash}.html`;
  const existe = Array.from(menuLinks).some(link => link.dataset.vista === posibleVista);
  return existe ? posibleVista : vistaInicial;
}

function nombreHash(vista) {
  return vista.replace(".html", "");
}

function actualizarMenu(vista, linkActivo = null) {
  let tituloDesdeMenu = "";

  menuLinks.forEach(link => {
    const esActivo = linkActivo ? link === linkActivo : link.dataset.vista === vista;
    link.classList.toggle("active", esActivo);

    if (esActivo) {
      tituloDesdeMenu = link.dataset.titulo || "";
      const grupo = link.closest(".menu-group");
      if (grupo) {
        grupo.classList.add("open");
        const boton = grupo.querySelector(".menu-group-toggle");
        if (boton) boton.setAttribute("aria-expanded", "true");
      }
    }
  });

  if (tituloVista) tituloVista.textContent = tituloDesdeMenu || titulosVistas[vista] || "Panel";
}

function prepararContextoVista(vista) {
  window.TIENDAPRO_TIPO_FORZADO = vista === "importacion_view.html" ? "importacion" : "";
  window.TIENDAPRO_VISTA_ACTIVA = vista;

  delete window.verProducto;
  delete window.editarProducto;
  delete window.eliminarProducto;
  delete window.cambiarPaginaProductos;
  delete window.cambiarPublicacionProducto;
}

function ejecutarScriptsDelContenido(contenedor) {
  const scripts = Array.from(contenedor.querySelectorAll("script"));

  scripts.forEach(scriptOriginal => {
    const nuevoScript = document.createElement("script");

    for (const attr of scriptOriginal.attributes) {
      nuevoScript.setAttribute(attr.name, attr.value);
    }

    nuevoScript.textContent = scriptOriginal.textContent;
    scriptOriginal.remove();
    document.body.appendChild(nuevoScript);

    setTimeout(() => {
      if (nuevoScript.parentNode) nuevoScript.parentNode.removeChild(nuevoScript);
    }, 1000);
  });
}

function cerrarBuscadorGlobalCompleto() {
  const panelBusqueda = document.getElementById("globalResultsPanel");
  const inputBusqueda = document.getElementById("globalSearchInput");
  const contenidoBusqueda = document.getElementById("globalResultsContent");
  const recientesBusqueda = document.getElementById("globalSearchEmpty");
  const tituloBusqueda = document.getElementById("globalResultsTitle");
  const subtituloBusqueda = document.getElementById("globalResultsSubtitle");

  if (panelBusqueda) panelBusqueda.classList.remove("visible");
  if (contenidoBusqueda) contenidoBusqueda.innerHTML = "";
  if (recientesBusqueda) recientesBusqueda.style.display = "none";
  if (tituloBusqueda) tituloBusqueda.textContent = "Buscador global";
  if (subtituloBusqueda) subtituloBusqueda.textContent = "Busca en toda la plataforma desde un solo lugar.";

  if (inputBusqueda) {
    inputBusqueda.value = "";
    inputBusqueda.blur();
  }
}

function esVistaConBuscadorGlobal(vista) {
  return [
    "analiticas_view.html",
    "vendedores_dashboard_view.html",
    "postventa_dashboard_view.html"
  ].includes(vista);
}

function actualizarVisibilidadBuscadorGlobal(vista) {
  const shell = document.getElementById("globalSearchShell");
  if (!shell) return;

  const mostrarBuscador = esVistaConBuscadorGlobal(vista);
  shell.classList.toggle("oculto-buscador-global", !mostrarBuscador);
  document.body.classList.toggle("buscador-global-oculto", !mostrarBuscador);

  if (!mostrarBuscador) {
    cerrarBuscadorGlobalCompleto();
    cerrarPanelHerramientas?.();
  }
}


async function cargarVista(vista = vistaInicial, guardarHistorial = true, linkActivo = null) {
  try {
    if (!contenidoPrincipal) return;

    cerrarBuscadorGlobalCompleto();
    limpiarElementosFlotantesDeVistas();
    prepararContextoVista(vista);
    actualizarVisibilidadBuscadorGlobal(vista);
    actualizarMenu(vista, linkActivo);

    contenidoPrincipal.innerHTML = `
      <div style="padding:28px;color:#cbd5e1;background:rgba(15,23,42,.35);border:1px solid rgba(255,255,255,.08);border-radius:18px;">
        Cargando sección...
      </div>
    `;

    const respuesta = await fetch(vista, { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`No se pudo cargar ${vista}`);

    const html = await respuesta.text();
    contenidoPrincipal.innerHTML = html;
    insertarFechaEnEncabezadoVista();
    ejecutarScriptsDelContenido(contenidoPrincipal);

    if (guardarHistorial) {
      const nuevoHash = `#${nombreHash(vista)}`;
      if (window.location.hash !== nuevoHash) history.pushState({ vista }, "", nuevoHash);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Error cargando vista:", error);
    contenidoPrincipal.innerHTML = `
      <div style="padding:28px;color:#fecaca;background:rgba(127,29,29,.25);border:1px solid rgba(248,113,113,.25);border-radius:18px;">
        No se pudo cargar esta sección.
      </div>
    `;
  }
}

menuLinks.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    cerrarBuscadorGlobalCompleto();
    const vista = link.dataset.vista;
    cargarVista(vista, true, link);
    if (window.innerWidth <= 900) cerrarMenuMobile();
  });
});

menuLinksPendientes.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
  });
});

window.addEventListener("popstate", event => {
  const vista = event.state?.vista || obtenerVistaDesdeHash();
  cargarVista(vista, false);
});

window.cerrarSesion = function () {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.replace("login-Panel.html");
};

if (fechaActual) {
  fechaActual.textContent = obtenerTextoFechaActual();
}

const vistaActual = obtenerVistaDesdeHash();
actualizarVisibilidadBuscadorGlobal(vistaActual);
history.replaceState({ vista: vistaActual }, "", `#${nombreHash(vistaActual)}`);
cargarVista(vistaActual, false);

// =====================================================
// BUSCADOR GLOBAL INTELIGENTE / CONECTADO A BASE DE DATOS
// =====================================================
(function inicializarBuscadorGlobal(){
  const input = document.getElementById('globalSearchInput');
  const btnBuscar = document.getElementById('globalSearchBtn');
  const panel = document.getElementById('globalResultsPanel');
  const closeBtn = document.getElementById('globalCloseResults');
  const title = document.getElementById('globalResultsTitle');
  const subtitle = document.getElementById('globalResultsSubtitle');
  const content = document.getElementById('globalResultsContent');
  const empty = document.getElementById('globalSearchEmpty');
  const recentList = document.getElementById('globalRecentList');
  const filters = Array.from(document.querySelectorAll('.global-filter'));
  const filtersPanel = document.getElementById('globalSearchFilters');
  const btnAbrirFiltros = document.getElementById('openGlobalFilters');
  const btnCerrarFiltros = document.getElementById('closeGlobalFilters');
  const btnAplicarFiltros = document.getElementById('applyGlobalFilters');
  const resumenFiltros = document.getElementById('globalFiltersSummary');

  if (!input || !panel || !content) return;

  const STORAGE_KEY = 'tiendapro_busquedas_recientes';
  const API_BUSQUEDA = 'http://localhost:3000/api/dashboard/busqueda-global';
  let tipoActivo = 'todos';
  let tiposSeleccionados = new Set(['todos']);
  let buscarTimer = null;
  let busquedaActual = 0;
  let recientesVisiblesPorClick = false;

  const tipos = {
    clientes: 'Clientes', vendedores: 'Vendedores', empleados: 'Empleados', administradores: 'Administradores',
    productos: 'Productos', pedidos: 'Pedidos', facturas: 'Facturas', inventario: 'Inventario', importaciones: 'Importaciones',
    devoluciones: 'Devoluciones', disputas: 'Disputas', liquidaciones: 'Liquidaciones', bitacora: 'Bitácora', notificaciones: 'Notificaciones'
  };

  const prefijos = {
    cliente: 'clientes', clientes: 'clientes', vendedor: 'vendedores', vendedores: 'vendedores', empleado: 'empleados', empleados: 'empleados',
    admin: 'administradores', administrador: 'administradores', administradores: 'administradores', producto: 'productos', productos: 'productos',
    pedido: 'pedidos', pedidos: 'pedidos', factura: 'facturas', facturas: 'facturas', inventario: 'inventario', importacion: 'importaciones', importación: 'importaciones',
    devolucion: 'devoluciones', devolución: 'devoluciones', disputa: 'disputas', liquidacion: 'liquidaciones', liquidación: 'liquidaciones',
    bitacora: 'bitacora', bitácora: 'bitacora', notificacion: 'notificaciones', notificación: 'notificaciones'
  };

  function normalizar(texto){
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function leerRecientes(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  function guardarReciente(q){
    const limpio = (q || '').trim();
    if (!limpio) return;
    const recientes = leerRecientes().filter(item => normalizar(item) !== normalizar(limpio));
    recientes.unshift(limpio);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recientes.slice(0, 7)));
    pintarRecientes();
  }

  function pintarRecientes(){
    if (!recentList) return;
    const recientes = leerRecientes();
    recentList.innerHTML = recientes.length
      ? recientes.map(q => `<button type="button" data-recent="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('')
      : `<button type="button" data-recent="PED-000458">PED-000458</button><button type="button" data-recent="Carlos">Carlos</button><button type="button" data-recent="RTX">RTX</button>`;
  }

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function obtenerConsulta(){
    const raw = (input.value || '').trim();
    const match = raw.match(/^([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s*:\s*(.+)$/);
    if (!match) return { termino: raw, tipo: obtenerTiposActivos() };

    const prefijo = normalizar(match[1]);
    const tipoDetectado = prefijos[prefijo] || tipoActivo;
    return { termino: match[2].trim(), tipo: tipoDetectado, prefijo: match[1] };
  }

  function obtenerTokenDashboard(){
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      ''
    ).trim();
  }

  async function fetchConToken(url){
    const tokenActual = obtenerTokenDashboard();

    if (!tokenActual) {
      throw new Error('TOKEN_NO_ENCONTRADO');
    }

    const headersBearer = {
      Authorization: `Bearer ${tokenActual}`,
      'x-auth-token': tokenActual,
      'x-access-token': tokenActual
    };

    let respuesta = await fetch(url, {
      headers: headersBearer,
      cache: 'no-store'
    });

    // Compatibilidad: si tu middleware espera el token sin "Bearer",
    // hacemos un segundo intento automático sin romper el formato anterior.
    if (respuesta.status === 401 || respuesta.status === 403) {
      respuesta = await fetch(url, {
        headers: {
          Authorization: tokenActual,
          'x-auth-token': tokenActual,
          'x-access-token': tokenActual
        },
        cache: 'no-store'
      });
    }

    return respuesta;
  }

  async function consultarBackend(termino, tipo){
    const tiposConsulta = Array.isArray(tipo) ? tipo : [tipo || 'todos'];

    if (tiposConsulta.includes('todos') || tiposConsulta.length === 0) {
      const params = new URLSearchParams({ q: termino, tipo: 'todos' });
      const url = `${API_BUSQUEDA}?${params.toString()}`;
      const respuesta = await fetchConToken(url);

      if (!respuesta.ok) {
        const error = await respuesta.text().catch(() => '');
        throw new Error(error || `Error ${respuesta.status}`);
      }

      const data = await respuesta.json();
      return Array.isArray(data?.resultados) ? data.resultados : [];
    }

    const respuestas = await Promise.all(tiposConsulta.map(async tipoItem => {
      const params = new URLSearchParams({ q: termino, tipo: tipoItem });
      const url = `${API_BUSQUEDA}?${params.toString()}`;
      const respuesta = await fetchConToken(url);

      if (!respuesta.ok) {
        const error = await respuesta.text().catch(() => '');
        throw new Error(error || `Error ${respuesta.status}`);
      }

      const data = await respuesta.json();
      return Array.isArray(data?.resultados) ? data.resultados : [];
    }));

    const mapa = new Map();
    respuestas.flat().forEach(item => {
      const clave = `${item.tipo || 'otros'}::${item.id || item.titulo || JSON.stringify(item)}`;
      if (!mapa.has(clave)) mapa.set(clave, item);
    });
    return [...mapa.values()];
  }

  function obtenerTiposActivos(){
    const activos = [...tiposSeleccionados].filter(Boolean);
    return activos.length ? activos : ['todos'];
  }

  function textoTiposActivos(tipo){
    const activos = Array.isArray(tipo) ? tipo : [tipo || 'todos'];
    if (activos.includes('todos') || activos.length === 0) return 'toda la plataforma';
    return activos.map(t => tipos[t] || t).join(', ');
  }

  function actualizarEstadoFiltros(){
    const activos = obtenerTiposActivos();
    filters.forEach(btn => btn.classList.toggle('active', activos.includes(btn.dataset.tipo)));
    if (resumenFiltros) resumenFiltros.textContent = activos.includes('todos')
      ? 'Buscando en todo'
      : `Buscando en: ${textoTiposActivos(activos)}`;
    if (btnAbrirFiltros) btnAbrirFiltros.classList.toggle('active', !activos.includes('todos'));
  }

  function abrirPanelFiltrosGlobales(){
    filtersPanel?.classList.add('filters-open');
    btnAbrirFiltros?.classList.add('panel-open');
  }

  function cerrarPanelFiltrosGlobales(){
    filtersPanel?.classList.remove('filters-open');
    btnAbrirFiltros?.classList.remove('panel-open');
  }

  async function buscar(opciones = {}){
    const idBusqueda = ++busquedaActual;
    const { termino, tipo, prefijo } = obtenerConsulta();
    const q = normalizar(termino);
    const mostrarRecientes = Boolean(opciones.mostrarRecientes);

    panel.classList.add('visible');
    content.innerHTML = '';

    if (!q) {
      title.textContent = 'Buscador global';
      subtitle.textContent = 'Busca en toda la plataforma desde un solo lugar.';
    cerrarPanelFiltrosGlobales();
      content.innerHTML = '';

      if (mostrarRecientes) {
        panel.classList.add('visible');
        recientesVisiblesPorClick = true;
        empty.style.display = 'block';
        pintarRecientes();
      } else {
        recientesVisiblesPorClick = false;
        empty.style.display = 'none';
        panel.classList.remove('visible');
      }
      return;
    }

    recientesVisiblesPorClick = false;
    guardarReciente(input.value.trim());
    empty.style.display = 'none';
    title.textContent = 'Buscando...';
    subtitle.textContent = prefijo
      ? `Búsqueda específica en ${tipos[tipo] || 'Todos'}: ${termino}`
      : `Resultados para: ${termino} · ${textoTiposActivos(tipo)}`;
    content.innerHTML = `<div class="global-no-results">Consultando la base de datos...</div>`;

    try {
      const lista = await consultarBackend(termino, tipo);
      if (idBusqueda !== busquedaActual) return;
      pintarResultados(lista, termino, tipo, prefijo);
    } catch (error) {
      console.error('Error en búsqueda global:', error);
      if (idBusqueda !== busquedaActual) return;
      title.textContent = 'Buscador global';
      subtitle.textContent = 'No se pudo consultar la base de datos.';
      const mensajeError = error.message === 'TOKEN_NO_ENCONTRADO'
        ? 'No se encontró el token de sesión. Cierra sesión e inicia sesión nuevamente.'
        : `No se pudo conectar con el buscador real. Detalle: ${escapeHtml(error.message)}`;
      content.innerHTML = `<div class="global-no-results">${mensajeError}<br><small>Ruta: <b>${API_BUSQUEDA}</b></small></div>`;
    }
  }

  function pintarResultados(lista, termino, tipo, prefijo){
    window.TIENDAPRO_ULTIMOS_RESULTADOS_BUSCADOR = Array.isArray(lista) ? lista : [];
    title.textContent = `Resultados (${lista.length})`;
    subtitle.textContent = prefijo
      ? `Búsqueda específica en ${tipos[tipo] || 'Todos'}: ${termino}`
      : `Resultados para: ${termino} · ${textoTiposActivos(tipo)}`;

    if (!lista.length) {
      content.innerHTML = `<div class="global-no-results">No encontramos resultados para <b>${escapeHtml(termino)}</b>. Prueba con otro término o cambia el filtro.</div>`;
      return;
    }

    const agrupado = lista.reduce((acc, item) => {
      const grupo = item.tipo || 'otros';
      if (!acc[grupo]) acc[grupo] = [];
      acc[grupo].push(item);
      return acc;
    }, {});

    content.innerHTML = Object.entries(agrupado).map(([tipoGrupo, items]) => `
      <div class="global-group" data-tipo="${escapeHtml(tipoGrupo)}">
        <div class="global-group-head">
          <strong>${tipos[tipoGrupo] || tipoGrupo}</strong>
          <span>${items.length} resultado${items.length === 1 ? '' : 's'}</span>
        </div>
        ${items.map(item => pintarResultado(item)).join('')}
      </div>
    `).join('');
  }

  function pintarResultado(item){
    const destino = item.destino || {};
    // El detalle técnico anterior se reemplazó por el Visor Universal Premium.
    // No mostramos datos internos como destino, acción o ruta al usuario final.

    return `
      <div class="global-result-item" data-id="${escapeHtml(item.id)}" data-tipo="${escapeHtml(item.tipo)}" data-vista="${escapeHtml(destino.vista || '')}" data-accion="${escapeHtml(destino.accion || '')}" data-registro="${escapeHtml(destino.registro || item.id)}">
        <div class="global-result-click-area">
          <div class="global-result-title"><i class="global-result-dot"></i>${escapeHtml(item.titulo)}</div>
          <div class="global-result-meta">${escapeHtml(item.descripcion || '')}<br>${escapeHtml(item.meta || '')}</div>
        </div>
        <div class="global-result-actions">
          <button type="button" class="global-result-action premium" data-action="detalle" data-id="${escapeHtml(item.id)}">👁 Ver detalle</button>
        </div>
        <div class="global-result-detail" id="global-detail-${escapeHtml(item.id)}"></div>
      </div>
    `;
  }

  function cambiarFiltro(tipo){
    const elegido = tipo || 'todos';

    if (elegido === 'todos') {
      tiposSeleccionados = new Set(['todos']);
      tipoActivo = 'todos';
    } else {
      if (tiposSeleccionados.has('todos')) tiposSeleccionados.delete('todos');
      if (tiposSeleccionados.has(elegido)) tiposSeleccionados.delete(elegido);
      else tiposSeleccionados.add(elegido);

      if (tiposSeleccionados.size === 0) tiposSeleccionados.add('todos');
      tipoActivo = tiposSeleccionados.has('todos') ? 'todos' : [...tiposSeleccionados][0];
    }

    actualizarEstadoFiltros();
  }

  function abrirVisual(item){
    const destino = item.destino || {};
    window.TIENDAPRO_DESTINO_PENDIENTE = {
      origen: 'buscador_global',
      modulo: destino.modulo || item.tipo,
      vista: destino.vista || '',
      accion: destino.accion || '',
      registro: destino.registro || item.id,
      idVisible: item.id || '',
      titulo: item.titulo || ''
    };

    try {
      localStorage.setItem('tiendapro_destino_pendiente', JSON.stringify(window.TIENDAPRO_DESTINO_PENDIENTE));
    } catch (error) {
      console.warn('No se pudo guardar destino pendiente:', error);
    }

    if (destino.vista && typeof cargarVista === 'function') {
      cargarVista(destino.vista, true);
    }

    mostrarToast('Navegación preparada', `${destino.vista || 'Vista pendiente'} · ${destino.accion || 'acción pendiente'} · ${destino.registro || item.id}`);
  }

  function mostrarToast(titulo, texto){
    let toast = document.getElementById('globalSearchToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalSearchToast';
      toast.className = 'global-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<strong>${escapeHtml(titulo)}</strong><span>${escapeHtml(texto)}</span>`;
    toast.classList.add('visible');
    clearTimeout(window.globalSearchToastTimer);
    window.globalSearchToastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }

  function buscarConPausa(){
    clearTimeout(buscarTimer);
    buscarTimer = setTimeout(buscar, 260);
  }

  function cerrarPanelBuscadorLocal(opciones = {}) {
    recientesVisiblesPorClick = false;
    panel.classList.remove('visible');
    empty.style.display = 'none';
    content.innerHTML = '';
    title.textContent = 'Buscador global';
    subtitle.textContent = 'Busca en toda la plataforma desde un solo lugar.';
    cerrarPanelFiltrosGlobales();

    if (opciones.limpiarInput) {
      input.value = '';
    }

    if (opciones.quitarFoco !== false) {
      input.blur();
    }
  }

  btnBuscar?.addEventListener('click', () => buscar());
  input.addEventListener('focus', () => {
    panel.classList.add('visible');
    if (!input.value.trim()) buscar({ mostrarRecientes: true });
  });
  input.addEventListener('click', () => {
    panel.classList.add('visible');
    if (!input.value.trim() && !recientesVisiblesPorClick) buscar({ mostrarRecientes: true });
  });
  input.addEventListener('input', () => {
    recientesVisiblesPorClick = false;
    empty.style.display = 'none';
    buscarConPausa();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') buscar();
    if (event.key === 'Escape') cerrarPanelBuscadorLocal({ limpiarInput: false });
  });

  closeBtn?.addEventListener('click', () => cerrarPanelBuscadorLocal({ limpiarInput: false }));

  filters.forEach(btn => btn.addEventListener('click', () => cambiarFiltro(btn.dataset.tipo || 'todos')));

  btnAbrirFiltros?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    filtersPanel?.classList.contains('filters-open') ? cerrarPanelFiltrosGlobales() : abrirPanelFiltrosGlobales();
  });

  btnCerrarFiltros?.addEventListener('click', cerrarPanelFiltrosGlobales);
  btnAplicarFiltros?.addEventListener('click', () => {
    cerrarPanelFiltrosGlobales();
    if (input.value.trim()) buscar();
    else input.focus();
  });

  panel.addEventListener('click', event => {
    const recent = event.target.closest('[data-recent]');
    if (recent) {
      recientesVisiblesPorClick = false;
      empty.style.display = 'none';
      input.value = recent.dataset.recent || '';
      buscar();
      return;
    }

    const quick = event.target.closest('[data-quick]');
    if (quick) { cambiarFiltro(quick.dataset.quick || 'todos'); cerrarPanelFiltrosGlobales(); input.focus(); buscar(); return; }

    const action = event.target.closest('[data-action]');
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      if (action.dataset.action === 'detalle') {
        const itemContainer = action.closest('.global-result-item');
        if (window.abrirVisorUniversalDesdeBuscador && itemContainer) {
          window.abrirVisorUniversalDesdeBuscador(itemContainer);
        }
      }
      return;
    }

    if (event.target.closest('.global-result-detail')) return;

    const itemContainer = event.target.closest('.global-result-item');
    if (!itemContainer) return;

    const id = itemContainer.dataset.id || '';
    const item = {
      id,
      tipo: itemContainer.dataset.tipo || '',
      titulo: itemContainer.querySelector('.global-result-title')?.textContent?.trim() || id,
      destino: {
        vista: itemContainer.dataset.vista || '',
        accion: itemContainer.dataset.accion || '',
        registro: itemContainer.dataset.registro || id
      }
    };

    cerrarPanelBuscadorLocal({ limpiarInput: true });
    abrirVisual(item);
  });

  document.addEventListener('mousedown', event => {
    const clicDentroBuscador = event.target.closest('#globalSearchShell') || event.target.closest('#globalResultsPanel');
    if (!clicDentroBuscador) {
      cerrarPanelBuscadorLocal({ limpiarInput: false });
    }
  });

  window.addEventListener('keydown', event => {
    const target = event.target;
    const escribiendo = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      if (window.abrirCentroComandos) window.abrirCentroComandos();
      else {
        input.focus();
        panel.classList.add('visible');
        if (!input.value.trim()) buscar({ mostrarRecientes: true });
      }
    }

    if (!escribiendo && event.key === '/') {
      event.preventDefault();
      input.focus();
      panel.classList.add('visible');
      if (!input.value.trim()) buscar({ mostrarRecientes: true });
    }
  });

  actualizarEstadoFiltros();
  pintarRecientes();
})();

// =====================================================
// ACCIONES RÁPIDAS / PREPARADAS PARA NAVEGACIÓN REAL
// =====================================================
(function inicializarAccionesRapidas(){
  const shell = document.getElementById('quickActionsShell');
  const grid = document.getElementById('quickActionsGrid');
  const favoritosList = document.getElementById('quickFavoritesList');
  const toggleFavoritos = document.getElementById('quickToggleFavoritos');
  const togglePanel = document.getElementById('quickTogglePanel');

  if (!shell || !grid) return;

  const STORAGE_KEY = 'tiendapro_acciones_favoritas';
  const COLLAPSE_KEY = 'tiendapro_acciones_rapidas_oculto';

  const acciones = {
    nuevoPedido: { titulo:'Nuevo pedido', vista:'pedidos_view.html', accion:'crearPedido', registro:'nuevo', mensaje:'Preparado para abrir Pedidos y crear un pedido.' },
    nuevaFactura: { titulo:'Nueva factura', vista:'facturacion_view.html', accion:'crearFactura', registro:'nueva', mensaje:'Preparado para abrir Facturación.' },
    nuevoProducto: { titulo:'Nuevo producto', vista:'productos_view.html', accion:'crearProducto', registro:'nuevo', mensaje:'Preparado para abrir Productos y crear un producto.' },
    nuevaImportacion: { titulo:'Nueva importación', vista:'importacion_view.html', accion:'crearImportacion', registro:'nueva', mensaje:'Preparado para abrir Importación.' },
    aprobarVendedor: { titulo:'Aprobar vendedor', vista:'solicitudes_vendedores_view.html', accion:'revisarSolicitud', registro:'pendientes', mensaje:'Preparado para abrir Solicitudes de vendedores.' },
    crearEmpleado: { titulo:'Crear empleado', vista:'empleados_view.html', accion:'crearEmpleado', registro:'nuevo', mensaje:'Preparado para abrir Empleados.' },
    crearAdministrador: { titulo:'Crear administrador', vista:'administradores_view.html', accion:'crearAdministrador', registro:'nuevo', mensaje:'Preparado para abrir Administradores.' },
    verInventario: { titulo:'Ver inventario', vista:'inventario_fisico_view.html', accion:'verInventario', registro:'stock-bajo', mensaje:'Preparado para abrir Inventario físico.' },
    nuevaDevolucion: { titulo:'Nueva devolución', vista:'devoluciones_view.html', accion:'crearDevolucion', registro:'nueva', mensaje:'Preparado para abrir Postventa / Casos.' },
    revisarLiquidaciones: { titulo:'Revisar liquidaciones', vista:'liquidaciones_vendedores_view.html', accion:'revisarLiquidaciones', registro:'retenidas', mensaje:'Preparado para abrir Liquidaciones.' },
    resolverDisputas: { titulo:'Resolver disputas', vista:'disputas_vendedores_view.html', accion:'resolverDisputa', registro:'criticas', mensaje:'Preparado para abrir Disputas.' },
    verNotificaciones: { titulo:'Ver notificaciones', vista:'notificaciones_view.html', accion:'abrirCentroNotificaciones', registro:'recientes', mensaje:'Preparado para abrir Centro de Notificaciones.' },
    verBitacora: { titulo:'Bitácora Global', vista:'bitacora_global_view.html', accion:'abrirBitacora', registro:'eventos', mensaje:'Preparado para abrir Bitácora Global.' },
    configuracion: { titulo:'Configuración', vista:'configuracion_view.html', accion:'abrirConfiguracion', registro:'general', mensaje:'Preparado para abrir Configuración.' },
    ultimoPedido: { titulo:'Pedido PED-000458', vista:'pedidos_view.html', accion:'abrirPedido', registro:'PED-000458', mensaje:'Preparado para abrir el último pedido.' },
    ultimoProducto: { titulo:'Producto RTX 4080', vista:'productos_view.html', accion:'abrirProducto', registro:'PRO-0408', mensaje:'Preparado para abrir el último producto editado.' },
    ultimaDisputa: { titulo:'Disputa DIS-000023', vista:'disputas_vendedores_view.html', accion:'abrirDisputa', registro:'DIS-000023', mensaje:'Preparado para abrir la última disputa.' },
    ultimaDevolucion: { titulo:'Devolución DEV-000018', vista:'devoluciones_view.html', accion:'abrirDevolucion', registro:'DEV-000018', mensaje:'Preparado para abrir la última devolución.' }
  };

  function leerFavoritos(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || ['nuevoProducto','nuevoPedido','verInventario','revisarLiquidaciones']; }
    catch { return ['nuevoProducto','nuevoPedido','verInventario','revisarLiquidaciones']; }
  }

  function guardarFavoritos(lista){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista.slice(0, 7)));
  }

  function pintarFavoritos(){
    if (!favoritosList) return;
    const favoritos = leerFavoritos();
    favoritosList.innerHTML = favoritos.map(key => {
      const item = acciones[key];
      if (!item) return '';
      return `<button type="button" class="quick-fav-chip" data-quick-action="${key}">${escapeQuick(item.titulo)}</button>`;
    }).join('') || `<button type="button" class="quick-fav-chip" data-quick-action="nuevoProducto">Nuevo producto</button>`;
  }

  function escapeQuick(value){
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function mostrarToastRapido(titulo, texto){
    let toast = document.getElementById('globalSearchToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalSearchToast';
      toast.className = 'global-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<strong>${escapeQuick(titulo)}</strong><span>${escapeQuick(texto)}</span>`;
    toast.classList.add('visible');
    clearTimeout(window.globalSearchToastTimer);
    window.globalSearchToastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
  }

  function marcarFavorito(key){
    const actuales = leerFavoritos();
    const existe = actuales.includes(key);
    const nuevos = existe ? actuales.filter(item => item !== key) : [key, ...actuales];
    guardarFavoritos(nuevos);
    pintarFavoritos();
    mostrarToastRapido(existe ? 'Favorito eliminado' : 'Favorito agregado', acciones[key]?.titulo || key);
  }

  function ejecutarAccion(key){
    const item = acciones[key];
    if (!item) return;

    window.TIENDAPRO_ACCION_PENDIENTE = {
      origen: 'acciones_rapidas',
      modulo: item.vista.replace('_view.html','').replace('.html',''),
      vista: item.vista,
      accion: item.accion,
      registro: item.registro
    };

    // Navegación visual preparada: abre el módulo correspondiente.
    if (typeof cargarVista === 'function') {
      cargarVista(item.vista, true);
    }

    mostrarToastRapido('Acción rápida preparada', `${item.titulo} · ${item.vista} · ${item.accion} · ${item.registro}`);
  }

  shell.addEventListener('click', event => {
    const actionBtn = event.target.closest('[data-quick-action]');
    if (!actionBtn) return;

    const key = actionBtn.dataset.quickAction;

    if (event.altKey || event.shiftKey) {
      marcarFavorito(key);
      return;
    }

    ejecutarAccion(key);
  });

  toggleFavoritos?.addEventListener('click', () => {
    const favoritos = leerFavoritos();
    const primerVisible = favoritos[0] || 'nuevoProducto';
    marcarFavorito(primerVisible);
  });

  togglePanel?.addEventListener('click', () => {
    cerrarPanelHerramientas();
  });

  shell.classList.remove('quick-collapsed');
  if (togglePanel) togglePanel.textContent = 'Cerrar';

  pintarFavoritos();
})();


// =====================================================
// CENTRO DE EXPORTACIONES / PREPARADO PARA CONEXIÓN REAL
// =====================================================
(function inicializarCentroExportaciones(){
  const shell = document.getElementById('exportCenterShell');
  if (!shell) return;

  const moduleButtons = Array.from(shell.querySelectorAll('[data-export-module]'));
  const formatButtons = Array.from(shell.querySelectorAll('[data-export-format]'));
  const filterButtons = Array.from(shell.querySelectorAll('[data-export-filter]'));
  const fechaDesde = document.getElementById('exportFechaDesde');
  const fechaHasta = document.getElementById('exportFechaHasta');
  const previewIcon = document.getElementById('exportPreviewIcon');
  const previewTitle = document.getElementById('exportPreviewTitle');
  const previewDesc = document.getElementById('exportPreviewDesc');
  const previewFormat = document.getElementById('exportPreviewFormat');
  const previewFilter = document.getElementById('exportPreviewFilter');
  const previewDate = document.getElementById('exportPreviewDate');
  const previewFields = document.getElementById('exportPreviewFields');
  const statusBox = document.getElementById('exportStatusBox');
  const prepareBtn = document.getElementById('exportPrepareBtn');
  const downloadBtn = document.getElementById('exportDownloadBtn');
  const scheduleBtn = document.getElementById('exportScheduleBtn');
  const togglePanel = document.getElementById('exportTogglePanel');

  const COLLAPSE_KEY = 'tiendapro_exportaciones_oculto';

  let estado = {
    modulo: 'pedidos',
    formato: 'pdf',
    filtro: 'todos'
  };

  const modulos = {
    pedidos: {icono:'📦', titulo:'Reporte de Pedidos', desc:'Incluye pedidos por estado, cliente, vendedor, total, fecha y método de pago.', campos:['Código de pedido','Cliente','Vendedor','Estado','Total','Fecha']},
    facturas: {icono:'🧾', titulo:'Reporte de Facturas', desc:'Incluye facturas pagadas, pendientes, anuladas, pedido relacionado y total.', campos:['Número de factura','Pedido','Cliente','Estado','Total','Fecha']},
    productos: {icono:'🛒', titulo:'Reporte de Productos', desc:'Incluye catálogo, precios, categorías, modo de venta y estado de publicación.', campos:['ID producto','Nombre','Categoría','Precio','Estado','Publicación']},
    inventario: {icono:'📦', titulo:'Reporte de Inventario', desc:'Incluye unidades físicas, códigos únicos, proveedor, estado, costo y garantía.', campos:['Código único','Producto','Estado','Proveedor','Costo','Garantía']},
    vendedores: {icono:'🏪', titulo:'Reporte de Vendedores', desc:'Incluye tiendas, estados, ventas, comisiones, documentos y rendimiento.', campos:['ID vendedor','Tienda','Estado','Ventas','Comisión','Fecha alta']},
    clientes: {icono:'👤', titulo:'Reporte de Clientes', desc:'Incluye cuentas, estado, compras, devoluciones y actividad reciente.', campos:['ID cliente','Nombre','Estado','Pedidos','Última compra','Registro']},
    devoluciones: {icono:'🔄', titulo:'Reporte de Devoluciones', desc:'Incluye casos, motivo, resolución, pedido relacionado, producto y estado.', campos:['ID caso','Pedido','Cliente','Motivo','Resolución','Estado']},
    notificaciones: {icono:'🔔', titulo:'Reporte de Notificaciones', desc:'Incluye alertas por prioridad, tipo, estado, destino y fecha.', campos:['ID notificación','Tipo','Prioridad','Estado','Destino','Fecha']},
    bitacora: {icono:'📜', titulo:'Reporte de Bitácora Global', desc:'Incluye eventos, usuario responsable, módulo, acción, nivel y registro afectado.', campos:['ID evento','Usuario','Rol','Módulo','Acción','Fecha']}
  };

  const formatos = { pdf:'PDF', excel:'Excel', csv:'CSV' };
  const filtros = { todos:'Todos', pendientes:'Pendientes', criticos:'Críticos', resueltos:'Resueltos' };

  function escapeExport(value){
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function rangoTexto(){
    const desde = fechaDesde?.value || '';
    const hasta = fechaHasta?.value || '';
    if (desde && hasta) return `${desde} → ${hasta}`;
    if (desde) return `Desde ${desde}`;
    if (hasta) return `Hasta ${hasta}`;
    return 'Rango no definido';
  }

  function actualizarPreview(){
    const info = modulos[estado.modulo] || modulos.pedidos;
    if (previewIcon) previewIcon.textContent = info.icono;
    if (previewTitle) previewTitle.textContent = info.titulo;
    if (previewDesc) previewDesc.textContent = info.desc;
    if (previewFormat) previewFormat.textContent = formatos[estado.formato] || 'PDF';
    if (previewFilter) previewFilter.textContent = filtros[estado.filtro] || 'Todos';
    if (previewDate) previewDate.textContent = rangoTexto();
    if (previewFields) {
      previewFields.innerHTML = info.campos.map(campo => `
        <tr><td>${escapeExport(campo)}</td><td>Sí</td><td>Preparado</td></tr>
      `).join('');
    }
  }

  function marcarActivo(botones, atributo, valor){
    botones.forEach(btn => btn.classList.toggle('active', btn.dataset[atributo] === valor));
  }

  function toastExport(titulo, texto){
    let toast = document.getElementById('globalSearchToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalSearchToast';
      toast.className = 'global-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<strong>${escapeExport(titulo)}</strong><span>${escapeExport(texto)}</span>`;
    toast.classList.add('visible');
    clearTimeout(window.globalSearchToastTimer);
    window.globalSearchToastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
  }

  function estadoTexto(texto){
    if (!statusBox) return;
    statusBox.innerHTML = `<strong>Estado</strong><span>${escapeExport(texto)}</span>`;
  }

  moduleButtons.forEach(btn => btn.addEventListener('click', () => {
    estado.modulo = btn.dataset.exportModule || 'pedidos';
    marcarActivo(moduleButtons, 'exportModule', estado.modulo);
    actualizarPreview();
  }));

  formatButtons.forEach(btn => btn.addEventListener('click', () => {
    estado.formato = btn.dataset.exportFormat || 'pdf';
    marcarActivo(formatButtons, 'exportFormat', estado.formato);
    actualizarPreview();
  }));

  filterButtons.forEach(btn => btn.addEventListener('click', () => {
    estado.filtro = btn.dataset.exportFilter || 'todos';
    marcarActivo(filterButtons, 'exportFilter', estado.filtro);
    actualizarPreview();
  }));

  fechaDesde?.addEventListener('change', actualizarPreview);
  fechaHasta?.addEventListener('change', actualizarPreview);

  prepareBtn?.addEventListener('click', () => {
    const info = modulos[estado.modulo] || modulos.pedidos;
    window.TIENDAPRO_EXPORTACION_PENDIENTE = {
      modulo: estado.modulo,
      formato: estado.formato,
      filtro: estado.filtro,
      desde: fechaDesde?.value || null,
      hasta: fechaHasta?.value || null,
      estado: 'preparada_visual'
    };
    estadoTexto(`${info.titulo} preparado en formato ${formatos[estado.formato]} · ${filtros[estado.filtro]} · ${rangoTexto()}`);
    toastExport('Exportación preparada', `${info.titulo} · ${formatos[estado.formato]} · ${rangoTexto()}`);
  });

  downloadBtn?.addEventListener('click', () => {
    const info = modulos[estado.modulo] || modulos.pedidos;
    toastExport('Descarga visual preparada', `${info.titulo} se conectará luego con la base de datos para descargar ${formatos[estado.formato]}.`);
    estadoTexto('La descarga real quedará conectada en la fase de base de datos y lógica.');
  });

  scheduleBtn?.addEventListener('click', () => {
    toastExport('Programación preparada', 'Más adelante permitirá enviar reportes por correo o programarlos diariamente/semanalmente.');
    estadoTexto('Programación visual lista para automatizaciones futuras.');
  });

  togglePanel?.addEventListener('click', () => {
    cerrarPanelHerramientas();
  });

  shell.classList.remove('export-collapsed');
  if (togglePanel) togglePanel.textContent = 'Cerrar';

  actualizarPreview();
})();

// =====================================================
// PANELES FLOTANTES DE HERRAMIENTAS GLOBALES
// =====================================================
function abrirPanelHerramientas(tipo) {
  const paneles = {
    quick: document.getElementById('quickActionsShell'),
    export: document.getElementById('exportCenterShell'),
    notifications: document.getElementById('notificationsDrawerShell'),
    history: document.getElementById('historyDrawerShell'),
    realtime: document.getElementById('realtimeDrawerShell'),
    help: document.getElementById('helpDrawerShell')
  };
  const overlay = document.getElementById('toolsDrawerOverlay');

  Object.values(paneles).forEach(panel => panel?.classList.remove('drawer-open', 'quick-collapsed', 'export-collapsed'));

  paneles[tipo]?.classList.add('drawer-open');
  overlay?.classList.add('visible');
  document.body.classList.add('tools-drawer-open');
}

function cerrarPanelHerramientas() {
  ['quickActionsShell','exportCenterShell','notificationsDrawerShell','historyDrawerShell','realtimeDrawerShell','helpDrawerShell']
    .forEach(id => document.getElementById(id)?.classList.remove('drawer-open'));
  document.getElementById('toolsDrawerOverlay')?.classList.remove('visible');
  document.body.classList.remove('tools-drawer-open');
}

(function inicializarPanelesHerramientas(){
  const btnQuick = document.getElementById('openQuickDrawer');
  const btnExport = document.getElementById('openExportDrawer');
  const btnNotifications = document.getElementById('openNotificationsDrawer');
  const btnHistory = document.getElementById('openHistoryDrawer');
  const btnRealtime = document.getElementById('openRealtimeDrawer');
  const btnHelp = document.getElementById('openHelpDrawer');
  const overlay = document.getElementById('toolsDrawerOverlay');

  btnQuick?.addEventListener('click', () => abrirPanelHerramientas('quick'));
  btnExport?.addEventListener('click', () => abrirPanelHerramientas('export'));
  btnNotifications?.addEventListener('click', () => abrirPanelHerramientas('notifications'));
  btnHistory?.addEventListener('click', () => abrirPanelHerramientas('history'));
  btnRealtime?.addEventListener('click', () => abrirPanelHerramientas('realtime'));
  btnHelp?.addEventListener('click', () => abrirPanelHerramientas('help'));
  overlay?.addEventListener('click', cerrarPanelHerramientas);

  document.querySelectorAll('[data-close-tools]').forEach(btn => btn.addEventListener('click', cerrarPanelHerramientas));

  document.querySelectorAll('[data-tool-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const vista = btn.dataset.toolAction;
      if (vista && typeof cargarVista === 'function') {
        cerrarPanelHerramientas();
        cargarVista(vista, true);
      }
    });
  });



  const realtimeFilters = Array.from(document.querySelectorAll('[data-realtime-filter]'));
  const realtimeItems = Array.from(document.querySelectorAll('[data-realtime-type]'));

  realtimeFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.realtimeFilter || 'todos';
      realtimeFilters.forEach(item => item.classList.toggle('active', item === btn));
      realtimeItems.forEach(item => {
        const mostrar = tipo === 'todos' || item.dataset.realtimeType === tipo;
        item.style.display = mostrar ? '' : 'none';
      });
    });
  });

  realtimeItems.forEach(item => {
    item.addEventListener('click', () => {
      window.TIENDAPRO_EVENTO_TIEMPO_REAL = {
        origen: 'actividad_tiempo_real',
        modulo: item.dataset.module || '',
        vista: item.dataset.toolAction || '',
        accion: item.dataset.actionName || '',
        registro: item.dataset.record || '',
        prioridad: item.classList.contains('danger') ? 'alta' : item.classList.contains('warn') ? 'media' : 'normal'
      };
    });
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cerrarPanelHerramientas();
  });
})();


// =====================================================
// VISOR UNIVERSAL PREMIUM + CENTRO DE COMANDOS
// =====================================================
(function inicializarDashboardV2Premium(){
  let viewerOverlay = document.getElementById('universalViewerOverlay');
  let viewerShell = document.getElementById('universalViewerShell');
  let viewerTitle = document.getElementById('universalViewerTitle');
  let viewerTipo = document.getElementById('universalViewerTipo');
  let viewerSubtitle = document.getElementById('universalViewerSubtitle');
  let viewerBody = document.getElementById('universalViewerBody');
  let viewerTabs = document.getElementById('universalViewerTabs');
  let viewerClose = document.getElementById('universalViewerClose');
  let viewerCopy = document.getElementById('universalViewerCopy');
  let viewerOpenModule = document.getElementById('universalViewerOpenModule');

  function asegurarVisorUniversalPremiumDOM(){
    if (!document.getElementById('universalViewerShell')) {
      document.body.insertAdjacentHTML('beforeend', `
        <section class="universal-viewer-overlay" id="universalViewerOverlay" aria-hidden="true"></section>
        <section class="universal-viewer-shell" id="universalViewerShell" aria-modal="true" role="dialog" aria-labelledby="universalViewerTitle">
          <div class="universal-viewer-head">
            <div class="universal-viewer-titlebox">
              <span class="universal-viewer-eyebrow" id="universalViewerTipo">Registro</span>
              <h2 id="universalViewerTitle">Visor Universal Premium</h2>
              <p id="universalViewerSubtitle">Resumen del registro seleccionado.</p>
            </div>
            <div class="universal-viewer-actions">
              <button type="button" class="universal-viewer-btn" id="universalViewerCopy">Copiar código</button>
              <button type="button" class="universal-viewer-btn primary" id="universalViewerOpenModule">Abrir módulo</button>
              <button type="button" class="universal-viewer-close" id="universalViewerClose" aria-label="Cerrar visor">×</button>
            </div>
          </div>
          <div class="universal-viewer-tabs" id="universalViewerTabs">
            <button type="button" class="active" data-tab="resumen">Resumen</button>
            <button type="button" data-tab="historial">Historial</button>
            <button type="button" data-tab="relacionados">Relacionados</button>
            <button type="button" data-tab="archivos">Archivos</button>
          </div>
          <div class="universal-viewer-body" id="universalViewerBody"></div>
        </section>`);
    }

    viewerOverlay = document.getElementById('universalViewerOverlay');
    viewerShell = document.getElementById('universalViewerShell');
    viewerTitle = document.getElementById('universalViewerTitle');
    viewerTipo = document.getElementById('universalViewerTipo');
    viewerSubtitle = document.getElementById('universalViewerSubtitle');
    viewerBody = document.getElementById('universalViewerBody');
    viewerTabs = document.getElementById('universalViewerTabs');
    viewerClose = document.getElementById('universalViewerClose');
    viewerCopy = document.getElementById('universalViewerCopy');
    viewerOpenModule = document.getElementById('universalViewerOpenModule');
  }

  asegurarVisorUniversalPremiumDOM();

  const commandOverlay = document.getElementById('commandCenterOverlay');
  const commandShell = document.getElementById('commandCenterShell');
  const commandInput = document.getElementById('commandCenterInput');
  const commandList = document.getElementById('commandCenterList');
  const commandClose = document.getElementById('commandCenterClose');
  const openCommandBtn = document.getElementById('openCommandCenter');

  let registroActual = null;
  let comandoActivo = 0;

  const nombres = {
    pedidos: 'Pedido', pedidos_mi_tienda: 'Pedidos Mi Tienda', facturas: 'Factura', productos: 'Producto', inventario: 'Inventario', importaciones: 'Importación',
    devoluciones: 'Devolución', clientes: 'Cliente', vendedores: 'Vendedor', empleados: 'Empleado', administradores: 'Administrador',
    disputas: 'Disputa', liquidaciones: 'Liquidación', bitacora: 'Bitácora', notificaciones: 'Notificación'
  };

  const iconos = {
    pedidos: '📦', pedidos_mi_tienda: '🏪', facturas: '🧾', productos: '🛒', inventario: '📦', importaciones: '📥', devoluciones: '🔄',
    clientes: '👤', vendedores: '🏪', empleados: '👨‍💼', administradores: '👑', disputas: '⚖️', liquidaciones: '💰',
    bitacora: '📜', notificaciones: '🔔'
  };

  function escapeDashV2(value){
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function crearRegistroDesdeElemento(elemento){
    const titulo = elemento.querySelector('.global-result-title')?.textContent?.trim() || elemento.dataset.registro || elemento.dataset.id || 'Registro';
    const meta = elemento.querySelector('.global-result-meta')?.innerText?.trim() || '';
    const tipo = elemento.dataset.tipo || 'registro';
    return {
      id: elemento.dataset.id || elemento.dataset.registro || '',
      tipo,
      titulo,
      meta,
      vista: elemento.dataset.vista || '',
      accion: elemento.dataset.accion || '',
      registro: elemento.dataset.registro || elemento.dataset.id || titulo
    };
  }

  function cardsResumen(reg){
    const tipo = reg.tipo;
    const tituloLimpio = (reg.titulo || '').replace(/^\s*[📦🧾🛒📥🔄👤🏪👨‍💼👑⚖️💰📜🔔🔎]+\s*/, '');
    const codigo = reg.registro || reg.id || tituloLimpio || 'Registro';
    const meta = reg.meta || '';
    const cliente = extraerDato(meta, 'Cliente') || extraerNombreRelacionado(meta) || 'Carlos Pérez';
    const estado = normalizarEstado(extraerEstado(meta)) || (tipo === 'devoluciones' ? 'Pendiente' : tipo === 'facturas' ? 'Pagada' : 'Entregado / Pagado');
    const total = extraerMonto(meta) || '$649.98';

    const datosPorTipo = {
      pedidos: [
        ['Cliente', cliente],
        ['Estado', estado],
        ['Total', total],
        ['Método de pago', detectarPago(meta) || 'Tarjeta'],
        ['Producto', extraerProducto(meta) || 'XPG Cabinet TOP'],
        ['Inventario', extraerCodigo(meta, 'XPG') || 'Unidad XPG-0001 vendida']
      ],
      facturas: [
        ['Factura', codigo],
        ['Estado', estado],
        ['Pedido', extraerCodigo(meta, 'PED') || 'PED-2026-66601938'],
        ['Cliente', cliente],
        ['Total', total],
        ['Documento', `${codigo}.pdf`]
      ],
      devoluciones: [
        ['Devolución', codigo],
        ['Estado', estado || 'Pendiente'],
        ['Pedido', extraerCodigo(meta, 'PED') || 'PED-2026-66601938'],
        ['Producto', extraerProducto(meta) || 'XPG Cabinet TOP'],
        ['Motivo', 'Solicitud del cliente'],
        ['Resolución', 'Pendiente de revisión']
      ],
      productos: [
        ['Producto', tituloLimpio || codigo],
        ['Código / SKU', codigo],
        ['Precio', total],
        ['Stock', 'Inventario físico relacionado'],
        ['Estado', estado || 'Publicado'],
        ['Proveedor', 'Proveedor relacionado']
      ],
      inventario: [
        ['Unidad física', codigo],
        ['Producto', tituloLimpio || 'Producto relacionado'],
        ['Estado', estado || 'Disponible'],
        ['Código único', codigo],
        ['Garantía', 'Según unidad'],
        ['Pedido', extraerCodigo(meta, 'PED') || 'Sin pedido relacionado']
      ],
      clientes: [
        ['Cliente', tituloLimpio || cliente],
        ['Correo', 'Correo registrado'],
        ['Teléfono', 'Teléfono registrado'],
        ['Pedidos', 'Historial de compras'],
        ['Facturas', 'Documentos relacionados'],
        ['Devoluciones', 'Casos relacionados']
      ],
      vendedores: [
        ['Vendedor', tituloLimpio || codigo],
        ['Tienda', 'Tienda relacionada'],
        ['Estado', estado || 'Activo'],
        ['Productos', 'Catálogo publicado'],
        ['Ventas', 'Ventas acumuladas'],
        ['Liquidaciones', 'Pagos pendientes']
      ],
      empleados: [
        ['Empleado', tituloLimpio || codigo],
        ['Rol', 'Empleado'],
        ['Estado', estado || 'Activo'],
        ['Correo', 'Correo registrado'],
        ['Permisos', 'Permisos asignados'],
        ['Actividad', 'Actividad reciente']
      ],
      administradores: [
        ['Administrador', tituloLimpio || codigo],
        ['Rol', 'Administrador'],
        ['Estado', estado || 'Activo'],
        ['Correo', 'Correo registrado'],
        ['Permisos', 'Acceso administrativo'],
        ['Actividad', 'Actividad reciente']
      ]
    };

    const datos = datosPorTipo[tipo] || [
      ['Registro', codigo],
      ['Módulo', nombres[tipo] || tipo || 'General'],
      ['Estado', estado || 'Activo'],
      ['Descripción', meta || 'Información del registro seleccionado'],
      ['Destino', reg.vista || 'Módulo relacionado'],
      ['Acción', reg.accion || 'Abrir registro']
    ];

    return datos.map(([label, value]) => `
      <div class="universal-info-card">
        <span>${escapeDashV2(label)}</span>
        <strong>${escapeDashV2(value)}</strong>
      </div>
    `).join('');
  }

  function extraerNombreRelacionado(texto){
    const t = String(texto || '');
    const m = t.match(/Cliente\s+([^·\n]+)/i);
    return m ? `Cliente ${m[1].trim()}` : '';
  }

  function detectarPago(texto){
    const t = String(texto || '').toLowerCase();
    if (t.includes('tarjeta')) return 'Tarjeta';
    if (t.includes('efectivo')) return 'Efectivo';
    if (t.includes('transferencia')) return 'Transferencia';
    return '';
  }

  function extraerProducto(texto){
    const t = String(texto || '');
    const partes = t.split('·').map(p => p.trim()).filter(Boolean);
    const producto = partes.find(p => !/cliente|estado|total|tarjeta|pedido|factura|devuelto|pagad|pendiente/i.test(p));
    return producto || '';
  }

  function normalizarEstado(estado){
    if (!estado) return '';
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  }

  function extraerMonto(texto){
    return (String(texto||'').match(/\$\s?[0-9,.]+/) || [])[0] || '';
  }

  function extraerCodigo(texto, prefijo){
    const prefijoSeguro = String(prefijo || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patron = new RegExp(`\\b${prefijoSeguro}[-_ ][0-9][0-9A-Za-z-]*`, 'i');
    return (String(texto || '').match(patron) || [])[0] || '';
  }

  function extraerDato(texto, palabra){
    const limpio = String(texto||'');
    const partes = limpio.split('·').map(x => x.trim());
    return partes.find(p => p.toLowerCase().includes(palabra.toLowerCase())) || '';
  }

  function extraerEstado(texto){
    const t = String(texto||'').toLowerCase();
    const estados = ['pendiente','pagada','pagado','anulada','entregado','entregando','devuelto','disponible','vendido','reservado','en revisión','resuelto','crítico','critico'];
    return estados.find(e => t.includes(e)) || '';
  }

  function renderViewer(tab = 'resumen'){
    if (!registroActual || !viewerBody) return;
    const reg = registroActual;

    viewerTabs?.querySelectorAll('button').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));

    if (tab === 'resumen') {
      viewerBody.innerHTML = `
        <div class="universal-summary-grid">
          ${cardsResumen(reg)}
        </div>
        <div class="universal-inline-actions demo-inline-actions">
          <button type="button" class="universal-viewer-btn primary" id="universalInlineOpen">Abrir módulo</button>
          <button type="button" class="universal-viewer-btn" id="universalInlineCopy">Copiar código</button>
        </div>
      `;
      return;
    }

    if (tab === 'historial') {
      const eventos = crearEventosHistorial(reg);
      viewerBody.innerHTML = `
        <div class="universal-timeline demo-timeline">
          ${eventos.map(item => `<div class="universal-time-item"><div><strong>${escapeDashV2(item[0])}</strong><span>${escapeDashV2(item[1])}</span></div><b class="${item[3] || ''}">${escapeDashV2(item[2])}</b></div>`).join('')}
        </div>
      `;
      return;
    }

    if (tab === 'relacionados') {
      const relacionados = crearRelacionadosPorTipo(reg);
      viewerBody.innerHTML = `
        <div class="universal-related-list demo-related-list">
          ${relacionados.map(item => crearRelacionado(item.titulo, item.subtitulo, item.tipo, item.vista, item.accion, item.registro, item.scope)).join('')}
        </div>
      `;
      return;
    }

    if (tab === 'archivos') {
      const archivos = crearArchivosPorTipo(reg);
      viewerBody.innerHTML = `
        <div class="universal-files-list demo-files-list">
          ${archivos.map(item => crearArchivo(item.titulo, item.subtitulo, item.estado)).join('')}
        </div>
      `;
    }
  }

  function crearEventosHistorial(reg){
    if (reg.tipo === 'pedidos') {
      return [
        ['Pedido creado', '03 Jul 2026 · Administrador', 'OK', 'ok'],
        ['Pago recibido', '03 Jul 2026 · Tarjeta aprobada', 'OK', 'ok'],
        ['Entregado', '06 Jul 2026 · Logística', 'OK', 'ok'],
        ['Devolución solicitada', '08 Jul 2026 · Cliente', 'Revisión', 'warn']
      ];
    }
    if (reg.tipo === 'facturas') {
      return [
        ['Factura creada', 'Generada desde el pedido relacionado', 'OK', 'ok'],
        ['Pago registrado', 'Pago confirmado por el sistema', 'OK', 'ok'],
        ['Documento preparado', 'PDF listo para consultar', 'OK', 'ok']
      ];
    }
    if (reg.tipo === 'devoluciones') {
      return [
        ['Caso abierto', 'Solicitud registrada por el cliente', 'OK', 'ok'],
        ['Revisión pendiente', 'Postventa debe revisar el producto', 'Revisión', 'warn'],
        ['Resolución pendiente', 'Aún no se aplicó una resolución final', 'Pendiente', 'warn']
      ];
    }
    return [
      ['Registro encontrado', 'El buscador global localizó este registro.', 'OK', 'ok'],
      ['Consulta del administrador', 'Se abrió el visor para revisión rápida.', 'OK', 'ok'],
      ['Acción disponible', `Acción sugerida: ${reg.accion || 'abrirRegistro'}.`, 'Sistema', '']
    ];
  }


  function textoRegistroCompleto(reg){
    if (!reg) return '';
    return [reg.id, reg.tipo, reg.titulo, reg.meta, reg.vista, reg.accion, reg.registro].filter(Boolean).join(' · ');
  }

  function limpiarTituloRelacionado(titulo){
    return String(titulo || '').replace(/^\s*[📦🧾🛒📥🔄↩️👤🏪👨‍💼👑⚖️💰📜🔔🔎]+\s*/, '').trim();
  }

  function vistaPorTipoRelacionado(tipo){
    const mapa = {
      pedidos:'pedidos_view.html', pedidos_mi_tienda:'pedidos_view.html', facturas:'facturacion_view.html', devoluciones:'devoluciones_view.html',
      clientes:'clientes_view.html', vendedores:'vendedores_view.html', productos:'productos_view.html', inventario:'inventario_fisico_view.html',
      empleados:'empleados_view.html', administradores:'administradores_view.html', importaciones:'importacion_view.html',
      disputas:'disputas_vendedores_view.html', liquidaciones:'liquidaciones_vendedores_view.html', bitacora:'bitacora_global_view.html', notificaciones:'notificaciones_view.html'
    };
    return mapa[tipo] || '';
  }

  function iconoRelacionado(tipo){
    return iconos[tipo] || '🔎';
  }

  function obtenerRegistroVisibleRelacionado(item, tipo){
    const destino = item?.destino || {};
    const visible = String(item?.id || '').trim();
    const titulo = String(item?.titulo || '').trim();
    const meta = String(item?.meta || '').trim();
    const descripcion = String(item?.descripcion || '').trim();
    const texto = [visible, titulo, descripcion, meta].filter(Boolean).join(' · ');

    if (tipo === 'pedidos') return extraerCodigo(texto, 'PED') || visible || destino.registro || titulo;
    if (tipo === 'facturas') return extraerCodigo(texto, 'FAC') || visible || destino.registro || titulo;
    if (tipo === 'devoluciones') return extraerCodigo(texto, 'DEV') || visible || destino.registro || titulo;

    const cliente = texto.match(/Cliente\s+([^·\n-]+)/i);
    if (tipo === 'clientes' && cliente?.[1]) return cliente[1].trim();

    return visible || destino.registro || titulo;
  }

  function crearItemRelacionadoDesdeResultado(item){
    const destino = item.destino || {};
    const tipo = item.tipo || destino.modulo || 'registro';
    const registro = obtenerRegistroVisibleRelacionado(item, tipo);
    return {
      titulo: `${iconoRelacionado(tipo)} ${limpiarTituloRelacionado(item.titulo || registro)}`,
      subtitulo: item.descripcion || item.meta || '',
      tipo,
      vista: destino.vista || vistaPorTipoRelacionado(tipo),
      accion: 'filtrarRegistro',
      registro
    };
  }

  function extraerClienteDesdeRegistro(reg){
    const texto = textoRegistroCompleto(reg);
    const matchCliente = texto.match(/Cliente\s+([^·\n-]+)/i);
    if (matchCliente && matchCliente[1]) return `Cliente ${matchCliente[1].trim()}`.replace(/\s+/g, ' ');
    return '';
  }

  function relacionadosDesdeUltimosResultados(reg){
    const lista = Array.isArray(window.TIENDAPRO_ULTIMOS_RESULTADOS_BUSCADOR) ? window.TIENDAPRO_ULTIMOS_RESULTADOS_BUSCADOR : [];
    const textoBase = normalizarDashV2(textoRegistroCompleto(reg));
    const codigoPedido = extraerCodigo(textoRegistroCompleto(reg), 'PED') || (reg.tipo === 'pedidos' ? (reg.registro || reg.id || '') : '');
    const codigoFactura = extraerCodigo(textoRegistroCompleto(reg), 'FAC') || (reg.tipo === 'facturas' ? (reg.registro || reg.id || '') : '');
    const codigoDev = extraerCodigo(textoRegistroCompleto(reg), 'DEV') || (reg.tipo === 'devoluciones' ? (reg.registro || reg.id || '') : '');
    const claves = [codigoPedido, codigoFactura, codigoDev, reg.registro, reg.id].filter(Boolean).map(normalizarDashV2);

    return lista.filter(item => {
      if (!item || item.tipo === reg.tipo) return false;
      const textoItem = normalizarDashV2([item.id, item.titulo, item.descripcion, item.meta, item.destino?.registro].filter(Boolean).join(' · '));
      return claves.some(clave => clave && textoItem.includes(clave)) || (textoBase && textoItem && textoBase.includes(textoItem));
    }).map(crearItemRelacionadoDesdeResultado);
  }

  function quitarDuplicadosRelacionados(items){
    const vistos = new Set();
    return items.filter(item => {
      const clave = `${item.tipo || ''}::${item.scope || ''}::${item.registro || item.titulo || ''}`;
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return Boolean(item.registro || item.titulo);
    });
  }

  function buscarResultadoRelacionado(tipoBuscado, codigoPrincipal){
    const lista = Array.isArray(window.TIENDAPRO_ULTIMOS_RESULTADOS_BUSCADOR) ? window.TIENDAPRO_ULTIMOS_RESULTADOS_BUSCADOR : [];
    const clave = normalizarDashV2(codigoPrincipal || '');
    if (!clave) return null;

    return lista.find(item => {
      if (!item || item.tipo !== tipoBuscado) return false;
      const textoItem = normalizarDashV2([
        item.id,
        item.titulo,
        item.descripcion,
        item.meta,
        item.destino?.registro
      ].filter(Boolean).join(' · '));
      return textoItem.includes(clave);
    }) || null;
  }

  function crearRelacionadoBase({ titulo, subtitulo, tipo, vista, registro, scope = '' }){
    return {
      titulo,
      subtitulo,
      tipo,
      vista: vista || vistaPorTipoRelacionado(tipo),
      accion: 'filtrarRegistro',
      registro,
      scope
    };
  }

  function crearRelacionadoDesdeResultadoConTitulo(item, titulo, subtitulo, tipoForzado = '', scope = ''){
    const destino = item?.destino || {};
    const tipo = tipoForzado || item?.tipo || destino.modulo || 'registro';
    const registro = obtenerRegistroVisibleRelacionado(item, tipo === 'pedidos_mi_tienda' ? 'pedidos' : tipo);
    return crearRelacionadoBase({
      titulo,
      subtitulo: subtitulo || item?.descripcion || item?.meta || '',
      tipo,
      vista: tipo === 'pedidos_mi_tienda' ? 'pedidos_view.html' : (destino.vista || vistaPorTipoRelacionado(tipo)),
      registro,
      scope
    });
  }

  function extraerCodigosRelacionados(reg){
    const texto = textoRegistroCompleto(reg);
    const pedido = extraerCodigo(texto, 'PED') || (reg.tipo === 'pedidos' ? extraerCodigo(reg.id || reg.titulo || '', 'PED') : '');
    const factura = extraerCodigo(texto, 'FAC') || (reg.tipo === 'facturas' ? extraerCodigo(reg.id || reg.titulo || '', 'FAC') : '');
    const devolucion = extraerCodigo(texto, 'DEV') || (reg.tipo === 'devoluciones' ? extraerCodigo(reg.id || reg.titulo || '', 'DEV') : '');
    const clienteTexto = extraerClienteDesdeRegistro(reg).replace(/^Cliente\s+/i, '').trim();
    return { pedido, factura, devolucion, cliente: clienteTexto };
  }

  function agregarSiExiste(lista, item){
    if (!item || !item.registro) return;
    lista.push(item);
  }

  function extraerClienteDesdeTextoRelacionado(texto){
    const match = String(texto || '').match(/Cliente\s+([^·\n-]+)/i);
    const cliente = match?.[1]?.trim().replace(/\s+/g, ' ') || '';
    if (!cliente || /^(sin cliente|cliente no registrado|no registrado|n\/?a)$/i.test(cliente)) return '';
    return cliente;
  }

  function clienteDesdeResultadoRelacionado(item){
    if (!item) return '';
    const texto = [item.titulo, item.descripcion, item.meta, item.id, item.destino?.registro].filter(Boolean).join(' · ');
    return extraerClienteDesdeTextoRelacionado(texto);
  }

  function resolverClienteRelacionado(clienteBase, ...resultados){
    const candidatos = [
      clienteBase,
      extraerClienteDesdeTextoRelacionado(textoRegistroCompleto(registroActual || {})),
      ...resultados.map(clienteDesdeResultadoRelacionado)
    ].map(v => String(v || '').replace(/^Cliente\s+/i, '').trim()).filter(Boolean);

    return candidatos.find(v => !/^(sin cliente|cliente no registrado|no registrado|n\/?a)$/i.test(v)) || '';
  }

  function crearRelacionadosPorTipo(reg){
    const relacionados = [];
    const { pedido, cliente } = extraerCodigosRelacionados(reg);

    const pedidoResultado = pedido ? buscarResultadoRelacionado('pedidos', pedido) : null;
    const facturaResultado = pedido ? buscarResultadoRelacionado('facturas', pedido) : null;
    const devolucionResultado = pedido ? buscarResultadoRelacionado('devoluciones', pedido) : null;
    const clienteRelacionado = resolverClienteRelacionado(cliente, pedidoResultado, facturaResultado, devolucionResultado);

    if (reg.tipo === 'pedidos') {
      if (facturaResultado) {
        agregarSiExiste(relacionados, crearRelacionadoDesdeResultadoConTitulo(
          facturaResultado,
          `🧾 Factura ${obtenerRegistroVisibleRelacionado(facturaResultado, 'facturas')}`,
          'Factura relacionada con el pedido',
          'facturas'
        ));
      }

      if (devolucionResultado) {
        agregarSiExiste(relacionados, crearRelacionadoDesdeResultadoConTitulo(
          devolucionResultado,
          `🔄 Devolución ${obtenerRegistroVisibleRelacionado(devolucionResultado, 'devoluciones')}`,
          'Devolución relacionada con el pedido',
          'devoluciones'
        ));
      }

      if (clienteRelacionado) {
        agregarSiExiste(relacionados, crearRelacionadoBase({
          titulo: `👤 Cliente ${clienteRelacionado}`,
          subtitulo: 'Cliente relacionado con el pedido',
          tipo: 'clientes',
          vista: 'clientes_view.html',
          registro: clienteRelacionado
        }));
      }

      if (pedido) {
        agregarSiExiste(relacionados, crearRelacionadoBase({
          titulo: `🏪 Pedidos Mi Tienda ${pedido}`,
          subtitulo: 'Buscar este pedido dentro de Mi Tienda',
          tipo: 'pedidos_mi_tienda',
          vista: 'pedidos_view.html',
          registro: pedido,
          scope: 'mi_tienda'
        }));
      }
    }

    if (reg.tipo === 'facturas') {
      if (pedido) {
        agregarSiExiste(relacionados, crearRelacionadoBase({
          titulo: `📦 Pedido ${pedido}`,
          subtitulo: 'Pedido global relacionado con la factura',
          tipo: 'pedidos',
          vista: 'pedidos_view.html',
          registro: pedido
        }));
      }

      if (devolucionResultado) {
        agregarSiExiste(relacionados, crearRelacionadoDesdeResultadoConTitulo(
          devolucionResultado,
          `🔄 Devolución ${obtenerRegistroVisibleRelacionado(devolucionResultado, 'devoluciones')}`,
          'Devolución relacionada con la factura',
          'devoluciones'
        ));
      }

      if (pedido) {
        agregarSiExiste(relacionados, crearRelacionadoBase({
          titulo: `🏪 Pedidos Mi Tienda ${pedido}`,
          subtitulo: 'Buscar este pedido dentro de Mi Tienda',
          tipo: 'pedidos_mi_tienda',
          vista: 'pedidos_view.html',
          registro: pedido,
          scope: 'mi_tienda'
        }));
      }

      if (clienteRelacionado) {
        agregarSiExiste(relacionados, crearRelacionadoBase({
          titulo: `👤 Cliente ${clienteRelacionado}`,
          subtitulo: 'Cliente facturado',
          tipo: 'clientes',
          vista: 'clientes_view.html',
          registro: clienteRelacionado
        }));
      }
    }

    if (reg.tipo === 'devoluciones') {
      if (pedido) {
        agregarSiExiste(relacionados, crearRelacionadoBase({
          titulo: `📦 Pedido ${pedido}`,
          subtitulo: 'Pedido global relacionado con la devolución',
          tipo: 'pedidos',
          vista: 'pedidos_view.html',
          registro: pedido
        }));
      }

      if (facturaResultado) {
        agregarSiExiste(relacionados, crearRelacionadoDesdeResultadoConTitulo(
          facturaResultado,
          `🧾 Factura ${obtenerRegistroVisibleRelacionado(facturaResultado, 'facturas')}`,
          'Factura relacionada con la devolución',
          'facturas'
        ));
      }

      if (pedido) {
        agregarSiExiste(relacionados, crearRelacionadoBase({
          titulo: `🏪 Pedidos Mi Tienda ${pedido}`,
          subtitulo: 'Buscar este pedido dentro de Mi Tienda',
          tipo: 'pedidos_mi_tienda',
          vista: 'pedidos_view.html',
          registro: pedido,
          scope: 'mi_tienda'
        }));
      }

      if (clienteRelacionado) {
        agregarSiExiste(relacionados, crearRelacionadoBase({
          titulo: `👤 Cliente ${clienteRelacionado}`,
          subtitulo: 'Cliente del caso de devolución',
          tipo: 'clientes',
          vista: 'clientes_view.html',
          registro: clienteRelacionado
        }));
      }
    }

    const limpios = quitarDuplicadosRelacionados(relacionados);
    if (limpios.length) return limpios;

    return [
      {titulo:'Abrir módulo completo', subtitulo:reg.vista || 'Vista relacionada', tipo:reg.tipo, vista:reg.vista, accion:'filtrarRegistro', registro:reg.registro || reg.id, scope:''}
    ];
  }

  function crearArchivosPorTipo(reg){
    if (reg.tipo === 'pedidos') {
      return [
        {titulo:'📄 Factura PDF', subtitulo:'FAC-2026-66601938.pdf', estado:'Ver'},
        {titulo:'🖼 Evidencia devolución', subtitulo:'foto_producto.jpg', estado:'Ver'}
      ];
    }
    if (reg.tipo === 'facturas') {
      return [
        {titulo:'📄 Factura PDF', subtitulo:`${reg.registro || reg.id || 'factura'}.pdf`, estado:'Ver'},
        {titulo:'📑 Reporte contable', subtitulo:'Detalle de factura', estado:'Ver'}
      ];
    }
    if (reg.tipo === 'devoluciones') {
      return [
        {titulo:'🖼 Evidencia del cliente', subtitulo:'foto_producto.jpg', estado:'Ver'},
        {titulo:'📄 Reporte de revisión', subtitulo:'reporte_devolucion.pdf', estado:'Ver'}
      ];
    }
    return [
      {titulo:'📄 Documento principal', subtitulo:`${reg.registro || reg.id || 'registro'}.pdf`, estado:'Ver'},
      {titulo:'📎 Archivos relacionados', subtitulo:'Adjuntos del módulo', estado:'Ver'}
    ];
  }

  function crearRelacionado(titulo, subtitulo, tipo, vista, accion, registro, scope = ''){
    return `<button type="button" class="universal-related-card" data-related-tipo="${escapeDashV2(tipo || '')}" data-related-vista="${escapeDashV2(vista || '')}" data-related-accion="${escapeDashV2(accion || '')}" data-related-registro="${escapeDashV2(registro || '')}" data-related-scope="${escapeDashV2(scope || '')}"><div><strong>${escapeDashV2(titulo)}</strong><span>${escapeDashV2(subtitulo)}</span></div><b>Abrir</b></button>`;
  }

  function crearArchivo(titulo, subtitulo, estado){
    return `<div class="universal-file-item"><div><strong>${escapeDashV2(titulo)}</strong><span>${escapeDashV2(subtitulo)}</span></div><button type="button" class="universal-file-btn">${escapeDashV2(estado || 'Ver')}</button></div>`;
  }

  window.abrirVisorUniversalDesdeBuscador = function(elemento){
    asegurarVisorUniversalPremiumDOM();
    if (!viewerShell || !viewerOverlay) return;
    registroActual = crearRegistroDesdeElemento(elemento);
    const icono = iconos[registroActual.tipo] || '🔎';
    if (viewerTipo) viewerTipo.textContent = nombres[registroActual.tipo] || 'Registro';
    if (viewerTitle) viewerTitle.textContent = `${icono} ${registroActual.titulo}`;
    if (viewerSubtitle) viewerSubtitle.textContent = registroActual.meta || 'Detalle rápido del registro seleccionado.';
    viewerOverlay.classList.add('visible');
    viewerShell.classList.add('visible');
    document.body.classList.add('universal-viewer-open');
    renderViewer('resumen');
  };

  function cerrarViewer(){
    viewerOverlay?.classList.remove('visible');
    viewerShell?.classList.remove('visible');
    document.body.classList.remove('universal-viewer-open');
  }

  viewerClose?.addEventListener('click', cerrarViewer);
  viewerOverlay?.addEventListener('click', cerrarViewer);
  viewerTabs?.addEventListener('click', event => {
    const btn = event.target.closest('[data-tab]');
    if (btn) renderViewer(btn.dataset.tab || 'resumen');
  });

  viewerCopy?.addEventListener('click', async () => {
    const codigo = registroActual?.registro || registroActual?.id || registroActual?.titulo || '';
    try { await navigator.clipboard.writeText(codigo); } catch {}
    mostrarToastDashboardV2('Código copiado', codigo || 'Registro');
  });

  viewerOpenModule?.addEventListener('click', () => {
    if (!registroActual?.vista || typeof cargarVista !== 'function') return;
    window.TIENDAPRO_DESTINO_PENDIENTE = {
      origen: 'visor_universal',
      modulo: registroActual.tipo,
      vista: registroActual.vista,
      accion: registroActual.accion,
      registro: registroActual.registro || registroActual.id
    };
    try { localStorage.setItem('tiendapro_destino_pendiente', JSON.stringify(window.TIENDAPRO_DESTINO_PENDIENTE)); } catch {}
    cerrarViewer();
    cargarVista(registroActual.vista, true);
  });

  function resaltarCoincidenciaEnVista(registro){
    const valor = normalizarDashV2(registro || '');
    if (!valor) return;
    const contenedor = document.getElementById('contenidoPrincipal') || document;
    const candidatos = Array.from(contenedor.querySelectorAll('tr, .fila-pedido, .fila-usuario, .global-result-item, [data-pedido-id], [data-factura-id], [data-id], [data-cliente]'));
    const encontrado = candidatos.find(el => {
      const visible = el.offsetParent !== null || el.getClientRects().length > 0;
      if (!visible) return false;
      const texto = normalizarDashV2([
        el.textContent,
        el.dataset?.pedidoId,
        el.dataset?.facturaId,
        el.dataset?.id,
        el.dataset?.cliente
      ].filter(Boolean).join(' · '));
      return texto.includes(valor);
    });
    if (!encontrado) return;
    encontrado.scrollIntoView({ behavior: 'smooth', block: 'center' });
    encontrado.style.outline = '2px solid #38bdf8';
    encontrado.style.boxShadow = '0 0 0 6px rgba(56,189,248,.16)';
    setTimeout(() => { encontrado.style.outline = ''; encontrado.style.boxShadow = ''; }, 2600);
  }

  function aplicarFiltroPendienteEnVista(registro){
    const valor = String(registro || '').trim();
    if (!valor) return;
    const contenedor = document.getElementById('contenidoPrincipal') || document;
    const input = contenedor.querySelector('input[type="search"], input[placeholder*="Buscar"], input[id*="buscar"], input[class*="buscar"]');
    if (input) {
      input.value = valor;
      input.dispatchEvent(new Event('input', { bubbles:true }));
      input.dispatchEvent(new Event('change', { bubbles:true }));
      input.focus();
    }
    setTimeout(() => resaltarCoincidenciaEnVista(valor), 250);
    setTimeout(() => resaltarCoincidenciaEnVista(valor), 800);
  }

  function navegarRelacionadoFiltrado(rel){
    let tipoRelacionado = rel.dataset.relatedTipo || registroActual?.tipo || 'registro';
    let vistaRelacionada = rel.dataset.relatedVista || registroActual?.vista || '';
    let registroRelacionado = rel.dataset.relatedRegistro || rel.querySelector('strong')?.textContent?.trim() || '';
    const scopeRelacionado = rel.dataset.relatedScope || '';

    const textoRelacionado = [registroRelacionado, rel.querySelector('strong')?.textContent || '', rel.querySelector('span')?.textContent || ''].join(' · ');
    const textoConRegistroActual = [textoRelacionado, textoRegistroCompleto(registroActual || {})].join(' · ');

    if (tipoRelacionado === 'pedidos_mi_tienda') {
      registroRelacionado = extraerCodigo(textoConRegistroActual, 'PED') || registroRelacionado;
      vistaRelacionada = 'pedidos_view.html';
    } else if (tipoRelacionado === 'pedidos') {
      registroRelacionado = extraerCodigo(textoConRegistroActual, 'PED') || registroRelacionado;
    } else if (tipoRelacionado === 'facturas') {
      registroRelacionado = extraerCodigo(textoConRegistroActual, 'FAC') || registroRelacionado;
    } else if (tipoRelacionado === 'devoluciones') {
      registroRelacionado = extraerCodigo(textoConRegistroActual, 'DEV') || registroRelacionado;
    } else if (tipoRelacionado === 'clientes') {
      registroRelacionado = extraerClienteDesdeTextoRelacionado(textoConRegistroActual) || registroRelacionado;
    }

    registroRelacionado = String(registroRelacionado || '').replace(/^(Pedido|Pedidos Mi Tienda|Factura|Devolución|Devolucion|Cliente)\s+/i, '').trim();
    if (!vistaRelacionada || !registroRelacionado || typeof cargarVista !== 'function') return;

    const moduloPendiente = tipoRelacionado === 'pedidos_mi_tienda' ? 'pedidos' : tipoRelacionado;
    const scopePedidos = tipoRelacionado === 'pedidos_mi_tienda' ? 'mi_tienda' : (scopeRelacionado || '');

    if (vistaRelacionada === 'pedidos_view.html') {
      window.TIENDAPRO_PEDIDOS_SCOPE = scopePedidos === 'mi_tienda' ? 'mi_tienda' : '';
    } else {
      window.TIENDAPRO_PEDIDOS_SCOPE = '';
    }

    window.TIENDAPRO_DESTINO_PENDIENTE = {
      origen: 'visor_universal_relacionado',
      modulo: moduloPendiente,
      vista: vistaRelacionada,
      accion: 'filtrarRegistro',
      registro: registroRelacionado,
      scope: scopePedidos,
      abrirDetalle: false,
      soloFiltrar: true
    };
    try { localStorage.setItem('tiendapro_destino_pendiente', JSON.stringify(window.TIENDAPRO_DESTINO_PENDIENTE)); } catch {}

    cerrarViewer();
    cargarVista(vistaRelacionada, true);
    setTimeout(() => aplicarFiltroPendienteEnVista(registroRelacionado), 650);
    setTimeout(() => aplicarFiltroPendienteEnVista(registroRelacionado), 1300);
  }

  viewerBody?.addEventListener('click', event => {
    if (event.target.closest('#universalInlineOpen')) { viewerOpenModule?.click(); return; }
    if (event.target.closest('#universalInlineCopy')) { viewerCopy?.click(); return; }
    const rel = event.target.closest('[data-related-tipo]');
    if (!rel) return;
    navegarRelacionadoFiltrado(rel);
  });

  function comandosBase(){
    return [
      {icono:'📦', titulo:'Abrir Pedidos', desc:'Ir al módulo de pedidos', vista:'pedidos_view.html'},
      {icono:'🧾', titulo:'Abrir Facturación', desc:'Ir al módulo de facturas', vista:'facturacion_view.html'},
      {icono:'🛒', titulo:'Abrir Productos', desc:'Ir al catálogo de productos', vista:'productos_view.html'},
      {icono:'📦', titulo:'Abrir Inventario físico', desc:'Ver unidades, códigos y estados', vista:'inventario_fisico_view.html'},
      {icono:'🔄', titulo:'Abrir Devoluciones', desc:'Ir a casos de postventa', vista:'devoluciones_view.html'},
      {icono:'👤', titulo:'Abrir Clientes', desc:'Administración de clientes', vista:'clientes_view.html'},
      {icono:'🏪', titulo:'Abrir Vendedores', desc:'Administración de vendedores', vista:'vendedores_view.html'},
      {icono:'⚡', titulo:'Nuevo pedido', desc:'Preparar creación de pedido', vista:'pedidos_view.html', accion:'crearPedido', registro:'nuevo'},
      {icono:'🧾', titulo:'Nueva factura', desc:'Preparar creación de factura', vista:'facturacion_view.html', accion:'crearFactura', registro:'nueva'},
      {icono:'🛒', titulo:'Nuevo producto', desc:'Preparar creación de producto', vista:'productos_view.html', accion:'crearProducto', registro:'nuevo'},
      {icono:'🔎', titulo:'Buscar en toda la plataforma', desc:'Llevar texto al buscador universal', buscar:true}
    ];
  }

  function normalizarDashV2(texto){
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function pintarComandos(){
    if (!commandList) return;
    const q = commandInput?.value?.trim() || '';
    const nq = normalizarDashV2(q);
    const lista = comandosBase().filter(cmd => {
      if (!nq) return true;
      return normalizarDashV2(`${cmd.titulo} ${cmd.desc}`).includes(nq);
    });

    const comandos = lista.length ? lista : [{icono:'🔎', titulo:`Buscar "${q}"`, desc:'Ejecutar búsqueda global', buscar:true, query:q}];
    comandoActivo = Math.min(comandoActivo, comandos.length - 1);

    commandList.innerHTML = comandos.map((cmd, index) => `
      <button type="button" class="command-item ${index === comandoActivo ? 'active' : ''}" data-command-index="${index}">
        <span class="command-icon">${cmd.icono || '⌘'}</span>
        <span><strong>${escapeDashV2(cmd.titulo)}</strong><small>${escapeDashV2(cmd.desc || '')}</small></span>
        <b>${cmd.buscar ? 'Buscar' : 'Abrir'}</b>
      </button>
    `).join('');

    commandList.__commands = comandos;
  }

  window.abrirCentroComandos = function(){
    if (!commandShell || !commandOverlay) return;
    commandOverlay.classList.add('visible');
    commandShell.classList.add('visible');
    document.body.classList.add('command-center-open');
    comandoActivo = 0;
    if (commandInput) commandInput.value = '';
    pintarComandos();
    setTimeout(() => commandInput?.focus(), 40);
  };

  function cerrarCentroComandos(){
    commandOverlay?.classList.remove('visible');
    commandShell?.classList.remove('visible');
    document.body.classList.remove('command-center-open');
  }

  function ejecutarComando(index = comandoActivo){
    const comandos = commandList?.__commands || [];
    const cmd = comandos[index];
    if (!cmd) return;

    cerrarCentroComandos();

    if (cmd.buscar) {
      const input = document.getElementById('globalSearchInput');
      const btn = document.getElementById('globalSearchBtn');
      if (input) {
        input.value = cmd.query || commandInput?.value?.trim() || '';
        input.focus();
      }
      btn?.click();
      return;
    }

    if (cmd.vista && typeof cargarVista === 'function') {
      window.TIENDAPRO_ACCION_PENDIENTE = {
        origen:'centro_comandos',
        vista:cmd.vista,
        accion:cmd.accion || 'abrirModulo',
        registro:cmd.registro || ''
      };
      cargarVista(cmd.vista, true);
      mostrarToastDashboardV2('Comando ejecutado', cmd.titulo);
    }
  }

  openCommandBtn?.addEventListener('click', window.abrirCentroComandos);
  commandClose?.addEventListener('click', cerrarCentroComandos);
  commandOverlay?.addEventListener('click', cerrarCentroComandos);
  commandInput?.addEventListener('input', () => { comandoActivo = 0; pintarComandos(); });
  commandList?.addEventListener('click', event => {
    const item = event.target.closest('[data-command-index]');
    if (item) ejecutarComando(Number(item.dataset.commandIndex || 0));
  });

  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      window.abrirCentroComandos();
      return;
    }

    if (event.key === 'Escape') {
      cerrarCentroComandos();
      cerrarViewer();
    }

    if (!commandShell?.classList.contains('visible')) return;
    const comandos = commandList?.__commands || [];
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      comandoActivo = Math.min(comandoActivo + 1, comandos.length - 1);
      pintarComandos();
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      comandoActivo = Math.max(comandoActivo - 1, 0);
      pintarComandos();
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      ejecutarComando(comandoActivo);
    }
  });

  function mostrarToastDashboardV2(titulo, texto){
    let toast = document.getElementById('globalSearchToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalSearchToast';
      toast.className = 'global-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<strong>${escapeDashV2(titulo)}</strong><span>${escapeDashV2(texto || '')}</span>`;
    toast.classList.add('visible');
    clearTimeout(window.globalSearchToastTimer);
    window.globalSearchToastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }
})();
