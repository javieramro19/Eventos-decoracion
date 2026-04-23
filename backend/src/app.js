require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const db = require('./db/connection'); // Importamos la conexión a la base de datos

const app = express();

// Middlewares
app.use(helmet()); // Protege la aplicación de vulnerabilidades comunes
app.use(cors()); // Permite solicitudes desde cualquier origen
app.use(express.json()); // Permite parsear el cuerpo de las solicitudes como JSON

app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1'); // Realiza una consulta simple para verificar la conexión a la base de datos
        res.json({
            status: 'Servidor arriba',
            db: 'Conectada',
            test: rows[0].result // Devuelve el resultado de la consulta para confirmar que la base de datos está respondiendo correctamente
        }); // Si la consulta es exitosa, devuelve un estado "ok" y "connected"
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        }); // Si ocurre un error, devuelve un estado "error" y el mensaje del error
    }
});

const PORT = process.env.PORT || 3000; // Define el puerto en el que se ejecutará la aplicación, usando una variable de entorno o el puerto 3000 por defecto
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
}); // Inicia el servidor y muestra un mensaje en la consola indicando en qué puerto está escuchando