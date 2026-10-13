const API_URL = "https://jsonplaceholder.typicode.com/posts";

const formulario = document.getElementById("formulario-publicacion");
const campoTitulo = document.getElementById("titulo");
const campoContenido = document.getElementById("contenido");
const botonPublicar = document.getElementById("boton-publicar");
const areaEstado = document.getElementById("estado");
const indicadorEstado = document.getElementById("estado-indicador");
const mensajeEstado = document.getElementById("estado-mensaje");
const errorTitulo = document.getElementById("error-titulo");
const errorContenido = document.getElementById("error-contenido");
const seccionResultado = document.getElementById("seccion-resultado");
const resultadoEstado = document.getElementById("resultado-estado");
const resultadoId = document.getElementById("resultado-id");
const resultadoTitulo = document.getElementById("resultado-titulo");
const resultadoContenido = document.getElementById("resultado-contenido");

const erroresCampo = {
  titulo: errorTitulo,
  contenido: errorContenido,
};

const campos = {
  titulo: campoTitulo,
  contenido: campoContenido,
};

let enviando = false;

formulario.addEventListener("submit", manejarEnvio);
campoTitulo.addEventListener("input", () => limpiarErrorCampo("titulo"));
campoContenido.addEventListener("input", () => limpiarErrorCampo("contenido"));

async function manejarEnvio(evento) {
  evento.preventDefault();

  if (enviando) {
    return;
  }

  limpiarEstado();
  limpiarErrores();

  const titulo = campoTitulo.value.trim();
  const contenido = campoContenido.value.trim();
  const errores = validarPublicacion(titulo, contenido);

  if (errores) {
    console.warn("Validación: la petición no se envió.", errores);
    mostrarErrores(errores);
    return;
  }

  establecerCarga(true);

  try {
    const { datos, estado } = await publicarMensaje(titulo, contenido);
    mostrarResultado(datos, estado);
    mostrarEstado(
      "exito",
      "La publicación se envió correctamente."
    );
    formulario.reset();
  } catch (error) {
    console.error("Error al publicar el mensaje.", error);
    mostrarEstado("error", describirError(error));
  } finally {
    establecerCarga(false);
  }
}

function validarPublicacion(titulo, contenido) {
  const errores = {};

  if (!titulo) {
    errores.titulo = "El título es obligatorio y no puede contener solo espacios.";
  }

  if (!contenido) {
    errores.contenido = "El contenido es obligatorio y no puede contener solo espacios.";
  }

  return Object.keys(errores).length > 0 ? errores : null;
}

async function publicarMensaje(titulo, contenido) {
  const publicacion = {
    title: titulo,
    body: contenido,
  };

  console.info("Solicitud POST", API_URL, publicacion);

  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(publicacion),
  });

  if (!respuesta.ok) {
    const errorHttp = new ErrorHttp(respuesta.status);
    console.error("Respuesta HTTP no satisfactoria", respuesta.status, errorHttp);
    throw errorHttp;
  }

  try {
    const datos = await respuesta.json();
    console.info("Respuesta de la API", respuesta.status, datos);
    return { datos, estado: respuesta.status };
  } catch (error) {
    console.error("No se pudo interpretar el JSON de la respuesta.", error);
    throw new ErrorJson();
  }
}

class ErrorHttp extends Error {
  constructor(estado) {
    super(`El servidor respondió con el código ${estado}.`);
    this.name = "ErrorHttp";
    this.estado = estado;
  }
}

class ErrorJson extends Error {
  constructor() {
    super("La respuesta del servidor no contiene JSON válido.");
    this.name = "ErrorJson";
  }
}

function describirError(error) {
  if (error instanceof ErrorHttp) {
    return `No se pudo publicar el mensaje. ${error.message} Puedes intentarlo de nuevo.`;
  }

  if (error instanceof ErrorJson) {
    return "Se recibió una respuesta, pero no se pudo interpretar como JSON. Puedes intentarlo de nuevo.";
  }

  if (error instanceof TypeError) {
    return "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.";
  }

  return "Ocurrió un error inesperado al publicar el mensaje. Puedes intentarlo de nuevo.";
}

function mostrarErrores(errores) {
  const nombres = Object.keys(errores);

  nombres.forEach((nombre) => {
    const campo = campos[nombre];
    const mensaje = erroresCampo[nombre];
    campo.setAttribute("aria-invalid", "true");
    mensaje.textContent = errores[nombre];
    mensaje.hidden = false;
  });

  mostrarEstado(
    "error",
    "Revisa los campos marcados. La publicación no se envió."
  );
  campos[nombres[0]].focus();
}

function limpiarErrorCampo(nombre) {
  campos[nombre].removeAttribute("aria-invalid");
  erroresCampo[nombre].textContent = "";
  erroresCampo[nombre].hidden = true;
}

function limpiarErrores() {
  limpiarErrorCampo("titulo");
  limpiarErrorCampo("contenido");
}

function mostrarResultado(datos, estadoHttp) {
  resultadoEstado.textContent = String(estadoHttp);
  resultadoId.textContent = datos.id == null ? "—" : String(datos.id);
  resultadoTitulo.textContent = datos.title ?? "";
  resultadoContenido.textContent = datos.body ?? "";
  seccionResultado.hidden = false;
}

function mostrarEstado(tipo, texto) {
  areaEstado.className = `estado estado--${tipo}`;
  mensajeEstado.textContent = texto;
  indicadorEstado.hidden = tipo !== "carga";
  areaEstado.hidden = false;
}

function limpiarEstado() {
  areaEstado.hidden = true;
  areaEstado.className = "estado";
  mensajeEstado.textContent = "";
  indicadorEstado.hidden = true;
  seccionResultado.hidden = true;
}

function establecerCarga(activa) {
  enviando = activa;
  botonPublicar.disabled = activa;
  formulario.setAttribute("aria-busy", activa ? "true" : "false");
  botonPublicar.textContent = activa ? "Publicando…" : "Publicar mensaje";

  if (activa) {
    mostrarEstado("carga", "Enviando la publicación al servidor…");
  }
}
