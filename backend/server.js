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
import webhook from '../routes/webhook.js';
import ai from '../routes/ia.js'

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
app.use('/api/auditoria', auditoria);
app.use('/api/webhook', webhook);
app.use('/api/ia', ia);





app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

