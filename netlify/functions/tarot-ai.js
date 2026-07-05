const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

/**
 * Calumira Backend
 * Function: tarot-ai
 * Versión: 1.1.1
 *
 * Flujo:
 * 1. Recibe pregunta
 * 2. Extrae cartas
 * 3. Guarda consulta
 * 4. Guarda cartas extraídas
 * 5. Genera interpretación con Groq
 * 6. Guarda interpretación
 */

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL,

  supabaseKey:
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY,

  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",

  promptVersion: "calumira_tarot_v1",
};

const SPREADS = {
  "1_carta": {
    id: "1_carta",
    nombre: "Una carta",
    posiciones: [
      {
        numero: 1,
        codigo: "mensaje_central",
        nombre: "Mensaje central",
      },
    ],
  },

  una_carta: {
    id: "1_carta",
    nombre: "Una carta",
    posiciones: [
      {
        numero: 1,
        codigo: "mensaje_central",
        nombre: "Mensaje central",
      },
    ],
  },

  "3_cartas": {
    id: "tres_cartas",
    nombre: "Tres cartas",
    posiciones: [
      {
        numero: 1,
        codigo: "pasado",
        nombre: "Pasado",
      },
      {
        numero: 2,
        codigo: "presente",
        nombre: "Presente",
      },
      {
        numero: 3,
        codigo: "futuro",
        nombre: "Futuro",
      },
    ],
  },

  tres_cartas: {
    id: "tres_cartas",
    nombre: "Tres cartas",
    posiciones: [
      {
        numero: 1,
        codigo: "pasado",
        nombre: "Pasado",
      },
      {
        numero: 2,
        codigo: "presente",
        nombre: "Presente",
      },
      {
        numero: 3,
        codigo: "futuro",
        nombre: "Futuro",
      },
    ],
  },
};

const supabase = createSupabaseClient();

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return response(200, { ok: true });
    }

    if (event.httpMethod !== "POST") {
      return response(405, {
        ok: false,
        error: "METHOD_NOT_ALLOWED",
        message: "Solo se permite POST.",
      });
    }

    assertEnvironment();

    const input = parseBody(event.body);
    const payload = normalizePayload(input);
    const spread = getSpread(payload.tipo_tirada);

    const cartasDisponibles = await getMajorArcanaCards();

    if (cartasDisponibles.length < spread.posiciones.length) {
      return response(500, {
        ok: false,
        error: "INSUFFICIENT_CARDS",
        message: "No hay suficientes cartas disponibles para esta tirada.",
      });
    }

    const cartasExtraidas = drawCards({
      cards: cartasDisponibles,
      positions: spread.posiciones,
      allowReversed: payload.invertidas,
    });

    const consulta = await createConsultation({
      pregunta: payload.pregunta,
      tema: payload.tema,
      tipo_tirada: spread.id,
      consentimiento: payload.consentimiento,
      sesion_id: payload.sesion_id,
      metadata: {
        motor: "calumira-tarot-core",
        version: "1.1.1",
        ia: true,
        proveedor_ia: "groq",
        modelo: CONFIG.groqModel,
      },
    });

    const cartasGuardadas = await saveExtractedCards({
      consultaId: consulta.id,
      cards: cartasExtraidas,
    });

    const resultadoIA = await generateInterpretation({
      pregunta: payload.pregunta,
      tema: payload.tema,
      spread,
      cards: cartasExtraidas,
    });

    const interpretacion = await saveInterpretation({
      consultaId: consulta.id,
      aiResult: resultadoIA,
    });

    return response(200, {
      ok: true,
      etapa: "groq_integrado_v111",
      consulta_id: consulta.id,
      pregunta: payload.pregunta,
      tema: payload.tema,
      tipo_tirada: spread.id,
      tirada: spread.nombre,
      cartas: cartasExtraidas.map(toPublicCard),
      interpretacion: {
        id: interpretacion.id,
        proveedor_ia: interpretacion.proveedor_ia,
        modelo: interpretacion.modelo,
        texto: interpretacion.respuesta,
        tokens: interpretacion.tokens,
        duracion_ms: interpretacion.duracion_ms,
      },
      persistencia: {
        consulta_guardada: true,
        cartas_guardadas: cartasGuardadas.length,
        interpretacion_guardada: true,
      },
    });
  } catch (error) {
    console.error("[tarot-ai-error]", error);

    return response(error.statusCode || 500, {
      ok: false,
      error: error.code || "INTERNAL_ERROR",
      message: error.publicMessage || "Error procesando la lectura.",
    });
  }
};

