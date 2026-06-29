const numerologyMeanings = {
  1: {
    title: "El Iniciador",
    message: "Tu camino está marcado por independencia, voluntad y dirección propia. Vienes a iniciar procesos, abrir rutas y confiar más en tu capacidad de decidir."
  },
  2: {
    title: "El Mediador",
    message: "Tu energía se mueve a través de la sensibilidad, la cooperación y la intuición. Vienes a comprender el equilibrio entre escuchar al otro y no abandonarte."
  },
  3: {
    title: "El Creador",
    message: "Tu camino vibra con expresión, creatividad y comunicación. Vienes a darle forma a lo que sientes y convertir tu voz en puente."
  },
  4: {
    title: "El Constructor",
    message: "Tu energía pide estructura, disciplina y raíz. Vienes a construir algo sólido, pero sin convertir la seguridad en prisión."
  },
  5: {
    title: "El Explorador",
    message: "Tu camino trae movimiento, cambio y expansión. Vienes a experimentar, pero también a aprender cuándo la libertad necesita dirección."
  },
  6: {
    title: "El Guardián",
    message: "Tu vibración está ligada al cuidado, la belleza y la responsabilidad afectiva. Vienes a amar sin cargar lo que no te corresponde."
  },
  7: {
    title: "El Buscador",
    message: "Tu camino es interno, profundo y espiritual. Vienes a investigar, comprender y confiar en una sabiduría que no siempre necesita explicación."
  },
  8: {
    title: "El Manifestador",
    message: "Tu energía trabaja con poder, materia, logro y responsabilidad. Vienes a ordenar tu fuerza para construir prosperidad con conciencia."
  },
  9: {
    title: "El Sabio",
    message: "Tu camino contiene cierre, compasión y visión amplia. Vienes a integrar experiencias y transformar lo vivido en comprensión."
  },
  11: {
    title: "El Canal",
    message: "Tu vibración es intuitiva, inspiradora y sensible. Vienes a sostener una visión más elevada, sin perder conexión con tu cuerpo y tu realidad."
  },
  22: {
    title: "El Arquitecto",
    message: "Tu camino une visión espiritual con construcción concreta. Vienes a materializar ideas grandes, paso a paso, sin traicionar tu propósito."
  },
  33: {
    title: "El Maestro del Corazón",
    message: "Tu energía está ligada al servicio, la compasión y la enseñanza. Vienes a sanar desde la presencia, no desde el sacrificio."
  }
};

function calculateLifePath() {
  const birthdate = document.getElementById("birthdate").value;
  const result = document.getElementById("numerology-result");

  if (!birthdate) {
    result.innerHTML = `
      <div class="number-card">
        <span>Dato requerido</span>
        <h3>Ingresa tu fecha de nacimiento</h3>
        <p>El cálculo necesita día, mes y año para obtener tu número de vida.</p>
      </div>
    `;
    return;
  }

  const digits = birthdate.replaceAll("-", "").split("").map(Number);
  let total = digits.reduce((sum, num) => sum + num, 0);

  while (![11, 22, 33].includes(total) && total > 9) {
    total = total
      .toString()
      .split("")
      .map(Number)
      .reduce((sum, num) => sum + num, 0);
  }

  const data = numerologyMeanings[total];

  result.innerHTML = `
    <div class="number-card">
      <span>Número de vida</span>
      <h2>${total}</h2>
      <h3>${data.title}</h3>
      <p>${data.message}</p>
    </div>
  `;
}