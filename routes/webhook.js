import express from 'express';
import axios from 'axios';

const router = express.Router();

// ========================================
// VERIFICAR WEBHOOK META
// ========================================
router.get('/', (req, res) => {

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    mode &&
    token === process.env.VERIFY_TOKEN
  ) {

    console.log('✅ Webhook verificado');

    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// ========================================
// RECIBIR MENSAJES WHATSAPP
// ========================================
router.post('/', async (req, res) => {

  try {

    const body = req.body;

    console.log(
      JSON.stringify(body, null, 2)
    );

    const message =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;

    const text =
      message.text?.body || '';

    console.log(`📩 ${from}: ${text}`);

    // RESPUESTA SIMPLE
    await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: from,
        text: {
          body: '👋 Hola desde OmniS'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.sendStatus(200);

  } catch (error) {

    console.error(
      error.response?.data || error.message
    );

    res.sendStatus(500);
  }
});

export default router;
