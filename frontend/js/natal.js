const zodiacData = [
  {
    sign: "Aries",
    start: "03-21",
    end: "04-19",
    element: "Fuego",
    modality: "Cardinal",
    polarity: "Yang",
    ruler: "Marte",
    archetype: "El Iniciador",
    phrase: "Yo inicio.",
    essence: "Tu energía busca movimiento, decisión y la capacidad de abrir nuevos caminos.",
    gifts: "Coraje, iniciativa, independencia y capacidad de actuar rápidamente.",
    shadow: "Impaciencia, impulsividad y dificultad para sostener procesos largos.",
    lesson: "Aprender que iniciar algo es solo la primera parte del camino.",
    relationship: "En vínculos necesitas honestidad, movimiento y libertad. Te apaga sentir que debes pedir permiso para ser tú.",
    career: "Funcionas bien liderando, emprendiendo, resolviendo rápido o creando algo desde cero.",
    emotionalKey: "Tu fuego necesita dirección. Sin un objetivo claro, puede convertirse en ansiedad o irritación.",
    spiritualLesson: "Canalizar el impulso sin quemarte. La fuerza madura cuando aprende a sostener.",
    currentMessage: "Este momento te pide actuar con claridad, pero sin atropellarte. El primer paso importa, pero también la dirección.",
    potential: "Tu potencial aparece cuando transformas impulso en liderazgo consciente.",
    affirmation: "Mi impulso tiene dirección y mi fuego construye."
  },
  {
    sign: "Tauro",
    start: "04-20",
    end: "05-20",
    element: "Tierra",
    modality: "Fijo",
    polarity: "Yin",
    ruler: "Venus",
    archetype: "El Guardián de la Forma",
    phrase: "Yo sostengo.",
    essence: "Tu energía busca estabilidad, cuerpo, placer, belleza y construcción paciente.",
    gifts: "Constancia, sensualidad, sentido práctico y capacidad para sostener lo valioso.",
    shadow: "Apego, resistencia al cambio y miedo a perder seguridad.",
    lesson: "Comprender que la seguridad verdadera también sabe adaptarse.",
    relationship: "En vínculos necesitas presencia, lealtad y hechos. Las promesas vacías no te sostienen.",
    career: "Tienes potencial para construir recursos, proyectos estables, belleza, finanzas o espacios con valor real.",
    emotionalKey: "Tu calma es poder, pero si se vuelve rigidez puede impedir que la vida se renueve.",
    spiritualLesson: "Aprender a soltar sin sentir que pierdes tu centro.",
    currentMessage: "Este momento te pide cuidar tu base: cuerpo, dinero, hogar, rutinas y decisiones concretas.",
    potential: "Tu potencial florece cuando unes paciencia con apertura al cambio.",
    affirmation: "Construyo con paciencia. Lo que tiene raíz puede florecer."
  },
  {
    sign: "Géminis",
    start: "05-21",
    end: "06-20",
    element: "Aire",
    modality: "Mutable",
    polarity: "Yang",
    ruler: "Mercurio",
    archetype: "El Mensajero",
    phrase: "Yo conecto.",
    essence: "Tu energía se expresa a través de la palabra, la curiosidad y el intercambio.",
    gifts: "Comunicación, inteligencia rápida, adaptabilidad y capacidad para unir ideas.",
    shadow: "Dispersión, exceso mental y dificultad para profundizar.",
    lesson: "Convertir información en sabiduría.",
    relationship: "En vínculos necesitas conversación, juego mental y libertad. El silencio impuesto puede sentirse como encierro.",
    career: "Funcionas bien escribiendo, enseñando, vendiendo, conectando personas o creando contenido.",
    emotionalKey: "Tu mente necesita movimiento, pero también pausas. No todo pensamiento debe convertirse en decisión.",
    spiritualLesson: "Aprender a escuchar el silencio entre una idea y otra.",
    currentMessage: "Este momento te pide ordenar la mente y elegir una sola dirección para avanzar.",
    potential: "Tu potencial aparece cuando tu inteligencia se vuelve puente y no ruido.",
    affirmation: "Mi mente es puente. Comunico con claridad."
  },
  {
    sign: "Cáncer",
    start: "06-21",
    end: "07-22",
    element: "Agua",
    modality: "Cardinal",
    polarity: "Yin",
    ruler: "La Luna",
    archetype: "El Protector",
    phrase: "Yo siento.",
    essence: "Tu energía se mueve desde la memoria, la sensibilidad y el cuidado.",
    gifts: "Intuición emocional, empatía, protección y capacidad para crear refugio.",
    shadow: "Apego al pasado, defensividad y tendencia a cargar emociones ajenas.",
    lesson: "Cuidar sin perderte.",
    relationship: "En vínculos necesitas seguridad emocional, ternura y pertenencia. Percibes lo no dicho con fuerza.",
    career: "Tienes potencial en espacios de cuidado, acompañamiento, comunidad, memoria, hogar o nutrición emocional.",
    emotionalKey: "Tu sensibilidad es brújula, pero necesita límites para no convertirse en absorción.",
    spiritualLesson: "Aprender que protegerte también es una forma de amar.",
    currentMessage: "Este momento te pide distinguir qué emoción es tuya y cuál estás tomando del entorno.",
    potential: "Tu potencial crece cuando conviertes sensibilidad en intuición madura.",
    affirmation: "Honro mi sensibilidad sin abandonar mis límites."
  },
  {
    sign: "Leo",
    start: "07-23",
    end: "08-22",
    element: "Fuego",
    modality: "Fijo",
    polarity: "Yang",
    ruler: "El Sol",
    archetype: "El Soberano Solar",
    phrase: "Yo brillo.",
    essence: "Tu energía busca expresión, presencia, creatividad y autenticidad.",
    gifts: "Carisma, generosidad, liderazgo creativo y magnetismo.",
    shadow: "Orgullo, necesidad de reconocimiento y miedo a no ser visto.",
    lesson: "Brillar sin depender del aplauso.",
    relationship: "En vínculos necesitas admiración mutua, lealtad y alegría. La indiferencia te apaga.",
    career: "Funcionas bien liderando, creando, enseñando, mostrando una visión o sosteniendo una presencia visible.",
    emotionalKey: "Tu corazón necesita expresión. Cuando reprimes tu brillo, buscas validación donde no hay nutrición.",
    spiritualLesson: "Reconocer que tu luz no necesita permiso.",
    currentMessage: "Este momento te pide ocupar tu lugar sin pedir disculpas por tu presencia.",
    potential: "Tu potencial aparece cuando lideras desde el corazón y no desde el ego herido.",
    affirmation: "Mi luz nace de mi centro. Ocupo mi lugar."
  },
  {
    sign: "Virgo",
    start: "08-23",
    end: "09-22",
    element: "Tierra",
    modality: "Mutable",
    polarity: "Yin",
    ruler: "Mercurio",
    archetype: "El Alquimista de lo Útil",
    phrase: "Yo ordeno.",
    essence: "Tu energía busca mejorar, discernir, ordenar y servir desde lo concreto.",
    gifts: "Análisis, método, precisión y capacidad para sanar procesos.",
    shadow: "Perfeccionismo, autocrítica y exceso de control.",
    lesson: "Servir sin sacrificarte.",
    relationship: "En vínculos demuestras amor con actos concretos, atención y cuidado práctico. Necesitas reciprocidad.",
    career: "Tienes potencial en análisis, salud, escritura técnica, organización, procesos y mejora continua.",
    emotionalKey: "Tu deseo de mejorar puede volverse castigo si olvidas que lo imperfecto también tiene valor.",
    spiritualLesson: "Comprender que la pureza no está en hacerlo todo perfecto.",
    currentMessage: "Este momento te pide simplificar, ordenar y dejar de exigirte más de lo necesario.",
    potential: "Tu potencial emerge cuando conviertes precisión en servicio consciente.",
    affirmation: "Ordeno mi energía sin exigirme desaparecer."
  },
  {
    sign: "Libra",
    start: "09-23",
    end: "10-22",
    element: "Aire",
    modality: "Cardinal",
    polarity: "Yang",
    ruler: "Venus",
    archetype: "El Tejedor de Equilibrio",
    phrase: "Yo armonizo.",
    essence: "Tu energía busca vínculo, belleza, justicia, equilibrio y elección consciente.",
    gifts: "Diplomacia, estética, escucha, estrategia social y sensibilidad relacional.",
    shadow: "Indecisión, complacencia y pérdida de centro por agradar.",
    lesson: "Elegir sin pedir permiso interno al mundo.",
    relationship: "En vínculos necesitas reciprocidad, respeto, belleza y conversación. La rudeza emocional te desgasta.",
    career: "Funcionas bien mediando, diseñando, asesorando, negociando o creando armonía entre partes.",
    emotionalKey: "Tu paz no puede depender de evitar toda incomodidad.",
    spiritualLesson: "Aprender que una decisión clara también puede ser una forma de armonía.",
    currentMessage: "Este momento te pide elegir desde tu centro, no desde el miedo a incomodar.",
    potential: "Tu potencial aparece cuando conviertes sensibilidad relacional en criterio propio.",
    affirmation: "Mi armonía nace de mi centro."
  },
  {
    sign: "Escorpio",
    start: "10-23",
    end: "11-21",
    element: "Agua",
    modality: "Fijo",
    polarity: "Yin",
    ruler: "Plutón / Marte",
    archetype: "El Guardián de la Sombra",
    phrase: "Yo transformo.",
    essence: "Tu energía habita la intensidad, la profundidad y la transformación.",
    gifts: "Percepción psicológica, magnetismo, resiliencia y poder de regeneración.",
    shadow: "Control, sospecha, apego al dolor y miedo a la vulnerabilidad.",
    lesson: "Transformarte sin destruirte.",
    relationship: "En vínculos necesitas verdad, lealtad e intimidad real. Lo superficial no te sostiene.",
    career: "Tienes potencial en investigación, psicología, crisis, recursos compartidos, transformación o procesos profundos.",
    emotionalKey: "Tu profundidad es medicina, pero puede volverse prisión si todo se vive como amenaza.",
    spiritualLesson: "Aprender que confiar no significa perder poder.",
    currentMessage: "Este momento te pide mirar una verdad emocional sin defenderte de ella.",
    potential: "Tu potencial aparece cuando transformas intensidad en sabiduría y regeneración.",
    affirmation: "Puedo mirar la verdad y seguir completa."
  },
  {
    sign: "Sagitario",
    start: "11-22",
    end: "12-21",
    element: "Fuego",
    modality: "Mutable",
    polarity: "Yang",
    ruler: "Júpiter",
    archetype: "El Buscador de Sentido",
    phrase: "Yo expando.",
    essence: "Tu energía busca verdad, libertad, aprendizaje y horizontes amplios.",
    gifts: "Optimismo, visión filosófica, entusiasmo y capacidad para inspirar.",
    shadow: "Exceso, evasión, dogmatismo y falta de sostén práctico.",
    lesson: "Bajar la visión a la práctica.",
    relationship: "En vínculos necesitas libertad, crecimiento y honestidad. Te asfixian las dinámicas demasiado cerradas.",
    career: "Funcionas bien enseñando, viajando, comunicando visión, explorando culturas o expandiendo proyectos.",
    emotionalKey: "Tu espíritu necesita amplitud, pero la expansión sin dirección puede dispersarte.",
    spiritualLesson: "Comprender que la verdad también necesita cuerpo.",
    currentMessage: "Este momento te pide tomar una idea grande y convertirla en un paso concreto.",
    potential: "Tu potencial aparece cuando unes visión, fe y disciplina práctica.",
    affirmation: "Mi libertad tiene propósito."
  },
  {
    sign: "Capricornio",
    start: "12-22",
    end: "01-19",
    element: "Tierra",
    modality: "Cardinal",
    polarity: "Yin",
    ruler: "Saturno",
    archetype: "El Arquitecto",
    phrase: "Yo construyo.",
    essence: "Tu energía busca estructura, responsabilidad, logro y dominio del tiempo.",
    gifts: "Disciplina, estrategia, madurez y capacidad de materializar.",
    shadow: "Rigidez, autoexigencia y miedo al fracaso.",
    lesson: "Construir sin endurecerte.",
    relationship: "En vínculos necesitas respeto, estabilidad y hechos. Confías más en la constancia que en la intensidad.",
    career: "Tienes potencial para liderar, administrar, planificar, construir empresas, sistemas o proyectos a largo plazo.",
    emotionalKey: "Tu fortaleza necesita descanso. No todo debe sostenerse desde la dureza.",
    spiritualLesson: "Aprender que tu valor no depende de tu rendimiento.",
    currentMessage: "Este momento te pide priorizar lo esencial y soltar una carga que no te corresponde.",
    potential: "Tu potencial aparece cuando conviertes ambición en obra consciente.",
    affirmation: "Construyo con paciencia sin abandonar mi humanidad."
  },
  {
    sign: "Acuario",
    start: "01-20",
    end: "02-18",
    element: "Aire",
    modality: "Fijo",
    polarity: "Yang",
    ruler: "Urano / Saturno",
    archetype: "El Visionario",
    phrase: "Yo libero.",
    essence: "Tu energía trae visión, diferencia, innovación y pensamiento colectivo.",
    gifts: "Originalidad, lucidez, independencia mental y mirada sistémica.",
    shadow: "Distancia emocional, rebeldía automática y aislamiento.",
    lesson: "Ser diferente sin desconectarte.",
    relationship: "En vínculos necesitas libertad, amistad, conversación y respeto por tu diferencia.",
    career: "Funcionas bien innovando, analizando sistemas, tecnología, comunidad o proyectos no convencionales.",
    emotionalKey: "Tu mente ve lejos, pero tu corazón también necesita presencia cercana.",
    spiritualLesson: "Encarnar la visión sin huir de lo humano.",
    currentMessage: "Este momento te pide compartir una idea y permitir que tome forma real.",
    potential: "Tu potencial aparece cuando tu diferencia se vuelve contribución.",
    affirmation: "Mi diferencia tiene propósito."
  },
  {
    sign: "Piscis",
    start: "02-19",
    end: "03-20",
    element: "Agua",
    modality: "Mutable",
    polarity: "Yin",
    ruler: "Neptuno / Júpiter",
    archetype: "El Místico",
    phrase: "Yo sueño.",
    essence: "Tu energía vibra con intuición, sensibilidad, imaginación y mundo simbólico.",
    gifts: "Empatía, inspiración, creatividad espiritual y percepción sutil.",
    shadow: "Confusión, evasión, idealización y límites difusos.",
    lesson: "Canalizar sin disolverte.",
    relationship: "En vínculos necesitas ternura, conexión espiritual y cuidado emocional, pero también límites claros.",
    career: "Tienes potencial en arte, sanación, acompañamiento, espiritualidad, música, símbolos o mundos imaginativos.",
    emotionalKey: "Tu sensibilidad necesita contención. El océano también necesita orilla.",
    spiritualLesson: "Aprender que la compasión no debe convertirse en sacrificio.",
    currentMessage: "Este momento te pide escuchar tu intuición, pero también poner límites concretos.",
    potential: "Tu potencial aparece cuando das forma a lo invisible sin perderte en ello.",
    affirmation: "Mi sensibilidad es guía. Mi energía tiene límites sanos."
  }
];

