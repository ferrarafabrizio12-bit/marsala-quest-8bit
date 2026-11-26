import React, { useMemo, useRef, useState } from "react";
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

const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);

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

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const handleModeSwitch = (nextMode: "login" | "register") => {
    sound8bit.click();
    setMode(nextMode);
    setRegisterStep(1);
    setError(null);
    scrollToTop();
  };

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

  const handleNextRegisterStep = () => {
    sound8bit.click();
    const cleanUser = username.trim();
    const cleanNick = nickname.trim();

    if (
      cleanUser.length < 3 ||
      cleanUser.length > 30 ||
      !USERNAME_REGEX.test(cleanUser)
    ) {
      setError(
        "Username tra 3 e 30 caratteri (solo lettere, numeri, punti, _ o -).",
      );
      return;
    }
    if (cleanNick.length < 2 || cleanNick.length > 20) {
      setError("Nickname tra 2 e 20 caratteri.");
      return;
    }
    if (password.length < 6 || password.length > 100) {
      setError("Password minimo 6 caratteri.");
      return;
    }

    setError(null);
    setRegisterStep(2);
    scrollToTop();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "register" && registerStep === 1) {
      handleNextRegisterStep();
      return;
    }

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
      const msg =
        err instanceof Error ? err.message : "Errore di autenticazione.";
      setError(msg);
      if (mode === "register" && /username|nickname|password/i.test(msg)) {
        setRegisterStep(1);
        scrollToTop();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 h-[100dvh] w-screen bg-[#0b0e1a] overflow-y-auto overscroll-contain px-3 sm:px-4"
      style={{
        WebkitOverflowScrolling: "touch",
        paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
        paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="min-h-full w-full flex flex-col items-center">
        <div className="nes-box-gold w-full max-w-md p-4 sm:p-5 my-auto">
          <div className="flex flex-col items-center text-center mb-3.5">
            <img
              src="/Marsala-Quest-8bit-ico.png"
              alt="Marsala Quest 8-Bit"
              className="w-16 h-16 sm:w-20 sm:h-20 border-[3px] border-[#ffd166] shadow-[4px_4px_0_#000] mb-2"
              style={{ imageRendering: "pixelated" }}
            />
            <h1 className="font-pixel text-sm sm:text-base text-[#ffd166] leading-snug">
              MARSALA QUEST 8-BIT
            </h1>
            <p className="text-lg sm:text-xl text-[#4cc9f0] mt-1 leading-tight">
              Esplora Lilibeo, illumina la mappa e colleziona le Card!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3.5">
            <button
              type="button"
              onClick={() => handleModeSwitch("login")}
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
              onClick={() => handleModeSwitch("register")}
              className={`nes-btn py-2.5 text-[9px] ${
                mode === "register"
                  ? "bg-[#38e54d] text-black"
                  : "bg-[#26335c] text-slate-300"
              }`}
            >
              NUOVO PLAYER
            </button>
          </div>

          {/* Indicatore step solo durante la registrazione */}
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => {
                  sound8bit.click();
                  setRegisterStep(1);
                  setError(null);
                  scrollToTop();
                }}
                className={`border-2 py-1 text-center font-pixel text-[7px] ${
                  registerStep === 1
                    ? "border-[#ffd166] bg-[#2a1f3d] text-[#ffd166]"
                    : "border-[#38e54d] bg-[#102a1d] text-[#38e54d]"
                }`}
              >
                {registerStep === 1 ? "▶ 1. ACCOUNT" : "✓ 1. ACCOUNT"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (registerStep === 1) handleNextRegisterStep();
                }}
                className={`border-2 py-1 text-center font-pixel text-[7px] ${
                  registerStep === 2
                    ? "border-[#ffd166] bg-[#2a1f3d] text-[#ffd166]"
                    : "border-[#2e3d6b] bg-[#090d18] text-slate-400"
                }`}
              >
                2. AVATAR
              </button>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            {/* LOGIN oppure REGISTRAZIONE STEP 1 (Dati account) */}
            {(mode === "login" || registerStep === 1) && (
              <>
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
                      title={
                        showPassword ? "Nascondi password" : "Mostra password"
                      }
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
              </>
            )}

            {/* REGISTRAZIONE STEP 2 (Personalizzazione Avatar) */}
            {mode === "register" && registerStep === 2 && (
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
                        className={`nes-btn py-1.5 text-[6px] sm:text-[7px] ${
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
                          className={`nes-btn py-1.5 text-[6px] sm:text-[7px] ${
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
            )}

            {error && (
              <div className="bg-[#4c0519] border-2 border-[#ff4d6d] p-2.5 text-lg text-[#fecdd3]">
                ⚠ {error}
              </div>
            )}

            {/* Pulsanti azione in base a Login / Step 1 / Step 2 */}
            {mode === "login" ? (
              <button
                type="submit"
                disabled={loading}
                className="nes-btn w-full py-3.5 bg-[#38e54d] text-black text-[10px] disabled:opacity-50"
              >
                {loading ? "CONNESSIONE..." : "▶ ENTRA A MARSALA"}
              </button>
            ) : registerStep === 1 ? (
              <button
                type="submit"
                className="nes-btn w-full py-3.5 bg-[#ffd166] text-black text-[9px]"
              >
                AVANTI: CREA AVATAR ▶
              </button>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    sound8bit.click();
                    setError(null);
                    setRegisterStep(1);
                    scrollToTop();
                  }}
                  className="nes-btn col-span-2 py-3.5 bg-[#26335c] text-white text-[8px] disabled:opacity-50"
                >
                  ◀ INDIETRO
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="nes-btn col-span-3 py-3.5 bg-[#38e54d] text-black text-[9px] disabled:opacity-50"
                >
                  {loading ? "CREAZIONE..." : "★ CREA AVVENTURIERO"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
