'use strict';

exports.fechaADdMmAaaa = function(fecha) {
  var dd = fecha.getDate();
  var mm = fecha.getMonth() + 1;
  var yyyy = fecha.getFullYear();

  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10){
    mm = '0' + mm;
  }
  return dd + '-' + mm + '-' + yyyy;
}

exports.diasEntre = function(inicio, limite) {
  var fechas = [];
  for (var d = inicio; d <= limite; d.setDate(d.getDate() + 1)) {
    var textoFecha = fechaADdMmAaaa(new Date(d));
    fechas.push(textoFecha);
  }
  return fechas;
}


exports.sumarMeses = function(fecha, meses) {
  var fechaNueva = fecha;
  fechaNueva.setMonth(fechaNueva.getMonth() + meses);
  return fechaNueva;
}

exports.horasAPeriodo = function(horas) {
  var numeroPeriodo;
  var numeroBloque;
  var horasSin = horas.replace(/\s/g,'');
  switch (horasSin) {
    case "8:00-8:45":
      numeroPeriodo = 1;
      numeroBloque = 1;
      break;
    case "8:45-9:30":
      numeroPeriodo = 1;
      numeroBloque = 2;
      break;
    case "9:40-10:25":
      numeroPeriodo = 2;
      numeroBloque = 3;
      break;
    case "10:25-11:10":
      numeroPeriodo = 2;
      numeroBloque = 4;
      break;
    case "11:20-12:05":
      numeroPeriodo = 3;
      numeroBloque = 5;
      break;
    case "12:05-12:50":
      numeroPeriodo = 3;
      numeroBloque = 6;
      break;
    case "13:00-13:45":
      numeroPeriodo = 4;
      numeroBloque = 7;
      break;
    case "13:45-14:30":
      numeroPeriodo = 4;
      numeroBloque = 8;
      break;
    case "14:40-15:25":
      numeroPeriodo = 5;
      numeroBloque = 9;
      break;
    case "15:25-16:10":
      numeroPeriodo = 5;
      numeroBloque = 10;
      break;
    case "16:20-17:05":
      numeroPeriodo = 6;
      numeroBloque = 11;
      break;
    case "17:05-17:50":
      numeroPeriodo = 6;
      numeroBloque = 12;
      break;
    case "18:00-18:45":
      numeroPeriodo = 7;
      numeroBloque = 13;
      break;
    case "18:45-19:30":
      numeroPeriodo = 7;
      numeroBloque = 14;
      break;
    case "19:40-20:25":
      numeroPeriodo = 8;
      numeroBloque = 15;
      break;
    case "20:25-21:10":
      numeroPeriodo = 8;
      numeroBloque = 16;
      break;
    case "21:20-22:05":
      numeroPeriodo = 9;
      numeroBloque = 17;
      break;
    case "22:05-22:50":
      numeroPeriodo = 9;
      numeroBloque = 18;
      break;
    default:
      return null;
      break;
  }
  return ({
    numero: numeroPeriodo,
    bloque: {
      numero: numeroBloque,
      horaInicio: horas.split("-")[0].trim(),
      horaTermino: horas.split("-")[1].trim()
    }
  })
}

exports.mesTresLetras = function(letras) {
  switch (letras) {
    case 'ENE':
      return '01';
      break;
    case 'FEB':
      return '02';
      break;
    case 'MAR':
      return '03';
      break;
    case 'ABR':
      return '04';
      break;
    case 'MAY':
      return '05';
      break;
    case 'JUN':
      return '06';
      break;
    case 'JUL':
      return '07';
      break;
    case 'AGO':
      return '08';
      break;
    case 'SEP':
      return '09';
      break;
    case 'OCT':
      return '10';
      break;
    case 'NOV':
      return '11';
      break;
    case 'DIC':
      return '12';
      break;
    default:
      return '00';
  }
}

exports.horaAPeriodo = function(hora) {
  switch (hora) {
    case '08:00':
      return 1;
      break;
    case '09:40':
      return 2;
      break;
    case '11:20':
      return 3;
      break;
    case '13:00':
      return 4;
      break;
    case '14:40':
      return 5;
      break;
    case '16:20':
      return 6;
      break;
    case '18:00':
      return 7;
      break;
    case '19:40':
      return 8;
      break;
    case '21:20':
      return 9;
      break;
    default:
      return null;
  }
}
