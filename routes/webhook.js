import express from 'express';

const router = express.Router();

// Asegura que el webhook pueda leer JSON y formularios
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Ruta de prueba
router.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Webhook activo'
  });
});

// Webhook de prueba desde Make
router.post('/make', async (req, res) => {
  try {
    console.log('📩 Datos recibidos desde Make:');
    console.log(JSON.stringify(req.body, null, 2));

    // Aquí va tu lógica real:
    // - guardar en DB
    // - crear producto
    // - actualizar inventario
    // - enviar alerta
    // - etc.

    return res.status(200).json({
      success: true,
      message: 'Webhook recibido correctamente',
      data: req.body
    });
  } catch (error) {
    console.error('Error en webhook /make:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
});

export default router;
