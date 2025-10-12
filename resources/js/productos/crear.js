import Swal from "sweetalert2";
import { closeModal, Loader, setBtnLoading } from "../app";

const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";

// ==== helpers de escape seguros ====
const escapeHtmlAttr = (str) =>
    String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

const escapeJsSingleArg = (str) => {
    let s = String(str ?? "");
    s = s.replace(new RegExp("\\\\", "g"), "\\\\");
    s = s.replace(new RegExp("'", "g"), "\\'");
    s = s.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
    return s;
};

// Estado
let productosData = [];
let categoriaActual = "";
let productoActual = null;

// Elementos
const scannerInput = document.getElementById("scannerInput");
const scannerStatus = document.getElementById("scannerStatus");
const productosGrid = document.getElementById("productosGrid");
const emptyState = document.getElementById("emptyState");
const searchBox = document.getElementById("searchBox");

// feedback escáner
const scannerNombreWrap = document.getElementById("scannerNombreWrap");
const scannerNombre = document.getElementById("scannerNombre");
const scannerBtnImprimir = document.getElementById("scannerBtnImprimir");
const scannerBtnEditar = document.getElementById("scannerBtnEditar");

// ========================= ESCÁNER CON BÚSQUEDA DINÁMICA =========================
const busquedaDinamicaScanner = (codigo) => {
    const coincidencias = productosData.filter(p =>
        p.prod_codigo && p.prod_codigo.toLowerCase().includes(codigo.toLowerCase())
    ).slice(0, 5);

    if (coincidencias.length > 0) {
        mostrarSugerenciasScanner(coincidencias);
    } else {
        ocultarSugerenciasScanner();
    }
};

const mostrarSugerenciasScanner = (productos) => {
    let sugerenciasDiv = document.getElementById("scanner-sugerencias");

    if (!sugerenciasDiv) {
        sugerenciasDiv = document.createElement("div");
        sugerenciasDiv.id = "scanner-sugerencias";
        sugerenciasDiv.className = "absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-blue-300 max-h-80 overflow-y-auto";
        scannerInput.parentElement.style.position = "relative";
        scannerInput.parentElement.appendChild(sugerenciasDiv);
    }

    sugerenciasDiv.innerHTML = productos.map(p => `
        <div class="sugerencia-item px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors" data-codigo="${p.prod_codigo}">
            <div class="flex items-center gap-3">
                <img src="${p.prod_imagen ? `/storage/${p.prod_imagen}` : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%23e5e7eb" width="100%25" height="100%25"/%3E%3C/svg%3E'}" 
                     class="w-10 h-10 object-cover rounded-lg border border-gray-200">
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm text-gray-800 truncate">${p.prod_nombre}</p>
                    <p class="text-xs font-mono text-blue-600">${p.prod_codigo}</p>
                </div>
                <span class="text-sm font-bold text-emerald-600">Q${parseFloat(p.prod_precio_venta || 0).toFixed(2)}</span>
            </div>
        </div>
    `).join('');

    sugerenciasDiv.querySelectorAll('.sugerencia-item').forEach(item => {
        item.addEventListener('click', () => {
            const codigo = item.dataset.codigo;
            scannerInput.value = codigo;
            buscarProductoPorCodigo(codigo);
            ocultarSugerenciasScanner();
        });
    });
};

const ocultarSugerenciasScanner = () => {
    const sugerenciasDiv = document.getElementById("scanner-sugerencias");
    if (sugerenciasDiv) {
        sugerenciasDiv.remove();
    }
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('#scannerInput') && !e.target.closest('#scanner-sugerencias')) {
        ocultarSugerenciasScanner();
    }
});

