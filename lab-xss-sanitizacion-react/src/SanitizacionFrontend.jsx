// =====================================================================
// GRUPO 2 – Validación de Entradas y Sanitización
// Sub-equipo 3: Frontend (React)
// Dependencia: npm install dompurify
// =====================================================================

import { useMemo, useState } from "react";
import DOMPurify from "dompurify";

// ---------------------------------------------------------------------
// 1. EJEMPLO VULNERABLE (solo para comparar, NO usar en producción)
// ---------------------------------------------------------------------
function ComentarioVulnerable({ html }) {
  // ❌ VULNERABLE: inserta en el DOM el HTML tal como lo escribió el usuario.
  // Un payload como <img src="x" onerror="alert('XSS')"> se ejecuta en el
  // navegador de cualquier persona que vea el comentario (XSS almacenado).
  // El atacante podría robar datos de la sesión, redirigir o modificar la página.
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// ---------------------------------------------------------------------
// 2. SANITIZACIÓN CON DOMPurify (lista blanca)
// ---------------------------------------------------------------------
// Lista blanca: solo se permite lo estrictamente necesario para dar formato.
// Todo lo demás (<script>, <iframe>, <img>, onerror, onclick, style...) se elimina.
const CONFIG_SANITIZACION = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "a"],
  ALLOWED_ATTR: ["href", "target", "rel"],
  // Solo enlaces http(s) y mailto: bloquea "javascript:alert(1)" y "data:..."
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
};

// Hook: todo enlace que sobreviva a la limpieza se abre en otra pestaña
// con rel="noopener noreferrer", para que la página externa no pueda
// controlar nuestra pestaña mediante window.opener (tabnabbing).
DOMPurify.addHook("afterSanitizeAttributes", (nodo) => {
  if (nodo.tagName === "A") {
    nodo.setAttribute("target", "_blank");
    nodo.setAttribute("rel", "noopener noreferrer");
  }
});

export function sanitizarHTML(htmlSucio) {
  return DOMPurify.sanitize(htmlSucio, CONFIG_SANITIZACION);
}

function ComentarioSeguro({ html }) {
  // ✅ SEGURO: el HTML pasa por DOMPurify ANTES de llegar al DOM.
  // dangerouslySetInnerHTML solo recibe la versión limpia.
  // useMemo evita volver a sanitizar si el contenido no cambió.
  const htmlLimpio = useMemo(() => sanitizarHTML(html), [html]);
  return <div dangerouslySetInnerHTML={{ __html: htmlLimpio }} />;
}

// ---------------------------------------------------------------------
// 3. OPCIÓN MÁS SEGURA: TEXTO PLANO (cuando no se necesita HTML)
// ---------------------------------------------------------------------
function ComentarioTextoPlano({ texto }) {
  // ✅ React escapa automáticamente todo lo que va entre llaves {}:
  // "<script>" se muestra como texto, nunca se interpreta como etiqueta.
  // Si el comentario no necesita negritas ni enlaces, esta es la mejor opción.
  return <p>{texto}</p>;
}

// ---------------------------------------------------------------------
// 4. VALIDACIÓN EN EL CLIENTE (formulario)
// ---------------------------------------------------------------------
// Reglas de lista blanca: se define lo que SÍ es válido, no lo que está prohibido.
const REGLAS = {
  idUsuario: {
    regex: /^\d{1,10}$/, // solo dígitos: impide enviar "1 OR 1=1" como ID
    mensaje: "El ID debe ser numérico (máximo 10 dígitos).",
  },
  correo: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    mensaje: "Ingrese un correo válido.",
  },
  comentario: {
    max: 500, // limita el tamaño del payload
    mensaje: "El comentario es obligatorio y admite máximo 500 caracteres.",
  },
};

function validar(campos) {
  const errores = {};
  if (!REGLAS.idUsuario.regex.test(campos.idUsuario.trim())) {
    errores.idUsuario = REGLAS.idUsuario.mensaje;
  }
  if (!REGLAS.correo.regex.test(campos.correo.trim())) {
    errores.correo = REGLAS.correo.mensaje;
  }
  const largo = campos.comentario.trim().length;
  if (largo === 0 || largo > REGLAS.comentario.max) {
    errores.comentario = REGLAS.comentario.mensaje;
  }
  return errores;
}

