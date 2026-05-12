import express from 'express';
// Cambiamos la librería de OpenAI por la de Google
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Inicializamos Gemini con tu nueva clave
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/analizar-ia', async (req, res) => {
    try {
        const { context } = req.body;

        // Configuramos el modelo gratuito
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Preparamos el mensaje (Prompt)
        const prompt = `Eres un asistente experto en gestión de inventarios. 
        Analiza lo siguiente y da una recomendación breve de compra: ${JSON.stringify(context)}`;

        // Generamos el contenido
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Enviamos la respuesta con el mismo formato que antes para no romper el frontend
        res.json({ analisis: text });

    } catch (error) {
        console.error("Error en Gemini IA:", error);
        res.status(500).json({ error: "Error al consultar la IA de Google" });
    }
});

export default router;