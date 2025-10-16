<?php

use App\Http\Controllers\ProductoController;
use App\Http\Controllers\ProductoTipoController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportesController;
use App\Http\Controllers\VentasController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('auth/login');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {

    //EDITAR PERFIL CON LA SESSION INICIADA
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    //PRODUCTOS
    Route::prefix('productos')->name('productos.')->group(function () {

        // ==================== TIPOS DE PRODUCTOS ====================
        Route::get('tipo', [ProductoTipoController::class, 'index'])->name('tipo.index');
        Route::post('agregar/tipo', [ProductoTipoController::class, 'store'])->name('tipo.store');
        Route::get('tipo/ObtenerDatosAPI', [ProductoTipoController::class, 'show'])->name('tipo.obtener-datos');
        Route::put('actualizar/tipo', [ProductoTipoController::class, 'update'])->name('tipo.actualizar');
        Route::delete('eliminar/tipo', [ProductoTipoController::class, 'destroy'])->name('tipo.destroy');

        // ==================== GESTIÓN DE PRODUCTOS ====================
        Route::get('/', [ProductoController::class, 'index'])->name('index');
        Route::get('/ObtenerDatosAPI', [ProductoController::class, 'obtenerDatosAPI'])->name('obtener.datos');
        Route::get('/stock', [ProductoController::class, 'stockView'])->name('stock.view');
        Route::post('/buscar-codigo', [ProductoController::class, 'buscarPorCodigo'])->name('buscar.codigo');
        Route::get('/barcode/{codigo}', [ProductoController::class, 'etiquetaBarcode'])->name('barcode');

        // ==================== REPORTES ====================
        Route::get('/reportes', [ReportesController::class, 'index'])->name('reportes.index');
        Route::get('/reportes/estadisticas', [ReportesController::class, 'obtenerEstadisticas'])->name('reportes.estadisticas');
        Route::get('/reportes/stock-clasificado', [ReportesController::class, 'obtenerStockClasificado'])->name('reportes.stock-clasificado');
        Route::get('/reportes/movimientos', [ReportesController::class, 'obtenerMovimientos'])->name('reportes.movimientos');
        Route::get('/reportes/mas-vendidos', [ReportesController::class, 'obtenerMasVendidos'])->name('reportes.mas-vendidos');
        Route::get('/reportes/sin-stock', [ReportesController::class, 'obtenerSinStock'])->name('reportes.sin-stock');
        Route::get('/reportes/historial-producto', [ReportesController::class, 'historialProducto'])->name('reportes.historial-producto');
        Route::post('/reportes/buscar-codigo', [ReportesController::class, 'buscarProductoCodigo'])->name('reportes.buscar-codigo');
        Route::get('/reportes/exportar-stock', [ReportesController::class, 'exportarStock'])->name('reportes.exportar-stock');
        Route::post('/reportes/buscar-codigo', [ReportesController::class, 'buscarProductoCodigo'])->name('reportes.buscar-codigo');
        // ==================== RUTAS CON PARÁMETROS ====================
        Route::get('/{id}', [ProductoController::class, 'show'])->name('show');
        Route::post('/', [ProductoController::class, 'store'])->name('store');
        Route::put('/{id}', [ProductoController::class, 'update'])->name('update');
        Route::delete('/{id}', [ProductoController::class, 'destroy'])->name('destroy');
        Route::post('/{id}/entrada-stock', [ProductoController::class, 'entradaStock'])->name('entrada.stock');
        Route::post('/{id}/asignar-codigo', [ProductoController::class, 'asignarCodigo'])->name('asignar.codigo');
    });

    Route::prefix('ventas')->name('ventas.')->group(function () {
        Route::get('index', [VentasController::class, 'index'])->name('index');
        Route::post('verificarProducto', [VentasController::class, 'BusquedaCodigo'])->name('busquedaAPI');
        Route::post('buscarPorNombre', [VentasController::class, 'buscarPorNombre'])->name('buscar.nombre');
    });
});

require __DIR__ . '/auth.php';
