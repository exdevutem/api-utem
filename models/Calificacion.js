var mongoose = require('mongoose');

var CalificacionSchema = new mongoose.Schema({
  docente: {
    type: Number,
    required: true
  },
  estudiante: {
    type: Number,
    required: true
  },
  asignatura: {
    type: Number,
    required: true
  },
  anonima: {
    type: Boolean,
    required: true
  },
  valor: {
    type: Number,
    required: true
  },
  comentario: String,
  periodo: {
    type: Number,
    required: true
  },
  creado: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Calificacion', CalificacionSchema);
module.exports = mongoose.model('Calificacion');
