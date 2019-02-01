'use strict';

module.exports = function (codigoEstadoHttp, mensajeDetalleInterno, codigoErrorInterno) {

  Error.captureStackTrace(this, this.constructor);

  var mensajeHttp;

  switch (codigoEstadoHttp) {
    case 400:
      mensajeHttp = 'Solicitud errónea';
      break;
    case 401:
      mensajeHttp = 'No autorizado';
      break;
    case 403:
      mensajeHttp = 'Prohibido';
      break;
    case 404:
      mensajeHttp = 'No encontrado';
      break;
    case 405:
      mensajeHttp = 'Método no permitido';
      break;
    case 406:
      mensajeHttp = 'No aceptable';
      break;
    case 408:
      mensajeHttp = 'Tiempo de espera agotado';
      break;
    case 409:
      mensajeHttp = 'Conflicto';
      break;
    case 410:
      mensajeHttp = 'Ido';
      break;
    case 415:
      mensajeHttp = 'Tipo de archivo multimedia no soportado';
      break;
    case 416:
      mensajeHttp = 'Rango de solicitud no satisfactorio';
      break;
    case 418:
      mensajeHttp = 'Soy una tetéra';
      break;
    case 429:
      mensajeHttp = 'Muchas solicitudes';
      break;
    case 451:
      mensajeHttp = 'No disponible por razones legales';
      break;

    case 500:
      mensajeHttp = 'Error interno del servidor';
      break;
    case 501:
      mensajeHttp = 'No implementado';
      break;
    case 502:
      mensajeHttp = 'Puerta de enlace inválida';
      break;
    case 503:
      mensajeHttp = 'Servicio no disponible';
      break;
    case 504:
      mensajeHttp = 'Tiempo agotado en la puerta de enlace';
      break;
    case 505:
      mensajeHttp = 'Version HTTP no soportada';
      break;
    case 507:
      mensajeHttp = 'Almacenamiento insuficiente';
      break;
    case 508:
      mensajeHttp = 'Bucle detectado';
      break;
    case 509:
      mensajeHttp = 'Límite de ancho de banda excedido';
      break;
    default:
      mensajeHttp = 'Error inesperado';
  }

  this.mensajeHttp = mensajeHttp;
  this.codigoEstadoHttp = codigoEstadoHttp || 500;
  this.codigoErrorInterno = codigoErrorInterno || null;
  this.mensajeDetalleInterno = mensajeDetalleInterno || 'Error inesperado. ' +
    'Por favor toma contacto con el creador de la aplicación';
  

  return this;
};

//require('util').inherits(module.exports, Error);
