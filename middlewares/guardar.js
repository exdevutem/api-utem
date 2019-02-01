'use strict';

var mongoose = require('mongoose');

var Estudiantes = require('../controllers/estudiantes');
var Carreras = require('../controllers/carreras');
var Asignaturas = require('../controllers/asignaturas');

var Estudiante = require('../models/Estudiante');
var Asignatura = require('../models/Asignatura');
var Carrera = require('../models/Carrera');
var Docente = require('../models/Docente');

exports.estudiante = async function(autenticacion) {
  var estudiante = await Estudiantes.getEstudiantes(autenticacion);
  var carreras = await Carreras.getCarreras(autenticacion);
  var apeIds = [];

  var nuevo = new Estudiante({
    _id: estudiante._id,
    rut: estudiante.rut,
    nombre: estudiante.nombre,
    correo: estudiante.correoUtem,
    apeIds: apeIds,
    asignaturaIds: [2577974, 2577971, 2577973, 2577972, 2577975, 2577976, 2613816]
  });

  nuevo.save().catch(err => {
    console.log("Ocurrió un error al guardar en la base de datos:", err);
  });
}

exports.carreras = async function(autenticacion) {
  var carreras = await Carreras.getCarreras(autenticacion, null);

  carreras.forEach(function(carrera) {
    var nuevo = new Estudiante({
      _id: carrera.carrera._id,
      codigo: carrera.carrera.codigo,
      nombre: carrera.carrera.nombre,
      plan: carrera.plan,
      asignaturas: [{
        nivel: Number,
        nombre: String,
        tipo: String,
      }]
    });

    nuevo.save().catch(err => {
      console.log("Ocurrió un error al guardar en la base de datos:", err);
    });
  })
}

exports.asignaturas = async function(autenticacion) {
  var asignaturas = await Asignaturas.getAsignaturas(autenticacion, null);
  var apeIds = [];

  var nuevo = new Estudiante({
    _id: estudiante._id,
    rut: estudiante.rut,
    nombre: estudiante.nombre,
    correo: estudiante.correoUtem,
    apeIds: null,
    asignaturaIds: null
  });

  nuevo.save().catch(err => {
    console.log("Ocurrió un error al guardar en la base de datos:", err);
  });
}

exports.docentes = async function(autenticacion) {
  var estudiante = await Estudiantes.getEstudiantes(autenticacion);
  var carreras = await Carreras.getCarreras(autenticacion);
  var apeIds = [];

  var nuevo = new Estudiante({
    _id: estudiante._id,
    rut: estudiante.rut,
    nombre: estudiante.nombre,
    correo: estudiante.correoUtem,
    apeIds: null,
    asignaturaIds: null
  });

  nuevo.save().catch(err => {
    console.log("Ocurrió un error al guardar en la base de datos:", err);
  });
}
