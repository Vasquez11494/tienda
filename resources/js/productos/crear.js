import Swal from "sweetalert2";
import { closeModal, Loader, setBtnLoading } from "../app";

const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";

// Estado
let productosData = [];
let categoriaActual = "";
let productoActual = null;

// === CONFIGURACIÓN ROBUSTA DEL SCANNER ===
let scannerTimeout = null;
let isScannerProcessing = false;
let lastScannedCode = '';

// Elementos
const scannerInput = document.getElementById("scannerInput");
const scannerStatus = document.getElementById("scannerStatus");
const productosGrid = document.getElementById("productosGrid");
const emptyState = document.getElementById("emptyState");
const searchBox = document.getElementById("searchBox");

// ========================= ESCÁNER MEJORADO =========================
const setupScanner = () => {
    if (!scannerInput) return;

    console.log("🎯 Inicializando scanner...");

    // Limpiar listeners anteriores
    scannerInput.removeEventListener('keydown', handleScannerKeydown);
    scannerInput.removeEventListener('input', handleScannerInput);

    // Listener para ENTER (scanner físico)
    scannerInput.addEventListener('keydown', handleScannerKeydown);

    // Listener para input manual
    scannerInput.addEventListener('input', handleScannerInput);

    // Enfocar inmediatamente
    setTimeout(() => {
        scannerInput.focus();
        console.log("🎯 Scanner enfocado en init");
    }, 1000);
};

const handleScannerKeydown = async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();

        const code = scannerInput.value.trim();
        console.log("🔑 Enter detectado, código:", code);

        if (!code || code === lastScannedCode || isScannerProcessing) {
            console.log("⏸️  Código vacío, duplicado o en proceso - ignorando");
            scannerInput.value = '';
            return;
        }

        await processScannedCode(code);
    }
};

const handleScannerInput = (e) => {
    const code = e.target.value;

    // Debounce para búsqueda dinámica
    if (scannerTimeout) clearTimeout(scannerTimeout);

    scannerTimeout = setTimeout(() => {
        if (code.length >= 3 && !isScannerProcessing) {
            busquedaDinamicaScanner(code);
        } else if (code.length === 0) {
            ocultarSugerenciasScanner();
        }
    }, 300);
};

const processScannedCode = async (code) => {
    isScannerProcessing = true;
    lastScannedCode = code;

    console.log("🔄 Procesando código:", code);

    // Limpiar input inmediatamente
    scannerInput.value = '';
    scannerInput.blur(); // Quitar focus temporalmente

    // Mostrar estado de búsqueda
    scannerStatus.textContent = "● Buscando...";
    scannerStatus.className = "text-sm font-semibold text-amber-600";

    try {
        const normalizado = normalizarCodigo(code);
        const r = await fetch("/productos/buscar-codigo", {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ codigo: normalizado }),
        });

        const j = await r.json();

        if (j.success && j.encontrado) {
            scannerStatus.textContent = "● Encontrado ✓";
            scannerStatus.className = "text-sm font-semibold text-green-600";

            // Pequeño delay para feedback visual
            await new Promise(resolve => setTimeout(resolve, 500));

            abrirModalActualizarStock(j.producto);
        } else {
            scannerStatus.textContent = "● No encontrado";
            scannerStatus.className = "text-sm font-semibold text-red-600";

            // LLAMAR A LA NUEVA FUNCIÓN PARA PREGUNTAR SI CREAR
            await preguntarCrearProducto(normalizado);
        }
    } catch (error) {
        console.error("❌ Error scanner:", error);
        scannerStatus.textContent = "● Error conexión";
        scannerStatus.className = "text-sm font-semibold text-red-600";
    } finally {
        // Reset después de un delay
        setTimeout(() => {
            resetScannerState();
        }, 1000);
    }
};

const resetScannerState = () => {
    isScannerProcessing = false;
    scannerStatus.textContent = "● Listo";
    scannerStatus.className = "text-sm font-semibold text-emerald-600";

    // Re-enfocar el scanner
    setTimeout(() => {
        if (scannerInput && !isAnyModalOpen()) {
            scannerInput.focus();
            console.log("🎯 Scanner re-enfocado después de acción");
        }
    }, 200);
};

const isAnyModalOpen = () => {
    const modalStock = document.getElementById('modalActualizarStock');
    const modalCrear = document.getElementById('modalCrearProducto');

    return (modalStock && !modalStock.classList.contains('hidden')) ||
        (modalCrear && !modalCrear.classList.contains('hidden'));
};

