'use strict';

var express = require('express');

var router = express.Router({mergeParams: true});

var token = require('../../../controllers/token');
var asignaturas = require('../../../controllers/asignaturas');

router.get('/', async function(req, res, next) {
  try {
    var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
    var json = await asignaturas.getAsignaturasBitacora(autenticacion, null);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async function(req, res, next) {
  try {
    var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
    var json = await asignaturas.getAsignaturasBitacora(autenticacion, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/notas', async function(req, res, next) {
  try {
    var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
    var json = await asignaturas.getNotas(autenticacion, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/bitacora', async function(req, res, next) {
  try {
    var autenticacion = await token.desencriptar(req.headers.authorization, req.params, true);
    var json = await asignaturas.getBitacora(autenticacion, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
