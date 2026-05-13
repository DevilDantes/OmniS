import express from 'express';
import { db } from '../db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// ==========================================
// 🛠️ CONFIGURACIÓN DE IA Y CORREOS
// ==========================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ FIX: Configuramos Gmail explícitamente con IPv4 (family: 4) para evitar el bloqueo de Railway
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // IMPORTANTE
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function enviarAlertaConIA(producto, actual, minimo) {
    try {
        console.log(`🤖 Solicitando análisis a Gemini para: ${producto}...`);
        // Usamos el modelo oficial actual. Si te vuelve a dar 404, cámbialo a "gemini-1.0-pro"
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `
        Actúa como un experto en logística de OmniS. 
        DATOS DEL PRODUCTO:
        - Nombre: ${producto}
        - Stock Actual: ${actual}
        - Stock Mínimo: ${minimo}

        INSTRUCCIONES DE ANÁLISIS:
        1. Si el stock es 0, la alerta es CRÍTICA.
        2. Si el stock es menor a la mitad del mínimo, es ALTA.
        3. Si está cerca del mínimo, es PREVENTIVA.

        RESPUESTA REQUERIDA (Usa este formato):
        🚨 NIVEL DE ALERTA: [Poner aquí el nivel]
        📦 ESTADO: [Breve explicación del riesgo]
        ✅ RECOMENDACIÓN: Se sugiere pedir [cantidad] unidades de este producto inmediatamente.`;

        const result = await model.generateContent(prompt);
        const analisisIA = result.response.text();

        const mailOptions = {
            from: `"OmniS Alertas" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_DESTINO,
            subject: `⚠️ ALERTA DE STOCK: ${producto}`,
            text: `Se ha detectado un nivel de stock crítico.\n\nProducto: ${producto}\nStock Actual: ${actual}\nStock Mínimo: ${minimo}\n\nANÁLISIS DE LA IA:\n${analisisIA}`
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ ¡Correo de alerta con IA enviado exitosamente!");
    } catch (error) {
        console.error("❌ Error al procesar IA o enviar correo:", error);
    }
}

async function enviarCorreoReabastecimiento(producto, actual, minimo) {
    try {
        const mailOptions = {
            from: `"OmniS Alertas" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_DESTINO,
            subject: `✅ STOCK RECUPERADO: ${producto}`,
            text: `El producto ha sido reabastecido y la alerta ha sido desactivada.\n\nProducto: ${producto}\nNuevo Stock: ${actual}\nStock Mínimo Requerido: ${minimo}\n\nTodo está bajo control.`
        };
        await transporter.sendMail(mailOptions);
        console.log("✅ ¡Correo de reabastecimiento enviado exitosamente!");
    } catch (error) {
        console.error("❌ Error al enviar correo de reabastecimiento:", error);
    }
}
// ==========================================

// ==========================================
// 🧪 RUTA DE PRUEBA PARA FORZAR EL CORREO
// ==========================================
router.get('/test-correo', async (req, res) => {
    console.log("Iniciando prueba manual de correo e IA...");
    try {
        await enviarAlertaConIA("Tornillos de Prueba (Color: Gris, Talla: Única)", 1, 10);
        res.send("Prueba enviada. Revisa la consola de Railway y tu correo.");
    } catch (e) {
        console.error("Error en la ruta de prueba:", e);
        res.status(500).send("Falló: " + e.message);
    }
});
// ==========================================

// 🔍 GET inventario
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        v.id_variante, 
        i.id_inventario,
        p.nombre,
        v.talla,
        v.color,
        i.stock_actual,
        i.stock_minimo
      FROM inventario i
      JOIN producto_variantes v ON i.id_variante = v.id_variante
      JOIN productos p ON v.id_producto = p.id_producto
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener el inventario:", error);
    res.status(500).json({ error: "Error al obtener el inventario" });
  }
});