// ========================= BÚSQUEDA DINÁMICA =========================
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
            // Usar el nuevo sistema de procesamiento
            processScannedCode(codigo);
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

const normalizarCodigo = (codigo) => {
    return codigo
        .trim()
        .replace(/[\r\n]/g, '')
        .replace(/[''`´]/g, '-')
        .replace(/\s+/g, '-')
        .toUpperCase();
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

    if (result.isConfirmed) {
        // Abrir modal de crear con el código pre-cargado
        abrirModalCrearProducto(codigo);
    } else {
        // Si cancela, resetear scanner
        setTimeout(() => {
            resetearScanner();
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
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect width="100%25" height="100%25" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="52%25" text-anchor="middle" font-size="12" fill="%2394a3b8"%3ESin imagen%3C/text%3E%3C/svg%3E';

    // Configuración de estados
    let estadoClase, estadoTexto, stockColor;
    if (stock === 0) {
        estadoClase = "bg-red-50 text-red-700 border-red-200";
        estadoTexto = "Agotado";
        stockColor = "text-red-600";
    } else if (stock <= minimo) {
        estadoClase = "bg-amber-50 text-amber-700 border-amber-200";
        estadoTexto = "Stock bajo";
        stockColor = "text-amber-600";
    } else {
        estadoClase = "bg-emerald-50 text-emerald-700 border-emerald-200";
        estadoTexto = "En stock";
        stockColor = "text-gray-700";
    }

    div.className = "card-supermercado";

    div.innerHTML = `
        <!-- Contenedor de imagen con fondo gradiente -->
        <div class="card-image-container">
            <img
                src="${img}"
                alt="${nombre}"
                class="card-image"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'160\\' height=\\'160\\'%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' fill=\\'%23f1f5f9\\'/%3E%3Ctext x=\\'50%25\\' y=\\'52%25\\' text-anchor=\\'middle\\' font-size=\\'12\\' fill=\\'%2394a3b8\\'%3ESin imagen%3C/text%3E%3C/svg%3E'">
            ${!tieneCodigo ? `<span class="absolute top-2 left-2 text-[8px] font-bold px-1.5 py-1 rounded bg-amber-500 text-white shadow-sm uppercase tracking-wide">Sin Código</span>` : ""}
        </div>

        <!-- Contenido del card -->
        <div class="card-content">
            <!-- Información superior -->
            <div class="mb-2">
                <div class="card-category">${categoria}</div>
                <span class="card-status ${estadoClase}">${estadoTexto}</span>
            </div>

            <!-- Nombre del producto -->
            <h3 class="card-name">${nombre}</h3>

            <!-- Detalles inferiores -->
            <div class="card-details">
                <!-- Stock y precio -->
                <div class="card-stock">
                    <span class="stock-label">Stock:</span>
                    <span class="stock-value ${stockColor}">${stock} un.</span>
                </div>

                <div class="card-price">Q${precio.toFixed(2)}</div>

                <!-- Solo acciones (sin código de texto) -->
                <div class="card-footer">
                    <div class="code-section">
                        <div class="card-actions">
                            <!-- Botón VER código de barras -->
                            <button type="button"
                                class="btn-action"
                                title="Ver código de barras"
                                data-action="ver-barcode"
                                data-codigo="${codigo}"
                                data-nombre="${nombre}"
                                ${!tieneCodigo ? "disabled" : ""}>
                                <svg class="w-3.5 h-3.5 ${tieneCodigo ? "text-gray-500 hover:text-purple-600" : "text-gray-300"}"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                            </button>

                            <!-- Botón IMPRIMIR código de barras -->
                            <button type="button"
                                class="btn-action"
                                title="Imprimir etiqueta"
                                data-action="imprimir-barcode"
                                data-codigo="${codigo}"
                                data-nombre="${nombre}"
                                ${!tieneCodigo ? "disabled" : ""}>
                                <svg class="w-3.5 h-3.5 ${tieneCodigo ? "text-gray-500 hover:text-blue-600" : "text-gray-300"}"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                                </svg>
                            </button>

                            <!-- Botón EDITAR producto -->
                            <button type="button"
                                class="btn-action"
                                title="Modificar producto"
                                data-action="editar-producto"
                                data-id="${p.prod_id}">
                                <svg class="w-3.5 h-3.5 text-gray-500 hover:text-emerald-600"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Event listener para VER código de barras
    div.querySelector('[data-action="ver-barcode"]')?.addEventListener("click", (e) => {
        const btn = e.currentTarget;
        if (!btn.disabled) {
            window.mostrarModalBarcode(btn.dataset.codigo, btn.dataset.nombre);
        }
    });

    // Event listener para IMPRIMIR código de barras
    div.querySelector('[data-action="imprimir-barcode"]')?.addEventListener("click", (e) => {
        const btn = e.currentTarget;
        if (!btn.disabled) {
            window.imprimirCodigoBarras(btn.dataset.codigo, btn.dataset.nombre);
        }
    });

    // Event listener para EDITAR producto
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
        if (!btnDel.disabled) {
            btnDel.onclick = () => eliminarProducto(p.prod_id);
        }
    }

    llenarDatosEdicionQuick(p);
    cambiarTab("stock");

    // RESET DE BOTONES DE ACCIÓN - CORREGIDO
    document.querySelectorAll(".accion-btn").forEach(btn => {
        if (btn.dataset.accion === "entrada") {
            btn.className = "accion-btn px-5 py-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold transition hover:bg-emerald-100 hover:shadow-md flex items-center justify-center gap-2";
        } else {
            btn.className = "accion-btn px-5 py-4 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold transition hover:bg-gray-50 hover:shadow-md flex items-center justify-center gap-2";
        }
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
        cs.classList.remove("hidden");
        ce.classList.add("hidden");
    } else {
        te.className = "tab-btn flex-1 px-6 py-3 font-semibold text-blue-600 border-b-2 border-blue-600 transition";
        ts.className = "tab-btn flex-1 px-6 py-3 font-semibold text-gray-500 hover:text-gray-700 transition";
        ce.classList.remove("hidden");
        cs.classList.add("hidden");
    }
};

const calcularPreviewStock = () => {
    const actual = parseInt(productoActual?.prod_stock_actual || 0);
    const cant = parseInt(document.getElementById("update_cantidad").value || 0);
    const tipo = document.getElementById("update_tipo_movimiento").value;
    const nuevo = tipo === "entrada" ? actual + cant : Math.max(0, actual - cant);
    document.getElementById("preview-nuevo-stock").textContent = nuevo;
};

// CORREGIDO - Función para cambiar tipo de movimiento
const cambiarTipoMovimiento = (tipo) => {
    console.log("🔄 Cambiando tipo movimiento a:", tipo);
    document.getElementById("update_tipo_movimiento").value = tipo;

    document.querySelectorAll(".accion-btn").forEach(btn => {
        if (btn.dataset.accion === tipo) {
            // Botón activo
            if (tipo === "entrada") {
                btn.className = "accion-btn px-5 py-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold transition hover:bg-emerald-100 hover:shadow-md flex items-center justify-center gap-2";
            } else {
                btn.className = "accion-btn px-5 py-4 rounded-xl border-2 border-red-500 bg-red-50 text-red-700 font-bold transition hover:bg-red-100 hover:shadow-md flex items-center justify-center gap-2";
            }
        } else {
            // Botón inactivo
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

    // Validar que no haya salida mayor al stock actual
    const stockActual = parseInt(productoActual?.prod_stock_actual || 0);
    if (tipo === "salida" && cantidad > stockActual) {
        await Swal.fire({
            icon: "error",
            title: "Stock insuficiente",
            text: `No puedes sacar ${cantidad} unidades. Stock actual: ${stockActual}`
        });
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
                timer: 2000,
                showConfirmButton: false
            });
            closeModal("modalActualizarStock");
            // ENFOQUE RÁPIDO DESPUÉS DE GUARDAR
            setTimeout(() => {
                resetearScanner();
                cargarProductos(categoriaActual);
            }, 100);
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

// Función para resetear el scanner
const resetearScanner = () => {
    if (scannerInput) {
        scannerInput.value = '';
        // ENFOQUE INMEDIATO
        setTimeout(() => {
            scannerInput.focus();
        }, 50);
    }
    isScannerProcessing = false;
    lastScannedCode = '';
    scannerStatus.textContent = "● Listo";
    scannerStatus.className = "text-sm font-semibold text-emerald-600";
    console.log("🔄 Scanner reseteado completamente");
};

// CORREGIDO - Función de eliminar producto
const eliminarProducto = async (id) => {
    const producto = productosData.find(p => p.prod_id == id);
    if (!producto) return;

    const result = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar producto?",
        html: `<p class="text-gray-600">Vas a eliminar: <strong>${producto.prod_nombre}</strong></p>
               <p class="text-sm text-red-600 mt-2">⚠️ Esta acción no se puede deshacer</p>`,
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280"
    });

    if (!result.isConfirmed) return;

    try {
        Loader.show("Eliminando producto...");
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
            // ENFOQUE RÁPIDO DESPUÉS DE ELIMINAR
            setTimeout(() => {
                resetearScanner();
                cargarProductos(categoriaActual);
            }, 100);
        } else {
            Swal.fire("Error", j.message || "No se pudo eliminar el producto", "error");
        }
    } catch (e) {
        console.error("Error eliminando:", e);
        Swal.fire("Error", "Fallo de conexión al eliminar", "error");
    } finally {
        Loader.hide();
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
            // ENFOQUE RÁPIDO DESPUÉS DE EDITAR
            setTimeout(() => {
                resetearScanner();
                cargarProductos(categoriaActual);
            }, 100);
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
const abrirModalCrearProducto = (codigo = "") => {
    const form = document.getElementById("formCrearProducto");
    form?.reset();

    resetearOpcionesCodigo();

    if (codigo) {

        document.getElementById('seccionOpcionesCodigo').classList.add('hidden');
        document.getElementById('seccionFormularioProducto').classList.remove('hidden');
        document.getElementById('crear_prod_codigo').value = codigo;

        document.getElementById('textoCodigoAsignado').textContent = `Código escaneado: ${codigo}`;
        document.getElementById('infoCodigoSeleccionado').classList.remove('hidden');
    } else {
        // Si no hay código escaneado, mostrar las 2 opciones disponibles
        document.getElementById('seccionOpcionesCodigo').classList.remove('hidden');
    }

    document.getElementById("modalCrearProducto").classList.remove("hidden");
};

// ========================= GESTIÓN DE OPCIONES DE CÓDIGO =========================
let opcionCodigoSeleccionada = null;
let codigoAsignado = '';


const configurarModalCreacion = () => {

    // Opción 1: Generar automático
    document.getElementById('btnGenerarAuto')?.addEventListener('click', () => {
        seleccionarOpcionCodigo('auto', '');
    });

    // Opción 2: Ingresar manual
    document.getElementById('btnIngresarManual')?.addEventListener('click', () => {
        mostrarCampoManual();
    });

    document.getElementById('btnConfirmarManual')?.addEventListener('click', () => {
        const codigoManual = document.getElementById('inputCodigoManual').value.trim();
        if (codigoManual) {
            seleccionarOpcionCodigo('manual', codigoManual);
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Código vacío',
                text: 'Por favor ingresa un código válido',
                confirmButtonColor: '#2563eb'
            });
        }
    });

    document.getElementById('btnCambiarOpcion')?.addEventListener('click', () => {
        resetearOpcionesCodigo();
    });
};

const seleccionarOpcionCodigo = (opcion, codigo) => {
    opcionCodigoSeleccionada = opcion;

    switch (opcion) {
        case 'escaner':
            codigoAsignado = codigo;
            mostrarInfoCodigo(`Código escaneado: ${codigo}`);
            break;

        case 'auto':
            codigoAsignado = 'AUTO-GENERAR';
            mostrarInfoCodigo('Se generará un código automáticamente');
            break;

        case 'manual':
            codigoAsignado = codigo;
            mostrarInfoCodigo(`Código manual: ${codigo}`);
            break;
    }

    // OCULTAR OPCIONES después de seleccionar cualquier método
    document.getElementById('seccionOpcionesCodigo').classList.add('hidden');
    document.getElementById('campoCodigoManual').classList.add('hidden');
    document.getElementById('seccionFormularioProducto').classList.remove('hidden');
    document.getElementById('crear_prod_codigo').value = codigoAsignado;
};

const mostrarCampoManual = () => {
    document.getElementById('campoCodigoManual').classList.remove('hidden');
    document.getElementById('inputCodigoManual').focus();

    document.getElementById('previewCodigoManual').textContent = '';
};

document.getElementById('inputCodigoManual')?.addEventListener('input', (e) => {
    const codigo = e.target.value.trim();
    document.getElementById('previewCodigoManual').textContent = codigo || '-';
});

const mostrarInfoCodigo = (mensaje) => {
    document.getElementById('textoCodigoAsignado').textContent = mensaje;
    document.getElementById('infoCodigoSeleccionado').classList.remove('hidden');
};

const resetearOpcionesCodigo = () => {
    opcionCodigoSeleccionada = null;
    codigoAsignado = '';

    // SOLO mostrar opciones si no venimos del escáner
    const codigoEscaneado = document.getElementById('scannerInput').value.trim();
    if (!codigoEscaneado) {
        document.getElementById('seccionOpcionesCodigo').classList.remove('hidden');
    }

    document.getElementById('seccionFormularioProducto').classList.add('hidden');
    document.getElementById('infoCodigoSeleccionado').classList.add('hidden');
    document.getElementById('campoCodigoManual').classList.add('hidden');
    document.getElementById('inputCodigoManual').value = '';
    document.getElementById('crear_prod_codigo').value = '';
};

const crearProductoNuevo = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    // Si se seleccionó "generar automático", enviar campo vacío
    if (opcionCodigoSeleccionada === 'auto') {
        fd.set('prod_codigo', ''); // Enviar vacío para que el backend genere
    }

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
            setTimeout(() => {
                resetearScanner();
                cargarProductos(categoriaActual);
            }, 100);
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


// Función para mostrar el modal con el código de barras (formato descargable)
window.mostrarModalBarcode = (codigo, nombre) => {
    if (!codigo) {
        Swal.fire({ icon: "warning", title: "Sin código", text: "Este producto no tiene código para mostrar" });
        return;
    }

    // Crear el HTML del modal con el formato específico
    const modalHTML = `
    <div id="modalBarcode" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <!-- Header -->
            <div class="flex justify-between items-center p-4 border-b">
                <h3 class="text-lg font-semibold text-gray-800">Código de Barras</h3>
                <button type="button" id="cerrarModalBarcode" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- Contenido - Formato igual a la impresión -->
            <div class="p-6">
                <div class="text-center">
                    <!-- Nombre del producto -->
                    <h4 class="text-lg font-bold text-gray-900 mb-3 leading-tight">${nombre || "Producto"}</h4>

                    <!-- Contenedor del código de barras (igual al de impresión) -->
                    <div class="bg-white p-4 border border-gray-300 rounded mb-4" id="barcode-container">
                        <img src="/productos/barcode/${encodeURIComponent(codigo)}"
                             alt="Código de barras"
                             class="w-full h-auto mx-auto mb-2"
                             id="barcode-image"
                             onerror="this.style.display='none'; document.getElementById('errorBarcode').style.display='block';">

                        <div id="errorBarcode" style="display: none;" class="text-red-500 text-sm mb-2">
                            Error al cargar el código de barras
                        </div>

                        <!-- Código numérico centrado -->
                        <div class="font-mono text-xl font-bold text-gray-900 text-center tracking-wider mt-2">
                            ${codigo}
                        </div>
                    </div>

                    <!-- Botones de acción -->
                    <div class="flex flex-col space-y-3">
                        <button type="button" id="descargarBarcode" class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center transition-colors">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                            Descargar Imagen
                        </button>

                        <button type="button" id="imprimirBarcode" class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                            </svg>
                            Imprimir
                        </button>

                        <button type="button" id="cerrarModal" class="w-full px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    // Insertar el modal en el body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Obtener referencias a los elementos del modal
    const modal = document.getElementById('modalBarcode');
    const btnCerrar = document.getElementById('cerrarModalBarcode');
    const btnCerrar2 = document.getElementById('cerrarModal');
    const btnImprimir = document.getElementById('imprimirBarcode');
    const btnDescargar = document.getElementById('descargarBarcode');

    // Función para cerrar el modal
    const cerrarModal = () => {
        modal.remove();
    };

    // Función para descargar la imagen del código de barras CON NOMBRE
    const descargarImagenBarcode = async () => {
        try {
            const barcodeImage = document.getElementById('barcode-image');

            // Esperar a que la imagen se cargue completamente
            if (barcodeImage.complete && barcodeImage.naturalHeight !== 0) {
                // Crear un contenedor temporal para la imagen completa
                const tempContainer = document.createElement('div');
                tempContainer.style.cssText = `
                    position: fixed;
                    left: -10000px;
                    top: -10000px;
                    width: 400px;
                    background: white;
                    padding: 20px;
                    text-align: center;
                    border: 1px solid #ccc;
                    font-family: Arial, sans-serif;
                `;

                // Construir el contenido igual al formato de impresión
                tempContainer.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 18px; font-weight: bold; color: #1f2937; line-height: 1.4;">${nombre || "Producto"}</div>
                    </div>
                    <div style="margin: 20px 0;">
                        <img src="${barcodeImage.src}"
                             alt="Código de barras"
                             style="width: 100%; height: auto; display: block; margin: 0 auto 10px;">
                        <div style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #374151; margin-top: 10px; letter-spacing: 2px;">
                            ${codigo}
                        </div>
                    </div>
                `;

                document.body.appendChild(tempContainer);

                // Usar html2canvas para capturar la imagen
                const html2canvasScript = document.createElement('script');
                html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                html2canvasScript.onload = () => {
                    html2canvas(tempContainer, {
                        scale: 2, // Mejor calidad
                        backgroundColor: '#ffffff'
                    }).then(canvas => {
                        // Convertir canvas a imagen
                        const image = canvas.toDataURL('image/png');

                        // Crear enlace de descarga
                        const link = document.createElement('a');
                        link.download = `codigo-barras-${codigo}.png`;
                        link.href = image;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        // Limpiar el contenedor temporal
                        document.body.removeChild(tempContainer);

                        Swal.fire({
                            icon: 'success',
                            title: 'Imagen descargada',
                            text: `El código de barras se ha descargado como "codigo-barras-${codigo}.png"`,
                            timer: 2000,
                            showConfirmButton: false
                        });
                    });
                };
                document.head.appendChild(html2canvasScript);
            } else {
                // Si la imagen no está cargada, esperar a que cargue
                barcodeImage.onload = () => {
                    descargarImagenBarcode();
                };
                Swal.fire({
                    icon: 'info',
                    title: 'Cargando imagen...',
                    text: 'Por favor espera un momento',
                    timer: 1000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error al descargar:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al descargar',
                text: 'No se pudo descargar la imagen del código de barras'
            });
        }
    };

    // Event listeners
    btnCerrar.addEventListener('click', cerrarModal);
    btnCerrar2.addEventListener('click', cerrarModal);

    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    // Event listener para imprimir
    btnImprimir.addEventListener('click', () => {
        window.imprimirCodigoBarras(codigo, nombre);
    });

    // Event listener para descargar
    btnDescargar.addEventListener('click', descargarImagenBarcode);
};

