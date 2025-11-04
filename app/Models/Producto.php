<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    use HasFactory;

    protected $table = "productos";
    protected $primaryKey = 'prod_id';

    protected $fillable = [
        'prod_codigo',
        'prod_nombre',
        'prod_descripcion',
        'prod_precio_compra',
        'prod_precio_venta',
        'prod_stock_minimo',
        'prod_stock_actual',
        'prod_imagen',
        'tprod_id',
        'prod_situacion'
    ];

    public function tipo()
    {
        return $this->belongsTo(ProductoTipo::class, 'tprod_id', 'tprod_id');
    }

    public function movimientos()
    {
        return $this->hasMany(StockMovimiento::class, 'prod_id', 'prod_id');
    }


    public function stockBajo()
    {
        return $this->prod_stock_actual <= $this->prod_stock_minimo;
    }

    // Generar código único si no tiene código de barras
    // En el modelo Producto.php
    public static function generarCodigoUnico()
    {
        do {
            $codigo = 'PROD-' . strtoupper(substr(uniqid(), -8));
        } while (self::where('prod_codigo', $codigo)
            ->where('prod_situacion', 'Activo')
            ->exists()
        );

        return $codigo;
    }
}