const buscarProductoPorCodigo = async (codigo) => {
    codigo = normalizarCodigo(codigo);

    console.log("=== INICIANDO BÚSQUEDA ===");
    console.log("Código:", codigo, "| Longitud:", codigo.length);

    if (!codigo) {
        console.log("❌ Código vacío");
        scannerStatus.textContent = "● Código vacío";
        scannerStatus.className = "text-sm font-semibold text-red-600";
        limpiarFeedbackScanner();
        scannerInput.focus();
        return;
    }

    // Limpiar feedback previo
    limpiarFeedbackScanner();

    scannerStatus.textContent = "● Buscando...";
    scannerStatus.className = "text-sm font-semibold text-amber-600";

    try {
        const r = await fetch("/productos/buscar-codigo", {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ codigo }),
        });

        if (!r.ok) {
            throw new Error(`HTTP ${r.status}`);
        }

        const j = await r.json();
        console.log("📦 Respuesta:", j);

        if (j.success && j.encontrado) {
            console.log("✅ PRODUCTO ENCONTRADO - Abriendo modal");
            const p = j.producto;

            scannerStatus.textContent = "● Encontrado";
            scannerStatus.className = "text-sm font-semibold text-green-600";

            // Abrir modal directamente SIN mostrar feedback
            abrirModalActualizarStock(p);

            // Limpiar después de un momento
            setTimeout(() => {
                limpiarFeedbackScanner();
                scannerStatus.textContent = "● Listo";
                scannerStatus.className = "text-sm font-semibold text-emerald-600";
            }, 1000);

        } else {
            console.log("❌ PRODUCTO NO ENCONTRADO");

            scannerStatus.textContent = "● No encontrado";
            scannerStatus.className = "text-sm font-semibold text-red-600";

            await preguntarCrearProducto(codigo);

            // Limpiar después del Swal
            limpiarFeedbackScanner();
            setTimeout(() => {
                scannerStatus.textContent = "● Listo";
                scannerStatus.className = "text-sm font-semibold text-emerald-600";
            }, 300);
        }

    } catch (e) {
        console.error("💥 Error:", e);

        scannerStatus.textContent = "● Error";
        scannerStatus.className = "text-sm font-semibold text-red-600";

        await Swal.fire({
            icon: "error",
            title: "Error de conexión",
            text: "No se pudo conectar con el servidor",
            timer: 2500,
            showConfirmButton: false
        });

        limpiarFeedbackScanner();
        setTimeout(() => {
            scannerStatus.textContent = "● Listo";
            scannerStatus.className = "text-sm font-semibold text-emerald-600";
        }, 300);
    } finally {
        setTimeout(() => {
            scannerInput.focus();
            console.log("🎯 Scanner re-enfocado");
        }, 100);
    }
};


const normalizarCodigo = (codigo) => {
    return codigo
        .trim()
        .replace(/[\r\n]/g, '') // Quitar saltos de línea
        .replace(/[''`´]/g, '-') // Reemplazar comillas por guion
        .replace(/\s+/g, '-')    // Reemplazar espacios por guion
        .toUpperCase();          // Uniformar a mayúsculas
};

// Nueva función para limpiar el feedback del scanner
const limpiarFeedbackScanner = () => {
    scannerNombreWrap?.classList.add("hidden");
    scannerBtnImprimir?.classList.add("hidden");
    scannerBtnEditar?.classList.add("hidden");
    if (scannerNombre) scannerNombre.textContent = "";
};

const preguntarCrearProducto = async (codigo) => {
    const result = await Swal.fire({
        title: "Producto no encontrado",
        html: `<p class="text-gray-600 mb-2">El código <strong class="font-mono text-blue-600">${codigo}</strong> no existe.</p><p class="text-gray-600">¿Deseas crear un nuevo producto?</p>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, crear",
        cancelButtonText: "No",
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#6b7280",
    });

    window.codigoEnProceso = false;
    console.log("🔓 Flag liberado después de Swal");

    if (result.isConfirmed) {
        abrirModalCrearProducto(codigo);
    } else {
        // Resetear scanner cuando cancela
        setTimeout(() => {
            resetearScanner();
            limpiarFeedbackScanner();
        }, 100);
    }
};


// ========================= CARGA LISTA =========================
const cargarProductos = async (categoriaId = "") => {
    try {
        const r = await fetch("/productos/ObtenerDatosAPI" + (categoriaId ? `?categoria=${categoriaId}` : ""), {
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });
        const j = await r.json();

        if (j.codigo == 1) {
            productosData = j.data || [];
            actualizarEstadisticas(j.estadisticas);
            renderizarProductos(productosData);
        } else {
            productosData = [];
            renderizarProductos([]);
        }
    } catch (e) {
        console.error(e);
        productosData = [];
        renderizarProductos([]);
    }
};

const actualizarEstadisticas = (s) => {
    if (!s) return;
    document.getElementById("total-productos").textContent = s.total || 0;
    document.getElementById("stat-stock-bajo").textContent = s.stock_bajo || 0;
    document.getElementById("stat-sin-stock").textContent = s.sin_stock || 0;
};

// ========================= RENDER CARDS MEJORADAS =========================
const renderizarProductos = (productos) => {
    productosGrid.innerHTML = "";

    if (!productos.length) {
        emptyState.classList.remove("hidden");
        productosGrid.classList.add("hidden");
        document.getElementById("productos-mostrados").textContent = "0 productos";
        return;
    }

    emptyState.classList.add("hidden");
    productosGrid.classList.remove("hidden");
    document.getElementById("productos-mostrados").textContent = `${productos.length} productos`;

    productos.forEach(p => productosGrid.appendChild(crearCardProducto(p)));
};

