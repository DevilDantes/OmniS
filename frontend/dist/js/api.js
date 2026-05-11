const API = {
  // Apunta a tu backend de Node.js (Express), donde manejamos la lógica y conexión con Make.
  BASE_URL: `${window.location.origin}/api`, 

  // 🔐 NUEVO: Función auxiliar para inyectar el Token (Gafete Virtual) en las cabeceras
  getHeaders: () => {
    const headers = { 'Content-Type': 'application/json' };
    // Buscamos el token que guardaste en el navegador al hacer login
    const token = localStorage.getItem('token'); 
    
    if (token) {
      // Si el usuario está logueado, adjuntamos su "gafete"
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Enviar datos a tu backend Node.js (Guardar)
  post: async (endpoint, data) => {
    try {
      const response = await fetch(`${API.BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: API.getHeaders(), // Usamos la función con el token
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Error HTTP: ' + response.status);
      return await response.json();
    } catch (error) {
      console.error(`Error POST a ${endpoint}:`, error);
      throw error;
    }
  },

  // Obtener datos de tu backend Node.js (Leer)
  get: async (endpoint) => {
    try {
      const url = `${API.BASE_URL}/${endpoint}`;
      console.log("Llamando a (Frontend -> Backend):", url); // <-- para debug

      const response = await fetch(url, {
        method: 'GET',
        headers: API.getHeaders() // Usamos la función con el token
      });

      if (!response.ok) {
        console.error("Error HTTP:", response.status);
        // Si da error 401 (No autorizado) o 403, podríamos redirigir al login
        if (response.status === 401 || response.status === 403) {
            console.warn("Sesión expirada o no válida. Redirigiendo al login...");
            // window.location.href = '/login.html'; // Descomenta esto cuando quieras forzar el logout
        }
        throw new Error('Error HTTP: ' + response.status);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error(`Error GET a ${endpoint}:`, error);
      return [];
    }
  }
};