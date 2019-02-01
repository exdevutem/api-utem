var mongoose = require('mongoose');

var DocenteSchema = new mongoose.Schema({
  _id: Number,
  rut: {
    type: Number,
    required: true
  },
  nombre: {
    completo: String,
    nombres: String,
    apellidos: String
  },
  correo: String,
  secciones: [{
    type: Number,
    ref: 'Seccion'
  }],
  creado: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Docente', DocenteSchema);
module.exports = mongoose.model('Docente');
