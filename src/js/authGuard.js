// Dentro de authGuard.js (versión conceptual)

import Auth from './Auth.mjs';

const auth = new Auth();
const currentPath = window.location.pathname;

// 1. Chequeo de Login (Guardia General)
if (!auth.isLoggedIn()) {
    window.location.replace('/login/index.html');
} else {
    // 2. Chequeo de Rol (Guardia VIP)
    const userRole = auth.getUser().role; // 'participante', 'administrador', etc.

    const permissions = {
        '/editor/index.html': ['administrador', 'matrimonio director'],
        '/ranking/admin.html': ['administrador']
        // Las páginas que no están aquí son accesibles para todos los logueados.
    };

    const allowedRoles = permissions[currentPath];

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Si la página requiere un rol específico y el usuario no lo tiene...
        alert('No tienes permiso para acceder a esta sección.');
        window.location.replace('/index.html'); // ...lo mandamos al menú principal.
    }
}

// Si el script llega hasta aquí sin redirigir, la página puede cargar.