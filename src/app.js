import { useState, useEffect } from 'react';
import axios from 'axios';
import './app.css';

const App = () => {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaga, setSelectedSaga] = useState('Tutte');
  const [filterYear, setFilterYear] = useState('Tutti');
  const [filterStatus, setFilterStatus] = useState('Tutti');
  const [filterCategory, setFilterCategory] = useState('Tutte');
  const [filterDlc, setFilterDlc] = useState('Tutti');
  const [sortTitle, setSortTitle] = useState('Default');
  const [sortYear, setSortYear] = useState('Default');
  const [sortPlatform, setSortPlatform] = useState('Default');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showStats, setShowStats] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editedGameData, setEditedGameData] = useState(null);

  const openEditModal = (game) => {
    setEditingGame(game);
    setEditedGameData({ ...game });
  };

  const closeEditModal = () => {
    setEditingGame(null);
    setEditedGameData(null);
  };

  const saveGameChanges = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const nuovaLista = games.map(g => g.id === editedGameData.id ? editedGameData : g);
    setGames(nuovaLista);
    if (window.location.hostname === 'localhost') {
      await axios.post('http://localhost:5000/api/games/update', nuovaLista);
    }
    setIsSaving(false);
    setEditingGame(null);
    setEditedGameData(null);
  };

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
  const [showPinNotification, setShowPinNotification] = useState(false);
  const [spinTitle, setSpinTitle] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('spinHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [newGame, setNewGame] = useState({
    titolo: '', copertina: '', saga: '', annoUscita: '', annoGiocato: '', piattaforma: '', stato: 'Non Giocato', note: '', categoria: '', pinned: false, voto: '', dlcType: '', parentId: null
  });

  const [expandedDlcs, setExpandedDlcs] = useState({});

  const toggleDlcExpand = (gameId) => {
    setExpandedDlcs(prev => ({ ...prev, [gameId]: !prev[gameId] }));
  };

  const getDlcTypeLabel = (type) => {
    switch (type) {
      case 'dlc': return '📦 DLC';
      case 'espansione': return '🎮 Espansione';
      case 'riedizione': return '🔄 Riedizione';
      default: return '📦 DLC';
    }
  };

  const getDlcTypeColor = (type) => {
    switch (type) {
      case 'dlc': return 'linear-gradient(135deg, #f39c12, #e67e22)';
      case 'espansione': return 'linear-gradient(135deg, #9b59b6, #8e44ad)';
      case 'riedizione': return 'linear-gradient(135deg, #3498db, #2980b9)';
      default: return 'linear-gradient(135deg, #f39c12, #e67e22)';
    }
  };

  const getDlcsForGame = (gameId) => {
    return games.filter(g => g.parentId === gameId);
  };

  useEffect(() => { localStorage.setItem('spinHistory', JSON.stringify(history)); }, [history]);

  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(isDarkMode)); }, [isDarkMode]);

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

  const getColorStatoTransparent = (stato) => {
    switch (stato) {
      case 'Completato': return 'rgba(39, 174, 96, 0.15)';
      case 'In corso': return 'rgba(241, 196, 15, 0.15)';
      case 'Droppato': return 'rgba(231, 76, 60, 0.15)';
      case 'Sospeso': return 'rgba(230, 126, 34, 0.15)';
      default: return 'rgba(127, 140, 141, 0.15)';
    }
  };

  const getMetacriticColor = (voto) => {
    if (!voto || voto === '-' || voto === '') return '#555';
    const num = parseInt(voto);
    if (num >= 75) return '#66cc33'; // Verde
    if (num >= 50) return '#ffcc33'; // Giallo
    return '#ff3333'; // Rosso
  };

  const formatStatoDisplay = (stato) => {
    return stato?.toUpperCase();
  };

  const pulisciNomeSaga = (saga) => {
    if (!saga) return "";
    return String(saga).replace(/Series/gi, "").replace(/Saga/gi, "").trim();
  };

  const renderGameCardGrid = (game) => {
    const dlcs = getDlcsForGame(game.id);
    const hasDlcs = dlcs.length > 0;
    const isExpanded = expandedDlcs[game.id] || false;

    return (
      <div key={game.id} className={`game-card ${game.pinned ? 'pinned' : ''}`}>
        {(isAdmin || game.pinned) && (
          <>
            <div
              className="pin-btn"
              onClick={() => modificaCampo(game.id, 'pinned', !game.pinned)}
              title={game.pinned ? "Rimuovi Pin" : "Pinna in alto"}
              style={{ opacity: isAdmin ? 1 : 0.8, pointerEvents: isAdmin ? 'all' : 'none' }}
            >
              {game.pinned ? '📌' : '📍'}
            </div>
            {isAdmin && (
              <button className="edit-btn-card" onClick={() => openEditModal(game)} title="Modifica gioco">
                ⚙️
              </button>
            )}
          </>
        )}

        {hasDlcs && (
          <button
            className="dlc-expand-btn"
            onClick={() => toggleDlcExpand(game.id)}
            title={isExpanded ? "Nascondi DLC" : "Mostra DLC"}
          >
            {isExpanded ? '▲' : '▼'} {dlcs.length} DLC/Espansioni/Riedizioni
          </button>
        )}

        <div className="image-container">
          <div className="blur-bg" style={{ backgroundImage: `url(${game.copertina})` }}></div>
          <img src={game.copertina} className="main-img" alt={game.titolo} loading="lazy" />
          <div className="metacritic-score-card" style={{ backgroundColor: getMetacriticColor(game.voto) }}>
            {game.voto && game.voto !== '-' && game.voto !== '' ? game.voto : '-'}
          </div>
          <div className="info-mask">
            {isAdmin ? (
              <div className="info-mask-admin">
                <button className="delete-btn" onClick={() => eliminaGioco(game.id, game.titolo)}>ELIMINA 🗑</button>
                <p className="info-mask-hint">Usa l'ingranaggio per modificare</p>
              </div>
            ) : (
              <div className="info-mask-center">
                {game.saga && game.saga !== "-" && <h3 className="saga-info">{game.saga}</h3>}
                <div className="category-tags">
                  {dividiStringa(game.categoria).map((c, i) => (
                    <span key={i} className="category-tag">#{c}</span>
                  ))}
                </div>
                <p className="played-info">Giocato nel: <b>{game.annoGiocato || '---'}</b></p>
                {game.note && <p className="note-text">{game.note}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="card-content">
          <div className="status-badge" style={{ backgroundColor: getColorStato(game.stato) }}><span className="status-display">{formatStatoDisplay(game.stato)}</span></div>
          <h4 className="card-title">
            {game.titolo}
            {game.annoUscita && <span className="year">({game.annoUscita})</span>}
          </h4>
          <div className="platforms-tags">
            {dividiStringa(game.piattaforma).slice(0, 3).map((p, i) => <span key={i} className="platform-chip">{p}</span>)}
            {dividiStringa(game.categoria).map((c, i) => <span key={i} className="category-chip">{c}</span>)}
          </div>
        </div>

        {hasDlcs && isExpanded && (
          <div className="dlc-container">
            {dlcs.map(dlc => (
              <div key={dlc.id} className="dlc-card">
                <div className="dlc-badge" style={{ background: getDlcTypeColor(dlc.dlcType || 'dlc') }}>{getDlcTypeLabel(dlc.dlcType || 'dlc')}</div>
                <img src={dlc.copertina} className="dlc-img" alt={dlc.titolo} />
                <div className="dlc-content">
                  <h5 className="dlc-title">{dlc.titolo}</h5>
                  <div className="dlc-meta">
                    {dlc.annoUscita && <span className="dlc-year">{dlc.annoUscita}</span>}
                    <span className="dlc-status" style={{ color: getColorStato(dlc.stato) }}>{formatStatoDisplay(dlc.stato)}</span>
                    {dlc.voto && dlc.voto !== '-' && dlc.voto !== '' && (
                      <span className="dlc-vote" style={{ backgroundColor: getMetacriticColor(dlc.voto) }}>{dlc.voto}</span>
                    )}
                  </div>
                  <div className="dlc-played-platform">
                    <span className="dlc-played-info">Giocato nel: <b>{dlc.annoGiocato || '---'}</b></span>
                    <div className="dlc-platforms">
                      {dividiStringa(dlc.piattaforma).slice(0, 3).map((p, i) => <span key={i} className="platform-chip">{p}</span>)}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button className="dlc-edit-btn" onClick={() => openEditModal(dlc)}>⚙️</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGameCardList = (game) => {
    const dlcs = getDlcsForGame(game.id);
    const hasDlcs = dlcs.length > 0;
    const isExpanded = expandedDlcs[game.id] || false;

    return (
      <div
        key={game.id}
        className={`game-card ${game.pinned ? 'pinned' : ''}`}
        style={{ backgroundColor: getColorStatoTransparent(game.stato) }}
      >
        {(isAdmin || game.pinned) && (
          <>
            <div
              className="pin-btn"
              onClick={() => modificaCampo(game.id, 'pinned', !game.pinned)}
              title={game.pinned ? "Rimuovi Pin" : "Pinna in alto"}
              style={{ opacity: isAdmin ? 1 : 0.8, pointerEvents: isAdmin ? 'all' : 'none' }}
            >
              {game.pinned ? '📌' : '📍'}
            </div>
            {isAdmin && (
              <button className="edit-btn-card" onClick={() => openEditModal(game)} title="Modifica gioco">
                ⚙️
              </button>
            )}
          </>
        )}

        {hasDlcs && (
          <button
            className="dlc-expand-btn"
            onClick={() => toggleDlcExpand(game.id)}
            title={isExpanded ? "Nascondi DLC" : "Mostra DLC"}
          >
            {isExpanded ? '▲' : '▼'} {dlcs.length} DLC/Espansioni/Riedizioni
          </button>
        )}

        <div className="image-container">
          <div className="blur-bg" style={{ backgroundImage: `url(${game.copertina})` }}></div>
          <img src={game.copertina} className="main-img" alt={game.titolo} loading="lazy" />
          {isAdmin && (
            <div className="info-mask">
              <button className="delete-btn" onClick={() => eliminaGioco(game.id, game.titolo)}>ELIMINA 🗑</button>
              <p className="info-mask-hint">Usa l'ingranaggio per modificare</p>
            </div>
          )}
        </div>

        <div className="card-content">
          <div className="list-view-info">
            <h4 className="card-title">
              {game.titolo}
              {game.annoUscita && <span className="year">({game.annoUscita})</span>}
            </h4>
            {game.saga && game.saga !== "-" && <p className="saga-info-list">{game.saga}</p>}
            {game.parentId && (
              <p className="dlc-parent-info">Gioco Base: <b>{getDlcParentTitle(game.parentId)}</b></p>
            )}
            <p className="played-info-list">Giocato nel: <b>{game.annoGiocato || '---'}</b></p>
            {game.note && <p className="note-text-list">{game.note}</p>}
            <div className="platforms-tags">
              {dividiStringa(game.piattaforma).slice(0, 3).map((p, i) => <span key={i} className="platform-chip">{p}</span>)}
              {dividiStringa(game.categoria).map((c, i) => <span key={i} className="category-chip">{c}</span>)}
            </div>
          </div>
          <div className="status-badge-wrapper">
            <div className="status-badge" style={{ backgroundColor: getColorStato(game.stato) }}>
              <span className="status-display">{formatStatoDisplay(game.stato)}</span>
            </div>
            <div className="metacritic-score" style={{ backgroundColor: getMetacriticColor(game.voto) }}>
              {game.voto && game.voto !== '-' && game.voto !== '' ? game.voto : '-'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDlcContainer = (game) => {
    const dlcs = getDlcsForGame(game.id);
    const hasDlcs = dlcs.length > 0;
    const isExpanded = expandedDlcs[game.id] || false;

    if (!hasDlcs || !isExpanded) return null;

    return (
      <div className="dlc-container list-view">
        {dlcs.map(dlc => (
          <div key={dlc.id} className="dlc-card">
            <div className="dlc-badge" style={{ background: getDlcTypeColor(dlc.dlcType || 'dlc') }}>{getDlcTypeLabel(dlc.dlcType || 'dlc')}</div>
            <img src={dlc.copertina} className="dlc-img" alt={dlc.titolo} />
            <div className="dlc-content">
              <h5 className="dlc-title">{dlc.titolo}</h5>
              <div className="dlc-meta">
                {dlc.annoUscita && <span className="dlc-year">{dlc.annoUscita}</span>}
                <span className="dlc-status" style={{ color: getColorStato(dlc.stato) }}>{formatStatoDisplay(dlc.stato)}</span>
                {dlc.voto && dlc.voto !== '-' && dlc.voto !== '' && (
                  <span className="dlc-vote" style={{ backgroundColor: getMetacriticColor(dlc.voto) }}>{dlc.voto}</span>
                )}
              </div>
              <div className="dlc-played-platform">
                <span className="dlc-played-info">Giocato nel: <b>{dlc.annoGiocato || '---'}</b></span>
                <div className="dlc-platforms">
                  {dividiStringa(dlc.piattaforma).slice(0, 3).map((p, i) => <span key={i} className="platform-chip">{p}</span>)}
                </div>
              </div>
            </div>
            {isAdmin && (
              <button className="dlc-edit-btn" onClick={() => openEditModal(dlc)}>⚙️</button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const modificaCampo = async (id, campo, valore) => {
    if (!isAdmin && campo !== 'pinned') return;
    if (campo === 'pinned' && !isAdmin) return;

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

  const pinGameFromSpin = async () => {
    if (!chosenGame) return;
    const nuovaLista = games.map(g => g.id === chosenGame.id ? { ...g, pinned: true } : g);
    setGames(nuovaLista);
    if (window.location.hostname === 'localhost') {
      await axios.post('http://localhost:5000/api/games/update', nuovaLista);
    }
    setShowPinNotification(false);
    setChosenGame(null);
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

  const isDlc = (game) => game.isDlc || game.parentId || game.dlcType;

  const getSagaStats = () => {
    const stats = { 'Senza Saga': 0 };
    games.filter(g => !isDlc(g)).forEach(g => {
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

  const getStatisticheTotali = () => {
    const gamesWithoutDlcs = games.filter(g => !isDlc(g));
    const totale = gamesWithoutDlcs.length;
    const completati = gamesWithoutDlcs.filter(g => g.stato === 'Completato').length;
    const inCorso = gamesWithoutDlcs.filter(g => g.stato === 'In corso').length;
    const droppati = gamesWithoutDlcs.filter(g => g.stato === 'Droppato').length;
    const sospesi = gamesWithoutDlcs.filter(g => g.stato === 'Sospeso').length;
    const nonGiocati = gamesWithoutDlcs.filter(g => g.stato === 'Non Giocato').length;
    const pinned = gamesWithoutDlcs.filter(g => g.pinned).length;

    const votoMedio = gamesWithoutDlcs
      .filter(g => g.voto && g.voto !== '-' && g.voto !== '')
      .map(g => parseInt(g.voto))
      .reduce((a, b) => a + b, 0) / gamesWithoutDlcs.filter(g => g.voto && g.voto !== '-' && g.voto !== '').length || 0;

    const giochiConVoto = gamesWithoutDlcs.filter(g => g.voto && g.voto !== '-' && g.voto !== '').length;

    const piattaforme = {};
    gamesWithoutDlcs.forEach(g => {
      dividiStringa(g.piattaforma).forEach(p => {
        piattaforme[p] = (piattaforme[p] || 0) + 1;
      });
    });

    const categorie = {};
    gamesWithoutDlcs.forEach(g => {
      dividiStringa(g.categoria).forEach(c => {
        categorie[c] = (categorie[c] || 0) + 1;
      });
    });

    const giochiPerAnno = {};
    gamesWithoutDlcs.forEach(g => {
      dividiStringa(g.annoGiocato).forEach(a => {
        if (a && a !== '-' && a !== '') {
          giochiPerAnno[a] = (giochiPerAnno[a] || 0) + 1;
        }
      });
    });

    return {
      totale,
      completati,
      inCorso,
      droppati,
      sospesi,
      nonGiocati,
      pinned,
      votoMedio: votoMedio.toFixed(1),
      giochiConVoto,
      piattaforme: Object.entries(piattaforme).sort((a, b) => b[1] - a[1]),
      categorie: Object.entries(categorie).sort((a, b) => b[1] - a[1]),
      giochiPerAnno: Object.entries(giochiPerAnno).sort((a, b) => parseInt(b[0]) - parseInt(a[0])),
      saga: Object.entries(sagaStats).filter(s => s[0] !== 'Senza Saga').sort((a, b) => b[1] - a[1])
    };
  };

  const statistiche = getStatisticheTotali();

  const anniPerFiltro = [...new Set(games.flatMap(g => dividiStringa(g.annoGiocato)))].filter(anno => anno !== '-' && anno !== '').sort((a, b) => parseInt(b) - parseInt(a));
  const anniUscita = [...new Set(games.filter(g => g.annoUscita && String(g.annoUscita).trim() !== '' && String(g.annoUscita).trim() !== '-').map(g => String(g.annoUscita).trim()))].sort((a, b) => parseInt(b) - parseInt(a));
  const suggerimentiSaghe = [...new Set(games.map(g => g.saga))].filter(s => s && s !== "" && s !== "-").sort();
  const suggerimentiCategorie = [...new Set(games.flatMap(g => dividiStringa(g.categoria)))].sort();
  const suggerimentiPiattaforme = [...new Set(games.flatMap(g => dividiStringa(g.piattaforma)))].sort();

  const gameHasDlcWithYear = (gameId, year) => {
    const dlcs = games.filter(g => g.parentId === gameId);
    return dlcs.some(dlc => dividiStringa(dlc.annoGiocato).includes(year));
  };

  const getDlcParentTitle = (parentId) => {
    if (!parentId) return '';
    const parent = games.find(g => g.id === parentId);
    return parent ? parent.titolo : '';
  };

  const filteredGames = games
    .filter(game => {
      if (filterDlc === 'Tutti') return !isDlc(game);
      if (filterDlc === 'Solo DLC') return isDlc(game);
      if (filterDlc === 'Solo Base') return !isDlc(game);
      return !isDlc(game);
    })
    .filter(game => {
      const matchesSearch = game.titolo?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = filterYear === 'Tutti' || dividiStringa(game.annoGiocato).includes(filterYear) || gameHasDlcWithYear(game.id, filterYear);
      const matchesSaga = selectedSaga === 'Tutte' || (selectedSaga === 'Senza Saga' ? !pulisciNomeSaga(game.saga) : pulisciNomeSaga(game.saga) === selectedSaga);
      const matchesStatus = filterStatus === 'Tutti' || game.stato === filterStatus;
      const matchesCategory = filterCategory === 'Tutte' || dividiStringa(game.categoria).includes(filterCategory);
      const matchesPlatform = sortPlatform === 'Default' || dividiStringa(game.piattaforma).includes(sortPlatform);
      const matchesReleaseYear = sortYear === 'Default' || sortYear === 'Crescente' || sortYear === 'Decrescente' || String(game.annoUscita).trim() === sortYear;
      return matchesSearch && matchesYear && matchesSaga && matchesStatus && matchesCategory && matchesPlatform && matchesReleaseYear;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Ordina per Titolo
      if (sortTitle === 'A-Z') return a.titolo.localeCompare(b.titolo);
      if (sortTitle === 'Z-A') return b.titolo.localeCompare(a.titolo);

      // Ordina per Anno Uscita
      if (sortYear === 'Crescente') {
        const annoA = parseInt(a.annoUscita) || 9999;
        const annoB = parseInt(b.annoUscita) || 9999;
        return annoA - annoB;
      }
      if (sortYear === 'Decrescente') {
        const annoA = parseInt(a.annoUscita) || 0;
        const annoB = parseInt(b.annoUscita) || 0;
        return annoB - annoA;
      }

      // Default: ordina per saga (se selezionata) o per titolo
      if (selectedSaga !== 'Tutte' && selectedSaga !== 'Senza Saga') {
        const annoA = parseInt(a.annoUscita) || 9999;
        const annoB = parseInt(b.annoUscita) || 9999;
        return annoA - annoB;
      }
      return a.titolo.localeCompare(b.titolo);
    });

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>

      <datalist id="lista-saghe">
        {suggerimentiSaghe.map((s, i) => <option key={i} value={s} />)}
      </datalist>
      <datalist id="lista-categorie">
        {suggerimentiCategorie.map((c, i) => <option key={i} value={c} />)}
      </datalist>
      <datalist id="lista-piattaforme">
        {suggerimentiPiattaforme.map((p, i) => <option key={i} value={p} />)}
      </datalist>

      <button className="mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
        {isMobileOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && <h2>LA MIA LISTA</h2>}
          <div style={{ display: 'flex', flexDirection: isCollapsed ? 'column' : 'row', gap: '8px' }}>
            <button onClick={() => setIsDarkMode(!isDarkMode)} title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? '➡' : '⬅'}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            <div className="sidebar-stats" onClick={() => setShowStats(true)} style={{ cursor: 'pointer' }}>
              Totale: <b>{games.length}</b> | Da giocare: <b>{games.filter(g => g.stato === 'Non Giocato').length}</b>
              {isAdmin && (
                <div className="admin-status">
                  <span className="admin-badge">● ADMIN ATTIVO</span>
                  <button className="admin-exit-btn" onClick={(e) => { e.stopPropagation(); setIsAdmin(false); }}>ESCI</button>
                </div>
              )}
            </div>

            <button className="btn-spin" onClick={() => { avviaSpinner(); setIsMobileOpen(false); }}>🎲 COSA GIOCO?</button>

            {isAdmin && (
              <div className="form-spacing">
                <button className="btn-add-game" onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? 'CHIUDI' : '+ AGGIUNGI GIOCO'}
                </button>
                {showAddForm && (
                  <div className="modal-overlay">
                    <div className="add-game-modal">
                      <div className="add-game-form">
                        <h2>Nuovo Videogioco</h2>
                        <form onSubmit={aggiungiGioco} className="form-group">
                          <input id="titolo" name="titolo" type="text" placeholder="Titolo" required className="form-input" value={newGame.titolo} onChange={e => setNewGame({ ...newGame, titolo: e.target.value })} />
                          <input id="copertina" name="copertina" type="text" placeholder="Copertina URL" required className="form-input" value={newGame.copertina} onChange={e => setNewGame({ ...newGame, copertina: e.target.value })} />
                          <div className="form-row">
                            <input id="saga" name="saga" type="text" placeholder="Saga" list="lista-saghe" className="form-input" value={newGame.saga} onChange={e => setNewGame({ ...newGame, saga: e.target.value })} />
                            <input id="categoria" name="categoria" type="text" placeholder="Categoria" list="lista-categorie" className="form-input" value={newGame.categoria} onChange={e => setNewGame({ ...newGame, categoria: e.target.value })} />
                            <input id="annoUscita" name="annoUscita" type="text" placeholder="Anno Uscita" className="form-input" value={newGame.annoUscita} onChange={e => setNewGame({ ...newGame, annoUscita: e.target.value })} />
                          </div>
                          <div className="form-row">
                            <input id="piattaforma" name="piattaforma" type="text" placeholder="Piattaforme (es: PC, PS5)" list="lista-piattaforme" className="form-input" value={newGame.piattaforma} onChange={e => setNewGame({ ...newGame, piattaforma: e.target.value })} />
                            <input id="annoGiocato" name="annoGiocato" type="text" placeholder="Anno Giocato" className="form-input" value={newGame.annoGiocato} onChange={e => setNewGame({ ...newGame, annoGiocato: e.target.value })} />
                          </div>
                          <select id="stato" name="stato" className="form-select" value={newGame.stato} onChange={e => setNewGame({ ...newGame, stato: e.target.value })}>
                            {['Non Giocato', 'In corso', 'Completato', 'Sospeso', 'Droppato'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <div className="form-row">
                            <input id="voto" name="voto" type="number" min="1" max="100" placeholder="Voto (1-100)" className="form-input" value={newGame.voto} onChange={e => setNewGame({ ...newGame, voto: e.target.value })} />
                          </div>
                          <div className="form-row dlc-option-row">
                            <label className="dlc-select-label">
                              Tipo di Contenuto
                            </label>
                            <select
                              className="form-select"
                              value={newGame.dlcType || ''}
                              onChange={e => setNewGame({ 
                                ...newGame, 
                                dlcType: e.target.value,
                                parentId: e.target.value ? (newGame.parentId || (games.length > 0 ? games[0].id : null)) : null
                              })}
                            >
                              <option value="">Gioco Principale</option>
                              <option value="dlc">DLC</option>
                              <option value="espansione">Espansione</option>
                              <option value="riedizione">Riedizione</option>
                            </select>
                            {newGame.dlcType && (
                              <select
                                className="form-select"
                                value={newGame.parentId || ''}
                                onChange={e => setNewGame({ ...newGame, parentId: parseInt(e.target.value) || null })}
                              >
                                <option value="">Seleziona gioco principale</option>
                                {games.filter(g => !g.dlcType).map(g => (
                                  <option key={g.id} value={g.id}>{g.titolo} ({g.piattaforma || 'N/A'})</option>
                                ))}
                              </select>
                            )}
                          </div>
                          <textarea id="note" name="note" placeholder="Note personali..." className="form-textarea" value={newGame.note} onChange={e => setNewGame({ ...newGame, note: e.target.value })} />
                          <div className="form-buttons">
                            <button type="button" className="form-btn cancel" onClick={() => setShowAddForm(false)}>ANNULLA</button>
                            <button type="submit" className="form-btn submit">SALVA GIOCO</button>
                          </div>
                        </form>
                      </div>
                      <div className="preview-section">
                        <p className="preview-label">Anteprima Card</p>
                        <div className="game-card">
                          <div className="image-container">
                            <div className="blur-bg" style={{ backgroundImage: `url(${newGame.copertina})` }}></div>
                            <img src={newGame.copertina || 'https://via.placeholder.com/300x400?text=Copertina'} className="main-img" alt="Preview" />
                          </div>
                          <div className="card-content">
                            <div className="status-badge" style={{ backgroundColor: getColorStato(newGame.stato) }}><span className="status-display">{formatStatoDisplay(newGame.stato)}</span></div>
                            <h4 className="card-title">{newGame.titolo || 'Titolo del Gioco'}</h4>
                            <div className="metacritic-score" style={{ backgroundColor: getMetacriticColor(newGame.voto) }}>
                              {newGame.voto && newGame.voto !== '' ? newGame.voto : '-'}
                            </div>
                            <div className="platforms-tags">
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

            <div className="saga-section">
              <p className="saga-label">Saghe</p>
              <div className={`saga-item ${selectedSaga === 'Tutte' ? 'active' : ''}`}
                onClick={() => { setSelectedSaga('Tutte'); setIsMobileOpen(false); }}>Tutte le Saghe</div>
              <div className={`saga-item ${selectedSaga === 'Senza Saga' ? 'active' : ''}`}
                onClick={() => { setSelectedSaga('Senza Saga'); setIsMobileOpen(false); }}>
                Senza Saga <span className="saga-count">({sagaStats['Senza Saga']} {sagaStats['Senza Saga'] === 1 ? 'titolo' : 'titoli'})</span>
              </div>
              {Object.keys(sagaStats).filter(s => s !== 'Senza Saga').sort().map(s => (
                <div key={s} className={`saga-item ${selectedSaga === s ? 'active' : ''}`}
                  onClick={() => { setSelectedSaga(s); setIsMobileOpen(false); }}>
                  {s} <span className="saga-count">({sagaStats[s]} {sagaStats[s] === 1 ? 'titolo' : 'titoli'})</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {showStats ? (
          <div className="statistics-page">
            <div className="statistics-header">
              <h2>📊 STATISTICHE TOTALI</h2>
              <button className="back-btn" onClick={() => setShowStats(false)}>← TORNA AI GIOCHI</button>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <h3>📚 TOTALE GIOCHI</h3>
                <p className="stat-number">{statistiche.totale}</p>
              </div>
              <div className="stat-card">
                <h3>📌 FISSATI</h3>
                <p className="stat-number">{statistiche.pinned}</p>
              </div>
              <div className="stat-card">
                <h3>⭐ VOTO MEDIO</h3>
                <p className="stat-number">{statistiche.giochiConVoto > 0 ? statistiche.votoMedio : 'N/A'}</p>
                {statistiche.giochiConVoto > 0 && <span className="stat-subtitle">su {statistiche.giochiConVoto} giochi</span>}
              </div>
            </div>

            <div className="stats-section">
              <h3>📈 STATO DEI GIOCHI</h3>
              <div className="stats-bars">
                <div className="stat-bar-item">
                  <span>Completati</span>
                  <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${(statistiche.completati / statistiche.totale) * 100}%`, backgroundColor: '#27ae60' }}></div></div>
                  <span className="stat-bar-value">{statistiche.completati}</span>
                </div>
                <div className="stat-bar-item">
                  <span>In Corso</span>
                  <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${(statistiche.inCorso / statistiche.totale) * 100}%`, backgroundColor: '#f1c40f' }}></div></div>
                  <span className="stat-bar-value">{statistiche.inCorso}</span>
                </div>
                <div className="stat-bar-item">
                  <span>Sospesi</span>
                  <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${(statistiche.sospesi / statistiche.totale) * 100}%`, backgroundColor: '#e67e22' }}></div></div>
                  <span className="stat-bar-value">{statistiche.sospesi}</span>
                </div>
                <div className="stat-bar-item">
                  <span>Droppati</span>
                  <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${(statistiche.droppati / statistiche.totale) * 100}%`, backgroundColor: '#e74c3c' }}></div></div>
                  <span className="stat-bar-value">{statistiche.droppati}</span>
                </div>
                <div className="stat-bar-item">
                  <span>Non Giocati</span>
                  <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${(statistiche.nonGiocati / statistiche.totale) * 100}%`, backgroundColor: '#7f8c8d' }}></div></div>
                  <span className="stat-bar-value">{statistiche.nonGiocati}</span>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h3>🎮 PIATTAFORME PRINCIPALI</h3>
              <div className="stats-list">
                {statistiche.piattaforme.slice(0, 10).map(([nome, count]) => (
                  <div key={nome} className="stats-list-item">
                    <span>{nome}</span>
                    <span className="stats-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-section">
              <h3>🏷️ CATEGORIE</h3>
              <div className="stats-list">
                {statistiche.categorie.slice(0, 10).map(([nome, count]) => (
                  <div key={nome} className="stats-list-item">
                    <span>{nome}</span>
                    <span className="stats-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-section">
              <h3>📅 GIOCHI PER ANNO</h3>
              <div className="stats-list">
                {statistiche.giochiPerAnno.slice(0, 10).map(([anno, count]) => (
                  <div key={anno} className="stats-list-item">
                    <span>{anno}</span>
                    <span className="stats-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-section">
              <h3>📖 SAGHE PRINCIPALI</h3>
              <div className="stats-list">
                {statistiche.saga.slice(0, 10).map(([nome, count]) => (
                  <div key={nome} className="stats-list-item">
                    <span>{nome}</span>
                    <span className="stats-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="filter-bar">
          <input id="search" name="search" type="text" placeholder="🔍 Cerca tra i tuoi giochi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
          <select id="filterStatus" name="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select" style={{ color: filterStatus === 'Tutti' ? 'var(--text-primary)' : getColorStato(filterStatus) }}>
            <option value="Tutti">Stato di Gioco</option>
            {['Non Giocato', 'In corso', 'Completato', 'Sospeso', 'Droppato'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select id="filterYear" name="filterYear" value={filterYear} onChange={e => setFilterYear(e.target.value)} className="filter-select">
            <option value="Tutti">Anno di Gioco</option>
            {anniPerFiltro.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select id="filterCategory" name="filterCategory" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="filter-select">
            <option value="Tutte">Categoria</option>
            {suggerimentiCategorie.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select id="filterDlc" name="filterDlc" value={filterDlc} onChange={e => setFilterDlc(e.target.value)} className="filter-select">
            <option value="Tutti">Tipo</option>
            <option value="Solo Base">Solo Giochi Base</option>
            <option value="Solo DLC">Solo DLC/Espansioni</option>
          </select>
          <select id="sortTitle" name="sortTitle" value={sortTitle} onChange={e => setSortTitle(e.target.value)} className="filter-select">
            <option value="Default">Ordine Titolo</option>
            <option value="A-Z">A-Z</option>
            <option value="Z-A">Z-A</option>
          </select>
          <select id="sortYear" name="sortYear" value={sortYear} onChange={e => setSortYear(e.target.value)} className="filter-select">
            <option value="Default">Anno Uscita</option>
            <option value="Crescente">Crescente</option>
            <option value="Decrescente">Decrescente</option>
            <optgroup label="Anno Specifico">
              {anniUscita.map(anno => <option key={anno} value={anno}>{anno}</option>)}
            </optgroup>
          </select>
          <select id="sortPlatform" name="sortPlatform" value={sortPlatform} onChange={e => setSortPlatform(e.target.value)} className="filter-select">
            <option value="Default">Piattaforme</option>
            {suggerimentiPiattaforme.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista Griglia"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista Lista"
            >
              ☰
            </button>
          </div>
        </div>
        )}
        {filteredGames.filter(g => g.pinned).length > 0 && (
          <div>
            <h3 className="section-title-pinned">📌 FISSATI</h3>
            <div className={`games-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
              {filteredGames.filter(g => g.pinned).map(game => (
                <div key={game.id} className="game-card-wrapper">
                  {viewMode === 'list' ? renderGameCardList(game) : renderGameCardGrid(game)}
                  {viewMode === 'list' && filterDlc !== 'Solo DLC' && renderDlcContainer(game)}
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredGames.filter(g => !g.pinned).length > 0 && (
          <div>
            <h3 className="section-title-games">GIOCHI ({filteredGames.filter(g => !g.pinned).length})</h3>
            <div className={`games-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
              {filteredGames.filter(g => !g.pinned).map(game => (
                <div key={game.id} className="game-card-wrapper">
                  {viewMode === 'list' ? renderGameCardList(game) : renderGameCardGrid(game)}
                  {viewMode === 'list' && filterDlc !== 'Solo DLC' && renderDlcContainer(game)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modale di Modifica Gioco */}
      {editingGame && editedGameData && (
        <div className="modal-overlay">
          <div className="modal-content edit-game-modal">
            <h2>Modifica Gioco</h2>
            <div className="edit-modal-body">
              <div className="edit-form-group">
                <label>Titolo</label>
                <input type="text" className="form-input" value={editedGameData.titolo} onChange={e => setEditedGameData({ ...editedGameData, titolo: e.target.value })} />
              </div>
              <div className="edit-form-group">
                <label>Copertina URL</label>
                <input type="text" className="form-input" value={editedGameData.copertina} onChange={e => setEditedGameData({ ...editedGameData, copertina: e.target.value })} />
              </div>
              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>Saga</label>
                  <input type="text" className="form-input" list="lista-saghe" value={editedGameData.saga} onChange={e => setEditedGameData({ ...editedGameData, saga: e.target.value })} />
                </div>
                <div className="edit-form-group">
                  <label>Categoria</label>
                  <input type="text" className="form-input" list="lista-categorie" value={editedGameData.categoria} onChange={e => setEditedGameData({ ...editedGameData, categoria: e.target.value })} />
                </div>
              </div>
              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>Anno Uscita</label>
                  <input type="text" className="form-input" value={editedGameData.annoUscita} onChange={e => setEditedGameData({ ...editedGameData, annoUscita: e.target.value })} />
                </div>
                <div className="edit-form-group">
                  <label>Anno Giocato</label>
                  <input type="text" className="form-input" value={editedGameData.annoGiocato} onChange={e => setEditedGameData({ ...editedGameData, annoGiocato: e.target.value })} />
                </div>
              </div>
              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>Piattaforme</label>
                  <input type="text" className="form-input" list="lista-piattaforme" value={editedGameData.piattaforma} onChange={e => setEditedGameData({ ...editedGameData, piattaforma: e.target.value })} />
                </div>
                <div className="edit-form-group">
                  <label>Stato</label>
                  <select className="form-select" value={editedGameData.stato} onChange={e => setEditedGameData({ ...editedGameData, stato: e.target.value })}>
                    {['Non Giocato', 'In corso', 'Completato', 'Sospeso', 'Droppato'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>Voto (1-100)</label>
                  <input type="number" min="1" max="100" placeholder="-" className="form-input" value={editedGameData.voto || ''} onChange={e => setEditedGameData({ ...editedGameData, voto: e.target.value })} />
                </div>
              </div>
              <div className="edit-form-row dlc-option-row">
                <label className="dlc-select-label">
                  Tipo di Contenuto
                </label>
                <select
                  className="form-select"
                  value={editedGameData.dlcType || ''}
                  onChange={e => setEditedGameData({
                    ...editedGameData,
                    dlcType: e.target.value,
                    parentId: e.target.value ? (editedGameData.parentId || (games.length > 0 ? games[0].id : null)) : null
                  })}
                >
                  <option value="">Gioco Principale</option>
                  <option value="dlc">DLC</option>
                  <option value="espansione">Espansione</option>
                  <option value="riedizione">Riedizione</option>
                </select>
                {editedGameData.dlcType && (
                  <select
                    className="form-select"
                    value={editedGameData.parentId || ''}
                    onChange={e => setEditedGameData({ ...editedGameData, parentId: parseInt(e.target.value) || null })}
                  >
                    <option value="">Seleziona gioco principale</option>
                    {games.filter(g => !g.dlcType && g.id !== editedGameData.id).map(g => (
                      <option key={g.id} value={g.id}>{g.titolo} ({g.piattaforma || 'N/A'})</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="edit-form-group">
                <label>Note</label>
                <textarea className="form-textarea" value={editedGameData.note} onChange={e => setEditedGameData({ ...editedGameData, note: e.target.value })} />
              </div>
            </div>
            <div className="edit-modal-actions">
              <button className="form-btn cancel" onClick={closeEditModal}>ANNULLA</button>
              <button className="form-btn submit" onClick={saveGameChanges}>SALVA MODIFICHE</button>
            </div>
          </div>
        </div>
      )}

      {/* Conferma Salvataggio */}
      {isSaving && (
        <div className="modal-overlay">
          <div className="modal-content modal-saving">
            <div className="saving-spinner"></div>
            <h3>Salvataggio in corso...</h3>
          </div>
        </div>
      )}

      {(isSpinning || chosenGame) && (
        <div className="modal-overlay">
          <div className="modal-content">
            {isSpinning ? (
              <div className="spinner-content">
                <div className="spinner-icon">🎯</div>
                <h2 className="spinner-choosing">SCEGLIENDO...</h2>
                <div className="spinner-title">{spinTitle}</div>
              </div>
            ) : (
              <div>
                <h2>PROSSIMA AVVENTURA:</h2>
                <img src={chosenGame.copertina} className="spinner-image" alt="" />
                <h1>{chosenGame.titolo}</h1>
                <div className="flex-center">
                  <button className="confirm-btn" onClick={() => {
                    setShowPinNotification(true);
                  }}>OTTIMO!</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPinNotification && chosenGame && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-center">
            <h2>Vuoi pinnare "{chosenGame.titolo}"?</h2>
            <div className="flex-center-top">
              <button className="confirm-btn confirm-btn-yes" onClick={pinGameFromSpin}>SÌ, PINNA 📌</button>
              <button className="confirm-btn confirm-btn-no" onClick={() => {
                setShowPinNotification(false);
                setChosenGame(null);
              }}>NO, GRAZIE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;