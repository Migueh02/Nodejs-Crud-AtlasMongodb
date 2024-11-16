const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const fs = require('fs');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');

const Emprendedor = require('./models/Emprendedor');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la sesión
app.use(session({
  secret: 'mysecret',  // Cambia esta clave por algo más seguro
  resave: false,
  saveUninitialized: true
}));

// Rutas
const authRoutes = require('./routes/rutas');
app.use('/', authRoutes);

// Ruta de Exportación a Excel
app.get('/exportar/excel', async (req, res) => {
    const emprendedores = await Emprendedor.find();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Emprendedores');

    worksheet.columns = [
        { header: 'Nombre', key: 'nombre' },
        { header: 'Correo', key: 'correo' },
        { header: 'Teléfono', key: 'telefono' },
        { header: 'Descripción', key: 'descripcion' }
    ];

    emprendedores.forEach(emprendedor => {
        worksheet.addRow(emprendedor);
    });

    const filePath = path.join(__dirname, 'Emprendedores.xlsx');
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, 'Emprendedores.xlsx', (err) => {
        if (err) {
            console.error('Error al descargar archivo:', err);
        }
        fs.unlinkSync(filePath); // Elimina el archivo temporal después de la descarga
    });
});

// Ruta de Exportación a PDF
app.get('/exportar/pdf', async (req, res) => {
    try {
        // Obtener todos los emprendedores de la base de datos
        const emprendedores = await Emprendedor.find();

        // Crear un documento PDF
        const doc = new PDFDocument();
        const filePath = path.join(__dirname, 'Emprendedores.pdf');

        // Escribir el archivo PDF
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Agregar contenido al PDF
        doc.fontSize(18).text('Emprendedores Registrados', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text('Nombre | Correo | Teléfono | Descripción');
        doc.moveDown();

        emprendedores.forEach(emprendedor => {
            doc.text(`${emprendedor.nombre} | ${emprendedor.correo} | ${emprendedor.telefono} | ${emprendedor.descripcion}`);
        });

        doc.end();

        // Esperar hasta que el archivo se haya generado completamente
        stream.on('finish', () => {
            // Descargar el archivo
            res.download(filePath, 'Emprendedores.pdf', (err) => {
                if (err) {
                    console.error('Error al descargar archivo:', err);
                    res.status(500).send('Error al descargar el archivo.');
                } else {
                    // Eliminar el archivo después de la descarga exitosa
                    fs.unlinkSync(filePath);
                }
            });
        });

        stream.on('error', (err) => {
            console.error('Error al generar el PDF:', err);
            res.status(500).send('Error al generar el PDF.');
        });

    } catch (err) {
        console.error('Error al procesar la solicitud:', err);
        res.status(500).send('Error interno del servidor.');
    }
});

app.use(express.static(path.join(__dirname, 'public')));

// Ruta de Exportación a TXT
app.get('/exportar/txt', async (req, res) => {
    const emprendedores = await Emprendedor.find();
    const filePath = path.join(__dirname, 'Emprendedores.txt');
    let fileContent = 'Emprendedores Registrados\n\n';

    emprendedores.forEach(emprendedor => {
        fileContent += `${emprendedor.nombre} | ${emprendedor.correo} | ${emprendedor.telefono} | ${emprendedor.descripcion}\n`;
    });

    fs.writeFileSync(filePath, fileContent);
    res.download(filePath, 'Emprendedores.txt', (err) => {
        if (err) {
            console.error('Error al descargar archivo:', err);
        }
        fs.unlinkSync(filePath); // Elimina el archivo temporal después de la descarga
    });
});

// Ruta de Exportación a PNG
app.get('/exportar/png', async (req, res) => {
    const emprendedores = await Emprendedor.find();
    const html = `
        <html>
        <head><style>table, th, td {border: 1px solid black; border-collapse: collapse; padding: 8px;} th {text-align: left;}</style></head>
        <body>
            <h2>Emprendedores Registrados</h2>
            <table>
                <thead>
                    <tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Descripción</th></tr>
                </thead>
                <tbody>
                    ${emprendedores.map(emprendedor => `
                        <tr>
                            <td>${emprendedor.nombre}</td>
                            <td>${emprendedor.correo}</td>
                            <td>${emprendedor.telefono}</td>
                            <td>${emprendedor.descripcion}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const filePath = path.join(__dirname, 'Emprendedores.png');
    await page.screenshot({ path: filePath });
    await browser.close();

    res.download(filePath, 'Emprendedores.png', (err) => {
        if (err) {
            console.error('Error al descargar archivo:', err);
        }
        fs.unlinkSync(filePath); // Elimina el archivo temporal después de la descarga
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});