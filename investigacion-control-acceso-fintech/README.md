# Control de acceso en una fintech con teletrabajo

Diseño de un modelo de control de acceso **ABAC + NAC** para una fintech 100 % remota que maneja datos bancarios y debe cumplir regulación KYC/AML.

## Contexto

- **Curso:** BCD 9220 – Seguridad de Sistemas Digitales (Universidad LEAD)
- **Tema 3:** Control de acceso, actividad de investigación aplicada
- **Modalidad:** trabajo grupal

## El caso

Una fintech donde todos trabajan de forma remota: desarrolladores, analistas financieros, soporte al cliente, auditores, oficiales de cumplimiento y gerencia. Manejan datos bancarios, transacciones, credenciales de API y reportes regulatorios.

**Reto:** controlar el acceso desde ubicaciones no confiables, dispositivos personales y horarios variables, cumpliendo KYC/AML.

## Activos críticos

| Activo | Clasificación |
|---|---|
| Credenciales de API | Crítico |
| Sistemas de pago | Crítico |
| Información KYC/AML | Crítico |
| Datos bancarios de clientes | Confidencial |
| Transacciones y pagos | Confidencial |
| Reportes regulatorios | Confidencial |
| Base de datos de clientes | Confidencial |

*Interno:* uso interno. *Confidencial:* afecta privacidad o cumplimiento. *Crítico:* afecta la operación o la seguridad financiera.

## Roles y permisos

| Rol | Acceso principal | Permisos | Condición ABAC clave |
|---|---|---|---|
| Analistas financieros | Transacciones anonimizadas | Lectura y exportación | Dispositivo corporativo + MFA + país permitido |
| Auditores | Logs de auditoría | Consulta en VDI, solo lectura | Horario laboral + ubicación permitida |
| Soporte al cliente | PII enmascarada del caso | Consulta limitada por caso | Caso abierto + aprobación para datos extra |
| Oficiales de cumplimiento | KYC/AML y reportes | Aprobación y revisión | MFA FIDO2 + dispositivo validado |

Principios base: **mínimo privilegio** y **denegar por defecto** sobre los activos críticos.

## Modelo elegido: ABAC complementado con NAC

**Por qué no solo RBAC:** un modelo basado únicamente en roles no considera contexto. No distingue ubicación, dispositivo ni horario, y eso es insuficiente para el teletrabajo y una regulación exigente.

**Qué aporta ABAC + NAC:**
- Decisiones dinámicas que combinan rol, ubicación, dispositivo y horario.
- NAC valida el estado del dispositivo antes de permitir la conexión.
- Trazabilidad clara para auditorías KYC/AML.

## Políticas ABAC

| # | Política | Regla central |
|---|---|---|
| 1 | Ubicación | Solo países autorizados. Una emergencia real se bloquea hasta aprobación excepcional (máximo 1 hora). |
| 2 | Seguridad del dispositivo | Equipo registrado, actualizado y cifrado. BYOD solo si está bajo la gestión de la empresa. |
| 3 | Horario | Acceso dentro del horario o en guardia aprobada; las excepciones son temporales y vencen. |
| 4 | Datos de clientes | Solo el caso asignado y con PII enmascarada; datos adicionales requieren aprobación temporal. |
| 5 | Separación de funciones | Quien crea una transacción no puede aprobarla. |

**Regla general:** todo lo que no está autorizado explícitamente se deniega, y todo queda registrado en el SIEM.

## Caso de defensa

> Un analista intenta acceder desde un país no permitido, pero es una emergencia real. ¿Qué mecanismo se activa y cómo se audita?

- **Caso normal:** país permitido + MFA + dispositivo autorizado → acceso según su rol.
- **Emergencia:** el acceso se bloquea hasta que lo aprueben el responsable de seguridad y el jefe de área. Se concede por **máximo 1 hora** y solo al recurso necesario.
- **Auditoría:** se registran la ubicación detectada, el motivo, los aprobadores y cada acción, y todo se envía al SIEM como acceso fuera de política.

## Monitoreo

| Qué se monitorea | Frecuencia | Responsable | Herramienta |
|---|---|---|---|
| Intentos de acceso fallidos | Tiempo real | Seguridad | SIEM |
| Accesos desde países no permitidos | Tiempo real | Seguridad | SIEM + ABAC |
| Dispositivos no autorizados | Cada conexión | TI | NAC |
| Accesos fuera de horario | Tiempo real | Seguridad | SIEM + ABAC |
| Acceso a datos bancarios y transacciones | Tiempo real | Seguridad y Cumplimiento | SIEM |

Respuesta ante un evento sospechoso: **confirmar** (usuario, dispositivo, ubicación) → **contener** (bloquear sesión o cuenta) → **documentar**.

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Dispositivos comprometidos | NAC, cifrado, parches y protección activa |
| Robo de credenciales | MFA + ABAC + alertas SIEM ante desviaciones |
| Abuso de accesos excepcionales | Límite de tiempo, aprobación y registro completo |

## Plan de implementación

| Fase | Duración | Entregable |
|---|---|---|
| 1. Analizar accesos y riesgos | 1 semana | Inventario de usuarios, activos y riesgos |
| 2. Crear políticas ABAC | 1 semana | Políticas por rol, ubicación, horario y dispositivo |
| 3. Configurar controles | 2 semanas | ABAC, NAC, MFA y SIEM configurados |
| 4. Pruebas | 1 semana | Resultados y ajustes |
| 5. Implementar y monitorear | 1 semana | Sistema en producción con monitoreo activo |

## Conclusión

En un entorno 100 % remoto, el acceso no puede depender solo del rol: depende del **contexto**. ABAC + NAC permiten trabajar a distancia sin sacrificar el cumplimiento, porque cada excepción se autoriza, se limita en el tiempo y queda auditada.
