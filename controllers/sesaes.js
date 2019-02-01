'use strict';

var request = require('request');
var requestp = require('request-promise');
var cheerio = require('cheerio');
var logger = require('../middlewares/logger');
var errors = require('../middlewares/errors');
var tiempo = require('../helpers/tiempo');

const {ACADEMIA_URL, OPCIONES_GENERALES} = require('../helpers/constants');

exports.getEspecialistas = function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    try {
      var especialistas = [];

      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);
      var opciones = {
        url: 'https://academia.utem.cl/ajax/sesaes/reservar/getEspecialistas_filtro',
        method: 'GET',
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        jar: sesionAcademia,
        transform: function(body) {
          return JSON.parse(body);
        },
        ...OPCIONES_GENERALES
      };

      requestp(opciones)
        .then(function(json) {
          json.forEach(function(especialista) {
            var nomEsp = especialista.mae_nombre;
            var especialistaActual = {
              _id: especialista.mae_rut,
              rut: especialista.mae_rut,
              nombre: nomEsp.substr(0, nomEsp.lastIndexOf('(')).trim().toTitleCase(),
              especialidades: [{
                _id: especialista.tes_codigo,
                nombre: nomEsp.substr(
                  nomEsp.lastIndexOf('('))
                        .replace(/\(|\)/g,'') // Eliminar paréntesis
                        .trim()
                        .toSentenceCase(),
                disponible: false,
              }]
            }

            // Si no se especifica RUT o el RUT requerido coincide con el actual
            if (parametros == null || parametros.rutEspecialista == especialistaActual._id) {
              var especialistaFiltrado = especialistas.filter(function(especialista) {
                return especialista._id == especialistaActual._id;
              });

              // Si no existe especialista con ese RUT
              if (especialistaFiltrado.length == 0) {
                especialistas.push(especialistaActual);
              } else {
                var index = especialistas.indexOf(especialistaFiltrado[0]);
                var especialidadFiltrado = especialistas[index].especialidades.filter(function(especialidad) {
                  return especialidad._id == especialistaActual.especialidades[0]._id;
                });
                // Si no está registrada la especialidad para ese especialista
                if (especialidadFiltrado.length == 0) {
                  especialistas[index].especialidades.push(especialistaActual.especialidades[0]);
                }
              }
            }
          });
        })
        .catch(function(err) {
          reject(new errors(500, 'No se pudo cargar la plataforma'));
        })
        .finally(function() {
          var opciones = {
            url: 'https://academia.utem.cl/ajax/sesaes/reservar/getHorarios_disponibles',
            method: 'GET',
            headers: {
              "X-Requested-With": "XMLHttpRequest"
            },
            jar: sesionAcademia,
            ...OPCIONES_GENERALES
          };

          request(opciones, function(error, response, html) {
            var $ = cheerio.load(html);
            if (response.statusCode == 500 || response.statusCode == 200) {
              $('div table tbody tr').each(function() {
                var valores = $(this).find('td:nth-of-type(5) #horario').val();
                var especialidadId = parseInt(valores.substr(valores.indexOf('&') + 1, valores.length - valores.lastIndexOf('&') - 1));
                var especialistaActual = {
                  _id: parseInt(valores.substr(0, valores.indexOf('&'))),
                  rut: parseInt(valores.substr(0, valores.indexOf('&'))),
                  nombre: $(this).find('td').eq(0).text().trim().toTitleCase(),
                  especialidades: [{
                    _id: especialidadId,
                    nombre: especialidadId == 13 ? 'Enfermeria' : $(this).find('td').eq(1).text().trim().toSentenceCase(),
                    disponible: true,
                  }]
                }

                if (parametros == null || parametros.rutEspecialista === especialistaActual._id) {
                  var especialistaFiltrado = especialistas.filter(function(elemento) {
                    return elemento._id == especialistaActual._id;
                  });

                  // Si no existe especialista con ese RUT
                  if (especialistaFiltrado.length == 0) {
                    especialistas.push(especialistaActual);
                  } else {
                    var i = especialistas.indexOf(especialistaFiltrado[0]);
                    var especialidadFiltrado = especialistas[i].especialidades.filter(function(especialidad) {
                      return especialidad._id == especialistaActual.especialidades[0]._id;
                    });
                    // Si no está registrada la especialidad para ese especialista
                    if (especialidadFiltrado.length == 0) {
                      especialistas[i].especialidades.push(especialistaActual.especialidades[0]);
                    } else {
                      // Marcamos como disponible la especialidad
                      var j = especialistas[i].especialidades.indexOf(especialidadFiltrado[0]);
                      especialistas[i].especialidades[j].disponible = true;
                    }
                  }
                }

                resolve(especialistas)
              });
            } else {
              reject(new errors(500, 'No se pudo cargar la plataforma'));
            }
          });
        });
    } catch (e) {
      reject(e);
    }
  });
}

