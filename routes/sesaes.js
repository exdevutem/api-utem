'use strict';

var express = require('express');

var router = express.Router({mergeParams: true});

var autenticador = require('../controllers/token');
var sesaes = require('../controllers/sesaes');

router.get('/especialistas', async function(req, res, next) {
  try {
    var credenciales = await autenticador.desencriptar(req);
    var json = await sesaes.getEspecialistas(credenciales, null);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/especialistas/:rutEspecialista', async function(req, res, next) {
  try {
    var credenciales = await autenticador.desencriptar(req);
    var json = await sesaes.getEspecialistas(credenciales, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/especialistas/:rutEspecialista/horarios', async function(req, res, next) {
  try {
    var credenciales = await autenticador.desencriptar(req);
    var json = await sesaes.getHorarios(credenciales, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

/*
router.get('/especialidades', async function(req, res, next) {
  try {
    var parametros = await autenticador.desencriptar(req);
    var json = await asignaturas.mostrar(parametros, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/especialidades/:id', async function(req, res, next) {
  try {
    var parametros = await autenticador.desencriptar(req);
    var json = await asignaturas.mostrar(parametros, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});


router.get('/especialidades/:id/prestaciones', async function(req, res, next) {
  try {
    var parametros = await autenticador.desencriptar(req);
    var json = await asignaturas.mostrar(parametros, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});

router.get('/instalaciones/:id', async function(req, res, next) {
  try {
    var parametros = await autenticador.desencriptar(req);
    var json = await asignaturas.mostrar(parametros, req.params);
    res.status(200).json(json);
  } catch (e) {
    next(e);
  }
});
*/

module.exports = router;
