const CALUMIRA_API = "/.netlify/functions";

const UMBRAL_PRODUCT_ID = "lectura_umbral";
const UMBRAL_SPREAD_ID = "situacion_obstaculo_consejo";
const UMBRAL_STORAGE_KEY = "calumira_umbral_pending";

document.addEventListener("DOMContentLoaded", () => {
  injectOracleStyles();
  injectUmbralButton();
  handlePayPalReturn();
});

window.drawCards = async function drawCards(cardCount) {
  const question = getQuestion();
  const topic = getTopic();

  if (!question) {
    renderMessage("Escribe una pregunta antes de abrir el Oráculo.", "warning");
    return;
  }

  const tipoTirada = Number(cardCount) === 3 ? "3_cartas" : "1_carta";

  setLoading(
    Number(cardCount) === 3
      ? "Abriendo una tirada de tres cartas..."
      : "Abriendo una carta..."
  );

  try {
    const data = await postJSON(`${CALUMIRA_API}/tarot-ai`, {
      pregunta: question,
      tema: topic,
      tipo_tirada: tipoTirada,
      consentimiento: true,
    });

    if (!data.ok) {
      throw new Error(data.message || "No se pudo generar la lectura.");
    }

    renderReading(data, {
      showUmbralInvite: true,
    });
  } catch (error) {
    console.error("[calumira-free-reading-error]", error);
    renderMessage(error.message || "No se pudo abrir la lectura.", "error");
  }
};

window.startUmbralPayment = async function startUmbralPayment() {
  const question = getQuestion();
  const topic = getTopic();

  if (!question) {
    renderMessage("Escribe una pregunta antes de abrir la Lectura del Umbral.", "warning");
    return;
  }

  savePendingUmbralReading({
    pregunta: question,
    tema: topic,
  });

  setLoading("Preparando la Lectura del Umbral...");

  try {
    const data = await postJSON(`${CALUMIRA_API}/paypal-create-order`, {
      producto_id: UMBRAL_PRODUCT_ID,
    });

    if (!data.ok) {
      throw new Error(data.message || "No se pudo iniciar el pago.");
    }

    const approvalUrl = data?.paypal?.approval_url;

    if (!approvalUrl) {
      throw new Error("PayPal no devolvió un enlace de aprobación.");
    }

    window.location.href = approvalUrl;
  } catch (error) {
    console.error("[calumira-paypal-start-error]", error);
    renderMessage(error.message || "No se pudo iniciar el pago.", "error");
  }
};

async function handlePayPalReturn() {
  const params = new URLSearchParams(window.location.search);
  const paypalStatus = params.get("paypal");
  const orderId = params.get("token");

  if (!paypalStatus) return;

  if (paypalStatus === "cancel") {
    clearPayPalParams();
    renderMessage("La Lectura del Umbral fue cancelada. No se realizó ningún cargo.", "warning");
    return;
  }

  if (paypalStatus !== "success") return;

  if (!orderId) {
    clearPayPalParams();
    renderMessage("PayPal regresó sin número de orden. No se puede continuar.", "error");
    return;
  }

  const pending = getPendingUmbralReading();

  if (!pending?.pregunta) {
    clearPayPalParams();
    renderMessage(
      "El pago fue aprobado, pero no encontré la pregunta original. Vuelve a escribirla y contáctame si el pago quedó registrado.",
      "error"
    );
    return;
  }

  setLoading("Confirmando el pago y abriendo la Lectura del Umbral...");

  try {
    const capture = await postJSON(`${CALUMIRA_API}/paypal-capture-order`, {
      paypal_order_id: orderId,
    });

    if (!capture.ok) {
      throw new Error(capture.message || "No se pudo confirmar el pago.");
    }

    const reading = await postJSON(`${CALUMIRA_API}/tarot-ai`, {
      pregunta: pending.pregunta,
      tema: pending.tema || "general",
      tipo_tirada: UMBRAL_SPREAD_ID,
      consentimiento: true,
      paypal_order_id: orderId,
    });

    if (!reading.ok) {
      throw new Error(reading.message || "El pago fue aprobado, pero no se pudo generar la lectura.");
    }

    localStorage.removeItem(UMBRAL_STORAGE_KEY);
    clearPayPalParams();

    renderReading(reading, {
      showUmbralInvite: false,
      paidSuccess: true,
    });
  } catch (error) {
    console.error("[calumira-paypal-return-error]", error);
    renderMessage(error.message || "No se pudo completar la Lectura del Umbral.", "error");
  }
}

function getQuestion() {
  const textarea = document.querySelector("#oracle-question");
  return String(textarea?.value || "").trim();
}

function getTopic() {
  const topicField =
    document.querySelector("#oracle-topic") ||
    document.querySelector("[name='tema']") ||
    document.querySelector("[name='topic']");

  const value = String(topicField?.value || "general").trim().toLowerCase();

  const allowed = ["general", "amor", "trabajo", "dinero", "espiritualidad"];
  return allowed.includes(value) ? value : "general";
}

