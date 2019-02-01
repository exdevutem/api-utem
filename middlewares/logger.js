'use strict';

var request = require('request');
var cheerio = require('cheerio');

var errors = require('./errors');
var rut = require('../helpers/rut');

request = request.defaults({jar: true})

const {ACADEMIA_URL, OPCIONES_GENERALES} = require('../helpers/constants');

/*
function dirdoc(params) {
  return new Promise(function(resolve, reject) {
    var opciones = {
      url: 'https://dirdoc.utem.cl/valida.php',
      method: 'POST',
      jar: request.jar(),
      timeout: 5000,
      followAllRedirects: true,
      form: {
        'tipo': 0,
        'rut': params.rut,
        'password': params.contrasenia_dirdoc
      }
    }

    request(opciones, function(error, response, html) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(html);
        var mensaje = $('body b').text();
        if (mensaje == 'Bienvenido') {
          resolve(opciones.jar);
        } else {
          reject(new errors(502, 'No se pudo iniciar sesión por:', mensaje));
        }
      } else {
        reject(new errors(502, 'No se pudo iniciar sesión en Academia UTEM'));
      }
    });
  });
}

function miUtem(params) {
  return new Promise(function(resolve, reject) {
    var opciones = {
      url: 'https://mi.utem.cl/login',
      method: 'POST',
      form: {
        'rut_alumno': rut,
        'contrasena': contraseniaDirdoc,
        'recordar_password': 0
      },
      jar: request.jar()
    }

    request(opciones, function(error, response, html) {

      opciones = {
        url: 'https://mi.utem.cl/',
        method: 'GET',
        jar: opciones.jar
      }
      resolve(opciones.jar);
    });
  });
}
*/

function academia(params) {
  return new Promise(function(resolve, reject) {
    var opciones;
    
    if (params.sesion) {
      const cookie = request.cookie('PHPSESSID=' + params.sesion);
      var sesionAcademia = request.jar();
      sesionAcademia.setCookie(cookie, ACADEMIA_URL);
      opciones = {
        url: ACADEMIA_URL,
        method: 'GET',
        followAllRedirects: true,
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      }
    } else if (params.correo && params.contrasenia) {
      var id = makeId(334);
      opciones = {
        url: ACADEMIA_URL + 'login',
        method: 'POST',
        followAllRedirects: true,
        jar: request.jar(),
        form: {
          'txt_usuario': params.correo,
          'txt_password': params.contrasenia,
          'g-recaptcha-response': id
        },
        ...OPCIONES_GENERALES
      }
      //console.log(id);
    } else {
      reject(new errors(400, 'Debe ingresar los parámetros requeridos', 201));
    }

    request(opciones, async function(error, response, html) {
      if (!error && response.statusCode == 200) {
        console.log(html);
        
        var $ = cheerio.load(html);
        try {
          var tipos = await getTipos(opciones.jar);
          if ($('#content .content-header h1 small').text().trim() === "Bienvenido al portal" || $('#modal-bloquear-menu h4.modal-title').text().trim() == "Encuestas obligatorias") {
            if (tipos.includes("Alumno")) {
              resolve({
                rut: await getRut(opciones.jar),
                sesion: opciones.jar.getCookies("https://academia.utem.cl")[0].value
              });
            } else {
              reject(new errors(403, 'El usuario no es estudiante', ));
            }
          } else if ($('#msgLogin .log_msgLogin') != null) {
            var mensaje = $('.login .login-content form .alert').text().trim();
            reject(new errors(401, 'Usuario o contraseña incorrecta', 203));
          } else {
            reject(new errors(500, 'Un error inesperado ha ocurrido', 200));
          }
          
        } catch (e) {
           reject(e);
        }
      } else {
        console.log(error, response, html);
        
        var $ = cheerio.load(html);
        if ($('#header .container-fluid .navbar-nav .dropdown-menu li a[href="/salir"]').text().trim() === "Salir") {
          resolve({
            rut: await getRut(opciones.jar),
            sesion: opciones.jar
          });
        } else {
          reject(new errors(502, 'No se pudo cargar la plataforma Academia UTEM', 202));
        }
      }
    });
  });
}

