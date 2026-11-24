import React, { useState } from "react";
import { api, setStoredToken } from "../services/api";
import { sound8bit } from "../utils/sound8bit";
import type { UserProfile } from "../types/game";

interface AuthScreenProps {
  onAuthenticated: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound8bit.click();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === "register"
          ? await api.register({ username, nickname, password })
          : await api.login({ username, password });
      setStoredToken(res.token);
      sound8bit.syncViewpoint();
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di accesso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0b0e1a] relative overflow-hidden">
      <div className="absolute inset-0 crt-scanlines pointer-events-none opacity-60" />

      <div className="nes-box-gold w-full max-w-md p-6 relative z-10">
        <div className="text-center mb-6">
          <img
            src="/Marsala-Quest-8bit-ico.png"
            alt="Marsala Quest 8-Bit"
            className="w-24 h-24 mx-auto mb-3 border-[3px] border-[#ffd166] shadow-[4px_4px_0_#000]"
            style={{ imageRendering: "pixelated" }}
          />
          <div className="inline-block bg-[#ff4d6d] border-2 border-black px-3 py-1 font-pixel text-[8px] text-white mb-3 shadow-[3px_3px_0_#000]">
            ★ CARTRIDGE EDITION • 397 A.C. ★
          </div>
          <h1 className="font-pixel text-lg sm:text-xl text-[#ffd166] drop-shadow-[3px_3px_0_#000] leading-relaxed">
            MARSALA QUEST
            <span className="block text-[#38e54d] text-xs mt-2">
              8-BIT REAL GPS
            </span>
          </h1>
          <p className="text-xl text-[#c7d2fe] mt-3 leading-tight">
            Mappa interattiva con i maggiori punti di interesse di Marsala,
            foto-card retro e Medaglia di Lilibeo!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => {
              sound8bit.click();
              setMode("login");
              setError(null);
            }}
            className={`nes-btn py-2.5 text-[9px] ${
              mode === "login"
                ? "bg-[#ffd166] text-black"
                : "bg-[#26335c] text-[#c7d2fe]"
            }`}
          >
            CONTINUA
          </button>
          <button
            type="button"
            onClick={() => {
              sound8bit.click();
              setMode("register");
              setError(null);
            }}
            className={`nes-btn py-2.5 text-[9px] ${
              mode === "register"
                ? "bg-[#38e54d] text-black"
                : "bg-[#26335c] text-[#c7d2fe]"
            }`}
          >
            NUOVA PARTITA
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-pixel text-[8px] text-[#ffd166] mb-1.5">
              ▶ USERNAME LOGIN
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="es. fabrizio_tp"
              className="w-full bg-[#090d18] border-[3px] border-[#4cc9f0] px-3 py-2 text-2xl text-white focus:border-[#ffd166] outline-none"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block font-pixel text-[8px] text-[#38e54d] mb-1.5">
                ▶ NICKNAME ESPLORATORE
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="es. ReDiLilibeo"
                className="w-full bg-[#090d18] border-[3px] border-[#38e54d] px-3 py-2 text-2xl text-white focus:border-[#ffd166] outline-none"
              />
            </div>
          )}

          <div>
            <label className="block font-pixel text-[8px] text-[#ffd166] mb-1.5">
              ▶ PASSWORD SEGRETA
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
              className="w-full bg-[#090d18] border-[3px] border-[#4cc9f0] px-3 py-2 text-2xl text-white focus:border-[#ffd166] outline-none"
            />
          </div>

          {error && (
            <div className="bg-[#4c0519] border-[3px] border-[#ff4d6d] p-2.5 text-xl text-[#fecdd3]">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="nes-btn w-full py-3.5 bg-[#ff4d6d] text-white text-[11px] disabled:opacity-50"
          >
            {loading
              ? "CARICAMENTO..."
              : mode === "register"
                ? "★ PRESS START ★"
                : "▶ CARICA SALVATAGGIO"}
          </button>
        </form>
      </div>
    </div>
  );
};
