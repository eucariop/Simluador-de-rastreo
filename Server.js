'use strict';

const express = require('express');
const http = require('http');
const multer = require('multer');
const bodyParser = require('body-parser');
const socketIO = require('socket.io');

const Rastreo = require('./Rastreo.js');

// Obtener configuración para entorno de nodo
const ENV = process.env;

const CONFIG = {
	PORT: ENV.PORT
}

const app = express();

// Crear socketIO y envolver el servidor de aplicaciones dentro
const server = http.Server(app);
const io = socketIO(server);


// Añadir middleware para manejar la solicitud de correos para Express
const form = multer();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/static', express.static('static'));

// Servir index.html para la ruta '/', esta es la ruta de inicio
app.get('/', (req, res) => {
	res.sendFile('index.html', { root: __dirname });
});

// server.listen(8080);

server.listen(CONFIG.PORT, () => {
	console.log('El servidor se está ejecutando en el puerto: ' + CONFIG.PORT);
});

// Ejecutar ubicación de seguimiento
Rastreo.run(io);

io.set('resource', '/socket.io');

io.on('connection', socket => {
	socket.emit('connectSuccess', {content: 'Conectado.'});
});

