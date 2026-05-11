import express from 'express';
import { db } from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 🔑 AHORA SÍ: Usamos la llave maestra desde tu archivo .env
// Si por alguna razón no encuentra el .env, usa una de respaldo
const SECRET_KEY = process.env.JWT_SECRET || 'tu_super_secreto_jwt_omnisynch'; 

router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  try {
    // 1. Buscamos al usuario por correo y nos aseguramos de que esté activo
    const [usuarios] = await db.query(
      `SELECT id_usuario, nombre, correo, password_hash, rol 
       FROM usuarios 
       WHERE correo = ? AND estado = 'activo'`, 
      [correo]
    );

    // Si no existe el correo o está inactivo
    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }

    const user = usuarios[0];

    // 2. Comparamos la contraseña
    // 🚨 NOTA: Pendiente implementar 'bcrypt' para encriptar
    if (password !== user.password_hash) {
      
      // ==========================================
      // 🤖 IA DE SEGURIDAD: Notificamos a Make del intento fallido
      // ==========================================
      const webhookUrl = process.env.MAKE_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento: "alerta_seguridad_login",
            correo_atacado: correo,
            rol_objetivo: user.rol,
            mensaje: `Intento de acceso fallido para el usuario ${user.nombre}`
          })
        }).catch(err => console.error("Error alertando a Make:", err));
      }

      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generamos el "Gafete Virtual" (Token)
    const token = jwt.sign(
      { 
        id: user.id_usuario, 
        rol: user.rol, 
        nombre: user.nombre 
      },
      SECRET_KEY,
      { expiresIn: '8h' } // El token caduca en 8 horas
    );

    // 4. Se lo enviamos al frontend
    res.json({
      ok: true,
      mensaje: 'Bienvenido ' + user.nombre,
      token: token,
      usuario: { 
        nombre: user.nombre, 
        rol: user.rol,
        correo: user.correo 
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;