async function postJSON(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!data) {
    throw new Error("Respuesta inválida del servidor.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Error del servidor.");
  }

  return data;
}

function savePendingUmbralReading(payload) {
  localStorage.setItem(
    UMBRAL_STORAGE_KEY,
    JSON.stringify({
      ...payload,
      created_at: new Date().toISOString(),
    })
  );
}

function getPendingUmbralReading() {
  try {
    const raw = localStorage.getItem(UMBRAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearPayPalParams() {
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

function setLoading(message) {
  const result = getResultContainer();

  result.innerHTML = `
    <div class="calumira-status-card">
      <div class="calumira-loader-symbol">☾ ✦ ☉ ✦ ☽</div>
      <p>${escapeHTML(message)}</p>
    </div>
  `;

  scrollToResult();
}

function renderMessage(message, type = "info") {
  const result = getResultContainer();

  result.innerHTML = `
    <div class="calumira-message calumira-message-${type}">
      <p>${escapeHTML(message)}</p>
    </div>
  `;

  scrollToResult();
}

function renderReading(data, options = {}) {
  const result = getResultContainer();
  const cards = Array.isArray(data.cartas) ? data.cartas : [];
  const interpretationText = data?.interpretacion?.texto || data?.lectura || "";

  const title = data?.tirada?.nombre || data?.tirada || getSpreadTitle(data?.tipo_tirada);
  const isPaid = Boolean(options.paidSuccess || data?.pago);

  result.innerHTML = `
    <section class="calumira-reading-result">
      ${
        isPaid
          ? `
            <div class="calumira-success-pill">
              El Umbral se ha abierto
            </div>
          `
          : ""
      }

      <h2>${escapeHTML(title || "Lectura")}</h2>

      <div class="calumira-cards-grid">
        ${cards.map(renderCard).join("")}
      </div>

      <article class="calumira-interpretation">
        <h3>Interpretación</h3>
        ${formatInterpretation(interpretationText)}
      </article>

      <div class="calumira-reading-meta">
        ${
          data.consulta_id
            ? `<p><strong>Consulta:</strong> ${escapeHTML(data.consulta_id)}</p>`
            : ""
        }
        ${
          data?.interpretacion?.modelo
            ? `<p><strong>Modelo:</strong> ${escapeHTML(data.interpretacion.modelo)}</p>`
            : ""
        }
        ${
          data?.interpretacion?.duracion_ms
            ? `<p><strong>Tiempo:</strong> ${escapeHTML(String(data.interpretacion.duracion_ms))} ms</p>`
            : ""
        }
      </div>

      ${
        options.showUmbralInvite
          ? renderUmbralInvite()
          : ""
      }
    </section>
  `;

  scrollToResult();
}

function renderCard(card) {
  const keywords = Array.isArray(card.palabras_clave)
    ? card.palabras_clave.join(", ")
    : card.palabras_clave || "";

  return `
    <article class="calumira-card">
      <p class="calumira-card-position">${escapeHTML(card.posicion_nombre || "Carta")}</p>
      <h3>${escapeHTML(card.nombre || card.carta || "Arcano")}</h3>

      <p><strong>Orientación:</strong> ${escapeHTML(card.orientacion || "derecha")}</p>
      ${
        card.arquetipo
          ? `<p><strong>Arquetipo:</strong> ${escapeHTML(card.arquetipo)}</p>`
          : ""
      }
      ${
        card.polaridad
          ? `<p><strong>Polaridad:</strong> ${escapeHTML(card.polaridad)}</p>`
          : ""
      }
      ${
        keywords
          ? `<p><strong>Palabras clave:</strong> ${escapeHTML(keywords)}</p>`
          : ""
      }
    </article>
  `;
}

function renderUmbralInvite() {
  return `
    <aside class="calumira-umbral-invite">
      <p class="section-kicker">Lectura profunda</p>
      <h3>Lectura del Umbral</h3>
      <p>
        Abre una lectura más profunda sobre la situación, el obstáculo y el movimiento recomendado.
      </p>
      <button class="btn primary calumira-umbral-btn" onclick="startUmbralPayment()">
        Abrir Lectura del Umbral · USD 5.99
      </button>
    </aside>
  `;
}

function formatInterpretation(text) {
  const safe = escapeHTML(text || "No se recibió interpretación.");

  return safe
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function getSpreadTitle(tipoTirada) {
  if (tipoTirada === "1_carta") return "Una carta";
  if (tipoTirada === "tres_cartas" || tipoTirada === "3_cartas") return "Tres cartas";
  if (tipoTirada === "situacion_obstaculo_consejo") return "Lectura del Umbral";
  return "Lectura";
}

function getResultContainer() {
  let result = document.querySelector("#oracle-result");

  if (!result) {
    result = document.createElement("div");
    result.id = "oracle-result";
    result.className = "oracle-result";

    const oraclePage = document.querySelector(".oracle-page") || document.body;
    oraclePage.appendChild(result);
  }

  return result;
}

function scrollToResult() {
  const result = getResultContainer();
  result.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function injectUmbralButton() {
  const options = document.querySelector(".oracle-options");

  if (!options) return;
  if (document.querySelector(".calumira-umbral-option")) return;

  const wrapper = document.createElement("div");
  wrapper.className = "calumira-umbral-option";

  wrapper.innerHTML = `
    <button class="btn primary calumira-umbral-option-btn" onclick="startUmbralPayment()">
      Lectura del Umbral · USD 5.99
    </button>
    <p>
      Situación · Obstáculo · Consejo
    </p>
  `;

  options.appendChild(wrapper);
}

function injectOracleStyles() {
  if (document.querySelector("#calumira-oracle-js-styles")) return;

  const style = document.createElement("style");
  style.id = "calumira-oracle-js-styles";

  style.textContent = `
    .calumira-status-card,
    .calumira-message,
    .calumira-reading-result {
      width: min(1100px, 100%);
      margin: 0 auto;
      background: rgba(8, 8, 8, .94);
      border: 1px solid rgba(216,177,111,.25);
      border-radius: 32px;
      padding: 42px;
      color: #f5f1eb;
      text-align: left;
    }

    .calumira-status-card {
      text-align: center;
    }

    .calumira-loader-symbol {
      color: #e8c98e;
      letter-spacing: .3em;
      margin-bottom: 18px;
    }

    .calumira-message-warning {
      border-color: rgba(232, 201, 142, .45);
    }

    .calumira-message-error {
      border-color: rgba(255, 120, 120, .45);
    }

    .calumira-reading-result h2 {
      font-family: "Cormorant Garamond", serif;
      font-size: clamp(3rem, 6vw, 5rem);
      text-align: center;
      margin-bottom: 38px;
      color: #f5f1eb;
    }

    .calumira-success-pill {
      width: fit-content;
      margin: 0 auto 24px;
      padding: 10px 18px;
      border: 1px solid rgba(216,177,111,.35);
      border-radius: 999px;
      color: #e8c98e;
      text-transform: uppercase;
      letter-spacing: .16em;
      font-size: .75rem;
    }

    .calumira-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 42px;
    }

    .calumira-card {
      background: #050505;
      border: 1px solid rgba(216,177,111,.22);
      border-radius: 26px;
      padding: 28px;
    }

    .calumira-card-position {
      color: #e8c98e;
      text-transform: uppercase;
      letter-spacing: .18em;
      font-size: .78rem;
      margin-bottom: 18px;
    }

    .calumira-card h3 {
      font-family: "Cormorant Garamond", serif;
      font-size: 2.4rem;
      margin-bottom: 22px;
      color: #f5f1eb;
    }

    .calumira-card p,
    .calumira-interpretation p,
    .calumira-reading-meta p,
    .calumira-umbral-invite p,
    .calumira-umbral-option p {
      color: #d8d0c4;
      line-height: 1.75;
    }

    .calumira-interpretation {
      border-top: 1px solid rgba(216,177,111,.18);
      padding-top: 34px;
    }

    .calumira-interpretation h3 {
      font-family: "Cormorant Garamond", serif;
      font-size: 3rem;
      text-align: center;
      margin-bottom: 28px;
      color: #f5f1eb;
    }

    .calumira-interpretation strong {
      color: #f5f1eb;
    }

    .calumira-reading-meta {
      margin-top: 36px;
      padding-top: 24px;
      border-top: 1px solid rgba(216,177,111,.14);
      opacity: .75;
      font-size: .92rem;
    }

    .calumira-umbral-invite {
      margin-top: 42px;
      padding: 34px;
      border: 1px solid rgba(216,177,111,.3);
      border-radius: 28px;
      text-align: center;
      background: rgba(216,177,111,.045);
    }

    .calumira-umbral-invite h3 {
      font-family: "Cormorant Garamond", serif;
      font-size: 2.8rem;
      color: #f5f1eb;
      margin-bottom: 14px;
    }

    .calumira-umbral-btn {
      margin-top: 24px;
      min-width: 290px;
    }

    .calumira-umbral-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      text-align: center;
    }

    .calumira-umbral-option-btn {
      min-width: 300px;
      min-height: 66px;
    }

    .calumira-umbral-option p {
      font-size: .9rem;
      color: rgba(216, 177, 111, .75);
      margin: 0;
    }

    @media (max-width: 768px) {
      .calumira-status-card,
      .calumira-message,
      .calumira-reading-result {
        padding: 28px;
      }

      .calumira-umbral-btn,
      .calumira-umbral-option-btn {
        width: 100%;
        min-width: unset;
      }
    }
  `;

  document.head.appendChild(style);
}