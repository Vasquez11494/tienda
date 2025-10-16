import Swal from "sweetalert2";
import "datatables.net-dt/css/dataTables.dataTables.css";
import DataTable from "datatables.net-dt";

let inputCodigoBarras = document.getElementById('codigoBarras');
let inputBusqueda = document.getElementById('busquedaProducto');
let resultadosBusqueda = document.getElementById('resultadosBusqueda');
const BASE_API = '/ventas/'
const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]').getAttribute('content') ?? '';

let productosVenta = [];
let datatableVentas;
let bufferCodigo = '';
let listening = true;
let timeoutBusqueda = null;
let lastKeyTime = 0;
const SCAN_GAP_MS = 50;
const SCAN_MIN_LEN = 6;

document.addEventListener('DOMContentLoaded', function () {
    inicializarDataTable();
    agregarEventListenersTabla();
    inputCodigoBarras.focus();
});

document.addEventListener('keydown', (e) => {
    const tag = (e.target?.tagName || "").toUpperCase();

    if (tag === "INPUT" && e.target !== inputCodigoBarras) {
        return;
    }

    const now = Date.now();

    if (now - lastKeyTime > SCAN_GAP_MS) {
        bufferCodigo = "";
    }
    lastKeyTime = now;

    if (e.key === "Enter") {
        const codigo = bufferCodigo.trim();
        bufferCodigo = "";

        if (codigo.length >= SCAN_MIN_LEN) {
            e.preventDefault();
            procesarCodigoEscaneado(codigo);
        }
        return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
        bufferCodigo += e.key;
        if (inputCodigoBarras) {
            inputCodigoBarras.value = bufferCodigo;
        }
    }
});

const formatearCodigoConGuion = (codigo) => {
    const codigoLimpio = codigo.replace(/[^a-zA-Z0-9]/g, '');

    if (codigoLimpio.length >= 4) {

        const match = codigoLimpio.match(/^([A-Z]+)([0-9A-Z]+)$/i);
        if (match) {
            return `${match[1]}-${match[2]}`.toUpperCase();
        }
    }

    return codigoLimpio.toUpperCase();
};


const procesarCodigoEscaneado = async (codigo) => {
    const codigoFormateado = formatearCodigoConGuion(codigo);

    await VerificarBusqueda(codigoFormateado);
    inputCodigoBarras.value = '';
    bufferCodigo = '';
};
const VerificarBusqueda = async (Codigo) => {
    if (!Codigo) return;

    const body = new FormData();
    body.append('codigo', Codigo);


    const url = `${BASE_API}verificarProducto`;

    const config = {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': CSRF_TOKEN,
            "X-Requested-With": "XMLHttpRequest",
            Accept: 'application/json'
        },
        body
    }

    try {
        const peticion = await fetch(url, config);
        const respuesta = await peticion.json();
        const { data, codigo: codigoRespuesta, mensaje, detalle } = respuesta;

        if (codigoRespuesta == 1) {

            agregarProductoALaVenta(data);

        } else {
            const textoError = [mensaje, detalle]
                .filter((v) => v && String(v).trim() !== "")
                .join(" || ") || "Ocurrió un problema.";

            await Swal.fire({
                icon: "error",
                title: "Error",
                text: textoError,
                confirmButtonColor: "#f82205",
            });
        }

    } catch (error) {
        console.warn('Error obtenido', error);
        await Swal.fire({
            icon: "error",
            title: "Error de conexión",
            text: "No se pudo conectar con el servidor",
            confirmButtonColor: "#f82205",
        });
    }
};


const agregarProductoALaVenta = (producto) => {
    const productoExistenteIndex = productosVenta.findIndex(p => p.prod_id === producto.prod_id);

    if (productoExistenteIndex !== -1) {

        productosVenta[productoExistenteIndex].cantidad += 1;

    } else {

        productosVenta.push({
            ...producto,
            cantidad: 1
        });
    }

    actualizarDataTable();

    calcularTotales();
};


const actualizarDataTable = () => {
    if (datatableVentas) {
        datatableVentas.clear();
        datatableVentas.rows.add(productosVenta);
        datatableVentas.draw();
    }
};

const calcularTotales = () => {
    const subtotal = productosVenta.reduce((total, producto) => {
        return total + (producto.cantidad * parseFloat(producto.prod_precio_venta));
    }, 0);

    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total');

    if (subtotalElement) {
        subtotalElement.textContent = `Q ${subtotal.toFixed(2)}`;
    }
    if (totalElement) {
        totalElement.textContent = `Q ${subtotal.toFixed(2)}`;
    }

    calcularCambio();
};

