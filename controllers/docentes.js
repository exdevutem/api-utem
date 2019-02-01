'use strict';

var request = require('request');
var cheerio = require('cheerio');

var errors = require('../middlewares/errors');
var asignaturas = require('./asignaturas');
var estudiantes = require('./estudiantes');

var Calificacion = require('../models/Calificacion');
var Docente = require('../models/Docente');

const {ACADEMIA_URL, OPCIONES_GENERALES} = require('../helpers/constants');

var getNombreSeparado = function(sesion, seccionId, alumnoSeccionId) {
  return new Promise(function(resolve, reject) {
    var opciones = {
      url: 'https://academia.utem.cl/libro_de_clases/bitacora_de_clases/ver_bitacora_de_clase',
      method: 'POST',
      form: {
        "hdn_seccion_id": seccionId,
        "hdn_alumno_seccion_id": alumnoSeccionId
      },
      followAllRedirects: true,
      jar: sesion,
      ...OPCIONES_GENERALES
    };

    request(opciones, async function(error, response, html) {
      if (response.statusCode == 500 || (!error && response.statusCode == 200)) {
        var $ = cheerio.load(html);
        const profesor = $('#content table tbody tr ul li spam').eq(0).clone().children().remove().end().text().trim();
        if (profesor) {
          var docente = {
            nombres: profesor.split(", ")[1].replace(" .", "").toTitleCase(),
            apellidos: profesor.split(", ")[0].replace(" .", "").toTitleCase()
          }
          resolve(docente);
        } else {
          reject(new errors(500, 'No se pudo cargar la plataforma'));
        }
        
      } else {
        reject(new errors(500, 'No se pudo cargar la plataforma'));
      }
    });
  });
}

var getDocentes = (autenticacion, parametros) => {

}

var getDocenteBdd = (rutQ) => {
  return new Promise((resolve, reject) => {
    Docente.findOne({rut: rutQ}, (err, docente) => {
      if (err) {
        reject(new errors(500, 'Ocurrió un error en la base de datos.', err));
      } else if (!docente || docente.length == 0) {
        var mensaje = 'No hay docentes registrados';
        reject(new errors(404, mensaje + ' con el RUT ' + rutQ));
      } else {
        resolve(docente);
      }
    });
  });
}

var getCalificacionesBdd = (query) => {
  return new Promise((resolve, reject) => {
    Calificacion.find(query, (err, calificaciones) => {
      if (err || !calificaciones) {
        reject(new errors(500, 'Ocurrió un error en la base de datos.', err));
      } else {
        resolve(calificaciones);
      }
    });
  });
}

var getCalificaciones = (autenticacion, parametros) => {
  return new Promise((resolve, reject) => {
    Calificacion.find({docente: parametros.rut}, (err, calificaciones) => {
      if (calificaciones && calificaciones != null) {
        var estudiante;
        var calificacionesPromises = calificaciones.map(async (calificacion) => {
          
          return new Promise(async function(resolve, reject) {
            try {
              estudiante = await estudiantes.getEstudianteBdd(calificacion.estudiante);
            } catch (err) {
              estudiante = null;
            }
            
            if (!calificacion.anonima) {
              resolve({
                id: calificacion.id,
                estudiante: {
                  nombre: estudiante.nombre.toObject(),
                  rut: calificacion.estudiante,
                  fotoUrl: 'https://sgu.utem.cl/pgai/perfil_foto.php?rut=' + calificacion.estudiante + '&sexo=1&t_usu=1'
                },
                calificacion: calificacion.valor,
                fecha: calificacion.creado,
                asignatura: calificacion.asignatura,
                periodo: calificacion.periodo,
                comentario: calificacion.comentario
              });
            } else {
              resolve(null)
            }
          });
        });

        Promise.all(calificacionesPromises).then(async (resultados) => {
          const docente = await getDocenteBdd(parametros.rut);
          var comentarios = resultados.filter((actual) => { return actual != undefined && actual.estudiante.rut != autenticacion.rut });
          var actual = resultados.filter((actual) => { return actual.estudiante.rut == autenticacion.rut });
          
          var anonimas = 0;
          var totales = 0;
          var suma = 0;
          calificaciones.forEach(calificacion => {
            suma += calificacion.valor;
            totales++;
            if (calificacion.anonima) {
              anonimas++
            }
          });
          resolve({
            docente: {
              _id: docente._id,
              nombre: docente.nombre,
              rut: docente.rut,
              fotoUrl: 'https://sgu.utem.cl/pgai/perfil_foto.php?rut=' + docente.rut + '&sexo=1&t_usu=2'
            },
            calificaciones: {
              totales: totales,
              anonimas: anonimas,
              promedio: suma / totales,
              tusCalificaciones: actual,
              comentarios: comentarios
            }
          })
        }).catch(err => {
          reject(err);
        });
        
      } else {
        resolve({
          mensaje: "No hay calificaciones para ese docente"
        })
      }
    }).catch(function(err) {
      reject(err);
    });
  });
}

var calificar = (autenticacion, params, body) => {
  return new Promise(async (resolve, reject) => {
    try {
      const asignaturasArray = await asignaturas.getAsignaturasBitacora(autenticacion, {rutEstudiante: autenticacion.rut, id: body.asignatura});
      
      if (asignaturasArray && asignaturasArray.length > 0) {
        const asignaturaBitacora = await asignaturas.getBitacora(autenticacion, {rutEstudiante: autenticacion.rut, id: body.asignatura});
        var estaDocente = false;
        asignaturaBitacora.forEach(seccion => {
          if (seccion.docente.rut == params.rut) {
            estaDocente = true;
          }
        });
        if (estaDocente) {
          const periodo = asignaturasArray[0].periodo._id;
          var query = {
            docente: params.rut,
            estudiante: autenticacion.rut,
            asignatura: body.asignatura,
            periodo: periodo
          }

          const calificacionesHechas = await getCalificacionesBdd(query);

          if (calificacionesHechas.length > 0) {
            reject("Ya calificó a este docente")
          } else {
            const anonimo = body.anonimo && body.anonimo == 'true';
            var calificacion = new Calificacion({
              docente: params.rut,
              estudiante: autenticacion.rut,
              asignatura: body.asignatura,
              anonima: anonimo,
              valor: body.valor,
              comentario: !anonimo && body.comentario ? body.comentario : null,
              periodo: periodo
            });
        
            calificacion.save((err) => {
              if (err) reject(err);
              resolve(calificacion)
            });
          }
          
        } else {
          reject("Este alumno no tiene clases de esa asignatura con este docente")
        }
      } else {
        reject("No se pudo guardar la calificación")
      }
    } catch (err) {
      reject(err)
      
    }
  });
}

module.exports = {getCalificaciones, calificar};
