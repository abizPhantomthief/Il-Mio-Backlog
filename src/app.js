import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaga, setSelectedSaga] = useState('Tutte');
  const [filterYear, setFilterYear] = useState('Tutti');
  const [filterStatus, setFilterStatus] = useState('Tutti');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Password e Accesso Admin
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        const passwordSegreta = "listone";
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
    titolo: '', copertina: '', saga: '', annoUscita: '', annoGiocato: '', piattaforma: '', stato: 'Non Giocato', note: '', categoria: '', pinned: false
  });

  useEffect(() => { localStorage.setItem('spinHistory', JSON.stringify(history)); }, [history]);

  const fetchGames = async () => {
    try {
      const url = window.location.hostname === 'localhost' ? 'http://localhost:5000/api/games' : 'games.json';
      const res = await axios.get(url);
      setGames(res.data);
    } catch (err) { console.error("Errore caricamento dati:", err); }
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
    if (!isAdmin && campo !== 'pinned') return; // Permetti il pin solo se admin o se preferisci gestirlo diversamente
    if (campo === 'pinned' && !isAdmin) return; // Impedisci agli utenti di cambiare i tuoi pin
    
    const nuovaLista = games.map(g => g.id === id ? { ...g, [campo]: valore } : g);
    setGames(nuovaLista);
    if (window.location.hostname === 'localhost') {
      await axios.post('http://localhost:5000/api/games/update', nuovaLista);
    }
  };

  const aggiungiGioco = async (e) => {
    e.preventDefault();
    const nuovoGiocoConId = { ...newGame, id: Date.now() };
    const nuovaLista = [...games, nuovoGiocoConId];
    setGames(nuovaLista);
    if (window.location.hostname === 'localhost') {
      await axios.post('http://localhost:5000/api/games/update', nuovaLista);
    }
    setNewGame({ titolo: '', copertina: '', saga: '', annoUscita: '', annoGiocato: '', piattaforma: '', stato: 'Non Giocato', note: '', categoria: '', pinned: false });
    setShowAddForm(false);
  };

  const eliminaGioco = async (id, titolo) => {
    if (!isAdmin) return;
    if (window.confirm(`Eliminare "${titolo}"?`)) {
      const nuovaLista = games.filter(g => g.id !== id);
      setGames(nuovaLista);
      if (window.location.hostname === 'localhost') {
        await axios.post('http://localhost:5000/api/games/update', nuovaLista);
      }
    }
  };

  const avviaSpinner = () => {
    const backlog = games.filter(g => g.stato === 'Non Giocato');
    if (backlog.length === 0) return alert("Nessun gioco 'Non Giocato'!");
    setIsSpinning(true);
    setChosenGame(null);
    let durataTotale = 3000;
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

  const getSagaStats = () => {
    const stats = { 'Senza Saga': 0 };
    games.forEach(g => {
      const nomePulito = pulisciNomeSaga(g.saga);
      if (!nomePulito || nomePulito === "" || nomePulito === "-") {
        stats['Senza Saga']++;
      } else {
        stats[nomePulito] = (stats[nomePulito] || 0) + 1;
      }
    });
    return stats;
  };
  const sagaStats = getSagaStats();

  const anniPerFiltro = [...new Set(games.flatMap(g => dividiStringa(g.annoGiocato)))].sort((a, b) => b - a);
  const suggerimentiSaghe = [...new Set(games.map(g => g.saga))].filter(s => s && s !== "" && s !== "-").sort();
  const suggerimentiCategorie = [...new Set(games.flatMap(g => dividiStringa(g.categoria)))].sort();
  const suggerimentiPiattaforme = [...new Set(games.flatMap(g => dividiStringa(g.piattaforma)))].sort();

  const filteredGames = games
    .filter(game => {
      const matchesSearch = game.titolo?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = filterYear === 'Tutti' || dividiStringa(game.annoGiocato).includes(filterYear);
      const matchesSaga = selectedSaga === 'Tutte' || (selectedSaga === 'Senza Saga' ? !pulisciNomeSaga(game.saga) : pulisciNomeSaga(game.saga) === selectedSaga);
      const matchesStatus = filterStatus === 'Tutti' || game.stato === filterStatus;
      return matchesSearch && matchesYear && matchesSaga && matchesStatus;
    })
    .sort((a, b) => {
      // ORDINE: PRIMA I PINNED
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      if (selectedSaga !== 'Tutte' && selectedSaga !== 'Senza Saga') {
        const annoA = parseInt(a.annoUscita) || 9999;
        const annoB = parseInt(b.annoUscita) || 9999;
        return annoA - annoB;
      }
      return a.titolo.localeCompare(b.titolo);
    });

  const inputStyle = {
    width: '100%',
    padding: '12px',
    background: '#222',
    border: '1px solid #444',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'Segoe UI', overflow: 'hidden', position: 'relative' }}>

      <datalist id="lista-saghe">
        {suggerimentiSaghe.map((s, i) => <option key={i} value={s} />)}
      </datalist>
      <datalist id="lista-categorie">
        {suggerimentiCategorie.map((c, i) => <option key={i} value={c} />)}
      </datalist>
      <datalist id="lista-piattaforme">
        {suggerimentiPiattaforme.map((p, i) => <option key={i} value={p} />)}
      </datalist>

      <style>{`
        body { margin: 0; padding: 0; background-color: #0a0a0a; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; border: 2px solid #0a0a0a; }
        ::-webkit-scrollbar-thumb:hover { background: #00d1b2; }
        
        .game-card { position: relative; border-radius: 12px; background: #161616; border: 1px solid #333; overflow: hidden; display: flex; flex-direction: column; transition: all 0.3s ease; }
        .game-card:hover { transform: translateY(-5px); border-color: #00d1b2; }
        .game-card.pinned { border: 2px solid #00d1b2; box-shadow: 0 0 15px rgba(0, 209, 178, 0.2); }
        
        .pin-btn { position: absolute; top: 10px; left: 10px; z-index: 10; cursor: pointer; font-size: 20px; transition: 0.3s; filter: drop-shadow(0 0 5px rgba(0,0,0,0.5)); }
        .pin-btn:hover { transform: scale(1.2); }

        .platform-chip { background: rgba(0, 209, 178, 0.15); color: #00d1b2; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-right: 6px; margin-bottom: 6px; display: inline-block; }
        .category-chip { background: rgba(255, 255, 255, 0.08); color: #aaa; padding: 4px 10px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; font-size: 11px; font-weight: bold; margin-right: 6px; margin-bottom: 6px; display: inline-block; }
        .status-badge { font-size: 10px; text-transform: uppercase; font-weight: 900; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 8px; }
        .image-container { position: relative; height: 320px; background: #000; overflow: hidden; }
        .blur-bg { position: absolute; inset: -10px; background-size: cover; background-position: center; filter: blur(15px) brightness(0.3); z-index: 1; }
        .main-img { position: relative; width: 100%; height: 100%; object-fit: contain; z-index: 2; }
        .info-mask { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; z-index: 5; backdrop-filter: blur(8px); background: rgba(0,0,0,0.8); }
        .game-card:hover .info-mask { opacity: 1; pointer-events: all; }
        .sidebar { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; z-index: 100; }
        .mobile-toggle { display: none; position: fixed; bottom: 20px; right: 20px; background: #00d1b2; color: black; border: none; width: 60px; height: 60px; border-radius: 50%; z-index: 1000; font-size: 24px; box-shadow: 0 4px 20px rgba(0,211,178,0.4); cursor: pointer; }
        .btn-spin { background: linear-gradient(45deg, #f1c40f, #e67e22); color: black; border: none; padding: 14px; border-radius: 10px; font-weight: 900; cursor: pointer; width: 100%; margin-bottom: 10px; text-transform: uppercase; transition: 0.2s; }
        .btn-spin:hover { transform: scale(1.02); filter: brightness(1.1); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 999; display: flex; align-items: center; justify-content: center; }
        .modal-content { background: #1a1a1a; padding: 40px; border-radius: 20px; border: 2px solid #f1c40f; text-align: center; max-width: 450px; width: 90%; box-shadow: 0 0 30px rgba(241,196,15,0.2); }
        @media (max-width: 768px) {
          .sidebar { position: fixed; left: ${isMobileOpen ? '0' : '-100%'}; width: 85% !important; height: 100%; box-shadow: 10px 0 30px rgba(0,0,0,0.8); }
          .mobile-toggle { display: block; }
          .main-content { padding: 15px !important; }
        }
      `}</style>

      <button className="mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
        {isMobileOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <div className="sidebar" style={{ width: isCollapsed ? '70px' : '280px', padding: isCollapsed ? '20px 10px' : '20px', borderRight: '1px solid #333', background: '#111', flexShrink: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: '25px' }}>
          {!isCollapsed && <h2 style={{ color: '#00d1b2', margin: 0, fontSize: '20px', letterSpacing: '1px' }}>🎮 LA MIA LISTA</h2>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} style={{ background: '#222', border: '1px solid #444', color: '#00d1b2', cursor: 'pointer', borderRadius: '6px', padding: '5px 8px' }}>
            {isCollapsed ? '➡' : '⬅'}
          </button>
        </div>

        {!isCollapsed && (
          <>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px', background: '#1a1a1a', padding: '10px', borderRadius: '8px' }}>
              Totale: <b>{games.length}</b> | Da giocare: <b>{games.filter(g => g.stato === 'Non Giocato').length}</b>
              {isAdmin && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: '10px' }}>● ADMIN ATTIVO</span>
                  <button onClick={() => setIsAdmin(false)} style={{ background: 'none', border: 'none', color: '#f1c40f', cursor: 'pointer', fontSize: '10px', textDecoration: 'underline', padding: 0 }}>ESCI</button>
                </div>
              )}
            </div>

            <button className="btn-spin" onClick={() => { avviaSpinner(); setIsMobileOpen(false); }}>🎲 COSA GIOCO?</button>

            {isAdmin && (
              <div style={{ marginTop: '10px', marginBottom: '20px' }}>
                <button onClick={() => setShowAddForm(!showAddForm)} style={{ width: '100%', padding: '12px', background: '#00d1b2', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {showAddForm ? 'CHIUDI' : '+ AGGIUNGI GIOCO'}
                </button>
                {showAddForm && (
                  <div className="modal-overlay">
                    <div style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #333', width: '95%', maxWidth: '1000px', display: 'flex', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                      <div style={{ flex: 1, padding: '30px', overflowY: 'auto', borderRight: '1px solid #333' }}>
                        <h2 style={{ color: '#00d1b2', marginTop: 0 }}>Nuovo Videogioco</h2>
                        <form onSubmit={aggiungiGioco} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <input placeholder="Titolo" required style={inputStyle} value={newGame.titolo} onChange={e => setNewGame({ ...newGame, titolo: e.target.value })} />
                          <input placeholder="Copertina URL" required style={inputStyle} value={newGame.copertina} onChange={e => setNewGame({ ...newGame, copertina: e.target.value })} />
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder="Saga" list="lista-saghe" style={inputStyle} value={newGame.saga} onChange={e => setNewGame({ ...newGame, saga: e.target.value })} />
                            <input placeholder="Categoria" list="lista-categorie" style={inputStyle} value={newGame.categoria} onChange={e => setNewGame({ ...newGame, categoria: e.target.value })} />
                            <input placeholder="Anno Uscita" style={inputStyle} value={newGame.annoUscita} onChange={e => setNewGame({ ...newGame, annoUscita: e.target.value })} />
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder="Piattaforme (es: PC, PS5)" list="lista-piattaforme" style={inputStyle} value={newGame.piattaforma} onChange={e => setNewGame({ ...newGame, piattaforma: e.target.value })} />
                            <input placeholder="Anno Giocato" style={inputStyle} value={newGame.annoGiocato} onChange={e => setNewGame({ ...newGame, annoGiocato: e.target.value })} />
                          </div>
                          <select style={inputStyle} value={newGame.stato} onChange={e => setNewGame({ ...newGame, stato: e.target.value })}>
                            {['Non Giocato', 'In corso', 'Completato', 'Sospeso', 'Droppato'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <textarea placeholder="Note personali..." style={{ ...inputStyle, height: '80px', resize: 'none' }} value={newGame.note} onChange={e => setNewGame({ ...newGame, note: e.target.value })} />
                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '15px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>ANNULLA</button>
                            <button type="submit" style={{ flex: 1, padding: '15px', background: '#00d1b2', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>SALVA GIOCO</button>
                          </div>
                        </form>
                      </div>
                      <div style={{ width: '350px', background: '#0d0d0d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <p style={{ color: '#444', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '20px' }}>Anteprima Card</p>
                        <div className="game-card" style={{ width: '280px' }}>
                          <div className="image-container">
                            <div className="blur-bg" style={{ backgroundImage: `url(${newGame.copertina})` }}></div>
                            <img src={newGame.copertina || 'https://via.placeholder.com/300x400?text=Copertina'} className="main-img" alt="Preview" />
                          </div>
                          <div style={{ padding: '15px' }}>
                            <div className="status-badge" style={{ backgroundColor: getColorStato(newGame.stato) }}>{newGame.stato}</div>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{newGame.titolo || 'Titolo del Gioco'}</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                              {dividiStringa(newGame.piattaforma).map((p, i) => <span key={i} className="platform-chip">{p}</span>)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '10px' }}>
              <p style={{ color: '#444', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Saghe</p>
              <div style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', background: selectedSaga === 'Tutte' ? '#00d1b222' : 'transparent', color: selectedSaga === 'Tutte' ? '#00d1b2' : '#888', marginBottom: '5px', fontSize: '14px' }}
                onClick={() => { setSelectedSaga('Tutte'); setIsMobileOpen(false); }}>Tutte le Saghe</div>
              <div style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', background: selectedSaga === 'Senza Saga' ? '#00d1b222' : 'transparent', color: selectedSaga === 'Senza Saga' ? '#00d1b2' : '#888', marginBottom: '5px', fontSize: '14px' }}
                onClick={() => { setSelectedSaga('Senza Saga'); setIsMobileOpen(false); }}>
                Senza Saga <span style={{ opacity: 0.5, fontSize: '11px' }}>({sagaStats['Senza Saga']})</span>
              </div>
              {Object.keys(sagaStats).filter(s => s !== 'Senza Saga').sort().map(s => (
                <div key={s} style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', background: selectedSaga === s ? '#00d1b222' : 'transparent', color: selectedSaga === s ? '#00d1b2' : '#888', fontSize: '14px', marginBottom: '2px' }}
                  onClick={() => { setSelectedSaga(s); setIsMobileOpen(false); }}>
                  {s} <span style={{ opacity: 0.5, fontSize: '11px' }}>({sagaStats[s]} {sagaStats[s] === 1 ? 'titolo' : 'titoli'})</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, padding: '40px', overflowY: 'auto', background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '40px' }}>
          <input type="text" placeholder="🔍 Cerca tra i tuoi giochi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, minWidth: '250px', padding: '15px', background: '#161616', border: '1px solid #333', borderRadius: '12px', color: 'white', fontSize: '16px' }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '15px', background: '#161616', color: filterStatus === 'Tutti' ? '#00d1b2' : getColorStato(filterStatus), borderRadius: '12px', border: `1px solid ${filterStatus === 'Tutti' ? '#333' : getColorStato(filterStatus)}`, cursor: 'pointer', fontWeight: 'bold' }}>
            <option value="Tutti">📊 Tutti gli Stati</option>
            {['Non Giocato', 'In corso', 'Completato', 'Sospeso', 'Droppato'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ padding: '15px', background: '#161616', color: '#00d1b2', borderRadius: '12px', border: '1px solid #333', fontWeight: 'bold', cursor: 'pointer' }}>
            <option value="Tutti">📅 Anni Giocati</option>
            {anniPerFiltro.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '30px' }}>
          {filteredGames.map(game => (
            <div key={game.id} className={`game-card ${game.pinned ? 'pinned' : ''}`}>
              
              {/* TASTO PIN */}
              {(isAdmin || game.pinned) && (
                <div 
                  className="pin-btn" 
                  onClick={() => modificaCampo(game.id, 'pinned', !game.pinned)}
                  title={game.pinned ? "Rimuovi Pin" : "Pinna in alto"}
                  style={{ opacity: isAdmin ? 1 : 0.8, pointerEvents: isAdmin ? 'all' : 'none' }}
                >
                  {game.pinned ? '📌' : '📍'}
                </div>
              )}

              <div className="image-container">
                <div className="blur-bg" style={{ backgroundImage: `url(${game.copertina})` }}></div>
                <img src={game.copertina} className="main-img" alt={game.titolo} loading="lazy" />
                <div className="info-mask">
                  {isAdmin ? (
                    <div style={{ width: '90%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button onClick={() => eliminaGioco(game.id, game.titolo)} style={{ alignSelf: 'center', background: '#e74c3c', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>ELIMINA 🗑</button>
                      <select style={{ padding: '8px', borderRadius: '5px', background: getColorStato(game.stato), color: 'white', border: 'none', fontWeight: 'bold', textAlign: 'center' }} value={game.stato} onChange={e => modificaCampo(game.id, 'stato', e.target.value)}>
                        {['Non Giocato', 'Completato', 'In corso', 'Sospeso', 'Droppato'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input placeholder="Saga" list="lista-saghe" style={{ background: '#000', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '5px', textAlign: 'center' }} defaultValue={game.saga || ''} onBlur={e => modificaCampo(game.id, 'saga', e.target.value)} />
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input placeholder="Categoria" list="lista-categorie" style={{ flex: 2, background: '#000', border: '1px solid #444', color: '#aaa', padding: '8px', borderRadius: '5px', textAlign: 'center', fontSize: '11px' }} defaultValue={game.categoria || ''} onBlur={e => modificaCampo(game.id, 'categoria', e.target.value)} />
                        <input placeholder="Anno" style={{ flex: 1, background: '#000', border: '1px solid #444', color: '#aaa', padding: '8px', borderRadius: '5px', textAlign: 'center', fontSize: '11px' }} defaultValue={game.annoUscita || ''} onBlur={e => modificaCampo(game.id, 'annoUscita', e.target.value)} />
                      </div>
                      <input placeholder="Piattaforme" list="lista-piattaforme" style={{ background: '#000', border: '1px solid #444', color: '#00d1b2', padding: '8px', borderRadius: '5px', textAlign: 'center', fontWeight: 'bold' }} defaultValue={game.piattaforma || ''} onBlur={e => modificaCampo(game.id, 'piattaforma', e.target.value)} />
                      <input placeholder="Anno Giocato" style={{ background: '#000', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '5px', textAlign: 'center' }} defaultValue={game.annoGiocato || ''} onBlur={e => modificaCampo(game.id, 'annoGiocato', e.target.value)} />
                      <input placeholder="Note" style={{ background: '#000', border: '1px solid #444', color: 'white', padding: '8px', borderRadius: '5px', textAlign: 'center' }} defaultValue={game.note || ''} onBlur={e => modificaCampo(game.id, 'note', e.target.value)} />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      {game.saga && game.saga !== "-" && <h3 style={{ color: '#00d1b2', margin: '0 0 10px 0', fontSize: '18px' }}>{game.saga}</h3>}
                      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '5px' }}>
                        {dividiStringa(game.categoria).map((c, i) => (
                          <span key={i} style={{ color: '#aaa', fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>#{c}</span>
                        ))}
                      </div>
                      <p style={{ margin: '5px 0', color: '#ccc' }}>Giocato nel: <b>{game.annoGiocato || '---'}</b></p>
                      {game.note && <p style={{ fontSize: '12px', color: '#f1c40f', fontStyle: 'italic', marginTop: '10px' }}>{game.note}</p>}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                <div className="status-badge" style={{ backgroundColor: getColorStato(game.stato) }}>{game.stato}</div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', lineHeight: '1.2' }}>
                  {game.titolo}
                  {game.annoUscita && <span style={{ color: '#777', fontWeight: 'normal', fontSize: '14px', marginLeft: '8px' }}>({game.annoUscita})</span>}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {dividiStringa(game.piattaforma).slice(0, 3).map((p, i) => <span key={i} className="platform-chip">{p}</span>)}
                  {dividiStringa(game.categoria).map((c, i) => <span key={i} className="category-chip">{c}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(isSpinning || chosenGame) && (
        <div className="modal-overlay">
          <div className="modal-content">
            {isSpinning ? (
              <div>
                <div style={{ fontSize: '50px', marginBottom: '20px' }}>🎯</div>
                <h2 style={{ color: '#f1c40f', letterSpacing: '2px' }}>SCEGLIENDO...</h2>
                <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '30px 0', color: 'white', minHeight: '60px' }}>{spinTitle}</div>
              </div>
            ) : (
              <div>
                <h2 style={{ color: '#2ecc71', marginBottom: '20px' }}>PROSSIMA AVVENTURA:</h2>
                <img src={chosenGame.copertina} style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', borderRadius: '15px' }} alt="" />
                <h1 style={{ margin: '20px 0', fontSize: '28px' }}>{chosenGame.titolo}</h1>
                <button onClick={() => setChosenGame(null)} style={{ background: '#f1c40f', color: 'black', border: 'none', padding: '15px 50px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>OTTIMO!</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;