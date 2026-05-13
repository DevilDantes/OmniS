import express from 'express';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ========================================
// VERIFICAR WEBHOOK META
// ========================================
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    mode === 'subscribe' &&
    token === process.env.VERIFY_TOKEN
  ) {
    console.log('✅ Webhook verificado');
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// ========================================
// RECIBIR MENSAJES WHATSAPP
// ========================================
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    console.log(JSON.stringify(body, null, 2));

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text?.body || '';

    console.log(`📩 ${from}: ${text}`);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    const prompt = `
Eres el asistente virtual del proyecto OmniS.
Tu función es ayudar con inventario, productos, stock bajo, compras, alertas y gestión del negocio.

Responde de forma breve, clara y profesional.
Si el usuario pregunta por inventario, da una respuesta útil para ese contexto.
Si no entiendes bien, pide aclaración sin salirte del tema del proyecto.

Mensaje del usuario:
${text}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: from,
        type: 'text',
        text: {
          body: aiText || 'No pude generar respuesta en este momento.'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error(
      error.response?.data || error.message
    );

    return res.sendStatus(500);
  }
});

export default router;