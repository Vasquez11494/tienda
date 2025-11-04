<?php

namespace App\Http\Controllers;

use App\Models\caja_movimientos;
use App\Models\Producto;
use App\Models\Caja;
use App\Models\Ventas;
use App\Models\VentasDetalle;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;


class VentasController extends Controller
{
    public function index()
    {
        $cajasAbiertas = Caja::where("caja_estado", "Abierta")->get();

        $hoy = now()->toDateString();
        $metricas = [
            'total_ventas' => Ventas::where('ven_fecha', $hoy)->count(),
            'total_productos_vendidos' => VentasDetalle::whereHas('venta', function ($query) use ($hoy) {
                $query->where('ven_fecha', $hoy);
            })->sum('vendet_cantidad'),
            'ingresos_hoy' => Ventas::where('ven_fecha', $hoy)->sum('ven_total')
        ];

        return view('ventas.index', compact('cajasAbiertas', 'metricas'));
    }

    public function BusquedaCodigo(Request $request)
    {
        try {
            $request->validate([
                'codigo' => 'required|string|max:50',
            ]);

            $codigo = $request->codigo;

            $producto = Producto::where('prod_codigo', $codigo)
                ->where('prod_situacion', 'Activo')
                ->first();

            if ($producto) {
                return response()->json([
                    'codigo' => 1,
                    'mensaje' => 'Producto encontrado Exitosamente.',
                    'data' => $producto
                ], 200);
            } else {
                return response()->json([
                    'codigo' => 0,
                    'mensaje' => 'Producto No existe en su Stock, debe Verificar y Agregarlo',
                ], 200);
            }
        } catch (Exception $e) {
            Log::error('Error en búsqueda de producto: ' . $e->getMessage());
            return response()->json([
                'codigo' => 0,
                'mensaje' => "Ups!, hubo un error durante la busqueda",
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function buscarPorNombre(Request $request)
    {
        try {
            $request->validate([
                'termino' => 'required|string|min:2|max:100',
            ]);

            $termino = $request->termino;

            $productos = Producto::where('prod_situacion', 'Activo')
                ->where(function ($query) use ($termino) {
                    $query->where('prod_nombre', 'LIKE', "%{$termino}%")
                        ->orWhere('prod_codigo', 'LIKE', "%{$termino}%")
                        ->orWhere('prod_descripcion', 'LIKE', "%{$termino}%");
                })
                ->where('prod_stock_actual', '>', 0) // Solo productos con stock
                ->limit(10) // Limitar resultados
                ->get();

            return response()->json([
                'codigo' => 1,
                'mensaje' => 'Búsqueda completada',
                'data' => $productos
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'codigo' => 0,
                'mensaje' => "Error en la búsqueda",
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function procesarVenta(Request $request)
    {
        try {
            $request->validate([
                'cambio' => 'required|numeric|min:0',
                'efectivo' => 'required|numeric|min:0.01',
                'cliente' => 'nullable|string|max:200',
                'total' => 'required|numeric|min:0.01',
                'productos' => 'required|array|min:1',
                'productos.*.cantidad' => 'required|integer|min:1',
                'productos.*.precio' => 'required|numeric|min:0.01',
                'productos.*.prod_id' => 'required|exists:productos,prod_id'
            ]);

            DB::beginTransaction();

            $caja = Caja::where('caja_estado', 'Abierta')->first();

            if (!$caja) {
                throw new Exception('No se encontro la Caja para registrar Venta');
            }

            foreach ($request->productos as $productos) {
                $producto = Producto::find($productos['prod_id']);

                if ($producto->prod_stock_actual < $productos['cantidad']) {
                    throw new Exception("Stock Insuficiente para: $producto->prod_nombre. El stock Actual es de $producto->prod_stock_actual");
                }
            }

            $venta = Ventas::create([
                'ven_fecha' => now()->toDateString(),
                'ven_hora' => now()->toTimeString(),
                'ven_cliente' => $request->cliente ?: 'Consumidor Final',
                'ven_total' => $request->total,
                'ven_efectivo' => $request->efectivo,
                'ven_cambio' => $request->cambio,
                'user_id' => auth()->id(),
                'caja_id' => $caja->caja_id,
                'ven_estado' => 'Activa',
                'user_anulacion_id' => null,
                'fecha_anulacion' => null,
                'motivo_anulacion' => null,
            ]);

            // ... el resto del código permanece igual
            foreach ($request->productos as $productos) {
                $subtotal = $productos['cantidad'] * $productos['precio'];

                VentasDetalle::create([
                    'ven_id' => $venta->ven_id,
                    'prod_id' => $productos['prod_id'],
                    'vendet_cantidad' => $productos['cantidad'],
                    'vendet_precio' => $productos['precio'],
                    'vendet_total' => $subtotal
                ]);

                Producto::where('prod_id', $productos['prod_id'])
                    ->decrement('prod_stock_actual', $productos['cantidad']);
            }

            $caja->increment('caja_saldo', $request->total);

            caja_movimientos::create([
                'caja_id' => $caja->caja_id,
                'user_id' => auth()->id(),
                'ven_id' => $venta->ven_id,
                'cajamov_tipo' => 'Venta',
                'cajamov_monto' => $request->total,
                'cajamov_saldo_final' => $caja->caja_saldo,
                'cajamov_desc' => 'Venta #' . $venta->ven_id . ''
            ]);

            DB::commit();

            $ventaCompleta = Ventas::with(['detalles.producto', 'usuario'])->find($venta->ven_id);

            return response()->json([
                'codigo' => 1,
                'mensaje' => 'Venta Exitosa',
                'data' => [
                    'venta' => $ventaCompleta,
                    'numero_venta' => $venta->ven_id
                ]
            ], 200);
        } catch (Exception $error) {
            DB::rollBack();
            return response()->json([
                'codigo' => 0,
                'mensaje' => 'Error durante la venta',
                'detalle' => $error->getMessage()
            ], 500);
        }
    }

    public function obtenerHistorial(Request $request)
    {
        try {
            $fecha = $request->get('fecha', now()->toDateString());

            $ventas = Ventas::with(['usuario', 'detalles.producto'])
                ->where('ven_fecha', $fecha)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'codigo' => 1,
                'mensaje' => 'Historial obtenido',
                'data' => $ventas
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'codigo' => 0,
                'mensaje' => 'Error al obtener el historial',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function obtenerDetalleVenta($id)
    {
        try {
            $venta = Ventas::with(['usuario', 'caja', 'detalles.producto'])
                ->findOrFail($id);

            return response()->json([
                'codigo' => 1,
                'mensaje' => 'Detalle de venta obtenido',
                'data' => $venta
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'codigo' => 0,
                'mensaje' => 'Error al obtener el detalle de la venta',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function anularVenta(Request $request, $id)
    {
        try {
            $request->validate([
                'motivo' => 'required|string|max:500'
            ]);

            DB::beginTransaction();

            $venta = Ventas::with(['detalles', 'caja'])->findOrFail($id);

            // Verificar que la venta no esté ya anulada
            if ($venta->ven_estado === 'Anulada') {
                return response()->json([
                    'codigo' => 0,
                    'mensaje' => 'La venta ya está anulada'
                ], 400);
            }

            // Verificar que la caja esté abierta
            if ($venta->caja->caja_estado !== 'Abierta') {
                return response()->json([
                    'codigo' => 0,
                    'mensaje' => 'La caja debe estar abierta para anular ventas'
                ], 400);
            }

            // Restaurar stock de productos
            foreach ($venta->detalles as $detalle) {
                Producto::where('prod_id', $detalle->prod_id)
                    ->increment('prod_stock_actual', $detalle->vendet_cantidad);
            }

            // Revertir saldo de caja
            $venta->caja->decrement('caja_saldo', $venta->ven_total);

            // Registrar movimiento de anulación
            caja_movimientos::create([
                'caja_id' => $venta->caja_id,
                'user_id' => auth()->id(),
                'ven_id' => $venta->ven_id,
                'cajamov_tipo' => 'Anulación',
                'cajamov_monto' => -$venta->ven_total, // Monto negativo
                'cajamov_saldo_final' => $venta->caja->caja_saldo,
                'cajamov_desc' => 'ANULACIÓN - ' . $request->motivo
            ]);

            // Marcar venta como anulada
            $venta->update([
                'ven_estado' => 'Anulada',
                'user_anulacion_id' => auth()->id(),
                'fecha_anulacion' => now(),
                'motivo_anulacion' => $request->motivo
            ]);

            DB::commit();

            return response()->json([
                'codigo' => 1,
                'mensaje' => 'Venta anulada exitosamente'
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error al anular venta: ' . $e->getMessage());

            return response()->json([
                'codigo' => 0,
                'mensaje' => 'Error al anular la venta',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function obtenerMetricasDelDia()
    {
        try {
            $hoy = now()->toDateString();

            $cajaAbierta = Caja::where('caja_estado', 'Abierta')->first();

            $metricas = [
                'total_ventas' => Ventas::where('ven_fecha', $hoy)->count(),
                'total_productos_vendidos' => VentasDetalle::whereHas('venta', function ($query) use ($hoy) {
                    $query->where('ven_fecha', $hoy);
                })->sum('vendet_cantidad'),
                'ingresos_hoy' => Ventas::where('ven_fecha', $hoy)->sum('ven_total'),
                'saldo_caja_actual' => $cajaAbierta ? $cajaAbierta->caja_saldo : 0
            ];

            return response()->json([
                'codigo' => 1,
                'mensaje' => 'Métricas obtenidas',
                'data' => $metricas
            ]);
        } catch (Exception $e) {
            return response()->json([
                'codigo' => 0,
                'mensaje' => 'Error al obtener métricas',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
}
