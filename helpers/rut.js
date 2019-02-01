'use strict';

exports.limpiar = function(rut) {
  return typeof rut === 'string' ? rut.replace(/^0+|[^0-9kK]+/g, '').toUpperCase() : null;
}

function validar(rut) {
  var valor = limpiar(rut);

  cuerpo = valor.slice(0,-1);
  dv = valor.slice(-1).toUpperCase();

  rut.value = cuerpo + '-'+ dv

  if (cuerpo.length < 7) {
    return false;
  }

  suma = 0;
  multiplo = 2;

  for (i=1; i <= cuerpo.length; i++) {
    index = multiplo * valor.charAt(cuerpo.length - i);
    suma = suma + index;
    if (multiplo < 7) {
      multiplo = multiplo + 1;
    } else {
      multiplo = 2;
    }
  }

  dvEsperado = 11 - (suma % 11);

  dv = (dv == 'K') ? 10 : dv;
  dv = (dv == 0) ? 11 : dv;

  if (dvEsperado != dv) {
    return false;
  }
  return true;
}

exports.calcularDv = function (rut) {
		var suma = 0;
		var mul = 2;
		if(typeof(rut) !== 'number') {return;}
		rut = rut.toString();
		for (var i = rut.length -1; i >= 0; i--) {
			suma = suma + rut.charAt(i) * mul;
			mul = ( mul + 1 ) % 8 || 2;
		}
		switch (suma % 11) {
			case 1:
        return 'k';
			case 0:
        return 0;
			default:
        return 11 - (suma % 11);
		}
	}


function formatear(rut) {
  var result = rut.slice(-4, -1) + '-' + rut.substr(rut.length - 1)
  for (var i = 4; i < rut.length; i += 3) {
    result = rut.slice(-3 - i, -i) + '.' + result
  }

  return result
}
