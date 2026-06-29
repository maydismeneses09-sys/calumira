const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

async function obtenerInterpretacion(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Falta GROQ_API_KEY");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Eres un lector de tarot claro, simbolico y respetuoso. Das interpretaciones utiles, cuidadosas y sin afirmar certezas absolutas.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 900,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || "Error consultando Groq";
    throw new Error(message);
  }

  return data.choices?.[0]?.message?.content?.trim() || "";
}

module.exports = {
  obtenerInterpretacion,
};
