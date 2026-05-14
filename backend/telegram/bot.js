import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mysql from 'mysql2/promise'; // Importamos el cliente de MySQL

// --- 1. CONFIGURACIÓN DE LA BASE DE DATOS ---
// Usa variables de entorno (Railway te las proporciona fácilmente)
const pool = mysql.createPool({
  host: process.env.DB_HOST,         // ej: mysql-3baf3f9c-unitecnar.aivencloud.com
  user: process.env.DB_USER,         // ej: avnadmin
  password: process.env.DB_PASSWORD, // tu contraseña
  database: process.env.DB_NAME,     // omnisynch_inventory
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- 2. CONFIGURACIÓN DEL BOT Y GEMINI ---
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: { interval: 3000, autoStart: true, params: { timeout: 10 } }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Declaramos la herramienta (función) para Gemini
const herramientas = [{
  functionDeclarations: [{
    name: "consultar_stock",
    description: "Busca en la base de datos el stock actual de un producto.",
    parameters: {
      type: "OBJECT",
      properties: {
        producto: {
          type: "STRING",
          description: "Nombre o palabra clave del producto a buscar"
        }
      },
      required: ["producto"]
    }
  }]
}];

console.log('🤖 OmniBot iniciado');

bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    console.log(`📩 Usuario (${chatId}):`, text);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: herramientas
    });

    const chat = model.startChat({
      systemInstruction: "Eres OmniBot. Ayudas con inventario, stock, compras y ventas. Responde corto, profesional y basándote únicamente en los datos que te provee el sistema."
    });

    // Enviamos el texto del usuario
    const result = await chat.sendMessage(text);
    const llamadasFuncion = result.response.functionCalls();

    // Verificamos si Gemini nos pide usar la base de datos
    if (llamadasFuncion && llamadasFuncion.length > 0) {
      const llamada = llamadasFuncion[0];
      
      if (llamada.name === "consultar_stock") {
        const nombreProducto = llamada.args.producto;
        console.log(`🔍 Buscando en BD stock de: ${nombreProducto}`);

        // --- 3. LÓGICA REAL: CONSULTA A MYSQL ---
        let stock_total = 0;
        let producto_encontrado = "No encontrado";

        try {
          // Buscamos el producto haciendo un JOIN entre productos, variantes e inventario
          const [rows] = await pool.execute(`
            SELECT p.nombre, IFNULL(SUM(i.stock_actual), 0) as total_stock
            FROM productos p
            LEFT JOIN producto_variantes pv ON p.id_producto = pv.id_producto
            LEFT JOIN inventario i ON pv.id_variante = i.id_variante
            WHERE p.nombre LIKE ?
            GROUP BY p.nombre
            LIMIT 1
          `, [`%${nombreProducto}%`]); // Usamos % para que busque coincidencias parciales

          if (rows.length > 0) {
            producto_encontrado = rows[0].nombre;
            stock_total = parseInt(rows[0].total_stock, 10);
          }
        } catch (dbError) {
          console.error("Error consultando MySQL:", dbError);
          // Si la BD falla, le devolvemos el error a Gemini para que lo maneje
          stock_total = "Error al conectar con la base de datos";
        }

        // --- 4. DEVOLVEMOS EL RESULTADO A GEMINI ---
        const resultadoFuncion = await chat.sendMessage([{
          functionResponse: {
            name: "consultar_stock",
            response: { 
              producto_en_base_de_datos: producto_encontrado,
              stock_disponible: stock_total 
            }
          }
        }]);

        // 5. Enviamos la respuesta final al usuario
        await bot.sendMessage(chatId, resultadoFuncion.response.text());
      }
    } else {
      // Si fue un saludo o pregunta que no requiere base de datos
      await bot.sendMessage(chatId, result.response.text());
    }

  } catch (error) {
    console.error('Error en el bot:', error);
    await bot.sendMessage(msg.chat.id, "Disculpa, tuve un problema interno al procesar tu solicitud.");
  }
});