const crearCardProducto = (p) => {
    const div = document.createElement("div");

    const stock = Number(p.prod_stock_actual || 0);
    const minimo = Number(p.prod_stock_minimo || 0);
    const categoria = (p?.tipo?.tprod_nombre || "Sin categoría");
    const nombre = (p.prod_nombre || "(Sin nombre)");
    const precio = Number(p.prod_precio_venta || 0);
    const codigo = (p.prod_codigo || "");
    const tieneCodigo = !!codigo;

    const img = p.prod_imagen
        ? `/storage/${p.prod_imagen}`
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect width="100%25" height="100%25" fill="%23f8fafc"/%3E%3Ctext x="50%25" y="52%25" text-anchor="middle" font-size="12" fill="%2394a3b8"%3ESin imagen%3C/text%3E%3C/svg%3E';

    const estadoClase =
        stock === 0 ? "bg-red-100 text-red-700 border-red-300" :
        stock <= minimo ? "bg-amber-100 text-amber-700 border-amber-300" :
        "bg-emerald-100 text-emerald-700 border-emerald-300";

    const estadoTexto =
        stock === 0 ? "Agotado" :
        stock <= minimo ? "Stock bajo" :
        "En stock";

    div.className =
        "bg-white rounded-xl border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden h-full";

    div.innerHTML = `
      <!-- Imagen -->
      <div class="w-full h-[150px] bg-gray-50 flex items-center justify-center overflow-hidden relative">
          <img
              src="${img}"
              alt="${nombre}"
              class="w-full h-full max-w-[130px] max-h-[130px] object-contain mx-auto"
              onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'160\\' height=\\'160\\'%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' fill=\\'%23f8fafc\\'/%3E%3Ctext x=\\'50%25\\' y=\\'52%25\\' text-anchor=\\'middle\\' font-size=\\'12\\' fill=\\'%2394a3b8\\'%3ESin imagen%3C/text%3E%3C/svg%3E'">
          ${!tieneCodigo ? `<span class="absolute top-1 left-1 text-[10px] font-bold px-1 py-0.5 rounded bg-amber-500 text-white shadow-sm">SIN CÓDIGO</span>` : ""}
      </div>

      <!-- Contenido -->
      <div class="flex flex-col justify-between flex-1 px-3 py-2">
          <div class="flex justify-between items-center mb-1">
              <span class="text-[11px] text-gray-500 font-medium truncate">${categoria}</span>
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border ${estadoClase}">${estadoTexto}</span>
          </div>

          <h3 class="text-[13px] font-semibold text-gray-800 leading-tight line-clamp-2 min-h-[2.2rem]">${nombre}</h3>

          <div class="flex justify-between items-center text-[11px] mt-1">
              <span class="text-gray-500">Stock:</span>
              <span class="font-semibold ${stock === 0 ? 'text-red-600' : stock <= minimo ? 'text-amber-600' : 'text-gray-700'}">${stock} un.</span>
          </div>

          <div class="text-emerald-700 font-black text-sm mt-1">Q${precio.toFixed(2)}</div>

          <!-- Código y botones -->
          <div class="flex items-center justify-between bg-gray-50 rounded-md px-1.5 py-1 mt-2 border border-gray-100">
              <span class="text-[10px] font-mono text-gray-700 truncate flex-1 mr-1">${tieneCodigo ? codigo : "Sin código"}</span>
              <div class="flex gap-1">
                  <button type="button"
                      class="p-1 rounded hover:bg-white transition"
                      title="Imprimir etiqueta"
                      data-action="imprimir-barcode"
                      data-codigo="${codigo}"
                      data-nombre="${nombre}"
                      ${!tieneCodigo ? "disabled" : ""}>
                      <svg class="w-3.5 h-3.5 ${tieneCodigo ? "text-gray-600 hover:text-blue-600" : "text-gray-300"}"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                      </svg>
                  </button>
                  <button type="button"
                      class="p-1 rounded hover:bg-white transition"
                      title="Modificar producto"
                      data-action="editar-producto"
                      data-id="${p.prod_id}">
                      <svg class="w-3.5 h-3.5 text-gray-600 hover:text-emerald-600"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                  </button>
              </div>
          </div>
      </div>
    `;

    // Eventos
    div.querySelector('[data-action="imprimir-barcode"]')?.addEventListener("click", (e) => {
        const btn = e.currentTarget;
        if (!btn.disabled) {
            window.imprimirCodigoBarras(btn.dataset.codigo, btn.dataset.nombre);
        }
    });

    div.querySelector('[data-action="editar-producto"]')?.addEventListener("click", (e) => {
        window.abrirModalStock(e.currentTarget.dataset.id);
    });

    return div;
};


