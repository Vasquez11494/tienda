<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class VentasController extends Controller
{
    public function index()
    {
        return view('ventas.index');
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
}
