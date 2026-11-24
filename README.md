<p align="center">
  <img src="public/logo.png" alt="Marsala Quest 8-Bit Logo" width="140" />
</p>

# 🕹️ MARSALA QUEST 8-BIT — Cronache di Lilibeo

Web app mobile-first in stile **retro gaming 8-bit (NES / Game Boy Color)** dedicata all'esplorazione dal vivo della città di **Marsala (TP)**.

L'intera mappa della città parte completamente **in scala di grigi**. Raggiungendo fisicamente i **20 punti di interesse reali** (verificati tramite GPS lato server) e scattando una foto sul posto, il giocatore genera una **Card Collezionabile 8-Bit** e sblocca a colori quella porzione di mappa in stile _Fog-of-War_, fino a illuminare l'intera Marsala e conquistare la **Medaglia d'Oro di Lilibeo**.

---

## ✨ Funzionalità principali

- **Mappa Fog-of-War dinamica (Grigio → Colore):** mappa reale zoomabile di tutta Marsala (da Torre di San Teodoro e Isola di Mozia fino a Lido Signorino e Strasatti). Un motore a 3 layer Leaflet + Canvas 2D mantiene in grigio le aree inesplorate e rivela a colori solo le zone attorno ai luoghi sincronizzati.
- **20 Punti di Interesse Reali:** coordinate geografiche verificate suddivise tra Centro Storico, Capo Boeo/Archeologia, Cantine Storiche, Riserva dello Stagnone e Costa Sud.
- **Verifica GPS Reale lato server:** calcolo della distanza con formula di Haversine sia sul client che sul backend Express per impedire sblocchi falsati.
- **Fotocamera Retro & Trading Card PNG:** scatto nativo da smartphone (iOS/Android) o mirino live in-app, filtro pixel-art 8-bit opzionale e generazione automatica della Card con rarità, XP, nickname e coordinate certificate scaricabile sul dispositivo.
- **Account Personale & Classifica:** registrazione/login con JWT + password hashate (`bcryptjs`), scelta del **Nickname** personale, salvataggio persistente su PostgreSQL e classifica **High Scores** degli esploratori.
- **Medaglia d'Oro di Lilibeo:** sbloccata al 100% di completamento, con l'antico emblema storico di Lilibeo al centro (Corona Turrita, Lira di Apollo delle monete `ΛΙΛΥΒΑΙΤΑΝ` e prua della Nave Punica) e Diploma PNG scaricabile.
- **Interfaccia Smartphone-First & Audio 8-Bit:** layout pensato per l'uso a una mano (Bottom Dock, modali bottom-sheet, supporto safe-area iOS/Android), CRT scanlines attivabili e sintetizzatore chiptune Web Audio API.
- **5 Easter Egg nascosti:** palette Game Boy 1989, Tramonto Rosa dello Stagnone, Piroscafi del 1860, Oracolo della Sibilla e Segreto di Woodhouse 1773.

---

## 🛠️ Stack Tecnologico

| Livello      | Tecnologie                                                                  |
| :----------- | :-------------------------------------------------------------------------- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Canvas 2D, Web Audio API |
| **Backend**  | Node.js, Express, TypeScript (`tsx`), JWT, `bcryptjs`, CORS                 |
| **Database** | PostgreSQL (`pg`) con inizializzazione automatica dello schema              |
| **Deploy**   | Vercel (Frontend HTTPS) + Render (Backend API) + Neon (PostgreSQL)          |

---

## 📁 Struttura del Progetto

```text
marsala-quest-8bit/
├── index.html                  # Entry HTML + meta tag PWA/iOS
├── vercel.json                 # Routing SPA + Permissions-Policy (GPS & Camera)
├── shared/
│   └── pois.ts                 # 20 POI reali di Marsala, Easter Egg e Haversine
├── server/
│   ├── schema.sql              # Schema SQL di riferimento (users, unlocks, easter_eggs)
│   ├── db.ts                   # Pool PostgreSQL e query parametrizzate
│   └── index.ts                # API Express, Auth JWT e verifica GPS server-side
└── src/
    ├── App.tsx                 # Stato principale, Easter Egg e orchestrazione UI
    ├── hooks/
    │   ├── useRealGps.ts       # Geolocation API ad alta precisione con retry
    │   └── useEasterEggs.ts    # Konami Code e controllo orario tramonto
    ├── services/api.ts         # Client HTTP tipizzato con token JWT
    ├── utils/sound8bit.ts      # Motore audio chiptune Web Audio API
    └── components/
        ├── AuthScreen.tsx      # Login / Registrazione con Nickname
        ├── MarsalaFogMap.tsx   # Mappa 3-layer con Fog-of-War dinamica
        ├── CameraCardModal.tsx # Fotocamera mobile + generatore Card PNG
        ├── HudAndDex.tsx       # Top HUD, Bottom Dock, Marsala-Dex e High Scores
        └── LilibeoMedalModal.tsx # Medaglia finale di Lilibeo + Diploma PNG
```
