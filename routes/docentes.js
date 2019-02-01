'use strict';

var express = require('express');

var router = express.Router({mergeParams: true});

var token = require('../controllers/token');
var docentes = require('../controllers/docentes');
var errors = require('../middlewares/errors');
var guardar = require('../middlewares/guardar');

router.get('/', async function(req, res, next) {
    try {
        var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
        var json = await docentes.getDocentes(autenticacion, null);
        res.status(200).json(json);
    } catch (e) {
        next(e);
    }
});

router.get('/:rut', async function(req, res, next) {
    try {
        var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
        var json = await docentes.getDocentes(autenticacion, req.params);
        res.status(200).json(json);
    } catch (e) {
        next(e);
    }
});

router.get('/:rut/calificaciones', async function(req, res, next) {
    try {
        var autenticacion = await token.desencriptar(req.headers.authorization, null, false);
        var json = await docentes.getCalificaciones(autenticacion, req.params);
        res.status(200).json(json);
    } catch (e) {
        next(e);
    }
  });

router.post('/:rut/calificaciones', async function(req, res, next) {
    if (req.body.valor && req.body.asignatura) {
        try {
            var autenticacion = await token.desencriptar(req.headers.authorization, null, false);
            var json = await docentes.calificar(autenticacion, req.params, req.body);
            res.status(200).json(json);
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

module.exports = router;
