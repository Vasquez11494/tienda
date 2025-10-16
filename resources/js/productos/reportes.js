import Swal from "sweetalert2";
import { Loader } from "../app";

const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";

// Estado
let filtrosActuales = {
    fecha_desde: '',
    fecha_hasta: '',
    categoria: '',
    tipo_reporte: 'stock_clasificado'
};

// Elementos DOM
const fechaDesde = document.getElementById("fecha_desde");
const fechaHasta = document.getElementById("fecha_hasta");
const filtroCategoria = document.getElementById("filtro_categoria");
const filtroTipo = document.getElementById("filtro_tipo");
const btnAplicarFiltros = document.getElementById("btnAplicarFiltros");
const btnExportar = document.getElementById("btnExportar");

// Scanner para reportes
const scannerInput = document.getElementById("scannerInput");
const scannerStatus = document.getElementById("scannerStatus");

// Elementos de estadísticas
const statTotalProductos = document.getElementById("stat-total-productos");
const statStockBajo = document.getElementById("stat-stock-bajo");
const statSinStock = document.getElementById("stat-sin-stock");
const statMovimientosHoy = document.getElementById("stat-movimientos-hoy");

// Elementos de contadores
const contadorStockBajo = document.getElementById("contador-stock-bajo");
const contadorMovimientos = document.getElementById("contador-movimientos");
const contadorMasVendidos = document.getElementById("contador-mas-vendidos");
const contadorSinStock = document.getElementById("contador-sin-stock");

// Elementos de listas
const listaStockBajo = document.getElementById("lista-stock-bajo");
const listaMovimientos = document.getElementById("lista-movimientos");
const listaMasVendidos = document.getElementById("lista-mas-vendidos");
const listaSinStock = document.getElementById("lista-sin-stock");

// ========================= SCANNER CORREGIDO =========================
let scanBuffer = "";
let lastKeyTime = 0;
const SCAN_GAP_MS = 50;
const SCAN_MIN_LEN = 6;


const limpiarCodigoBarras = (codigo) => {
    const codigoLimpio = codigo
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')  
        .toUpperCase();

    if (codigoLimpio.startsWith('PROD') && codigoLimpio.length > 4) {
        return `PROD-${codigoLimpio.substring(4)}`;
    }

    return codigoLimpio;
};

// HUD para feedback de escaneo
const setScanHUD = (() => {
    let node = null, hideT = null;
    return (text, type = "info") => {
        if (!node) {
            node = document.createElement("div");
            node.style.position = "fixed";
            node.style.top = "12px";
            node.style.right = "12px";
            node.style.zIndex = "99999";
            node.style.padding = "8px 12px";
            node.style.borderRadius = "10px";
            node.style.boxShadow = "0 6px 18px rgba(0,0,0,.12)";
            node.style.font = "600 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial";
            document.body.appendChild(node);
        }
        const styles = {
            info: { bg: "#eff6ff", fg: "#1d4ed8", bd: "#bfdbfe" },
            ok: { bg: "#ecfdf5", fg: "#047857", bd: "#a7f3d0" },
            warn: { bg: "#fffbeb", fg: "#b45309", bd: "#fde68a" },
            error: { bg: "#fef2f2", fg: "#b91c1c", bd: "#fecaca" }
        }[type] || { bg: "#eef2ff", fg: "#4338ca", bd: "#c7d2fe" };

        node.textContent = text;
        node.style.background = styles.bg;
        node.style.color = styles.fg;
        node.style.border = `1px solid ${styles.bd}`;

        clearTimeout(hideT);
        hideT = setTimeout(() => { node.remove(); node = null; }, 1500);
    };
})();

// Scanner global unificado
document.addEventListener("keydown", (e) => {
    const tag = (e.target?.tagName || "").toUpperCase();

    // Si está en un input/textarea y NO es Enter, ignorar (tecleo manual)
    if ((tag === "INPUT" || tag === "TEXTAREA") && e.key !== "Enter") {
        return;
    }

    const now = Date.now();

    // Reiniciar buffer si pasó mucho tiempo
    if (now - lastKeyTime > SCAN_GAP_MS) {
        scanBuffer = "";
    }
    lastKeyTime = now;

    if (e.key === "Enter") {
        const codigo = scanBuffer.trim();
        scanBuffer = "";

        if (codigo.length >= SCAN_MIN_LEN) {
            e.preventDefault();
            setScanHUD("Escaneando...", "info");
            manejarCodigoEscaneadoReportes(codigo);
        }
        return;
    }

    // Acumular caracteres (manejar diferentes tipos de guiones)
    if (e.key.length === 1) {
        const ch = (e.key === '–' || e.key === '—' || e.key === '−') ? '-' : e.key;
        scanBuffer += ch;
    }
});

