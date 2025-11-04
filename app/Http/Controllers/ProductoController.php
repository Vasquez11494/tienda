<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\ProductoTipo;
use App\Models\StockMovimiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Picqer\Barcode\BarcodeGeneratorPNG;


class ProductoController extends Controller
{
    // Listar productos
    public function index()
    {
        $productos = Producto::with('tipo')
            ->where('prod_situacion', 'Activo')
            ->orderBy('prod_nombre')
            ->paginate(20);

        $tipos = ProductoTipo::where('tprod_situacion', '1')
            ->withCount(['productos' => function ($query) {
                $query->where('prod_situacion', 'Activo');
            }])
            ->get();

        return view('productos.index', compact('productos', 'tipos'));
    }

    // ============================================
    // OBTENER DATOS PARA DATATABLE (AJAX)
    // ============================================
    public function obtenerDatosAPI(Request $request)
    {
        try {
            $query = Producto::with('tipo')
                ->where('prod_situacion', 'Activo');

            // Filtrar por categoría si se envía
            if ($request->has('categoria') && $request->categoria != '') {
                $query->where('tprod_id', $request->categoria);
            }

            $productos = $query->orderBy('prod_nombre')->get();

            // Calcular estadísticas
            $stockBajo = $productos->filter(function ($p) {
                return $p->prod_stock_actual > 0 && $p->prod_stock_actual <= $p->prod_stock_minimo;
            })->count();

            $sinStock = $productos->where('prod_stock_actual', 0)->count();

            return response()->json([
                'codigo' => 1,
                'mensaje' => 'Datos obtenidos correctamente',
                'data' => $productos,
                'estadisticas' => [
                    'total' => $productos->count(),
                    'stock_bajo' => $stockBajo,
                    'sin_stock' => $sinStock,
                    'stock_normal' => $productos->count() - $stockBajo - $sinStock
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'codigo' => 0,
                'mensaje' => 'Error al obtener datos: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    // ============================================
    // MOSTRAR UN PRODUCTO ESPECÍFICO (AJAX)
    // ============================================
    public function show($id)
    {
        try {
            $producto = Producto::with('tipo')->findOrFail($id);

            return response()->json([
                'success' => true,
                'producto' => $producto
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Producto no encontrado'
            ], 404);
        }
    }

    // ============================================
    // GUARDAR NUEVO PRODUCTO (AJAX)
    // ============================================
    public function store(Request $request)
    {
        $request->validate([
            'prod_codigo' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('productos', 'prod_codigo')->where(function ($query) {
                    return $query->where('prod_situacion', 'Activo');
                })
            ],
            'prod_nombre' => [
                'required',
                'string',
                'max:200',
                Rule::unique('productos', 'prod_nombre')->where(function ($query) {
                    return $query->where('prod_situacion', 'Activo');
                })
            ],
            'prod_descripcion' => 'nullable|string',
            'prod_precio_compra' => 'required|numeric|min:0',
            'prod_precio_venta' => 'required|numeric|min:0',
            'prod_stock_minimo' => 'required|integer|min:0',
            'prod_stock_actual' => 'required|integer|min:0',
            'tprod_id' => 'required|exists:producto_tipo,tprod_id',
            'prod_imagen' => 'nullable|image|max:2048'
        ]);

        DB::beginTransaction();
        try {
            // VERIFICAR MANUALMENTE si el código ya existe en productos ACTIVOS
            if ($request->prod_codigo) {
                $codigoExistente = Producto::where('prod_codigo', $request->prod_codigo)
                    ->where('prod_situacion', 'Activo')
                    ->exists();

                if ($codigoExistente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El código de barras ya existe para otro producto activo'
                    ], 422);
                }
            }

            // Si no tiene código, generar uno único
            $codigo = $request->prod_codigo ?: Producto::generarCodigoUnico();

            // Procesar imagen si existe
            $imagenPath = null;
            if ($request->hasFile('prod_imagen')) {
                $imagenPath = $request->file('prod_imagen')->store('productos', 'public');
            }

            // Crear producto
            $producto = Producto::create([
                'prod_codigo' => $codigo,
                'prod_nombre' => $request->prod_nombre,
                'prod_descripcion' => $request->prod_descripcion,
                'prod_precio_compra' => $request->prod_precio_compra,
                'prod_precio_venta' => $request->prod_precio_venta,
                'prod_stock_minimo' => $request->prod_stock_minimo,
                'prod_stock_actual' => $request->prod_stock_actual,
                'prod_imagen' => $imagenPath,
                'tprod_id' => $request->tprod_id,
                'prod_situacion' => 'Activo'
            ]);

            if ($request->prod_stock_actual > 0) {
                StockMovimiento::create([
                    'prod_id' => $producto->prod_id,
                    'mov_tipo' => 'Entrada',
                    'mov_cantidad' => $request->prod_stock_actual,
                    'mov_stock_anterior' => 0,
                    'mov_stock_nuevo' => $request->prod_stock_actual,
                    'mov_motivo' => 'Stock inicial',
                    'mov_observacion' => 'Registro inicial del producto'
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Producto registrado exitosamente',
                'producto' => $producto->load('tipo')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el producto: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ACTUALIZAR PRODUCTO (AJAX)
    // ============================================
    public function update(Request $request, $id)
    {
        $request->validate([
            'prod_codigo' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('productos', 'prod_codigo')
                    ->where(function ($query) {
                        return $query->where('prod_situacion', 'Activo');
                    })
                    ->ignore($id, 'prod_id')
            ],
            'prod_nombre' => [
                'required',
                'string',
                'max:200',
                Rule::unique('productos', 'prod_nombre')
                    ->where(function ($query) {
                        return $query->where('prod_situacion', 'Activo');
                    })
                    ->ignore($id, 'prod_id')
            ],
            'prod_descripcion' => 'nullable|string',
            'prod_precio_compra' => 'required|numeric|min:0',
            'prod_precio_venta' => 'required|numeric|min:0',
            'prod_stock_minimo' => 'required|integer|min:0',
            'tprod_id' => 'required|exists:producto_tipo,tprod_id',
            'prod_imagen' => 'nullable|image|max:2048'
        ]);

        DB::beginTransaction();
        try {
            $producto = Producto::findOrFail($id);

            // VERIFICAR MANUALMENTE si el código ya existe en productos ACTIVOS (excluyendo el actual)
            if ($request->prod_codigo && $request->prod_codigo !== $producto->prod_codigo) {
                $codigoExistente = Producto::where('prod_codigo', $request->prod_codigo)
                    ->where('prod_situacion', 'Activo')
                    ->where('prod_id', '!=', $id)
                    ->exists();

                if ($codigoExistente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El código de barras ya existe para otro producto activo'
                    ], 422);
                }
            }

            // Si no tiene código, usar el existente
            $codigo = $request->prod_codigo ?: $producto->prod_codigo;

            // Procesar nueva imagen si existe
            $imagenPath = $producto->prod_imagen;
            if ($request->hasFile('prod_imagen')) {
                // Eliminar imagen anterior si existe
                if ($producto->prod_imagen) {
                    Storage::disk('public')->delete($producto->prod_imagen);
                }
                $imagenPath = $request->file('prod_imagen')->store('productos', 'public');
            }

            // Actualizar producto (sin modificar stock desde aquí)
            $producto->update([
                'prod_codigo' => $codigo,
                'prod_nombre' => $request->prod_nombre,
                'prod_descripcion' => $request->prod_descripcion,
                'prod_precio_compra' => $request->prod_precio_compra,
                'prod_precio_venta' => $request->prod_precio_venta,
                'prod_stock_minimo' => $request->prod_stock_minimo,
                'prod_imagen' => $imagenPath,
                'tprod_id' => $request->tprod_id
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Producto actualizado exitosamente',
                'producto' => $producto->load('tipo')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el producto: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ENTRADA DE STOCK - NUEVO MÉTODO
    // ============================================
    // REEMPLAZAR o MEJORAR el método entradaStock en ProductoController.php

    /**
     * Entrada o salida de stock
     * La cantidad puede ser positiva (entrada) o negativa (salida)
     */
    public function entradaStock(Request $request, $id)
    {
        $request->validate([
            'cantidad' => 'required|integer|not_in:0',
            'motivo' => 'nullable|string|max:200'
        ]);

        DB::beginTransaction();
        try {
            $producto = Producto::findOrFail($id);
            $stockAnterior = $producto->prod_stock_actual;
            $cantidad = $request->cantidad;
            $nuevoStock = $stockAnterior + $cantidad;

            // Validar que no quede stock negativo
            if ($nuevoStock < 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay suficiente stock. Stock actual: ' . $stockAnterior
                ], 400);
            }

            // Actualizar stock
            $producto->update(['prod_stock_actual' => $nuevoStock]);

            // Determinar tipo de movimiento
            $tipoMovimiento = $cantidad > 0 ? 'Entrada' : 'Salida';
            $cantidadAbsoluta = abs($cantidad);

            // Registrar movimiento
            StockMovimiento::create([
                'prod_id' => $producto->prod_id,
                'mov_tipo' => $tipoMovimiento,
                'mov_cantidad' => $cantidadAbsoluta,
                'mov_stock_anterior' => $stockAnterior,
                'mov_stock_nuevo' => $nuevoStock,
                'mov_motivo' => $request->motivo ?: ($tipoMovimiento === 'Entrada' ? 'Entrada de mercancía' : 'Salida de mercancía'),
                'mov_observacion' => 'Movimiento registrado vía escáner: ' . ($cantidad > 0 ? '+' : '-') . $cantidadAbsoluta . ' unidades'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stock actualizado correctamente',
                'producto' => $producto->load('tipo'),
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $nuevoStock,
                'tipo_movimiento' => $tipoMovimiento
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar stock: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ELIMINAR PRODUCTO (AJAX)
    // ============================================
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $producto = Producto::findOrFail($id);

            // Cambiar situación a Inactivo en lugar de eliminar
            $producto->update(['prod_situacion' => 'Inactivo']);

            // Registrar movimiento de baja si tiene stock
            if ($producto->prod_stock_actual > 0) {
                StockMovimiento::create([
                    'prod_id' => $producto->prod_id,
                    'mov_tipo' => 'Salida',
                    'mov_cantidad' => $producto->prod_stock_actual,
                    'mov_stock_anterior' => $producto->prod_stock_actual,
                    'mov_stock_nuevo' => 0,
                    'mov_motivo' => 'Producto eliminado',
                    'mov_observacion' => 'Producto dado de baja del sistema'
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Producto eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el producto: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // BUSCAR PRODUCTO POR CÓDIGO DE BARRAS (AJAX)
    // ============================================
    public function buscarPorCodigo(Request $request)
    {
        $codigo = $request->codigo;
        $producto = Producto::where('prod_codigo', $codigo)
            ->where('prod_situacion', 'Activo')
            ->with('tipo')
            ->first();

        if ($producto) {
            return response()->json([
                'success' => true,
                'encontrado' => true,
                'producto' => $producto
            ]);
        }

        return response()->json([
            'success' => true,
            'encontrado' => false,
            'codigo' => $codigo,
            'message' => 'Producto no encontrado'
        ]);
    }
    public function stockView()
    {
        $tipos = ProductoTipo::where('tprod_situacion', '1')
            ->withCount(['productos' => function ($query) {
                $query->where('prod_situacion', 'Activo');
            }])
            ->orderBy('tprod_nombre')
            ->get();

        return view('productos.stock', compact('tipos'));
    }


    public function etiquetaBarcode($codigo)
    {
        $generator = new BarcodeGeneratorPNG();
        $pngData = $generator->getBarcode($codigo, $generator::TYPE_CODE_128, 2, 60);

        return response($pngData, 200)->header('Content-Type', 'image/png');
    }

    // NUEVO: asignar un código interno si el producto no lo tiene aún
    public function asignarCodigo($id)
    {
        try {
            $producto = Producto::findOrFail($id);

            if ($producto->prod_codigo && !str_starts_with($producto->prod_codigo, 'PROD-') && !str_starts_with($producto->prod_codigo, 'INT-')) {
                return response()->json([
                    'success' => false,
                    'message' => 'El producto ya posee un código de barras válido.'
                ], 400);
            }

            $producto->prod_codigo = Producto::generarCodigoUnico(); // usa tu helper
            $producto->save();

            return response()->json([
                'success' => true,
                'message' => 'Código interno generado correctamente.',
                'producto' => $producto->load('tipo'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo generar el código: ' . $e->getMessage()
            ], 500);
        }
    }
}
