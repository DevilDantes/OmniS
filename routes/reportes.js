import express from 'express';
import { db } from '../db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// ======================================================
// 📊 KPIs
// ======================================================
router.get('/', async (req, res) => {
  try {
    const [volumenResult] = await db.query(`
      SELECT IFNULL(SUM(d.cantidad), 0) AS volumen_mtd 
      FROM ordenes_venta o
      JOIN detalle_orden_venta d ON o.id_orden_venta = d.id_orden_venta
      WHERE o.estado IN ('pagada', 'completada')
    `);

    const [ingresosResult] = await db.query(`
      SELECT IFNULL(SUM(total), 0) AS ingresos_mtd 
      FROM ordenes_venta 
      WHERE estado IN ('pagada', 'completada')
    `);

    const [rotacionResult] = await db.query(`
      SELECT 
        (SELECT IFNULL(SUM(cantidad), 0) 
         FROM movimientos_inventario 
         WHERE tipo_movimiento = 'salida') AS total_salidas,

        (SELECT IFNULL(SUM(stock_actual), 1) 
         FROM inventario) AS total_stock
    `);

    const salidas = parseInt(rotacionResult[0].total_salidas);
    let stock = parseInt(rotacionResult[0].total_stock);

    if (stock === 0) stock = 1;

    const rotacion = (salidas / stock).toFixed(1);

    res.json({
      rotacion,
      volumen_mtd: parseInt(volumenResult[0].volumen_mtd),
      ingresos_mtd: parseFloat(ingresosResult[0].ingresos_mtd)
    });

  } catch (error) {
    console.error("Error al obtener reportes:", error);
    res.status(500).json({ error: "Error al cargar los KPIs" });
  }
});

// ======================================================
// 🤖 FUNCIÓN IA REPORTE CRÍTICO
// ======================================================
async function enviarReporteInventarioCritico() {
  try {

    const [productos] = await db.query(`
      SELECT 
        p.nombre,
        v.talla,
        v.color,
        i.stock_actual,
        i.stock_minimo
      FROM inventario i
      JOIN producto_variantes v 
        ON i.id_variante = v.id_variante
      JOIN productos p 
        ON v.id_producto = p.id_producto
      WHERE i.stock_actual <= i.stock_minimo
      ORDER BY i.stock_actual ASC
    `);

    if (productos.length === 0) {
      console.log("✅ No hay productos críticos.");
      return;
    }

    const lista = productos.map((p, i) => `
${i + 1}. ${p.nombre}
   - Talla: ${p.talla}
   - Color: ${p.color}
   - Stock actual: ${p.stock_actual}
   - Stock mínimo: ${p.stock_minimo}
`).join('\n');

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
Actúa como analista logístico senior de OmniS.

Analiza los siguientes productos críticos:

${lista}

Genera:

1. Resumen ejecutivo.
2. Productos más urgentes.
3. Riesgo operativo.
4. Recomendaciones de compra.
5. Prioridad ALTA/MEDIA/CRÍTICA.
`;

    const result = await model.generateContent(prompt);

    const analisisIA = result.response.text();

    await resend.emails.send({
      from: 'OmniS Reportes <onboarding@resend.dev>',
      to: process.env.EMAIL_DESTINO,
      subject: '📦 Reporte Automático de Inventario Crítico',
      text: `
REPORTE AUTOMÁTICO OMNIS

==================================
PRODUCTOS CRÍTICOS
==================================

${lista}

==================================
ANÁLISIS IA
==================================

${analisisIA}
`
    });

    console.log("✅ Reporte IA enviado.");

  } catch (error) {
    console.error("❌ Error reporte IA:", error);
  }
}

// ======================================================
// 🧪 RUTA MANUAL DE PRUEBA
// ======================================================
router.get('/test-reporte-ia', async (req, res) => {
  try {

    await enviarReporteInventarioCritico();

    res.send("✅ Reporte IA enviado correctamente.");

  } catch (error) {

    console.error(error);

    res.status(500).send(error.message);
  }
});

// ======================================================
// ⏰ AUTOMÁTICO CADA 2 DÍAS
// ======================================================
cron.schedule('0 8 */2 * *', async () => {

  console.log("🕒 Ejecutando reporte automático IA...");

  await enviarReporteInventarioCritico();

});

export default router;