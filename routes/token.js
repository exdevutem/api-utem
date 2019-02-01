'use strict';

var express = require('express');
var errors = require('../middlewares/errors');
var autenticador = require('../controllers/token');
var guardar = require('../middlewares/guardar');

var router = express.Router();

router.post('/', async function(req, res, next) {
  if (req.body.correo && req.body.contrasenia) {
    try {
      var respuesta = await autenticador.generar(req.body);
      res.status(200).json(respuesta);
    } catch (e) {
      next(e);
    }
    
  } else {
    next(new errors(400, 'Debe ingresar todos los parametros requeridos'));
  }
});

router.get('/refresh', async function(req, res, next) {
  if (req.headers.authorization) {
    try {
      var respuesta = await autenticador.regenerar(req.headers.authorization);
      res.status(200).json(respuesta);
    } catch (e) {
      next(e);
    }
  } else {
    next(new errors(400, 'Debe ingresar una token'));
  }
});

router.get('/placebo', async function(req, res, next) {
  if (req.headers.authorization) {
    try {
      var respuesta = await autenticador.validar(req.headers.authorization);
      res.status(200).json(respuesta);
    } catch (e) {
      next(e);
    }
  } else {
    next(new errors(400, 'Debe ingresar una token'));
  }
});

module.exports = router;
