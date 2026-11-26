import React, { useState } from "react";
import { sound8bit } from "../utils/sound8bit";

interface OnboardingTutorialModalProps {
  nickname: string;
  onFinish: () => Promise<void> | void;
}

interface TutorialStep {
  badge: string;
  icon: string;
  title: string;
  subtitle: string;
  bullets: string[];
  accentColor: string;
}

const STEPS: TutorialStep[] = [
  {
    badge: "BENVENUTO A LILIBEO",
    icon: "🗺️",
    title: "ILLUMINA TUTTA MARSALA!",
    subtitle:
      "La città è avvolta nella nebbia grigia: il tuo obiettivo è esplorarla dal vivo e restituirle i colori, un tassello del puzzle alla volta.",
    bullets: [
      "20 luoghi iconici tra Centro Storico, Capo Boeo, Cantine, Stagnone e Lido Signorino.",
      "Ogni luogo conquistato illumina la propria area sulla mappa fino al 100%.",
      "Più esplori, più XP guadagni per scalare la classifica di Lilibeo!",
    ],
    accentColor: "#ffd166",
  },
  {
    badge: "STEP 1 • NAVIGAZIONE",
    icon: "🧭",
    title: "SEGUI LA BUSSOLA PEDONALE",
    subtitle:
      'Sulla mappa trovi i marker "?" dei luoghi ancora da scoprire e il tuo avatar con la freccia direzionale in tempo reale.',
    bullets: [
      'Tocca qualsiasi "?" sulla mappa (o dalla DEX) e premi 🧭 GUIDAMI.',
      "L’app traccia il percorso a piedi lungo le strade reali con distanza e minuti stimati.",
      "La bussola in basso ruota col telefono: allinea la freccia verso il pallino verde!",
    ],
    accentColor: "#4cc9f0",
  },
  {
    badge: "STEP 2 • TRADING CARD GPS",
    icon: "📸",
    title: "SCATTA SUL POSTO & COLLEZIONA",
    subtitle:
      "Quando arrivi nel raggio GPS del monumento, sblocchi la fotocamera per creare la tua Trading Card certificata.",
    bullets: [
      "Puoi attivare o disattivare il filtro Pixel 8-Bit sulla tua foto prima di salvarla.",
      "Scattando al tramonto (17–20) o di notte (20–06) ottieni edizioni speciali +50 XP!",
      "Ogni Card acquisita può essere salvata o condivisa subito con 📲 Salva o Condividi.",
    ],
    accentColor: "#38e54d",
  },
  {
    badge: "STEP 3 • DEX, BOUNTY & SEGRETI",
    icon: "🎯",
    title: "OBIETTIVO DEL GIORNO & SEGRETI",
    subtitle:
      "Nella barra in basso apri 📖 DEX per gestire la collezione, cercare luoghi e scoprire misteri nascosti.",
    bullets: [
      "Ogni giorno un monumento è 🎯 OBIETTIVO DEL GIORNO: conquistalo per XP extra e Streak 🔥.",
      'Usa i filtri permanenti "Più vicini a me" e "Solo mancanti" (attivo anche sulla mappa!).',
      "Trova i 9 Segreti nascosti legati alla storia di Marsala per sbloccare premi unici.",
    ],
    accentColor: "#e879f9",
  },
  {
    badge: "STEP 4 • LOOK, CARTOLINA & PRESTIGIO",
    icon: "🏆",
    title: "PERSONALIZZA & CONDIVIDI",
    subtitle:
      "Ogni traguardo sblocca nuovi accessori per il tuo esploratore e ricordi speciali da portare con te.",
    bullets: [
      "In 👕 LOOK (o toccando il tuo omino) personalizzi aspetto, 31 capi 8-bit e 9 titoli.",
      "Dalla DEX genera la 📮 CARTOLINA DI VIAGGIO con mappa colorata e le tue 3 Card preferite.",
      "Al 20/20 ricevi la Medaglia di Lilibeo e puoi avviare il ⚡ NEW GAME+ (fino a ★5 MAX)!",
    ],
    accentColor: "#ffd166",
  },
  {
    badge: "STEP 5 • FEEDBACK & ABOUT ME",
    icon: "💬",
    title: "SEGNALA BUG, IDEE & CONTATTI",
    subtitle:
      "Nella barra in alto trovi il pulsante ℹ️: il tuo filo diretto con lo sviluppatore di Marsala Quest 8-Bit.",
    bullets: [
      "Scheda 💬 FEEDBACK: segnala bug, nuovi luoghi o idee (in privato, 1 invio ogni 12 ore).",
      "Scheda 👨‍💻 ABOUT ME: scopri chi ha creato l’app, l’obiettivo del progetto e i link Instagram/GitHub.",
      "Dalla stessa finestra puoi riaprire questo tutorial in qualsiasi momento.",
    ],
    accentColor: "#38e54d",
  },
  {
    badge: "STEP 6 • INSTALLA COME APP",
    icon: "📲",
    title: "METTILA NELLA SCHERMATA HOME",
    subtitle:
      "Puoi salvare Marsala Quest 8-Bit sul telefono per aprirla a tutto schermo con la sua icona, come una vera app!",
    bullets: [
      'iPhone (Safari): tocca l’icona Condividi in basso (quadrato con freccia ↑), scorri e scegli "Aggiungi alla schermata Home", poi "Aggiungi".',
      'Android (Chrome): tocca il menu ⋮ in alto a destra e seleziona "Aggiungi a schermata Home" (o "Installa app").',
      "Avviandola dalla Home avrai più spazio per la mappa e accesso immediato in giro per Marsala!",
    ],
    accentColor: "#4cc9f0",
  },
];