const calcularCambio = () => {
    const montoRecibidoInput = document.getElementById('montoRecibido');
    const cambioElement = document.getElementById('cambio');
    const totalElement = document.getElementById('total');

    if (montoRecibidoInput && cambioElement && totalElement) {
        const montoRecibido = parseFloat(montoRecibidoInput.value) || 0;
        const total = parseFloat(totalElement.textContent.replace('Q ', '')) || 0;

        if (montoRecibido === 0) {
            cambioElement.textContent = `Q 0.00`;
            cambioElement.className = 'text-lg font-bold text-gray-600';
        } else {
            const cambio = montoRecibido - total;

            if (cambio >= 0) {
                cambioElement.textContent = `Q ${cambio.toFixed(2)}`;
                cambioElement.className = 'text-lg font-bold text-emerald-600';
            } else {
                cambioElement.textContent = `-Q ${Math.abs(cambio).toFixed(2)}`;
                cambioElement.className = 'text-lg font-bold text-red-600';
            }
        }
    }
};

const agregarEventListenersTabla = () => {
    document.addEventListener('click', (e) => {
        // Aumentar cantidad
        if (e.target.classList.contains('aumentar') || e.target.closest('.aumentar')) {
            const button = e.target.classList.contains('aumentar') ? e.target : e.target.closest('.aumentar');
            const productId = parseInt(button.getAttribute('data-id'));
            cambiarCantidad(productId, 1);
        }

        // Disminuir cantidad
        if (e.target.classList.contains('disminuir') || e.target.closest('.disminuir')) {
            const button = e.target.classList.contains('disminuir') ? e.target : e.target.closest('.disminuir');
            const productId = parseInt(button.getAttribute('data-id'));
            cambiarCantidad(productId, -1);
        }

        // Eliminar producto
        if (e.target.classList.contains('eliminar') || e.target.closest('.eliminar')) {
            const button = e.target.classList.contains('eliminar') ? e.target : e.target.closest('.eliminar');
            const productId = parseInt(button.getAttribute('data-id'));
            eliminarProducto(productId);
        }
    });

    const montoRecibidoInput = document.getElementById('montoRecibido');
    if (montoRecibidoInput) {
        montoRecibidoInput.addEventListener('input', calcularCambio);
    }

    agregarEventListenersInputCantidad();
};


