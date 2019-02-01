'use strict';

var express = require('express');
var errors = require('../middlewares/errors');

var request = require('request');

const {ACADEMIA_URL, OPCIONES_GENERALES} = require('../helpers/constants');

var router = express.Router();

router.use('/token', require('./token'));
router.use('/validacion', require('./validacion'));
router.use('/estudiantes', require('./estudiantes/estudiantes'));
router.use('/sesaes', require('./sesaes'));
router.use('/docentes', require('./docentes'));

router.all('/', function(req, res) {
  res.status(200).send({
    nombre: 'API UTEM',
    version: '0.1.0',
    repositorio: 'https://github.com/mapacheverdugo/api-utem',
    descripcion: 'API REST no oficial que unifica todas las plataformas de la Universidad Tecnológica Metropolitana de Chile',
    autor: {
      nombre: 'Jorge Verdugo Chacon',
      correo: 'jorgeverdugoch@gmail.com',
      github: 'https://github.com/mapacheverdugo',
    },
  })
});

router.all('/test/:url', function(req, res) {
  let opciones = {
    url: 'https://' + req.params.url,
    followAllRedirects: true,
    ...OPCIONES_GENERALES
  }

  request(opciones, async function(error, response, html) {
    if (!error && response.statusCode == 200) {
      console.log(error, response, html);
      res.send(html)
    } else {
      console.log("Error", error, response, html);
      res.json(error)
    }
  });
});

router.all('/carreras', function(req, res) {
  res.status(200).send({
    mensaje: 'Muestra todas las carreras'
  });
});

router.all('/edificios', function(req, res) {
  res.status(200).send({
    mensaje: 'Muestra todos los edificios'
  });
});

module.exports = router;