// ========================= BÚSQUEDA MEJORADA =========================
const buscarProductos = (t) => {
    const q = (t || "").toLowerCase().trim();

    if (!q) {
        renderizarProductos(productosData);
        return;
    }

    const arr = productosData.filter(p => {
        const nombre = (p.prod_nombre || "").toLowerCase();
        const codigo = (p.prod_codigo || "").toLowerCase();
        const categoria = (p?.tipo?.tprod_nombre || "").toLowerCase();
        return nombre.includes(q) || codigo.includes(q) || categoria.includes(q);
    });

    renderizarProductos(arr);
};

// ========================= FILTROS =========================
const filtrarPorCategoria = (id) => {
    categoriaActual = id;
    document.querySelectorAll(".categoria-btn").forEach(b => {
        b.className = (b.dataset.categoria === id)
            ? "categoria-btn w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-semibold shadow-sm hover:shadow-md"
            : "categoria-btn w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 hover:bg-gray-50 border-2 border-transparent hover:border-emerald-300 hover:shadow-sm group";
    });

    if (searchBox) searchBox.value = "";
    cargarProductos(id);
};

// ========================= MODAL GESTIONAR =========================
const abrirModalActualizarStock = (p) => {
    productoActual = p;

    document.getElementById("update_prod_id").value = p.prod_id;
    document.getElementById("update_prod_nombre").textContent = p.prod_nombre || "(Sin nombre)";
    document.getElementById("update_prod_codigo").textContent = p.prod_codigo || "Sin código";
    document.getElementById("update_prod_descripcion").textContent = p.prod_descripcion || "Sin descripción";
    document.getElementById("update_stock_actual").textContent = p.prod_stock_actual;
    document.getElementById("update_precio_venta").textContent = "Q" + parseFloat(p.prod_precio_venta || 0).toFixed(2);

    const imgSrc = p.prod_imagen
        ? `/storage/${p.prod_imagen}`
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100%25" height="100%25" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%236b7280"%3ESin imagen%3C/text%3E%3C/svg%3E';

    document.getElementById("update_prod_imagen").src = imgSrc;

    document.getElementById("update_cantidad").value = 1;
    document.getElementById("update_motivo").value = "";
    document.getElementById("update_tipo_movimiento").value = "entrada";

    const btnDel = document.getElementById("btnEliminarProducto");
    if (btnDel) {
        btnDel.disabled = parseInt(p.prod_stock_actual || 0) !== 0;
        btnDel.classList.toggle("opacity-50", btnDel.disabled);
        btnDel.onclick = () => window.eliminarProducto(p.prod_id);
    }

    llenarDatosEdicionQuick(p);
    cambiarTab("stock");

    document.querySelectorAll(".accion-btn").forEach(btn => {
        btn.className = (btn.dataset.accion === "entrada")
            ? "accion-btn px-5 py-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold transition hover:bg-emerald-100 hover:shadow-md flex items-center justify-center gap-2"
            : "accion-btn px-5 py-4 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold transition hover:bg-gray-50 hover:shadow-md flex items-center justify-center gap-2";
    });

    calcularPreviewStock();
    document.getElementById("modalActualizarStock").classList.remove("hidden");
};

const llenarDatosEdicionQuick = (p) => {
    document.getElementById("edit_quick_prod_id").value = p.prod_id;
    document.getElementById("edit_quick_prod_nombre").value = p.prod_nombre || "";
    document.getElementById("edit_quick_prod_descripcion").value = p.prod_descripcion || "";
    document.getElementById("edit_quick_prod_codigo").value = p.prod_codigo || "Sin código";
    document.getElementById("edit_quick_tprod_id").value = p.tprod_id;
    document.getElementById("edit_quick_prod_precio_compra").value = p.prod_precio_compra ?? "";
    document.getElementById("edit_quick_prod_precio_venta").value = p.prod_precio_venta ?? "";
    document.getElementById("edit_quick_prod_stock_minimo").value = p.prod_stock_minimo ?? 0;
    document.getElementById("edit_quick_prod_stock_actual").value = p.prod_stock_actual ?? 0;

    const prev = document.getElementById("edit_quick_preview");
    const imgSrc = p.prod_imagen
        ? `/storage/${p.prod_imagen}`
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100%25" height="100%25" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%236b7280"%3ESin imagen%3C/text%3E%3C/svg%3E';
    prev.src = imgSrc;
};

