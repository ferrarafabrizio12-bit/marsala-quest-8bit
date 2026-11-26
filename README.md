# 👾 Marsala Quest 8-Bit — Cronache di Lilibeo

<p align="center">
  <img src="public/Marsala-Quest-8bit-ico.png" alt="Marsala Quest 8-Bit Logo" width="128" />
</p>

<p align="center">
  <strong>v1.0.0</strong> • Web App Mobile-First di Esplorazione Urbana Geolocalizzata in Stile 8-Bit
</p>

**Marsala Quest 8-Bit** è una web app interattiva in stile **NES / 8-Bit** ambientata a **Marsala (TP), Sicilia**.  
Esplora dal vivo la città dall'antico promontorio di **Capo Boeo** fino al **Centro Storico**, alle **Cantine storiche**, alle **Saline Genna**, alla **Laguna dello Stagnone** e a **Lido Signorino** per sbloccare tutti i **20 luoghi iconici**, dissolvere la nebbia grigia sulla mappa e completare la tua **Marsala-Dex**.

---

## ✨ Funzionalità Principali

### 🗺️ Mappa Fog-of-War a Puzzle (Voronoi GPU)

- **Colorazione progressiva:** la mappa parte interamente in scala di grigi. Ogni luogo conquistato illumina la propria tessera di puzzle (tassellatura di Voronoi renderizzata su `<canvas>` con `mix-blend-mode: color`), saldandosi alle zone vicine fino a restituire tutti i colori a Marsala al **20/20**.
- **Filtri persistenti sincronizzati:** attiva **Solo mancanti** o **Più vicini a me** nella Dex; il filtro _Solo mancanti_ nasconde automaticamente dalla mappa i luoghi già conquistati (`★`) lasciando in evidenza solo gli obiettivi rimanenti (`?`).

### 🧭 Navigazione Pedonale, Bussola 8-Bit & Freccia Avatar

- **Percorso stradale reale:** toccando **🧭 GUIDAMI** su un monumento, l'app traccia l'itinerario pedonale lungo le vie reali di Marsala con distanza e tempo stimato a piedi.
- **Bussola magnetica & Indicatore direzionale:** quadrante 8-bit con supporto ai sensori di orientamento iOS/Android (`DeviceOrientationEvent`), indicazioni di svolta in tempo reale e freccia direzionale dinamica sotto lo sprite del giocatore.

### 📸 Trading Card Fotografiche & Edizioni Speciali

- **Verifica GPS reale:** avvicinati entro il raggio del luogo, scatta una foto con la fotocamera del dispositivo e scegli se applicare il **filtro Pixel 8-Bit**.
- **Card certificata e condivisibile:** integra nome, zona, descrizione storica, curiosità, nickname, coordinate GPS e data dello scatto, con salvataggio e condivisione nativa (`Web Share API`).
- **Edizioni Orarie & Olografiche:**
  - 🌅 **Golden Hour Edition** (`17:00–20:00` ora italiana): cornice tramonto e **+50 XP bonus**.
  - 🌙 **Night Edition** (`20:00–06:00` ora italiana): cornice notturna neon e **+50 XP bonus**.
  - ✦ **Holo Edition**: carte olografiche iridescenti ottenibili in modalità **Prestigio**.

### 📖 Marsala-Dex, Daily Bounty & 9 Segreti Storici

- **Obiettivo del Giorno (Daily Bounty):** ogni giorno un monumento casuale assegna XP extra e fa crescere la tua **Streak giornaliera** (`🔥`).
- **9 Segreti (Easter Egg):** scopri sfide e curiosità nascoste legate alla storia di Lilibeo e Marsala (tra cui _11 Maggio 1860_, _Nave Punica 397 a.C._, _Oracolo della Sibilla_, _Cantina Woodhouse 1773_, _Custode del Cassaro_, _Vento dello Stagnone_, _Tramonto allo Stagnone_, _Notte di Lilibeo_ e _Modalità Game Boy_).

### 🧑 Creazione Avatar, Armadio 8-Bit & Titoli

- **Aspetto base gratuito (senza achievement):** sia durante la registrazione (con anteprima live) sia in qualsiasi momento nella scheda **`🧑 ASPETTO`** dell'Armadio puoi personalizzare liberamente:
  - **Genere:** Esploratore (`♂`) o Esploratrice (`♀`)
  - **Carnagione:** 4 tonalità (Chiara, Mediterranea, Ambrata, Scura)
  - **Capelli:** 5 colori (Castano, Nero, Biondo, Rosso, Grigio) e 5 tagli (Corti, Ciuffo, Ricci, Lunghi, Rasati)
  - **Barba (profilo maschile):** 4 stili (Corta, Pizzetto, Baffi, Folta) + Nessuna, abbinati al colore dei capelli
- **Armadio & Titoli sbloccabili:** **31 capi pixel-art** (cappelli, occhiali/visori, maglie/armature, pantaloni/tuniche) e **9 titoli equipaggiabili** sbloccabili tramite Card, segreti, edizioni speciali, streak e Prestigio (accessibili dal Dock **`👕 LOOK`** o toccando il tuo personaggio sulla mappa).

