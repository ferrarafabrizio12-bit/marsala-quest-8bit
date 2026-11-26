import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import type { FeedbackCategory, FeedbackItem } from "../types/game";
import { sound8bit } from "../utils/sound8bit";

// >>> INSERISCI QUI I TUOI LINK SOCIAL REALI <<<
const INSTAGRAM_URL =
  "https://www.instagram.com/_fabrif_?evlk=MXJyY3BiY3V0MWtxbQ%3D%3D&utm_source=qr";
const GITHUB_URL = "https://github.com/repos?q=owner%3A%40me";

interface InfoFeedbackModalProps {
  isSuperuser?: boolean;
  onOpenTutorial: () => void;
  onClose: () => void;
}

const CATEGORY_OPTIONS: {
  id: FeedbackCategory;
  label: string;
  badgeColor: string;
}[] = [
  {
    id: "suggerimento",
    label: "💡 IDEA",
    badgeColor: "bg-[#4cc9f0] text-black",
  },
  { id: "bug", label: "🐛 BUG", badgeColor: "bg-[#ff4d6d] text-white" },
  {
    id: "apprezzamento",
    label: "❤️ TOP",
    badgeColor: "bg-[#38e54d] text-black",
  },
];

export const InfoFeedbackModal: React.FC<InfoFeedbackModalProps> = ({
  isSuperuser = false,
  onOpenTutorial,
  onClose,
}) => {
  const [tab, setTab] = useState<"feedback" | "about" | "inbox">("feedback");

  // Stato form invio feedback (visibile a tutti)
  const [category, setCategory] = useState<FeedbackCategory>("suggerimento");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stato inbox privata (solo Superuser)
  const [inbox, setInbox] = useState<FeedbackItem[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadInbox = async () => {
    if (!isSuperuser) return;
    setLoadingInbox(true);
    try {
      const res = await api.getAdminFeedbacks();
      setInbox(res.feedbacks);
    } catch {
      // Silenzioso
    } finally {
      setLoadingInbox(false);
    }
  };

  useEffect(() => {
    if (isSuperuser && tab === "inbox") {
      void loadInbox();
    }
  }, [isSuperuser, tab]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    sound8bit.click();
    setError(null);
    setSentSuccess(false);

    if (message.trim().length < 5) {
      setError("Scrivi almeno 5 caratteri prima di inviare.");
      return;
    }

    setSending(true);
    try {
      await api.submitFeedback({ category, message: message.trim() });
      setMessage("");
      setSentSuccess(true);
      sound8bit.easterEgg();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l’invio.");
    } finally {
      setSending(false);
    }
  };

  const handleToggleRead = async (item: FeedbackItem) => {
    sound8bit.click();
    setBusyId(item.id);
    try {
      await api.setFeedbackRead(item.id, !item.isRead);
      setInbox((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, isRead: !item.isRead } : f,
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    sound8bit.click();
    setBusyId(id);
    try {
      await api.deleteFeedback(id);
      setInbox((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  const unreadCount = inbox.filter((f) => !f.isRead).length;

  return (
    <div className="fixed inset-0 z-[1050] bg-black/85 flex items-end sm:items-center justify-center sm:p-3">
      <div className="nes-box-gold w-full sm:max-w-lg max-h-[88dvh] flex flex-col p-4 safe-bottom">
        {/* Header con Tabs */}
        <div className="flex justify-between items-center border-b-[3px] border-[#2e3d6b] pb-2.5 mb-3 gap-1.5">
          <div className="flex gap-1.5 flex-1">
            <button
              type="button"
              onClick={() => {
                sound8bit.click();
                setTab("feedback");
              }}
              className={`nes-btn flex-1 py-2 text-[7px] sm:text-[8px] ${
                tab === "feedback"
                  ? "bg-[#38e54d] text-black"
                  : "bg-[#26335c] text-slate-300"
              }`}
            >
              💬 FEEDBACK
            </button>
            <button
              type="button"
              onClick={() => {
                sound8bit.click();
                setTab("about");
              }}
              className={`nes-btn flex-1 py-2 text-[7px] sm:text-[8px] ${
                tab === "about"
                  ? "bg-[#ffd166] text-black"
                  : "bg-[#26335c] text-slate-300"
              }`}
            >
              👨‍💻 ABOUT ME
            </button>
            {isSuperuser && (
              <button
                type="button"
                onClick={() => {
                  sound8bit.click();
                  setTab("inbox");
                }}
                className={`nes-btn flex-1 py-2 text-[7px] sm:text-[8px] ${
                  tab === "inbox"
                    ? "bg-[#c026d3] text-white"
                    : "bg-[#26335c] text-slate-300"
                }`}
              >
                📬 INBOX{unreadCount > 0 ? ` (${unreadCount})` : ""}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="nes-btn w-10 h-10 bg-[#ff4d6d] text-white text-[10px] shrink-0"
          >
            X
          </button>
        </div>

        {/* TAB 1: INVIO FEEDBACK (privato verso l'autore) */}
        {tab === "feedback" && (
          <form
            onSubmit={(e) => void handleSubmitFeedback(e)}
            className="space-y-3 overflow-y-auto pr-0.5"
          >
            <div className="bg-[#090d18] border-[3px] border-[#4cc9f0] p-3">
              <p className="font-pixel text-[8px] text-[#ffd166] mb-1">
                AIUTAMI A MIGLIORARE MARSALA QUEST!
              </p>
              <p className="text-lg text-[#cbd5e1] leading-tight">
                Hai trovato un bug, un luogo da aggiungere o un’idea per nuove
                funzionalità? Scrivilo qui: il messaggio arriva in privato solo
                allo sviluppatore.
              </p>
            </div>

            <div>
              <p className="font-pixel text-[8px] text-[#ffd166] mb-1.5">
                TIPO DI SEGNALAZIONE:
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      sound8bit.click();
                      setCategory(opt.id);
                    }}
                    className={`nes-btn py-2 text-[7px] sm:text-[8px] ${
                      category === opt.id
                        ? opt.badgeColor
                        : "bg-[#26335c] text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-pixel text-[8px] text-[#ffd166] mb-1">
                IL TUO MESSAGGIO ({message.length}/1000)
              </label>
              <textarea
                rows={5}
                maxLength={1000}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (sentSuccess) setSentSuccess(false);
                }}
                placeholder="Descrivi il bug riscontrato o il miglioramento che vorresti vedere..."
                className="w-full bg-[#090d18] border-[3px] border-[#4cc9f0] p-2.5 text-xl text-white outline-none focus:border-[#ffd166] resize-none"
              />
            </div>

            {error && (
              <div className="bg-[#4c0519] border-2 border-[#ff4d6d] p-2 text-lg text-[#fecdd3]">
                ⚠ {error}
              </div>
            )}

            {sentSuccess && (
              <div className="bg-[#102a1d] border-2 border-[#38e54d] p-2.5 text-lg text-[#bbf7d0]">
                ✅ Grazie! Il tuo feedback è stato inviato con successo.
              </div>
            )}

            <button
              type="submit"
              disabled={sending || message.trim().length < 5}
              className="nes-btn w-full py-3 bg-[#38e54d] text-black text-[9px] disabled:opacity-50"
            >
              {sending ? "INVIO IN CORSO..." : "📨 INVIA FEEDBACK"}
            </button>
          </form>
        )}

        {/* TAB 2: ABOUT ME */}
        {tab === "about" && (
          <div className="space-y-3 overflow-y-auto pr-0.5">
            <div className="bg-[#090d18] border-[3px] border-[#ffd166] p-3.5 text-left">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-14 h-14 bg-[#141b33] border-[3px] border-[#4cc9f0] flex items-center justify-center text-3xl shrink-0">
                  👨‍💻
                </div>
                <div>
                  <h4 className="font-pixel text-[10px] text-[#ffd166]">
                    FABRIZIO FERRARA
                  </h4>
                  <p className="text-lg text-[#4cc9f0] leading-tight">
                    Ingegnere Informatico • Marsala (TP)
                  </p>
                </div>
              </div>

              <p className="text-xl text-[#f4f1de] leading-snug mb-2">
                Sono un <strong>Ingegnere Informatico</strong> con base a{" "}
                <strong>Marsala</strong> e ho realizzato{" "}
                <strong>Marsala Quest 8-Bit</strong> con l’obiettivo di
                valorizzare il mio territorio unendo tecnologia, storia locale e
                la magia dei videogiochi retrò.
              </p>
              <p className="text-xl text-[#cbd5e1] leading-snug">
                L’idea nasce dalla voglia di trasformare una semplice
                passeggiata tra Capo Boeo, il centro storico, le cantine e lo
                Stagnone in un’avventura interattiva e coinvolgente, pensata
                tanto per i turisti alla scoperta della città quanto per i
                marsalesi che vogliono riscoprirla con occhi nuovi.
              </p>
            </div>

            {/* Pulsanti Social Instagram & GitHub */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound8bit.click()}
                className="nes-btn py-3 bg-[#e1306c] text-white text-[8px] flex items-center justify-center gap-1.5 no-underline"
              >
                <span>📸</span>
                <span>INSTAGRAM</span>
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound8bit.click()}
                className="nes-btn py-3 bg-[#1e293b] text-white text-[8px] flex items-center justify-center gap-1.5 no-underline"
              >
                <span>💻</span>
                <span>GITHUB</span>
              </a>
            </div>

            {/* Pulsante per rivedere il tutorial in qualsiasi momento */}
            <button
              type="button"
              onClick={() => {
                sound8bit.click();
                onClose();
                onOpenTutorial();
              }}
              className="nes-btn w-full py-2.5 bg-[#4cc9f0] text-black text-[8px]"
            >
              🎓 RIVEDI IL TUTORIAL DELL’APP
            </button>
          </div>
        )}

        {/* TAB 3: INBOX PRIVATA FEEDBACK (solo Superuser) */}
        {tab === "inbox" && isSuperuser && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[8px] text-[#f0abfc]">
                FEEDBACK RICEVUTI ({inbox.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  sound8bit.click();
                  void loadInbox();
                }}
                className="nes-btn px-2 py-1 bg-[#26335c] text-white text-[7px]"
              >
                🔄 AGGIORNA
              </button>
            </div>

            {loadingInbox ? (
              <div className="py-10 text-center font-pixel text-[8px] text-[#4cc9f0]">
                CARICAMENTO FEEDBACK...
              </div>
            ) : inbox.length === 0 ? (
              <div className="py-10 text-center bg-[#090d18] border-2 border-[#2e3d6b] text-xl text-[#94a3b8]">
                Nessun feedback ricevuto al momento.
              </div>
            ) : (
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
                {inbox.map((item) => {
                  const badgeStyle =
                    item.category === "bug"
                      ? "bg-[#ff4d6d] text-white"
                      : item.category === "apprezzamento"
                        ? "bg-[#38e54d] text-black"
                        : "bg-[#4cc9f0] text-black";

                  return (
                    <div
                      key={item.id}
                      className={`border-[3px] p-2.5 ${
                        item.isRead
                          ? "border-[#2e3d6b] bg-[#090d18] opacity-75"
                          : "border-[#ffd166] bg-[#141b33]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 font-pixel text-[6px] ${badgeStyle}`}
                          >
                            {item.category.toUpperCase()}
                          </span>
                          <span className="font-pixel text-[8px] text-[#ffd166] truncate">
                            {item.nickname}
                          </span>
                        </div>
                        <span className="text-sm text-[#94a3b8] shrink-0">
                          {new Date(item.createdAt).toLocaleString("it-IT", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-xl text-[#f4f1de] leading-snug whitespace-pre-wrap break-words mb-2">
                        {item.message}
                      </p>

                      <div className="flex gap-1.5 justify-end">
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void handleToggleRead(item)}
                          className="nes-btn px-2 py-1 bg-[#26335c] text-white text-[7px]"
                        >
                          {item.isRead
                            ? "📩 SEGNA DA LEGGERE"
                            : "✓ SEGNA LETTO"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void handleDeleteFeedback(item.id)}
                          className="nes-btn px-2 py-1 bg-[#be123c] text-white text-[7px]"
                        >
                          🗑 ELIMINA
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