const cambiarTab = (tab) => {
    const ts = document.getElementById("tabStock");
    const te = document.getElementById("tabEditar");
    const cs = document.getElementById("contenidoStock");
    const ce = document.getElementById("contenidoEditar");
    if (tab === "stock") {
        ts.className = "tab-btn flex-1 px-6 py-3 font-semibold text-emerald-600 border-b-2 border-emerald-600 transition";
        te.className = "tab-btn flex-1 px-6 py-3 font-semibold text-gray-500 hover:text-gray-700 transition";
        cs.classList.remove("hidden"); ce.classList.add("hidden");
    } else {
        te.className = "tab-btn flex-1 px-6 py-3 font-semibold text-blue-600 border-b-2 border-blue-600 transition";
        ts.className = "tab-btn flex-1 px-6 py-3 font-semibold text-gray-500 hover:text-gray-700 transition";
        ce.classList.remove("hidden"); cs.classList.add("hidden");
    }
};

const calcularPreviewStock = () => {
    const actual = parseInt(productoActual?.prod_stock_actual || 0);
    const cant = parseInt(document.getElementById("update_cantidad").value || 0);
    const tipo = document.getElementById("update_tipo_movimiento").value;
    const nuevo = tipo === "entrada" ? actual + cant : Math.max(0, actual - cant);
    document.getElementById("preview-nuevo-stock").textContent = nuevo;
};

const cambiarTipoMovimiento = (tipo) => {
    document.getElementById("update_tipo_movimiento").value = tipo;
    document.querySelectorAll(".accion-btn").forEach(btn => {
        if (btn.dataset.accion === tipo) {
            const color = tipo === "entrada" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-500 bg-red-50 text-red-700";
            btn.className = "accion-btn px-5 py-4 rounded-xl border-2 " + color + " font-bold transition flex items-center justify-center gap-2";
        } else {
            btn.className = "accion-btn px-5 py-4 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold transition hover:bg-gray-50 hover:shadow-md flex items-center justify-center gap-2";
        }
    });
    calcularPreviewStock();
};

const guardarMovimientoStock = async (e) => {
    e.preventDefault();
    const prodId = document.getElementById("update_prod_id").value;
    const cantidad = parseInt(document.getElementById("update_cantidad").value);
    const motivo = document.getElementById("update_motivo").value;
    const tipo = document.getElementById("update_tipo_movimiento").value;

    if (!cantidad || cantidad <= 0) {
        await Swal.fire({ icon: "warning", title: "Cantidad inválida", text: "Debe ingresar una cantidad válida" });
        return;
    }

    setBtnLoading(document.getElementById("btnConfirmarStock"), true, "Guardando...");
    Loader.show("Actualizando stock...");

    try {
        const r = await fetch(`/productos/${prodId}/entrada-stock`, {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                cantidad: tipo === "entrada" ? cantidad : -cantidad,
                motivo: motivo || (tipo === "entrada" ? "Entrada de mercadería" : "Salida de mercadería")
            }),
        });
        const j = await r.json();

        if (j.success) {
            await Swal.fire({
                icon: "success",
                title: "¡Stock actualizado!",
                html: `<p class="text-gray-600 mb-2">${productoActual.prod_nombre}</p>
                       <div class="flex justify-center items-center gap-3 text-lg">
                           <span class="font-bold text-gray-600">${j.stock_anterior}</span>
                           <span class="text-emerald-600">→</span>
                           <span class="font-bold text-emerald-600">${j.stock_nuevo}</span>
                       </div>`,
                timer: 2000, showConfirmButton: false
            });
            closeModal("modalActualizarStock");
            limpiarFeedbackScanner();
            await cargarProductos(categoriaActual);
            scannerInput.focus();
        } else {
            Swal.fire({ icon: "error", title: "Error", text: j.message || "No se pudo actualizar el stock" });
        }
    } catch (e) {
        console.error(e);
        Swal.fire({ icon: "error", title: "Error de conexión", text: "No se pudo conectar con el servidor" });
    } finally {
        Loader.hide();
        setBtnLoading(document.getElementById("btnConfirmarStock"), false);
    }
};

// Nueva función para resetear el scanner
const resetearScanner = () => {
    if (typeof window.codigoEnProceso !== 'undefined') {
        window.codigoEnProceso = false;
        console.log("🔄 Scanner reseteado manualmente");
    }
    if (scannerInput) {
        scannerInput.value = "";
        scannerInput.focus();
    }
};

