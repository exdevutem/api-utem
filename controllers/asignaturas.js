'use strict';

var request = require('request');
var cheerio = require('cheerio');

var logger = require('../middlewares/logger');
var errors = require('../middlewares/errors');
var tiempo = require('../helpers/tiempo');

var Asignatura = require('../models/Asignatura');
var Docente = require('../models/Docente');
var rut = require('../helpers/rut');

const {ACADEMIA_URL, OPCIONES_GENERALES} = require('../helpers/constants');

var getAsignaturas = function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    try {
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);
      
      var asignaturasBitacora = await getAsignaturasBitacora(sesionAcademia, null);
      var asignaturasNotas = await getAsignaturasNotas(sesionAcademia, null);

      for (let i = 0; i < asignaturasNotas.length; i++) {
        function estaEn(a) {
          return a.codigo == asignaturasNotas[i].codigo;
        }

        if (asignaturasBitacora.filter(estaEn).length < 1) {
          asignaturasBitacora.push(asignaturasNotas[i])
        }
      }
      resolve(asignaturasBitacora);

    } catch (e) {
      reject(e);
    }
  });
}

var getAsignaturasBitacora = (autenticacion, parametros) => {
  return new Promise(async function(resolve, reject) {
    const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
    var sesionAcademia = request.jar();
    sesionAcademia.setCookie(cookie, ACADEMIA_URL);

    try {
      var opciones = {
        url: ACADEMIA_URL + 'libro_de_clases/bitacora_de_clases',
        method: 'GET',
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      };

      request(opciones, function(error, response, html) {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(html);
          const asignaturas = $('#tableAsignaturas tbody tr.info');
          const mensajeSinAsignaturas = $(asignaturas).eq(0).find('td').text().trim();
          if (mensajeSinAsignaturas.equalsIgnoreCase("No hay datos disponibles en la tabla.") || asignaturas.toArray().length < 1) {
            resolve([]);
          } else {
            var asignaturasPromises = asignaturas.toArray().map(function(e, i) {
              return new Promise(async function(resolve, reject) {
                const codigoYNombre = $(asignaturas).eq(i).find('th').eq(1).text().trim();
                const codigo = codigoYNombre.split('-')[0].trim();
                const nombre = codigoYNombre.split('-')[1].trim();
                const codigoCarrera = $(asignaturas).eq(i).find('th').eq(2).text().trim();
                const periodo = $(asignaturas).eq(i).find('th').eq(3).text().trim();
                const semestre = periodo.split('/')[0].trim();
                const anio = periodo.split('/')[1].trim();
                const secciones = $('#tableAsignaturas tbody tr#trDetalleScn' + (i + 1) + ' table tbody tr');
                var semestreId;
                var id;
                var apeId;
                var asignatura;

                var seccionesArray = [];

                secciones.each(function(i, e) {
                  semestreId = $(e).find('input.hdn_sme_id').val();
                  id = $(e).find('input.hdn_asi_id').val();
                  apeId = $(e).find('input.hdn_ape_id').val();
                  const tipo = $(e).find('td').eq(0).text().trim();
                  const seccion = $(e).find('td').eq(1).text().trim();
                  const docente = $(e).find('td').eq(2).text().trim();
                  const horario = $(e).find('td').eq(3).text().trim();

                  seccionesArray.push({
                    _id: null,
                    tipo: tipo.toTitleCase(),
                    seccion: seccion,
                    docente: {
                      nombre: docente.toTitleCase(),
                      horario: horario == "SIN INFORMACION" ? null : horario
                    }
                  });
                });

                if (parametros == null || parametros.id == id) {
                  asignatura = {
                    _id: parseInt(id),
                    codigo: codigo.toUpperCase(),
                    nombre: nombre.toTitleCase(),
                    carrera: {
                      apeId: parseInt(apeId),
                      codigo: codigoCarrera.toUpperCase()
                    },
                    periodo: {
                      _id: parseInt(semestreId) || null,
                      anio: anio,
                      semestre: semestre
                    },
                    secciones: seccionesArray
                  }
                }

                resolve(asignatura);
              });
            });

            Promise.all(asignaturasPromises).then(async function(results) {
              // Limpio el arreglo para los elementos nulos
              var asignaturas = results.filter(function(n) { return n != undefined });
              if (asignaturas.length <= 0) {
                reject(new errors(404, 'No existe ninguna asignatura que coincida con los parametros ingresados'));
              } else {
                resolve(asignaturas);
              }
            });
          }
        } else {
          reject(new errors(500, 'No se pudo cargar la plataforma'));
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

var getAsignaturasHorarios = (autenticacion) => {
  return new Promise((resolve, reject) => {
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
        var asignaturasFinal = [];

        $(horarios).each(function() {
          const tituloCarrera = $(this).find('.panel-info .panel-heading h3.panel-title').text().trim();
          const asignaturas = $(this).find('.panel-collapse .panel-body div:nth-of-type(1) table tbody tr');

          const codigoCarrera = tituloCarrera.slice(0, tituloCarrera.search('/')).trim();

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
              codigo: codigo.toUpperCase(),
              nombre: asignatura.toTitleCase(),
              carrera: {
                codigo: null
              },
              docente: objetoDocente,
              tipo: tipo.toTitleCase(),
              
            });
          });

          horariosArray.push(objeto);
        })
        resolve(horariosArray);
      });
    } catch (e) {
      reject(e);
    }
  });
}