// Manejar código escaneado en reportes
async function manejarCodigoEscaneadoReportes(codigo) {
    try {
        // ✅ LIMPIAR EL CÓDIGO ANTES DE BUSCAR
        const codigoLimpio = limpiarCodigoBarras(codigo);

        console.log('🔍 Scanner Reportes - Código original:', codigo);
        console.log('🔍 Scanner Reportes - Código limpio:', codigoLimpio);

        if (codigoLimpio.length >= SCAN_MIN_LEN) {
            await buscarProductoPorCodigo(codigoLimpio);
        } else {
            setScanHUD("Código muy corto", "error");
            Swal.fire({
                icon: "warning",
                title: "Código inválido",
                text: `El código debe tener al menos ${SCAN_MIN_LEN} caracteres después de limpiar. Longitud: ${codigoLimpio.length}`,
                confirmButtonColor: "#ffc107",
            });
        }
    } catch (err) {
        console.error("Error en scanner de reportes:", err);
        setScanHUD("Error al escanear", "error");
    }
}

// ========================= INICIALIZACIÓN =========================
const inicializarReportes = () => {
    console.log("📊 Inicializando módulo de reportes...");

    // Establecer fechas por defecto (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    fechaDesde.value = hace30Dias.toISOString().split('T')[0];
    fechaHasta.value = hoy.toISOString().split('T')[0];

    // Actualizar filtros actuales
    filtrosActuales.fecha_desde = fechaDesde.value;
    filtrosActuales.fecha_hasta = fechaHasta.value;

    // Cargar datos iniciales
    cargarEstadisticas();
    cargarReporteStockClasificado();

    // Configurar event listeners
    configurarEventListeners();
};

const configurarEventListeners = () => {
    // Filtros
    btnAplicarFiltros?.addEventListener("click", aplicarFiltros);
    btnExportar?.addEventListener("click", exportarReporte);

    // Cambio de tipo de reporte
    filtroTipo?.addEventListener("change", (e) => {
        cambiarTipoReporte(e.target.value);
    });

    // Fecha automática
    fechaDesde?.addEventListener("change", (e) => {
        if (fechaHasta.value && e.target.value > fechaHasta.value) {
            fechaHasta.value = e.target.value;
        }
    });
};

// ========================= BUSCAR PRODUCTO POR CÓDIGO =========================
const buscarProductoPorCodigo = async (codigo) => {
    try {
        // Actualizar estado del scanner
        if (scannerStatus) {
            scannerStatus.textContent = "● Buscando...";
            scannerStatus.className = "text-sm font-semibold text-amber-600";
        }

        console.log('🔎 Buscando producto con código:', codigo);

        const response = await fetch("/productos/reportes/buscar-codigo", {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ codigo }),
        });

        const data = await response.json();

        if (data.success && data.encontrado) {
            if (scannerStatus) {
                scannerStatus.textContent = "● Encontrado";
                scannerStatus.className = "text-sm font-semibold text-green-600";
            }

            setScanHUD(`✅ ${data.producto.prod_nombre}`, "ok");

            // Mostrar historial del producto encontrado
            await verHistorialProducto(data.producto.prod_id);

        } else {
            if (scannerStatus) {
                scannerStatus.textContent = "● No encontrado";
                scannerStatus.className = "text-sm font-semibold text-red-600";
            }

            setScanHUD("❌ Producto no encontrado", "error");

            Swal.fire({
                title: "Producto no encontrado",
                text: "El código escaneado no existe en el sistema",
                icon: "info",
                confirmButtonColor: "#3b82f6",
            });
        }
    } catch (error) {
        console.error("❌ Error en búsqueda por código:", error);

        if (scannerStatus) {
            scannerStatus.textContent = "● Error";
            scannerStatus.className = "text-sm font-semibold text-red-600";
        }

        setScanHUD("❌ Error de conexión", "error");

        Swal.fire({
            title: "Error de conexión",
            text: "No se pudo conectar con el servidor",
            icon: "error",
            confirmButtonColor: "#ef4444",
        });
    }
};

