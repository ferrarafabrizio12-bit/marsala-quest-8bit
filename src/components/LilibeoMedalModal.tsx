import React, { useRef } from "react";
import { sound8bit } from "../utils/sound8bit";

interface LilibeoMedalModalProps {
  nickname: string;
  totalXp: number;
  easterEggCount: number;
  onClose: () => void;
}

export const LilibeoMedalModal: React.FC<LilibeoMedalModalProps> = ({
  nickname,
  totalXp,
  easterEggCount,
  onClose,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const downloadDiploma = () => {
    sound8bit.click();
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 600;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#0b0e1a";
    ctx.fillRect(0, 0, 900, 600);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, 864, 564);
    ctx.strokeStyle = "#ff4d6d";
    ctx.lineWidth = 4;
    ctx.strokeRect(34, 34, 832, 532);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 34px monospace";
    ctx.fillText("MEDAGLIA D’ORO DI LILIBEO", 450, 92);

    ctx.fillStyle = "#4cc9f0";
    ctx.font = "bold 20px monospace";
    ctx.fillText("★ LILYBAEUM • MARSALA • 397 A.C. ★", 450, 128);

    ctx.fillStyle = "#f4f1de";
    ctx.font = "24px monospace";
    ctx.fillText("LEGGENDA SUPREMA DI MARSALA", 450, 424);

    ctx.fillStyle = "#38e54d";
    ctx.font = "bold 42px monospace";
    ctx.fillText(nickname.toUpperCase(), 450, 478);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "18px monospace";
    ctx.fillText(
      `MAPPA 100% SBLOCCATA • ${totalXp} XP • ${easterEggCount} EASTER EGG`,
      450,
      528,
    );

    if (svgRef.current) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 330, 148, 240, 240);
        const link = document.createElement("a");
        link.download = `medaglia-lilibeo-${nickname}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/90 flex items-center justify-center p-4">
      <div className="nes-box-gold w-full max-w-xl p-6 text-center">
        <p className="font-pixel text-[9px] text-[#38e54d] mb-2">
          ★ QUEST COMPLETATA AL 100% ★
        </p>
        <h2 className="font-pixel text-base sm:text-lg text-[#ffd166] mb-3">
          MEDAGLIA D&apos;ORO DI LILIBEO
        </h2>

        <div className="flex justify-center my-4">
          <svg
            ref={svgRef}
            viewBox="0 0 240 240"
            className="w-56 h-56 drop-shadow-[0_0_24px_rgba(255,209,102,0.7)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Nastro 8-bit cremisi */}
            <path
              d="M84 6 L114 6 L120 42 L94 42 Z"
              fill="#b91c1c"
              stroke="#000"
              strokeWidth="4"
            />
            <path
              d="M156 6 L126 6 L120 42 L146 42 Z"
              fill="#dc2626"
              stroke="#000"
              strokeWidth="4"
            />
            <rect
              x="111"
              y="34"
              width="18"
              height="16"
              fill="#ffd166"
              stroke="#000"
              strokeWidth="3"
            />

            {/* Medaglia d'Oro */}
            <circle
              cx="120"
              cy="134"
              r="88"
              fill="#d97706"
              stroke="#000"
              strokeWidth="5"
            />
            <circle
              cx="120"
              cy="134"
              r="78"
              fill="#ffd166"
              stroke="#78350f"
              strokeWidth="4"
            />
            <circle
              cx="120"
              cy="134"
              r="67"
              fill="#991b1b"
              stroke="#fef08a"
              strokeWidth="3"
              strokeDasharray="6 4"
            />

            {/* Logo Antico Storico di Lilibeo / Marsala: Corona Turrita */}
            <g fill="#fde047" stroke="#000" strokeWidth="2.4">
              <rect x="92" y="79" width="56" height="12" />
              <rect x="92" y="70" width="11" height="9" />
              <rect x="107" y="70" width="10" height="9" />
              <rect x="123" y="70" width="10" height="9" />
              <rect x="137" y="70" width="11" height="9" />
            </g>

            {/* Scudo storico */}
            <path
              d="M84 95 H156 V136 C156 164 136 179 120 186 C104 179 84 164 84 136 Z"
              fill="#7f1d1d"
              stroke="#fde047"
              strokeWidth="3.5"
            />

            {/* Antica Lira di Apollo delle monete di Lilibeo (ΛΙΛΥΒΑΙΤΑΝ) */}
            <g
              stroke="#fde047"
              strokeWidth="3"
              fill="none"
              strokeLinecap="square"
            >
              <path d="M103 106 C97 122 100 138 110 144 H130 C140 138 143 122 137 106" />
              <line x1="100" y1="112" x2="140" y2="112" />
              <line x1="112" y1="112" x2="112" y2="143" strokeWidth="2" />
              <line x1="120" y1="112" x2="120" y2="143" strokeWidth="2" />
              <line x1="128" y1="112" x2="128" y2="143" strokeWidth="2" />
            </g>

            {/* Prua Nave Punica + Onde */}
            <path
              d="M95 153 L145 153 L137 163 L103 163 Z"
              fill="#f59e0b"
              stroke="#000"
              strokeWidth="2"
            />
            <path
              d="M92 167 Q106 161 120 167 T148 167"
              fill="none"
              stroke="#4cc9f0"
              strokeWidth="3"
            />

            <text
              x="120"
              y="206"
              textAnchor="middle"
              fill="#451a03"
              fontFamily="monospace"
              fontWeight="bold"
              fontSize="11"
            >
              ★ LILYBAEUM • 397 A.C. ★
            </text>
          </svg>
        </div>

        <p className="text-3xl text-white mb-1">
          Onore a <span className="text-[#38e54d] font-bold">{nickname}</span>!
        </p>
        <p className="text-xl text-[#c7d2fe] mb-5">
          Hai colorato tutta Marsala ({totalXp} XP • {easterEggCount} segreti).
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={downloadDiploma}
            className="nes-btn flex-1 py-3 bg-[#ffd166] text-black text-[10px]"
          >
            🏆 SCARICA DIPLOMA PNG
          </button>
          <button
            onClick={onClose}
            className="nes-btn px-5 py-3 bg-[#26335c] text-white text-[10px]"
          >
            MAPPA
          </button>
        </div>
      </div>
    </div>
  );
};
