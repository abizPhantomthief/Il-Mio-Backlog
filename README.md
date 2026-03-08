# 🎮 Il Mio Backlog Videoludico

Un'applicazione web costruita con **React** per gestire, filtrare e scegliere cosa giocare dalla propria collezione di videogiochi.

## ✨ Funzionalità

### 📋 Gestione Libreria
- **🔍 Filtri Avanzati**: Ricerca per titolo, saga, anno di uscita, anno di gioco, stato di completamento, categoria, piattaforma e tipo (Giochi Base/DLC)
- **📊 Ordinamento**: Ordina per titolo (A-Z, Z-A), anno di uscita (crescente/decrescente) o piattaforma specifica
- **📌 Sistema di Pin**: Fissa i titoli preferiti in cima alla lista
- **👁️ Due Visualizzazioni**:
  - **Vista Griglia**: Card verticali classiche con informazioni al passaggio del mouse
  - **Vista Lista**: Layout orizzontale con tutti i dettagli visibili e sfondo colorato in base allo stato

### 🎯 Sistema di Valutazione
- **📊 Voto Metacritic**: Assegna un voto da 1 a 100 a ogni gioco
  - 🟢 Verde: 75-100 (giochi eccellenti)
  - 🟡 Giallo: 50-74 (giochi nella media)
  - 🔴 Rosso: 1-49 (giochi insufficienti)

### 🎲 Randomizer
- **Funzione "Cosa Gioco?"**: Animazione con spinner per scegliere casualmente un gioco dal backlog
- **📌 Pin dalla Random**: Possibilità di fissare il gioco estratto in cima alla lista
- **📜 Cronologia**: Visualizza gli ultimi 5 giochi estratti

### 🏷️ Classificazioni
- **Stati Disponibili**: Non Giocato, In corso, Completato, Sospeso, Droppato
- **📚 Saghe**: Riconoscimento automatico delle saghe con filtro dedicato
- **🏷️ Categorie**: Tag multipli per ogni gioco (es: Action, RPG, Indie)
- **🎮 Piattaforme**: Supporto per piattaforme multiple per gioco

### 📦 DLC, Espansioni e Riedizioni
- **Gestione DLC**: Collega DLC, espansioni e riedizioni ai giochi base tramite `parentId` e `dlcType`
- **🎯 Tipologie DLC**:
  - 📦 DLC (Contenuti scaricabili)
  - 🎮 Espansione (Contenuti espansivi)
  - 🔄 Riedizione (Versioni rimasterizzate/ristampe)
- **📂 Container Espandibile**: Visualizza i DLC collegati a ogni gioco base con un clic
- **🔍 Filtro DLC**: Filtra per visualizzare solo Giochi Base, solo DLC/Espansioni, o tutti
- **📅 Filtro Anno Intelligente**: I giochi base appaiono anche quando si filtra per anno se i loro DLC sono stati giocati in quell'anno
- **📊 Statistiche Esclusive**: I DLC non vengono conteggiati nelle statistiche generali (solo giochi base)
- **🏷️ Etichetta Gioco Base**: Quando si visualizzano i DLC separatamente, viene mostrato il gioco base di appartenenza

### 🔐 Admin Mode
- **🔓 Accesso Protetto**: Attivabile con combinazione di tasti (Alt + L) e password
- **✏️ Modifica Rapida**: Modifica tutti i campi di un gioco tramite modale con anteprima
- **🗑️ Eliminazione**: Rimuovi giochi dalla collezione con conferma
- **➕ Aggiungi Nuovo Gioco**: Form completo con anteprima in tempo reale della card
- **📦 Gestione DLC**: Assegna un gioco come DLC/Espansione/Riedizione selezionando il tipo e il gioco base

### 🎨 Interfaccia
- **🌓 Dark/Light Mode**: Toggle per cambiare tema con salvataggio nelle preferenze
- **📱 Responsive Design**: Ottimizzato per desktop, tablet e mobile
- **📲 Sidebar Collapsible**: Menu laterale espandibile/riducibile
- **🎨 Colori Dinamici**: Badge colorati per stati e valutazioni
- **💫 Animazioni DLC**: Transizioni fluide per l'espansione dei container DLC

## 🛠️ Tech Stack
- **Frontend**: React.js
- **State Management**: React Hooks (useState, useEffect)
- **HTTP Client**: Axios
- **Data**: JSON-based database
- **Deployment**: Vercel

## ⌨️ Scorciatoie
- **Alt + L**: Attiva modalità Admin (richiede password)

## 🚀 Demo Live
Puoi visualizzare il progetto qui: [https://il-mio-backlog.vercel.app](https://il-mio-backlog.vercel.app)

## 📁 Struttura Progetto
```
frontend/
├── public/          # File statici
├── src/
│   ├── app.js       # Componente principale
│   ├── app.css      # Stili
│   └── index.js     # Entry point
└── package.json     # Dipendenze
```

## 🎯 Come Iniziare
1. Installa le dipendenze: `npm install`
2. Avvia il server di sviluppo: `npm start`
3. Apri [http://localhost:3000](http://localhost:3000) nel browser

## 📝 Note
- I dati vengono sincronizzati con il backend su `localhost:5000` in sviluppo
- In produzione, i dati sono caricati da `games.json`
- Le preferenze (Dark Mode, cronologia spinner) sono salvate in localStorage
- I DLC sono identificati tramite i campi `parentId` (ID del gioco base) e `dlcType` (dlc/espansione/riedizione)
