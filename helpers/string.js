'use strict'

String.prototype.toTitleCase = function() {
  var primeraEnMayusculas = this.replace(/([^\W_]+[^\s-]*)*/g, function(str) {
    return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
  });
  var numerosRomanosEnMayusculas = primeraEnMayusculas.replace(/(\s+|^)[XIVCDMxivcdm]+(\s+|$)/g, function(str) {
	   return str.toUpperCase();
  });
  var guionSinEspacios = numerosRomanosEnMayusculas.replace(/\s*-+\s*/g, '-');
  var sinMultiplesEspacios = guionSinEspacios.replace(/\s\s+/g, ' ');
  return sinMultiplesEspacios;
};

String.prototype.toNameCase = function() {
  return this.toNameCase().replace(/([^\W_]+[^\s-]*) */g, function(txt){
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });


  string = string.replace(/\s*[:.,]\s*/g, '')
};

String.prototype.toSentenceCase = function() {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

String.prototype.equalsIgnoreCase = function(another) {
  return this.toUpperCase() === another.toUpperCase();
}

Number.prototype.toFixedNumber = function(x, base){
  var pow = Math.pow(base || 10, x);
  return + (Math.round(this*pow) / pow );
}
