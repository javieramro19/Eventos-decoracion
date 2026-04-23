const mysql = require('mysql2');
require('dotenv').config();

//create a connection pool to the MySQL database using environment variables for configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//export the promise-based pool for use in other parts of the application
const db = pool.promise();

//test the database connection by getting a connection from the pool and releasing it immediately
pool.getConnection((err, connection) => {
    if (err) {
        console.error('ERROR conectando a la base de datos', err.message);
    } else {
        console.log('Conexión a MySQL correcta!');
        connection.release();
    }
});

//export the database connection for use in other modules
module.exports = db;
