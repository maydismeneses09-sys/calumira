const express = require("express");
const supabase = require("../services/supabase");
const { obtenerInterpretacion } = require("../services/groq");

const router = express.Router();

const TIPOS_TIRADA = {
  una_carta: 1,
  tres_cartas: 3,
  cruz_celta: 10,
};

const TAROT = [
  "El Loco",
  "El Mago",
  "La Sacerdotisa",
  "La Emperatriz",
  "El Emperador",
  "El Hierofante",
  "Los Enamorados",
  "El Carro",
  "La Fuerza",
  "El Ermitano",
  "La Rueda de la Fortuna",
  "La Justicia",
  "El Colgado",
  "La Muerte",
  "La Templanza",
  "El Diablo",
  "La Torre",
  "La Estrella",
  "La Luna",
  "El Sol",
  "El Juicio",
  "El Mundo",
  "As de Bastos",
  "Dos de Bastos",
  "Tres de Bastos",
  "Cuatro de Bastos",
  "Cinco de Bastos",
  "Seis de Bastos",
  "Siete de Bastos",
  "Ocho de Bastos",
  "Nueve de Bastos",
  "Diez de Bastos",
  "Sota de Bastos",
  "Caballero de Bastos",
  "Reina de Bastos",
  "Rey de Bastos",
  "As de Copas",
  "Dos de Copas",
  "Tres de Copas",
  "Cuatro de Copas",
  "Cinco de Copas",
  "Seis de Copas",
  "Siete de Copas",
  "Ocho de Copas",
  "Nueve de Copas",
  "Diez de Copas",
  "Sota de Copas",
  "Caballero de Copas",
  "Reina de Copas",
  "Rey de Copas",
  "As de Espadas",
  "Dos de Espadas",
  "Tres de Espadas",
  "Cuatro de Espadas",
  "Cinco de Espadas",
  "Seis de Espadas",
  "Siete de Espadas",
  "Ocho de Espadas",
  "Nueve de Espadas",
  "Diez de Espadas",
  "Sota de Espadas",
  "Caballero de Espadas",
  "Reina de Espadas",
  "Rey de Espadas",
  "As de Oros",
  "Dos de Oros",
  "Tres de Oros",
  "Cuatro de Oros",
  "Cinco de Oros",
  "Seis de Oros",
  "Siete de Oros",
  "Ocho de Oros",
  "Nueve de Oros",
  "Diez de Oros",
  "Sota de Oros",
  "Caballero de Oros",
  "Reina de Oros",
  "Rey de Oros",
];

function elegirCartas(cantidad) {
  return [...TAROT]
    .sort(() => Math.random() - 0.5)
    .slice(0, cantidad)
    .map((nombre) => ({
      nombre,
      invertida: Math.random() < 0.5,
    }));
}

function construirPrompt({ pregunta, tipo, cartas }) {
  const cartasTexto = cartas
    .map((carta, index) => {
      const posicion = carta.invertida ? "invertida" : "derecha";
      return `${index + 1}. ${carta.nombre} (${posicion})`;
    })
    .join("\n");

  return [
    `Pregunta: ${pregunta}`,
    `Tipo de tirada: ${tipo}`,
    "Cartas:",
    cartasTexto,
    "",
    "Interpreta la tirada en espanol. Incluye una lectura integrada, el mensaje principal y una recomendacion practica. No prometas resultados ni presentes la lectura como destino fijo.",
  ].join("\n");
}

router.post("/tirada", async (req, res, next) => {
  try {
    const { pregunta, tipo } = req.body;

    if (!pregunta || typeof pregunta !== "string") {
      return res.status(400).json({ error: "La pregunta es obligatoria" });
    }

    if (!TIPOS_TIRADA[tipo]) {
      return res.status(400).json({
        error: "Tipo de tirada invalido",
        tiposPermitidos: Object.keys(TIPOS_TIRADA),
      });
    }

    const cartas = elegirCartas(TIPOS_TIRADA[tipo]);
    const prompt = construirPrompt({ pregunta, tipo, cartas });
    const interpretacion = await obtenerInterpretacion(prompt);

    const { error } = await supabase.from("tiradas").insert({
      pregunta,
      tipo,
      cartas,
      interpretacion,
    });

    if (error) {
      throw new Error(`Error guardando tirada en Supabase: ${error.message}`);
    }

    res.json({
      cartas,
      interpretacion,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
