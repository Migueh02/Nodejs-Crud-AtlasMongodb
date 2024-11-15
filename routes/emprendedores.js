const express = require('express');
const router = express.Router();
const emprendedorController = require('../controllers/emprendedorController');

router.get('/', emprendedorController.renderIndex);
router.get('/crear', emprendedorController.renderCrear);
router.post('/crear', emprendedorController.crearEmprendedor);
router.get('/editar/:id', emprendedorController.renderEditar);
router.post('/editar/:id', emprendedorController.actualizarEmprendedor);
router.post('/eliminar/:id', emprendedorController.eliminarEmprendedor);

// Ruta para editar un emprendedor
router.post('/editar/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, correo, telefono, descripcion } = req.body;

    Emprendedor.findByIdAndUpdate(id, { nombre, correo, telefono, descripcion })
        .then(() => res.redirect('/')) // Redirigir a la página principal después de actualizar
        .catch(err => res.status(500).send(err));
});


module.exports = router;
