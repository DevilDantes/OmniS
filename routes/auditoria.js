import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/auditoria - Obtener registros de auditoría
router.get('/', async (req, res) => {
  try {
    // Simular datos de auditoría (en producción, esto vendría de una tabla de logs)
    const auditoria = [
      {
        fecha: new Date().toISOString(),
        usuario: 'Admin',
        accion: 'Inicio de sesión',
        modulo: 'login',
        detalles: 'Acceso exitoso al sistema',
        estado: 'exitoso'
      },
      {
        fecha: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
        usuario: 'Vendedor',
        accion: 'Registro de venta',
        modulo: 'ventas',
        detalles: 'Venta #123 por $50.000',
        estado: 'exitoso'
      },
      {
        fecha: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
        usuario: 'Admin',
        accion: 'Actualización de producto',
        modulo: 'productos',
        detalles: 'Producto #45 actualizado',
        estado: 'exitoso'
      },
      {
        fecha: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
        usuario: 'Sistema',
        accion: 'Alerta de stock',
        modulo: 'alertas',
        detalles: 'Producto con stock bajo',
        estado: 'alerta'
      }
    ];

    res.json(auditoria);
  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;