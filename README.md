# Seguridad de Sistemas Digitales – Laboratorios

Laboratorios e investigaciones del curso **BCD 9220 – Seguridad de Sistemas Digitales**, del Bachillerato en Ingeniería en Ciencia de Datos de la Universidad LEAD (Costa Rica).

Cada carpeta es independiente y tiene su propio README con el contexto, la metodología, la evidencia y las referencias.

## Laboratorios prácticos

| Laboratorio | Tema | Herramientas |
|---|---|---|
| [lab-nikto-escaneo-web](./lab-nikto-escaneo-web) | Reconocimiento activo de un servidor web y su superficie de ataque | Nikto, Kali Linux, Docker |
| [lab-wannacry-radare2](./lab-wannacry-radare2) | Ingeniería inversa estática del instalador de WannaCry e indicadores de compromiso | radare2, objdump, Kali Linux, Docker |
| [lab-honeypot-cowrie](./lab-honeypot-cowrie) | Honeypot SSH: captura de credenciales y comandos de un atacante | Cowrie, Docker |
| [lab-xss-sanitizacion-react](./lab-xss-sanitizacion-react) | Prevención de XSS: sanitización de HTML con lista blanca y validación de entradas | React, Vite, DOMPurify |

## Investigaciones aplicadas

| Investigación | Tema |
|---|---|
| [investigacion-dbsc](./investigacion-dbsc) | Device Bound Session Credentials (DBSC) y la protección contra el robo de cookies de sesión |
| [investigacion-control-acceso-fintech](./investigacion-control-acceso-fintech) | Diseño de control de acceso ABAC + NAC para una fintech 100 % remota |

## Nota sobre seguridad

Este repositorio **no contiene muestras de malware ni binarios**. Los análisis de malware se hicieron en contenedores aislados y aquí solo se documentan la metodología, los hallazgos y los indicadores de compromiso como texto.

## Autor

**Jason Barrantes Sánchez**
- GitHub: [@sklinderton](https://github.com/sklinderton)
- LinkedIn: [jbarrantes-data](https://www.linkedin.com/in/jbarrantes-data)

Los laboratorios fueron trabajos grupales del curso; cada README indica el contexto del trabajo.
