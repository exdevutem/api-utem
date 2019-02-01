'use strict';

var request = require('request');
var cheerio = require('cheerio');
var jose = require('jose-simple');
var { JWK } = require('node-jose');
var keygen = require('generate-rsa-keypair');
var errors = require('../middlewares/errors');
var logger = require('../middlewares/logger');
var rut = require('../helpers/rut');

// Se genera una nueva llave desconocida cada vez que el servidor inicia
var llave = keygen();
var llavePublica = llave.public
var llavePrivada = llave.private;

var d = new Date();

var generar = function(credenciales) {
  return new Promise(async (resolve, reject) => {
    try {
      var respuesta = await logger.academia(credenciales);
      var pemAJwk = pem => JWK.asKey(pem, 'pem');
  
      Promise.all([pemAJwk(llavePublica), pemAJwk(llavePrivada)]).then(function(llaves) {
        
        var { encrypt } = jose(llaves[1], llaves[0]);
        encrypt({
          correo: credenciales.correo,
          rut: respuesta.rut,
          contrasenia: credenciales.contrasenia,
          sesion: respuesta.sesion
        }).then((token) => {
          resolve({
            rut: respuesta.rut,
            correo: credenciales.correo,
            token: token,
          })
        }).catch((e) => {
          reject(e);
        });
      });
    } catch (e) {
      reject(e);
    }
  })
  
}

var regenerar = async function(stringToken) {
  return new Promise((resolve, reject) => {
    if (stringToken) {
      var pemAJwk = pem => JWK.asKey(pem, 'pem');
      var token = limpiar(stringToken);

      Promise.all([pemAJwk(llavePublica), pemAJwk(llavePrivada)]).then(function(llaves) {
        var { decrypt } = jose(llaves[1], llaves[0]);
        decrypt(token).then(async (desencriptado) => {

          var respuesta = await generar({correo: desencriptado.correo, contrasenia: desencriptado.contrasenia});
          resolve(respuesta);
        
        }).catch(function(e) {
          if (e.codigoErrorInterno == 203) {
            reject(new errors(401, 'La contraseña ha cambiado', 106));
          } else {
            reject(new errors(401, 'La token no es válida.', 102));
          }
        });
      }).catch(function(e) {
        reject(new errors(500, 'Ocurrió un error inesperado.', 100));
      });
    } else {
      reject(new errors(400, 'No se ingresó ninguna token', 101));
    }
  });
}

var desencriptar = function(stringToken, parametros, comprobar) {
  return new Promise(function(resolve, reject) {
    if (stringToken) {
      var pemAJwk = pem => JWK.asKey(pem, 'pem');
      var token = limpiar(stringToken);

      Promise.all([pemAJwk(llavePublica), pemAJwk(llavePrivada)]).then(function(llaves) {
        var { decrypt } = jose(llaves[1], llaves[0]);
        decrypt(token).then(async (desencriptado) => {
          var esValido;
          try {
            esValido = await logger.academia({sesion: desencriptado.sesion});
          } catch (error) {
            esValido = false;
          }
          
          //if (desencriptado.exp && desencriptado.exp < d.getTime()) {
          if (!esValido) {
            reject(new errors(401, 'La token expiró', 103));
          } else if (comprobar) {
            if (parametros.rutEstudiante) {
              if (parametros.rutEstudiante != desencriptado.rut) {
                reject(new errors(401, 'No se puede obtener con estas credenciales', 104));
              } else {
                resolve(desencriptado);
              }
            } else {
              reject(new errors(403, 'No está definido el RUT del estudiante', 105));
            }
          } else {
            resolve(desencriptado);
          }
        }).catch(function(e) {
          reject(new errors(401, 'La token no es válida.', 102))
        });
      }).catch(function(e) {
        reject(new errors(500, 'Ocurrió un error inesperado.', 100));
      });
    } else {
      reject(new errors(400, 'No se ingresó ninguna token', 101));
    }
  });
}

var validar = (stringToken) => {
  return new Promise((resolve, reject) => {
    if (stringToken) {
      var pemAJwk = pem => JWK.asKey(pem, 'pem');
      var token = limpiar(stringToken);

      Promise.all([pemAJwk(llavePublica), pemAJwk(llavePrivada)]).then(function(llaves) {
        var { decrypt } = jose(llaves[1], llaves[0]);
        decrypt(token).then(async (desencriptado) => {
          var respuestaSesion;
          var respuestaCredenciales;
          try {
            respuestaSesion = await logger.academia({sesion: desencriptado.sesion});
            respuestaCredenciales = await logger.academia({correo: desencriptado.correo, contrasenia: desencriptado.contrasenia});
          } catch (error) {
            respuestaSesion = null;
            respuestaCredenciales = null;
          }
          
          if (respuestaSesion != null && respuestaCredenciales != null) {
            resolve({
              esValido: true,
              correo: desencriptado.correo,
              rut: desencriptado.rut
            });
          } else {
            resolve({
              esValido: false
            });
          }
        
        }).catch(function(e) {
          if (e.codigoErrorInterno == 203) {
            reject(new errors(401, 'La contraseña ha cambiado', 106));
          } else {
            reject(new errors(401, 'La token no es válida.', 102));
          }
        });
      }).catch(function(e) {
        reject(new errors(500, 'Ocurrió un error inesperado.', 100));
      });
    } else {
      reject(new errors(400, 'No se ingresó ninguna token', 101));
    }
  });
}

function limpiar(token) {
  if (token.search('Bearer ') == 0) {
    return token.replace('Bearer ', '');
  } else {
    return null;
  }
}

module.exports = {generar, regenerar, validar, desencriptar};

