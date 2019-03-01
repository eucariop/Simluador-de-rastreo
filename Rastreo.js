'use strict';

const cheerio = require('cheerio');
const fs = require('fs');

let socketIO = null;
const dirName = 'gpx/';


let trackingState = {}


const emitRoute = (routeName, routeNodes, currentIndex) => {

  if (currentIndex == routeNodes.length) {
    return setTimeout( () => {
    // invertir la ruta y continuar el seguimiento
      emitRoute(routeName, routeNodes, 0);
    }, 3000);
  }

  trackingState = Object.assign(trackingState, { 
    [routeName] : routeNodes[currentIndex]
  });

  socketIO.emit( 'locationUpdated', trackingState );

  // un número aleatorio del rango 500 - 1000
  const sleepTime = Math.random() * (1000 - 500) + 500;

  // El tiempo de espera de despacho para evitar 
  // el desbordamiento de pila, usamos llamadas
  // recursivas para emitir rutas para siempre
  return setTimeout(() => {
    emitRoute(routeName, routeNodes, ++currentIndex);
  }, sleepTime)
}

const run = io => {

  socketIO = io;

  fs.readdir(dirName, (err, filenames) => {
    if (err) {
      console.log(err);
      return;
    }

    filenames.forEach( filename => {

      // Verificar extensión de archivo solo *.gpx aceptado
      const fileExtension = filename.split('.').pop()
      if (fileExtension !== 'gpx') return;

      console.log('Parsing file: ' + dirName + filename);

      fs.readFile(dirName + filename, 'utf-8', (err, content) => {
        if (err) {
          console.log(err);
          return;
        }

        // Cada archivo gpx como una nueva ruta   
        trackingState = Object.assign(trackingState, { 
          [ filename ] : { lat: 0, lng: 0 }
        });

        // Parche XML
        const $ = cheerio.load(content, {
          normalizeWhitespace: true,
          xmlMode: true
        });

        // Transfiera el objeto xmlNode al objeto plano {lat: ..., lng: ...}
        const routeNodes = $('wpt').map( (i, node) => ({
          lat : Number($(node).attr('lat')),
          lng : Number($(node).attr('lon'))
        })).get();

        // Emitir ruta al cliente.
        if (routeNodes.length > 0) {
          emitRoute(filename, routeNodes, 0); // comenzar en el primer nodo de ruta
        }
      });      
    });
  });
}

module.exports.run = run;