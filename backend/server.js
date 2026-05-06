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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN PARA VER TU PÁGINA (FRONTEND) ---

// 1. Le decimos a Express que sirva todos los archivos de la raíz (html, css, js)
app.use(express.static(path.join(__dirname, '../')));

// 2. Rutas de la API
app.use('/api/auth', auth);
app.use('/api/productos', productos);
app.use('/api/producto', productos);
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

// Usamos '(.*)' en lugar de solo '*'
app.get('(.*)', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../index.html'));
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