function generateNatalReading() {
  const name = document.getElementById("natal-name").value.trim();
  const date = document.getElementById("natal-date").value;
  const time = document.getElementById("natal-time").value;
  const place = document.getElementById("natal-place").value.trim();
  const result = document.getElementById("natal-result");

  if (!date) {
    result.innerHTML = `
      <div class="natal-card">
        <span>Dato requerido</span>
        <h2>Fecha faltante</h2>
        <p>Ingresa tu fecha de nacimiento.</p>
      </div>
    `;
    return;
  }

  const [, month, day] = date.split("-");
  const monthDay = `${month}-${day}`;
  const signData = getZodiacSign(monthDay);
  const displayName = name ? `${name}, ` : "";

  result.innerHTML = `
    <div class="natal-card natal-reading-expanded">
      <span>Lectura simbólica inicial</span>

      <div class="natal-header-symbols">
        ☉ ✦ ${getSignSymbol(signData.sign)} ✦ ${getElementSymbol(signData.element)}
      </div>

      <h2>Sol en ${signData.sign}</h2>

      <p class="natal-phrase">"${signData.phrase}"</p>

      <div class="natal-signature">
        ${signData.element} • ${signData.modality} • ${signData.polarity}
      </div>

      <div class="natal-meta">
        <div><small>Elemento</small><strong>${getElementSymbol(signData.element)} ${signData.element}</strong></div>
        <div><small>Modalidad</small><strong>✦ ${signData.modality}</strong></div>
        <div><small>Polaridad</small><strong>☾ ${signData.polarity}</strong></div>
        <div><small>Regente</small><strong>${signData.ruler}</strong></div>
        <div><small>Arquetipo</small><strong>${signData.archetype}</strong></div>
      </div>

      <section><h3>Energía central</h3><p>${displayName}${signData.essence}</p></section>
      <section><h3>Dones naturales</h3><p>${signData.gifts}</p></section>
      <section><h3>Sombra a observar</h3><p>${signData.shadow}</p></section>
      <section><h3>Clave emocional</h3><p>${signData.emotionalKey}</p></section>
      <section><h3>Vínculos y relaciones</h3><p>${signData.relationship}</p></section>
      <section><h3>Trabajo y propósito</h3><p>${signData.career}</p></section>
      <section><h3>Aprendizaje evolutivo</h3><p>${signData.lesson}</p></section>
      <section><h3>Lección espiritual</h3><p>${signData.spiritualLesson}</p></section>
      <section><h3>Potencial de desarrollo</h3><p>${signData.potential}</p></section>
      <section><h3>Mensaje para este momento</h3><p>${signData.currentMessage}</p></section>
      <section><h3>Afirmación</h3><p>${signData.affirmation}</p></section>

      <div class="natal-disclaimer">
        <p>
          Esta lectura utiliza tu signo solar como punto de partida.
          ${time ? "La hora registrada permitirá incorporar más adelante el Ascendente, la Luna, las casas astrológicas y los principales aspectos planetarios." : "Para generar una carta natal completa será necesaria la hora exacta de nacimiento."}
          ${place ? ` Lugar registrado: ${place}.` : " El lugar de nacimiento también será necesario para un cálculo astrológico completo."}
        </p>
      </div>
    </div>
  `;
}

function getZodiacSign(monthDay) {
  for (const item of zodiacData) {
    if (item.start <= item.end) {
      if (monthDay >= item.start && monthDay <= item.end) return item;
    } else {
      if (monthDay >= item.start || monthDay <= item.end) return item;
    }
  }

  return zodiacData[0];
}

function getElementSymbol(element) {
  const symbols = {
    Fuego: "🜂",
    Tierra: "🜃",
    Aire: "🜁",
    Agua: "🜄"
  };

  return symbols[element] || "✦";
}

function getSignSymbol(sign) {
  const symbols = {
    Aries: "♈",
    Tauro: "♉",
    Géminis: "♊",
    Cáncer: "♋",
    Leo: "♌",
    Virgo: "♍",
    Libra: "♎",
    Escorpio: "♏",
    Sagitario: "♐",
    Capricornio: "♑",
    Acuario: "♒",
    Piscis: "♓"
  };

  return symbols[sign] || "☉";
}