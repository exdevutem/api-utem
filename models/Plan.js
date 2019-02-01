var mongoose = require('mongoose');

var PlanSchema = new mongoose.Schema({
  _id: Number,
  nombre: Number,
  malla: [{
    nivel: Number,
    asignaturas: [
      type: Number,
      ref: 'Asignatura'
    }]
  ],
  creado: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Plan', PlanSchema);
module.exports = mongoose.model('Plan');
