import express from 'express';
import { db } from '../db.js';  

const router = express.Router();

// GET /api/auditoria - Obtener registros de auditoría desde la BD
router.get('/', async (req, res) => {
  try {
    const auditoria = [];

    // 1. Movimientos de Inventario (datos REALES)
    try {
      const [movimientos] = await db.query(
        `SELECT mi.id_movimiento, mi.tipo_movimiento, mi.cantidad, mi.fecha_movimiento, 
                pv.sku, pv.talla, pv.color, u.nombre as usuario
         FROM movimientos_inventario mi
         JOIN producto_variantes pv ON mi.id_variante = pv.id_variante
         JOIN usuarios u ON mi.id_usuario = u.id_usuario
         ORDER BY mi.fecha_movimiento DESC LIMIT 20`
      );
      
      movimientos.forEach(m => {
        const tipoAccion = m.tipo_movimiento === 'entrada' ? 'Entrada de stock' : 
                          m.tipo_movimiento === 'salida' ? 'Salida de stock' : 
                          m.tipo_movimiento === 'ajuste' ? 'Ajuste de inventario' : 'Movimiento';
        
        auditoria.push({
          fecha: m.fecha_movimiento,
          usuario: m.usuario || 'Sistema',
          accion: tipoAccion,
          modulo: 'inventario',
          detalles: `${m.sku} (${m.talla || 'N/A'} - ${m.color || 'N/A'}): ${m.cantidad} unidades`,
          estado: 'exitoso'
        });
      });
    } catch (err) {
      console.log('Nota: No se pudo cargar movimientos de inventario');
    }

    // 2. Órdenes de Venta (datos REALES)
    try {
      const [ventas] = await db.query(
        `SELECT ov.id_orden_venta, ov.numero_orden, ov.total, ov.estado, ov.fecha_orden,
                u.nombre as usuario, ov.canal_venta
         FROM ordenes_venta ov
         JOIN usuarios u ON ov.id_usuario = u.id_usuario
         ORDER BY ov.fecha_orden DESC LIMIT 15`
      );
      
      ventas.forEach(v => {
        auditoria.push({
          fecha: v.fecha_orden,
          usuario: v.usuario || 'Sistema',
          accion: 'Orden de venta',
          modulo: 'ventas',
          detalles: `${v.numero_orden} - ${v.canal_venta} - $${v.total} (${v.estado})`,
          estado: v.estado === 'completada' || v.estado === 'pagada' ? 'exitoso' : 'alerta'
        });
      });
    } catch (err) {
      console.log('Nota: No se pudo cargar órdenes de venta');
    }

    // 3. Productos creados/modificados (datos REALES)
    try {
      const [productos] = await db.query(
        `SELECT id_producto, nombre, actualizado_en 
         FROM productos 
         ORDER BY actualizado_en DESC LIMIT 10`
      );
      
      productos.forEach(p => {
        auditoria.push({
          fecha: p.actualizado_en,
          usuario: 'Sistema',
          accion: 'Actualización de producto',
          modulo: 'productos',
          detalles: `Producto: ${p.nombre} (#${p.id_producto})`,
          estado: 'exitoso'
        });
      });
    } catch (err) {
      console.log('Nota: No se pudo cargar productos');
    }

    // 4. Alertas (datos REALES)
    try {
      const [alertas] = await db.query(
        `SELECT a.id_alerta, a.tipo_alerta, a.valor_actual, a.valor_umbral, 
                a.fecha_generacion, pi.sku, pi.talla
         FROM alertas a
         JOIN inventario inv ON a.id_inventario = inv.id_inventario
         JOIN producto_variantes pi ON inv.id_variante = pi.id_variante
         ORDER BY a.fecha_generacion DESC LIMIT 10`
      );
      
      alertas.forEach(a => {
        const tipoAlerta = a.tipo_alerta === 'stock_bajo' ? 'Stock bajo' : 
                          a.tipo_alerta === 'stock_cero' ? 'Stock agotado' : 
                          a.tipo_alerta === 'sobre_stock' ? 'Sobre stock' : 'Ajuste';
        
        auditoria.push({
          fecha: a.fecha_generacion,
          usuario: 'Sistema',
          accion: tipoAlerta,
          modulo: 'alertas',
          detalles: `${a.sku} (${a.talla}): ${a.valor_actual} de ${a.valor_umbral} unidades`,
          estado: a.valor_actual === 0 ? 'alerta' : 'exitoso'
        });
      });
    } catch (err) {
      console.log('Nota: No se pudo cargar alertas');
    }

    // Ordenar por fecha descendente y limitar a 100
    auditoria.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const resultado = auditoria.slice(0, 100);

    res.json(resultado);
  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