/**
 * Configuración
 */

function createSupabaseClient() {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
    return null;
  }

  return createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

function assertEnvironment() {
  if (!CONFIG.supabaseUrl) {
    throw appError(
      500,
      "MISSING_SUPABASE_URL",
      "Falta SUPABASE_URL en Netlify."
    );
  }

  if (!CONFIG.supabaseKey) {
    throw appError(
      500,
      "MISSING_SUPABASE_KEY",
      "Falta SUPABASE_SERVICE_KEY en Netlify."
    );
  }

  if (!CONFIG.groqApiKey) {
    throw appError(
      500,
      "MISSING_GROQ_API_KEY",
      "Falta GROQ_API_KEY en Netlify."
    );
  }

  if (!supabase) {
    throw appError(
      500,
      "SUPABASE_CLIENT_NOT_READY",
      "Cliente Supabase no inicializado."
    );
  }
}

/**
 * Entrada HTTP
 */

function parseBody(rawBody) {
  if (!rawBody) {
    throw appError(400, "EMPTY_BODY", "El cuerpo de la solicitud está vacío.");
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw appError(400, "INVALID_JSON", "El cuerpo no es un JSON válido.");
  }
}

function normalizePayload(input) {
  const pregunta = String(input.pregunta || "").trim();
  const tema = String(input.tema || "general").trim().toLowerCase();
  const tipo_tirada = String(input.tipo_tirada || "1_carta").trim();
  const consentimiento = Boolean(input.consentimiento);
  const invertidas = input.invertidas === true;
  const sesion_id = input.sesion_id || null;

  if (!pregunta) {
    throw appError(400, "MISSING_QUESTION", "La pregunta es obligatoria.");
  }

  if (pregunta.length > 500) {
    throw appError(
      400,
      "QUESTION_TOO_LONG",
      "La pregunta no debe superar 500 caracteres."
    );
  }

  if (!consentimiento) {
    throw appError(
      400,
      "CONSENT_REQUIRED",
      "Se requiere consentimiento para procesar la lectura."
    );
  }

  return {
    pregunta,
    tema,
    tipo_tirada,
    consentimiento,
    invertidas,
    sesion_id,
  };
}

/**
 * Motor de tiradas
 */

function getSpread(tipoTirada) {
  const spread = SPREADS[tipoTirada];

  if (!spread) {
    throw appError(
      400,
      "UNSUPPORTED_SPREAD",
      `La tirada "${tipoTirada}" aún no está disponible.`
    );
  }

  return spread;
}

async function getMajorArcanaCards() {
  const { data, error } = await supabase
    .from("tarot_cartas")
    .select("*")
    .eq("arcano", "Mayor");

  if (error) {
    console.error("[supabase-cards-query-error]", error);

    throw appError(
      500,
      "CARDS_QUERY_FAILED",
      "No se pudieron consultar las cartas."
    );
  }

  return Array.isArray(data) ? data : [];
}

