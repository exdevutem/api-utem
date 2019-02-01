'use strict';

var express = require('express');
var errors = require('../middlewares/errors');
var autenticador = require('../controllers/token');
var logger = require('../middlewares/logger');

var router = express.Router();

router.post('/', function(req, res, next) {

});

router.post('/dirdoc', function(req, res, next) {

});

router.post('/pasaporte', function(req, res, next) {

});

module.exports = router;
