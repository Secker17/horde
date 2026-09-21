import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, where, writeBatch } from 'firebase/firestore'
import { ChevronRight, Compass, Info, LockKeyhole, LogOut, Map, Menu, Mountain, Search, ShieldCheck, UsersRound, X } from 'lucide-react'
import NorwayMap from './NorwayMap'
import Comments from './Comments'
import ConfirmedInfo from './ConfirmedInfo'
import LoginModal from './LoginModal'
import { adminUid, auth, db, firebaseReady } from './firebase'

const STATUS = [
  { id: 'likely', label: 'Sannsynlig', note: 'Sterke spor', color: '#d99b43' },
  { id: 'unsure', label: 'Usikkert', note: 'Må undersøkes', color: '#769f89' },
  { id: 'unlikely', label: 'Lite sannsynlig', note: 'Svake spor', color: '#536059' },
]

const sampleComments = [
  { id: 'welcome', name: 'Horde-teamet', authorUid: 'horde-teamet', area: 'Hele Norge', message: 'Velkommen! Kommentarfeltet oppdateres direkte når nye meldinger blir publisert.', timeLabel: 'Festet kommentar' },
]

export default function App() {
  const [mapData, setMapData] = useState({ municipality: null, county: null })
  const [mode, setMode] = useState('municipality')
  const [selected, setSelected] = useState(null)
  const [statuses, setStatuses] = useState({})
  const [comments, setComments] = useState(sampleComments)
  const [verifiedUsers, setVerifiedUsers] = useState({ 'horde-teamet': true })
  const [onlineCount, setOnlineCount] = useState(null)
  const [confirmedFacts, setConfirmedFacts] = useState([])
  const [user, setUser] = useState(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [search, setSearch] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [mapError, setMapError] = useState('')
  const [adminIds, setAdminIds] = useState(new Set([adminUid].filter(Boolean)))

  const isAdmin = Boolean(user && [...adminIds].includes(user.uid))

  const loadFirestoreData = async () => {
    const [statusSnapshot, commentSnapshot, verifiedSnapshot, confirmedSnapshot] = await Promise.all([
      getDocs(collection(db, 'mapStatuses')),
      getDocs(query(collection(db, 'comments'), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'verifiedUsers')),
      getDocs(query(collection(db, 'confirmedFacts'), orderBy('createdAt', 'asc'))),
    ])

    const nextStatuses = {}
    statusSnapshot.forEach((item) => { nextStatuses[item.id] = item.data() })
    setStatuses(nextStatuses)

    const nextComments = commentSnapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
      timeLabel: item.data().createdAt?.toDate?.().toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }) || 'Nå',
    }))
    setComments([...nextComments, ...sampleComments])

    const nextVerified = { 'horde-teamet': true }
    verifiedSnapshot.forEach((item) => { nextVerified[item.id] = true })
    setVerifiedUsers(nextVerified)

    const formatDate = (timestamp) => timestamp?.toDate?.().toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) || ''
    setConfirmedFacts(confirmedSnapshot.docs.map((item) => {
      const data = item.data()
      return { id: item.id, ...data, createdLabel: formatDate(data.createdAt), updatedLabel: formatDate(data.updatedAt) }
    }))
  }

  useEffect(() => {
    Promise.all([
      fetch('/data/kommuner.geojson').then((res) => res.json()),
      fetch('/data/fylker.geojson').then((res) => res.json()),
    ]).then(([municipality, county]) => setMapData({ municipality, county }))
  }, [])

  useEffect(() => {
    if (!firebaseReady || !user) return
    const presenceRef = doc(db, 'presence', user.uid)
    const pulse = () => setDoc(presenceRef, {
      lastSeen: serverTimestamp(),
      role: isAdmin ? 'admin' : 'guest',
    }, { merge: true }).catch((error) => {
      console.error('[presence] Firestore avviste heartbeat:', error.code)
      setOnlineCount(null)
    })
    const recount = () => getDocs(query(
      collection(db, 'presence'),
      where('lastSeen', '>=', Timestamp.fromMillis(Date.now() - 45 * 60 * 1000)),
    )).then((snapshot) => {
      setOnlineCount(snapshot.size)
    }).catch((error) => {
      console.error('[presence] Firestore avviste telling:', error.code)
      setOnlineCount(null)
    })
    const refreshPresence = async () => {
      await pulse()
      await recount()
    }
    const leave = () => deleteDoc(presenceRef).catch(() => {})

    refreshPresence()
    const presenceInterval = window.setInterval(refreshPresence, 30 * 60 * 1000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshPresence()
      else leave()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', leave)

    return () => {
      window.clearInterval(presenceInterval)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', leave)
      leave()
    }
  }, [user, isAdmin])

  useEffect(() => {
    if (!firebaseReady || !db || !auth) {
      const syncLocalComments = () => {
        const stored = JSON.parse(localStorage.getItem('horde-comments') || '[]')
        setComments([...stored, ...sampleComments])
      }
      syncLocalComments()
      window.addEventListener('storage', syncLocalComments)
      return () => window.removeEventListener('storage', syncLocalComments)
    }
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (!currentUser) signInAnonymously(auth).catch((error) => {
        console.error('[presence] Anonymous Authentication er ikke tilgjengelig:', error.code)
        setOnlineCount(null)
      })
    })
    const unsubStatuses = onSnapshot(collection(db, 'mapStatuses'), (snapshot) => {
      const next = {}; snapshot.forEach((item) => { next[item.id] = item.data() }); setStatuses(next)
    })
    const unsubComments = onSnapshot(query(collection(db, 'comments'), orderBy('createdAt', 'desc')), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), timeLabel: item.data().createdAt?.toDate?.().toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }) || 'Nå' }))
      setComments([...next, ...sampleComments])
    })
    const unsubVerified = onSnapshot(collection(db, 'verifiedUsers'), (snapshot) => {
      const next = { 'horde-teamet': true }
      snapshot.forEach((item) => { next[item.id] = true })
      setVerifiedUsers(next)
    })
    const unsubConfirmed = onSnapshot(query(collection(db, 'confirmedFacts'), orderBy('createdAt', 'asc')), (snapshot) => {
      setConfirmedFacts(snapshot.docs.map((item) => {
        const data = item.data()
        const formatDate = (timestamp) => timestamp?.toDate?.().toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) || ''
        return { id: item.id, ...data, createdLabel: formatDate(data.createdAt), updatedLabel: formatDate(data.updatedAt) }
      }))
    })
    return () => { unsubAuth(); unsubStatuses(); unsubComments(); unsubVerified(); unsubConfirmed() }
  }, [])

  const allPlaces = useMemo(() => {
    const data = mapData[mode]
    if (!data) return []
    return data.features.map((feature) => ({
      id: String(feature.properties.kommunenummer || feature.properties.fylkesnummer || feature.properties.id),
      name: feature.properties.kommunenavn || feature.properties.fylkesnavn || feature.properties.name,
      type: mode,
    }))
  }, [mapData, mode])

  const searchResults = search.trim() ? allPlaces.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6) : []
  const counts = STATUS.reduce((acc, item) => ({
    ...acc,
    [item.id]: Object.entries(statuses).filter(([key, value]) => key.startsWith(`${mode}:`) && value.status === item.id).length,
  }), {})

  const updateStatus = async (status) => {
    if (!selected || !isAdmin) return
    setMapError('')
    try {
      const batch = writeBatch(db)
      const targets = [{ key: selected.key, name: selected.name, type: selected.type }]

      if (selected.type === 'county' && mapData.municipality) {
        const countyCode = selected.id.padStart(2, '0')
        mapData.municipality.features.forEach((feature) => {
          const municipalityId = String(feature.properties.kommunenummer || feature.properties.id).padStart(4, '0')
          if (municipalityId.startsWith(countyCode)) {
            targets.push({
              key: `municipality:${municipalityId}`,
              name: feature.properties.kommunenavn || feature.properties.name,
              type: 'municipality',
            })
          }
        })
      }

      targets.forEach((target) => {
        const statusRef = doc(db, 'mapStatuses', target.key)
        if (status === 'none') {
          batch.delete(statusRef)
        } else {
          batch.set(statusRef, { status, name: target.name, type: target.type, updatedAt: serverTimestamp(), updatedBy: user.uid })
        }
      })

      await batch.commit()
      setSelected((current) => ({ ...current, status }))
    } catch {
      setMapError('Firebase avviste endringen. Kontroller at de nye Firestore-reglene er publisert.')
    }
  }

  const addComment = async (comment) => {
    if (firebaseReady) {
      if (!auth.currentUser) await signInAnonymously(auth)
      await addDoc(collection(db, 'comments'), { ...comment, authorUid: auth.currentUser.uid, createdAt: serverTimestamp() })
      return
    }
    const next = { ...comment, authorUid: crypto.randomUUID(), id: crypto.randomUUID(), timeLabel: 'Nå' }
    const stored = JSON.parse(localStorage.getItem('horde-comments') || '[]')
    localStorage.setItem('horde-comments', JSON.stringify([next, ...stored].slice(0, 50)))
    setComments((current) => [next, ...current])
  }

  const deleteComment = async (commentId) => {
    if (!isAdmin || !window.confirm('Vil du slette denne kommentaren?')) return
    await deleteDoc(doc(db, 'comments', commentId))
  }

  const toggleVerified = async (comment) => {
    if (!isAdmin || !comment.authorUid) return
    if (verifiedUsers[comment.authorUid]) {
      await deleteDoc(doc(db, 'verifiedUsers', comment.authorUid))
    } else {
      await setDoc(doc(db, 'verifiedUsers', comment.authorUid), { username: comment.name, verifiedAt: serverTimestamp(), verifiedBy: user.uid })
    }
  }

  const addConfirmedFact = async (content) => {
    if (!isAdmin) throw new Error('Unauthorized')
    await addDoc(collection(db, 'confirmedFacts'), {
      content,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    })
  }

  const updateConfirmedFact = async (id, content) => {
    if (!isAdmin) throw new Error('Unauthorized')
    await setDoc(doc(db, 'confirmedFacts', id), { content, updatedAt: serverTimestamp(), updatedBy: user.uid }, { merge: true })
  }

  const deleteConfirmedFact = async (id) => {
    if (!isAdmin || !window.confirm('Vil du slette dette bekreftede punktet?')) return
    await deleteDoc(doc(db, 'confirmedFacts', id))
  }

  const login = async (email, password) => {
    setLoginError('')
    try {
      if (auth.currentUser) await deleteDoc(doc(db, 'presence', auth.currentUser.uid)).catch(() => {})
      const result = await signInWithEmailAndPassword(auth, email, password)
      const allowedAdmins = [...adminIds]
      if (!allowedAdmins.includes(result.user.uid)) {
        await signOut(auth)
        setLoginError('Denne kontoen har ikke admintilgang. Opprett en admin-post i Firestore eller sett VITE_ADMIN_UID.')
        return
      }
      setLoginOpen(false)
    } catch (error) {
      if (error?.code === 'auth/unauthorized-domain') {
        setLoginError('Dette Vercel-domenet må legges til under Firebase Authentication → Authorized domains.')
      } else {
        setLoginError('Feil e-post eller passord. Prøv igjen.')
      }
    }
  }

  const logout = async () => {
    if (auth.currentUser) await deleteDoc(doc(db, 'presence', auth.currentUser.uid)).catch(() => {})
    await signOut(auth)
  }

  const selectPlace = (item) => {
    const key = `${item.type}:${item.id}`
    setSelected({ ...item, key, status: statuses[key]?.status || 'none' })
    setMapError('')
    setSearch('')
  }

  useEffect(() => {
    if (!firebaseReady || !db) return
    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const next = new Set([adminUid].filter(Boolean))
      snapshot.forEach((item) => next.add(item.id))
      setAdminIds(next)
    })
    return () => unsubAdmins()
  }, [])

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Hordejakten hjem"><div className="brand-mark"><Mountain size={22} /></div><div><strong>HORDE</strong><span>JAKTEN</span></div></a>
        <nav className={mobileNav ? 'open' : ''}>
          <a href="#kart" onClick={() => setMobileNav(false)}>Kartet</a><a href="#bekreftet" onClick={() => setMobileNav(false)}>Bekreftet</a><a href="#fellesskap" onClick={() => setMobileNav(false)}>Kommentarfelt</a>
        </nav>
        <div className="header-actions">
          <div className={`online-pill ${onlineCount === null ? 'connecting' : ''}`} title={onlineCount === null ? 'Kobler til live-telling…' : 'Aktive brukere på siden akkurat nå'}><i /><UsersRound size={14} /><strong>{onlineCount ?? '…'}</strong><span>på nett</span></div>
          {isAdmin ? <button className="admin-button active" onClick={logout}><ShieldCheck size={15} /> Admin <LogOut size={14} /></button> : <button className="admin-button" onClick={() => setLoginOpen(true)}><LockKeyhole size={14} /> Admin</button>}
          <button className="menu-button" onClick={() => setMobileNav((v) => !v)} aria-label="Meny">{mobileNav ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-image" />
          <div className="hero-grain" />
          <div className="hero-content">
            <div className="eyebrow"><span /> ET FELLES SPORARBEID</div>
            <h1>Hvor gjemmer<br /><em>Horde</em> seg?</h1>
            <p>Utforsk Norge, vurder sporene og finn området som skjuler svaret. Hver teori bringer oss nærmere.</p>
            <div className="hero-actions"><a className="primary-button" href="#kart">Utforsk kartet <ChevronRight size={17} /></a><a className="text-link" href="#fellesskap">Gå til kommentarfeltet <ChevronRight size={15} /></a></div>
          </div>
          <div className="hero-stat"><Compass size={19} /><div><strong>372</strong><span>områder å utforske</span></div></div>
        </section>

        <section className="map-section" id="kart">
          <div className="section-head">
            <div><div className="section-kicker"><Map size={16} /> LEVENDE SPORKART</div><h2>Hele Norge.<br /><em>Én løsning.</em></h2></div>
            <p>Velg et område for å se vurderingen. Kartet oppdateres av administrator etter hvert som nye spor dukker opp.</p>
          </div>

          <div className="map-app">
            <div className="map-toolbar">
              <div className="mode-tabs"><button className={mode === 'municipality' ? 'active' : ''} onClick={() => { setMode('municipality'); setSelected(null) }}>Kommuner</button><button className={mode === 'county' ? 'active' : ''} onClick={() => { setMode('county'); setSelected(null) }}>Fylker</button></div>
              <div className="search-wrap"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Søk etter ${mode === 'municipality' ? 'kommune' : 'fylke'}…`} />{searchResults.length > 0 && <div className="search-results">{searchResults.map((item) => <button key={item.id} onClick={() => selectPlace(item)}>{item.name}<ChevronRight size={15} /></button>)}</div>}</div>
            </div>
            <div className="map-layout">
              <NorwayMap data={mapData[mode]} statuses={statuses} selected={selected} onSelect={setSelected} mode={mode} />
              <aside className="map-panel">
                {selected ? (
                  <div className="selected-area">
                    <span className="eyebrow">VALGT {selected.type === 'county' ? 'FYLKE' : 'KOMMUNE'}</span><h3>{selected.name}</h3><div className={`current-status ${selected.status}`}><span />{selected.status === 'likely' ? 'Sannsynlig' : selected.status === 'unsure' ? 'Usikkert' : selected.status === 'unlikely' ? 'Lite sannsynlig' : 'Ikke vurdert'}</div>
                    {isAdmin ? <div className="admin-editor"><small>ENDRE VURDERING</small>{STATUS.map((item) => <button key={item.id} onClick={() => updateStatus(item.id)} className={selected.status === item.id ? 'active' : ''}><span style={{ background: item.color }} /> <div><strong>{item.label}</strong><small>{item.note}</small></div>{selected.status === item.id && <ShieldCheck size={16} />}</button>)}<button onClick={() => updateStatus('none')} className={selected.status === 'none' ? 'active' : ''}><span className="status-none-dot" /><div><strong>Ikke vurdert</strong><small>Fjern vurderingen</small></div>{selected.status === 'none' && <ShieldCheck size={16} />}</button>{selected.type === 'county' && <p className="county-sync-note">Endringen gjelder også alle kommunene i fylket.</p>}{mapError && <p className="map-error">{mapError}</p>}</div> : <p className="selection-help">Bare administrator kan endre kartet. Har du et spor? Del det i kommentarfeltet under.</p>}
                    <a href="#fellesskap" className="panel-link">Kommenter dette området <ChevronRight size={15} /></a>
                  </div>
                ) : (
                  <div className="empty-selection"><div className="radar"><Compass size={34} /></div><h3>Velg et område</h3><p>Trykk på en kommune eller et fylke i kartet for å se vurderingen.</p></div>
                )}
                <div className="legend"><span className="legend-title">Kartoversikt</span>{STATUS.map((item) => <div key={item.id}><i style={{ background: item.color }} /><span>{item.label}</span><b>{counts[item.id] || 0}</b></div>)}<div><i className="none" /><span>Ikke vurdert</span><b>{allPlaces.length - Object.keys(statuses).filter((key) => key.startsWith(mode + ':')).length}</b></div></div>
              </aside>
            </div>
          </div>
        </section>

        <ConfirmedInfo facts={confirmedFacts} isAdmin={isAdmin} onAdd={addConfirmedFact} onUpdate={updateConfirmedFact} onDelete={deleteConfirmedFact} />
        <Comments comments={comments} selected={selected} onSubmit={addComment} isAdmin={isAdmin} verifiedUsers={verifiedUsers} onDelete={deleteComment} onToggleVerified={toggleVerified} />
      </main>
      <aside className="independent-notice" aria-label="Ansvarsfraskrivelse"><Info size={17} /><p><strong>Uavhengig fanprosjekt.</strong> Vi er ikke tilknyttet, godkjent av eller drevet av det offisielle selskapet bak Horde.</p></aside>
      <footer><a className="brand" href="#top"><div className="brand-mark"><Mountain size={20} /></div><div><strong>HORDE</strong><span>JAKTEN</span></div></a><p>Laget for jegere, av jegere.</p><span>© {new Date().getFullYear()} Hordejakten</span></footer>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={login} error={loginError} configured={firebaseReady} />
    </div>
  )
}
