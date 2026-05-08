# OmniSynch Inventory System

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue)](https://www.mysql.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple)](https://getbootstrap.com/)
[![Railway](https://img.shields.io/badge/Deployed%20on-Railway-0B0D0E)](https://railway.app/)

## 📋 Descripción

OmniSynch Automations es un sistema ERP completo de gestión de inventario diseñado para pequeñas y medianas empresas (PYMEs). Ofrece una solución integral para controlar productos, inventario, ventas, proveedores y clientes, con una interfaz web moderna y un backend robusto basado en Node.js.

### ✨ Características Principales
- 🔐 **Autenticación Segura**: Sistema de login con JWT
- 📊 **Dashboard Interactivo**: Métricas en tiempo real y alertas
- 📦 **Gestión de Inventario**: Control de stock, productos y categorías
- 🛒 **Sistema de Ventas**: Punto de venta y reportes
- 👥 **Gestión de Usuarios**: Roles y permisos
- 📱 **Interfaz Responsive**: Optimizada para desktop y móvil
- 🌐 **Despliegue en la Nube**: Compatible con Railway y otros servicios

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con **Express.js**
- **MySQL** (Aiven Cloud)
- **JWT** para autenticación
- **CORS** para manejo de orígenes cruzados

### Frontend
- **HTML5**, **CSS3**, **JavaScript (ES6+)**
- **Bootstrap 5** para UI/UX
- **SweetAlert2** para notificaciones
- **Font Awesome/Bootstrap Icons**

## 📁 Estructura del Proyecto

```
OmniS/
├── backend/                    # Servidor Node.js
│   ├── server.js              # Punto de entrada del servidor
│   ├── db.js                  # Configuración de base de datos
│   └── routes/                # Endpoints de la API
│       ├── auth.js
│       ├── productos.js
│       ├── inventario.js
│       └── ...
├── frontend/
│   ├── dist/                  # Archivos de producción (servidos por Railway)
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── panel.html
│   │   ├── tienda.html
│   │   ├── js/
│   │   ├── css/
│   │   └── img/
│   └── src/                   # Archivos fuente (opcional)
├── js/                        # Scripts del frontend (fuente)
├── css/                       # Estilos (fuente)
├── img/                       # Imágenes (fuente)
├── package.json               # Dependencias del proyecto
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** (versión 18 o superior)
- **MySQL** (local o en la nube como Aiven)
- **Git** para clonar el repositorio

### 1. Clonar el Repositorio
```bash
git clone https://github.com/DevilDantes/OmniS.git
cd OmniS
```

### 2. Configurar el Backend
```bash
cd backend
npm install
```

### 3. Configurar la Base de Datos
Edita `backend/db.js` con tus credenciales de MySQL:

```javascript
export const db = await mysql.createPool({
  host: 'tu-host.mysql.database.azure.com',
  user: 'tu-usuario',
  password: 'tu-password',
  database: 'omnisynch_inventory',
  port: 3306,
  ssl: { rejectUnauthorized: false }
});
```

### 4. Iniciar el Servidor
```bash
npm start
```
El servidor estará disponible en `http://localhost:3000`.

### 5. Configurar el Frontend
Los archivos estáticos están en `frontend/dist/`. Para desarrollo local:
- Usa un servidor web como Live Server en VS Code
- O configura Apache/Nginx para servir la carpeta `frontend/dist/`

## 🌐 Despliegue en Railway

### Configuración Automática
1. **Conecta tu repositorio GitHub** a Railway
2. **Configura variables de entorno** (si es necesario):
   - `NODE_ENV=production`
   - Credenciales de BD (si no están en el código)
3. **Despliega**: Railway detectará automáticamente `package.json` y `backend/server.js`

### Variables de Entorno Recomendadas
```env
DATABASE_HOST=tu-host.aivencloud.com
DATABASE_USER=avnadmin
DATABASE_PASSWORD=tu-password
DATABASE_NAME=omnisynch_inventory
JWT_SECRET=tu_clave_secreta_jwt
```

### URL de Producción
Una vez desplegado, tu aplicación estará disponible en una URL como:
`https://omnis-production-xxxx.up.railway.app`

## 📖 Uso

### Acceso al Sistema
1. Ve a la página principal (`index.html`)
2. Haz clic en "Iniciar Sesión"
3. Ingresa tus credenciales de usuario

### Funcionalidades Principales
- **Dashboard**: Vista general con estadísticas
- **Productos**: Agregar, editar y gestionar catálogo
- **Inventario**: Control de stock y alertas
- **Ventas**: Registrar transacciones
- **Reportes**: Análisis y exportación de datos

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Para contribuir:

1. **Fork** el proyecto
2. Crea una **branch** para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. **Push** a la branch (`git push origin feature/nueva-funcionalidad`)
5. Abre un **Pull Request**

### Guías de Contribución
- Sigue las convenciones de código existentes
- Agrega tests para nuevas funcionalidades
- Actualiza la documentación según sea necesario

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Autor**: DevilDantes
- **GitHub**: [https://github.com/DevilDantes/OmniS](https://github.com/DevilDantes/OmniS)
- **Email**: [tu-email@ejemplo.com]

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!

## Uso
1. Abre `index.html` en tu navegador para la página principal.
2. Usa `login.html` para autenticarte.
3. Una vez logueado, accede a `panel.html` para gestionar el inventario.
4. El backend proporciona endpoints RESTful para todas las operaciones CRUD.

## Endpoints de la API
- `GET /api/health` - Verificar estado del servidor y BD
- `POST /api/auth/login` - Autenticación
- `GET /api/productos` - Obtener productos
- `POST /api/producto` - Crear producto
- Y muchos más en las rutas correspondientes.

## Contribución
Para contribuir al proyecto:
1. Haz un fork del repositorio.
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`).
4. Push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## Licencia
Este proyecto está bajo la Licencia ISC.

## Contacto
Para preguntas o soporte, contacta al equipo de desarrollo.