function drawCards({ cards, positions, allowReversed }) {
  const shuffled = shuffle(cards);
  const selected = shuffled.slice(0, positions.length);

  return selected.map((card, index) => {
    const position = positions[index];

    return {
      carta_id: card.id,
      carta_nombre: card.nombre,
      carta_numero: card.numero ?? card.numero_arcano ?? null,
      arcano: card.arcano,
      orientacion: resolveOrientation(allowReversed),
      posicion: position.numero,
      posicion_codigo: position.codigo,
      posicion_nombre: position.nombre,

      arquetipo: card.arquetipo || null,
      polaridad: card.polaridad || null,

      palabras_clave: normalizeKeywords(card),

      significado_general: card.significado_general || null,
      significado_derecho: card.significado_derecho || null,
      significado_invertido: card.significado_invertido || null,

      amor: card.amor || null,
      trabajo: card.trabajo || null,
      dinero: card.dinero || null,
      espiritualidad: card.espiritualidad || null,
      psicologico: card.psicologico || null,
      junguiano: card.junguiano || null,
      afirmacion: card.afirmacion || null,
      pregunta_reflexion: card.pregunta_reflexion || null,

      raw: card,
    };
  });
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index--) {
    const randomIndex = crypto.randomInt(index + 1);
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function resolveOrientation(allowReversed) {
  if (!allowReversed) return "derecha";
  return crypto.randomInt(2) === 0 ? "derecha" : "invertida";
}

function normalizeKeywords(card) {
  const keywords =
    card.palabras_clave ||
    card.keywords ||
    card.significados_clave ||
    card.descripcion_corta ||
    "";

  if (Array.isArray(keywords)) {
    return keywords;
  }

  if (typeof keywords === "string") {
    return keywords
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function keywordsToText(keywords) {
  if (Array.isArray(keywords)) {
    return keywords.join(", ");
  }

  return String(keywords || "").trim();
}

/**
 * Groq
 */

async function generateInterpretation({ pregunta, tema, spread, cards }) {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    pregunta,
    tema,
    spread,
    cards,
  });

  const startedAt = Date.now();

  const completion = await requestGroqCompletion({
    systemPrompt,
    userPrompt,
  });

  const durationMs = Date.now() - startedAt;

  return {
    proveedor_ia: "groq",
    modelo: completion.modelo,
    prompt: userPrompt,
    respuesta: completion.respuesta,
    tokens: completion.tokens,
    duracion_ms: durationMs,
  };
}

function buildSystemPrompt() {
  return `
Eres Calumira, un motor de interpretación simbólica de tarot.

Tu tarea es interpretar cartas de tarot con lenguaje claro, sobrio y útil.
No hables como adivina teatral.
No prometas hechos futuros.
No des diagnósticos médicos, legales o financieros.
No uses frases genéricas vacías.
No menciones que eres una IA.
No digas "como modelo de lenguaje".

Estilo:
- Directo.
- Intuitivo.
- Elegante.
- Sin exageración mística.
- Sin fatalismo.
- Sin infantilizar al usuario.

Estructura obligatoria:
1. Lectura central.
2. Qué está mostrando la carta o la tirada.
3. Consejo práctico.
4. Cierre breve.

Extensión máxima: 350 palabras.
`.trim();
}

function buildUserPrompt({ pregunta, tema, spread, cards }) {
  const cartasTexto = cards
    .map((card) => {
      return [
        `Posición ${card.posicion}: ${card.posicion_nombre}`,
        `Carta: ${card.carta_nombre}`,
        `Orientación: ${card.orientacion}`,
        `Arquetipo: ${card.arquetipo || "No registrado"}`,
        `Polaridad: ${card.polaridad || "No registrada"}`,
        `Palabras clave: ${keywordsToText(card.palabras_clave) || "No registradas"}`,
        `Significado general: ${card.significado_general || "No registrado"}`,
        `Significado derecho: ${card.significado_derecho || "No registrado"}`,
        `Significado invertido: ${card.significado_invertido || "No registrado"}`,
        `Área amor: ${card.amor || "No registrada"}`,
        `Área trabajo: ${card.trabajo || "No registrada"}`,
        `Área dinero: ${card.dinero || "No registrada"}`,
        `Área espiritualidad: ${card.espiritualidad || "No registrada"}`,
        `Lectura psicológica: ${card.psicologico || "No registrada"}`,
        `Lectura junguiana: ${card.junguiano || "No registrada"}`,
        `Afirmación: ${card.afirmacion || "No registrada"}`,
        `Pregunta de reflexión: ${card.pregunta_reflexion || "No registrada"}`,
      ].join("\n");
    })
    .join("\n\n");

  return `
Pregunta del usuario:
${pregunta}

Tema:
${tema}

Tipo de tirada:
${spread.nombre}

Cartas extraídas:
${cartasTexto}

Interpreta la lectura de forma coherente con la pregunta, el tema, la posición de cada carta y la orientación.
Usa el área temática "${tema}" como prioridad si existe información específica para esa área.
`.trim();
}

async function requestGroqCompletion({ systemPrompt, userPrompt }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CONFIG.groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: CONFIG.groqModel,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.75,
          max_tokens: 700,
        }),
        signal: controller.signal,
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("[groq-error]", errorText);

      throw appError(
        502,
        "GROQ_REQUEST_FAILED",
        "Groq no pudo generar la interpretación."
      );
    }

    const data = await groqResponse.json();
    const respuesta = data?.choices?.[0]?.message?.content?.trim();

    if (!respuesta) {
      throw appError(
        502,
        "EMPTY_GROQ_RESPONSE",
        "Groq respondió sin interpretación."
      );
    }

    return {
      modelo: data.model || CONFIG.groqModel,
      respuesta,
      tokens: data?.usage?.total_tokens || null,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw appError(
        504,
        "GROQ_TIMEOUT",
        "Groq tardó demasiado en responder."
      );
    }

    if (error.statusCode) {
      throw error;
    }

    console.error("[groq-fetch-error]", error);

    throw appError(
      502,
      "GROQ_FETCH_FAILED",
      "No se pudo conectar con Groq."
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Persistencia
 */

async function createConsultation({
  pregunta,
  tema,
  tipo_tirada,
  consentimiento,
  sesion_id,
  metadata,
}) {
  const insertPayload = {
    sesion_id,
    pregunta,
    tema,
    tipo_tirada,
    consentimiento,
    metadata,
  };

  const { data, error } = await supabase
    .from("tarot_consultas")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("[supabase-consultation-error]", error);

    throw appError(
      500,
      "CONSULTATION_INSERT_FAILED",
      "No se pudo guardar la consulta."
    );
  }

  return data;
}

