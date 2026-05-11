import 'dotenv/config';
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
import auditoria from '../routes/auditoria.js';

// Configuración ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// =========================
// RUTAS API
// =========================

// Ruta de prueba para Railway y Make
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 404 APIs
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta API no encontrada'
  });
});

// SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Auth
app.use('/api/auth', auth);

// Productos
app.use('/api/productos', productos);
app.use('/api/producto', productos);

// Inventario
app.use('/api/inventario', inventario);

// Dashboard
app.use('/api/dashboard', dashboard);

// Alertas
app.use('/api/alertas', alertas);

// Proveedores
app.use('/api/proveedores', proveedores);

// Categorías
app.use('/api/categorias', categorias);

// Ventas
app.use('/api/ventas', ventas);

// Reportes
app.use('/api/reportes', reportes);

// Marcas
app.use('/api/marcas', marcas);

// Usuarios
app.use('/api/usuarios', usuarios);

// Clientes
app.use('/api/clientes', clientes);

// Auditoría
app.use('/api/auditoria', auditoria);

// =========================
// FRONTEND ESTÁTICO
// =========================
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// =========================
// MANEJO DE RUTAS NO ENCONTRADAS
// =========================

// Si la ruta comienza con /api y no existe
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta API no encontrada'
  });
});

// Para SPA/frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// =========================
// INICIAR SERVIDOR
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
});
