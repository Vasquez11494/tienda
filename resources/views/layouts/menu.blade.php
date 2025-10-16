<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>@yield('title', config('app.name', 'Tienda Aprils'))</title>

    <!-- Fuente -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body class="bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 text-gray-800 font-sans antialiased min-h-screen flex flex-col">

    <!-- NAVBAR -->
    <nav class="bg-white/80 backdrop-blur-md border-b border-emerald-100 shadow-sm fixed top-0 left-0 w-full z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">

                <!-- LOGO Y NOMBRE -->
                <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-lg bg-white shadow-sm ring-1 ring-emerald-200 flex items-center justify-center p-1.5">
                        <img src="{{ asset('images/LOGO_TIENDA.png') }}" class="h-full w-full object-contain" alt="Tienda Aprils">
                    </div>
                    <div class="hidden sm:block">
                        <a href="{{ url('/dashboard') }}" class="text-lg font-bold text-gray-800 hover:text-emerald-600 transition">
                            Tienda Aprils
                        </a>
                        <p class="text-xs text-gray-500 -mt-0.5">Sistema de</p>
                    </div>
                </div>

                <!-- MENÚ DESKTOP -->
                <div class="hidden lg:flex items-center gap-1">

                    <!-- Productos -->
                    <div class="relative group" data-menu="productos">
                        <button type="button"
                            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                            aria-haspopup="true" aria-expanded="false" aria-controls="menu-productos">
                            <!-- Icono -->
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                            Productos
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>

                        <div id="menu-productos"
                            class="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40"
                            role="menu" aria-label="Submenú Productos">

                            <a href="{{ url('/productos/tipo') }}"
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition group" role="menuitem">
                                <div class="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                                    </svg>
                                </div>
                                <span class="flex-1">Categoría de Productos</span>
                            </a>

                            <a href="{{ route('productos.index') }}"
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition group" role="menuitem">
                                <div class="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition">
                                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                    </svg>
                                </div>
                                <span class="flex-1">Agregar/Actualizar Producto</span>
                            </a>

                            <a href="{{ route('productos.reportes.index') }}"
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition group" role="menuitem">
                                <div class="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                                    <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                </div>
                                <span class="flex-1">Reporte</span>
                            </a>
                        </div>
                    </div>

                    <!-- Ventas -->
                    <div class="relative group" data-menu="ventas">
                        <button type="button"
                            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                            aria-haspopup="true" aria-expanded="false" aria-controls="menu-ventas">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            Ventas
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>

                        <div id="menu-ventas"
                            class="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40"
                            role="menu" aria-label="Submenú Ventas">

                            <a href="{{ url('/ventas/index') }}"
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition group" role="menuitem">
                                <div class="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition">
                                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                </div>
                                <span class="flex-1">Nueva Venta</span>
                            </a>

                            <a href="{{ url('/ventas') }}"
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition group" role="menuitem">
                                <div class="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <span class="flex-1">Historial de Ventas</span>
                            </a>

                            <a href="{{ url('/ventas/reportes') }}"
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition group" role="menuitem">
                                <div class="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                                    <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                    </svg>
                                </div>
                                <span class="flex-1">Reportes y Gráficas</span>
                            </a>
                        </div>
                    </div>

                    <!-- Clientes -->
                    <div class="relative group" data-menu="clientes">
                        <button type="button"
                            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                            aria-haspopup="true" aria-expanded="false" aria-controls="menu-clientes">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            Clientes
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>

                        <div id="menu-clientes"
                            class="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40"
                            role="menu" aria-label="Submenú Clientes">

                            <a href="{{ url('/clientes') }}"
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition group" role="menuitem">
                                <div class="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                </div>
                                <span class="flex-1">Listado / Fiadores</span>
                            </a>

                            <a href="{{ url('/clientes/create') }}"
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition group" role="menuitem">
                                <div class="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition">
                                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                                    </svg>
                                </div>
                                <span class="flex-1">Nuevo Cliente</span>
                            </a>

                            <a href="{{ url('/clientes/segmentos') }}"
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition group" role="menuitem">
                                <div class="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                                    <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <span class="flex-1">Reporte de Ventas</span>
                            </a>
                        </div>
                    </div>

                </div>

                <!-- USER Y LOGOUT -->
                <div class="flex items-center gap-3">
                    <!-- Dropdown de perfil -->
                    <div class="relative">
                        <button id="profileDropdownBtn"
                            class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition">
                            <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold">
                                {{ strtoupper(substr(Auth::user()->name ?? 'I', 0, 1)) }}
                            </div>
                            <span class="text-sm font-medium text-gray-700">{{ Auth::user()->name ?? 'Invitado' }}</span>
                            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>

                        <!-- Dropdown menu -->
                        <div id="profileDropdown"
                            class="hidden absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            <div class="px-4 py-3 border-b border-gray-100">
                                <p class="text-sm font-medium text-gray-900">{{ Auth::user()->name ?? 'Invitado' }}</p>
                                <p class="text-xs text-gray-500 truncate">{{ Auth::user()->email ?? '' }}</p>
                            </div>
                            <a href="{{ url('/profile/edit') }}"
                                class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 transition">
                                Editar Perfil
                            </a>
                            <a href="{{ url('/profile/edit#password') }}"
                                class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 transition">
                                Cambiar Contraseña
                            </a>
                            <div class="border-t border-gray-100"></div>
                            <form method="POST" action="{{ url('/logout') }}">
                                @csrf
                                <button type="submit"
                                    class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">
                                    Cerrar Sesión
                                </button>
                            </form>
                        </div>
                    </div>

                    @auth
                    <!-- Botón logout móvil -->
                    <form method="POST" action="{{ url('/logout') }}" class="md:hidden">
                        @csrf
                        <button type="submit"
                            class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 shadow-sm hover:shadow transition">
                            Salir
                        </button>
                    </form>
                    @endauth

                    <!-- BOTÓN MENÚ MÓVIL -->
                    <button id="mobileMenuBtn"
                        class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition" aria-controls="mobileMenu" aria-expanded="false">
                        <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- MENÚ MÓVIL (ACORDEONES) -->
        <div id="mobileMenu" class="hidden lg:hidden border-t border-emerald-100 bg-white">
            <div class="px-4 py-3 space-y-1">
                <!-- Usuario en móvil -->
                <div class="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg mb-2">
                    <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold">
                        {{ strtoupper(substr(Auth::user()->name ?? 'I', 0, 1)) }}
                    </div>
                    <span class="text-sm font-medium text-gray-700">{{ Auth::user()->name ?? 'Invitado' }}</span>
                </div>

                <!-- Productos -->
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                    <button type="button" class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-emerald-50"
                        data-accordion-btn="productos">
                        <span>Mis Productos</span>
                        <svg class="w-4 h-4 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div class="hidden flex-col" data-accordion-panel="productos">
                        <a href="{{ url('/productos/tipo') }}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Categoría de Productos</a>
                        <a href="{{ route('productos.index') }}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Agregar/Actualizar Producto</a>
                        <a href="{{ route('productos.reportes.index') }}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Reporte</a>
                    </div>
                </div>

                <!-- Ventas -->
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                    <button type="button" class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-emerald-50"
                        data-accordion-btn="ventas">
                        <span>Ventas</span>
                        <svg class="w-4 h-4 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div class="hidden flex-col" data-accordion-panel="ventas">
                        <a href="{{ url('/ventas/index') }}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Nueva Venta</a>
                        <a href="{{ url('/ventas') }}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Historial de Ventas</a>
                        <a href="{{ url('/ventas/reportes') }}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Reportes y Gráficas</a>
                    </div>
                </div>

                <!-- Clientes -->
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                    <button type="button" class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-emerald-50"
                        data-accordion-btn="clientes">
                        <span>Clientes</span>
                        <svg class="w-4 h-4 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div class="hidden flex-col" data-accordion-panel="clientes">
                        <a href="{{ url('/clientes') }}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Listado / Fiadores</a>
                        <a href="{{ url('/clientes/create') }}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Nuevo Cliente</a>
                        <a href="{{ url('/clientes/segmentos') }}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Reporte de Ventas</a>
                    </div>
                </div>

                <div class="border-t border-gray-200 my-2"></div>

                <a href="{{ url('/profile/edit') }}"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition">
                    Editar Perfil
                </a>
                <a href="{{ url('/profile/edit#password') }}"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition">
                    Cambiar Contraseña
                </a>
            </div>
        </div>
    </nav>

    <!-- CONTENIDO PRINCIPAL -->
    <div class="flex-1 pt-20 pb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- HEADER OPCIONAL -->
            @hasSection('header')
            <header class="mb-6">
                <div class="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-emerald-100">
                    <h1 class="text-3xl font-bold text-gray-800">@yield('header')</h1>
                    @hasSection('subtitle')
                    <p class="text-gray-600 mt-1">@yield('subtitle')</p>
                    @endif
                </div>
            </header>
            @endif

            <!-- CONTENIDO -->
            <main>
                @yield('content')
            </main>
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="bg-white/80 backdrop-blur-md border-t border-emerald-100 py-6 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div class="flex items-center gap-2">
                    <div class="h-8 w-8 rounded-lg bg-white shadow-sm ring-1 ring-emerald-200 flex items-center justify-center p-1">
                        <img src="{{ asset('images/LOGO_TIENDA.png') }}" class="h-full w-full object-contain" alt="Tienda Aprils">
                    </div>
                    <div class="text-left">
                        <p class="text-sm font-semibold text-gray-800">Tienda Aprils</p>
                        <p class="text-xs text-gray-500">Sistema de</p>
                    </div>
                </div>
                <p class="text-sm text-gray-600">&copy; {{ date('Y') }} Todos los derechos reservados.</p>
            </div>
        </div>
    </footer>

    <!-- SCRIPTS -->
    <script>
        // Helpers
        const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
        const $ = (sel, ctx = document) => ctx.querySelector(sel);

        // Menú móvil toggle
        const mobileBtn = $('#mobileMenuBtn');
        const mobileMenu = $('#mobileMenu');
        mobileBtn?.addEventListener('click', () => {
            const isHidden = mobileMenu.classList.toggle('hidden');
            mobileBtn.setAttribute('aria-expanded', String(!isHidden));
        });

        // Acordeones móvil
        $$('[data-accordion-btn]').forEach(btn => {
            const key = btn.getAttribute('data-accordion-btn');
            const panel = document.querySelector(`[data-accordion-panel="${key}"]`);
            const icon = btn.querySelector('svg');
            btn.addEventListener('click', () => {
                const isOpen = !panel.classList.contains('hidden');
                // Cerrar otros
                $$('[data-accordion-panel]').forEach(p => {
                    if (p !== panel) p.classList.add('hidden');
                });
                $$('[data-accordion-btn]').forEach(b => {
                    if (b !== btn) b.querySelector('svg')?.classList.remove('rotate-180');
                });
                // Toggle actual
                panel.classList.toggle('hidden', isOpen);
                icon?.classList.toggle('rotate-180', !isOpen);
            });
        });

        // Perfil dropdown
        const profileBtn = $('#profileDropdownBtn');
        const profileDropdown = $('#profileDropdown');
        profileBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });

        // Desktop dropdowns click (además del hover)
        const desktopMenus = $$('[data-menu]');
        desktopMenus.forEach(wrapper => {
            const btn = wrapper.querySelector('button[aria-haspopup="true"]');
            const menuId = btn?.getAttribute('aria-controls');
            const panel = menuId ? document.getElementById(menuId) : null;

            btn?.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = panel?.classList.contains('invisible');
                // Cierra otros
                desktopMenus.forEach(w => {
                    if (w !== wrapper) {
                        const b = w.querySelector('button[aria-haspopup="true"]');
                        const id = b?.getAttribute('aria-controls');
                        const p = id ? document.getElementById(id) : null;
                        p?.classList.add('invisible', 'opacity-0', 'translate-y-1');
                        b?.setAttribute('aria-expanded', 'false');
                    }
                });
                // Toggle actual
                if (isHidden) {
                    panel?.classList.remove('invisible', 'opacity-0', 'translate-y-1');
                    btn?.setAttribute('aria-expanded', 'true');
                } else {
                    panel?.classList.add('invisible', 'opacity-0', 'translate-y-1');
                    btn?.setAttribute('aria-expanded', 'false');
                }
            });

            btn?.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    panel?.classList.add('invisible', 'opacity-0', 'translate-y-1');
                    btn?.setAttribute('aria-expanded', 'false');
                    btn?.focus();
                }
            });
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!profileBtn?.contains(e.target) && !profileDropdown?.contains(e.target)) {
                profileDropdown?.classList.add('hidden');
            }
            desktopMenus.forEach(w => {
                if (!w.contains(e.target)) {
                    const b = w.querySelector('button[aria-haspopup="true"]');
                    const id = b?.getAttribute('aria-controls');
                    const p = id ? document.getElementById(id) : null;
                    p?.classList.add('invisible', 'opacity-0', 'translate-y-1');
                    b?.setAttribute('aria-expanded', 'false');
                }
            });
        });

        // Auto scroll a sección de password si existe hash
        if (window.location.hash === '#password') {
            setTimeout(() => {
                document.getElementById('password-section')?.scrollIntoView({
                    behavior: 'smooth'
                });
            }, 100);
        }
    </script>

    @yield('scripts')
</body>

</html>