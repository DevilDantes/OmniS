import { db } from '../db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function enviarReporteInventarioCritico() {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.nombre,
        v.talla,
        v.color,
        i.stock_actual,
        i.stock_minimo
      FROM inventario i
      JOIN producto_variantes v ON i.id_variante = v.id_variante
      JOIN productos p ON v.id_producto = p.id_producto
      WHERE i.stock_actual <= i.stock_minimo
      ORDER BY i.stock_actual ASC
    `);

    if (rows.length === 0) {
      console.log("✅ No hay productos críticos. No se envía reporte.");
      return;
    }

    const listaProductos = rows.map((p, index) =>
      `${index + 1}. ${p.nombre} (Talla: ${p.talla}, Color: ${p.color}) - Actual: ${p.stock_actual}, Mínimo: ${p.stock_minimo}`
    ).join('\n');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Actúa como un analista de inventario de OmniS.

Genera un reporte ejecutivo claro y profesional con base en estos productos críticos:

${listaProductos}

El reporte debe incluir:
1. Un resumen general.
2. Qué productos están más urgentes.
3. Recomendación final de compra o reabastecimiento.

Usa un tono breve, serio y útil para gerencia.
`;

    const result = await model.generateContent(prompt);
    const analisisIA = result.response.text();

    await resend.emails.send({
      from: 'OmniS Reportes <onboarding@resend.dev>',
      to: process.env.EMAIL_DESTINO,
      subject: `📦 Reporte de inventario crítico`,
      text: `REPORTE AUTOMÁTICO DE INVENTARIO CRÍTICO

Productos críticos encontrados:
${listaProductos}

ANÁLISIS DE IA:
${analisisIA}`
    });

    console.log("✅ Reporte de inventario crítico enviado correctamente.");
  } catch (error) {
    console.error("❌ Error al enviar el reporte crítico:", error);
  }
}