document.getElementById("edit_quick_prod_imagen")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    const prev = document.getElementById("edit_quick_preview");
    if (f && prev) {
        const reader = new FileReader();
        reader.onload = (event) => {
            prev.src = event.target.result;
        };
        reader.readAsDataURL(f);
    }
});

const guardarEdicionQuick = async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit_quick_prod_id").value;

    const fd = new FormData();
    fd.append("prod_nombre", document.getElementById("edit_quick_prod_nombre").value);
    fd.append("prod_descripcion", document.getElementById("edit_quick_prod_descripcion").value);
    fd.append("tprod_id", document.getElementById("edit_quick_tprod_id").value);
    fd.append("prod_precio_compra", document.getElementById("edit_quick_prod_precio_compra").value || 0);
    fd.append("prod_precio_venta", document.getElementById("edit_quick_prod_precio_venta").value || 0);
    fd.append("prod_stock_minimo", document.getElementById("edit_quick_prod_stock_minimo").value || 0);

    const imgFile = document.getElementById("edit_quick_prod_imagen").files?.[0];
    if (imgFile) fd.append("prod_imagen", imgFile);

    fd.append("_method", "PUT");

    try {
        setBtnLoading(document.getElementById("btnGuardarEdicionQuick"), true, "Guardando...");
        Loader.show("Actualizando producto...");

        const r = await fetch("/productos/" + id, {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json"
            },
            body: fd
        });
        const j = await r.json();

        if (j.success) {
            await Swal.fire({
                icon: "success",
                title: "¡Producto actualizado!",
                timer: 1800,
                showConfirmButton: false
            });
            closeModal("modalActualizarStock");
            limpiarFeedbackScanner();
            await cargarProductos(categoriaActual);
            scannerInput.focus();
        } else {
            Swal.fire("Error", j.message || "No se pudo actualizar", "error");
        }
    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Fallo de conexión", "error");
    } finally {
        Loader.hide();
        setBtnLoading(document.getElementById("btnGuardarEdicionQuick"), false);
    }
};

// ========================= CREAR PRODUCTO =========================
const abrirModalCrearProducto = (codigo) => {
    const form = document.getElementById("formCrearProducto");
    form.reset();

    const hidden = document.getElementById("crear_prod_codigo");
    const fila = document.getElementById("fila_codigo_creado");
    const vis = document.getElementById("crear_prod_codigo_visible");

    hidden.value = "";
    fila?.classList.add("hidden");
    if (codigo) {
        hidden.value = codigo;
        if (vis && fila) {
            vis.value = codigo;
            fila.classList.remove("hidden");
        }
    }

    document.getElementById("modalCrearProducto").classList.remove("hidden");
};

const crearProductoNuevo = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    setBtnLoading(document.getElementById("btnCrearProducto"), true, "Creando...");
    Loader.show("Creando producto...");

    try {
        const r = await fetch("/productos", {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
            body: fd,
        });
        const j = await r.json();

        if (j.success) {
            await Swal.fire({
                icon: "success",
                title: "¡Producto creado!",
                html: `<div class="text-left">
                        <p><strong>${j.producto.prod_nombre}</strong></p>
                        <p class="font-mono text-sm text-gray-700 mt-1">Código: ${j.producto.prod_codigo}</p>
                       </div>`,
                showCancelButton: true,
                confirmButtonText: "Imprimir código",
                cancelButtonText: "Cerrar",
                confirmButtonColor: "#2563eb"
            }).then((res) => {
                if (res.isConfirmed) window.imprimirCodigoBarras(j.producto.prod_codigo, j.producto.prod_nombre);
            });

            closeModal("modalCrearProducto");
            limpiarFeedbackScanner();
            await cargarProductos(categoriaActual);
            scannerInput.focus();
        } else {
            Swal.fire({ icon: "error", title: "Error", text: j.message || "No se pudo crear el producto" });
        }
    } catch (e) {
        console.error(e);
        Swal.fire({ icon: "error", title: "Error de conexión", text: "No se pudo conectar con el servidor" });
    } finally {
        Loader.hide();
        setBtnLoading(document.getElementById("btnCrearProducto"), false);
    }
};

// ========================= FUNCIONES GLOBALES =========================
window.abrirModalStock = async (id) => {
    try {
        const r = await fetch("/productos/" + id, {
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });
        const j = await r.json();
        if (j.success && j.producto) abrirModalActualizarStock(j.producto);
    } catch (e) {
        console.error(e);
    }
};

