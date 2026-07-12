const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

/**
 * Calumira Backend
 * Function: tarot-ai
 * Versión: 1.4.1
 *
 * Soporta:
 * - 1 carta gratis
 * - 3 cartas gratis
 * - Lectura del Umbral pagada por PayPal
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

  engineVersion: "1.4.1",
  promptVersion: "calumira_tarot_v5_umbral_diferenciado",
};

const SPREADS = {
  "1_carta": {
    id: "1_carta",
    nombre: "Una carta",
    acceso: "free",
    producto_id: null,
    maxPalabras: 260,
    maxTokens: 520,
    posiciones: [
      {
        numero: 1,
        codigo: "mensaje_central",
        nombre: "Mensaje central",
        enfoque: "síntesis simbólica de la consulta",
      },
    ],
  },

  una_carta: {
    id: "1_carta",
    nombre: "Una carta",
    acceso: "free",
    producto_id: null,
    maxPalabras: 260,
    maxTokens: 520,
    posiciones: [
      {
        numero: 1,
        codigo: "mensaje_central",
        nombre: "Mensaje central",
        enfoque: "síntesis simbólica de la consulta",
      },
    ],
  },

  "3_cartas": {
    id: "tres_cartas",
    nombre: "Tres cartas",
    acceso: "free",
    producto_id: null,
    maxPalabras: 420,
    maxTokens: 760,
    posiciones: [
      {
        numero: 1,
        codigo: "pasado",
        nombre: "Pasado",
        enfoque: "raíz, antecedente o patrón que viene influyendo",
      },
      {
        numero: 2,
        codigo: "presente",
        nombre: "Presente",
        enfoque: "estado actual, tensión activa o centro de la experiencia",
      },
      {
        numero: 3,
        codigo: "futuro",
        nombre: "Futuro",
        enfoque: "tendencia probable si se mantiene la dirección actual",
      },
    ],
  },

  tres_cartas: {
    id: "tres_cartas",
    nombre: "Tres cartas",
    acceso: "free",
    producto_id: null,
    maxPalabras: 420,
    maxTokens: 760,
    posiciones: [
      {
        numero: 1,
        codigo: "pasado",
        nombre: "Pasado",
        enfoque: "raíz, antecedente o patrón que viene influyendo",
      },
      {
        numero: 2,
        codigo: "presente",
        nombre: "Presente",
        enfoque: "estado actual, tensión activa o centro de la experiencia",
      },
      {
        numero: 3,
        codigo: "futuro",
        nombre: "Futuro",
        enfoque: "tendencia probable si se mantiene la dirección actual",
      },
    ],
  },

  situacion_obstaculo_consejo: {
    id: "situacion_obstaculo_consejo",
    nombre: "Lectura del Umbral",
    acceso: "paid_once",
    producto_id: "lectura_umbral",
    maxPalabras: 850,
    maxTokens: 1250,
    posiciones: [
      {
        numero: 1,
        codigo: "situacion",
        nombre: "Situación",
        enfoque:
          "lo visible de la consulta, el clima dominante y la forma en que el asunto se presenta",
      },
      {
        numero: 2,
        codigo: "obstaculo",
        nombre: "Obstáculo",
        enfoque:
          "la tensión oculta, el punto ciego, el patrón que bloquea o distorsiona la claridad",
      },
      {
        numero: 3,
        codigo: "consejo",
        nombre: "Consejo",
        enfoque:
          "el movimiento recomendado, la decisión interna y la acción concreta que abre el camino",
      },
    ],
  },

  lectura_umbral: {
    id: "situacion_obstaculo_consejo",
    nombre: "Lectura del Umbral",
    acceso: "paid_once",
    producto_id: "lectura_umbral",
    maxPalabras: 850,
    maxTokens: 1250,
    posiciones: [
      {
        numero: 1,
        codigo: "situacion",
        nombre: "Situación",
        enfoque:
          "lo visible de la consulta, el clima dominante y la forma en que el asunto se presenta",
      },
      {
        numero: 2,
        codigo: "obstaculo",
        nombre: "Obstáculo",
        enfoque:
          "la tensión oculta, el punto ciego, el patrón que bloquea o distorsiona la claridad",
      },
      {
        numero: 3,
        codigo: "consejo",
        nombre: "Consejo",
        enfoque:
          "el movimiento recomendado, la decisión interna y la acción concreta que abre el camino",
      },
    ],
  },
};

const TOPIC_LABELS = {
  general: "general",
  amor: "amor",
  trabajo: "trabajo",
  dinero: "dinero",
  espiritualidad: "espiritualidad",
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

    const pagoValidado =
      spread.acceso === "paid_once"
        ? await validateApprovedPayment({
            paypalOrderId: payload.paypal_order_id,
            spread,
          })
        : null;

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
      sesion_id: payload.sesion_id,
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
      pago: pagoValidado,
    });

    const interpretacion = await saveInterpretation({
      consultaId: consulta.id,
      aiResult: resultadoIA,
    });

    if (pagoValidado) {
      await attachConsultationToPayment({
        pago: pagoValidado,
        consultaId: consulta.id,
        spread,
      });
    }

    return response(200, {
      ok: true,
      etapa: "tarot_ai_v141_umbral_diferenciado",
      engine_version: CONFIG.engineVersion,
      prompt_version: CONFIG.promptVersion,

      consulta_id: consulta.id,
      pregunta: payload.pregunta,
      tema: payload.tema,

      tipo_tirada: spread.id,
      tirada: {
        id: spread.id,
        nombre: spread.nombre,
        acceso: spread.acceso,
        producto_id: spread.producto_id,
      },

      pago: pagoValidado
        ? {
            id: pagoValidado.id,
            estado: pagoValidado.estado,
            producto_id: pagoValidado.producto_id,
            producto_nombre: pagoValidado.producto_nombre,
            paypal_order_id: pagoValidado.paypal_order_id,
            paypal_capture_id: pagoValidado.paypal_capture_id,
          }
        : null,

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
        pago_asociado: Boolean(pagoValidado),
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
  const temaRaw = String(input.tema || "general").trim().toLowerCase();
  const tipo_tirada = String(input.tipo_tirada || "1_carta").trim();
  const consentimiento = Boolean(input.consentimiento);
  const invertidas = input.invertidas === true;
  const sesion_id = input.sesion_id || null;

  const paypal_order_id = String(
    input.paypal_order_id || input.order_id || input.token || ""
  ).trim();

  const tema = TOPIC_LABELS[temaRaw] ? temaRaw : "general";

  if (!pregunta) {
    throw appError(400, "MISSING_QUESTION", "La pregunta es obligatoria.");
  }

  if (pregunta.length > 700) {
    throw appError(
      400,
      "QUESTION_TOO_LONG",
      "La pregunta no debe superar 700 caracteres."
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
    paypal_order_id,
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
      posicion_enfoque: position.enfoque,

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
 * Validación de pago
 */

