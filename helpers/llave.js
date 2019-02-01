'use strict';

var { JWK } = require('node-jose');

exports.crearLlave = function() {
  var llave {
    privada: process.env.PRIVATE_KEY,
    publica: process.env.PUBLIC_KEY
  };

  function pemAJwk(llave) {
    JWK.asKey(pem, 'pem');
  }

  var llavePrivada = await pemAJwk(llave.privada);
  var llavePublica = await pemAJwk(llave.publica);

  llave = {
    privada: llavePrivada,
    publica: llavePublica
  }

  return llave;
}
