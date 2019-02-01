var mongoose = require('mongoose');

var EstudianteSchema = new mongoose.Schema({
  _id: Number,
  rut: {
    type: Number,
    required: true
  },
  nombre: {
    nombres: String,
    apellidos: String
  },
  correo: String,
  nacimiento: Date,
  carrera: [{
    type: Number,
    ref: 'Carrera'
  }],
  apes: [Number],
  asignaturas: [Number],
  creado: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Estudiante', EstudianteSchema);
module.exports = mongoose.model('Estudiante');
