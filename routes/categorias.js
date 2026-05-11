import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 🔍 GET: Obtener lista de categorías (y el nombre de su padre)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c1.id_categoria, 
        c1.nombre, 
        c1.descripcion, 
        c1.categoria_padre_id,
        'activo' AS estado, /* Simulamos el estado ya que no existe esta columna en tu BD */
        c2.nombre AS nombre_padre
      FROM categorias c1
      LEFT JOIN categorias c2 ON c1.categoria_padre_id = c2.id_categoria
      ORDER BY c1.id_categoria DESC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ error: "Error al obtener la lista de categorías" });
  }
});

// ➕ POST: Crear nueva categoría
router.post('/', async (req, res) => {
  try {
    // Recibimos los datos de tu app.js
    const { 
      nombre, 
      id_categoria_padre, 
      descripcion 
    } = req.body;

    // Insertamos usando los nombres reales de tus columnas
    const [result] = await db.query(`
      INSERT INTO categorias (
        nombre, 
        categoria_padre_id, 
        descripcion
      ) VALUES (?, ?, ?)
    `, [
      nombre, 
      id_categoria_padre || null, // Si envían el select vacío, lo guardamos como null
      descripcion || ''
    ]);

    // ==========================================
    // 🤖 IA / AUTOMATIZACIÓN: Notificar a Make de la nueva categoría
    // ==========================================
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: "nueva_categoria_creada",
          id_categoria: result.insertId,
          nombre: nombre,
          descripcion: descripcion,
          es_subcategoria: id_categoria_padre ? true : false
        })
      }).catch(err => console.error("Error notificando a Make sobre la categoría:", err));
    }

    res.json({ 
      ok: true, 
      id_categoria: result.insertId,
      message: "Categoría registrada exitosamente" 
    });

  } catch (error) {
    console.error("Error al guardar categoría:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error al guardar la categoría",
      details: error.message 
    });
  }
});

export default router;