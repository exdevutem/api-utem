'use strict';

var request = require('request');
var cheerio = require('cheerio');
var logger = require('../middlewares/logger');
var rut = require('../helpers/rut');
var errors = require('../middlewares/errors');
var Asignaturas = require('./asignaturas');
var Asignatura = require('../models/Asignatura');

const {ACADEMIA_URL, OPCIONES_GENERALES} = require('../helpers/constants');

exports.getCarreras = function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    try {
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);
      var opciones = {
        url: 'https://academia.utem.cl/alumno/boletin_de_notas',
        method: 'GET',
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      };

      request(opciones, function(error, response, html) {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(html);
          const mensaje = $('#page-container #content fieldset div.alert-info').clone().children().remove().end().text().trim();
          if (mensaje.equalsIgnoreCase("No existe boletín de notas asociado al rut.")) {
            resolve([]);
          } else {
            const carreras = $('#content .panel .panel-body fieldset center div #accordion').children();

            var carrerasPromises = carreras.toArray().map(function(e, i) {
              return new Promise(async function(resolve, reject) {
                const tituloCarrera = $(e).find('.panel-info .panel-heading h3.panel-title').text().trim();
                const elementoLista = $(e).find('.panel-collapse .panel-body div');
                const id = $(e).find('#Formulario' + i + ' input[name="hdn_ape_id"]').val();
                const carreraId = $(e).find('#Formulario' + i + ' input[name="hdn_carrera_id"]').val();
                const planId = $(e).find('#Formulario' + i + ' input[name="hdn_plan_id"]').val();
                const semestreInicioId = $(e).find('#Formulario' + i + ' input[name="hdn_semestre_inicio"]').val();
                const semestreTerminoId = $(e).find('#Formulario' + i + ' input[name="hdn_semestre_fin"]').val();
                const planNumero = $(elementoLista).find('spam').eq(0).clone().children().remove().end().text().trim();
                const estado = $(elementoLista).find('spam').eq(1).clone().children().remove().end().text().trim();
                const viaIngreso = $(elementoLista).find('spam').eq(2).clone().children().remove().end().text().trim();
                const semestreInicio = $(elementoLista).find('spam').eq(3).clone().children().remove().end().text().trim();
                const semestreTermino = $(elementoLista).find('spam').eq(4).clone().children().remove().end().text().trim();

                var carrera;

                if (parametros == null || parametros.idCarrera == id) {
                  carrera = {
                    _id: parseInt(id),
                    carrera: {
                      _id: parseInt(carreraId),
                      codigo: parseInt(tituloCarrera.split('-')[0].trim()),
                      nombre: tituloCarrera.split('-')[1].trim().toTitleCase()
                    },
                    plan: {
                      _id: parseInt(planId),
                      numero: parseInt(planNumero)
                    },
                    estado: estado,
                    viaIngreso: viaIngreso,
                    semestreInicio: {
                      _id: parseInt(semestreInicioId) || null,
                      semestre: semestreInicio == "" ? null : parseInt(semestreInicio.split('/')[1].trim()),
                      anio: semestreInicio == "" ? null : parseInt(semestreInicio.split('/')[0].trim())
                    },
                    semestreTermino: {
                      _id: parseInt(semestreTerminoId) || null,
                      semestre: semestreTermino == "" ? null : parseInt(semestreTermino.split('/')[1].trim()),
                      anio: semestreTermino == "" ? null : parseInt(semestreTermino.split('/')[0].trim())
                    }
                  }
                }
                resolve(carrera);
              });
            });

            Promise.all(carrerasPromises).then(function(results) {
              // Limpio el arreglo para los elementos nulos
              results = results.filter(function(n) { return n != undefined });
              if (results.length <= 0) {
                reject(new errors(404, 'No existe ninguna carrera que coincida con los parametros ingresados'));
              }
              resolve(results);
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

exports.getApeIds = function(autenticacion) {
  return new Promise(async function(resolve, reject) {
    var json = await carreras.getCarreras(autenticacion, null);
  });
}

exports.getMalla = function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    try {
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);

      var opciones = {
        url: 'https://academia.utem.cl/alumno/avance_malla',
        method: 'GET',
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      };

      request(opciones, function(error, response, html) {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(html);
          const mensaje = $('#page-container #content fieldset div.alert-info').clone().children().remove().end().text().trim();
          if (mensaje.equalsIgnoreCase("No existe un avance de malla asociado al rut.")) {
            reject(new errors(404, 'No existe ninguna carrera que coincida con los parametros ingresados'));
          } else {
            const carreras = $('#content #accordion').children();

            $(carreras).each(function() {
              const id = $(this).find('.panel-collapse .panel-body spam input.cls_ape_id').val();

              if (parametros.idCarrera == id) {
                const filas = $('table tbody tr');

                var asignaturas = [];
                var nivelEnCurso = null;
                var asignaturasReprobadas = 0;
                var asignaturasTotal = 0;
                var asignaturasAprobadas = 0;
                var asignaturasAprobadasNivel = 0;
                var asignaturasAprobadasHastaNivel = 0;

                var asignaturasPromises = $(this).find(filas).toArray().map(function(e, i) {
                  return new Promise(async function(resolve, reject) {
                    const nivel = $(e).find('td').eq(0).text().trim();
                    const codigoNombre = $(e).find('td').eq(1).text().trim();
                    const tipo = $(e).find('td').eq(2).text().trim();
                    const estado = $(e).find('td').eq(4).text().trim();
                    const oportunidades = $(e).find('td').eq(3).text().trim();
                    const nota = $(e).find('td').eq(5).text().trim();
                    var asignatura = {
                      _id: await Asignaturas.getIdByCodigo(codigoNombre.split('-')[0].trim()),
                      codigo: codigoNombre.split('-')[0].trim().toUpperCase(),
                      nombre: codigoNombre.split('-')[1].trim().toTitleCase(),
                      tipo: tipo.toTitleCase(),
                      convalidado: estado.toLowerCase().includes("conv"),
                      oportunidades: parseInt(oportunidades) || 0,
                      estado: estado.toTitleCase().replace("/conv.", ""),
                      nota: parseFloat(nota)
                    };

                    if (i == 0) {
                      nivelEnCurso = filas.length;
                    }

                    switch (asignatura.estado) {
                      case "Aprobado":
                        asignaturasAprobadas++;
                        break;
                      case "Reprobado":
                        asignaturasReprobadas++;
                        if ((parseInt(nivel) || null) != null) {
                          nivelEnCurso = nivelEnCurso > parseInt(nivel) ? parseInt(nivel) : nivelEnCurso;
                        }
                        break;
                      case "Inscrito":
                        if ((parseInt(nivel) || null) != null) {
                          nivelEnCurso = nivelEnCurso > parseInt(nivel) ? parseInt(nivel) : nivelEnCurso;
                        }
                        break;
                      case "No Inscrita":
                        if ((parseInt(nivel) || null) != null) {
                          nivelEnCurso = nivelEnCurso > parseInt(nivel) ? parseInt(nivel) : nivelEnCurso;
                        }
                        break;
                      default:
                        if ((parseInt(nivel) || null) != null) {
                          nivelEnCurso = nivelEnCurso > parseInt(nivel) ? parseInt(nivel) : nivelEnCurso;
                        }
                        break;
                    }

                    asignaturasTotal++;

                    resolve({
                      nivel: parseInt(nivel) || null,
                      asignatura: asignatura
                    });

                  });
                });

                Promise.all(asignaturasPromises).then(function(asignaturas) {
                  var respuesta = agruparAsignaturas(asignaturas, nivelEnCurso);

                  var mallaCurricular = {
                    asignaturas: {
                      totales: asignaturasTotal,
                      aprobadas: asignaturasAprobadas,
                      reprobadas: asignaturasReprobadas,
                      aprobadasHastaNivel: respuesta[1]
                    },
                    nivelActual: nivelEnCurso,
                    malla: respuesta[0]
                  };

                  resolve(mallaCurricular);
                });
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

function agruparAsignaturas(asignaturas, nivelEnCurso) {
  var malla = [];
  var hastaNivel = 0;
  for (var i = 0; i < asignaturas.length; i++) {
    var asignatura = asignaturas[i];
    var niveles = malla.filter(function(elemento) {
      return elemento.nivel == asignatura.nivel;
    });
    if (parseInt(asignatura.nivel) <= parseInt(nivelEnCurso) && asignatura.asignatura.estado == "Aprobado") {
      hastaNivel++;
    }
    if (niveles.length == 0) {
      var nivel = {
        nivel: asignatura.nivel,
        asignaturas: []
      };
      nivel.asignaturas.push(asignatura.asignatura);
      malla.push(nivel);
    } else {
      malla[malla.indexOf(niveles[0])].asignaturas.push(asignatura.asignatura);
    }
  }
  return [malla, hastaNivel];
}

exports.getBoletin = async function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    try {
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);

      var opciones = {
        url: 'https://academia.utem.cl/alumno/boletin_de_notas',
        method: 'GET',
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      }

      request(opciones, function(error, response, html) {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(html);
          const mensaje = $('#page-container #content fieldset div.alert-info').clone().children().remove().end().text().trim();
          if (mensaje.equalsIgnoreCase("No existe boletín de notas asociado al rut.")) {
            reject(new errors(404, 'No existe ninguna carrera que coincida con los parametros ingresados'));
          } else {
            const carreras = $('#content .panel .panel-body #accordion').children();
            $(carreras).each(function() {
              const usuarioId = $(this).find('input[name="hdn_usuario_id"]').val();
              const inicioId = $(this).find('input[name="hdn_semestre_inicio"]').val();
              const finId = $(this).find('input[name="hdn_semestre_fin"]').val();
              const planId = $(this).find('input[name="hdn_plan_id"]').val();
              const carreraId = $(this).find('input[name="hdn_carrera_id"]').val();
              const apeId = $(this).find('input[name="hdn_ape_id"]').val();
              if (apeId == parametros.idCarrera) {
                opciones = {
                  url: 'https://academia.utem.cl/ajax/alumno/boletin_de_notas/getTablaBoletinNotas',
                  method: 'POST',
                  form: {
                    "FormaDatos[0][name]": "hdn_usuario_id",
                    "FormaDatos[0][value]": usuarioId,
                    "FormaDatos[1][name]": "hdn_semestre_inicio",
                    "FormaDatos[1][value]": inicioId,
                    "FormaDatos[2][name]": "hdn_semestre_fin",
                    "FormaDatos[2][value]": finId,
                    "FormaDatos[3][name]": "hdn_plan_id",
                    "FormaDatos[3][value]": planId,
                    "FormaDatos[4][name]": "hdn_carrera_id",
                    "FormaDatos[4][value]": carreraId,
                    "FormaDatos[5][name]": "hdn_ape_id",
                    "FormaDatos[5][value]": apeId
                  },
                  headers: {
                    "X-Requested-With": "XMLHttpRequest"
                  },
                  jar: sesionAcademia,
                  ...OPCIONES_GENERALES
                };

                request(opciones, function(error, response, body) {
                  const json = JSON.parse(body);
                  var semestres = [];
                  json.forEach(function(semestre) {
                    const nombre = semestre.NOMBRE_SEMESTRE;
                    const aprobados = semestre.CURSOS_APROBADOS;
                    const rebrobados = semestre.CURSOS_REPROBADOS;
                    const convalidados = semestre.CURSOS_CONVALIDADOS;
                    const promedio = semestre.PROMEDIO_FINAL;
                    const $ = cheerio.load(semestre.CARRERAS);
                    var asignaturas = [];

                    $('table tr').each(function() {
                      const nombre = $(this).find('td').eq(1).text().trim();
                      const estado = $(this).find('td').eq(2).text().trim();
                      const nota = $(this).find('td').eq(3).text().trim();
                      var asignatura = {
                        nombre: nombre.toTitleCase(),
                        estado: estado.toUpperCase().replace("/C", ""),
                        convalidado: estado.toUpperCase().includes("/C"),
                        nota: parseFloat(nota)
                      };
                      asignaturas.push(asignatura);
                    });

                    var semestre = {
                      nombre: nombre.toTitleCase(),
                      asignaturasAprobadas: parseInt(aprobados),
                      asignaturasReprobadas: parseInt(rebrobados),
                      asignaturasConvalidadas: parseInt(convalidados),
                      promedioFinal: parseFloat(promedio),
                      asignaturas: asignaturas,
                    }
                    semestres.push(semestre);
                  });

                  resolve(semestres);
                });
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
