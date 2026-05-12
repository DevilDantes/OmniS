import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// ==========================================
// 🚀 CONFIGURACIÓN WEBHOOK MAKE
// ==========================================
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

async function enviarAlertasMake(data) {
  if (!MAKE_WEBHOOK_URL) {
    console.log("⚠️ MAKE_WEBHOOK_URL no configurado.");
    return;
  }

  try {
    await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    console.log("✅ Alertas enviadas a Make correctamente.");

  } catch (error) {
    console.error("❌ Error enviando alertas a Make:", error.message);
  }
}


// ==========================================
// GET ALERTAS
// ==========================================
router.get('/', async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT 
        CONCAT(
          p.nombre,
          ' (Talla: ',
          IFNULL(v.talla, 'N/A'),
          ' - Color: ',
          IFNULL(v.color, 'N/A'),
          ')'
        ) AS producto,

        IF(
          a.tipo_alerta = 'stock_cero',
          'Stock Cero',
          'Stock Bajo'
        ) AS tipo_evento,

        a.valor_actual,
        a.valor_umbral,

        IF(
          a.estado = 'resuelta',
          '✅ Resuelto',

          IF(
            a.tipo_alerta = 'stock_cero',
            '🔴 Agotado',
            '⚠️ Crítico'
          )
        ) AS estado

      FROM alertas a

      JOIN inventario i
        ON a.id_inventario = i.id_inventario

      JOIN producto_variantes v
        ON i.id_variante = v.id_variante

      JOIN productos p
        ON v.id_producto = p.id_producto

      ORDER BY a.estado ASC, a.id_alerta DESC
    `);

    res.json(rows);

  } catch (error) {

    console.error("Error al obtener alertas del historial:", error);

    res.status(500).json({
      error: "Error interno al cargar las alertas"
    });
  }
});


// ==========================================
// POST ANALIZAR IA
// ==========================================
router.post('/analizar-ia', async (req, res) => {

  try {

    // ==========================================
    // BUSCAR ALERTAS ACTIVAS
    // ==========================================
    const [alertasCriticas] = await db.query(`
      SELECT
        p.nombre,
        v.talla,
        v.color,
        a.valor_actual,
        a.valor_umbral,
        a.tipo_alerta,
        a.estado

      FROM alertas a

      JOIN inventario i
        ON a.id_inventario = i.id_inventario

      JOIN producto_variantes v
        ON i.id_variante = v.id_variante

      JOIN productos p
        ON v.id_producto = p.id_producto

      WHERE a.estado != 'resuelta'

      ORDER BY a.id_alerta DESC
    `);

    // ==========================================
    // VALIDAR SI HAY ALERTAS
    // ==========================================
    if (alertasCriticas.length === 0) {

      return res.json({
        ok: true,
        mensaje: "No hay alertas críticas para analizar."
      });
    }

    // ==========================================
    // ENVIAR A MAKE
    // ==========================================
    await enviarAlertasMake({
      evento: "analisis_de_alertas",

      fecha: new Date(),

      cantidad_alertas: alertasCriticas.length,

      prioridad_general:
        alertasCriticas.some(a => a.tipo_alerta === 'stock_cero')
          ? "CRITICA"
          : "MEDIA",

      alertas: alertasCriticas
    });

    // ==========================================
    // RESPUESTA
    // ==========================================
    res.json({
      ok: true,
      mensaje: "Alertas enviadas correctamente a Make y a la IA.",
      total_alertas: alertasCriticas.length
    });

  } catch (error) {

    console.error("Error al procesar la solicitud de IA:", error);

    res.status(500).json({
      ok: false,
      error: "Error al intentar conectar con la IA"
    });
  }
});

export default router;
