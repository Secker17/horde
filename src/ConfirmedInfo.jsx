import { useState } from 'react'
import { BadgeCheck, Pencil, Plus, Save, Sparkles, Trash2, X } from 'lucide-react'

export default function ConfirmedInfo({ facts, isAdmin, onAdd, onUpdate, onDelete }) {
  const [adding, setAdding] = useState(false)
  const [newFact, setNewFact] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const addFact = async () => {
    if (!newFact.trim()) return
    setBusy(true); setError('')
    try {
      await onAdd(newFact.trim())
      setNewFact(''); setAdding(false)
    } catch {
      setError('Kunne ikke lagre punktet. Kontroller Firestore-reglene.')
    } finally { setBusy(false) }
  }

  const updateFact = async (id) => {
    if (!editDraft.trim()) return
    setBusy(true); setError('')
    try {
      await onUpdate(id, editDraft.trim())
      setEditingId(null); setEditDraft('')
    } catch {
      setError('Kunne ikke oppdatere punktet. Prøv igjen.')
    } finally { setBusy(false) }
  }

  return (
    <section className="confirmed-section" id="bekreftet">
      <div className="confirmed-inner">
        <div className="confirmed-heading">
          <div>
            <div className="section-kicker"><BadgeCheck size={17} /> BEKREFTET ARKIV</div>
            <h2>Dette vet vi.<br /><em>Ingen tvil.</em></h2>
            <p className="confirmed-intro">Fakta som er sjekket, bekreftet og låst inn i jakten. Hvert punkt bringer oss ett steg nærmere.</p>
          </div>
          {isAdmin && !adding && <button className="add-fact-button" onClick={() => setAdding(true)}><Plus size={17} /> Legg til bekreftet punkt</button>}
        </div>

        {isAdmin && adding && (
          <div className="new-fact-panel">
            <div className="new-fact-icon"><Sparkles size={22} /></div>
            <div className="fact-editor-body">
              <label htmlFor="new-fact">Nytt bekreftet punkt</label>
              <textarea id="new-fact" maxLength="1000" value={newFact} onChange={(event) => setNewFact(event.target.value)} placeholder="Skriv ett konkret, bekreftet faktum…" autoFocus />
              <div className="fact-editor-footer"><span>{newFact.length} / 1000</span><div><button className="cancel-button" onClick={() => { setAdding(false); setNewFact(''); setError('') }}><X size={15} /> Avbryt</button><button className="primary-button" onClick={addFact} disabled={busy || !newFact.trim()}><Save size={15} /> {busy ? 'Lagrer…' : 'Publiser punkt'}</button></div></div>
            </div>
          </div>
        )}

        {error && <p className="confirmed-error">{error}</p>}

        {facts.length > 0 ? (
          <div className="facts-grid">
            {facts.map((fact, index) => (
              <article className="fact-card" key={fact.id}>
                <div className="fact-card-top"><span className="fact-number">{String(index + 1).padStart(2, '0')}</span><span className="fact-verified"><BadgeCheck size={15} /> BEKREFTET</span></div>
                {editingId === fact.id ? (
                  <div className="inline-fact-editor">
                    <textarea maxLength="1000" value={editDraft} onChange={(event) => setEditDraft(event.target.value)} autoFocus />
                    <div><button className="cancel-button" onClick={() => { setEditingId(null); setError('') }}><X size={14} /> Avbryt</button><button className="primary-button" onClick={() => updateFact(fact.id)} disabled={busy || !editDraft.trim()}><Save size={14} /> Lagre</button></div>
                  </div>
                ) : <p>{fact.content}</p>}
                <div className="fact-card-footer"><time>{fact.updatedLabel || fact.createdLabel}</time>{isAdmin && editingId !== fact.id && <div><button onClick={() => { setEditingId(fact.id); setEditDraft(fact.content); setError('') }}><Pencil size={14} /> Rediger</button><button className="fact-delete" onClick={() => onDelete(fact.id)}><Trash2 size={14} /> Slett</button></div>}</div>
              </article>
            ))}
          </div>
        ) : (
          <div className="facts-empty"><div><BadgeCheck size={34} /></div><h3>Arkivet venter på første funn</h3><p>Ingen bekreftede punkter er publisert ennå.</p>{isAdmin && !adding && <button onClick={() => setAdding(true)}><Plus size={15} /> Legg til det første punktet</button>}</div>
        )}
      </div>
    </section>
  )
}
