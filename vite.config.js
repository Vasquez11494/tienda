import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css', 
                'resources/js/app.js',
                'resources/js/auth/login.js', 
                'resources/js/auth/forgot-pass.js', 
                'resources/js/productos/categorias.js', 
                'resources/js/productos/crear.js', 
                'resources/js/productos/reportes.js', 
                'resources/js/ventas/index.js', 
            ],
            refresh: true,
        }),
    ],
});
