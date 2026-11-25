# 👾 Marsala Quest 8-Bit — Cronache di Lilibeo

<p align="center">
  <img src="public/Marsala-Quest-8bit-ico.png" alt="Marsala Quest 8-Bit Logo" width="128" />
</p>

**Marsala Quest 8-Bit** è una web app mobile-first di esplorazione urbana geolocalizzata in stile **NES / 8-Bit** ambientata a **Marsala (TP), Sicilia**.
Cammina per la città dall'antico promontorio di **Capo Boeo** fino alla **Laguna dello Stagnone**, alle **Saline Genna**, alle **Cantine storiche** e a **Lido Signorino** per sbloccare tutti i **20 luoghi iconici**, dissolvere la nebbia grigia sulla mappa e completare la tua **Marsala-Dex**.

---

## ✨ Funzionalità Principali

### 🗺️ Mappa Fog-of-War a Puzzle (Voronoi GPU)

- **Colorazione progressiva:** la mappa parte interamente desaturata in scala di grigi. Ogni luogo sbloccato illumina la propria tessera di puzzle (tassellatura di Voronoi sincronizzata su `<canvas>` GPU con `mix-blend-mode: color`), saldandosi alle zone adiacenti senza buchi grigi fino a colorare l'intera Marsala al **20/20**.
- **Filtri persistenti sincronizzati:** attiva **Solo mancanti** nella Dex per nascondere sulla mappa i luoghi già conquistati (`★`) e concentrarti solo sugli obiettivi ancora da raggiungere (`?`).

### 🧭 Navigazione Pedonale, Bussola & Indicatore Direzionale

- **Percorso stradale reale:** toccando **🧭 GUIDAMI** su un monumento, l'app traccia il percorso pedonale lungo le vie reali di Marsala con distanza a piedi e minuti stimati.
- **Bussola 8-Bit & Freccia Avatar:** quadrante con punti cardinali fissi (`N / S / E / O`), supporto alla bussola magnetica iOS/Android (`DeviceOrientationEvent`), indicazioni di svolta in tempo reale (_Vai dritto_, _Gira a destra_, _Gira a sinistra_) e freccia direzionale dinamica sotto lo sprite del giocatore.

### 📸 Trading Card Fotografiche & Edizioni Speciali

- **Verifica GPS reale:** avvicinati entro il raggio del luogo, scatta una foto con la fotocamera del telefono e applica il **filtro pixel-art 8-bit** (attivabile/disattivabile).
- **Dettagli certificati:** ogni Card integra nome, zona, descrizione storica, curiosità, nickname, coordinate GPS e data dello scatto, ed è esportabile/condivisibile nativamente su iOS e Android (`Web Share API`).
- **Edizioni Orarie & Olografiche:**
  - 🌅 **Golden Hour Edition** (`17:00–20:00` ora italiana): cornice tramonto e **+50 XP bonus**.
  - 🌙 **Night Edition** (`20:00–06:00` ora italiana): cornice notturna neon e **+50 XP bonus**.
  - ✦ **Holo Edition**: carte olografiche iridescenti sbloccate in modalità **Prestigio**.

### 📖 Marsala-Dex, Daily Bounty & 9 Segreti Storici

- **Obiettivo del Giorno (Daily Bounty):** ogni giorno un luogo casuale di Marsala assegna XP bonus e incrementa la tua **Streak giornaliera** (`🔥`).
- **9 Easter Egg storici e interattivi:** scopri segreti nascosti legati alla storia di Lilibeo e Marsala (_Sbarco dei Mille 1860_, _Nave Punica 397 a.C._, _Oracolo della Sibilla Lilibetana_, _Cantina Woodhouse 1773_, _Custode del Cassaro_, _Vento dello Stagnone_, _Tramonto allo Stagnone_, _Notte di Lilibeo_ e _Modalità Game Boy_).

### 👕 Personalizzazione Avatar (30 Capi), Titoli & Prestigio

- **Armadio 8-Bit:** 30 capi e accessori pixel-art tra **8 cappelli**, **7 occhiali/visori**, **8 maglie/armature** e **7 pantaloni/tuniche** (puoi aprire il guardaroba anche toccando direttamente il tuo personaggio sulla mappa).
- **Titoli Equipaggiabili:** 8 titoli sbloccabili tramite traguardi, visibili nell'HUD, in classifica, sulla Medaglia e nella Cartolina.
- **New Game+ / Prestigio (`★P1+`):** completato il 100% della mappa ottieni la **Medaglia di Lilibeo** scaricabile e puoi attivare il Prestigio per rigiocare l'intera città con raggio GPS più stretto, **+25% XP** e **Card Olografiche**.

### 📮 Cartolina di Viaggio 8-Bit & Classifica

- **Cartolina verticale (`1080×1920`):** genera un'immagine pronta per WhatsApp e Instagram Stories con il tuo avatar, il titolo, le statistiche, la mappa reale di Marsala con le tessere conquistate a colori e le **3 Card migliori scelte da te** in vetrina.
- **High Scores & Retro FX:** classifica globale in tempo reale, sintetizzatore audio chiptune (Web Audio API) e filtro scanlines **CRT** attivabile/disattivabile.

---

