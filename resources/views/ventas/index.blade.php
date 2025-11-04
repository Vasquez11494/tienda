@extends('layouts.menu')

@section('title', 'Ventas')

@section('content')

    <style>
        .ticket-venta-popup {
            max-width: 450px !important;
        }

        .ticket-venta-popup .swal2-html-container {
            max-height: 400px;
            overflow-y: auto;
        }
    </style>

    @php
        $esAdmin = auth()->check() && auth()->user()->esAdmin();
    @endphp
    <div class="space-y-6">
        <div class="flex flex-col gap-6 mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Modulo de Venta</h1>
                    <p class="text-sm text-gray-600">{{ now()->format('d/m/Y') }} - {{ now()->format('h:i A') }}</p>
                </div>

                <div class="flex gap-2">
                    <!-- Botón Nueva Venta -->
                    <button type="button" id="btnNuevaVenta"
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nueva Venta
                    </button>

                    <!-- Botón Finalizar Venta -->
                    <button type="button" id="btnFinalizarVenta"
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 shadow-sm transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Finalizar Venta
                    </button>
                </div>
            </div>

            <!-- Segunda línea: Métricas del Día - TODAS EN UNA SOLA LÍNEA -->
            <div class="flex flex-wrap gap-4">
                <!-- Total Ventas Hoy -->
                <div class="bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-[200px]">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 font-medium">Ventas Hoy</p>
                            <p class="text-xl font-bold text-gray-800" id="totalVentasHoy">2</p>
                        </div>
                    </div>
                </div>

                <!-- Productos Vendidos -->
                <div class="bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-[200px]">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-green-100 rounded-lg">
                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 font-medium">Productos Vendidos Hoy</p>
                            <p class="text-xl font-bold text-gray-800" id="totalProductosVendidos">16</p>
                        </div>
                    </div>
                </div>

                <!-- Ingresos del Día -->
                <div class="bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-[200px]">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-emerald-100 rounded-lg">
                            <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 font-medium">Ingresos Hoy</p>
                            <p class="text-xl font-bold text-emerald-600" id="ingresosHoy">Q 48.75</p>
                        </div>
                    </div>
                </div>

                {{-- Saldo en Caja --}}

                @if ($esAdmin)
                    <div class="bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-[200px]">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-purple-100 rounded-lg">
                                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-medium">Saldo en Caja</p>
                                <p class="text-xl font-bold text-purple-600" id="saldoCajaActual">Q 48.75</p>
                            </div>
                        </div>
                    </div>
                @endif
            </div>
        </div>

        <!-- Contenedor Principal -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Columna Izquierda - Escáner y Productos -->
            <div class="lg:col-span-2 space-y-6">

                <!-- Sección Escáner -->
                <div class="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl shadow-sm p-4">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">Escanear o Buscar Producto</h2>

                    <div class="space-y-4">
                        <!-- Input para código de barras (escáner) -->
                        <div>
                            <label for="codigoBarras" class="block text-sm font-medium text-gray-700 mb-2">
                                Código de Barras
                            </label>
                            <input type="text" id="codigoBarras" name="codigoBarras"
                                placeholder="Escanea el código de barras"
                                class="w-full rounded-lg border-gray-300 focus:border-emerald-400 focus:ring-emerald-400 text-sm"
                                autocomplete="off">
                        </div>

                        <!-- Input para búsqueda por nombre -->
                        <div>
                            <label for="busquedaProducto" class="block text-sm font-medium text-gray-700 mb-2">
                                Buscar por Nombre
                            </label>
                            <div class="relative">
                                <input type="text" id="busquedaProducto" name="busquedaProducto"
                                    placeholder="Escribe el nombre del producto..."
                                    class="w-full rounded-lg border-gray-300 focus:border-emerald-400 focus:ring-emerald-400 text-sm pr-10"
                                    autocomplete="off">
                                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <!-- Resultados de búsqueda -->
                        <div id="resultadosBusqueda"
                            class="hidden max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                            <!-- Los resultados se cargarán aquí -->
                        </div>
                    </div>
                </div>

                <!-- Lista de Productos en la Venta -->
                <div class="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl shadow-sm">
                    <div class="p-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-800">Productos en la Venta</h2>
                    </div>

                    <div class="p-4">
                        <div class="overflow-x-auto">
                            <table id="tablaVentas" class="stripe hover w-full text-sm">
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Columna Derecha - Resumen y Pago -->
            <div class="space-y-6">

                <!-- Resumen de Venta -->
                <div class="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl shadow-sm p-4">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">Resumen de Venta</h2>

                    <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Subtotal:</span>
                            <span id="subtotal" class="font-medium">Q 0.00</span>
                        </div>

                        <div class="border-t pt-3">
                            <div class="flex justify-between text-lg font-bold">
                                <span class="text-gray-800">Total:</span>
                                <span id="total" class="text-emerald-600">Q 0.00</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pago en Efectivo -->
                <div class="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl shadow-sm p-4">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">Pago en Efectivo</h2>

                    <div class="space-y-4">
                        <div>
                            <label for="montoRecibido" class="block text-sm font-medium text-gray-700 mb-2">
                                Monto Recibido
                            </label>
                            <input type="number" id="montoRecibido"
                                class="w-full rounded-lg border-gray-300 focus:border-emerald-400 focus:ring-emerald-400 text-sm"
                                placeholder="0.00" step="0.01">
                        </div>

                        <div class="border-t pt-3">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium text-gray-700">Cambio:</span>
                                <span id="cambio" class="text-lg font-bold text-emerald-600">Q 0.00</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Acciones Rápidas -->
                <div class="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl shadow-sm p-4">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>

                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" class="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm">
                            <svg class="w-5 h-5 mx-auto text-gray-600" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span class="block mt-1">Corte Caja</span>
                        </button>

                        <button type="button" class="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm">
                            <svg class="w-5 h-5 mx-auto text-gray-600" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span class="block mt-1">Reportes</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal de Confirmación de Venta -->
    <div id="modalConfirmacionVenta"
        class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" aria-hidden="true">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div class="flex items-center justify-between pb-3 border-b">
                <h3 class="text-xl font-bold text-gray-800">Confirmar Venta</h3>
                <button data-modal-close="modalConfirmacionVenta" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form id="formConfirmacionVenta" class="mt-4 space-y-4">
                <!-- CAMPO DE CLIENTE (REEMPLAZA EL NIT) -->
                <div>
                    <label for="nombre_cliente" class="block text-sm font-medium text-gray-700 mb-1">
                        Cliente (Opcional)
                    </label>
                    <input type="text" id="nombre_cliente" name="nombre_cliente"
                        class="w-full rounded-lg border-gray-300 focus:border-emerald-400 focus:ring-emerald-400 text-sm"
                        placeholder="Nombre del cliente" maxlength="100">
                    <p class="text-xs text-gray-500 mt-1">Dejar vacío para "Consumidor Final"</p>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-medium text-gray-700 mb-3 text-center">Resumen de la Venta</h4>

                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Total de productos:</span>
                            <span id="resumenCantidadProductos" class="font-medium">0</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Subtotal:</span>
                            <span id="resumenSubtotal">Q 0.00</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Efectivo recibido:</span>
                            <span id="resumenEfectivo">Q 0.00</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Cambio:</span>
                            <span id="resumenCambio">Q 0.00</span>
                        </div>
                        <div class="border-t pt-2 mt-2">
                            <div class="flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span id="resumenTotal" class="text-emerald-600">Q 0.00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <!-- Botones -->
            <div class="flex gap-3 pt-4">
                <button type="button" data-modal-close="modalConfirmacionVenta"
                    class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm font-medium">
                    Cancelar
                </button>
                <button type="button" id="btnConfirmarProcesar"
                    class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium">
                    Procesar Venta
                </button>
            </div>
        </div>
    </div>

@endsection

@vite('resources/js/ventas/index.js')
