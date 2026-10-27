# Device Bound Session Credentials (DBSC)

Investigación sobre **DBSC**, el protocolo que vincula una sesión web a un dispositivo específico para que una cookie de sesión robada deje de servir.

## Contexto

- **Curso:** BCD 9220 – Seguridad de Sistemas Digitales (Universidad LEAD)
- **Pregunta del grupo:** ¿Qué es DBSC y cómo protege contra el robo de cookies?
- **Modalidad:** trabajo grupal (5 integrantes). **Mi sección:** qué es DBSC, quién lo desarrolló y para qué.
- **Entregable:** documento de 2-3 páginas y exposición de 5 minutos.

## El problema: robo de cookies

Después de iniciar sesión, el navegador guarda una cookie que demuestra que el usuario ya se autenticó. Si un malware *infostealer* copia esa cookie, el atacante puede usarla desde otro equipo y entrar a la cuenta sin contraseña ni MFA. Esto se conoce como secuestro de sesión.

## Qué es DBSC

DBSC es un protocolo impulsado por Google que agrega una API para que los servidores creen **sesiones autenticadas ligadas a un dispositivo**. Comenzó como un *origin trial* en Chrome en 2024, pasó por dos fases de prueba que se ajustaron con la retroalimentación de desarrolladores y avanza en el proceso de estandarización del W3C como borrador de trabajo (*Working Draft*).

## Cómo funciona

1. El dispositivo genera un **par de claves** (pública y privada).
2. La clave privada se guarda en **hardware seguro**: el TPM en Windows o el Secure Enclave en equipos Apple. Nunca sale del dispositivo.
3. El servidor registra la **clave pública** y la asocia con la sesión.
4. Periódicamente, el navegador **firma un desafío** con la clave privada para demostrar que sigue siendo el mismo dispositivo.

## Por qué una cookie robada se vuelve inútil

La cookie por sí sola ya no alcanza: el servidor exige la prueba criptográfica de posesión de la clave privada. Como esa clave está en el chip de seguridad y no se puede copiar junto con la cookie, el atacante no puede demostrar que está en el dispositivo legítimo y la sesión se rechaza. El robo remoto de cookies deja de ser rentable.

## Soporte actual

Según las fuentes oficiales consultadas (2026):

- **Chrome en Windows:** disponible, usando el TPM. Google anunció su incorporación en Chrome 145 y la disponibilidad general con Chrome 146.
- **Chrome en macOS:** anunciado para una versión posterior, usando Secure Enclave; no se encontró confirmación de disponibilidad general.
- **Linux, ChromeOS, Android, iOS, Edge, Firefox y Safari:** no se encontró confirmación oficial de disponibilidad general.

Además, la protección depende de tres partes a la vez: un **navegador compatible**, un **dispositivo con almacenamiento seguro de claves** y un **sitio web que implemente DBSC**.

## Limitaciones

| Limitación | Detalle |
|---|---|
| Malware activo en el equipo | DBSC impide usar la cookie desde *otro* dispositivo, pero un malware con privilegios que actúa en tiempo real dentro del equipo de la víctima puede hacer que el navegador firme peticiones sobre la sesión activa. |
| Dependencia de hardware | Requiere TPM 2.0 o Secure Enclave. Sin ellos, la protección baja a nivel de software y pierde aislamiento. |
| Implementación en el servidor | Actualizar el navegador no basta: los sitios y proveedores de identidad deben implementar la verificación de posesión. |
| Privacidad | Hay que garantizar que las claves estén aisladas por sitio para que no sirvan como huella digital de rastreo. |
| Portabilidad | Restablecer el TPM, cambiar la placa base o migrar el perfil a otro equipo invalida las sesiones y obliga a autenticarse de nuevo. |

## Conclusión

DBSC ataca el punto débil de las cookies de sesión: que funcionan desde cualquier lugar donde se copien. Al anclar la sesión a una clave que vive en el hardware, el robo remoto de cookies pierde su valor. No sustituye otras defensas contra el malware local, pero eleva mucho el costo del secuestro de sesiones.

## Referencias

- Ackerman, B., Rubery, D., & Ehinger, G. (2026). [Protecting cookies with Device Bound Session Credentials](https://blog.google/security/protecting-cookies-with-device-bound-session-credentials/). Google.
- Rubery, D. (2026). [Device Bound Session Credentials now available on Windows](https://developer.chrome.com/blog/dbsc-windows-announcement). Chrome for Developers.
- Rubery, D., & Zapata, J. L. (2025). [Device Bound Session Credentials (DBSC)](https://developer.chrome.com/docs/web-platform/device-bound-session-credentials). Chrome for Developers.