// ➕/➖ POST movimiento inventario
router.post('/', async (req, res) => {
  const { id_variante, cantidad, tipo_movimiento, observacion } = req.body; 

  const connection = await db.getConnection();

  try {
    const qty = parseInt(cantidad);
    const id_usuario = 1; 
    const id_almacen = 1; 

    await connection.beginTransaction();

    const [invRows] = await connection.query(`
      SELECT 
        i.id_inventario, 
        i.stock_actual, 
        i.stock_minimo, 
        v.id_producto, 
        p.nombre, 
        v.talla, 
        v.color 
      FROM inventario i
      JOIN producto_variantes v ON i.id_variante = v.id_variante
      JOIN productos p ON v.id_producto = p.id_producto
      WHERE i.id_variante = ? FOR UPDATE
    `, [id_variante]);

    if (invRows.length === 0) {
      throw new Error("El producto no está registrado en el inventario.");
    }

    const { id_inventario, id_producto, stock_actual, nombre, talla, color } = invRows[0];
    const stock_minimo_seguro = parseInt(invRows[0].stock_minimo) || 5;
    const nombreProductoCompleto = `${nombre} (Talla: ${talla}, Color: ${color})`;

    if (tipo_movimiento === 'salida' && stock_actual < qty) {
      throw new Error(`Stock insuficiente. Intentas sacar ${qty}, pero solo hay ${stock_actual} disponibles.`);
    }

    const operador = tipo_movimiento === 'entrada' ? '+' : '-';
    await connection.query(`
      UPDATE inventario
      SET stock_actual = stock_actual ${operador} ?
      WHERE id_inventario = ?
    `, [qty, id_inventario]);

    const nuevo_stock = tipo_movimiento === 'entrada' ? stock_actual + qty : stock_actual - qty;

    await connection.query(`
      INSERT INTO movimientos_inventario 
      (id_inventario, id_producto, id_variante, id_almacen, id_usuario, tipo_movimiento, cantidad, observacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id_inventario, id_producto, id_variante, id_almacen, id_usuario, 
      tipo_movimiento, qty, observacion || 'Sin observación'
    ]);

    if (nuevo_stock <= stock_minimo_seguro) {
      const [alertasPendientes] = await connection.query(`
        SELECT id_alerta FROM alertas WHERE id_inventario = ? AND estado = 'pendiente'
      `, [id_inventario]);

      const tipoAlerta = nuevo_stock === 0 ? 'stock_cero' : 'stock_bajo';
      const mensaje = nuevo_stock === 0 ? 'Producto agotado.' : 'Nivel de reorden alcanzado.';

      if (alertasPendientes.length > 0) {
        await connection.query(`
          UPDATE alertas 
          SET valor_actual = ?, tipo_alerta = ?, mensaje = ? 
          WHERE id_alerta = ?
        `, [nuevo_stock, tipoAlerta, mensaje, alertasPendientes[0].id_alerta]);
      } else {
        await connection.query(`
          INSERT INTO alertas (id_inventario, tipo_alerta, valor_umbral, valor_actual, mensaje, estado)
          VALUES (?, ?, ?, ?, ?, 'pendiente')
        `, [id_inventario, tipoAlerta, stock_minimo_seguro, nuevo_stock, mensaje]);
      }

      // 👉 ¡MAGIA! Disparamos el correo con IA sin detener el servidor
      enviarAlertaConIA(nombreProductoCompleto, nuevo_stock, stock_minimo_seguro);

    } else {
      const [alertasPendientes] = await connection.query(`
        SELECT id_alerta FROM alertas WHERE id_inventario = ? AND estado = 'pendiente'
      `, [id_inventario]);

      if (alertasPendientes.length > 0) {
        await connection.query(`
          UPDATE alertas 
          SET estado = 'resuelta', fecha_resolucion = CURRENT_TIMESTAMP, id_usuario_resuelve = ? 
          WHERE id_inventario = ? AND estado = 'pendiente'
        `, [id_usuario, id_inventario]);

        // 👉 ¡MAGIA! Disparamos el correo de reabastecimiento
        enviarCorreoReabastecimiento(nombreProductoCompleto, nuevo_stock, stock_minimo_seguro);
      }
    }

    await connection.commit();
    res.json({ ok: true, message: "Movimiento procesado correctamente" });

  } catch (error) {
    await connection.rollback();
    console.error("Error al procesar el movimiento:", error);
    res.status(400).json({ ok: false, error: error.message });
  } finally {
    connection.release();
  }
});

export default router;
