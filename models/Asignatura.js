var mongoose = require('mongoose');

var AsignaturaSchema = new mongoose.Schema({
  _id: Number,
  codigo: {
    type: String,
    required: true
  },
  nombre: String,
  tipo: String,
  secciones: [{
    type: Number,
    ref: 'Seccion'
  }],
  creado: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Asignatura', AsignaturaSchema);
module.exports = mongoose.model('Asignatura');
