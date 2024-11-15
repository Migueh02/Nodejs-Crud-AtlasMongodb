const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const emprendedoresRoutes = require('./routes/emprendedores');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Conectar a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 5000, // Tiempo máximo de conexión 5 segundos
    serverSelectionTimeoutMS: 5000 // Tiempo máximo de selección del servidor 5 segundos
}).then(() => {
    console.log('Conectado a MongoDB');
}).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
});

// Rutas
app.use('/', emprendedoresRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));