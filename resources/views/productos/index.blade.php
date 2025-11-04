@extends('layouts.menu')

@section('title', 'Gestión de Stock - Escáner')

@section('content')

    <style>
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        #productosGrid>.card-supermercado {
            height: 100%;
        }

        .card-supermercado {
            height: 100%;
            display: flex;
            flex-direction: column;
            min-height: 300px;
            background: white;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            transition: all 0.3s ease;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .card-supermercado:hover {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
            border-color: #10b981;
            transform: translateY(-2px);
        }

        .card-image-container {
            height: 140px;
            min-height: 140px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-bottom: 1px solid #f1f5f9;
            padding: 15px;
            position: relative;
        }

        .card-image {
            max-width: 110px;
            max-height: 110px;
            width: auto;
            height: auto;
            object-fit: contain;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
            transition: transform 0.3s ease;
        }

        .card-supermercado:hover .card-image {
            transform: scale(1.05);
        }

        .card-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 12px;
            background: white;
        }

        .card-category {
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }

        .card-status {
            font-size: 9px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
            border: 1px solid;
            display: inline-block;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .card-name {
            font-size: 12px;
            font-weight: 600;
            color: #1e293b;
            line-height: 1.3;
            margin-bottom: 8px;
            min-height: 2.6rem;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .card-details {
            margin-top: auto;
        }

        .card-stock {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            margin-bottom: 6px;
        }

        .stock-label {
            color: #64748b;
            font-weight: 500;
        }

        .stock-value {
            font-weight: 700;
        }

        .card-price {
            font-size: 14px;
            font-weight: 800;
            color: #059669;
            margin-bottom: 8px;
        }

        .card-footer {
            background: #f8fafc;
            border-radius: 8px;
            padding: 6px 8px;
            border: 1px solid #f1f5f9;
        }

        .code-section {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .code-text {
            font-size: 9px;
            font-family: 'Courier New', monospace;
            color: #475569;
            font-weight: 600;
            flex: 1;
            margin-right: 6px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .card-actions {
            display: flex;
            gap: 4px;
        }

        .btn-action {
            padding: 4px;
            border-radius: 5px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn-action:hover {
            background: white;
            transform: scale(1.1);
        }
    </style>

    <div class="flex flex-col md:flex-row md:h-[calc(100vh-120px)] min-h-[calc(100vh-120px)] gap-4">

        <!-- SIDEBAR -->
        <div
            class="w-full md:w-64 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col md:sticky md:top-20">

            <div class="px-4 py-4 bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 flex-shrink-0">
                <div class="flex items-center gap-2 mb-1">
                    <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </div>
                    <h3 class="text-white font-bold text-base">Categorías</h3>
                </div>
                <p class="text-emerald-100 text-xs">Filtra por categoría</p>
            </div>

            <div class="flex-1 overflow-y-auto p-2 space-y-1.5">
                <button type="button" data-categoria=""
                    class="categoria-btn w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-semibold shadow-sm">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-base">📦</span>
                            <span class="text-xs">Todas</span>
                        </div>
                        <span class="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-md font-bold"
                            id="total-productos">0</span>
                    </div>
                </button>

                @foreach ($tipos as $tipo)
                    <button type="button" data-categoria="{{ $tipo->tprod_id }}"
                        class="categoria-btn w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-gray-50 border-2 border-transparent hover:border-emerald-300 group">
                        <div class="flex items-center justify-between">
                            <span
                                class="text-xs text-gray-700 font-medium group-hover:text-emerald-700">{{ $tipo->tprod_nombre }}</span>
                            <span
                                class="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md font-semibold group-hover:bg-emerald-100 group-hover:text-emerald-700">{{ $tipo->productos_count }}</span>
                        </div>
                    </button>
                @endforeach
            </div>

            <div class="px-3 py-3 bg-gradient-to-br from-gray-50 to-gray-100 border-t-2 space-y-2 flex-shrink-0">
                <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 font-medium">Stock bajo:</span>
                    <span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md font-bold" id="stat-stock-bajo">0</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 font-medium">Sin stock:</span>
                    <span class="px-2 py-0.5 bg-red-100 text-red-700 rounded-md font-bold" id="stat-sin-stock">0</span>
                </div>
            </div>
        </div>

        <!-- CONTENIDO PRINCIPAL -->
        <div class="flex-1 flex flex-col gap-3 overflow-visible md:overflow-hidden">

            <!-- TOOLBAR -->
            <div
                class="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
                <div class="flex items-center gap-2 text-sm">
                    <span
                        class="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">Inventario</span>
                    <span class="text-gray-300">|</span>
                    <button id="btnFiltrarSinCodigo"
                        class="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-medium">Sin
                        código</button>
                </div>

                <div class="flex items-center gap-2">
                    <button id="btnNuevoProducto"
                        class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow text-sm font-semibold">+
                        Nuevo</button>
                </div>
            </div>

            <!-- ESCÁNER - MÁS COMPACTO -->
            <div
                class="bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-xl shadow-lg px-4 py-3 flex-shrink-0 border border-blue-500">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </div>

                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <h2 class="text-white font-bold text-base">Escáner de Productos</h2>
                            <span id="scannerStatus" class="text-xs font-semibold text-emerald-300">● Listo</span>
                        </div>

                        <div class="relative">
                            <div class="absolute left-3 top-1/2 -translate-y-1/2">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input type="text" id="scannerInput" autocomplete="off"
                                placeholder="Escanea o escribe el código..."
                                class="w-full pl-10 pr-4 py-2.5 rounded-lg border-0 text-sm font-mono shadow-xl focus:ring-2 focus:ring-blue-300 focus:outline-none">
                        </div>
                    </div>
                </div>

                <!-- feedback de nombre -->
                <div id="scannerNombreWrap" class="hidden mt-2 bg-white/10 rounded-lg p-2">
                    <span class="text-blue-100 text-xs">Producto:</span>
                    <span id="scannerNombre" class="text-white font-bold text-sm"></span>
                    <div class="inline-flex gap-2 ml-2">
                        <button id="scannerBtnImprimir"
                            class="hidden px-2 py-0.5 rounded-md bg-white/20 text-white text-xs hover:bg-white/30">Imprimir</button>
                        <button id="scannerBtnEditar"
                            class="hidden px-2 py-0.5 rounded-md bg-white/20 text-white text-xs hover:bg-white/30">Editar</button>
                    </div>
                </div>
            </div>

            <!-- GRID - MÁS ESPACIO -->
            <div class="flex-1 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
                <div
                    class="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex items-center justify-between flex-shrink-0">
                    <h3 class="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Productos en Inventario
                    </h3>
                    <div class="flex items-center gap-2">
                        <div class="relative">
                            <input type="text" id="searchBox" placeholder="Buscar..."
                                class="pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 w-48">
                            <svg class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <span id="productos-mostrados"
                            class="text-xs font-bold text-gray-800 bg-emerald-100 px-2.5 py-1 rounded-lg">0
                            productos</span>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-3">
                    <div id="productosGrid"
                        class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 items-stretch">
                    </div>


                    <div id="emptyState"
                        class="hidden flex flex-col items-center justify-center h-full text-gray-400 py-12">
                        <svg class="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p class="text-lg font-semibold mb-1">No hay productos</p>
                        <p class="text-sm text-center">Selecciona otra categoría o crea un nuevo producto</p>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- MODAL: GESTIONAR (Stock + Editar) -->
    <div id="modalActualizarStock" class="hidden fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-modal-close="modalActualizarStock"></div>
        <div
            class="relative mx-auto mt-8 w-11/12 max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            <div
                class="px-6 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 flex items-center justify-between flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-white">Gestionar Producto</h3>
                </div>
                <button type="button" class="p-2 rounded-lg hover:bg-white/20 transition"
                    data-modal-close="modalActualizarStock">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto">
                <div class="border-b bg-gray-50 sticky top-0 z-10">
                    <div class="flex">
                        <button type="button" id="tabStock"
                            class="tab-btn flex-1 px-6 py-3 font-semibold text-emerald-600 border-b-2 border-emerald-600 transition">📦
                            Stock</button>
                        <button type="button" id="tabEditar"
                            class="tab-btn flex-1 px-6 py-3 font-semibold text-gray-500 hover:text-gray-700 transition">✏️
                            Editar</button>
                    </div>
                </div>

                <!-- TAB: STOCK -->
                <div id="contenidoStock" class="p-6 space-y-5">
                    <form id="formActualizarStock">
                        @csrf
                        <input type="hidden" id="update_prod_id" name="prod_id">

                        <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
                            <div class="flex items-center gap-4">
                                <img id="update_prod_imagen" src="" alt=""
                                    class="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-md">
                                <div class="flex-1">
                                    <h4 id="update_prod_nombre" class="font-bold text-gray-800 text-base mb-1"></h4>
                                    <p id="update_prod_codigo" class="text-sm text-gray-600 font-mono mb-2"></p>
                                    <p id="update_prod_descripcion" class="text-xs text-gray-500 line-clamp-2 mb-2"></p>
                                    <div class="flex gap-4 mt-2">
                                        <div>
                                            <span class="text-xs text-gray-500">Stock actual</span>
                                            <p class="text-lg font-bold text-emerald-600" id="update_stock_actual">0</p>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-500">Precio</span>
                                            <p class="text-lg font-bold text-blue-600" id="update_precio_venta">Q0.00</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-3">Tipo de movimiento</label>
                            <div class="grid grid-cols-2 gap-3">
                                <button type="button" data-accion="entrada"
                                    class="accion-btn px-5 py-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold transition hover:bg-emerald-100 hover:shadow-md flex items-center justify-center gap-2">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 4v16m0-16l-4 4m4-4l4 4" />
                                    </svg>
                                    Entrada
                                </button>
                                <button type="button" data-accion="salida"
                                    class="accion-btn px-5 py-4 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold transition hover:bg-gray-50 hover:shadow-md flex items-center justify-center gap-2">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 20V4m0 16l-4-4m4 4l4-4" />
                                    </svg>
                                    Salida
                                </button>
                            </div>
                            <input type="hidden" id="update_tipo_movimiento" name="tipo_movimiento" value="entrada">
                        </div>

                        <div>
                            <label for="update_cantidad"
                                class="block text-sm font-bold text-gray-700 mb-2">Cantidad</label>
                            <input type="number" id="update_cantidad" name="cantidad" min="1" value="1"
                                class="w-full px-4 py-4 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-2xl font-bold text-center">
                        </div>

                        <div>
                            <label for="update_motivo" class="block text-sm font-bold text-gray-700 mb-2">Motivo
                                (opcional)</label>
                            <input type="text" id="update_motivo" name="motivo" maxlength="200"
                                class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                                placeholder="Ej: Compra, venta, ajuste...">
                        </div>

                        <div id="preview-calculo"
                            class="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-5">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-semibold text-gray-700">Nuevo stock:</span>
                                <span id="preview-nuevo-stock" class="text-3xl font-black text-blue-600">0</span>
                            </div>
                        </div>

                        <div class="flex gap-3 pt-2">
                            <button type="button"
                                class="flex-1 px-5 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 font-bold bg-white hover:bg-gray-50 transition"
                                data-modal-close="modalActualizarStock">Cancelar</button>
                            <button type="submit" id="btnConfirmarStock"
                                class="flex-1 px-5 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition shadow-lg hover:shadow-xl">Confirmar
                                Stock</button>
                        </div>
                    </form>
                </div>

                <!-- TAB CONTENIDO: EDITAR PRODUCTO -->
                <div id="contenidoEditar" class="hidden p-6 space-y-4">
                    <form id="formEditarProductoQuick" enctype="multipart/form-data">
                        @csrf
                        <input type="hidden" id="edit_quick_prod_id">

                        <div class="grid grid-cols-2 gap-4">

                            <div class="col-span-2">
                                <label class="block text-sm font-bold text-gray-700 mb-2">Nombre del Producto *</label>
                                <input type="text" id="edit_quick_prod_nombre" required
                                    class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                            </div>

                            <div class="col-span-2">
                                <label class="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                                <textarea id="edit_quick_prod_descripcion" rows="2"
                                    class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"></textarea>
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Código de Barras</label>
                                <input type="text" id="edit_quick_prod_codigo"
                                    class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-gray-100 text-gray-600 font-mono"
                                    readonly>
                                <p class="text-xs text-gray-500 mt-1">El código no se puede modificar</p>
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Categoría *</label>
                                <select id="edit_quick_tprod_id" required
                                    class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                                    @foreach ($tipos as $tipo)
                                        <option value="{{ $tipo->tprod_id }}">{{ $tipo->tprod_nombre }}</option>
                                    @endforeach
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Precio de Compra</label>
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Q</span>
                                    <input type="number" id="edit_quick_prod_precio_compra" step="0.01"
                                        min="0"
                                        class="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Precio de Venta *</label>
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Q</span>
                                    <input type="number" id="edit_quick_prod_precio_venta" step="0.01"
                                        min="0" required
                                        class="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Stock Mínimo *</label>
                                <input type="number" id="edit_quick_prod_stock_minimo" min="0" required
                                    class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Stock Actual</label>
                                <input type="number" id="edit_quick_prod_stock_actual" readonly
                                    class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-gray-100 text-gray-600 font-bold">
                                <p class="text-xs text-amber-600 mt-1">⚠️ Usa la pestaña Stock para modificar</p>
                            </div>

                            <!-- CAMBIAR IMAGEN -->
                            <div class="col-span-2">
                                <label class="block text-sm font-bold text-gray-700 mb-2">Imagen</label>
                                <div class="flex items-center gap-4">
                                    <img id="edit_quick_preview" src=""
                                        class="w-24 h-24 rounded-lg object-cover border">
                                    <input type="file" id="edit_quick_prod_imagen" accept="image/*"
                                        class="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                                </div>
                                <p class="text-xs text-gray-500 mt-1">Si no seleccionas nada, se conservará la imagen
                                    actual.</p>
                            </div>
                        </div>

                        <!-- Botones -->
                        <div class="flex gap-3 pt-4">
                            <button type="button"
                                class="flex-1 px-5 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 font-bold bg-white hover:bg-gray-50 transition"
                                data-modal-close="modalActualizarStock">Cancelar</button>
                            <button type="submit" id="btnGuardarEdicionQuick"
                                class="flex-1 px-5 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition shadow-lg">Guardar
                                Cambios</button>
                            <button type="button" id="btnEliminarProducto"
                                class="flex-1 px-5 py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-lg">Eliminar
                                (stock 0)</button>
                        </div>
                    </form>
                </div>

            </div>

        </div>
    </div>

    <!-- MODAL: CREAR PRODUCTO -->
    <div id="modalCrearProducto" class="hidden fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" data-modal-close="modalCrearProducto"></div>
        <div
            class="relative mx-auto mt-8 w-11/12 max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            <div
                class="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between flex-shrink-0">
                <h3 class="text-xl font-bold text-white">Crear Nuevo Producto</h3>
                <button type="button" class="p-2 rounded-lg hover:bg-white/20 transition"
                    data-modal-close="modalCrearProducto">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form id="formCrearProducto" class="flex-1 overflow-y-auto p-6 space-y-4" enctype="multipart/form-data">
                @csrf

                <!-- PASO 1: OPCIONES DE CÓDIGO -->
                <div id="seccionOpcionesCodigo">
                    <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                        <div class="flex items-start gap-3 mb-4">
                            <svg class="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div class="flex-1">
                                <h4 class="text-lg font-bold text-blue-900 mb-2">¿Cómo deseas asignar el código?</h4>
                                <p class="text-sm text-blue-700">Elige una opción para el código de barras del producto</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

                            <!-- Opción 1: Generar automático -->
                            <button type="button" id="btnGenerarAuto"
                                class="opcion-codigo-btn px-4 py-4 rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition flex flex-col items-center gap-2 text-center">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span class="text-sm">Generar automático</span>
                                <span class="text-xs text-blue-600 font-normal">(PROD-XXXXXXXX)</span>
                            </button>

                            <!-- Opción 2: Ingresar manual -->
                            <button type="button" id="btnIngresarManual"
                                class="opcion-codigo-btn px-4 py-4 rounded-xl border-2 border-purple-500 bg-purple-50 text-purple-700 font-bold hover:bg-purple-100 transition flex flex-col items-center gap-2 text-center">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span class="text-sm">Ingresar manual</span>
                                <span class="text-xs text-purple-600 font-normal">(Escribe tu código)</span>
                            </button>
                        </div>
                    </div>

                    <!-- Campo para código manual (oculto inicialmente) -->
                    <div id="campoCodigoManual" class="hidden space-y-3 mt-4">
                        <label class="block text-sm font-bold text-gray-700">Código de Barras *</label>
                        <input type="text" id="inputCodigoManual" placeholder="Ej: 7501234567890 o PROD-001"
                            class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 font-mono text-lg"
                            autocomplete="off">

                        <!-- Preview del código -->
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <span class="text-sm text-gray-600">Vista previa:</span>
                            <span id="previewCodigoManual" class="font-mono text-lg font-bold text-blue-600 ml-2">-</span>
                        </div>

                        <button type="button" id="btnConfirmarManual"
                            class="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition">
                            Confirmar Código
                        </button>
                    </div>

                    <!-- Información del código seleccionado -->
                    <div id="infoCodigoSeleccionado"
                        class="hidden bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mt-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <span class="text-sm font-semibold text-gray-700">Código asignado:</span>
                                <span id="textoCodigoAsignado"
                                    class="font-mono text-lg font-bold text-blue-600 ml-2"></span>
                            </div>
                            <button type="button" id="btnCambiarOpcion"
                                class="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Cambiar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Campo oculto para enviar el código -->
                <input type="hidden" id="crear_prod_codigo" name="prod_codigo">

                <!-- PASO 2: FORMULARIO DEL PRODUCTO -->
                <div id="seccionFormularioProducto" class="hidden space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <label for="crear_prod_nombre" class="block text-sm font-medium text-gray-700 mb-1">Nombre del
                                Producto *</label>
                            <input type="text" id="crear_prod_nombre" name="prod_nombre" required
                                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                        </div>

                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea id="crear_prod_descripcion" name="prod_descripcion" rows="2"
                                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"></textarea>
                        </div>

                        <div>
                            <label for="crear_tprod_id" class="block text-sm font-medium text-gray-700 mb-1">Categoría
                                *</label>
                            <select id="crear_tprod_id" name="tprod_id" required
                                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                                <option value="">Seleccionar...</option>
                                @foreach ($tipos as $tipo)
                                    <option value="{{ $tipo->tprod_id }}">{{ $tipo->tprod_nombre }}</option>
                                @endforeach
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Precio de Venta *</label>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Q</span>
                                <input type="number" id="crear_prod_precio_venta" name="prod_precio_venta"
                                    step="0.01" min="0" required
                                    class="w-full pl-8 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Precio de Compra</label>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Q</span>
                                <input type="number" id="crear_prod_precio_compra" name="prod_precio_compra"
                                    step="0.01" min="0" value="0"
                                    class="w-full pl-8 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Stock Inicial *</label>
                            <input type="number" id="crear_prod_stock_actual" name="prod_stock_actual" min="0"
                                value="1" required
                                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo *</label>
                            <input type="number" id="crear_prod_stock_minimo" name="prod_stock_minimo" min="0"
                                value="5" required
                                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                        </div>

                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fotografía</label>
                            <input type="file" id="crear_prod_imagen" name="prod_imagen" accept="image/*"
                                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                        </div>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button type="button"
                            class="flex-1 px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold bg-white hover:bg-gray-50 transition"
                            data-modal-close="modalCrearProducto">Cancelar</button>
                        <button type="submit" id="btnCrearProducto"
                            class="flex-1 px-5 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg">
                            Crear Producto
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>

@endsection

@vite('resources/js/productos/crear.js')