// CORREGIDO - Función global de eliminar
window.eliminarProducto = eliminarProducto;

// ========================= INIT =========================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Inicializando gestión de productos...");

    // Cargar datos iniciales
    cargarProductos();

    setupScanner();

    configurarModalCreacion();

    // Event listeners básicos
    searchBox?.addEventListener("input", (e) => buscarProductos(e.target.value));

    document.querySelectorAll(".categoria-btn").forEach(btn => {
        btn.addEventListener("click", () => filtrarPorCategoria(btn.dataset.categoria));
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

    // Forms
    document.getElementById("formActualizarStock")?.addEventListener("submit", guardarMovimientoStock);
    document.getElementById("formCrearProducto")?.addEventListener("submit", crearProductoNuevo);
    document.getElementById("formEditarProductoQuick")?.addEventListener("submit", guardarEdicionQuick);

    // Tabs
    document.getElementById("tabStock")?.addEventListener("click", () => cambiarTab("stock"));
    document.getElementById("tabEditar")?.addEventListener("click", () => cambiarTab("editar"));

    // Botones de acción (ENTRADA/SALIDA) - CORREGIDO
    document.querySelectorAll(".accion-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            cambiarTipoMovimiento(btn.dataset.accion);
        });
    });

    // Input de cantidad
    document.getElementById("update_cantidad")?.addEventListener("input", calcularPreviewStock);

    // Global focus manager
    window.addEventListener('focus', () => {
        setTimeout(() => {
            if (scannerInput && !isAnyModalOpen()) {
                scannerInput.focus();
                console.log("🎯 Ventana recuperó focus - scanner activado");
            }
        }, 200);
    });

    // Evento modal closed
    document.addEventListener('modalClosed', (e) => {
        const modalId = e.detail.modalId;
        if (modalId === 'modalActualizarStock' || modalId === 'modalCrearProducto') {
            console.log("🚪 Modal cerrado, reenfocando scanner...");
            setTimeout(() => {
                resetearScanner();
            }, 100);
        }
    });

    // Exportar funciones globales
    window.resetearScanner = resetearScanner;
});

