'use strict';

var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');

var logger = require('../middlewares/logger');
var rut = require('../helpers/rut');
var errors = require('../middlewares/errors');

var Estudiante = require('../models/Estudiante');
var Carrera = require('../models/Carrera');
var Docente = require('../models/Docente');

const {ACADEMIA_URL, OPCIONES_GENERALES} = require('../helpers/constants');

var getEstudiantes = function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    if (autenticacion && parametros && parametros.rutEstudiante && parametros.rutEstudiante == autenticacion.rut) {
      try {
        const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
        var sesionAcademia = request.jar();
        sesionAcademia.setCookie(cookie, ACADEMIA_URL);

        var id = await getUsuarioId(sesionAcademia);

        var opciones = {
          url: ACADEMIA_URL + 'usuario/perfil/editar',
          method: 'GET',
          jar: sesionAcademia,
          ...OPCIONES_GENERALES
        };

        request(opciones, async function(error, response, html) {
          const $ = cheerio.load(html);
          if (!error && response.statusCode == 200) {
            const puntajePsu = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(3) td:nth-of-type(2)').text();
            const nombreAcademia = $('#content .profile-section .profile-right .profile-info table thead tr th:nth-of-type(2) h4').clone().children().remove().end().text().trim();
            const correoPersonal = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(11) td:nth-of-type(2)').text();
            const direccion = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(10) td:nth-of-type(2)').text();
            const movil = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(4) td:nth-of-type(2) a').text();
            const fijo = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(5) td:nth-of-type(2) a').text();
            const tipos = $('#content .profile-section .profile-right .profile-info table thead tr th:nth-of-type(2) h4 small');
            const rut = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(1) td:nth-of-type(2)').text();
            const correoUtem = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(6) td:nth-of-type(2)').text()
            const fotoUrl = $('#content .profile-section .profile-left .profile-image img').attr('src');
            const edad = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(2) td:nth-of-type(2)').text();
            const sexoId = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(7) td:nth-of-type(2) select option[selected]').val();
            const sexo = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(7) td:nth-of-type(2) select option[selected]').text();
            const comunaId = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(9) td:nth-of-type(2) select option[selected]').val();
            const comuna = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(9) td:nth-of-type(2) select option[selected]').text();
            const nacionalidadId = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(8) td:nth-of-type(2) select option[selected]').val();
            const nacionalidad = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(8) td:nth-of-type(2) select option[selected]').text();
            const anioIngreso = $('#content .profile-section:nth-of-type(2) .row div:nth-of-type(2) table tbody tr td:nth-of-type(1)').text().trim();
            const ultimaMatricula = $('#content .profile-section:nth-of-type(2) .row div:nth-of-type(2) table tbody tr td:nth-of-type(3)').text().trim();
            const carrerasCursadas = $('#content .profile-section:nth-of-type(2) .row div:nth-of-type(2) table tbody tr td:nth-of-type(2)').text().trim();

            var nombre = await getNombre(id) || nombreAcademia;
            var tiposArray = [];

            $(tipos).each(function() {
              tiposArray.push($(this).text().trim().toTitleCase());
            })

            var alumno = {
              _id: id,
              rut: parseInt(parametros.rutEstudiante),
              nombre: nombre,
              tipos: tiposArray,
              correoUtem: correoUtem.equalsIgnoreCase("Email Institucional") ? null : correoUtem.toLowerCase(),
              correoPersonal: correoPersonal === 'usuario@correo.cl' || correoPersonal.equalsIgnoreCase("Añadir Email Personal") ? null : correoPersonal.toLowerCase(),
              fotoUrl: fotoUrl,
              nacimiento: await getFechaNacimiento(sesionAcademia, id),
              puntajePsu: parseFloat(puntajePsu) < 150 || parseFloat(puntajePsu) > 850 ? null : parseFloat(puntajePsu),
              telefonoMovil: movil === 'Añadir Numero' ? null : (parseInt(movil) == 0 ? null : parseInt(movil)),
              telefonoFijo: fijo === 'Añadir Numero' ? null : (parseInt(fijo) == 0 ? null : parseInt(fijo)),
              sexo: {
                _id: parseInt(sexoId),
                sexo: sexo
              },
              nacionalidad: {
                _id: parseInt(nacionalidadId),
                nacionalidad: nacionalidad.toSentenceCase()
              },
              direccion: {
                comuna: {
                  _id: parseInt(comunaId),
                  comuna: comuna.toTitleCase()
                },
                direccion: direccion === 'Añadir Dirección' ? null : direccion,
              },
              anioIngreso: parseInt(anioIngreso),
              ultimaMatricula: parseInt(ultimaMatricula),
              carrerasCursadas: parseInt(carrerasCursadas)
            }

            resolve(alumno);
          } else {
            reject(new errors(500, 'No se pudo cargar la plataforma'));
          }
        });
      } catch (e) {
        reject(e);
      }
    } else {
      var query = {};
      if (parametros && parametros.rutEstudiante) {
        query = {rut: parametros.rutEstudiante};
      }
      Estudiante.find(query, function(err, data) {
        if (err) {
          reject(new errors(500, 'Ocurrió un error en la base de datos. ' + err));
        } else if (!data || data.length == 0) {
          var mensaje = 'No hay estudiantes registrados';
          reject(new errors(404, parametros.rutEstudiante ? mensaje + ' con el RUT ' + parametros.rutEstudiante : mensaje));
        } else {
          resolve(data);
        }
      });
    }
  });
}

