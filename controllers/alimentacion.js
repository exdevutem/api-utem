'use strict';

var request = require('request');
var cheerio = require('cheerio');
var logger = require('../middlewares/logger');

const ACADEMIA_URL = 'https://academia.utem.cl/';

exports.getAlimentacion = function(autenticacion) {
  return new Promise(async function(resolve, reject) {
    try {
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);

      var opciones = {
        url: 'https://academia.utem.cl/bienestar_estudiantil/beca_alimentacion',
        method: 'GET',
        jar: sesionAcademia
      };

      request(opciones, function(error, response, html) {
        const $ = cheerio.load(html);
        const alerta = $('#page-container #content .panel-body .content .alert-warning');
        if (alerta) {
          var mensaje = alerta.clone().children().remove().end().text().trim();
          resolve({
            tieneBeca: false,
            mensaje: mensaje
          });
        } else {
          resolve({
            tieneBeca: true
          });
        }

      });
    } catch (e) {
      reject(e);
    }
  });
}