const cambiarCantidad = (productId, cambio) => {
    const producto = productosVenta.find(p => p.prod_id === productId);
    
    if (producto) {
        const nuevaCantidad = producto.cantidad + cambio;
        
        if (nuevaCantidad <= 0) {
            eliminarProducto(productId);
        } else if (nuevaCantidad <= producto.prod_stock_actual) {
            producto.cantidad = nuevaCantidad;
            actualizarDataTable();
            calcularTotales();
        } else {
            Swal.fire({
                icon: "warning",
                title: "Stock insuficiente",
                text: `No hay suficiente stock. Stock disponible: ${producto.prod_stock_actual}`,
                confirmButtonColor: "#ffc107",
            });
        }
    }
};
const eliminarProducto = (productId) => {
    const producto = productosVenta.find(p => p.prod_id === productId);

    Swal.fire({
        title: "¿Eliminar producto?",
        html: `¿Estás seguro de quitar <strong>${producto?.prod_nombre || 'este producto'}</strong> de la venta?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            productosVenta = productosVenta.filter(p => p.prod_id !== productId);
            actualizarDataTable();
            calcularTotales();

            Swal.fire({
                icon: "success",
                title: "Eliminado",
                text: "Producto removido de la venta",
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
};


const inicializarDataTable = () => {
    datatableVentas = new DataTable('#tablaVentas', {
        dom: `
          <"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"
              <"dataTables_length">
              <"dataTables_filter">
          >
          <"dt-table-wrapper">
          t
          <"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4"
              <"dataTables_info">
              <"dataTables_paginate">
          >
        `,
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
            lengthMenu: "Mostrar _MENU_ registros",
            search: "Buscar:",
            info: "Mostrando _START_ a _END_ de _TOTAL_ productos",
            infoEmpty: "No hay productos en la venta",
            infoFiltered: "(filtrado de _MAX_ productos totales)",
            paginate: {
                first: "Primero",
                previous: "Anterior",
                next: "Siguiente",
                last: "Último"
            }
        },
        data: productosVenta,
        pageLength: 10,
        autoWidth: false,
        responsive: true,
        ordering: false,
        columnDefs: [
            {
                targets: "_all",
                className: "align-middle py-3 px-4"
            }
        ],
        columns: [
            {
                title: 'No.',
                data: null,
                width: '60px',
                className: 'text-center text-gray-600 font-medium',
                render: (_d, _t, _r, meta) => meta.row + 1
            },
            {
                title: 'Producto',
                data: null,
                className: 'text-gray-900 font-semibold',
                render: (data) => `
                    <div>
                        <div class="font-medium">${data.prod_nombre}</div>
                        <div class="text-xs text-gray-500">${data.prod_codigo}</div>
                    </div>
                `
            },
            {
                title: 'Precio',
                data: 'prod_precio_venta',
                width: '100px',
                className: 'text-center font-medium',
                render: (precio) => `Q ${parseFloat(precio).toFixed(2)}`
            },
            {
                title: 'Cantidad',
                data: null,
                width: '140px',
                className: 'text-center',
                render: (data) => `
                    <div class="flex items-center justify-center gap-2">
                        <button class="disminuir w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm"
                                data-id="${data.prod_id}">-</button>
                        
                        <input type="number" 
                            class="cantidad-input w-16 text-center border border-gray-300 rounded py-1 text-sm focus:border-emerald-400 focus:ring-emerald-400"
                            value="${data.cantidad}"
                            min="1"
                            max="${data.prod_stock_actual}"
                            data-id="${data.prod_id}"
                            onchange="actualizarCantidadDesdeInput(${data.prod_id}, this.value)">
                        
                        <button class="aumentar w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm"
                                data-id="${data.prod_id}">+</button>
                    </div>
                `
            },
            {
                title: 'Subtotal',
                data: null,
                width: '100px',
                className: 'text-center font-semibold text-emerald-600',
                render: (data) => `Q ${(data.cantidad * parseFloat(data.prod_precio_venta)).toFixed(2)}`
            },
            {
                title: 'Acciones',
                data: null,
                width: '80px',
                className: 'text-center',
                render: (data) => `
                    <button class="eliminar inline-flex items-center justify-center w-9 h-9 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors duration-200"
                            title="Quitar producto"
                            data-id="${data.prod_id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                `
            }
        ]
    });
};

// Función para actualizar cantidad desde el input
window.actualizarCantidadDesdeInput = (productId, nuevaCantidad) => {
    const cantidad = parseInt(nuevaCantidad);
    const producto = productosVenta.find(p => p.prod_id === productId);

    if (producto && !isNaN(cantidad) && cantidad > 0) {
        if (cantidad <= producto.prod_stock_actual) {
            producto.cantidad = cantidad;
            actualizarDataTable();
            calcularTotales();
        } else {
            Swal.fire({
                icon: "warning",
                title: "Stock insuficiente",
                text: `No hay suficiente stock. Stock disponible: ${producto.prod_stock_actual}`,
                confirmButtonColor: "#ffc107",
            });
            // Restaurar el valor anterior
            const input = document.querySelector(`.cantidad-input[data-id="${productId}"]`);
            if (input) {
                input.value = producto.cantidad;
            }
        }
    }
};

// Event listener para Enter en los inputs de cantidad
const agregarEventListenersInputCantidad = () => {
    document.addEventListener('keypress', (e) => {
        if (e.target.classList.contains('cantidad-input') && e.key === 'Enter') {
            e.preventDefault();
            const productId = parseInt(e.target.getAttribute('data-id'));
            const nuevaCantidad = parseInt(e.target.value);
            actualizarCantidadDesdeInput(productId, nuevaCantidad);
            e.target.blur(); // Quitar el foco después de presionar Enter
        }
    });

    // También actualizar al perder el foco (blur)
    document.addEventListener('blur', (e) => {
        if (e.target.classList.contains('cantidad-input')) {
            const productId = parseInt(e.target.getAttribute('data-id'));
            const nuevaCantidad = parseInt(e.target.value);
            if (!isNaN(nuevaCantidad) && nuevaCantidad > 0) {
                actualizarCantidadDesdeInput(productId, nuevaCantidad);
            }
        }
    }, true);
};

// ========================= BÚSQUEDA POR NOMBRE =========================

inputBusqueda?.addEventListener('input', function (e) {
    const termino = e.target.value.trim();

    if (timeoutBusqueda) {
        clearTimeout(timeoutBusqueda);
    }

    timeoutBusqueda = setTimeout(() => {
        if (termino.length >= 2) {
            buscarPorNombre(termino);
        } else {
            ocultarResultados();
        }
    }, 500);
});