var getEstudianteBdd = (rutQ) => {
  return new Promise((resolve, reject) => {
    Estudiante.findOne({rut: rutQ}, (err, estudiante) => {
      if (err) {
        reject(new errors(500, 'Ocurrió un error en la base de datos.', err));
      } else if (!estudiante || estudiante.length == 0) {
        var mensaje = 'No hay estudiantes registrados';
        reject(new errors(404, mensaje + ' con el RUT ' + rutQ));
      } else {
        resolve(estudiante);
      }
    });
  });
}

var saveEstudianteBdd = (datos) => {
  return new Promise(async (resolve, reject) => {
    var estudiante = new Estudiante(datos);
    estudiante.save((err) => {
      if (err) reject(err);
      resolve(estudiante);
    });
  })
}

var setEstudiante = async function(autenticacion, parametros) {
  return new Promise(async function(resolve, reject) {
    try {
      var promesas = [];
      const cookie = request.cookie('PHPSESSID=' + autenticacion.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);

      var opciones = {
        url: "https://academia.utem.cl/ajax/usuario/persona/mantenedor",
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        jar: sesionAcademia,
        form: {
          accion: "set",
          nombre: null,
          valor: null
        },
        ...OPCIONES_GENERALES
      }

      if (parametros.nacimiento) {
        promesas.push(new Promise(function(resolve, reject) {
          opciones.form.nombre = "txt_fecha_nacimiento";
          opciones.form.valor = parametros.nacimiento;

          request(opciones, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              if (JSON.parse(body)["R_MENSAJE"].equalsIgnoreCase("La PERSONA fue actualizada correctamente.")) {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              reject(new errors(500, 'No se pudo cargar la plataforma'));
            }
          });
        }));
      }

      if (parametros.movil) {
        promesas.push(new Promise(function(resolve, reject) {
          opciones.form.nombre = "txt_celular";
          opciones.form.valor = parametros.movil;
          request(opciones, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              if (JSON.parse(body)["R_MENSAJE"].equalsIgnoreCase("La PERSONA fue actualizada correctamente.")) {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              reject(new errors(500, 'No se pudo cargar la plataforma'));
            }
          });
        }));
      }
      if (parametros.fijo) {
        promesas.push(new Promise(function(resolve, reject) {
          opciones.form.nombre = "txt_telefono";
          opciones.form.valor = parametros.fijo;
          request(opciones, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              if (JSON.parse(body)["R_MENSAJE"].equalsIgnoreCase("La PERSONA fue actualizada correctamente.")) {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              reject(new errors(500, 'No se pudo cargar la plataforma'));
            }
          });
        }));
      }
      if (parametros.sexo) {
        promesas.push(new Promise(function(resolve, reject) {
          opciones.form.nombre = "cmb_sexo";
          opciones.form.valor = parametros.sexo;
          request(opciones, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              if (JSON.parse(body)["R_MENSAJE"].equalsIgnoreCase("La PERSONA fue actualizada correctamente.")) {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              reject(new errors(500, 'No se pudo cargar la plataforma'));
            }
          });
        }));
      }
      if (parametros.nacionalidad) {
        promesas.push(new Promise(function(resolve, reject) {
          opciones.form.nombre = "cmb_nacionalidad";
          opciones.form.valor = parametros.nacionalidad;
          request(opciones, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              if (JSON.parse(body)["R_MENSAJE"].equalsIgnoreCase("La PERSONA fue actualizada correctamente.")) {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              reject(new errors(500, 'No se pudo cargar la plataforma'));
            }
          });
        }));
      }
      if (parametros.comuna) {
        promesas.push(new Promise(function(resolve, reject) {
          opciones.form.nombre = "cmb_comuna";
          opciones.form.valor = parametros.comuna;
          request(opciones, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              if (JSON.parse(body)["R_MENSAJE"].equalsIgnoreCase("La PERSONA fue actualizada correctamente.")) {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              reject(new errors(500, 'No se pudo cargar la plataforma'));
            }
          });
        }));
      }
      if (parametros.direccion) {
        promesas.push(new Promise(function(resolve, reject) {
          opciones.form.nombre = "txt_direccion";
          opciones.form.valor = parametros.direccion;
          request(opciones, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              if (JSON.parse(body)["R_MENSAJE"].equalsIgnoreCase("La PERSONA fue actualizada correctamente.")) {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              reject(new errors(500, 'No se pudo cargar la plataforma'));
            }
          });
        }));
      }
      if (parametros.correo) {
        promesas.push(new Promise(function(resolve, reject) {
          opciones.form.nombre = "txt_email_personal";
          opciones.form.valor = parametros.correo;
          request(opciones, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              if (JSON.parse(body)["R_MENSAJE"].equalsIgnoreCase("La PERSONA fue actualizada correctamente.")) {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              reject(new errors(500, 'No se pudo cargar la plataforma'));
            }
          });
        }));
      }

      Promise.all(promesas).then(async function(results) {
        resolve({mensajes: results});
      }).catch(function(err) {
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
}

var getTodosEstudiantes = async function(autenticacion) {
  return new Promise(async function(resolve, reject) {
    Docente.find({}, function(err, data) {
      if (err) {
        reject(new errors(500, 'Ocurrió un error', err));
      } else if (!data) {
        reject(new errors(404, 'No hay estudiantes registrados'));
      } else {
        resolve(data);
      }
    });
  });
}

var getUsuarioId = async function(sesionAcademia) {
  return new Promise(async function(resolve, reject) {
    var opciones = {
      url: 'https://academia.utem.cl/alumno/boletin_de_notas',
      method: 'GET',
      jar: sesionAcademia,
      ...OPCIONES_GENERALES
    };

    request(opciones, function(error, response, html) {
      var $ = cheerio.load(html);
      var ids = [];

      $('#content .panel .panel-body fieldset center div #accordion').each(function(i) {
        var idUsuario = parseInt($(this).find('#Formulario' + i + ' input[name="hdn_usuario_id"]').val());
        ids.push(idUsuario);
      });

      if (ids.length < 1) {
        resolve(null);
      } else if (ids.length == 1) {
        resolve(ids[0]);
      } else {
        resolve(ids);
      }
    });
  });
}

var getNombre = function(id) {
  return new Promise(function(resolve, reject) {
    Estudiante.findById(id, function(err, data) {
      if (err || data == null) {
        resolve(null);
      } else {
        resolve(data.nombre);
      }
    });
  });
}

var getFechaNacimiento = function(sesion, id) {
  return new Promise(async function(resolve, reject) {
    var opciones = {
      url: process.env.UTEM_NACIMIENTO_URL,
      method: 'POST',
      form: {
        'hdn_id_alumno': id
      },
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      },
      jar: sesion,
      ...OPCIONES_GENERALES
    };

    request(opciones, function(error, response, html) {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);
        resolve($('.panel-body #frm_persona input.fecha_nacimiento').val() || null);
      } else {
        reject(error);
      }
    })
  });
}

module.exports = {getEstudiantes, setEstudiante, getTodosEstudiantes, getEstudianteBdd};
