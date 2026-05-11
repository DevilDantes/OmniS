import express from 'express';
import { db } from '../db.js';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT(p.nombre, ' (Talla: ', IFNULL(v.talla, 'N/A'), ' - Color: ', IFNULL(v.color, 'N/A'), ')') AS producto,
        IF(a.tipo_alerta = 'stock_cero', 'Stock Cero', 'Stock Bajo') AS tipo_evento,
        a.valor_actual,
        a.valor_umbral,
        IF(a.estado = 'resuelta', '✅ Resuelto', IF(a.tipo_alerta = 'stock_cero', '🔴 Agotado', '⚠️ Crítico')) AS estado
      FROM alertas a
      JOIN inventario i ON a.id_inventario = i.id_inventario
      JOIN producto_variantes v ON i.id_variante = v.id_variante
      JOIN productos p ON v.id_producto = p.id_producto
      ORDER BY a.estado ASC, a.id_alerta DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error al obtener alertas del historial:", error);
    res.status(500).json({ error: "Error interno al cargar las alertas" });
  }
});

// ==========================================
// RUTA 2: NUEVA RUTA PARA ENVIAR A MAKE / IA
// ==========================================
router.post('/analizar-ia', async (req, res) => {
  try {
    // 1. Buscamos SOLO las alertas que NO están resueltas (para no enviarle basura a la IA)
    const [alertasCriticas] = await db.query(`
      SELECT p.nombre, a.valor_actual, a.tipo_alerta
      FROM alertas a
      JOIN inventario i ON a.id_inventario = i.id_inventario
      JOIN producto_variantes v ON i.id_variante = v.id_variante
      JOIN productos p ON v.id_producto = p.id_producto
      WHERE a.estado != 'resuelta'
    `);

    // 2. Traemos tu URL de Make desde el archivo .env
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;

    // Si hay alertas críticas y la URL está configurada, enviamos los datos
    if (webhookUrl && alertasCriticas.length > 0) {
      
      // Enviamos el aviso a Make
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: "analisis_de_alertas",
          cantidad_alertas: alertasCriticas.length,
          detalles: alertasCriticas // Le mandamos la lista completa de problemas a la IA
        })
      }).catch(err => console.error("Error conectando con Make:", err));
      
      res.json({ mensaje: "Alertas enviadas a la IA. Revisa Make." });

    } else {
      res.json({ mensaje: "No hay alertas críticas para analizar o falta el Webhook." });
    }

  } catch (error) {
    console.error("Error al procesar la solicitud de IA:", error);
    res.status(500).json({ error: "Error al intentar conectar con la IA" });
  }
});

export default router;