import React, { useMemo, useState } from "react";
import {
  type AvatarConfig,
  type AvatarGender,
  BEARD_STYLES,
  type BeardStyleId,
  DEFAULT_AVATAR,
  HAIR_COLORS,
  type HairColorId,
  HAIR_STYLES,
  type HairStyleId,
  SKIN_TONES,
  type SkinToneId,
} from "../../shared/cosmetics";
import { api, setStoredToken } from "../services/api";
import type { UserProfile } from "../types/game";
import { sound8bit } from "../utils/sound8bit";
import { PixelAvatar } from "./PixelAvatar";

interface AuthScreenProps {
  onAuthenticated: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Personalizzazione base del personaggio in registrazione
  const [gender, setGender] = useState<AvatarGender>("male");
  const [skinTone, setSkinTone] = useState<SkinToneId>("light");
  const [hairColor, setHairColor] = useState<HairColorId>("brown");
  const [hairStyle, setHairStyle] = useState<HairStyleId>("short");
  const [beard, setBeard] = useState<BeardStyleId>("none");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewAvatar = useMemo<AvatarConfig>(
    () => ({
      ...DEFAULT_AVATAR,
      gender,
      skinTone,
      hairColor,
      hairStyle,
      beard: gender === "male" ? beard : "none",
      hat: "hat-none",
    }),
    [gender, skinTone, hairColor, hairStyle, beard],
  );

