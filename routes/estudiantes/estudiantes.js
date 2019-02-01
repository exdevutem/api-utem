'use strict';

var express = require('express');

var router = express.Router({mergeParams: true});

var token = require('../../controllers/token');
var estudiantes = require('../../controllers/estudiantes');
var horarios = require('../../controllers/horarios');
var titulos = require('../../controllers/titulos');
var alimentacion = require('../../controllers/alimentacion');
var certificados = require('../../controllers/certificados');
var errors = require('../../middlewares/errors');
var guardar = require('../../middlewares/guardar');

router.get('/', async function(req, res) {
  var json = await estudiantes.getEstudiantes(null, null);
  res.status(200).json(json);
});

router.get('/:rutEstudiante', async function(req, res, next) {
  try {
    var json;
    if (req.headers.authorization) {
      var autenticacion = await token.desencriptar(req.headers.authorization, req.params, false);
      json = await estudiantes.getEstudiantes(autenticacion, req.params);
    } else {
      json = await estudiantes.getEstudiantes(null, req.params);
    }
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.put('/:rutEstudiante', async function(req, res, next) {
  if (req.body.nacimiento || req.body.movil || req.body.fijo || req.body.sexo || req.body.nacionalidad || req.body.comuna || req.body.direccion || req.body.correo) {
    try {
      var json;
      if (req.headers.authorization) {
        var autenticacion = await token.desencriptar(req.headers.authorization, req.params, false);
        json = await estudiantes.setEstudiante(autenticacion, req.body);
        res.status(200).json(json);
      }
      
    } catch (e) {
      next(e);
    }
  } else {
    next(new errors(404, "Debe ingresar datos para ser actualizados"));
  }

});

router.post('/', async function(req, res) {
  try {
    var parametros = await token.desencriptar(req);
    var json = await estudiantes.guardarEstudiantes(parametros);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

/*
router.get('/:rutEstudiante/certificados', async function(req, res, next) {
  try {
    if (req.headers['content-type'] == 'application/pdf') {
      pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
      pdfParser.on("pdfParser_dataReady", pdfData => {
        //var stat = fs.statSync('./routes/estudiantes/output.pdf');
        //res.setHeader('Content-Length', stat.size);
        //res.contentType('application/pdf');
        //res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
        var certificado;
        var datos = [];
        pdfData.formImage.Pages[0].Texts.forEach(function(e, i) {
          if (decodeURIComponent(e.R[0].T) === decodeURIComponent(e.R[0].T).toUpperCase() && e.R[0].TS[1] == 16) {
            datos.push(decodeURIComponent(e.R[0].T));
          }
        });
        certificado = {
          nombre: 0,
          rut: 0,
          estado: 0,
          carrera: 0,
          motivo: 0,
          codigo: datos[-1]
        }
        res.status(200).json(datos);
      });

      pdfParser.loadPDF('./routes/estudiantes/output.pdf');
    } else {
      next(new errors(400, 'Cabecera HTTP incorrecta'))
    }
  } catch (e) {
    next(e);
  }
});
*/

router.get('/:rutEstudiante/horarios', async function(req, res, next) {
  try {
    var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
    var json = await horarios.getHorarios(autenticacion);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/:rutEstudiante/titulos', async function(req, res, next) {
  try {
    var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
    var json = await titulos.getTitulos(autenticacion);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/:rutEstudiante/alimentacion', async function(req, res, next) {
  try {
    var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
    var json = await alimentacion.getAlimentacion(autenticacion);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.use('/:rutEstudiante/carreras', require('./carreras/carreras'));
router.use('/:rutEstudiante/asignaturas', require('./asignaturas/asignaturas'));

module.exports = router;
