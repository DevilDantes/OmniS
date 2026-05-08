import express from 'express';
import { db } from '../db.js';  

const router = express.Router();

// GET /api/auditoria - Obtener registros de auditoría desde la BD
router.get('/', async (req, res) => {
  try {
    const auditoria = [];

    // 1. Ventas recientes
    try {
      const [ventas] = await db.query(
        `SELECT id_venta, creado_en, total, estado FROM ventas ORDER BY creado_en DESC LIMIT 10`
      );
      ventas.forEach(v => {
        auditoria.push({
          fecha: v.creado_en || new Date().toISOString(),
          usuario: 'Sistema',
          accion: 'Registro de venta',
          modulo: 'ventas',
          detalles: `Venta #${v.id_venta} por $${v.total} - ${v.estado}`,
          estado: 'exitoso'
        });
      });
    } catch (err) {
      console.log('Nota: No se pudo cargar ventas en auditoría');
    }

    // 2. Productos actualizados/creados
    try {
      const [productos] = await db.query(
        `SELECT id_producto, nombre, creado_en FROM productos ORDER BY creado_en DESC LIMIT 10`
      );
      productos.forEach(p => {
        auditoria.push({
          fecha: p.creado_en || new Date().toISOString(),
          usuario: 'Sistema',
          accion: 'Creación de producto',
          modulo: 'productos',
          detalles: `Producto creado: ${p.nombre} (#${p.id_producto})`,
          estado: 'exitoso'
        });
      });
    } catch (err) {
      console.log('Nota: No se pudo cargar productos en auditoría');
    }

    // 3. Movimientos de inventario
    try {
      const [inventario] = await db.query(
        `SELECT id_inventario, tipo_movimiento, cantidad, creado_en FROM inventario ORDER BY creado_en DESC LIMIT 10`
      );
      inventario.forEach(i => {
        auditoria.push({
          fecha: i.creado_en || new Date().toISOString(),
          usuario: 'Sistema',
          accion: `${i.tipo_movimiento === 'entrada' ? 'Entrada' : 'Salida'} de stock`,
          modulo: 'inventario',
          detalles: `${i.tipo_movimiento === 'entrada' ? '+' : '-'}${i.cantidad} unidades`,
          estado: 'exitoso'
        });
      });
    } catch (err) {
      console.log('Nota: No se pudo cargar inventario en auditoría');
    }

    // 4. Alertas generadas
    try {
      const [alertas] = await db.query(
        `SELECT id_alerta, producto, estado, creado_en FROM alertas ORDER BY creado_en DESC LIMIT 10`
      );
      alertas.forEach(a => {
        auditoria.push({
          fecha: a.creado_en || new Date().toISOString(),
          usuario: 'Sistema',
          accion: 'Alerta de inventario',
          modulo: 'alertas',
          detalles: `${a.producto}: ${a.estado}`,
          estado: a.estado?.includes('Agotado') ? 'alerta' : 'exitoso'
        });
      });
    } catch (err) {
      console.log('Nota: No se pudo cargar alertas en auditoría');
    }

    // Ordenar por fecha descendente y limitar a 50
    auditoria.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const resultado = auditoria.slice(0, 50);

    res.json(resultado);
  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;