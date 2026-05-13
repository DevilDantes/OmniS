import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/analizar-ia', async (req, res) => {
  try {
    const { context } = req.body;

    if (!context) {
      return res.status(400).json({
        error: 'Falta el campo context'
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    const prompt = `
Eres un asistente inteligente del sistema de inventario del proyecto Omni.

Tu tarea es analizar información de productos, stock, ventas, alertas y compras.
Debes responder de forma clara, corta y útil para un sistema empresarial.

Instrucciones:
- Si hay stock bajo, indica qué producto necesita reposición.
- Si hay exceso de inventario, sugiere revisar compras.
- Si hay poca rotación, recomienda estrategias como promoción o liquidación.
- Si el inventario está estable, confirma que está bien.
- Si el contexto incluye varios productos, analiza cada uno brevemente.
- No des respuestas genéricas.
- Enfócate en inventario, almacén, compras, reposición y alertas.

Contexto recibido:
${JSON.stringify(context, null, 2)}

Responde en español, con tono profesional y directo.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.json({
      analisis: text
    });

  } catch (error) {
    console.error('Error en Gemini IA:', error);
    return res.status(500).json({
      error: 'Error al consultar la IA de Google'
    });
  }
});

export default router;