window.imprimirCodigoBarras = (codigo, nombre) => {
    if (!codigo) {
        Swal.fire({ icon: "warning", title: "Sin código", text: "Este producto no tiene código para imprimir" });
        return;
    }

    const w = window.open("", "_blank", "width=400,height=600");
    const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Código de Barras - ${nombre}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f3f4f6;padding:20px}
    .etiqueta{background:#fff;border:2px dashed #d1d5db;border-radius:8px;padding:20px;text-align:center;max-width:350px}
    .nombre{font-size:16px;font-weight:bold;color:#1f2937;margin-bottom:15px;line-height:1.4}
    .codigo-container{margin:20px 0}.codigo-barras{width:100%;max-width:300px;height:auto;margin:0 auto;display:block}
    .codigo-texto{font-family:'Courier New',monospace;font-size:18px;font-weight:bold;color:#374151;margin-top:10px;letter-spacing:2px}
    .instrucciones{margin-top:20px;padding:10px;background:#fef3c7;border-radius:6px;font-size:12px;color:#92400e}
    @media print{body{background:#fff;padding:0}.etiqueta{border:none;max-width:100%}.instrucciones{display:none}}</style>
    </head><body>
      <div class="etiqueta">
        <div class="nombre">${nombre || ""}</div>
        <div class="codigo-container">
          <img src="/productos/barcode/${encodeURIComponent(codigo)}" alt="Código de barras" class="codigo-barras"
               onerror="this.style.display='none'; document.querySelector('.error-msg').style.display='block';">
          <div class="error-msg" style="display:none; color:red; margin-top:10px;">Error al generar código de barras</div>
          <div class="codigo-texto">${codigo}</div>
        </div>
        <div class="instrucciones">💡 Presiona Ctrl+P o Cmd+P para imprimir</div>
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => window.print(), 500);
        };
        
        window.onafterprint = () => {
          window.close();
        };
      </script>
    </body></html>`;

    w.document.write(html);
    w.document.close();

};


window.generarCodigoProducto = async (id) => {
    try {
        Loader.show("Generando código...");
        const r = await fetch(`/productos/${id}/asignar-codigo`, {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            }
        });
        const j = await r.json();
        if (j.success) {
            await Swal.fire({
                icon: "success",
                title: "Código creado",
                html: `<p class="font-mono text-sm">Nuevo: ${j.producto.prod_codigo}</p>`,
                showCancelButton: true,
                confirmButtonText: "Imprimir",
                cancelButtonText: "Cerrar",
                confirmButtonColor: "#2563eb"
            }).then(res => {
                if (res.isConfirmed) window.imprimirCodigoBarras(j.producto.prod_codigo, j.producto.prod_nombre);
            });
            cargarProductos(categoriaActual);
        } else {
            Swal.fire("Atención", j.message || "No se pudo generar el código", "warning");
        }
    } catch (e) {
        Swal.fire("Error", "Fallo de conexión", "error");
    } finally {
        Loader.hide();
    }
};

window.eliminarProducto = async (id) => {
    const ok = await Swal.fire({
        icon: "warning",
        title: "Eliminar producto",
        text: "Esta acción dará de baja el producto. ¿Continuar?",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626"
    });
    if (!ok.isConfirmed) return;

    try {
        Loader.show("Eliminando...");
        const r = await fetch(`/productos/${id}`, {
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });
        const j = await r.json();
        if (j.success) {
            await Swal.fire({
                icon: "success",
                title: "Producto eliminado",
                timer: 1500,
                showConfirmButton: false
            });
            closeModal("modalActualizarStock");
            cargarProductos(categoriaActual);
        } else {
            Swal.fire("Error", j.message || "No se pudo eliminar", "error");
        }
    } catch (e) {
        Swal.fire("Error", "Fallo de conexión", "error");
    } finally {
        Loader.hide();
    }
};

// ========================= FOCO & INIT =========================
const enfocarScanner = () => {
    const activo = document.activeElement;
    const modalStockAbierto = document.querySelector("#modalActualizarStock:not(.hidden)");
    const modalCrearAbierto = document.querySelector("#modalCrearProducto:not(.hidden)");

    if (scannerInput && !modalStockAbierto && !modalCrearAbierto) {
        const elementosQueNoDebenTenerFoco = ['input', 'textarea', 'select', 'button'];
        const tagName = activo?.tagName.toLowerCase();

        if (!activo || activo === document.body || !elementosQueNoDebenTenerFoco.includes(tagName)) {
            scannerInput.focus();
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();

    // Escuchar cuando se cierra cualquier modal
    document.addEventListener('modalClosed', (e) => {
        const modalId = e.detail.modalId;

        // Solo actuar si es uno de nuestros modales de productos
        if (modalId === 'modalActualizarStock' || modalId === 'modalCrearProducto') {
            setTimeout(() => {
                resetearScanner();
                limpiarFeedbackScanner();
            }, 100);
        }
    });

    // Exportar para que app.js pueda usarla si existe
    window.limpiarFeedbackScanner = limpiarFeedbackScanner;

    // === CONFIGURACIÓN MEJORADA DEL ESCÁNER ===
    if (scannerInput) {
        console.log("✅ Configurando escáner...");

        let timeoutBusqueda = null;

        // HACER GLOBAL para poder resetearlo desde otras funciones
        window.codigoEnProceso = false;

        // Listener ÚNICO para el escáner
        scannerInput.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                e.stopImmediatePropagation();

                if (timeoutBusqueda) {
                    clearTimeout(timeoutBusqueda);
                    timeoutBusqueda = null;
                }

                const codigo = scannerInput.value.trim().replace(/[\r\n]/g, '');
                console.log("✅ Enter detectado - Código:", codigo);
                console.log("📌 Flag codigoEnProceso:", window.codigoEnProceso);

                if (window.codigoEnProceso) {
                    console.log("⚠️ Búsqueda ya en proceso, ignorando...");
                    return;
                }

                if (codigo) {
                    window.codigoEnProceso = true;
                    console.log("🔒 Flag activado");
                    scannerInput.value = "";
                    ocultarSugerenciasScanner();

                    await buscarProductoPorCodigo(codigo);

                    // IMPORTANTE: Resetear después de un pequeño delay
                    setTimeout(() => {
                        window.codigoEnProceso = false;
                        console.log("🔓 Flag liberado");
                    }, 500);
                }
            }
        });

        // Búsqueda dinámica con debounce
        scannerInput.addEventListener("input", (e) => {
            const codigo = e.target.value.trim().replace(/[\r\n]/g, '');

            if (timeoutBusqueda) {
                clearTimeout(timeoutBusqueda);
            }

            if (codigo.length >= 3) {
                timeoutBusqueda = setTimeout(() => {
                    busquedaDinamicaScanner(codigo);
                }, 300);
            } else {
                ocultarSugerenciasScanner();
            }
        });

        setTimeout(() => {
            scannerInput.focus();
            console.log("🎯 Scanner enfocado");
        }, 800);
    }

    // Listener global para re-enfocar cuando la ventana recupera el foco
    let focusTimeout = null;
    window.addEventListener('focus', () => {
        // Cancelar timeout anterior si existe
        if (focusTimeout) {
            clearTimeout(focusTimeout);
        }

        // Debounce para evitar ejecuciones múltiples
        focusTimeout = setTimeout(() => {
            const modalStockAbierto = document.querySelector("#modalActualizarStock:not(.hidden)");
            const modalCrearAbierto = document.querySelector("#modalCrearProducto:not(.hidden)");

            if (scannerInput && !modalStockAbierto && !modalCrearAbierto) {
                resetearScanner();
                console.log("🎯 Scanner re-enfocado por evento focus");
            }

            focusTimeout = null;
        }, 300); // Esperar 300ms antes de ejecutar
    });

    // Event listeners
    searchBox?.addEventListener("input", (e) => buscarProductos(e.target.value));

    document.querySelectorAll(".categoria-btn").forEach(btn => {
        btn.addEventListener("click", () => filtrarPorCategoria(btn.dataset.categoria));
    });

    document.getElementById("formActualizarStock")?.addEventListener("submit", guardarMovimientoStock);
    document.getElementById("update_cantidad")?.addEventListener("input", calcularPreviewStock);

    document.querySelectorAll(".accion-btn").forEach(btn => {
        btn.addEventListener("click", () => cambiarTipoMovimiento(btn.dataset.accion));
    });

    document.getElementById("btnNuevoProducto")?.addEventListener("click", () => abrirModalCrearProducto());

    document.getElementById("btnFiltrarSinCodigo")?.addEventListener("click", () => {
        const sinCodigo = productosData.filter(p => !p.prod_codigo);
        renderizarProductos(sinCodigo);
        Swal.fire({
            icon: "info",
            title: "Productos sin código",
            text: `Mostrando ${sinCodigo.length} productos`,
            timer: 1800,
            showConfirmButton: false
        });
    });

    document.getElementById("formCrearProducto")?.addEventListener("submit", crearProductoNuevo);
    document.getElementById("formEditarProductoQuick")?.addEventListener("submit", guardarEdicionQuick);

    document.getElementById("tabStock")?.addEventListener("click", () => cambiarTab("stock"));
    document.getElementById("tabEditar")?.addEventListener("click", () => cambiarTab("editar"));

    setTimeout(enfocarScanner, 500);
});