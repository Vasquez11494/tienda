@extends('layouts.menu');

@section('title', 'Ventas');

@section('content')


<div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">Punto de Venta</h1>
            <p class="text-sm text-gray-600">Escanea productos y procesa ventas</p>
        </div>

        <div class="flex gap-2">
            <!-- Botón Nueva Venta -->
            <button type="button" id="btnNuevaVenta"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
                        <input
                            type="text"
                            id="codigoBarras"
                            name="codigoBarras"
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
                            <input
                                type="text"
                                id="busquedaProducto"
                                name="busquedaProducto"
                                placeholder="Escribe el nombre del producto..."
                                class="w-full rounded-lg border-gray-300 focus:border-emerald-400 focus:ring-emerald-400 text-sm pr-10"
                                autocomplete="off">
                            <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Resultados de búsqueda -->
                    <div id="resultadosBusqueda" class="hidden max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
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
                        <input
                            type="number"
                            id="montoRecibido"
                            class="w-full rounded-lg border-gray-300 focus:border-emerald-400 focus:ring-emerald-400 text-sm"
                            placeholder="0.00"
                            step="0.01">
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
                        <svg class="w-5 h-5 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span class="block mt-1">Corte Caja</span>
                    </button>

                    <button type="button" class="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm">
                        <svg class="w-5 h-5 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span class="block mt-1">Reportes</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

@endsection

@vite('resources/js/ventas/index.js');