var getAsignaturasNotas = (sesion, parametros) => {
  return new Promise(async function(resolve, reject) {
    try {
      var opciones = {
        url: ACADEMIA_URL + 'alumno/mis_notas',
        method: 'GET',
        jar: sesion,
        ...OPCIONES_GENERALES
      };

      request(opciones, async function(error, response, html) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(html);
          const asignaturas = $('#content .row .panel-body fieldset #accordion').children();

          var asignaturasPromises = asignaturas.toArray().map(function(e, i) {
            return new Promise(async function(resolve, reject) {
              const str = $(e).find('a[href="#collapse' + i + '"]').text().trim();
              const codigo = str.substr(0, str.indexOf(' '));
              const nombre = str.substr(str.indexOf(' ') + 1, str.lastIndexOf('-') - str.indexOf(' ') - 1).trim();
              const tipo = str.substr(str.lastIndexOf('-') + 1).trim();
              const docente = $(e).find('#collapse' + i + ' .panel-body div ul li').eq(0).text().replace('Profesor :', '').trim();

              var asignaturaActual = {
                _id: await getIdByCodigo(codigo),
                codigo: codigo.toUpperCase(),
                nombre: nombre.toTitleCase(),
                tipo: tipo.toTitleCase(),
                docente: {
                  nombre: docente.toTitleCase()
                }
              };
              resolve(asignaturaActual);
            });
          });

          Promise.all(asignaturasPromises).then(function(results) {
            // Limpio el arreglo para los elementos nulos
            var asignaturas = results.filter(function(n) { return n != undefined });
            if (asignaturas.length <= 0) {
              reject(new errors(404, 'No existe ninguna asignatura que coincida con los parametros ingresados'));
            } else {
              var final = [];
              for (var i = 0; i < asignaturas.length; i++) {
                /*function verificarRepetido(a) {
                  return a.tipo == asignaturas[i].tipo && a.docente == asignaturas[i].docente;
                }*/

                function verificarExistente(a) {
                  return a.codigo == asignaturas[i].codigo;
                }
     
                if (final.filter(verificarExistente).length > 0) {
                  var index = final.indexOf(final.filter(verificarExistente)[0])
                  final[index].secciones.push({
                    tipo: asignaturas[i].tipo,
                    docente: asignaturas[i].docente
                  })
                } else {
                  var seccion = {
                    tipo: asignaturas[i].tipo,
                    docente: asignaturas[i].docente
                  }
                  final.push({
                    _id: asignaturas[i]._id,
                    codigo: asignaturas[i].codigo,
                    nombre: asignaturas[i].nombre,
                    secciones: [seccion]
                  });
                }

              }
              resolve(final);
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

var getNotas = function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    try {
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);
      var opciones = {
        url: 'https://academia.utem.cl/alumno/mis_notas',
        method: 'GET',
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      };

      request(opciones, async function(error, response, html) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(html);
          const asignaturas = $('#content .row .panel-body fieldset #accordion').children();
          const parametroCodigo = await getCodigoById(parametros.id);
          
          var asignaturasPromises = asignaturas.toArray().map(function(e, i) {
            return new Promise(async function(resolve, reject) {
              const str = $(e).find('a[href="#collapse' + i + '"]').text().trim();
              const codigo = str.substr(0, str.indexOf(' '));
              const nombre = str.substr(str.indexOf(' ') + 1, str.lastIndexOf('-') - str.indexOf(' ') - 1).trim();
              const tipo = str.substr(str.lastIndexOf('-') + 1).trim();
              const docente = $(e).find('#collapse' + i + ' .panel-body div ul li').eq(0).text().replace('Profesor :', '').trim();
              
              if (codigo && codigo == parametroCodigo) {
                const mensaje = $(e).find('#collapse' + i + ' .panel-body div.alert').clone().children().remove().end().text().trim();
                var notas;
                var ponderadores;

                if (mensaje.equalsIgnoreCase('El profesor no ha registrado los ponderadores de este curso')) {
                  notas = null;
                  ponderadores = false;
                } else {
                  notas = await getNotasAsignatura(i, $);
                  ponderadores = true;
                }
                var asignaturaActual = {
                  codigo: codigo.toUpperCase(),
                  nombre: nombre.toTitleCase(),
                  tipo: tipo.toTitleCase(),
                  docente: {
                    nombre: docente.toTitleCase()
                  },
                  ponderadoresRegistrados: ponderadores,
                  notas: notas
                };
                resolve(asignaturaActual);
              } else {
                resolve(null)
              }
            });
          });

          Promise.all(asignaturasPromises).then(function(resultados) {
            // Limpio el arreglo para los elementos nulos

            var asignaturas = resultados.filter(function(n) { return n != undefined });
            if (asignaturas.length <= 0) {
              reject(new errors(404, 'No existe ninguna asignatura que coincida con los parametros ingresados'));
            } else {
              resolve(asignaturas);
            }
          })
          
        } else {
          reject(new errors(500, 'No se pudo cargar la plataforma'));
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

var getNotasAsignatura = function(i, $) {
  return new Promise(function(resolve, reject) {
    const tabla = $('#content .row .panel-body #accordion #collapse' + i + ' table');
    var notas = [];
    var notaPresentacion;
    var examenes = [];
    var notaFinal;
    var observacion;
    $(tabla).find('thead tr th').each(function(j) {
      var valorNota;
      const final = $('#content #collapse' + i + ' table tbody tr td').eq(-2).text().trim();
      const obs = $('#content #collapse' + i + ' table tbody tr td').eq(-1).text().trim();
      if ($('#content #collapse' + i + ' table tbody tr td').eq(0).text().trim() === 'El profesor no ha registrado notas.') {
        valorNota = null;
      } else {
        valorNota = $('#content #collapse' + i + ' table tbody tr td').eq(j).text().trim();
      }

      if ($(this).text().trim().equalsIgnoreCase("Nota Prest")) {
        notaPresentacion = parseFloat(valorNota);
      } else if ($(this).text().trim().equalsIgnoreCase("Estado ParcialObservación")) {
        observacion = obs || null;
      } else if ($(this).text().trim().equalsIgnoreCase("Nota Final")) {
        notaFinal = parseFloat(final) || null;
      } else if ($(this).text().trim().equalsIgnoreCase("Examen")) {
        examenes.push(parseFloat(valorNota) || null);
      } else {
        var nota = {
          tipo: $(this).text().replace(/[0-9]/g, '').replace('%', '').trim(),
          ponderador: parseInt($(this).text().replace(/^\D+/g, '')) / 100,
          nota: parseFloat(valorNota)
        }
        notas.push(nota);
      }
      if (j + 1 == $(tabla).find('thead tr th').length) {
        resolve({
          presentacion: notaPresentacion,
          examenes: examenes,
          final: notaFinal,
          observacion: observacion,
          parciales: notas
        });

      }
    });
  });
}

var getBitacora = function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    const asignatura = await getAsignaturasBitacora(autenticacion, parametros)
    
    const asiId = asignatura[0]._id;
    const apeId = asignatura[0].carrera.apeId;
    const smeId = asignatura[0].periodo._id;
    const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
    var sesionAcademia = request.jar();
    sesionAcademia.setCookie(cookie, ACADEMIA_URL);

    try {
      var opciones = {
        url: ACADEMIA_URL + 'libro_de_clases/bitacora_de_clases/ver_bitacora_de_clase',
        method: 'POST',
        form: {
          'hdn_asi_id': asiId,
          'hdn_ape_id': apeId,
          'hdn_sme_id': smeId
        },
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      };

      request(opciones, function(error, response, html) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(html);
          var secciones = [];
          $('.panel-body ul.nav-tabs li').each((i, e) => {
            const nombre = $(e).find('a span').text().trim();
            const tipo = nombre.split('-')[0].trim();
            const seccion = nombre.split('-')[1].trim();
            const contenido = $('.panel-body .tab-content #default-tab-' + (i + 1));
            const scnId = $(contenido).find('input[name="hdn_scn_id"]').val();
            const tablaDocente = $(contenido).find('table').eq(0).find('tbody tr td').eq(0).find('table');
            const nombreDocente = $(tablaDocente).find('tr').eq(0).find('td').eq(0).text().trim();
            const rutDocente = $(tablaDocente).find('tr').eq(0).find('td').eq(1).text().trim();
            const correoDocente = $(tablaDocente).find('tr').eq(1).find('td').eq(0).text().trim();
            const registros = $(contenido).find('table.table-bordered').find('tbody tr');

            const rutLimpio = parseInt(rut.limpiar(rutDocente).slice(0, -1));

            var bitacora = [];
            var asistidos = 0;
            var noAsistidos = 0;
            var suspendidos = 0;
            var total = 0;
            
            $(registros).each(function(j, e) {
              const numero = $(this).find('td').eq(0).text().trim();
              const fecha = $(this).find('td').eq(1).text().trim();
              const bloque = $(this).find('td').eq(2).text().trim();
              const observaciones = $(this).find('td').eq(3).text().trim().split('\n');
              const asistencia = $(this).find('td').eq(4).find('i');

              var valorAsistencia;
              var suspendido = false;
              var registrado = true;

              if (asistencia.hasClass("fa-minus-circle")) {
                valorAsistencia = null;
                suspendido = true;
                suspendidos++;
              } else if (asistencia.hasClass("fa-times")) {
                noAsistidos++;
                valorAsistencia = false;
              } else if (asistencia.hasClass("fa-check")) {
                if (asistencia.hasClass("text-success")) {
                  asistidos++;
                  valorAsistencia = true;
                } else if (asistencia.hasClass("text-warning")) {
                  asistidos++;
                  valorAsistencia = true;
                  registrado = false;
                } else if (asistencia.hasClass("text-danger")) {
                  valorAsistencia = null;
                  asistidos++;
                }
                
              }

              var registro = {
                numero: parseInt(numero),
                fecha: fecha,
                periodo: tiempo.horasAPeriodo(bloque),
                observaciones: observaciones,
                registrado: registrado,
                suspendido: suspendido,
                asistencia: valorAsistencia
              };
              bitacora.push(registro);
              total++;
            });

            secciones.push({
              _id: parseInt(scnId),
              seccion: seccion,
              tipo: tipo.toTitleCase(),
              docente: {
                nombre: nombreDocente.toTitleCase(),
                rut: rutLimpio,
                fotoUrl: 'https://sgu.utem.cl/pgai/perfil_foto.php?rut=' + rutLimpio + '&sexo=1&t_usu=2',
                correo: correoDocente
              },
              libro: {
                bloques: total,
                asistencias: asistidos,
                inasistencias: noAsistidos,
                suspendidos: suspendidos,
                bitacora: bitacora
              }
            });
          });
          resolve(secciones);
    
        } else {
          reject(new errors(500, 'No se pudo cargar la plataforma'));
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

var getAsignaturaByCodigo = function(codigo) {
  return new Promise(function(resolve, reject) {
    Asignatura.findOne({codigo: codigo}, function(err, asignatura) {
      if (err) {
        reject(err);
      } else if (!asignatura || asignatura.length == 0) {
        reject(null);
      } else {
        resolve(asignatura);
      }
    }).catch((err) => {
      reject(err);
    });;
  });
}

var getAsignaturaById = function(id) {
  return new Promise(function(resolve, reject) {
    Asignatura.findById(id, function(err, asignatura) {
      if (err) {
        reject(err);
      } else if (!asignatura || asignatura.length == 0) {
        reject(null);
      } else {
        resolve(asignatura);
      }
    }).catch((err) => {
      reject(err);
    });;
  });
}

var getIdByCodigo = function(codigo) {
  return new Promise(function(resolve, reject) {
    Asignatura.findOne({codigo: codigo}, function(err, asignatura) {
      if (err) {
        resolve(null);
      } else if (!asignatura || asignatura.length == 0) {
        resolve(null);
      } else {
        resolve(asignatura._id);
      }
    }).catch((err) => {
      reject(null);
    });;
  });
}

var getCodigoById = (id) => {
  return new Promise(function(resolve, reject) {
    Asignatura.findById(id, function(err, asignatura) {
      if (err) {
        resolve(null);
      } else if (!asignatura || asignatura.length == 0) {
        resolve(null);
      } else {
        resolve(asignatura.codigo);
      }
    }).catch((err) => {
      reject(null);
    });;
  });
}

var getDocenteId = function(nombres, apellidos) {
  return new Promise(function(resolve, reject) {
    Docente.findOne({'nombre.nombres': nombres, 'nombre.apellidos': apellidos}, function(err, data) {
      var respuesta;
      if (data && data != null) {
        respuesta = {
          _id: data._id,
          nombre: data.nombre,
          rut: data.rut,
          correo: data.correo
        }
      } else {
        respuesta = null;
      }
      resolve(respuesta);
    }).catch(function(err) {
      reject(null);
    });
  });
}

module.exports = {getAsignaturas, getAsignaturaById, getAsignaturasNotas, getAsignaturasBitacora, getNotas, getBitacora, getIdByCodigo, getCodigoById};
