var mongoose = require('mongoose');

var PlanSchema = new mongoose.Schema({
  _id: Number,
  asignatura: {
    type: Number,
    ref: 'Asignatura'
  },
  docente: {
    type: Number,
    ref: 'Docente'
  },
  creado: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Plan', PlanSchema);
module.exports = mongoose.model('Plan');