/*
function pasaporte(params) {
  return new Promise(function(resolve, reject) {
    request('https://pasaporte.utem.cl/', function(error, response, html) {
      var $ = cheerio.load(html);
      var token = $('input[name="csrf_token"]').val();

      var opciones = {
        url: 'https://pasaporte.utem.cl/login',
        method: 'POST',
        header: response.headers,
        timeout: 5000,
        form: {
          'email': params.correo,
          'password': params.contrasenia_pasaporte,
          'csrf_token': token
        }
      }

      request(opciones, function(error, response, html) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(html);
          var mensajeError = $('.login_content .alert-danger').clone().children().remove().end().text().trim();
          console.log(mensajeError);

          if (mensajeError == null) {
            reject(new errors(400, response.headers));
          } else if (mensajeError == "Usuario o contraseña inválido") {
            reject(new errors(401, 'Usuario o contraseña incorrecta', $('.login .login-content form .alert').text().trim()));
          } else if (mensajeError == "Su sesión ha expirado. Favor ingresar nuevamente") {
            reject(new errors(401, 'Usuario o contraseña incorrecta', $('.login .login-content form .alert').text().trim()));
          } else if (mensajeError == "Debe rellenar los campos.") {
            reject(new errors(401, 'Usuario o contraseña incorrecta', $('.login .login-content form .alert').text().trim()));
          } else {
            reject(new errors(500, 'Un error inesperado ha ocurrido'))
          }
        } else {
          reject(new errors(502, 'No se pudo cargar la plataforma Pasaporte UTEM'));
        }
      });
    });
  });
}
*/

function getRut(sesion) {
  return new Promise(async function(resolve, reject) {
    try {
      var opciones = {
        url: 'https://academia.utem.cl/usuario/perfil/editar',
        method: 'GET',
        jar: sesion,
        ...OPCIONES_GENERALES
      };

      request(opciones, async function(error, response, html) {
        var $ = cheerio.load(html);
        var rutEstudiante = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(1) td:nth-of-type(2)').eq(0).text();
        resolve(parseInt(rut.limpiar(rutEstudiante).slice(0, -1)));
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function validarDatos(parametros) {
  return new Promise(async function(resolve, reject) {
    var academiaRut;

    try {
      var sesionAcademia = await academia(parametros);

      var opciones = {
        url: 'https://academia.utem.cl/usuario/perfil/editar',
        method: 'GET',
        jar: sesionAcademia,
        ...OPCIONES_GENERALES
      };

      request(opciones, async function(error, response, html) {
        var $ = cheerio.load(html);
        var rutEstudiante = $('#content .profile-section .profile-right .profile-info table tbody tr:nth-of-type(1) td:nth-of-type(2)').eq(0).text();
        resolve(parseInt(rut.limpiar(rutEstudiante).slice(0, -1)));
      });
    } catch (e) {
      reject(e);
    }
  });
}


function getTipos(sesion) {
  return new Promise(function(resolve, reject) {
    var opciones = {
      url: 'https://academia.utem.cl/usuario/perfil/editar',
      jar: sesion,
      ...OPCIONES_GENERALES
    }
    request(opciones, function(error, response, html) {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);
        
        var tipos = [];
          $('#content .profile-section .profile-right .profile-info table thead tr th:nth-of-type(2) h4 small').each(function() {
            tipos.push($(this).text().trim().toTitleCase());
          });
          resolve(tipos);
        
      } else {
        if ($('.login .login-content form .alert') != null) {
          reject(new errors(401, 'Usuario o contraseña incorrecta', $('.login .login-content form .alert').text().trim()));
        }
      }
    });
  });
}

function makeId(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

module.exports = {academia, validarDatos}