async function saveExtractedCards({ consultaId, cards }) {
  const rows = cards.map((card) => ({
    consulta_id: consultaId,
    carta_id: card.carta_id,
    carta_nombre: card.carta_nombre,
    posicion: card.posicion,
    posicion_nombre: card.posicion_nombre,
    orientacion: card.orientacion,
    palabras_clave: keywordsToText(card.palabras_clave),
  }));

  const { data, error } = await supabase
    .from("tarot_cartas_extraidas")
    .insert(rows)
    .select();

  if (error) {
    console.error("[supabase-cards-error]", error);

    throw appError(
      500,
      "EXTRACTED_CARDS_INSERT_FAILED",
      "No se pudieron guardar las cartas extraídas."
    );
  }

  return Array.isArray(data) ? data : [];
}

async function saveInterpretation({ consultaId, aiResult }) {
  const insertPayload = {
    consulta_id: consultaId,
    proveedor_ia: aiResult.proveedor_ia,
    modelo: aiResult.modelo,
    prompt: aiResult.prompt,
    respuesta: aiResult.respuesta,
    tokens: aiResult.tokens,
    duracion_ms: aiResult.duracion_ms,
  };

  const { data, error } = await supabase
    .from("tarot_interpretaciones")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("[supabase-interpretation-error]", error);

    throw appError(
      500,
      "INTERPRETATION_INSERT_FAILED",
      "No se pudo guardar la interpretación."
    );
  }

  return data;
}

/**
 * Respuesta pública
 */

function toPublicCard(card) {
  return {
    carta_id: card.carta_id,
    nombre: card.carta_nombre,
    numero: card.carta_numero,
    arcano: card.arcano,
    orientacion: card.orientacion,
    posicion: card.posicion,
    posicion_nombre: card.posicion_nombre,
    arquetipo: card.arquetipo,
    polaridad: card.polaridad,
    palabras_clave: card.palabras_clave,
    significado_general: card.significado_general,
    significado_derecho: card.significado_derecho,
    significado_invertido: card.significado_invertido,
    amor: card.amor,
    trabajo: card.trabajo,
    dinero: card.dinero,
    espiritualidad: card.espiritualidad,
    psicologico: card.psicologico,
    junguiano: card.junguiano,
    afirmacion: card.afirmacion,
    pregunta_reflexion: card.pregunta_reflexion,
  };
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(body),
  };
}

function appError(statusCode, code, publicMessage) {
  const error = new Error(publicMessage);
  error.statusCode = statusCode;
  error.code = code;
  error.publicMessage = publicMessage;
  return error;
}