  const handleGenderChange = (nextGender: AvatarGender) => {
    sound8bit.click();
    setGender(nextGender);
    if (nextGender === "female") {
      setBeard("none");
      if (hairStyle === "short") setHairStyle("long");
    } else if (hairStyle === "long") {
      setHairStyle("short");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound8bit.click();
    setError(null);
    setLoading(true);

    try {
      const res =
        mode === "login"
          ? await api.login({ username, password })
          : await api.register({
              username,
              nickname,
              password,
              gender,
              skinTone,
              hairColor,
              hairStyle,
              beard: gender === "male" ? beard : "none",
            });
      setStoredToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Errore di autenticazione.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-screen bg-[#0b0e1a] flex items-center justify-center p-3 sm:p-4 safe-top safe-bottom overflow-y-auto">
      <div className="nes-box-gold w-full max-w-md p-4 sm:p-5 my-auto">
        <div className="flex flex-col items-center text-center mb-4">
          <img
            src="/Marsala-Quest-8bit-ico.png"
            alt="Marsala Quest 8-Bit"
            className="w-16 h-16 sm:w-20 sm:h-20 border-[3px] border-[#ffd166] shadow-[4px_4px_0_#000] mb-2.5"
            style={{ imageRendering: "pixelated" }}
          />
          <h1 className="font-pixel text-sm sm:text-base text-[#ffd166] leading-snug">
            MARSALA QUEST 8-BIT
          </h1>
          <p className="text-xl text-[#4cc9f0] mt-1">
            Esplora Lilibeo, illumina la mappa e colleziona le Card!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
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
                : "bg-[#26335c] text-slate-300"
            }`}
          >
            ACCEDI
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
                : "bg-[#26335c] text-slate-300"
            }`}
          >
            NUOVO PLAYER
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="block font-pixel text-[8px] text-[#ffd166] mb-1">
              USERNAME
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="es. lilibeo89"
              className="w-full bg-[#090d18] border-[3px] border-[#4cc9f0] px-3 py-2 text-xl text-white outline-none focus:border-[#ffd166]"
            />
          </div>

          {mode === "register" && (
            <>
              <div>
                <label className="block font-pixel text-[8px] text-[#ffd166] mb-1">
                  NICKNAME IN CLASSIFICA
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nome visibile agli altri player"
                  className="w-full bg-[#090d18] border-[3px] border-[#4cc9f0] px-3 py-2 text-xl text-white outline-none focus:border-[#ffd166]"
                />
              </div>

              {/* Creazione Avatar Live */}
              <div className="bg-[#090d18] border-[3px] border-[#4cc9f0] p-3 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 bg-[#141b33] border-2 border-[#ffd166] flex items-center justify-center shrink-0">
                    <PixelAvatar avatar={previewAvatar} size={52} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-pixel text-[8px] text-[#ffd166] mb-1.5">
                      CREA IL TUO AVATAR
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleGenderChange("male")}
                        className={`nes-btn py-1.5 text-[7px] ${
                          gender === "male"
                            ? "bg-[#4cc9f0] text-black"
                            : "bg-[#26335c] text-white"
                        }`}
                      >
                        ♂ ESPLORATORE
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenderChange("female")}
                        className={`nes-btn py-1.5 text-[7px] ${
                          gender === "female"
                            ? "bg-[#f472b6] text-black"
                            : "bg-[#26335c] text-white"
                        }`}
                      >
                        ♀ ESPLORATRICE
                      </button>
                    </div>
                  </div>
                </div>

                {/* Colore pelle */}
                <div>
                  <p className="font-pixel text-[7px] text-[#cbd5e1] mb-1">
                    CARNAGIONE:
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => {
                          sound8bit.click();
                          setSkinTone(tone.id);
                        }}
                        className={`border-2 py-1 px-1 flex flex-col items-center gap-1 transition ${
                          skinTone === tone.id
                            ? "border-[#38e54d] bg-[#102a1d]"
                            : "border-[#2e3d6b] bg-[#141b33]"
                        }`}
                      >
                        <span
                          className="w-5 h-5 border border-black"
                          style={{ backgroundColor: tone.color }}
                        />
                        <span className="text-sm text-white leading-none">
                          {tone.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colore capelli */}
                <div>
                  <p className="font-pixel text-[7px] text-[#cbd5e1] mb-1">
                    COLORE CAPELLI:
                  </p>
                  <div className="grid grid-cols-5 gap-1">
                    {HAIR_COLORS.map((hc) => (
                      <button
                        key={hc.id}
                        type="button"
                        onClick={() => {
                          sound8bit.click();
                          setHairColor(hc.id);
                        }}
                        className={`border-2 py-1 px-0.5 flex flex-col items-center gap-1 transition ${
                          hairColor === hc.id
                            ? "border-[#ffd166] bg-[#2a1f3d]"
                            : "border-[#2e3d6b] bg-[#141b33]"
                        }`}
                      >
                        <span
                          className="w-4 h-4 border border-black"
                          style={{ backgroundColor: hc.color }}
                        />
                        <span className="text-xs text-white leading-none">
                          {hc.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Taglio capelli */}
                <div>
                  <p className="font-pixel text-[7px] text-[#cbd5e1] mb-1">
                    STILE CAPELLI:
                  </p>
                  <div className="grid grid-cols-5 gap-1">
                    {HAIR_STYLES.map((hs) => (
                      <button
                        key={hs.id}
                        type="button"
                        onClick={() => {
                          sound8bit.click();
                          setHairStyle(hs.id);
                        }}
                        className={`nes-btn py-1 text-[6px] sm:text-[7px] ${
                          hairStyle === hs.id
                            ? "bg-[#ffd166] text-black"
                            : "bg-[#26335c] text-slate-200"
                        }`}
                      >
                        {hs.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stile barba (solo profilo maschile) */}
                {gender === "male" && (
                  <div>
                    <p className="font-pixel text-[7px] text-[#cbd5e1] mb-1">
                      BARBA:
                    </p>
                    <div className="grid grid-cols-5 gap-1">
                      {BEARD_STYLES.map((bs) => (
                        <button
                          key={bs.id}
                          type="button"
                          onClick={() => {
                            sound8bit.click();
                            setBeard(bs.id);
                          }}
                          className={`nes-btn py-1 text-[6px] sm:text-[7px] ${
                            beard === bs.id
                              ? "bg-[#4cc9f0] text-black"
                              : "bg-[#26335c] text-slate-200"
                          }`}
                        >
                          {bs.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block font-pixel text-[8px] text-[#ffd166] mb-1">
              PASSWORD
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 6 caratteri"
                className="w-full bg-[#090d18] border-[3px] border-[#4cc9f0] pl-3 pr-12 py-2 text-xl text-white outline-none focus:border-[#ffd166]"
              />
              <button
                type="button"
                onClick={() => {
                  sound8bit.click();
                  setShowPassword((prev) => !prev);
                }}
                aria-label={
                  showPassword ? "Nascondi password" : "Mostra password"
                }
                title={showPassword ? "Nascondi password" : "Mostra password"}
                className="absolute right-2 p-1.5 text-[#4cc9f0] hover:text-[#ffd166] focus:outline-none"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-[#4c0519] border-2 border-[#ff4d6d] p-2.5 text-lg text-[#fecdd3]">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="nes-btn w-full py-3.5 bg-[#38e54d] text-black text-[10px] disabled:opacity-50"
          >
            {loading
              ? "CONNESSIONE..."
              : mode === "login"
                ? "▶ ENTRA A MARSALA"
                : "★ CREA AVVENTURIERO"}
          </button>
        </form>
      </div>
    </div>
  );
};
