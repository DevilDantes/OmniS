import express from 'express';

const router = express.Router();

// Webhook de prueba desde Make
router.post('/make', async (req, res) => {
  try {

    console.log('📩 Datos recibidos desde Make:');
    console.log(req.body);

    // Aquí puedes hacer lógica:
    // guardar en DB
    // crear producto
    // actualizar inventario
    // etc

    return res.status(200).json({
      success: true,
      message: 'Webhook recibido correctamente',
      data: req.body
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }
});

export default router;