## 🛠️ Stack Tecnologico

| Livello             | Tecnologie                                                                   |
| :------------------ | :--------------------------------------------------------------------------- |
| **Frontend**        | React, TypeScript, Vite, Tailwind CSS, Leaflet, HTML5 Canvas & SVG Pixel Art |
| **Backend**         | Node.js, Express, TypeScript (`tsx`), JWT (`jsonwebtoken`), `bcryptjs`       |
| **Database**        | PostgreSQL (`pg` / Neon Serverless)                                          |
| **Mappe & Routing** | OpenStreetMap, OSRM Pedestrian Routing, Proxy Tile server-side con cache     |
| **Deploy**          | Vercel (Frontend) + Render (Backend API)                                     |

---

## 📁 Struttura del Progetto

```text
marsala-quest-8bit/
├── public/
│   └── Marsala-Quest-8bit-ico.png   # Icona e logo 8-bit dell'app
├── shared/
│   ├── cosmetics.ts                 # Catalogo 30 capi, 8 titoli e logica sblocco
│   └── pois.ts                      # Database 20 POI di Marsala, 9 segreti, edizioni e calcoli GPS
├── server/
│   ├── db.ts                        # Connessione PostgreSQL, migrazioni e query
│   ├── index.ts                     # API REST Express, auth JWT, proxy tasselli OSM e Superuser
│   └── schema.sql                   # Schema SQL completo (users, unlocks, easter_eggs)
└── src/
    ├── components/
    │   ├── AuthScreen.tsx           # Login e registrazione giocatore
    │   ├── AvatarWardrobeModal.tsx  # Armadio 8-bit e selezione titoli
    │   ├── CameraCardModal.tsx      # Fotocamera, filtro 8-bit, Trading Card e condivisione
    │   ├── HudAndDex.tsx            # HUD superiore, Dock inferiore, Marsala-Dex e Classifica
    │   ├── LilibeoMedalModal.tsx    # Generatore Medaglia di Lilibeo con gradi Prestigio
    │   ├── MarsalaFogMap.tsx        # Mappa interattiva Leaflet + Puzzle Voronoi + freccia avatar
    │   ├── PixelAvatar.tsx          # Renderer SVG pixel-art dell'avatar
    │   ├── TravelPostcardModal.tsx  # Generatore Cartolina di Viaggio 8-Bit condivisibile
    │   └── WayfinderCompass.tsx     # Bussola direzionale e navigatore pedonale
    ├── hooks/
    │   ├── useEasterEggs.ts         # Rilevamento Konami Code e fasce orarie speciali
    │   └── useRealGps.ts            # Geolocation watcher + bussola hardware iOS/Android
    ├── services/
    │   └── api.ts                   # Client HTTP tipizzato verso il backend
    ├── types/
    │   └── game.ts                  # Interfacce TypeScript condivise nel frontend
    ├── utils/
    │   ├── avatarPixels.ts          # Matrice pixel 16x20 per tutti i capi e accessori
    │   ├── shareImage.ts            # Condivisione nativa Web Share API + fallback download
    │   ├── sound8bit.ts             # Effetti sonori chiptune sintetizzati via Web Audio API
    │   └── walkingRoute.ts          # Calcolo percorso pedonale lungo le strade
    └── App.tsx                      # Orchestrazione stato globale e modali
```

---

## ⚙️ Configurazione e Avvio Locale

### 1. Requisiti

- **Node.js** `>= 20`
- Un database **PostgreSQL** (es. [Neon](https://neon.tech) o istanza locale)

### 2. Installazione

```bash
git clone [https://github.com/tuo-username/marsala-quest-8bit.git](https://github.com/tuo-username/marsala-quest-8bit.git)
cd marsala-quest-8bit
npm install
```

### 3. Variabili d'Ambiente

Crea un file `.env` nella root del progetto (e imposta le stesse variabili su **Render** per il backend e `VITE_API_URL` su **Vercel** per il frontend):

```env
# Backend (Render / locale)
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=inserisci-una-chiave-segreta-lunga-e-casuale
FRONTEND_URL=http://localhost:5173

# Account Superuser opzionale per test (sblocco/rollback rapido Card, segreti e look)
SUPERUSER_USERNAME=admin
SUPERUSER_NICKNAME=EsploratoreAdmin
SUPERUSER_PASSWORD=inserisci-password-sicura

# Frontend (Vercel / locale)
VITE_API_URL=http://localhost:3001
```

### 4. Avvio in Sviluppo

Avvia in due terminali separati il server API e il client Vite:

```bash
# Terminale 1 — Backend API
npx tsx watch server/index.ts

# Terminale 2 — Frontend React
npm run dev
```

### 5. Build di Produzione

```bash
npm run build
```

---

## 🗄️ Inizializzazione Database

All'avvio del server (`initDb()`), le tabelle `users`, `unlocks` ed `easter_eggs` vengono create e aggiornate automaticamente. In alternativa è disponibile lo script SQL completo in [`server/schema.sql`](server/schema.sql).

---

## 📜 Licenza

Progetto sviluppato a scopo ludico e culturale per valorizzare il patrimonio storico, archeologico e naturalistico di **Marsala (Lilibeo)**. Dati cartografici © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
