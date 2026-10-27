# Ingeniería inversa de WannaCry con radare2

Análisis **estático** del instalador del ransomware WannaCry: identificación de la muestra, estructura del binario, APIs peligrosas, lógica de la función principal e indicadores de compromiso (IOC). La muestra nunca se ejecutó.

> ⚠️ **Este repositorio no contiene la muestra ni ningún binario.** Solo se documentan la metodología y los hallazgos.

## Contexto

- **Curso:** BCD 9220 – Seguridad de Sistemas Digitales (Universidad LEAD)
- **Laboratorio:** Análisis de malware con Kali Linux, misión de ingeniería inversa (disassembly)
- **Fecha:** octubre 2026
- **Modalidad:** trabajo en equipo de 3 integrantes

## Entorno y metodología

- **Aislamiento:** contenedor Docker con Kali Linux (`kalilinux/kali-rolling`), separado del equipo anfitrión.
- **Muestra:** `Ransomware.WannaCry` del repositorio de investigación TheZoo.
- **Herramientas:** radare2 6.0.4 y objdump (binutils 2.47).
- **Tipo de análisis:** estático. Al ser un ejecutable de Windows, no puede correr en el contenedor Linux.

| Comando | Herramienta | Para qué |
|---|---|---|
| `file` / `sha256sum` | bash | Tipo de archivo e integridad |
| `r2 -A wcry.exe` | radare2 | Abrir y analizar todo el binario |
| `iI` / `iS` | radare2 | Información general y secciones |
| `ii` | radare2 | APIs de Windows importadas |
| `afl` | radare2 | Funciones detectadas |
| `s main` + `pdf` | radare2 | Desensamblar la función principal |
| `iz~icacls`, `iz~WNcry` | radare2 | Buscar cadenas de texto |
| `axt @ sym.imp.<API>` | radare2 | Ver qué función llama a cada API |
| `objdump -p` / `-f` | objdump | Verificación cruzada de DLLs y punto de entrada |

## Identificación de la muestra

| Atributo | Valor |
|---|---|
| Tipo | PE32, GUI, Intel i386 (32 bits), 4 secciones |
| SHA256 | `ed01ebfbc9eb5bbea545af4d01bf5f1071661840480439c6e5babe8e080e41aa` |
| Tamaño | 3 514 368 bytes |
| Compilador | MSVC |
| Punto de entrada | `0x004077ba` |
| DLLs importadas | KERNEL32, USER32, ADVAPI32, MSVCRT |
| Firmado | No |
| NX/DEP | No |

El hash coincide con el publicado por TheZoo, así que la muestra no fue alterada. Esta muestra es el **componente cifrador/instalador** (el que se instala como `tasksche.exe`), no el componente gusano; por eso no contiene el *kill switch*.

### Dos señales de alarma antes de leer código

1. **Fecha de compilación falsa:** el encabezado dice noviembre de 2010, pero WannaCry apareció en mayo de 2017. Manipular la marca de tiempo es una técnica para despistar al analista.
2. **Sección `.rsrc` desproporcionada:** ocupa 3.37 MB de 3.5 MB, es decir, **el 96 % del ejecutable es un payload escondido** (un ZIP protegido con contraseña que contiene `taskdl.exe`, `taskse.exe` y otros componentes).

| Sección | Tamaño | Permisos | Contenido |
|---|---|---|---|
| `.text` | 28 KB | r-x | Código ejecutable |
| `.rdata` | 24 KB | r-- | Datos de solo lectura e importaciones |
| `.data` | 8 KB | rw- | Variables y cadenas |
| `.rsrc` | 3.37 MB | r-- | ZIP protegido con contraseña |

## APIs peligrosas

| Categoría | APIs | Riesgo |
|---|---|---|
| Ejecución | `CreateProcessA`, `TerminateProcess` | Ejecuta comandos del sistema |
| Persistencia | `CreateServiceA`, `OpenSCManagerA`, `StartServiceA` | Se instala como servicio y sobrevive reinicios |
| Registro | `RegCreateKeyW`, `RegSetValueExA` | Modifica la configuración del sistema |
| Archivos | `CreateFileA`, `WriteFile`, `CopyFileA`, `SetFileAttributesW` | Copia, sobrescribe y oculta archivos |
| Recursos | `FindResourceA`, `LoadResource` | Extrae el payload escondido |
| Carga dinámica | `LoadLibraryA`, `GetProcAddress`, `VirtualAlloc` | Carga código en memoria |

