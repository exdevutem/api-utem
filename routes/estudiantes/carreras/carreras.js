'use strict';

var express = require('express');

var router = express.Router({mergeParams: true});

var token = require('../../../controllers/token');
var carreras = require('../../../controllers/carreras');
var errors = require('../../../middlewares/errors')

router.get('/', async function(req, res, next) {
  try {
    var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
    var json = await carreras.getCarreras(autenticacion, null);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/:idCarrera', async function(req, res, next) {
  try {
    var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
    var json = await carreras.getCarreras(autenticacion, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/:idCarrera/malla', async function(req, res, next) {
  try {
    var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
    var json = await carreras.getMalla(autenticacion, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/:idCarrera/boletin', async function(req, res, next) {
  try {
    var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
    var json = await carreras.getBoletin(autenticacion, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
