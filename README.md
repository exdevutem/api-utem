# API RESTful de la Universidad Tecnológica Metropolitana

Este proyecto nació inspirado en el trabajo de [@srochar](https://github.com/srochar/ApiDirdoc) que quedo abandonado ya hace mucho tiempo. La idea es retomarlo y actualizarlo con la nueva plataforma [Academia.UTEM](https://academia.utem.cl) siguiendo la misma filosofía, simular consultas a la plataforma **como estudiante** y obtener la información con web scrapping para entregarle una respuesta al usuario en formato JSON.

## Funciones

### Estudiantes

| Token | Endpoint                       | Descripción                                              |
| :-: | -------------------------------- | -------------------------------------------------------- |
| ❎  | `GET estudiantes/`               | Devuelve los datos básicos de todos los estudiantes      |
| ✳️  | `GET estudiantes/{rut}/`         | Devuelve los datos básicos o personales de un estudiante |
| ✅  | `PUT estudiantes/{rut}/`         | Modifica los datos personales del estudiante             |
| ✅  | `GET estudiantes/{rut}/titulos`  | Devuelve los títulos del estudiante                      |
| ✅  | `GET estudiantes/{rut}/horarios` | Devuelve los horarios del estudiante                     |

### Docentes

| Token | Endpoint      | Descripción                                                      |
| :-: | --------------- | ---------------------------------------------------------------- |
| ✅  | `GET docentes/` | Devuelve la información básica de todos los docentes registrados |

### Carreras

| Token | Endpoint                                    | Descripción                                                  |
| :-: | --------------------------------------------- | ------------------------------------------------------------ |
| ❎  | `GET carreras/`                               | Devuelve la información básica de todas las carreras         |
| ❎  | `GET carreras/{id}`                           | Devuelve la información básica de una carreras               |
| ✅  | `GET estudiantes/{rut}/carreras/`             | Devuelve las carreras cursadas por el estudiante             |
| ✅  | `GET estudiantes/{rut}/carreras/{id}/`        | Devuelve una de las carreras cursadas                        |
| ✅  | `GET estudiantes/{rut}/carreras/{id}/malla`   | Devuelve la malla de una de las carreras cursadas            |
| ✅  | `GET estudiantes/{rut}/carreras/{id}/boletin` | Devuelve el boletín de notas de una de las carreras cursadas |

### Asignaturas

| Token | Endpoint                                        | Descripción                                                  |
| :-: | ------------------------------------------------- | ------------------------------------------------------------ |
| ❎  | `GET asignaturas/`                                | Devuelve la información básica de todas las asignaturas      |
| ❎  | `GET asignaturas/{id}`                            | Devuelve la información básica de una asignatura             |
| ✅  | `GET estudiantes/{rut}/asignaturas/`              | Devuelve las asignaturas cursadas por el estudiante          |
| ✅  | `GET estudiantes/{rut}/asignaturas/{id}/`         | Devuelve una de las asignaturas cursadas                     |
| ✅  | `GET estudiantes/{rut}/asignaturas/{id}/notas`    | Devuelve las notas de una de las asignaturas cursadas        |
| ✅  | `GET estudiantes/{rut}/asignaturas/{id}/bitacora` | Devuelve la bitácora de clases de una de las asignaturas cursadas |

## Documentación

Puedes revisar la documentación acá: https://mapacheverdugo.github.io/api-utem

## Aclaraciones

* Este es un proyecto **no oficial** y no está respaldado por ningún funcionario de la Universidad Tecnológica Metropolitana de Chile.
* Protegido bajo la [licencia MPL 2.0](https://github.com/mapacheverdugo/api-dirdoc-utem/blob/master/LICENSE "Licencia MPL 2.0").
* Por ningún motivo se pretende suplantar a las plataformas institucionales, las cuales deben ser consideradas como el único medio oficial para la interacción con la universidad.
* El creador y los colaboradores de este repositorio **no se hacen resposables** de los problemas que, directa o indirectamente, pueda generar el uso correcto o indebido de esta aplicación.

## Contribuciones ❤️

Aún no hay ningún colaborador 💔. Sin embargo, la invitación está abierta a cualquiera que desee aportar ideas abriendo un *issue* o con un maravilloso `pull request`.