**Dato clave:** de criptografía solo se importa `CryptReleaseContext`. Las funciones de cifrado reales se resuelven en tiempo de ejecución con `LoadLibraryA` + `GetProcAddress`, una técnica para ocultarlas del análisis estático.

Las referencias cruzadas (`axt`) confirmaron qué función usa cada API: `CreateProcessA` → `fcn.00401064`, `CreateServiceA` → `fcn.00401ce8`, `RegCreateKeyW` → `fcn.004010fd`, `FindResourceA` → `fcn.00401dab`.

## Lógica del `main`

Con el argumento `/i`, el programa se copia como `tasksche.exe`, lanza esa copia y termina. Sin argumentos, ejecuta esta cadena:

1. Se ubica en su propia carpeta (`SetCurrentDirectoryA`).
2. Escribe en el registro.
3. Extrae el ZIP de `.rsrc` con la contraseña `WNcry@2ol7`.
4. Oculta la carpeta con `attrib +h .`.
5. Da control total a todos con `icacls . /grant Everyone:F /T /C /Q`.
6. Carga funciones dinámicamente; si falla, termina.
7. Lee y descifra `t.wnry`, que resulta ser una DLL.
8. Carga esa DLL **en memoria**, sin escribirla en disco.
9. Busca la función exportada `TaskStart` y la ejecuta con `call eax`: ahí comienza el cifrado de los archivos.

**El código que cifra nunca existe como archivo ejecutable visible en el disco.**

### Ejecución oculta de comandos (`fcn.00401064`)

| Instrucción | Significado |
|---|---|
| `mov word [var_24h], si` (si = 0) | `wShowWindow = SW_HIDE`: la ventana se oculta |
| `push 0x8000000` | `CREATE_NO_WINDOW`: el proceso no muestra consola |
| `call CreateProcessA` | Ejecuta el comando recibido |
| `call WaitForSingleObject` | Espera con tiempo límite |
| `call TerminateProcess` | Mata el proceso si tarda demasiado |

Así, la víctima no ve ninguna ventana mientras el malware oculta la carpeta y cambia permisos.

## Indicadores de compromiso

| Indicador | Tipo |
|---|---|
| `ed01ebfbc9eb5bbea545af4d01bf5f1071661840480439c6e5babe8e080e41aa` | SHA256 |
| `tasksche.exe`, `t.wnry`, `taskdl.exe`, `taskse.exe` | Nombres de archivo |
| `WNcry@2ol7` | Contraseña del ZIP embebido |
| `TaskStart` | Función exportada de la DLL |
| `icacls . /grant Everyone:F /T /C /Q` | Comando |
| `attrib +h .` | Comando |
| `cmd.exe /c "%s"` | Plantilla de comando |

## Conclusiones

La muestra es un **instalador en capas**: se instala como servicio, se oculta, se da permisos totales, extrae su payload y ejecuta en memoria la DLL que cifra. Usa tres técnicas de evasión:

- Fecha de compilación falsa.
- APIs de cifrado ocultas mediante carga dinámica.
- Ejecución en memoria, sin archivo en disco.

La ingeniería inversa permite entender el malware **sin ejecutarlo** y extraer indicadores concretos, además de revelar técnicas de evasión que un antivirus basado solo en firmas podría pasar por alto.

## Contramedidas

- Aplicar el parche **MS17-010** y deshabilitar SMBv1, la vía de propagación de WannaCry.
- Bloquear el puerto 445 hacia Internet.
- Mantener respaldos fuera de línea.
- Crear reglas YARA o EDR con los IOC, por ejemplo la combinación de `WNcry@2ol7`, `tasksche.exe` e `icacls . /grant Everyone:F`.
- Alertar sobre servicios nuevos y procesos lanzados con `CREATE_NO_WINDOW` que ejecuten `icacls` o `attrib`.

## Referencias

- [radare2 – documentación oficial](https://book.rada.re/)
- [Microsoft – Boletín de seguridad MS17-010](https://learn.microsoft.com/en-us/security-updates/securitybulletins/2017/ms17-010)
- [TheZoo (repositorio de investigación de malware)](https://github.com/ytisf/theZoo)
