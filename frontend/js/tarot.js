const cards = [
  {
    name: "El Loco",
    meaning: "Inicio, salto de fe, libertad, camino nuevo.",
    message: "La situación pide apertura. No necesitas tener todo resuelto antes de avanzar."
  },
  {
    name: "La Sacerdotisa",
    meaning: "Intuición, silencio, misterio, sabiduría interna.",
    message: "La respuesta no está en forzar. Observa más. Algo todavía no ha sido revelado."
  },
  {
    name: "La Emperatriz",
    meaning: "Fertilidad, creación, cuidado, expansión.",
    message: "Hay algo creciendo. Cuídalo con paciencia antes de exigir resultados."
  },
  {
    name: "El Emperador",
    meaning: "Orden, estructura, límites, autoridad.",
    message: "Necesitas tomar control desde la calma. Define límites y actúa con firmeza."
  },
  {
    name: "La Muerte",
    meaning: "Cierre, transformación, cambio inevitable.",
    message: "Algo ya cumplió su ciclo. Soltarlo libera energía para una nueva etapa."
  },
  {
    name: "La Estrella",
    meaning: "Esperanza, guía, sanación, inspiración.",
    message: "Hay claridad disponible, pero llega desde la confianza y no desde la urgencia."
  },
  {
    name: "La Luna",
    meaning: "Confusión, sueño, intuición, emociones ocultas.",
    message: "No todo está claro todavía. Evita decidir desde el miedo o la ansiedad."
  },
  {
    name: "El Sol",
    meaning: "Claridad, vitalidad, verdad, expansión.",
    message: "La verdad tiende a mostrarse. Busca lo simple: ahí está la respuesta."
  }
];

function drawCards(amount) {
  const question = document.getElementById("oracle-question").value.trim();
  const result = document.getElementById("oracle-result");

  if (!question) {
    result.innerHTML = `
      <div class="oracle-warning">
        Escribe una pregunta antes de consultar el oráculo.
      </div>
    `;
    return;
  }

  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, amount);

  let html = `
    <div class="oracle-reading">
      <p class="section-kicker">Resultado simbólico</p>
      <h2>Tu mensaje del Oráculo</h2>
      <p class="oracle-question"><strong>Pregunta:</strong> ${question}</p>

      <div class="oracle-cards">
  `;

  selected.forEach((card, index) => {
    const position =
      amount === 1
        ? "Mensaje central"
        : index === 0
        ? "Energía actual"
        : index === 1
        ? "Lo que necesitas comprender"
        : "Orientación";

    html += `
      <article class="oracle-card">
        <span>${position}</span>
        <h3>${card.name}</h3>
        <p class="oracle-meaning">${card.meaning}</p>
        <p>${card.message}</p>
      </article>
    `;
  });

  html += `
      </div>

      <button class="btn secondary" onclick="resetOracle()">
        Hacer otra pregunta
      </button>
    </div>
  `;

  result.innerHTML = html;
}

function resetOracle() {
  document.getElementById("oracle-question").value = "";
  document.getElementById("oracle-result").innerHTML = "";
}