async function validateApprovedPayment({ paypalOrderId, spread }) {
  if (!paypalOrderId) {
    throw appError(
      402,
      "PAYMENT_REQUIRED",
      "Esta lectura requiere un pago aprobado."
    );
  }

  const { data, error } = await supabase
    .from("pagos")
    .select("*")
    .eq("paypal_order_id", paypalOrderId)
    .single();

  if (error || !data) {
    console.error("[payment-query-error]", error);

    throw appError(
      402,
      "PAYMENT_NOT_FOUND",
      "No se encontró un pago válido para esta lectura."
    );
  }

  if (data.estado !== "aprobado") {
    throw appError(
      402,
      "PAYMENT_NOT_APPROVED",
      "El pago todavía no aparece como aprobado."
    );
  }

  if (data.producto_id !== spread.producto_id) {
    throw appError(
      402,
      "PAYMENT_PRODUCT_MISMATCH",
      "El pago no corresponde a esta lectura."
    );
  }

  if (data.consulta_id) {
    throw appError(
      409,
      "PAYMENT_ALREADY_USED",
      "Este pago ya fue utilizado para generar una lectura."
    );
  }

  return data;
}

async function attachConsultationToPayment({ pago, consultaId, spread }) {
  const metadataActual =
    pago && typeof pago.metadata === "object" && pago.metadata !== null
      ? pago.metadata
      : {};

  const nuevaMetadata = {
    ...metadataActual,
    consulta_id: consultaId,
    lectura_generada_at: new Date().toISOString(),
    tipo_tirada_generada: spread.id,
    engine_version: CONFIG.engineVersion,
  };

  const { error } = await supabase
    .from("pagos")
    .update({
      consulta_id: consultaId,
      metadata: nuevaMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pago.id);

  if (error) {
    console.error("[payment-consultation-update-error]", error);

    throw appError(
      500,
      "PAYMENT_CONSULTATION_UPDATE_FAILED",
      "La lectura fue generada, pero no se pudo asociar al pago."
    );
  }
}

/**
 * Groq
 */

async function generateInterpretation({ pregunta, tema, spread, cards, pago }) {
  const systemPrompt = buildSystemPrompt({ spread });
  const userPrompt = buildUserPrompt({
    pregunta,
    tema,
    spread,
    cards,
    pago,
  });

  const startedAt = Date.now();

  const completion = await requestGroqCompletion({
    systemPrompt,
    userPrompt,
    spread,
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

function buildSystemPrompt({ spread }) {
  if (spread.id === "1_carta") {
    return `
Eres Calumira, un motor de interpretación simbólica de tarot.

Esta es una tirada gratuita de una carta.

Voz:
- Español claro.
- Sobria, intuitiva y precisa.
- Mística sin teatralidad.
- Directa, sin frases de relleno.
- No menciones que eres una IA.
- No prometas hechos futuros.
- No uses alarmismo.
- No uses diagnósticos médicos, legales o financieros.

Objetivo:
La lectura debe sentirse como un mensaje central, no como un análisis completo.

Reglas:
- Interpreta la carta como una señal principal.
- Conecta la carta con la pregunta del usuario.
- Usa la orientación de la carta.
- Si la carta está invertida, léela como tensión o ajuste necesario; no como castigo.
- No alargues la lectura.
- No hagas una lectura de varias capas.
- No uses estructura de pasado/presente/futuro.
- No menciones pagos ni productos.
- Si el tema es dinero, habla de orden, percepción, decisiones y hábitos; no des asesoría financiera.
- Si el tema es amor, evita dependencia emocional, promesas o afirmaciones absolutas.
- Si el tema es trabajo, habla de dirección, límites, estrategia, energía disponible y decisiones concretas.

Estructura obligatoria:
1. Mensaje central
2. Lo que esta carta señala
3. Consejo breve
4. Pregunta de reflexión

Extensión máxima:
${spread.maxPalabras} palabras.
`.trim();
  }

  if (spread.id === "tres_cartas") {
    return `
Eres Calumira, un motor de interpretación simbólica de tarot.

Esta es una tirada gratuita de tres cartas:
Pasado · Presente · Futuro.

Voz:
- Español claro.
- Sobria, intuitiva y precisa.
- Mística sin teatralidad.
- Directa, sin frases de relleno.
- No menciones que eres una IA.
- No prometas hechos futuros.
- No uses alarmismo.
- No uses diagnósticos médicos, legales o financieros.

Objetivo:
La lectura debe sentirse como un mapa breve de movimiento.
Debe mostrar una secuencia: de dónde viene la energía, dónde está ahora y hacia dónde tiende.

Reglas:
- Interpreta cada carta según su posición.
- Conecta las tres cartas como una secuencia.
- La lectura debe ser útil, pero sencilla.
- No conviertas la lectura en una lectura profunda de diagnóstico.
- No uses lenguaje de "obstáculo", "bloqueo profundo", "punto ciego" o "tensión oculta" salvo que la carta lo justifique claramente.
- No uses la estructura de Lectura del Umbral.
- No hables de pagos, productos ni lectura premium.
- No hagas promesas sobre el futuro.
- El futuro debe leerse como tendencia probable, no como destino fijo.
- Si el tema es dinero, habla de orden, percepción, decisiones y hábitos; no des asesoría financiera.
- Si el tema es amor, evita dependencia emocional, promesas o afirmaciones absolutas.
- Si el tema es trabajo, habla de dirección, límites, estrategia, energía disponible y decisiones concretas.

Estructura obligatoria:
1. Movimiento de la tirada
2. Pasado: raíz del asunto
3. Presente: energía activa
4. Futuro: tendencia probable
5. Síntesis

Extensión máxima:
${spread.maxPalabras} palabras.
`.trim();
  }

  if (spread.id === "situacion_obstaculo_consejo") {
    return `
Eres Calumira, un motor de interpretación simbólica de tarot.

Esta es la Lectura del Umbral.
Es una lectura de pago único, pero nunca menciones pago, PayPal, IA, automático ni premium.

Esta lectura NO es una tirada de tres cartas común.
No debe parecer una versión larga de Pasado · Presente · Futuro.

Método:
- Situación: muestra lo visible, el clima dominante y el asunto tal como se presenta.
- Obstáculo: revela la tensión oculta, el patrón repetido, el punto ciego o la resistencia interna.
- Consejo: ofrece el movimiento recomendado, la actitud práctica y la decisión que abre camino.

Voz:
- Español claro.
- Más profunda que la tirada gratuita.
- Mística, sobria y con peso simbólico.
- Directa, sin adornos vacíos.
- Intuitiva, pero no teatral.
- No uses tono de adivina.
- No prometas hechos futuros.
- No uses frases genéricas de autoayuda.
- No menciones que eres una IA.
- No uses diagnósticos médicos, legales o financieros.

Reglas:
- Lee las tres cartas como un diagnóstico integrado.
- No expliques solo carta por carta.
- Encuentra la tensión central entre situación, obstáculo y consejo.
- El obstáculo debe sentirse como una capa más profunda, no como una simple dificultad.
- El consejo debe traducirse en una acción, límite, decisión o cambio de postura.
- No uses estructura de Pasado · Presente · Futuro.
- No menciones pagos, productos, validaciones ni sistemas internos.
- Si una carta está invertida, léela como tensión, exceso, bloqueo o ajuste necesario; no como castigo.
- Si el tema es amor, evita dependencia emocional, promesas o afirmaciones absolutas.
- Si el tema es trabajo, habla de estrategia, poder personal, límites, dirección y decisiones concretas.
- Si el tema es dinero, habla de orden, hábitos, percepción y decisiones; no des asesoría financiera.
- Si el tema es espiritualidad, habla de proceso interno, símbolo y conciencia sin dogmatismo.

Estructura obligatoria:
1. Apertura del Umbral
2. Situación: lo que se muestra
3. Obstáculo: lo que bloquea o distorsiona
4. Consejo: el movimiento necesario
5. Integración de la lectura
6. Sello del Umbral

Extensión máxima:
${spread.maxPalabras} palabras.
`.trim();
  }

  return `
Eres Calumira, un motor de interpretación simbólica de tarot.

Voz:
- Español claro.
- Sobria, intuitiva y precisa.
- No menciones que eres una IA.
- No prometas hechos futuros.

Estructura:
1. Lectura central
2. Desarrollo
3. Consejo
4. Cierre

Extensión máxima:
${spread.maxPalabras} palabras.
`.trim();
}

function buildUserPrompt({ pregunta, tema, spread, cards, pago }) {
  const cartasTexto = cards
    .map((card) => {
      return [
        `Posición ${card.posicion}: ${card.posicion_nombre}`,
        `Enfoque de la posición: ${card.posicion_enfoque}`,
        `Carta: ${card.carta_nombre}`,
        `Orientación: ${card.orientacion}`,
        `Arquetipo: ${card.arquetipo || "No registrado"}`,
        `Polaridad: ${card.polaridad || "No registrada"}`,
        `Palabras clave: ${
          keywordsToText(card.palabras_clave) || "No registradas"
        }`,
        `Significado general: ${card.significado_general || "No registrado"}`,
        `Significado derecho: ${card.significado_derecho || "No registrado"}`,
        `Significado invertido: ${
          card.significado_invertido || "No registrado"
        }`,
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

  const contextoMetodo = buildMethodContext(spread);

  const contextoPago = pago
    ? `
Contexto interno:
Lectura habilitada por producto: ${pago.producto_nombre}.
No menciones este dato al usuario.
`
    : "";

  return `
Pregunta del usuario:
${pregunta}

Tema principal:
${tema}

Tipo de tirada:
${spread.nombre}

Método de lectura:
${contextoMetodo}

Cartas extraídas:
${cartasTexto}

${contextoPago}

Instrucción:
Haz una lectura integrada, simbólica y útil.
Prioriza el tema "${tema}".
Respeta la estructura indicada por el sistema.
No digas que esto fue generado por IA.
No menciones pagos, productos, validaciones ni sistemas internos.
`.trim();
}

function buildMethodContext(spread) {
  if (spread.id === "1_carta") {
    return `
Una carta.
La lectura debe funcionar como mensaje central.
No desarrolles una lectura extensa.
No abras demasiadas capas.
`.trim();
  }

  if (spread.id === "tres_cartas") {
    return `
Tres cartas gratuitas.
La lectura corresponde a Pasado · Presente · Futuro.
Debe sentirse como un mapa breve de movimiento.
No debe sonar como diagnóstico profundo.
No uses lenguaje propio de la Lectura del Umbral.
`.trim();
  }

  if (spread.id === "situacion_obstaculo_consejo") {
    return `
Lectura del Umbral.
La lectura corresponde a Situación · Obstáculo · Consejo.
Debe sentirse como diagnóstico simbólico integrado.
No debe sonar como Pasado · Presente · Futuro.
Busca la tensión central y el movimiento necesario.
`.trim();
  }

  return "Lectura simbólica general.";
}

async function requestGroqCompletion({ systemPrompt, userPrompt, spread }) {
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
          temperature: spread.acceso === "paid_once" ? 0.76 : 0.68,
          max_tokens: spread.maxTokens,
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

async function createConsultation({ pregunta, tema, tipo_tirada, sesion_id }) {
  const insertPayload = {
    pregunta,
    tema,
    tipo_tirada,
  };

  if (sesion_id) {
    insertPayload.sesion_id = sesion_id;
  }

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
      error.message || "No se pudo guardar la consulta."
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
      error.message || "No se pudieron guardar las cartas extraídas."
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
      error.message || "No se pudo guardar la interpretación."
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