// ========================= FILTROS =========================
const aplicarFiltros = () => {
    console.log("🔍 Aplicando filtros...", {
        fecha_desde: fechaDesde.value,
        fecha_hasta: fechaHasta.value,
        categoria: filtroCategoria.value,
        tipo_reporte: filtroTipo.value
    });

    filtrosActuales = {
        fecha_desde: fechaDesde.value,
        fecha_hasta: fechaHasta.value,
        categoria: filtroCategoria.value,
        tipo_reporte: filtroTipo.value
    };

    recargarReporteActual();

    Swal.fire({
        icon: "success",
        title: "Filtros aplicados",
        timer: 1500,
        showConfirmButton: false
    });
};

const recargarReporteActual = () => {
    const tipo = filtrosActuales.tipo_reporte;

    switch (tipo) {
        case 'stock_clasificado':
            cargarReporteStockClasificado();
            break;
        case 'movimientos':
            cargarReporteMovimientos();
            break;
        case 'mas_vendidos':
            cargarReporteMasVendidos();
            break;
        case 'sin_stock':
            cargarReporteSinStock();
            break;
        default:
            cargarReporteStockClasificado();
    }
};

const cambiarTipoReporte = (tipo) => {
    console.log("🔄 Cambiando a reporte:", tipo);

    document.querySelectorAll('.reporte-contenido').forEach(reporte => {
        reporte.classList.add('hidden');
    });

    const idMap = {
        stock_clasificado: 'reporte-stock-bajo',
        movimientos: 'reporte-movimientos',
        mas_vendidos: 'reporte-mas-vendidos',
        sin_stock: 'reporte-sin-stock',
    };

    const id = idMap[tipo] || 'reporte-stock-bajo';
    const reporteSeleccionado = document.getElementById(id);
    if (reporteSeleccionado) {
        reporteSeleccionado.classList.remove('hidden');
    } else {
        console.warn('No se encontró el contenedor del reporte:', id);
    }

    // Cargar datos del reporte seleccionado
    recargarReporteActual();
};

// ========================= CARGAR DATOS =========================
const cargarEstadisticas = async () => {
    try {
        const r = await fetch(`/productos/reportes/estadisticas`, {
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });

        const j = await r.json();

        if (j.success) {
            actualizarEstadisticasUI(j.estadisticas);
        }
    } catch (error) {
        console.error("Error cargando estadísticas:", error);
    }
};

const actualizarEstadisticasUI = (estadisticas) => {
    if (statTotalProductos) statTotalProductos.textContent = estadisticas.total_productos;
    if (statStockBajo) statStockBajo.textContent = estadisticas.stock_bajo;
    if (statSinStock) statSinStock.textContent = estadisticas.sin_stock;
    if (statMovimientosHoy) statMovimientosHoy.textContent = estadisticas.movimientos_hoy;
};

// ========================= REPORTE STOCK CLASIFICADO =========================
const cargarReporteStockClasificado = async () => {
    try {
        Loader.show("Analizando niveles de stock...");

        const params = new URLSearchParams(filtrosActuales);

        const r = await fetch(`/productos/reportes/stock-clasificado?${params}`, {
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });

        const j = await r.json();

        if (j.success) {
            renderizarStockClasificado(j);
        } else {
            Swal.fire("Error", j.message || "Error cargando stock clasificado", "error");
        }
    } catch (error) {
        console.error("Error cargando stock clasificado:", error);
        Swal.fire("Error", "No se pudo cargar el análisis de stock", "error");
    } finally {
        Loader.hide();
    }
};

