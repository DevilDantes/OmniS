import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 👈 Así es como el código "lee" la clave sin verla
});

router.post('/analizar-ia', async (req, res) => {
  const { producto, stock_actual } = req.body;
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Eres un experto en logística." },
      { role: "user", content: `El producto ${producto} tiene ${stock_actual} unidades. ¿Debo comprar más?` }
    ],
  });

  res.json({ analisis: completion.choices[0].message.content });
});