### ⚡ Prestigio / New Game+ (fino a ★P5 MAX) & Medaglie

- **Progressione Prestigio (da `★P1` a `★P5`):** completato il 20/20 puoi attivare il **New Game+** fino al livello massimo **Prestigio 5**, conservando XP, vestiti e segreti, e ripartendo sulla mappa grigia con raggio GPS più stretto, **+25% XP** cumulativo per livello e **Card Olografiche ✦**.
- **Ricompense Uniche ★P5 MAX:** completando il **20/20 al Prestigio 5** sblocchi il titolo unico **`⚜️ Immortale di Lilibeo ★5`**, il capo leggendario **`Manto Imperiale ★5`** e la **`Medaglia Immortale di Lilibeo ★5 MAX`** scaricabile e condivisibile.

### 📮 Cartolina di Viaggio 8-Bit, Classifica & Retro FX

- **Cartolina verticale (`1080×1920`):** genera un'immagine pronta per WhatsApp e Instagram Stories con avatar, titolo, statistiche, mappa reale OpenStreetMap di Marsala colorata in base ai tuoi progressi (tramite proxy server-side CORS-safe) e le **3 Card preferite** scelte in vetrina.
- **High Scores (`🏆 TOP`) & Atmosfera Retrò:** classifica globale in tempo reale, sintetizzatore audio chiptune (Web Audio API) e filtro scanlines **CRT** attivabile/disattivabile.

### 🎓 Onboarding, Feedback Privato, About Me & Modalità App

- **Login con visibilità password:** pulsante occhietto integrato nella barra password sia in accesso che in registrazione.
- **Tutorial interattivo per nuovi utenti:** percorso guidato in **7 step** mostrato automaticamente solo al primo accesso dei nuovi account (rivedibile in qualsiasi momento dal menu **`ℹ️`**), inclusa la guida per aggiungere la web app alla schermata Home su **iPhone (Safari)** e **Android (Chrome)**.
- **Sezione `ℹ️` (Feedback, About Me & Versione):** modulo privato per segnalare bug, idee o apprezzamenti allo sviluppatore (con **cooldown anti-spam di 12 ore** per utente e countdown live), pagina di presentazione del progetto con link social, nota **Privacy & GPS** e versione dell'app in formato **SemVer**.
- **Modalità Gestore / Superuser (opzionale via env):** include Inbox privata in-app per leggere e gestire i feedback, badge supremo dedicato in classifica, set/medaglia esclusivi del creatore e strumenti rapidi di test.

---

## 🔒 Sicurezza & Hardening

L'app è configurata per la pubblicazione su web con protezioni lato server e lato client:

- **HTTP Security Headers:** `helmet` sul backend Express e intestazioni dedicate in `vercel.json` (`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` limitata a `camera=(self)` e `geolocation=(self)`).
- **Rate Limiting (`express-rate-limit`):** limiti per IP su login (`10 / 15 min`), registrazione (`5 / ora`), API generali (`120 / min`) e proxy tasselli mappa (`180 / min`).
- **CORS restrittivo:** in produzione sono autorizzate esclusivamente le origini dichiarate in `FRONTEND_URL`.
- **Validazione payload & immagini:** limite JSON a `2 MB` e accettazione lato client solo di immagini raster Base64 (`jpeg`, `png`, `webp`) per impedire upload di file non validi o SVG malevoli.
- **Autenticazione & DB:** password hashate con `bcryptjs`, sessioni firmate via JWT (`jsonwebtoken`), verifiche di autorizzazione server-side e query SQL interamente parametrizzate su PostgreSQL.
- **Privacy:** la posizione GPS viene utilizzata esclusivamente a schermo aperto per navigazione e verifica sblocco dei luoghi (nessun tracciamento in background).

---

## 🛠️ Stack Tecnologico

| Livello             | Tecnologie                                                                                  |
| :------------------ | :------------------------------------------------------------------------------------------ |
| **Frontend**        | React, TypeScript, Vite, Tailwind CSS, Leaflet, HTML5 Canvas & SVG Pixel Art                |
| **Backend**         | Node.js, Express, TypeScript (`tsx`), `helmet`, `express-rate-limit`, JWT, `bcryptjs`       |
| **Database**        | PostgreSQL (`pg` / Neon Serverless)                                                         |
| **Mappe & Routing** | OpenStreetMap, OSRM Pedestrian Routing, Proxy Tile server-side con cache e verifica binaria |
| **Deploy**          | Vercel (Frontend) + Render (Backend API)                                                    |

---

## 📁 Struttura del Progetto

