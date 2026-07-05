const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function getSpreadPositions(tipoTirada) {
  if (tipoTirada === "tres_cartas") return ["Pasado", "Presente", "Futuro"];
  return ["Mensaje central"];
}

function buildPrompt({ pregunta, tema, tipoTirada, contexto }) {
  return `
Eres Calumira, un oráculo simbólico basado en tarot Rider-Waite, psicología profunda y orientación práctica.

No afirmes certezas absolutas. No digas que predices el futuro. Interpreta las cartas como herramienta de reflexión, claridad y orientación.

Pregunta del consultante:
"${pregunta}"

Tema:
${tema}

Tipo de tirada:
${tipoTirada}

Cartas extraídas:
${JSON.stringify(contexto, null, 2)}

Estructura tu respuesta en español con este formato:

1. Lectura general
2. Carta por carta
3. Lectura psicológica
4. Orientación práctica
5. Pregunta final de reflexión

Tono:
sobrio, claro, profundo, sin exageraciones místicas, sin prometer resultados.
`;
}

async function callGroq(prompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Eres una intérprete simbólica de tarot, clara, ética y precisa."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1200
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
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
      arquetipo: carta.arquetipo,
      polaridad: carta.polaridad,
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

    const prompt = buildPrompt({
      pregunta,
      tema,
      tipoTirada,
      contexto
    });

    const lectura = await callGroq(prompt);

    const { error: interpretacionError } = await supabase
      .from("tarot_interpretaciones")
      .insert({
        consulta_id: consulta.id,
        proveedor_ia: "groq",
        modelo: "llama-3.3-70b-versatile",
        prompt,
        respuesta: lectura
      });

    if (interpretacionError) throw interpretacionError;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        pregunta,
        tema,
        tipo_tirada: tipoTirada,
        consulta_id: consulta.id,
        cartas: contexto,
        lectura
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