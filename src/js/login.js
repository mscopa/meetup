import Auth from './Auth.mjs';
import { qs } from './utils.mjs';

// Creamos una instancia de nuestro manejador de autenticación
const auth = new Auth();

const loginForm = qs('#login-form');
const messageDiv = qs('#login-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = qs('#email').value;
    const password = qs('#password').value;
    
    messageDiv.textContent = 'Iniciando sesión...';
    messageDiv.style.color = 'black';

    // Llamamos al método de login de nuestra clase Auth
    const result = await auth.login({ email, password });

    if (result.success) {
        messageDiv.textContent = `¡Bienvenido, ${result.user.first_name}!`;
        messageDiv.style.color = 'green';
        
        // Redirigimos al dashboard después de un segundo
        setTimeout(() => {
            window.location.href = '/dashboard.html'; // O a donde quieras ir
        }, 1000);

    } else {
        messageDiv.textContent = `Error: ${result.message}`;
        messageDiv.style.color = 'red';
    }
});