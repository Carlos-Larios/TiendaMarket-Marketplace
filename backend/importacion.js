/* =====================================================
       JAVASCRIPT / IMPORTACIONES Y CONFIGURACIÓN BASE
       ===================================================== */

    import axios from "https://cdn.jsdelivr.net/npm/axios@1.7.7/+esm";

    const API = "http://localhost:3000/api";
    const productosToken = localStorage.getItem("token");

    if (!productosToken) {
      window.location.href = "login-Panel.html";
    }

    const authHeaders = {
      headers: {
        Authorization: `Bearer ${productosToken}`
      }
    };

    const PANEL_TIPO_FORZADO = window.TIENDAPRO_TIPO_FORZADO || "";
    const ES_PANEL_IMPORTACION = PANEL_TIPO_FORZADO === "importacion";

    /* =====================================================
       JAVASCRIPT / REFERENCIAS HTML
       ===================================================== */

    const listaProductos = document.getElementById("listaProductos");
    const buscarProducto = document.getElementById("buscarProducto");
    const filtroTipoVenta = document.getElementById("filtroTipoVenta");
    const filtroDisponibilidad = document.getElementById("filtroDisponibilidad");
    const filtroMarca = document.getElementById("filtroMarca");
    const filtroPrecio = document.getElementById("filtroPrecio");
    const limpiarFiltros = document.getElementById("limpiarFiltros");
    const btnAbrirAgregar = document.getElementById("btnAbrirAgregar");
    const btnAbrirCalculadora = document.getElementById("btnAbrirCalculadora");
    const btnAbrirFiltrosProductos = document.getElementById("btnAbrirFiltrosProductos");
    const btnCerrarFiltrosProductos = document.getElementById("btnCerrarFiltrosProductos");
    const filtrosProductosOverlay = document.getElementById("filtrosProductosOverlay");
    const filtrosProductosPanel = document.getElementById("filtrosProductosPanel");
    const btnAplicarFiltrosProductos = document.getElementById("btnAplicarFiltrosProductos");

    const fechaProductos = document.getElementById("fechaProductos");
    const statTotal = document.getElementById("statTotal");
    const statStock = document.getElementById("statStock");
    const statPedido = document.getElementById("statPedido");
    const statAgotados = document.getElementById("statAgotados");

    /* =====================================================
       JAVASCRIPT / VARIABLES GLOBALES
       ===================================================== */

    let productosGlobales = [];
    let categoriasGlobales = [];
    let paginaActual = 1;
    const limiteProductos = 20;
    let busquedaActual = "";
    let totalProductosActual = 0;
    let totalPaginasActual = 1;

    /* =====================================================
       JAVASCRIPT / FUNCIONES DE AYUDA
       ===================================================== */

    fechaProductos.innerText = new Date().toLocaleDateString("es-SV", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    function normalizarTexto(texto) {
      return (texto || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    }

    function limpiarTexto(texto) {
      return (texto || "").trim();
    }

    function formatoDinero(valor) {
      return `$${(Number(valor) || 0).toFixed(2)}`;
    }

    function precioFinal(producto) {
      const p = parseFloat(producto.precio) || 0;
      const d = parseFloat(producto.descuento) || 0;
      return (p - (p * d / 100)).toFixed(2);
    }

    function esImportacion(producto) {
      return normalizarTexto(producto.tipo_venta || "stock") === "importacion";
    }

    function stockPublicado(producto) {
      return Number(producto.stock_fisico_disponible ?? producto.stock_publicado ?? producto.stock ?? 0);
    }

    function etiquetaTipoVenta(valor) {
      return normalizarTexto(valor) === "importacion" ? "Importado" : "Stock físico";
    }

    function estadoVisualProducto(producto) {
      const publicado = Number(producto.publicado ?? 1) === 1;
      const tipoVenta = normalizarTexto(producto.tipo_venta || "stock");
      const disponibilidad = normalizarTexto(producto.disponibilidad || "Disponible");
      const estadoGuardado = normalizarTexto(producto.estado_visual || "");
      const stock = stockPublicado(producto);

      if (!publicado || estadoGuardado === "oculto") return "oculto";
      if (estadoGuardado === "importando") return "importando";
      if (tipoVenta === "importacion") return "importacion";
      if (disponibilidad === "agotado") return "agotado";
      if (stock > 0) return "en_stock";
      return "agotado";
    }

    function etiquetaEstadoVisual(producto) {
      const estado = estadoVisualProducto(producto);
      const etiquetas = {
        en_stock: "Stock",
        importacion: "Importado",
        importando: "Importando",
        agotado: "Agotado",
        oculto: "Oculto"
      };
      return etiquetas[estado] || "En stock";
    }

    function claseEstadoVisual(producto) {
      const estado = estadoVisualProducto(producto);
      if (estado === "agotado") return "tag-agotado";
      if (estado === "importacion") return "tag-pedido";
      if (estado === "importando") return "tag-importando";
      if (estado === "oculto") return "tag-oculto";
      return "tag-stock";
    }

    function claseStock(producto) {
      return stockPublicado(producto) > 0 ? "stock-numero" : "stock-cero";
    }

    function tagsProductoHTML(producto) {
      const tags = [];
      const publicado = Number(producto.publicado ?? 1) === 1;
      const estado = estadoVisualProducto(producto);

      if (esImportacion(producto)) {
        tags.push(`<span class="tag tag-pedido">Importado</span>`);
        if (producto.tiempo_entrega) tags.push(`<span class="tag">Entrega: ${producto.tiempo_entrega}</span>`);
      } else {
        tags.push(`<span class="tag ${claseStock(producto)}">Stock: ${stockPublicado(producto)}</span>`);
        if (estado === "agotado") tags.push(`<span class="tag tag-agotado">Agotado</span>`);
      }

      tags.push(publicado ? `<span class="tag tag-stock">Publicado</span>` : `<span class="tag tag-oculto">Oculto</span>`);
      if (producto.sku) tags.push(`<span class="tag">SKU: ${producto.sku}</span>`);
      return tags.join("");
    }

    function switchPublicacionProducto(producto) {
      const publicado = Number(producto.publicado ?? 1) === 1;
      return `
        <label class="publish-switch-wrap" title="Publicar u ocultar este producto completo">
          <input type="checkbox" ${publicado ? "checked" : ""} onchange="window.cambiarPublicacionProducto(${Number(producto.id)}, this.checked ? 1 : 0)">
          <span class="publish-switch"></span>
          <span class="publish-switch-text">${publicado ? "Publicado" : "Oculto"}</span>
        </label>
      `;
    }

    function obtenerCategoriaPorNombreYPadre(nombre, parentId) {
      return categoriasGlobales.find(cat =>
        normalizarTexto(cat.name) === normalizarTexto(nombre) &&
        String(cat.parent_id || "") === String(parentId || "")
      );
    }

    async function buscarOCrearCategoria(nombre, parentId) {
      const texto = limpiarTexto(nombre);
      if (!texto) return null;

      const existente = obtenerCategoriaPorNombreYPadre(texto, parentId);
      if (existente) return existente;

      const res = await axios.post(`${API}/categorias/buscar-o-crear`, {
        name: texto,
        parent_id: parentId || null
      }, authHeaders);

      await cargarCategorias();
      return res.data.categoria;
    }

    function calcularCostoProducto(datos) {
      const compra = Number(datos.precio_compra || 0);
      const envio = Number(datos.costo_envio || 0);
      const aduana = Number(datos.costo_aduana || 0);
      const precio = Number(datos.precio || 0);

      const costoTotal = compra + envio + aduana;
      const ganancia = precio - costoTotal;
      const margen = precio > 0 ? (ganancia / precio) * 100 : 0;

      return { costoTotal, ganancia, margen };
    }

    /* =====================================================
       JAVASCRIPT / CARGA DE CATEGORÍAS
       ===================================================== */

    async function cargarCategorias() {
      try {
        const res = await axios.get(`${API}/categorias`, authHeaders);
        categoriasGlobales = res.data || [];
      } catch (error) {
        console.log("Error al cargar categorías", error);
      }
    }

    function opcionesCategoriasHTML(categoriaActual = "") {
      return categoriasGlobales.map(cat =>
        `<option value="${cat.name}" ${categoriaActual === cat.name ? "selected" : ""}>${cat.name}</option>`
      ).join("");
    }

    /* =====================================================
       JAVASCRIPT / CARGAR PRODUCTOS
       ===================================================== */

    async function cargarProductos() {
      try {
        const params = new URLSearchParams({
          page: paginaActual,
          limit: limiteProductos,
          search: busquedaActual,
          marca: filtroMarca.value.trim(),
          tipo_venta: PANEL_TIPO_FORZADO || filtroTipoVenta.value
        });

        const res = await axios.get(`${API}/productos?${params.toString()}`, authHeaders);

        productosGlobales = Array.isArray(res.data.productos)
          ? res.data.productos
          : Array.isArray(res.data)
            ? res.data
            : [];

        totalProductosActual = Number(res.data.total || productosGlobales.length);
        totalPaginasActual = Number(res.data.totalPaginas || 1);

        aplicarFiltrosLocales();
        renderizarPaginacion();

      } catch (error) {
        console.error("Error al cargar productos:", error);

        listaProductos.innerHTML = `
          <div class="sin-productos">
            No se pudieron cargar los productos.
          </div>
        `;
      }
    }

    /* =====================================================
       JAVASCRIPT / ESTADÍSTICAS
       ===================================================== */

    function actualizarEstadisticas(productos) {
      statTotal.innerText = totalProductosActual || productos.length;

      const enStock = productos.filter(p => estadoVisualProducto(p) === "en_stock").length;
      const bajoPedido = productos.filter(p => esImportacion(p) || estadoVisualProducto(p) === "importando").length;
      const agotados = productos.filter(p => estadoVisualProducto(p) === "agotado").length;

      statStock.innerText = enStock;
      statPedido.innerText = bajoPedido;
      statAgotados.innerText = agotados;
    }

    /* =====================================================
       JAVASCRIPT / MOSTRAR LISTA DE PRODUCTOS
       ===================================================== */

    function mostrarProductos(productos) {
      const infoProductos = document.getElementById("infoProductos");

      actualizarEstadisticas(productos);

      if (infoProductos) {
        const inicio = totalProductosActual === 0 ? 0 : ((paginaActual - 1) * limiteProductos) + 1;
        const fin = Math.min(paginaActual * limiteProductos, totalProductosActual);
        infoProductos.innerText = `Mostrando ${inicio}-${fin} de ${totalProductosActual || productos.length} productos`;
      }

      listaProductos.innerHTML = "";

      if (productos.length === 0) {
        listaProductos.innerHTML = `
          <div class="sin-productos">
            No hay productos que coincidan con los filtros.
          </div>
        `;
        return;
      }

      productos.forEach(producto => {
        const precioOriginal = Number(producto.precio || 0).toFixed(2);
        const descuento = Number(producto.descuento || 0);
        const final = precioFinal(producto);

        listaProductos.innerHTML += `
          <div class="producto-row" onclick="verProducto(${producto.id})">
            <img
              class="producto-img"
              src="${producto.imagen || ""}"
              onerror="this.src='https://via.placeholder.com/160x120?text=Sin+imagen'"
              alt="${producto.nombre || "Producto"}"
            >

            <div class="producto-info">
              <h3>${producto.nombre || "Producto sin nombre"}</h3>
              <p>
                ${producto.marca || "Sin marca"} 
                ${producto.modelo ? "· " + producto.modelo : ""} 
                ${producto.categoria ? "· " + producto.categoria : ""}
              </p>

              <div class="producto-tags">
                ${tagsProductoHTML(producto)}
              </div>
            </div>

            <div class="producto-side">
              <div class="producto-precio">${formatoDinero(final)}</div>
              ${descuento > 0 ? `<div class="producto-original">$${precioOriginal}</div>` : ""}

              <div class="producto-botones" onclick="event.stopPropagation()">
                ${switchPublicacionProducto(producto)}
                <button class="btn-mini" onclick="editarProducto(${producto.id})">Editar</button>
                <button class="btn-mini danger" onclick="eliminarProducto(${producto.id})">Eliminar</button>
              </div>
            </div>
          </div>
        `;
      });
    }

    /* =====================================================
       JAVASCRIPT / FILTROS
       ===================================================== */

    function aplicarFiltrosLocales() {
      let filtrados = [...productosGlobales];

      const precioFiltro = filtroPrecio.value;
      const disponibilidad = normalizarTexto(filtroDisponibilidad.value);

      if (disponibilidad) {
        filtrados = filtrados.filter(p =>
          normalizarTexto(p.disponibilidad) === disponibilidad
        );
      }

      if (precioFiltro) {
        const [min, max] = precioFiltro.split("-").map(Number);

        filtrados = filtrados.filter(producto => {
          const precio = Number(precioFinal(producto));
          return precio >= min && precio <= max;
        });
      }

      mostrarProductos(filtrados);
    }

    let temporizadorBusqueda = null;

    buscarProducto.addEventListener("input", () => {
      clearTimeout(temporizadorBusqueda);

      temporizadorBusqueda = setTimeout(() => {
        busquedaActual = buscarProducto.value.trim();
        paginaActual = 1;
        cargarProductos();
      }, 350);
    });

    filtroTipoVenta.addEventListener("change", () => {
      paginaActual = 1;
      cargarProductos();
    });

    filtroMarca.addEventListener("input", () => {
      clearTimeout(temporizadorBusqueda);

      temporizadorBusqueda = setTimeout(() => {
        paginaActual = 1;
        cargarProductos();
      }, 350);
    });

    filtroDisponibilidad.addEventListener("change", aplicarFiltrosLocales);
    filtroPrecio.addEventListener("change", aplicarFiltrosLocales);

    limpiarFiltros.addEventListener("click", () => {
      buscarProducto.value = "";
      filtroTipoVenta.value = "";
      filtroDisponibilidad.value = "";
      filtroMarca.value = "";
      filtroPrecio.value = "";

      busquedaActual = "";
      paginaActual = 1;
      cerrarFiltrosProductos();
      cargarProductos();
    });

    function abrirFiltrosProductos() {
      filtrosProductosOverlay.classList.add("activo");
      filtrosProductosPanel.classList.add("abierto");
    }

    function cerrarFiltrosProductos() {
      filtrosProductosOverlay.classList.remove("activo");
      filtrosProductosPanel.classList.remove("abierto");
    }

    btnAbrirFiltrosProductos.addEventListener("click", abrirFiltrosProductos);
    btnCerrarFiltrosProductos.addEventListener("click", cerrarFiltrosProductos);
    filtrosProductosOverlay.addEventListener("click", cerrarFiltrosProductos);
    btnAplicarFiltrosProductos.addEventListener("click", () => {
      cerrarFiltrosProductos();
      paginaActual = 1;
      cargarProductos();
      aplicarFiltrosLocales();
    });

    /* =====================================================
       JAVASCRIPT / PAGINACIÓN
       ===================================================== */

    function renderizarPaginacion() {
      const paginacion = document.getElementById("paginacionProductos");

      if (!paginacion) return;

      if (totalPaginasActual <= 1) {
        paginacion.innerHTML = "";
        return;
      }

      paginacion.innerHTML = `
        <button ${paginaActual <= 1 ? "disabled" : ""} onclick="cambiarPaginaProductos(${paginaActual - 1})">
          ← Anterior
        </button>

        <span>Página ${paginaActual} de ${totalPaginasActual}</span>

        <button ${paginaActual >= totalPaginasActual ? "disabled" : ""} onclick="cambiarPaginaProductos(${paginaActual + 1})">
          Siguiente →
        </button>
      `;
    }

    window.cambiarPaginaProductos = function(nuevaPagina) {
      if (nuevaPagina < 1 || nuevaPagina > totalPaginasActual) return;
      paginaActual = nuevaPagina;
      cargarProductos();
    };

    /* =====================================================
       JAVASCRIPT / MODAL AGREGAR PRODUCTO
       ===================================================== */

    btnAbrirAgregar.addEventListener("click", () => {
      const valoresIniciales = ES_PANEL_IMPORTACION
        ? { tipo_venta: "importacion", tiempo_entrega: "15 a 20 días" }
        : {};
      abrirModalProducto(null, valoresIniciales);
    });

    function valorSeguro(valor = "") {
      return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function categoriasPorPadre(parentId) {
      const parentNormalizado = parentId === null || parentId === undefined || parentId === "" ? "" : String(parentId);
      return categoriasGlobales
        .filter(cat => String(cat.parent_id || "") === parentNormalizado)
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
    }

    function buscarCategoriaPorNombreYPadre(nombre, parentId) {
      const texto = normalizarTexto(nombre);
      const parentNormalizado = parentId === null || parentId === undefined || parentId === "" ? "" : String(parentId);
      return categoriasGlobales.find(cat =>
        normalizarTexto(cat.name) === texto &&
        String(cat.parent_id || "") === parentNormalizado
      );
    }

    function obtenerRutaCategoria(nombreFinal) {
      if (!nombreFinal) return [];

      let categoria = categoriasGlobales.find(cat => normalizarTexto(cat.name) === normalizarTexto(nombreFinal));
      if (!categoria) return [];

      const ruta = [];
      const seguridad = new Set();

      while (categoria && !seguridad.has(String(categoria.id))) {
        ruta.unshift(categoria);
        seguridad.add(String(categoria.id));
        categoria = categoriasGlobales.find(cat => String(cat.id) === String(categoria.parent_id));
      }

      return ruta;
    }

    function crearCampoCategoriaHTML({ idInput, idHidden, idLista, label, placeholder, valor = "", hidden = "" }) {
      return `
        <div class="categoria-autocomplete-wrap">
          <label>${label}</label>
          <input id="${idInput}" class="input-modal" autocomplete="off" placeholder="${placeholder}" value="${valorSeguro(valor)}">
          <input id="${idHidden}" type="hidden" value="${valorSeguro(hidden)}">
          <div id="${idLista}" class="categoria-sugerencias"></div>
        </div>
      `;
    }

    function crearFormularioProducto(producto = {}) {
      const tipoActual = producto.tipo_venta || "stock";
      const ruta = obtenerRutaCategoria(producto.categoria || "");
      const categoriaActual = ruta[0] || null;
      const subcategoriaActual = ruta[1] || null;
      const tipoCategoriaActual = ruta[2] || null;

      return `
        <div class="modal-producto">
          <div class="modal-grid">
            <div class="modal-section-title">1. Datos básicos</div>

            <input id="modalNombre" class="input-modal" placeholder="Nombre del producto" value="${valorSeguro(producto.nombre || "")}">
            <input id="modalMarca" class="input-modal" placeholder="Marca" value="${valorSeguro(producto.marca || "")}">
            <input id="modalModelo" class="input-modal" placeholder="Modelo opcional" value="${valorSeguro(producto.modelo || "")}">
            <input id="modalImagen" class="input-modal" placeholder="URL de imagen" value="${valorSeguro(producto.imagen || "")}">
            <textarea id="modalDescripcion" class="input-modal modal-full" placeholder="Descripción corta">${valorSeguro(producto.descripcion || "")}</textarea>

            <div class="modal-section-title">2. Venta</div>

            <input id="modalPrecio" type="number" step="0.01" class="input-modal" placeholder="Precio publicado" value="${valorSeguro(producto.precio || "")}">
            <input id="modalDescuento" type="number" class="input-modal" placeholder="Descuento % opcional" value="${valorSeguro(producto.descuento || 0)}">

            <select id="modalTipoVenta" class="input-modal">
              <option value="stock" ${tipoActual === "stock" ? "selected" : ""}>Stock</option>
              <option value="importacion" ${tipoActual === "importacion" ? "selected" : ""}>Importación</option>
            </select>

            <select id="modalPublicado" class="input-modal">
              <option value="1" ${Number(producto.publicado ?? 1) === 1 ? "selected" : ""}>Publicado en tienda</option>
              <option value="0" ${Number(producto.publicado ?? 1) === 0 ? "selected" : ""}>Oculto para clientes</option>
            </select>

            <input id="modalTiempoEntrega" class="input-modal modal-full" placeholder="Tiempo estimado para importación. Ej: 15 a 20 días" value="${valorSeguro(producto.tiempo_entrega || "")}">

            <div class="modal-section-title">3. Categoría del producto</div>

            ${crearCampoCategoriaHTML({
              idInput: "modalCategoriaTexto",
              idHidden: "modalCategoriaId",
              idLista: "sugerenciasCategoriaProducto",
              label: "Categoría principal",
              placeholder: "Escribe o selecciona. Ej: Ropa, Computadoras, Electrónicos",
              valor: categoriaActual?.name || producto.categoria || "",
              hidden: categoriaActual?.id || ""
            })}

            ${crearCampoCategoriaHTML({
              idInput: "modalSubcategoriaTexto",
              idHidden: "modalSubcategoriaId",
              idLista: "sugerenciasSubcategoriaProducto",
              label: "Subcategoría",
              placeholder: "Escribe o selecciona. Ej: Hombre, Mujer, Gabinetes",
              valor: subcategoriaActual?.name || "",
              hidden: subcategoriaActual?.id || ""
            })}

            ${crearCampoCategoriaHTML({
              idInput: "modalTipoCategoriaTexto",
              idHidden: "modalTipoCategoriaId",
              idLista: "sugerenciasTipoCategoriaProducto",
              label: "Tipo / sub-subcategoría",
              placeholder: "Escribe o selecciona. Ej: Camisas, Pantalones, Sudaderas",
              valor: tipoCategoriaActual?.name || "",
              hidden: tipoCategoriaActual?.id || ""
            })}

            <div class="categoria-ayuda">
              Puedes escribir solo una parte y el sistema sugerirá opciones guardadas. Si escribes una categoría, subcategoría o tipo nuevo, se guardará automáticamente al guardar el producto.
            </div>

            <div class="modal-section-title">Extras opcionales</div>

            <input id="modalSku" class="input-modal" placeholder="SKU / código interno" value="${valorSeguro(producto.sku || "")}">
            <input id="modalCodigo" class="input-modal" placeholder="Código de barras / QR del modelo" value="${valorSeguro(producto.codigo_barras || "")}">
            <input id="modalColor" class="input-modal" placeholder="Color" value="${valorSeguro(producto.color || "")}">
            <input id="modalTalla" class="input-modal" placeholder="Talla / tamaño" value="${valorSeguro(producto.talla || "")}">

            <select id="modalCondicion" class="input-modal">
              <option value="Nuevo" ${producto.condicion === "Nuevo" ? "selected" : ""}>Nuevo</option>
              <option value="Renovado" ${producto.condicion === "Renovado" ? "selected" : ""}>Renovado</option>
              <option value="Usado" ${producto.condicion === "Usado" ? "selected" : ""}>Usado</option>
            </select>

            <input id="modalProveedor" class="input-modal" placeholder="Proveedor de referencia opcional" value="${valorSeguro(producto.proveedor || "")}">
            <input id="modalPaisOrigen" class="input-modal" placeholder="País de origen opcional" value="${valorSeguro(producto.pais_origen || "")}">

            <div class="modal-section-title">Costos privados opcionales</div>

            <input id="modalPrecioCompra" type="number" step="0.01" class="input-modal" placeholder="Costo producto" value="${valorSeguro(producto.precio_compra || 0)}">
            <input id="modalCostoEnvio" type="number" step="0.01" class="input-modal" placeholder="Envío" value="${valorSeguro(producto.costo_envio || 0)}">
            <input id="modalCostoAduana" type="number" step="0.01" class="input-modal" placeholder="Aduana / impuestos" value="${valorSeguro(producto.costo_aduana || 0)}">

            <div id="modalResumenCostos" class="modal-section-title">
              Costo total: $0.00 · Ganancia: $0.00 · Margen: 0.00%
            </div>
          </div>
        </div>
      `;
    }

    function leerDatosModal() {
      const valor = (id, defecto = "") => document.getElementById(id)?.value ?? defecto;
      const tipoVenta = PANEL_TIPO_FORZADO || valor("modalTipoVenta", "stock");
      const esImportacionActual = normalizarTexto(tipoVenta) === "importacion";

      return {
        nombre: valor("modalNombre").trim(),
        descripcion: valor("modalDescripcion").trim(),
        precio: valor("modalPrecio") || 0,
        descuento: valor("modalDescuento") || 0,
        imagen: valor("modalImagen").trim(),

        // En productos de stock el stock real lo controla Inventario físico.
        stock: 0,
        stock_minimo: 0,
        publicado: valor("modalPublicado", "1"),
        permite_bajo_pedido: esImportacionActual ? 1 : 0,
        estado_visual: "auto",

        categoria: valor("modalCategoriaTexto").trim(),
        categoria_principal: valor("modalCategoriaTexto").trim(),
        subcategoria: valor("modalSubcategoriaTexto").trim(),
        tipo_categoria: valor("modalTipoCategoriaTexto").trim(),
        genero: "",
        marca: valor("modalMarca").trim(),
        modelo: valor("modalModelo").trim(),
        condicion: valor("modalCondicion", "Nuevo"),
        sku: valor("modalSku").trim(),
        codigo_barras: valor("modalCodigo").trim(),
        color: valor("modalColor").trim(),
        talla: valor("modalTalla").trim(),
        disponibilidad: "Disponible",
        proveedor: valor("modalProveedor").trim(),
        pais_origen: valor("modalPaisOrigen").trim(),
        precio_compra: valor("modalPrecioCompra") || 0,
        costo_envio: valor("modalCostoEnvio") || 0,
        costo_aduana: valor("modalCostoAduana") || 0,
        tiempo_entrega: esImportacionActual ? (valor("modalTiempoEntrega").trim() || "15 a 20 días") : valor("modalTiempoEntrega").trim(),
        tipo_venta: tipoVenta
      };
    }

    function activarCalculoModal() {
      const ids = ["modalPrecio", "modalPrecioCompra", "modalCostoEnvio", "modalCostoAduana"];

      function actualizar() {
        const datos = leerDatosModal();
        const { costoTotal, ganancia, margen } = calcularCostoProducto(datos);
        const resumen = document.getElementById("modalResumenCostos");

        if (resumen) {
          resumen.innerText = `Costo total: ${formatoDinero(costoTotal)} · Ganancia: ${formatoDinero(ganancia)} · Margen: ${margen.toFixed(2)}%`;
        }
      }

      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", actualizar);
      });

      actualizar();
    }

    function configurarCampoCategoria({ inputId, hiddenId, listaId, obtenerParentId, alSeleccionar }) {
      const input = document.getElementById(inputId);
      const hidden = document.getElementById(hiddenId);
      const lista = document.getElementById(listaId);
      if (!input || !hidden || !lista) return;

      function renderizar() {
        const texto = normalizarTexto(input.value);
        const parentId = obtenerParentId ? obtenerParentId() : null;
        const opciones = categoriasPorPadre(parentId)
          .filter(cat => !texto || normalizarTexto(cat.name).includes(texto))
          .slice(0, 10);

        if (!input.value.trim()) {
          lista.classList.remove("activo");
          lista.innerHTML = "";
          return;
        }

        if (!opciones.length) {
          lista.innerHTML = `<div class="categoria-sugerencia-item">Guardar como nuevo: ${valorSeguro(input.value.trim())}</div>`;
          lista.classList.add("activo");
          return;
        }

        lista.innerHTML = opciones.map(cat => `
          <div class="categoria-sugerencia-item" data-id="${cat.id}" data-name="${valorSeguro(cat.name)}">
            ${valorSeguro(cat.name)}
          </div>
        `).join("");
        lista.classList.add("activo");
      }

      input.addEventListener("input", () => {
        hidden.value = "";
        if (alSeleccionar) alSeleccionar(null);
        renderizar();
      });

      input.addEventListener("focus", renderizar);

      lista.addEventListener("mousedown", (event) => {
        const item = event.target.closest(".categoria-sugerencia-item");
        if (!item) return;
        if (item.dataset.id) {
          input.value = item.dataset.name || "";
          hidden.value = item.dataset.id || "";
          if (alSeleccionar) alSeleccionar(item.dataset.id || null);
        }
        lista.classList.remove("activo");
        lista.innerHTML = "";
      });
    }

    function configurarAutocompletarCategoriasProducto() {
      const limpiarSubcategoria = () => {
        const sub = document.getElementById("modalSubcategoriaTexto");
        const subId = document.getElementById("modalSubcategoriaId");
        const tipo = document.getElementById("modalTipoCategoriaTexto");
        const tipoId = document.getElementById("modalTipoCategoriaId");
        if (sub) sub.value = "";
        if (subId) subId.value = "";
        if (tipo) tipo.value = "";
        if (tipoId) tipoId.value = "";
      };

      const limpiarTipo = () => {
        const tipo = document.getElementById("modalTipoCategoriaTexto");
        const tipoId = document.getElementById("modalTipoCategoriaId");
        if (tipo) tipo.value = "";
        if (tipoId) tipoId.value = "";
      };

      configurarCampoCategoria({
        inputId: "modalCategoriaTexto",
        hiddenId: "modalCategoriaId",
        listaId: "sugerenciasCategoriaProducto",
        obtenerParentId: () => null,
        alSeleccionar: limpiarSubcategoria
      });

      configurarCampoCategoria({
        inputId: "modalSubcategoriaTexto",
        hiddenId: "modalSubcategoriaId",
        listaId: "sugerenciasSubcategoriaProducto",
        obtenerParentId: () => document.getElementById("modalCategoriaId")?.value || null,
        alSeleccionar: limpiarTipo
      });

      configurarCampoCategoria({
        inputId: "modalTipoCategoriaTexto",
        hiddenId: "modalTipoCategoriaId",
        listaId: "sugerenciasTipoCategoriaProducto",
        obtenerParentId: () => document.getElementById("modalSubcategoriaId")?.value || null
      });

      document.addEventListener("mousedown", (event) => {
        if (!event.target.closest(".categoria-autocomplete-wrap")) {
          document.querySelectorAll(".categoria-sugerencias").forEach(lista => {
            lista.classList.remove("activo");
            lista.innerHTML = "";
          });
        }
      }, { once: true });
    }

    async function resolverCategoriaModal(datos) {
      const categoriaTexto = limpiarTexto(datos.categoria_principal || datos.categoria);
      const subcategoriaTexto = limpiarTexto(datos.subcategoria);
      const tipoTexto = limpiarTexto(datos.tipo_categoria);

      if (!categoriaTexto) return datos;

      const categoriaPrincipal = await buscarOCrearCategoria(categoriaTexto, null);
      let categoriaFinal = categoriaPrincipal.name;
      let subcategoriaCreada = null;

      if (subcategoriaTexto) {
        subcategoriaCreada = await buscarOCrearCategoria(subcategoriaTexto, categoriaPrincipal.id);
        categoriaFinal = subcategoriaCreada.name;
      }

      if (tipoTexto) {
        if (!subcategoriaCreada) {
          Swal.showValidationMessage("Para crear un tipo primero escribe o selecciona una subcategoría");
          return false;
        }

        const tipoCreado = await buscarOCrearCategoria(tipoTexto, subcategoriaCreada.id);
        categoriaFinal = tipoCreado.name;
      }

      datos.categoria = categoriaFinal;
      delete datos.categoria_principal;
      delete datos.subcategoria;
      delete datos.tipo_categoria;
      return datos;
    }

    async function abrirModalProducto(producto = null, valoresIniciales = {}) {
      const esEdicion = Boolean(producto && producto.id);
      const datosFormulario = esEdicion ? producto : valoresIniciales;

      const resultado = await Swal.fire({
        title: esEdicion ? "Editar producto" : "Agregar producto",
        width: "980px",
        background: "#1e293b",
        color: "white",
        html: crearFormularioProducto(datosFormulario || {}),
        showCancelButton: true,
        confirmButtonText: esEdicion ? "Actualizar" : "Guardar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#475569",
        didOpen: () => {
          activarCalculoModal();
          configurarAutocompletarCategoriasProducto();
          const tipoSelect = document.getElementById("modalTipoVenta");
          const tiempoInput = document.getElementById("modalTiempoEntrega");

          function sincronizarTipoVenta() {
            if (!tipoSelect) return;
            if (tipoSelect.value === "importacion" && tiempoInput && !tiempoInput.value.trim()) {
              tiempoInput.value = "15 a 20 días";
            }
          }

          if (tipoSelect) tipoSelect.addEventListener("change", sincronizarTipoVenta);
          sincronizarTipoVenta();
        },
        preConfirm: async () => {
          let datos = leerDatosModal();

          if (!datos.nombre) {
            Swal.showValidationMessage("El nombre es obligatorio");
            return false;
          }

          if (!datos.precio || Number(datos.precio) <= 0) {
            Swal.showValidationMessage("El precio debe ser mayor a 0");
            return false;
          }

          if (!datos.categoria) {
            Swal.showValidationMessage("Selecciona una categoría");
            return false;
          }

          datos = await resolverCategoriaModal(datos);
          return datos;
        }
      });

      if (!resultado.isConfirmed || !resultado.value) return;

      try {
        if (esEdicion) {
          await axios.put(`${API}/productos/${producto.id}`, resultado.value, authHeaders);
        } else {
          await axios.post(`${API}/productos`, resultado.value, authHeaders);
        }

        Swal.fire({
          title: esEdicion ? "Producto actualizado" : "Producto agregado",
          icon: "success",
          background: "#1e293b",
          color: "white",
          timer: 1400,
          showConfirmButton: false
        });

        paginaActual = 1;
        await cargarCategorias();
        await cargarProductos();

      } catch (error) {
        console.error(error);

        Swal.fire({
          title: "Error",
          text: "No se pudo guardar el producto",
          icon: "error",
          background: "#1e293b",
          color: "white"
        });
      }
    }

    /* =====================================================
       JAVASCRIPT / MODAL VER DETALLE DEL PRODUCTO
       ===================================================== */

    window.verProducto = async function(id) {
      try {
        const res = await axios.get(`${API}/productos/${id}`, authHeaders);
        const producto = res.data;
        const { costoTotal, ganancia, margen } = calcularCostoProducto(producto);

        await Swal.fire({
          title: producto.nombre || "Detalle del producto",
          width: "950px",
          background: "#1e293b",
          color: "white",
          html: `
            <div class="detalle-producto-box">
              <div class="detalle-producto-grid">
                <img
                  class="detalle-producto-img"
                  src="${producto.imagen || ""}"
                  onerror="this.src='https://via.placeholder.com/300x220?text=Sin+imagen'"
                >

                <div>
                  <h2 style="margin:0 0 6px;color:white;">${producto.nombre || "Producto sin nombre"}</h2>
                  <p style="color:#94a3b8;margin:0 0 12px;">${producto.descripcion || "Sin descripción"}</p>

                  <div class="producto-tags">
                    ${tagsProductoHTML(producto)}
                  </div>
                </div>
              </div>

              <div class="detalle-cards">
                <div class="detalle-card"><small>Precio publicado</small><strong>${formatoDinero(precioFinal(producto))}</strong></div>
                <div class="detalle-card"><small>Precio normal</small><strong>${formatoDinero(producto.precio)}</strong></div>
                <div class="detalle-card"><small>Descuento</small><strong>${producto.descuento || 0}%</strong></div>
                <div class="detalle-card"><small>Categoría</small><strong>${producto.categoria || "Sin categoría"}</strong></div>
                <div class="detalle-card"><small>Estado visual</small><strong>${etiquetaEstadoVisual(producto)}</strong></div>
                <div class="detalle-card"><small>Publicado</small><strong>${Number(producto.publicado ?? 1) === 1 ? "Sí" : "No"}</strong></div>
                <div class="detalle-card"><small>Stock mínimo</small><strong>${producto.stock_minimo || 0}</strong></div>
                <div class="detalle-card"><small>Bajo pedido si se agota</small><strong>${Number(producto.permite_bajo_pedido || 0) === 1 ? "Sí" : "No"}</strong></div>
                <div class="detalle-card"><small>Marca</small><strong>${producto.marca || "Sin marca"}</strong></div>
                <div class="detalle-card"><small>Modelo</small><strong>${producto.modelo || "Sin modelo"}</strong></div>
                <div class="detalle-card"><small>SKU</small><strong>${producto.sku || "Sin SKU"}</strong></div>
                <div class="detalle-card"><small>Código barras / QR</small><strong>${producto.codigo_barras || "Sin código"}</strong></div>
                <div class="detalle-card"><small>Proveedor referencia</small><strong>${producto.proveedor || "Sin proveedor"}</strong></div>
                <div class="detalle-card"><small>País origen</small><strong>${producto.pais_origen || "Sin país"}</strong></div>
                <div class="detalle-card"><small>Entrega estimada</small><strong>${producto.tiempo_entrega || "No definida"}</strong></div>
                <div class="detalle-card"><small>Condición</small><strong>${producto.condicion || "Nuevo"}</strong></div>
                <div class="detalle-card"><small>Costo total estimado</small><strong>${formatoDinero(costoTotal)}</strong></div>
                <div class="detalle-card"><small>Ganancia estimada</small><strong>${formatoDinero(ganancia)}</strong></div>
                <div class="detalle-card"><small>Margen</small><strong>${margen.toFixed(2)}%</strong></div>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "Editar",
          cancelButtonText: "Cerrar",
          confirmButtonColor: "#2563eb",
          cancelButtonColor: "#475569"
        }).then((r) => {
          if (r.isConfirmed) editarProducto(producto.id);
        });

      } catch (error) {
        console.error(error);

        Swal.fire({
          title: "Error",
          text: "No se pudo abrir el detalle del producto",
          icon: "error",
          background: "#1e293b",
          color: "white"
        });
      }
    };

    /* =====================================================
       JAVASCRIPT / EDITAR Y ELIMINAR
       ===================================================== */

    window.editarProducto = async function(id) {
      try {
        const res = await axios.get(`${API}/productos/${id}`, authHeaders);
        await abrirModalProducto(res.data);
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "No se pudo cargar el producto",
          icon: "error",
          background: "#1e293b",
          color: "white"
        });
      }
    };

    window.eliminarProducto = async function(id) {
      const resultado = await Swal.fire({
        title: "¿Eliminar producto?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#334155",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        background: "#1e293b",
        color: "white"
      });

      if (!resultado.isConfirmed) return;

      try {
        await axios.delete(`${API}/productos/${id}`, authHeaders);

        Swal.fire({
          title: "Eliminado",
          text: "Producto eliminado correctamente",
          icon: "success",
          background: "#1e293b",
          color: "white",
          timer: 1200,
          showConfirmButton: false
        });

        await cargarProductos();

      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar",
          icon: "error",
          background: "#1e293b",
          color: "white"
        });
      }
    };


    window.cambiarPublicacionProducto = async function(id, publicado) {
      try {
        const res = await axios.put(`${API}/productos/${id}/publicacion`, {
          publicado: Number(publicado)
        }, authHeaders);

        if (!res || res.status < 200 || res.status >= 300) {
          throw new Error("Respuesta inválida del servidor");
        }

        await cargarProductos();

      } catch (error) {
        console.error("Error al cambiar publicación desde Importación:", error);

        Swal.fire({
          title: "Error",
          text: "No se pudo cambiar la publicación del producto",
          icon: "error",
          background: "#1e293b",
          color: "white"
        });

        await cargarProductos();
      }
    };


    /* =====================================================
       JAVASCRIPT / CALCULADORA DE IMPORTACIÓN
       ===================================================== */

    btnAbrirCalculadora.addEventListener("click", () => {
      Swal.fire({
        title: "Calculadora de importación",
        width: "780px",
        background: "#1e293b",
        color: "white",
        html: `
          <div class="modal-producto">
            <div class="modal-grid-3">
              <input id="calcCosto" type="number" step="0.01" class="input-modal" placeholder="Costo proveedor">
              <input id="calcEnvio" type="number" step="0.01" class="input-modal" placeholder="Envío">
              <input id="calcImportacion" type="number" step="0.01" class="input-modal" placeholder="% importación">
              <input id="calcGanancia" type="number" step="0.01" class="input-modal" placeholder="Ganancia fija $">
              <input id="calcMargen" type="number" step="0.01" class="input-modal" placeholder="Ganancia % opcional">
              <input id="calcRedondeo" type="number" step="0.01" class="input-modal" placeholder="Redondear a .99 opcional">

              <div class="modal-full calculadora-result">
                <div class="calc-card">Importación <strong id="calcImpResultado">$0.00</strong></div>
                <div class="calc-card">Costo real <strong id="calcCostoReal">$0.00</strong></div>
                <div class="calc-card">Precio sugerido <strong id="calcPrecioSugerido">$0.00</strong></div>
              </div>
            </div>
          </div>
        `,
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#2563eb",
        didOpen: () => {
          const campos = ["calcCosto", "calcEnvio", "calcImportacion", "calcGanancia", "calcMargen", "calcRedondeo"];

          function calcular() {
            const costo = Number(document.getElementById("calcCosto").value) || 0;
            const envio = Number(document.getElementById("calcEnvio").value) || 0;
            const porcentaje = Number(document.getElementById("calcImportacion").value) || 0;
            const gananciaFija = Number(document.getElementById("calcGanancia").value) || 0;
            const gananciaPorcentaje = Number(document.getElementById("calcMargen").value) || 0;
            const redondeo = Number(document.getElementById("calcRedondeo").value) || 0;

            const base = costo + envio;
            const importacion = base * (porcentaje / 100);
            const costoReal = base + importacion;
            let precio = costoReal + gananciaFija + (costoReal * (gananciaPorcentaje / 100));

            if (redondeo === 99 && precio > 0) {
              precio = Math.floor(precio) + 0.99;
            }

            document.getElementById("calcImpResultado").innerText = formatoDinero(importacion);
            document.getElementById("calcCostoReal").innerText = formatoDinero(costoReal);
            document.getElementById("calcPrecioSugerido").innerText = formatoDinero(precio);
          }

          campos.forEach(id => {
            document.getElementById(id).addEventListener("input", calcular);
          });

          calcular();
        }
      });
    });

    /* =====================================================
       JAVASCRIPT / CARGA INICIAL
       ===================================================== */

    if (ES_PANEL_IMPORTACION) {
      const titulo = document.querySelector(".productos-top h1");
      const subtitulo = document.querySelector(".productos-top p");
      const listaTitulo = document.querySelector(".productos-lista-header h2");
      const btnAgregar = document.getElementById("btnAbrirAgregar");
      const filtroTipo = document.getElementById("filtroTipoVenta");
      if (titulo) titulo.textContent = "🚢 Panel de Importación";
      if (subtitulo) subtitulo.textContent = "Administra productos importados con el mismo formulario, costos, proveedor, categoría y publicación.";
      if (listaTitulo) listaTitulo.textContent = "Productos de importación";
      if (btnAgregar) btnAgregar.textContent = "➕ Agregar importación";
      if (filtroTipo) filtroTipo.value = "importacion";
    }

    await cargarCategorias();
    await cargarProductos();
