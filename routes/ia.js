import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

router.post('/analizar-ia', async (req, res) => {
    try {
        const { context } = req.body;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // o el que prefieras
            messages: [
                { role: "system", content: "Eres un asistente experto en gestión de inventarios." },
                { role: "user", content: `Analiza lo siguiente: ${JSON.stringify(context)}` }
            ],
        });
        res.json({ analisis: completion.choices[0].message.content });
    } catch (error) {
        console.error("Error en IA:", error);
        res.status(500).json({ error: "Error al consultar la IA" });
    }
});

export default router; // 👈 Crucial para que server.js no explote
