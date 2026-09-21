import { useEffect, useState } from 'react'
import { BadgeCheck, Pencil, Save, X } from 'lucide-react'

export default function ConfirmedInfo({ info, isAdmin, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.content || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editing) setDraft(info.content || '')
  }, [info.content, editing])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await onSave(draft.trim())
      setEditing(false)
    } catch {
      setError('Kunne ikke lagre. Kontroller at Firestore-reglene er publisert.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="confirmed-section" id="bekreftet">
      <div className="confirmed-inner">
        <div className="confirmed-heading">
          <div>
            <div className="section-kicker"><BadgeCheck size={17} /> OFFISIELT BEKREFTET</div>
            <h2>Det vi vet<br /><em>helt sikkert.</em></h2>
          </div>
          {isAdmin && !editing && <button className="outline-button" onClick={() => setEditing(true)}><Pencil size={15} /> Rediger informasjon</button>}
        </div>

        <div className="confirmed-card">
          <div className="confirmed-seal"><BadgeCheck size={30} /><span>VERIFISERT</span></div>
          {editing ? (
            <div className="confirmed-editor">
              <label htmlFor="confirmed-content">Bekreftet informasjon</label>
              <textarea id="confirmed-content" maxLength="4000" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Skriv inn det som er offisielt bekreftet…" autoFocus />
              <div className="editor-footer">
                <span>{draft.length} / 4000</span>
                <div><button className="cancel-button" onClick={() => { setEditing(false); setError('') }}><X size={15} /> Avbryt</button><button className="primary-button" onClick={save} disabled={saving}><Save size={15} /> {saving ? 'Lagrer…' : 'Lagre'}</button></div>
              </div>
              {error && <p className="map-error">{error}</p>}
            </div>
          ) : (
            <div className="confirmed-content">
              {info.content ? <p>{info.content}</p> : <div className="confirmed-empty"><p>Ingen bekreftet informasjon er publisert ennå.</p>{isAdmin && <button onClick={() => setEditing(true)}>Legg til første oppdatering</button>}</div>}
              {info.updatedLabel && <div className="confirmed-updated"><i /> Sist oppdatert {info.updatedLabel}</div>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
