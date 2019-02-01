'use strict';

var request = require('request');
var cheerio = require('cheerio');
var asignaturasO = require('./asignaturas');

const {ACADEMIA_URL, OPCIONES_GENERALES} = require('../helpers/constants');

exports.getHorarios = async function(autenticacion) {
  return new Promise(async function(resolve, reject) {
    try {
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);

      var opciones = {
        url: 'https://academia.utem.cl/alumno/horario_seccion',
        method: 'GET',
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      };

      request(opciones, async function(error, response, html) {
        const $ = cheerio.load(html);
        const horarios = $('#content .panel .panel-body fieldset center div #accordion').children();
        var horariosArray = [];

        $(horarios).each(function() {
          const tituloCarrera = $(this).find('.panel-info .panel-heading h3.panel-title').text().trim();
          const asignaturas = $(this).find('.panel-collapse .panel-body div:nth-of-type(1) table tbody tr');

          var carrera = {
            código: parseInt(tituloCarrera.slice(0, tituloCarrera.search('/')).trim()),
            plan: parseInt(tituloCarrera.slice(tituloCarrera.search('/') + 1, tituloCarrera.search('-')).trim()),
            nombre: tituloCarrera.slice(tituloCarrera.search('-') + 1).trim().toTitleCase()
          };

          var asignaturasArray = [];

          $(asignaturas).each(function() {
            const codigo = $(this).find('td:nth-of-type(1)').text().trim();
            const asignatura = $(this).find('td:nth-of-type(2)').text().trim();
            const docente = $(this).find('td:nth-of-type(3)').text().trim();
            const tipo = $(this).find('td:nth-of-type(4)').text().trim();
            const seccion = $(this).find('td:nth-of-type(5)').text().trim();

            var objetoDocente;

            if (docente.equalsIgnoreCase("SIN PROFESOR")) {
              objetoDocente = null;
            } else {
              objetoDocente = {
                nombre: {
                  completo: docente.toTitleCase()
                }
              }
            }

            asignaturasArray.push({
              _id: null, /*await asignaturasO.getIdByCodigo(codigo),*/
              codigo: codigo.toUpperCase(),
              nombre: asignatura.toTitleCase(),
              docente: objetoDocente,
              tipo: tipo.toTitleCase(),
              seccion: {
                _id: null,
                numero: seccion
              }
            });
          });

          var semana = [[], [], [], [], [], [], []];

          const filas = $(this).find('.panel-collapse .panel-body div:nth-of-type(3) table tbody tr');

          $(filas).each(function(i) {
            const tds = $(this).find('td');
            var dia = [];

            for (var j = 0; j < (tds.length - (1 - (i % 2)) - 1); j++) {
              var esPar = i % 2 == 0 ? 1 : 0;
              semana[j].push(procesarTd($, tds[j + 1 + esPar]));
            }
          });

          for (var i = 0; i < 6; i++) {
            var nueva = [];
            var periodo;
            var bloques = [];
            for (var j = 0; j < semana[i].length; j++) {
              bloques.push(semana[i][j]);
              if (j % 2 != 0) {
                periodo = {
                  periodo: Math.trunc(j / 2) + 1,
                  bloques: bloques
                }
                nueva.push(periodo);
                bloques = [];
                periodo = {};
              }
            }
            semana[i] = nueva;
          }

          var objeto = {
            carrera: carrera,
            asignaturas: asignaturasArray,
            horario: {
              lunes: semana[0],
              martes: semana[1],
              miercoles: semana[2],
              jueves: semana[3],
              viernes: semana[4],
              sabado: semana[5],
              domingo: semana[6]
            }
          }
          horariosArray.push(objeto);
        })
        resolve(horariosArray);
      });
    } catch (e) {
      reject(e);
    }
  });
}

function procesarTd($, td) {
  var textoBloque = $(td).text().trim();
  if ($(td).hasClass('success')) {
    return {
      codigoAsignatura: textoBloque.slice(0, textoBloque.search('/')).trim().toUpperCase(),
      seccionAsignatura: textoBloque.slice(textoBloque.search('/') + 1, textoBloque.search('\\(')).trim(),
      sala: textoBloque.slice(textoBloque.search("\\(") + 1, textoBloque.search("\\)")).replace('SALA', '').trim().toTitleCase()
    }
  } else {
    return null;
  }
}
