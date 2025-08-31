import { loadHeader } from './Header.mjs';
import Auth from './Auth.mjs'; // Asegúrate que la ruta al módulo sea correcta

// 1. Creamos una instancia de nuestro manejador de autenticación
const auth = new Auth();

// 2. ¡EL GUARDIA! Esta es la verificación principal.
// Se ejecuta inmediatamente cuando se carga el script.
if (!auth.isLoggedIn()) {
    // Si el método isLoggedIn() devuelve false (porque no hay token)...
    console.log("Acceso denegado. Redirigiendo al login...");
    
    // ...redirigimos al usuario a la página de login.
    // Usamos replace() para que el usuario no pueda usar el botón "Atrás" del navegador
    // para volver a la página protegida.
    window.location.replace('/login/index.html'); 
} else {
    // 3. Si el guardia nos deja pasar (porque sí hay un token)...
    console.log("Acceso permitido. Cargando la aplicación principal...");

    // ...entonces todo el código que carga tu página principal va aquí dentro.
    initializeApp();
}


// 4. Envuelve el resto de tu lógica en una función.
function initializeApp() {
    // TODO: Todo tu código existente de main.js va aquí.
    // Por ejemplo:
    loadHeader();
    // showPuzzles();
    // etc.
    
    const user = auth.getUser();
    console.log(`Bienvenido de nuevo, ${user.first_name}! Rol: ${user.role}`);
}
initializeApp();