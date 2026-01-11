import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaga, setSelectedSaga] = useState('Tutte');
  const [filterYear, setFilterYear] = useState('Tutti');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // STATO ADMIN PROTETTO
  const [isAdmin, setIsAdmin] = useState(false);

  // LOGICA DI ACCESSO (Premi 'L' per inserire password)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'l' || e.key === 'L') {
        const passwordSegreta = "listone"; // <--- CAMBIA QUESTA
        const inserimento = prompt("Accesso protetto. Inserisci codice:");
        if (inserimento === passwordSegreta) {
          setIsAdmin(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const [isSpinning, setIsSpinning] = useState(false);
  const [chosenGame, setChosenGame] = useState(null);
  const [spinTitle, setSpinTitle] = useState('');
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('spinHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [newGame, setNewGame] = useState({
    titolo: '', copertina: '', saga: '', annoUscita: '', annoGiocato: '', piattaforma: '', stato: 'Non Giocato'
  });

  useEffect(() => {
    localStorage.setItem('spinHistory', JSON.stringify(history));
  }, [history]);

  // Sostituisci la funzione fetchGames esistente con questa
  const fetchGames = async () => {
    try {
      // Prova a leggere dal server locale se sei in sviluppo, 
      // altrimenti legge il file statico games.json
      const url = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api/games' 
        : './games.json';
      
      const res = await axios.get(url);
      setGames(res.data);
    } catch (err) { 
      console.error("Errore caricamento dati:", err); 
    }
  };

  useEffect(() => { fetchGames(); }, []);

  const dividiStringa = (valore) => {
    if (!valore) return [];
    return String(valore).split(',').map(item => item.trim()).filter(item => item !== "");
  };

  const getColorStato = (stato) => {
    switch (stato) {
      case 'Completato': return '#27ae60';
      case 'In corso': return '#f1c40f';
      case 'Droppato': return '#e74c3c';
      case 'Sospeso': return '#e67e22';
      default: return '#7f8c8d';
    }
  };

  const pulisciNomeSaga = (saga) => {
    if (!saga) return "";
    return String(saga).replace(/Series/gi, "").replace(/Saga/gi, "").trim();
  };

  const modificaCampo = async (id, campo, valore) => {
    if (!isAdmin) return;
    const nuovaLista = games.map(g => g.id === id ? { ...g, [campo]: String(valore).trim() } : g);
    setGames(nuovaLista);
    await axios.post('http://localhost:5000/api/games/update', nuovaLista);
  };

  const aggiungiGioco = async (e) => {
    e.preventDefault();
    const nuovoGiocoConId = { ...newGame, id: Date.now() };
    const nuovaLista = [...games, nuovoGiocoConId];
    setGames(nuovaLista);
    await axios.post('http://localhost:5000/api/games/update', nuovaLista);
    setNewGame({ titolo: '', copertina: '', saga: '', annoUscita: '', annoGiocato: '', piattaforma: '', stato: 'Non Giocato' });
    setShowAddForm(false);
  };

  const eliminaGioco = async (id, titolo) => {
    if (!isAdmin) return;
    if (window.confirm(`Eliminare "${titolo}"?`)) {
      const nuovaLista = games.filter(g => g.id !== id);
      setGames(nuovaLista);
      await axios.post('http://localhost:5000/api/games/update', nuovaLista);
    }
  };

  const avviaSpinner = () => {
    const backlog = games.filter(g => g.stato === 'Non Giocato');
    if (backlog.length === 0) return alert("Nessun gioco 'Non Giocato'!");
    setIsSpinning(true);
    setChosenGame(null);
    let durataTotale = 4000;
    let intervallo = 50;
    let tempoTrascorso = 0;
    const spin = () => {
      const randomTmp = backlog[Math.floor(Math.random() * backlog.length)];
      setSpinTitle(randomTmp.titolo);
      tempoTrascorso += intervallo;
      if (tempoTrascorso < durataTotale) setTimeout(spin, intervallo);
      else {
        const finale = backlog[Math.floor(Math.random() * backlog.length)];
        setChosenGame(finale);
        setHistory(prev => [finale.titolo, ...prev].slice(0, 5));
        setIsSpinning(false);
      }
    };
    spin();
  };

  const anniPerFiltro = [...new Set(games.flatMap(g => dividiStringa(g.annoGiocato)))].sort((a, b) => b - a);
  
  const filteredGames = games
    .filter(game => {
      const matchesSearch = game.titolo?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = filterYear === 'Tutti' || dividiStringa(game.annoGiocato).includes(filterYear);
      const matchesSaga = selectedSaga === 'Tutte' || (selectedSaga === 'Senza Saga' ? !pulisciNomeSaga(game.saga) : pulisciNomeSaga(game.saga) === selectedSaga);
      return matchesSearch && matchesYear && matchesSaga;
    })
    .sort((a, b) => a.titolo.localeCompare(b.titolo));

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'Segoe UI', overflow: 'hidden' }}>
      
      <style>{`
        body { margin: 0; padding: 0; background-color: #0a0a0a; }
        .game-card { position: relative; border-radius: 12px; background: #161616; border: 1px solid #333; overflow: hidden; display: flex; flex-direction: column; }
        .card-rigiocato { border: 1px solid #f1c40f !important; }
        .platform-chip { background: rgba(0, 209, 178, 0.15); color: #00d1b2; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-right: 6px; margin-bottom: 6px; display: inline-block; }
        .year-chip { background: #252525; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-right: 6px; margin-bottom: 6px; display: inline-block; border: 1px solid #444; }
        .status-badge { font-size: 10px; text-transform: uppercase; font-weight: 900; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 8px; }
        
        .image-container { position: relative; height: 340px; background: #000; overflow: hidden; }
        .blur-bg { position: absolute; inset: -10px; background-size: cover; background-position: center; filter: blur(15px) brightness(0.4); z-index: 1; }
        .main-img { position: relative; width: 100%; height: 100%; object-fit: contain; z-index: 2; }

        .info-mask { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; z-index: 5; backdrop-filter: blur(10px); background: rgba(0,0,0,0.85); }
        .game-card:hover .info-mask { opacity: ${isAdmin ? 1 : 0}; pointer-events: ${isAdmin ? 'all' : 'none'}; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 999; display: flex; align-items: center; justify-content: center; }
        .modal-content { background: #1a1a1a; padding: 40px; border-radius: 20px; border: 2px solid #f1c40f; text-align: center; max-width: 450px; width: 90%; }
        .btn-spin { background: linear-gradient(45deg, #f1c40f, #e67e22); color: black; border: none; padding: 14px; border-radius: 10px; font-weight: 900; cursor: pointer; width: 100%; margin-bottom: 10px; text-transform: uppercase; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: '280px', padding: '20px', borderRight: '1px solid #333', background: '#111', flexShrink: 0, overflowY: 'auto' }}>
        <h2 style={{ color: '#00d1b2', marginBottom: '5px' }}>🎮 My Games</h2>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
          Totale: {games.length} | Da giocare: {games.filter(g => g.stato === 'Non Giocato').length}
          {isAdmin && <span style={{ color: '#f1c40f', marginLeft: '10px' }}>● ADMIN</span>}
        </div>
        
        <button className="btn-spin" onClick={avviaSpinner}>🎲 DECIDI COSA GIOCARE</button>

        {/* FUNZIONE AGGIUNTA GIOCO RIPRISTINATA */}
        {isAdmin && (
          <div style={{ marginTop: '10px', marginBottom: '20px' }}>
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              style={{ width: '100%', padding: '12px', background: '#00d1b2', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {showAddForm ? 'ANNULLA' : '+ AGGIUNGI GIOCO'}
            </button>

            {showAddForm && (
              <form onSubmit={aggiungiGioco} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', marginTop: '10px', border: '1px solid #00d1b2' }}>
                <input placeholder="Titolo" required style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#222', border: '1px solid #444', color: 'white' }} value={newGame.titolo} onChange={e => setNewGame({...newGame, titolo: e.target.value})} />
                <input placeholder="Anno Uscita" style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#222', border: '1px solid #444', color: 'white' }} value={newGame.annoUscita} onChange={e => setNewGame({...newGame, annoUscita: e.target.value})} />
                <input placeholder="Copertina URL" required style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#222', border: '1px solid #444', color: 'white' }} value={newGame.copertina} onChange={e => setNewGame({...newGame, copertina: e.target.value})} />
                <input placeholder="Saga" style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#222', border: '1px solid #444', color: 'white' }} value={newGame.saga} onChange={e => setNewGame({...newGame, saga: e.target.value})} />
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#2ecc71', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>SALVA GIOCO</button>
              </form>
            )}
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <div style={{ cursor: 'pointer', padding: '10px', color: selectedSaga === 'Tutte' ? '#00d1b2' : '#888' }} onClick={() => setSelectedSaga('Tutte')}>Tutte le Saghe</div>
          {[...new Set(games.map(g => pulisciNomeSaga(g.saga)))].filter(s => s).sort().map(s => (
            <div key={s} style={{ cursor: 'pointer', padding: '10px', color: selectedSaga === s ? '#00d1b2' : '#888' }} onClick={() => setSelectedSaga(s)}>{s}</div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <input 
            type="text" 
            placeholder="Cerca titolo..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ flex: 1, padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: 'white' }} 
          />
          <select 
            value={filterYear} 
            onChange={e => setFilterYear(e.target.value)} 
            style={{ padding: '12px', background: '#1a1a1a', color: '#00d1b2', borderRadius: '8px', border: '1px solid #333', cursor: 'pointer' }}
          >
            <option value="Tutti">Tutti gli Anni</option>
            {anniPerFiltro.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' }}>
          {filteredGames.map(game => (
            <div key={game.id} className={`game-card ${dividiStringa(game.annoGiocato).length > 1 ? 'card-rigiocato' : ''}`}>
              <div className="image-container">
                <div className="blur-bg" style={{ backgroundImage: `url(${game.copertina})` }}></div>
                <img src={game.copertina} className="main-img" alt={game.titolo} />
                {isAdmin && (
                  <div className="info-mask">
                    <button onClick={() => eliminaGioco(game.id, game.titolo)} style={{ position: 'absolute', top: 10, left: 10, background: '#e74c3c', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}>🗑</button>
                    <select style={{ marginBottom: '10px', padding: '8px', borderRadius: '5px', background: getColorStato(game.stato), color: 'white', border: 'none', fontWeight: 'bold' }} value={game.stato} onChange={e => modificaCampo(game.id, 'stato', e.target.value)}>
                      {['Non Giocato', 'Completato', 'In corso', 'Sospeso', 'Droppato'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input placeholder="Anno Uscita" style={{ background: '#000', border: '1px solid #444', color: 'white', padding: '5px', textAlign: 'center', width: '80%', marginBottom: '5px' }} defaultValue={game.annoUscita} onBlur={e => modificaCampo(game.id, 'annoUscita', e.target.value)} />
                    <input placeholder="Saga" style={{ background: '#000', border: '1px solid #444', color: 'white', padding: '5px', textAlign: 'center', width: '80%', marginBottom: '5px' }} defaultValue={game.saga} onBlur={e => modificaCampo(game.id, 'saga', e.target.value)} />
                    <input placeholder="Anni Giocati" style={{ background: '#000', border: '1px solid #444', color: 'white', padding: '5px', textAlign: 'center', width: '80%', marginBottom: '5px' }} defaultValue={game.annoGiocato} onBlur={e => modificaCampo(game.id, 'annoGiocato', e.target.value)} />
                    <input placeholder="Piattaforme" style={{ background: '#000', border: '1px solid #444', color: 'white', padding: '5px', textAlign: 'center', width: '80%' }} defaultValue={game.piattaforma} onBlur={e => modificaCampo(game.id, 'piattaforma', e.target.value)} />
                  </div>
                )}
              </div>
              <div style={{ padding: '15px' }}>
                <div className="status-badge" style={{ backgroundColor: getColorStato(game.stato) }}>{game.stato}</div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                  {game.titolo} <span style={{ fontSize: '14px', color: '#555' }}>({game.annoUscita || 'N/A'})</span>
                </h4>
                <div>{dividiStringa(game.piattaforma).map((p, i) => <span key={i} className="platform-chip">{p}</span>)}</div>
                <div style={{ marginTop: '5px' }}>{dividiStringa(game.annoGiocato).map((a, i) => <span key={i} className="year-chip">📅 {a}</span>)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(isSpinning || chosenGame) && (
        <div className="modal-overlay">
          <div className="modal-content">
            {isSpinning ? (
              <div><h2 style={{ color: '#f1c40f' }}>ANALISI BACKLOG...</h2><div style={{ fontSize: '24px', fontWeight: 'bold', margin: '30px 0' }}>{spinTitle}</div></div>
            ) : (
              <div>
                <h2 style={{ color: '#f1c40f' }}>DESTINO CONFERMATO:</h2>
                <img src={chosenGame.copertina} style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '10px' }} alt="" />
                <h1 style={{ margin: '20px 0' }}>{chosenGame.titolo}</h1>
                <button onClick={() => setChosenGame(null)} style={{ background: '#f1c40f', color: 'black', border: 'none', padding: '12px 40px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ACCETTO</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;