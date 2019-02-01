'use strict';

var request = require('request');
var cheerio = require('cheerio');
var logger = require('../middlewares/logger');

const {ACADEMIA_URL, OPCIONES_GENERALES} = require('../helpers/constants');

exports.getTitulos = function(autenticacion) {
  return new Promise(async function(resolve, reject) {
    try {
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);

      var opciones = {
        url: 'https://academia.utem.cl/usuario/perfil/mis_titulos',
        method: 'GET',
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      };

      request(opciones, function(error, response, html) {
        const $ = cheerio.load(html);
        const alerta = $('#page-container #content .panel-body .content .alert-info');
        if (alerta) {
          var mensaje = alerta.clone().children().remove().end().text().trim();
          resolve({
            enProceso: false,
            mensaje: mensaje
          });
        } else {
          resolve({
            enProceso: true
          });
        }

      });
    } catch (e) {
      reject(e);
    }
  });
}