inputBusqueda?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const termino = e.target.value.trim();
        if (termino.length >= 2) {
            buscarPorNombre(termino);
        }
    }
});

// Función para buscar productos por nombre
const buscarPorNombre = async (termino) => {
    try {
        const body = new FormData();
        body.append('termino', termino);

        const url = `${BASE_API}buscarPorNombre`;

        const config = {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': CSRF_TOKEN,
                "X-Requested-With": "XMLHttpRequest",
                Accept: 'application/json'
            },
            body
        }

        const peticion = await fetch(url, config);
        const respuesta = await peticion.json();

        if (respuesta.codigo === 1) {
            mostrarResultadosBusqueda(respuesta.data, termino);
        } else {
            mostrarResultadosVacios(termino);
        }

    } catch (error) {
        console.warn('Error en búsqueda por nombre:', error);
        ocultarResultados();
    }
};

const mostrarResultadosBusqueda = (productos, termino) => {
    if (!resultadosBusqueda) return;

    if (productos.length === 0) {
        mostrarResultadosVacios(termino);
        return;
    }

    const resultadosHTML = productos.map(producto => {
        // Manejar imagen del producto
        const tieneImagen = producto.prod_imagen && producto.prod_imagen.trim() !== '';

        const imagenHTML = tieneImagen ?
            `<img src="/storage/${producto.prod_imagen}" 
                  alt="${producto.prod_nombre}"
                  class="w-12 h-12 rounded-lg object-cover border border-gray-200"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">` :
            '';

        const iconoHTML = `
            <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 ${tieneImagen ? 'hidden' : ''}">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
            </div>
        `;

        return `
        <div class="resultado-item p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
             onclick="seleccionarProductoDesdeBusqueda(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
            <div class="flex items-center gap-3">
                <!-- IMAGEN DEL PRODUCTO -->
                <div class="flex-shrink-0">
                    ${imagenHTML}
                    ${iconoHTML}
                </div>
                
                <!-- INFORMACIÓN DEL PRODUCTO -->
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-800 text-sm truncate">${producto.prod_nombre}</div>
                    <div class="text-xs text-gray-500 mt-1 space-y-1">
                        <div class="flex items-center gap-4">
                            <span>Código: <strong>${producto.prod_codigo}</strong></span>
                            <span>Stock: <strong class="${producto.prod_stock_actual <= producto.prod_stock_minimo ? 'text-amber-600' : 'text-green-600'}">${producto.prod_stock_actual}</strong></span>
                        </div>
                        <div class="text-emerald-600 font-semibold">
                            Q${parseFloat(producto.prod_precio_venta).toFixed(2)}
                        </div>
                    </div>
                </div>
                
                <!-- BOTÓN AGREGAR -->
                <div class="flex-shrink-0">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition">
                        Agregar
                    </span>
                </div>
            </div>
        </div>
        `;
    }).join('');

    resultadosBusqueda.innerHTML = `
        <div class="p-2 bg-gray-50 border-b">
            <div class="text-xs font-medium text-gray-600">
                ${productos.length} resultado(s) para "${termino}"
            </div>
        </div>
        ${resultadosHTML}
    `;

    resultadosBusqueda.classList.remove('hidden');
};

// Mostrar mensaje cuando no hay resultados
const mostrarResultadosVacios = (termino) => {
    if (!resultadosBusqueda) return;

    resultadosBusqueda.innerHTML = `
        <div class="p-6 text-center text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.927-6.04-2.444M3 12a9 9 0 1118 0 9 9 0 01-18 0z"/>
            </svg>
            <div class="text-sm font-medium mb-1">No se encontraron productos</div>
            <div class="text-xs">para "<span class="font-medium">${termino}</span>"</div>
        </div>
    `;

    resultadosBusqueda.classList.remove('hidden');
};

const ocultarResultados = () => {
    if (resultadosBusqueda) {
        resultadosBusqueda.classList.add('hidden');
    }
};

window.seleccionarProductoDesdeBusqueda = (producto) => {
    agregarProductoALaVenta(producto);
    inputBusqueda.value = '';
    ocultarResultados();

    Swal.fire({
        icon: "success",
        title: "Producto agregado",
        text: `${producto.prod_nombre} agregado a la venta`,
        timer: 1500,
        showConfirmButton: false
    });
};

document.addEventListener('click', function (e) {
    if (resultadosBusqueda && !resultadosBusqueda.contains(e.target) && e.target !== inputBusqueda) {
        ocultarResultados();
    }
});