const renderizarStockClasificado = (data) => {
    if (!listaStockBajo) return;

    listaStockBajo.innerHTML = '';

    if (contadorStockBajo) {
        contadorStockBajo.textContent = `${data.total_general} productos analizados`;
    }

    const { productos, total_criticos, total_bajos, total_medios, total_altos } = data;

    let contenidoHTML = '';

    // Productos CRÍTICOS (Stock = 0)
    if (productos.criticos && productos.criticos.length > 0) {
        contenidoHTML += `
            <div class="mb-6">
                <h4 class="font-bold text-red-600 text-sm mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    🔴 CRÍTICO - Sin Stock (${total_criticos} productos)
                </h4>
                ${productos.criticos.map(producto => crearTarjetaProducto(producto, 'critico')).join('')}
            </div>
        `;
    }

    // Productos BAJOS (Stock ≤ Mínimo)
    if (productos.bajos && productos.bajos.length > 0) {
        contenidoHTML += `
            <div class="mb-6">
                <h4 class="font-bold text-amber-600 text-sm mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                    🟡 STOCK BAJO (${total_bajos} productos)
                </h4>
                ${productos.bajos.map(producto => crearTarjetaProducto(producto, 'bajo')).join('')}
            </div>
        `;
    }

    // Productos MEDIOS (Stock > Mínimo y ≤ 2*Mínimo)
    if (productos.medios && productos.medios.length > 0) {
        contenidoHTML += `
            <div class="mb-6">
                <h4 class="font-bold text-blue-600 text-sm mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    🔵 STOCK MEDIO (${total_medios} productos)
                </h4>
                ${productos.medios.map(producto => crearTarjetaProducto(producto, 'medio')).join('')}
            </div>
        `;
    }

    // Productos ALTOS (Stock > 2*Mínimo)
    if (productos.altos && productos.altos.length > 0) {
        contenidoHTML += `
            <div class="mb-6">
                <h4 class="font-bold text-green-600 text-sm mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    🟢 STOCK ALTO (${total_altos} productos)
                </h4>
                ${productos.altos.map(producto => crearTarjetaProducto(producto, 'alto')).join('')}
            </div>
        `;
    }

    // Si no hay productos
    if (!contenidoHTML) {
        contenidoHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
                <p>No hay productos para analizar con los filtros actuales</p>
            </div>
        `;
    }

    listaStockBajo.innerHTML = contenidoHTML;
};

const crearTarjetaProducto = (producto, nivel) => {
    const config = {
        critico: { color: 'red', icon: '🔴', texto: 'CRÍTICO' },
        bajo: { color: 'amber', icon: '🟡', texto: 'BAJO' },
        medio: { color: 'blue', icon: '🔵', texto: 'MEDIO' },
        alto: { color: 'green', icon: '🟢', texto: 'ALTO' }
    };

    const { color, icon, texto } = config[nivel];
    const porcentaje = producto.prod_stock_minimo > 0 ?
        Math.round((producto.prod_stock_actual / producto.prod_stock_minimo) * 100) : 0;

    // Verificar si tiene imagen
    const tieneImagen = producto.prod_imagen && producto.prod_imagen.trim() !== '';

    // Usar una función separada para manejar el contenido de la imagen
    const getImagenContent = () => {
        if (tieneImagen) {
            return `<img src="/storage/${producto.prod_imagen}" 
                      alt="${producto.prod_nombre}"
                      class="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      onerror="this.replaceWith(this.nextElementSibling)">
                   <div class="hidden">
                       <svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M24 3v18H0V3h24zM1 4v16h22V4H1zm7 10.5c0 .828-.672 1.5-1.5 1.5S5 15.328 5 14.5 5.672 13 6.5 13s1.5.672 1.5 1.5zm3.5-1.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm6.5 0c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zM1 4l11 6 11-6H1z"/>
                       </svg>
                   </div>`;
        } else {
            return `<svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M24 3v18H0V3h24zM1 4v16h22V4H1zm7 10.5c0 .828-.672 1.5-1.5 1.5S5 15.328 5 14.5 5.672 13 6.5 13s1.5.672 1.5 1.5zm3.5-1.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm6.5 0c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zM1 4l11 6 11-6H1z"/>
                   </svg>`;
        }
    };

    return `
        <div class="tarjeta-producto border-${color}-300 bg-${color}-50 hover:border-${color}-400 p-4 rounded-lg border-2 transition cursor-pointer mb-2" 
             data-id="${producto.prod_id}"
             onclick="verHistorialProducto(${producto.prod_id})">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1">
                    <!-- Imagen del producto -->
                    <div class="flex-shrink-0">
                        ${getImagenContent()}
                    </div>
                    
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-sm">${icon}</span>
                            <h4 class="font-semibold text-gray-800 text-sm">${producto.prod_nombre || 'Sin nombre'}</h4>
                        </div>
                        <p class="text-xs text-gray-500 mb-2">${producto.tipo?.tprod_nombre || 'Sin categoría'} • ${producto.prod_codigo || 'Sin código'}</p>
                        
                        <div class="flex items-center gap-4 text-xs">
                            <div>
                                <span class="text-gray-600">Stock actual:</span>
                                <strong class="text-${color}-600">${producto.prod_stock_actual}</strong>
                            </div>
                            <div>
                                <span class="text-gray-600">Stock mínimo:</span>
                                <strong>${producto.prod_stock_minimo}</strong>
                            </div>
                            <div>
                                <span class="text-gray-600">Nivel:</span>
                                <strong class="text-${color}-600">${texto} (${porcentaje}%)</strong>
                            </div>
                        </div>
                        
                        ${nivel === 'critico' ? '<div class="text-xs text-red-600 font-semibold mt-2">🚨 URGENTE: Reponer inmediatamente</div>' : ''}
                        ${nivel === 'bajo' ? '<div class="text-xs text-amber-600 font-semibold mt-2">📦 Necesita reposición pronto</div>' : ''}
                        ${nivel === 'medio' ? '<div class="text-xs text-blue-600 font-semibold mt-2">📋 Monitorear stock</div>' : ''}
                        ${nivel === 'alto' ? '<div class="text-xs text-green-600 font-semibold mt-2">✅ Stock saludable</div>' : ''}
                    </div>
                </div>
                
                <div class="text-right">
                    <div class="text-lg font-bold text-gray-800">Q${parseFloat(producto.prod_precio_venta || 0).toFixed(2)}</div>
                    <div class="text-xs text-blue-600 hover:text-blue-800 mt-1 cursor-pointer" onclick="event.stopPropagation(); verHistorialProducto(${producto.prod_id})">
                        Ver historial
                    </div>
                </div>
            </div>
        </div>
    `;
};

// ========================= FUNCIONES GLOBALES =========================
window.verHistorialProducto = async (prodId) => {
    try {
        Loader.show("Cargando historial...");

        const r = await fetch(`/productos/reportes/historial-producto?prod_id=${prodId}`, {
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });

        const j = await r.json();

        if (j.success) {
            mostrarModalHistorial(j.producto, j.movimientos);
        } else {
            Swal.fire("Error", "No se pudo cargar el historial del producto", "error");
        }
    } catch (error) {
        console.error("Error cargando historial:", error);
        Swal.fire("Error", "No se pudo cargar el historial", "error");
    } finally {
        Loader.hide();
    }
};

const mostrarModalHistorial = (producto, movimientos) => {
    const movimientosHTML = movimientos.map(mov => `
        <div class="flex justify-between items-center py-3 border-b border-gray-100">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-semibold px-2 py-1 rounded ${mov.mov_tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${mov.mov_tipo}
                    </span>
                    <span class="text-sm font-semibold ${mov.mov_tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}">
                        ${mov.mov_cantidad} unidades
                    </span>
                </div>
                <div class="text-xs text-gray-600 mb-1">${mov.mov_motivo}</div>
                <div class="text-xs text-gray-400">${new Date(mov.created_at).toLocaleString()}</div>
            </div>
            <div class="text-right text-sm">
                <div class="font-mono text-gray-700">${mov.mov_stock_anterior} → ${mov.mov_stock_nuevo}</div>
                ${mov.mov_observacion ? `<div class="text-xs text-gray-500 mt-1">${mov.mov_observacion}</div>` : ''}
            </div>
        </div>
    `).join('');

    // Verificar si tiene imagen para el modal
    const tieneImagenModal = producto.prod_imagen && producto.prod_imagen.trim() !== '';

    const getImagenModalContent = () => {
        if (tieneImagenModal) {
            return `<img src="/storage/${producto.prod_imagen}" 
                      alt="${producto.prod_nombre}"
                      class="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      onerror="this.replaceWith(this.nextElementSibling)">
                   <div class="hidden">
                       <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M24 3v18H0V3h24zM1 4v16h22V4H1zm7 10.5c0 .828-.672 1.5-1.5 1.5S5 15.328 5 14.5 5.672 13 6.5 13s1.5.672 1.5 1.5zm3.5-1.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm6.5 0c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zM1 4l11 6 11-6H1z"/>
                       </svg>
                   </div>`;
        } else {
            return `<svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M24 3v18H0V3h24zM1 4v16h22V4H1zm7 10.5c0 .828-.672 1.5-1.5 1.5S5 15.328 5 14.5 5.672 13 6.5 13s1.5.672 1.5 1.5zm3.5-1.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm6.5 0c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zM1 4l11 6 11-6H1z"/>
                   </svg>`;
        }
    };

    Swal.fire({
        title: `📊 Historial de ${producto.prod_nombre}`,
        html: `
            <div class="text-left">
                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <div class="flex items-center gap-3">
                        ${getImagenModalContent()}
                        <div class="flex-1">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-sm font-semibold">Código: ${producto.prod_codigo}</span>
                                <span class="text-sm text-gray-600">${producto.tipo?.tprod_nombre || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm font-semibold ${producto.prod_stock_actual === 0 ? 'text-red-600' : producto.prod_stock_actual <= producto.prod_stock_minimo ? 'text-amber-600' : 'text-green-600'}">
                                    Stock actual: ${producto.prod_stock_actual}
                                </span>
                                <span class="text-sm text-gray-600">Mínimo: ${producto.prod_stock_minimo}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="max-h-96 overflow-y-auto">
                    ${movimientosHTML || '<p class="text-center text-gray-500 py-8">No hay movimientos registrados para este producto</p>'}
                </div>
            </div>
        `,
        width: 700,
        showConfirmButton: false,
        showCloseButton: true
    });
};

// ========================= EXPORTAR REPORTE =========================
const exportarReporte = async () => {
    try {
        const tipo = filtrosActuales.tipo_reporte;

        // Para todos los tipos de reporte, exportamos el stock clasificado a PDF
        const params = new URLSearchParams({
            ...filtrosActuales,
            formato: 'pdf'
        });

        const url = `/productos/reportes/exportar-stock?${params}`;

        // Abrir en nueva pestaña para descargar PDF
        window.open(url, '_blank');

    } catch (error) {
        console.error("Error exportando reporte:", error);
        Swal.fire("Error", "No se pudo exportar el reporte", "error");
    }
};

// ========================= FUNCIONES PARA OTROS REPORTES =========================
const cargarReporteMovimientos = async () => {
    try {
        Loader.show("Cargando movimientos...");

        const params = new URLSearchParams(filtrosActuales);

        const r = await fetch(`/productos/reportes/movimientos?${params}`, {
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });

        const j = await r.json();

        if (j.success) {
            renderizarMovimientos(j.movimientos, j.total);
        } else {
            Swal.fire("Error", j.message || "Error cargando movimientos", "error");
        }
    } catch (error) {
        console.error("Error cargando movimientos:", error);
        Swal.fire("Error", "No se pudo cargar los movimientos", "error");
    } finally {
        Loader.hide();
    }
};

const cargarReporteMasVendidos = async () => {
    try {
        Loader.show("Cargando productos más vendidos...");

        const params = new URLSearchParams(filtrosActuales);

        const r = await fetch(`/productos/reportes/mas-vendidos?${params}`, {
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });

        const j = await r.json();

        if (j.success) {
            renderizarMasVendidos(j.mas_vendidos, j.total);
        } else {
            Swal.fire("Error", j.message || "Error cargando productos más vendidos", "error");
        }
    } catch (error) {
        console.error("Error cargando más vendidos:", error);
        Swal.fire("Error", "No se pudo cargar los productos más vendidos", "error");
    } finally {
        Loader.hide();
    }
};

const cargarReporteSinStock = async () => {
    try {
        Loader.show("Cargando productos sin stock...");

        const params = new URLSearchParams(filtrosActuales);

        const r = await fetch(`/productos/reportes/sin-stock?${params}`, {
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });

        const j = await r.json();

        if (j.success) {
            renderizarSinStock(j.productos, j.total);
        } else {
            Swal.fire("Error", j.message || "Error cargando productos sin stock", "error");
        }
    } catch (error) {
        console.error("Error cargando sin stock:", error);
        Swal.fire("Error", "No se pudo cargar los productos sin stock", "error");
    } finally {
        Loader.hide();
    }
};

// ========================= RENDERIZADORES PARA OTROS REPORTES =========================
const renderizarMovimientos = (movimientos, total) => {
    console.log("🔄 Renderizando movimientos:", movimientos, "Total:", total);

    if (!listaMovimientos) {
        console.error("❌ Elemento listaMovimientos no encontrado");
        return;
    }

    listaMovimientos.innerHTML = '';

    if (contadorMovimientos) {
        contadorMovimientos.textContent = `${total || 0} movimientos`;
    }

    // Verificar si no hay datos
    if (!movimientos || movimientos.length === 0) {
        console.log("📭 No hay movimientos");
        listaMovimientos.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
                <p class="text-lg font-medium mb-2">No hay movimientos registrados</p>
                <p class="text-sm">No se encontraron movimientos en el período seleccionado</p>
                <p class="text-xs mt-2 text-gray-400">Intenta cambiar las fechas o la categoría</p>
            </div>
        `;
        return;
    }

    console.log("🎯 Renderizando", movimientos.length, "movimientos");

    const movimientosHTML = movimientos.map(mov => {
        const esEntrada = mov.mov_tipo === 'Entrada';
        const tipoColor = esEntrada ? 'text-green-600' : 'text-red-600';
        const tipoTexto = esEntrada ? 'Entrada' : 'Salida';
        const bordeColor = esEntrada ? 'border-green-300' : 'border-red-300';
        const bgColor = esEntrada ? 'bg-green-50' : 'bg-red-50';

        // Verificar si el producto existe
        const nombreProducto = mov.producto?.prod_nombre || 'Producto no encontrado';
        const categoriaProducto = mov.producto?.tipo?.tprod_nombre || 'Sin categoría';
        const codigoProducto = mov.producto?.prod_codigo || 'Sin código';

        return `
            <div class="movimiento ${bordeColor} ${bgColor} p-4 rounded-lg border-l-4 hover:shadow-md transition mb-2">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <h4 class="font-semibold text-gray-800 text-sm">${nombreProducto}</h4>
                            <span class="text-xs px-2 py-1 rounded-full ${esEntrada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${tipoTexto}
                            </span>
                        </div>
                        <p class="text-xs text-gray-600 mb-2">${mov.mov_motivo || 'Sin motivo especificado'}</p>
                        <div class="flex items-center gap-4 text-xs">
                            <span class="text-gray-500">${new Date(mov.created_at).toLocaleString()}</span>
                            <span class="${tipoColor} font-semibold">${mov.mov_cantidad} unidades</span>
                            <span class="text-gray-600">Stock: ${mov.mov_stock_anterior} → ${mov.mov_stock_nuevo}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-500">${categoriaProducto}</div>
                        <div class="text-xs text-gray-400">${codigoProducto}</div>
                    </div>
                </div>
                ${mov.mov_observacion ? `<div class="text-xs text-gray-500 mt-2">📝 ${mov.mov_observacion}</div>` : ''}
            </div>
        `;
    }).join('');

    listaMovimientos.innerHTML = movimientosHTML;
};

const renderizarMasVendidos = (masVendidos, total) => {
    console.log("📈 Renderizando más vendidos:", masVendidos, "Total:", total);

    if (!listaMasVendidos) {
        console.error("❌ Elemento listaMasVendidos no encontrado");
        return;
    }

    listaMasVendidos.innerHTML = '';

    if (contadorMasVendidos) {
        contadorMasVendidos.textContent = `${total || 0} productos`;
    }

    // Verificar si no hay datos
    if (!masVendidos || masVendidos.length === 0) {
        console.log("📭 No hay productos más vendidos");
        listaMasVendidos.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
                <p class="text-lg font-medium mb-2">No hay datos de ventas</p>
                <p class="text-sm">No se encontraron productos vendidos en el período seleccionado</p>
                <p class="text-xs mt-2 text-gray-400">Intenta cambiar las fechas o la categoría</p>
            </div>
        `;
        return;
    }

    console.log("🎯 Renderizando", masVendidos.length, "productos más vendidos");

    const masVendidosHTML = masVendidos.map((item, index) => {
        const producto = item.producto;
        const puesto = index + 1;
        const emoji = puesto <= 3 ? ['🥇', '🥈', '🥉'][puesto - 1] : `#${puesto}`;

        // Verificar si el producto existe
        if (!producto) {
            console.warn("⚠️ Producto no encontrado en más vendidos:", item);
            return `
                <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3 flex-1">
                            <div class="text-2xl font-bold text-gray-300 w-8 text-center">${emoji}</div>
                            <div class="flex-1">
                                <h4 class="font-semibold text-gray-800 text-sm">Producto no disponible</h4>
                                <p class="text-xs text-gray-500">ID: ${item.prod_id}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold text-green-600">${item.total_vendido || 0} unidades</div>
                            <div class="text-xs text-gray-500">vendidas</div>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition mb-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="text-2xl font-bold text-gray-300 w-8 text-center">${emoji}</div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 text-sm">${producto.prod_nombre || 'Producto sin nombre'}</h4>
                            <p class="text-xs text-gray-500">${producto.tipo?.tprod_nombre || 'Sin categoría'} • ${producto.prod_codigo || 'Sin código'}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-green-600">${item.total_vendido || 0} unidades</div>
                        <div class="text-xs text-gray-500">vendidas</div>
                    </div>
                </div>
                <div class="flex items-center justify-between mt-2 text-xs text-gray-600">
                    <span>Stock actual: ${producto.prod_stock_actual || 0}</span>
                    <span>Precio: Q${parseFloat(producto.prod_precio_venta || 0).toFixed(2)}</span>
                </div>
            </div>
        `;
    }).join('');

    listaMasVendidos.innerHTML = masVendidosHTML;
};

const renderizarSinStock = (productos, total) => {
    console.log("📦 Renderizando sin stock:", productos, "Total:", total);

    if (!listaSinStock) {
        console.error("❌ Elemento listaSinStock no encontrado");
        return;
    }

    listaSinStock.innerHTML = '';

    if (contadorSinStock) {
        contadorSinStock.textContent = `${total || 0} productos`;
    }

    // Verificar si no hay datos
    if (!productos || productos.length === 0) {
        console.log("📭 No hay productos sin stock");
        listaSinStock.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-lg font-medium mb-2">¡Excelente gestión de stock!</p>
                <p class="text-sm">No hay productos sin stock con los filtros actuales</p>
                <p class="text-xs mt-2 text-gray-400">Todos los productos tienen stock disponible</p>
            </div>
        `;
        return;
    }

    console.log("🎯 Renderizando", productos.length, "productos sin stock");

    const getImagenContentSinStock = (producto) => {
        const tieneImagen = producto.prod_imagen && producto.prod_imagen.trim() !== '';
        if (tieneImagen) {
            return `<img src="/storage/${producto.prod_imagen}" 
                      alt="${producto.prod_nombre}"
                      class="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      onerror="this.replaceWith(this.nextElementSibling)">
                   <div class="hidden">
                       <svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M24 3v18H0V3h24zM1 4v16h22V4H1zm7 10.5c0 .828-.672 1.5-1.5 1.5S5 15.328 5 14.5 5.672 13 6.5 13s1.5.672 1.5 1.5zm3.5-1.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm6.5 0c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zM1 4l11 6 11-6H1z"/>
                       </svg>
                   </div>`;
        } else {
            return `<svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M24 3v18H0V3h24zM1 4v16h22V4H1zm7 10.5c0 .828-.672 1.5-1.5 1.5S5 15.328 5 14.5 5.672 13 6.5 13s1.5.672 1.5 1.5zm3.5-1.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm6.5 0c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zM1 4l11 6 11-6H1z"/>
                   </svg>`;
        }
    };

    const sinStockHTML = productos.map(producto => {
        return `
            <div class="producto-sin-stock bg-red-50 p-4 rounded-lg border border-red-200 hover:shadow-md transition mb-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="flex-shrink-0">
                            ${getImagenContentSinStock(producto)}
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-red-500">🔴</span>
                                <h4 class="font-semibold text-gray-800 text-sm">${producto.prod_nombre || 'Sin nombre'}</h4>
                            </div>
                            <p class="text-xs text-gray-500 mb-2">${producto.tipo?.tprod_nombre || 'Sin categoría'} • ${producto.prod_codigo || 'Sin código'}</p>
                            
                            <div class="flex items-center gap-4 text-xs">
                                <div>
                                    <span class="text-gray-600">Stock actual:</span>
                                    <strong class="text-red-600">${producto.prod_stock_actual}</strong>
                                </div>
                                <div>
                                    <span class="text-gray-600">Stock mínimo:</span>
                                    <strong>${producto.prod_stock_minimo}</strong>
                                </div>
                            </div>
                            
                            <div class="text-xs text-red-600 font-semibold mt-2">🚨 STOCK AGOTADO - Reponer urgentemente</div>
                        </div>
                    </div>
                    
                    <div class="text-right">
                        <div class="text-lg font-bold text-gray-800">Q${parseFloat(producto.prod_precio_venta || 0).toFixed(2)}</div>
                        <button class="text-xs text-blue-600 hover:text-blue-800 mt-1" onclick="verHistorialProducto(${producto.prod_id})">
                            Ver historial
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    listaSinStock.innerHTML = sinStockHTML;
};

// ========================= INICIALIZAR =========================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Inicializando reportes mejorados...");
    inicializarReportes();
});

// Exportar funciones globales
window.recargarReportes = recargarReporteActual;
window.aplicarFiltrosReportes = aplicarFiltros;
window.exportarReporte = exportarReporte;