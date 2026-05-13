import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenerativeAI } from '@google/generative-ai';

const bot = new TelegramBot(
  process.env.TELEGRAM_TOKEN,
  {
    polling: true
  }
);

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

console.log('🤖 OmniBot iniciado');

bot.on('message', async (msg) => {

  try {

    const chatId = msg.chat.id;
    const text = msg.text;

    console.log('📩 Usuario:', text);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    const result =
      await model.generateContent(`
        Eres OmniBot.

        Ayudas con:
        - inventario
        - stock
        - productos
        - compras
        - ventas

        Responde corto y profesional.

        Usuario:
        ${text}
      `);

    const response =
      result.response.text();

    await bot.sendMessage(
      chatId,
      response
    );

  } catch (error) {

    console.error(error);

  }
});