const dailyCards = [
  {
    name: "El Loco",
    keyword: "Inicio · Libertad · Movimiento",
    message: "Hoy se abre una posibilidad nueva. No necesitas controlar todo el camino; basta con dar el primer paso con presencia."
  },
  {
    name: "La Sacerdotisa",
    keyword: "Intuición · Silencio · Observación",
    message: "Hoy escucha más de lo que explicas. Hay información sutil que solo aparece cuando bajas el ruido."
  },
  {
    name: "La Emperatriz",
    keyword: "Creación · Cuidado · Expansión",
    message: "Hoy nutre lo que quieres ver crecer. La energía favorece lo fértil, lo sensible y lo que se construye con paciencia."
  },
  {
    name: "El Emperador",
    keyword: "Orden · Límites · Dirección",
    message: "Hoy necesitas estructura. Define prioridades, ordena tu energía y actúa desde una autoridad tranquila."
  },
  {
    name: "El Ermitaño",
    keyword: "Interioridad · Sabiduría · Pausa",
    message: "Hoy la respuesta llega al tomar distancia. No todo requiere reacción inmediata."
  },
  {
    name: "La Justicia",
    keyword: "Verdad · Equilibrio · Decisión",
    message: "Hoy observa los hechos sin adornarlos. La claridad aparece cuando eliges con honestidad."
  },
  {
    name: "La Muerte",
    keyword: "Cierre · Transformación · Renacimiento",
    message: "Hoy algo pide terminar su ciclo. Soltar no siempre es pérdida; a veces es recuperación de energía."
  },
  {
    name: "La Estrella",
    keyword: "Esperanza · Sanación · Guía",
    message: "Hoy vuelve a confiar en tu proceso. Hay una luz discreta guiando el camino, aunque todavía no veas todo."
  },
  {
    name: "La Luna",
    keyword: "Sueño · Emoción · Misterio",
    message: "Hoy evita decidir desde la confusión. Observa tus emociones sin convertirlas en sentencia."
  },
  {
    name: "El Sol",
    keyword: "Claridad · Vitalidad · Verdad",
    message: "Hoy algo se ilumina. Busca lo simple, lo honesto y lo que te devuelve energía."
  }
];

function drawDailyCard() {
  const card = dailyCards[Math.floor(Math.random() * dailyCards.length)];
  const container = document.getElementById("daily-card");

  container.innerHTML = `
    <h2 class="daily-card-name">${card.name}</h2>
    <p class="daily-keyword">${card.keyword}</p>
    <p class="daily-message">${card.message}</p>

    <button class="btn secondary" onclick="drawDailyCard()">
      Sacar otra carta
    </button>
  `;
}