'use strict';

require('./helpers/string');

var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var errors = require('./middlewares/errors')


var app = express();
var db = mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.use('/', require('./routes/index'));

app.use(function(req, res, next) {
  next(new errors(404, 'El directorio ' + req.originalUrl + ' no existe, o no se puede acceder con el método ' + req.method, 1));
});

app.use(function (err, req, res, next) {
  console.error('Error:', err);
  /*if (req.app.get('env') !== 'development') {
      delete err.stack;
  }*/

  res.status(err.codigoEstadoHttp || 500).send(err);
});

var port = process.env.PORT || 5000;

var server = app.listen(port, function() {
  console.log('API funcionando correctamente en el puerto ' + port);
});

module.exports = app;
