var mongoose = require('mongoose');

var CarreraSchema = new mongoose.Schema({
  _id: Number,
  codigo: {
    type: Number,
    required: true
  },
  nombre: String,
  planes: [{
    type: Number,
    ref: 'Planes'
  }],
  creado: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Carrera', CarreraSchema);
module.exports = mongoose.model('Carrera');