```text
marsala-quest-8bit/
├── public/
│   └── Marsala-Quest-8bit-ico.png        # Icona e logo 8-bit dell'app
├── shared/
│   ├── cosmetics.ts                      # Aspetto base, catalogo capi/titoli, regole Prestigio ★5 e SU
│   ├── pois.ts                           # 20 POI di Marsala, 9 segreti, edizioni orarie e calcoli GPS
│   └── version.ts                        # Versione centralizzata dell'app (SemVer)
├── server/
│   ├── db.ts                             # Pool PostgreSQL, migrazioni automatiche e query
│   ├── index.ts                          # API REST Express, sicurezza, rate limit, auth JWT e proxy OSM
│   └── schema.sql                        # Schema SQL completo (users, unlocks, easter_eggs, feedbacks)
├── src/
│   ├── components/
│   │   ├── AuthScreen.tsx                # Login/Registrazione con occhietto password e creatore avatar live
│   │   ├── AvatarWardrobeModal.tsx       # Schede Aspetto libero, Vestiti e Titoli
│   │   ├── CameraCardModal.tsx           # Fotocamera, filtro 8-bit, Trading Card e condivisione
│   │   ├── HudAndDex.tsx                 # HUD superiore, Dock inferiore, Marsala-Dex e High Scores
│   │   ├── InfoFeedbackModal.tsx         # Feedback con timer 12h, About Me, Privacy, SemVer e Inbox SU
│   │   ├── LilibeoMedalModal.tsx         # Generatore Medaglie (Standard, Immortale ★5 MAX, Creatore)
│   │   ├── MarsalaFogMap.tsx             # Mappa Leaflet + Puzzle Voronoi GPU + freccia direzionale avatar
│   │   ├── OnboardingTutorialModal.tsx   # Benvenuto e tutorial 7 step (incluso installa su Home)
│   │   ├── PixelAvatar.tsx               # Renderer SVG pixel-art dell'avatar
│   │   ├── TravelPostcardModal.tsx       # Generatore Cartolina di Viaggio 8-Bit (1080×1920)
│   │   └── WayfinderCompass.tsx          # Bussola 8-bit e navigatore pedonale
│   ├── hooks/
│   │   ├── useEasterEggs.ts              # Konami Code e fasce orarie speciali
│   │   └── useRealGps.ts                 # Geolocation watcher + bussola magnetica iOS/Android
│   ├── services/
│   │   └── api.ts                        # Client HTTP tipizzato verso il backend
│   ├── types/
│   │   └── game.ts                       # Interfacce TypeScript del frontend
│   ├── utils/
│   │   ├── avatarPixels.ts               # Matrice pixel 16×20 (pelle, capelli, barba, vestiti)
│   │   ├── shareImage.ts                 # Condivisione nativa Web Share API + fallback download
│   │   ├── sound8bit.ts                  # Sintetizzatore effetti chiptune (Web Audio API)
│   │   └── walkingRoute.ts               # Percorso pedonale lungo le strade reali
│   └── App.tsx                           # Orchestrazione stato globale e modali
└── vercel.json                           # Header di sicurezza HTTP per il deploy su Vercel
```

---

## 🏷️ Versionamento (SemVer)

La versione dell'app è centralizzata in [`shared/version.ts`](shared/version.ts) (esposta nella sezione **Feedback** del menu `ℹ️` e nell'endpoint `/api/health`) e segue lo schema `MAJOR.MINOR.PATCH`:

- **`PATCH`** (es. `1.0.0` → `1.0.1`): piccoli fix e correzione bug.
- **`MINOR`** (es. `1.0.1` → `1.1.0`): nuove funzionalità e contenuti (azzera `PATCH`).
- **`MAJOR`** (es. `1.1.0` → `2.0.0`): cambiamenti strutturali importanti (azzera `MINOR` e `PATCH`).

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
JWT_SECRET=inserisci-una-chiave-casuale-di-almeno-32-caratteri
FRONTEND_URL=http://localhost:5173

# Account Superuser opzionale (Inbox feedback, badge supremo e strumenti di test)
SUPERUSER_USERNAME=admin
SUPERUSER_NICKNAME=EsploratoreAdmin
SUPERUSER_PASSWORD=inserisci-password-sicura

# Frontend (Vercel / locale)
VITE_API_URL=http://localhost:3001
```

> **In produzione su Render:** imposta `NODE_ENV=production` e valorizza `FRONTEND_URL` con l'URL esatto del deploy Vercel senza slash finale (es. `https://marsala-quest-8bit.vercel.app`).

### 4. Avvio in Sviluppo

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

## 🗄️ Database

All'avvio del server (`initDb()`), le tabelle `users`, `unlocks`, `easter_eggs` e `feedbacks` vengono create e aggiornate automaticamente. Lo script SQL completo è disponibile in [`server/schema.sql`](server/schema.sql).

---

## 👨‍💻 Autore & Licenza

Progetto ideato e sviluppato da **Fabrizio Ferrara**, Ingegnere Informatico con base a **Marsala (TP)**, per valorizzare il patrimonio storico, archeologico e naturalistico del territorio attraverso un'esperienza interattiva dedicata a turisti e residenti.

Dati cartografici © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
