import express from 'express';
import { db } from '../db.js';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch'; 

const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || 'tu_super_secreto_jwt_omnisynch'; 

router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  try {
    const [usuarios] = await db.query(
      `SELECT id_usuario, nombre, correo, password_hash, rol 
       FROM usuarios 
       WHERE correo = ? AND estado = 'activo'`, 
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }

    const user = usuarios[0];

    // Comparación de contraseña
    if (password !== user.password_hash) {
      
      // ==========================================
      // 🤖 CONEXIÓN CON MAKE (WEBHOOK)
      // ==========================================
      const webhookUrl = process.env.MAKE_WEBHOOK_URL;
      
      if (webhookUrl) {
        console.log("Enviando alerta a Make..."); // Esto lo verás en los logs de Railway
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento: "alerta_seguridad_login",
            correo_atacado: correo,
            rol_objetivo: user.rol,
            mensaje: `Intento de acceso fallido para el usuario ${user.nombre}`,
            fecha: new Date().toISOString()
          })
        })
        .then(res => console.log("Make recibió la señal:", res.status))
        .catch(err => console.error("Error al contactar a Make:", err));
      }

      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id_usuario, rol: user.rol, nombre: user.nombre },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.json({
      ok: true,
      token: token,
      usuario: { nombre: user.nombre, rol: user.rol, correo: user.correo }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;