export const OnboardingTutorialModal: React.FC<
  OnboardingTutorialModalProps
> = ({ nickname, onFinish }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const current = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;

  const handleComplete = async (skipped = false) => {
    sound8bit.prime();
    if (skipped) sound8bit.back();
    else sound8bit.tutorialComplete();
    setFinishing(true);
    try {
      await onFinish();
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/90 flex items-center justify-center p-3 sm:p-4">
      <div className="nes-box-gold w-full max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-5 flex flex-col">
        <div className="flex items-center justify-between gap-2 border-b-[3px] border-[#2e3d6b] pb-2.5 mb-3">
          <span
            className="font-pixel text-[8px]"
            style={{ color: current.accentColor }}
          >
            {isFirst ? `CIAO ${nickname.toUpperCase()}!` : current.badge}
          </span>
          <button
            type="button"
            disabled={finishing}
            onClick={() => void handleComplete(true)}
            className="font-pixel text-[7px] text-[#94a3b8] hover:text-[#ffd166] px-2 py-1 border border-[#334155]"
          >
            SALTA ✕
          </button>
        </div>

        <div className="text-center mb-3">
          <div className="w-16 h-16 mx-auto mb-2.5 bg-[#090d18] border-[3px] border-[#4cc9f0] shadow-[3px_3px_0_#000] flex items-center justify-center text-4xl">
            {current.icon}
          </div>
          <h2
            className="font-pixel text-xs sm:text-sm leading-snug"
            style={{ color: current.accentColor }}
          >
            {current.title}
          </h2>
          <p className="text-xl text-[#f4f1de] leading-snug mt-2">
            {current.subtitle}
          </p>
        </div>

        <div className="bg-[#090d18] border-[3px] border-[#2e3d6b] p-3 mb-4 space-y-2">
          {current.bullets.map((line, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-lg text-[#cbd5e1] leading-tight"
            >
              <span
                className="font-pixel text-[8px] mt-1 shrink-0"
                style={{ color: current.accentColor }}
              >
                ▶
              </span>
              <span>{line}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5 mb-4">
          {STEPS.map((s, idx) => (
            <button
              key={s.badge}
              type="button"
              onClick={() => {
                sound8bit.tutorialStep();
                setStepIdx(idx);
              }}
              aria-label={`Vai allo step ${idx + 1}`}
              className={`h-2.5 border border-black transition-all ${
                idx === stepIdx
                  ? "w-7 bg-[#ffd166]"
                  : idx < stepIdx
                    ? "w-2.5 bg-[#38e54d]"
                    : "w-2.5 bg-[#26335c]"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isFirst || finishing}
            onClick={() => {
              sound8bit.back();
              setStepIdx((prev) => Math.max(0, prev - 1));
            }}
            className="nes-btn py-3 bg-[#26335c] text-white text-[9px] disabled:opacity-40"
          >
            ◀ INDIETRO
          </button>

          {isLast ? (
            <button
              type="button"
              disabled={finishing}
              onClick={() => void handleComplete(false)}
              className="nes-btn py-3 bg-[#38e54d] text-black text-[9px]"
            >
              {finishing ? "AVVIO..." : "🚀 INIZIA!"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sound8bit.tutorialStep();
                setStepIdx((prev) => Math.min(STEPS.length - 1, prev + 1));
              }}
              className="nes-btn py-3 bg-[#ffd166] text-black text-[9px]"
            >
              AVANTI ▶
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
