"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

const faqData: FAQItem[] = [
  {
    question: "¿Qué es el Desmoche?",
    answer:
      "Desmoche es un juego de cartas tradicional donde los jugadores compiten utilizando estrategia, memoria y gestión de cartas para acumular puntos y obtener la victoria.",
  },
  {
    question: "¿Cuántos jugadores pueden participar?",
    answer:
      "Dependiendo de la modalidad de la sala, pueden participar entre 2 y 4 jugadores.",
  },
  {
    question: "¿Cómo se gana una partida de Desmoche?",
    answer:
      "La partida se gana alcanzando la cantidad de puntos objetivo establecida por las reglas de la mesa.",
  },
  {
    question: "¿Qué sucede si un jugador abandona la sala?",
    answer:
      "El sistema puede finalizar la partida o continuar según la configuración de la sala y el estado actual del juego.",
  },
  {
    question: "¿Qué es el Solitario?",
    answer:
      "Solitario es un juego para un jugador donde el objetivo es ordenar todas las cartas en las fundaciones según palo y valor.",
  },
  {
    question: "¿Cómo se gana en Solitario?",
    answer:
      "Cuando todas las cartas son movidas correctamente a las fundaciones desde As hasta Rey.",
  },
  {
    question: "¿Puedo mover varias cartas a la vez?",
    answer:
      "Sí, siempre que mantengan una secuencia válida según las reglas del juego.",
  },
  {
    question: "¿Qué cartas pueden colocarse en espacios vacíos?",
    answer:
      "En la modalidad Klondike solamente un Rey puede colocarse en una columna vacía.",
  },
  {
    question: "¿Cómo funcionan las salas privadas?",
    answer:
      "Las salas privadas generan un código único que puedes compartir con otros jugadores para unirse a la partida.",
  },
  {
    question: "¿Existe sistema de ranking?",
    answer:
      "Sí. Las partidas clasificatorias afectan tu posición dentro de la clasificación global.",
  },
];



export function Faqs() {

    const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };



  return (
    <section className="rounded-[8px] border border-white/[0.12] bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-5">
      <section className="faq-section">
      <div className="faq-header">
        <span className="faq-badge">AYUDA Y REGLAS</span>
      <div>
        <h1 className="faq-title">Videos Tutorial</h1>
        <iframe src="https://www.youtube.com/embed/XRSYSGB-IYw" width="1060" height="600" /></div>
        <span className="faq-divider"></span>
        <iframe src="https://www.youtube.com/embed/aMiYb1Fjjw0" width="1060" height="600" />
        
      <h2 className="faq-title">
          Preguntas Frecuentes
        </h2>

        <p className="faq-description">
          Aprende las reglas básicas, estrategias y funcionamiento
          de Desmoche y Solitario.
        </p>
      </div>

      <div className="faq-container">
        {faqData.map((item, index) => {
          const isOpen = activeIndex === index;

          return (
            <div
              key={index}
              className={`faq-item ${isOpen ? "active" : ""}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleItem(index)}
              >
                <span>{item.question}</span>

                <span
                  className={`faq-icon ${
                    isOpen ? "rotate" : ""
                  }`}
                >
                  +
                </span>
              </button>

              <div
                className={`faq-answer-wrapper ${
                  isOpen ? "open" : ""
                }`}
              >
                <div className="faq-answer">
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}

      </div>
      </section>
    </section>
  );
}

export default Faqs;