exports.getHorarios = function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    try {
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);

      if (parametros.fecha) {

      } else {
        var opciones = {
          url: 'https://academia.utem.cl/ajax/sesaes/reservar/getHorarios_disponibles',
          method: 'POST',
          form: {
            'mae_rut': parametros.rutEspecialista
          },
          headers: {
            'X-Requested-With': "XMLHttpRequest"
          },
          jar: sesionAcademia,
          ...OPCIONES_GENERALES
        };

        request(opciones, async function(error, response, html) {
          if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var dias = [];
            var valores = $('div table tbody tr:nth-of-type(1) #horario').val();
            var especialidad = parseInt(valores.substr(valores.indexOf('&') + 1, valores.length - valores.lastIndexOf('&') - 1));
            var prestacion = parseInt(valores.substr(valores.lastIndexOf('&') + 1));
            var textoFecha = $('div table tbody tr:nth-of-type(1) input.dia_proximo').val();
            var anio = parseInt(textoFecha.substr(6));
            var mes = parseInt(textoFecha.substr(3, 2)) - 1;
            var dia = parseInt(textoFecha.substr(0, 2));
            var fecha = new Date(anio, mes, dia);
            var fechas = tiempo.diasEntre(fecha, tiempo.sumarMeses(fecha, 3));

            console.log(fechas);
            
            /*
            var dia;
            var url = 'https://academia.utem.cl/ajax/sesaes/reservar/getHoras_disponibles';
            opciones = {
              url: url + '?horario=' + parametros.rutEspecialista + '%26' + especialidad + '%26' + prestacion + '&fecha_reserva=' + textoFecha,
              method: 'GET',
              headers: {
                'X-Requested-With': "XMLHttpRequest"
              },
              jar: sesionAcademia,
              transform: function(html) {
                return {
                  fecha: textoFecha,
                  cheerio: cheerio.load(html)
                }
              }
            };

            requestp(opciones).then(function(vars) {
              var $ = vars.cheerio;
              var horas = [];
              $('table tbody tr').each(function() {
                horas.push($(this).find('td').eq(0).text());
              });

              dia = {
                fecha: vars.fecha,
                horas: horas
              };

              console.log(dia);
            })
            .catch(function() {

            })
            .finally(function() {
              dias.push(dia);
            }); */

            resolve(dias);
          } else {
            reject(new errors(500, 'No se pudo cargar la plataforma'));
          }
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}

exports.reservar = async function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    try {
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);
      var opciones = {
        url: 'https://academia.utem.cl/ajax/sesaes/reservar/guardar_reserva',
        method: 'GET',
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        form: {
          'mae_rut': 7777613,
          'prm_codigo': 12,
          'tes_codigo': 10,
          'isa_codigo': 10,
          'fecha_reserva': "30-07-2018",
          'hora': "17:15"
        },
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      };

      request(opciones, async function(error, response, html) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(html);
          $('div table tbody tr').each(function() {
            var hola = $(this).find('td').eq(0);
          });
          resolve({
            _id: null, // rpm_correlativo
            especialista: {
              _id: null, // mae_rut
              rut: null, // mae_rut
              nombre: null // mae_nombre
            },
            especialidad: {
              _id: null, // tes_rut
              nombre: null
            },
            prestacion: {
              _id: null, // prm_codigo
              nombre: null
            },
            instalacion: {
              _id: null, // isa_codigo
              nombre: null
            },
            fecha: {
              dia: null,
              hora: null
            }
          });
        } else {
          reject(new errors(500, 'No se pudo cargar la plataforma'));
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

exports.anular = async function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    try {
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);
      var opciones = {
        url: 'https://academia.utem.cl/ajax/sesaes/reservar/getHorarios_disponibles',
        method: 'GET',
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      };

      request(opciones, async function(error, response, html) {
        var $ = cheerio.load(html);
        $('div table tbody tr').each(function() {
          var hola = $(this).find('td').eq(0);
        });
        if (response.statusCode == 500) {

          resolve({});
        } else {
          reject(new errors(500, 'No se pudo cargar la plataforma'));
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
