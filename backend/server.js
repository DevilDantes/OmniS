import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';

import productos from '../routes/productos.js';
import inventario from '../routes/inventario.js';
import dashboard from '../routes/dashboard.js';
import alertas from '../routes/alertas.js';
import proveedores from '../routes/proveedores.js';
import categorias from '../routes/categorias.js';
import ventas from '../routes/ventas.js';
import reportes from '../routes/reportes.js';
import marcas from '../routes/marcas.js';
import auth from '../routes/auth.js';
import usuarios from '../routes/usuarios.js';
import clientes from '../routes/clientes.js';

// Configuración necesaria para usar "path" y "__dirname" en módulos ES6 (import)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', auth);

// 🔥 RUTAS DE LA API
app.use('/api/productos', productos);
app.use('/api/producto', productos); // para POST
app.use('/api/inventario', inventario);
app.use('/api/dashboard', dashboard);
app.use('/api/alertas', alertas);
app.use('/api/proveedores', proveedores);
app.use('/api/categorias', categorias);
app.use('/api/ventas', ventas);
app.use('/api/reportes', reportes);
app.use('/api/marcas', marcas);
app.use('/api/usuarios', usuarios);
app.use('/api/clientes', clientes);

// Ruta de salud
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1'); 
        res.status(200).json({ status: 'ok', message: 'Servicios en línea' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Fallo en Base de Datos' });
    }
});

// 🔥 OPCIÓN 1: Mostrar una página web de bienvenida al entrar al dominio principal
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px; color: #333;">
            <h1 style="color: #2563eb;">¡OmniSync Automations está en línea! 🚀</h1>
            <p style="font-size: 18px;">Tu servidor backend está funcionando a la perfección.</p>
            <br>
            <a href="/api/health" style="padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Verificar Estado de la Base de Datos
            </a>
        </div>
    `);
});

/* // 🔥 OPCIÓN 2: Despliegue de Frontend
// Si tienes una carpeta con tu frontend (ej. React/Vite) llamado 'dist' o 'public', 
// puedes borrar la OPCIÓN 1 y descomentar estas líneas para que el servidor muestre tu sistema completo:

app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
*/

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