function FormularioComentario() {
  const [campos, setCampos] = useState({ idUsuario: "", correo: "", comentario: "" });
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState("");

  const manejarCambio = (e) =>
    setCampos({ ...campos, [e.target.name]: e.target.value });

  const manejarEnvio = async (e) => {
    e.preventDefault();

    // 1) Validación en el cliente: da retroalimentación inmediata y evita
    //    peticiones inútiles. NO es una barrera de seguridad: un atacante
    //    puede saltársela con Postman, curl o las DevTools.
    const erroresEncontrados = validar(campos);
    setErrores(erroresEncontrados);
    if (Object.keys(erroresEncontrados).length > 0) return;

    try {
      // 2) Se envía como JSON con tipos correctos (el ID va como número).
      const respuesta = await fetch("/api/comentarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUsuario: Number(campos.idUsuario),
          correo: campos.correo.trim(),
          comentario: campos.comentario.trim(),
        }),
      });

      // 3) El backend VUELVE a validar y usa consultas parametrizadas.
      //    Si rechaza los datos, mostramos su mensaje (como texto, escapado).
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => ({}));
        setEstado(data.error ?? "El servidor rechazó los datos.");
        return;
      }
      setEstado("Comentario enviado correctamente.");
      setCampos({ idUsuario: "", correo: "", comentario: "" });
    } catch {
      setEstado("Error de conexión con el servidor.");
    }
  };

  return (
    <form onSubmit={manejarEnvio} noValidate>
      <label>
        ID de usuario
        {/* inputMode y maxLength ayudan al usuario; la regex es la validación real */}
        <input name="idUsuario" inputMode="numeric" maxLength={10}
               value={campos.idUsuario} onChange={manejarCambio} />
      </label>
      {errores.idUsuario && <small>{errores.idUsuario}</small>}

      <label>
        Correo
        <input name="correo" type="email" maxLength={254}
               value={campos.correo} onChange={manejarCambio} />
      </label>
      {errores.correo && <small>{errores.correo}</small>}

      <label>
        Comentario
        <textarea name="comentario" maxLength={500}
                  value={campos.comentario} onChange={manejarCambio} />
      </label>
      {errores.comentario && <small>{errores.comentario}</small>}

      <button type="submit">Enviar</button>
      {/* {estado} se renderiza como texto: aunque el servidor devolviera HTML, no se ejecuta */}
      {estado && <p>{estado}</p>}
    </form>
  );
}

// ---------------------------------------------------------------------
// 5. DEMO PARA LA EXPOSICIÓN
// ---------------------------------------------------------------------
const PAYLOAD_ATAQUE =
  `<b>Hola</b> <img src="x" onerror="alert('XSS')"> ` +
  `<a href="javascript:alert('XSS')">clic aquí</a> <script>alert(1)</script>`;

export default function DemoGrupo2() {
  const [entrada, setEntrada] = useState(PAYLOAD_ATAQUE);
  const [verVulnerable, setVerVulnerable] = useState(false);

  return (
    <main>
      <h2>Entrada del usuario (payload de ataque)</h2>
      <textarea rows={4} cols={80} value={entrada}
                onChange={(e) => setEntrada(e.target.value)} />

      <h3>❌ Sin sanitizar</h3>
      <label>
        <input type="checkbox" checked={verVulnerable}
               onChange={(e) => setVerVulnerable(e.target.checked)} />
        Mostrar versión vulnerable (dispara el alert)
      </label>
      {verVulnerable && <ComentarioVulnerable html={entrada} />}

      <h3>✅ Sanitizado con DOMPurify</h3>
      <ComentarioSeguro html={entrada} />

      <h3>HTML que realmente llega al DOM</h3>
      <pre>{sanitizarHTML(entrada)}</pre>

      <h3>✅ Texto plano (escape automático de React)</h3>
      <ComentarioTextoPlano texto={entrada} />

      <h2>Formulario con validación en el cliente</h2>
      <FormularioComentario />
    </main>
  );
}
