const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function getSpreadPositions(tipoTirada) {
  if (tipoTirada === "tres_cartas") {
    return ["Pasado", "Presente", "Futuro"];
  }

  return ["Mensaje central"];
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        mensaje: "Función tarot-ai activa. Usa POST para generar una tirada."
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const pregunta = body.pregunta;
    const tema = body.tema || "general";
    const tipoTirada = body.tipo_tirada || "una_carta";
    const consentimiento = body.consentimiento === true;

    if (!pregunta) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: "Falta la pregunta."
        })
      };
    }

    const cantidadCartas = tipoTirada === "tres_cartas" ? 3 : 1;
    const posiciones = getSpreadPositions(tipoTirada);

    const { data: cartas, error: cartasError } = await supabase
      .from("tarot_cartas")
      .select("*")
      .eq("arcano", "Mayor");

    if (cartasError) throw cartasError;

    const cartasExtraidas = shuffle(cartas).slice(0, cantidadCartas);

    const { data: sesion, error: sesionError } = await supabase
      .from("tarot_sesiones")
      .insert({
        idioma: "es",
        origen: "calumira",
        user_agent: event.headers["user-agent"] || null
      })
      .select()
      .single();

    if (sesionError) throw sesionError;

    const { data: consulta, error: consultaError } = await supabase
      .from("tarot_consultas")
      .insert({
        sesion_id: sesion.id,
        pregunta,
        tema,
        tipo_tirada: tipoTirada,
        consentimiento
      })
      .select()
      .single();

    if (consultaError) throw consultaError;

    const cartasParaGuardar = cartasExtraidas.map((carta, index) => ({
      consulta_id: consulta.id,
      posicion: index + 1,
      posicion_nombre: posiciones[index],
      carta_nombre: carta.nombre,
      carta_id: String(carta.id),
      orientacion: "upright",
      palabras_clave: carta.palabras_clave?.join(", ")
    }));

    const { error: extraidasError } = await supabase
      .from("tarot_cartas_extraidas")
      .insert(cartasParaGuardar);

    if (extraidasError) throw extraidasError;

    const contexto = cartasExtraidas.map((carta, index) => ({
      posicion: posiciones[index],
      carta: carta.nombre,
      palabras_clave: carta.palabras_clave,
      significado_general: carta.significado_general,
      significado_derecho: carta.significado_derecho,
      amor: carta.amor,
      trabajo: carta.trabajo,
      dinero: carta.dinero,
      espiritualidad: carta.espiritualidad,
      psicologico: carta.psicologico,
      junguiano: carta.junguiano,
      afirmacion: carta.afirmacion,
      pregunta_reflexion: carta.pregunta_reflexion
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        pregunta,
        tema,
        tipo_tirada: tipoTirada,
        consulta_id: consulta.id,
        cartas: contexto,
        mensaje: "Tirada generada y guardada correctamente."
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};