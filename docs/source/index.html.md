---
title: API Universidad Tecnológica Metropolitana

language_tabs: # must be one of https://git.io/vQNgJ
  - shell: cURL
  - ruby: Ruby
  - python: Python
  - javascript: Javascript

toc_footers:
  - Documentación hecha con <a href='https://github.com/lord/slate'>Slate</a> ❤️

includes:
  - errors

search: false
---

# Introducción

Bienvenido a la API no oficial de la Universidad Tecnológica Metropolitana de Chile. Puedes usar este servicio para obtener la información disponible en los distintos portales institucionales.

Te recordamos que este proyecto de código abierto, y no está respaldado por la institución educacional. Sientete libre de aportar con ideas y código en el [repositorio de GitHub](https://github.com/mapacheverdugo/api-utem).

# Autorización

## Obtener token

> Lo que debería retornar una respuesta como esta:

```json
{
    "rut": 19876543,
    "correoUtem": "nombre.apellidos@utem.cl",
    "token": "a2V5IjoiNmZkSGxTdEdDdjhHMGNrYmE4bTl2Y"
}
```

Mucha de las funciones que encontrarás están restringidas únicamente a usuarios autenticados con su Pasaporte.UTEM, por esto necesitas que obtenir un token que te permita acceder a la información del usuario

### Petición HTTP

`POST https://api-utem.herokuapp.com/autenticacion`

### Parámetros

Parámetro       | Tipo     | Descripción
--------------- | -------- | -----------
**correo**      | `string` | *(Obligatorio)* Correo institucional del usuario.
**contrasenia** | `string` | *(Obligatorio)* Contraseña del correo y Pasaporte.UTEM.


## Refrescar token

## Validar

## Revocar acceso

# Estudiantes

## Obtener perfil

> Lo que debería retornar una respuesta como esta:

```json
{
    "_id": 64728,
    "rut": 19649846,
    "nombre": "Jorge Andres Verdugo Chacón",
    "tipo": "Alumno",
    "correoUtem": "jorge.verdugoc@utem.cl",
    "correoPersonal": "jorgeverdugoch@gmail.com",
    "fotoUrl": "https://sgu.utem.cl/pgai/perfil_foto.php?rut=19649846&sexo=0&t_usu=1",
    "edad": 20,
    "puntajePsu": null,
    "telefonoMovil": 987654321,
    "telefonoFijo": 228765432,
    "sexo": {
        "_id": 1,
        "sexo": "Masculino"
    },
    "nacionalidad": {
        "_id": 1,
        "nacionalidad": "Chilena"
    },
    "comuna": {
        "_id": 316,
        "comuna": "Maipu"
    },
    "direccion": "Jorge Montt 1555",
    "anioIngreso": 2016,
    "ultimaMatricula": 2018,
    "carrerasCursadas": 1,
    "carreras": "/estudiantes/19649846/carreras"
}
```

## Modificar perfil

# Carreras

## Obtener carreras

> Lo que debería retornar una respuesta como esta:

```json
[
    {
        "_id": 53654,
        "carrera": {
            "_id": 30,
            "codigo": "21041",
            "nombre": "Ingeniería Civil En Computación Menc. Informática"
        },
        "plan": {
            "_id": 112,
            "nombre": "5"
        },
        "estado": "Regular",
        "semestreInicio": {
            "_id": 137,
            "semestre": 1,
            "anio": 2016
        },
        "semestreTermino": {
            "_id": null,
            "semestre": null,
            "anio": null
        },
        "malla": "/estudiantes/19841526/carreras/53654/malla",
        "boletin": "/estudiantes/19841526/carreras/53654/boletin"
    },
    ...
]
```

## Malla curricular

> Lo que debería retornar una respuesta como esta:

```json
{
    "nivelActual": 3,
    "asignaturasTotal": 61,
    "asignaturasAprobadas": 23,
    "asignaturasReprobadas": 0,
    "porcentajeCompletado": 37.704918032786885,
    "porcentajeAvance": null,
    "malla": [
        {
            "nivel": 1,
            "asignaturas": [
                {
                    "codigo": "QUIC8010",
                    "nombre": "Quimica General",
                    "tipo": "Obligatorio",
                    "oportunidades": 1,
                    "estado": "Aprobado",
                    "nota": 4.6
                },
                ...
            ]
        },
        ...
    ]
}
```

## Boletín de notas

# SESAES

## Especialistas

## Especialidades

## Horarios

## Obtener horas reservadas

## Reservar hora

## Anular reserva

# Kittens

## Get All Kittens

```ruby
require 'kittn'

api = Kittn::APIClient.authorize!('meowmeowmeow')
api.kittens.get
```

```python
import kittn

api = kittn.authorize('meowmeowmeow')
api.kittens.get()
```

```shell
curl "http://example.com/api/kittens"
  -H "Authorization: meowmeowmeow"
```

```javascript
const kittn = require('kittn');

let api = kittn.authorize('meowmeowmeow');
let kittens = api.kittens.get();
```

> The above command returns JSON structured like this:

```json
[
  {
    "id": 1,
    "name": "Fluffums",
    "breed": "calico",
    "fluffiness": 6,
    "cuteness": 7
  },
  {
    "id": 2,
    "name": "Max",
    "breed": "unknown",
    "fluffiness": 5,
    "cuteness": 10
  }
]
```

This endpoint retrieves all kittens.

### HTTP Request

`GET http://example.com/api/kittens`

### Query Parameters

Parameter | Default | Description
--------- | ------- | -----------
include_cats | false | If set to true, the result will also include cats.
available | true | If set to false, the result will include kittens that have already been adopted.

<aside class="success">
Remember — a happy kitten is an authenticated kitten!
</aside>

## Get a Specific Kitten

```ruby
require 'kittn'

api = Kittn::APIClient.authorize!('meowmeowmeow')
api.kittens.get(2)
```

```python
import kittn

api = kittn.authorize('meowmeowmeow')
api.kittens.get(2)
```

```shell
curl "http://example.com/api/kittens/2"
  -H "Authorization: meowmeowmeow"
```

```javascript
const kittn = require('kittn');

let api = kittn.authorize('meowmeowmeow');
let max = api.kittens.get(2);
```

> The above command returns JSON structured like this:

```json
{
  "id": 2,
  "name": "Max",
  "breed": "unknown",
  "fluffiness": 5,
  "cuteness": 10
}
```

This endpoint retrieves a specific kitten.

<aside class="warning">Inside HTML code blocks like this one, you can't use Markdown, so use <code>&lt;code&gt;</code> blocks to denote code.</aside>

### HTTP Request

`GET http://example.com/kittens/<ID>`

### URL Parameters

Parameter | Description
--------- | -----------
ID | The ID of the kitten to retrieve

## Delete a Specific Kitten

```ruby
require 'kittn'

api = Kittn::APIClient.authorize!('meowmeowmeow')
api.kittens.delete(2)
```

```python
import kittn

api = kittn.authorize('meowmeowmeow')
api.kittens.delete(2)
```

```shell
curl "http://example.com/api/kittens/2"
  -X DELETE
  -H "Authorization: meowmeowmeow"
```

```javascript
const kittn = require('kittn');

let api = kittn.authorize('meowmeowmeow');
let max = api.kittens.delete(2);
```

> The above command returns JSON structured like this:

```json
{
  "id": 2,
  "deleted" : ":("
}
```

This endpoint deletes a specific kitten.

### HTTP Request

`DELETE http://example.com/kittens/<ID>`

### URL Parameters

Parameter | Description
--------- | -----------
ID | The ID of the kitten to delete
