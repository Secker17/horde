import { useState } from 'react'
import { BadgeCheck, MessageCircle, Send, ShieldCheck, Trash2 } from 'lucide-react'

export default function Comments({ comments, selected, onSubmit, isAdmin, verifiedUsers, onDelete, onToggleVerified }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim() || message.trim().length < 3) return
    setSending(true)
    await onSubmit({ name: name.trim(), message: message.trim(), area: selected?.name || 'Hele Norge' })
    setMessage('')
    setSending(false)
  }

  return (
    <section className="comments-section" id="fellesskap">
      <div className="section-kicker"><MessageCircle size={16} /> ÅPEN DISKUSJON</div>
      <div className="comments-grid">
        <div>
          <h2>Åpent<br />kommentarfelt.</h2>
          <p className="section-lead">Snakk med andre jegere i sanntid. Velg et brukernavn og bli med i samtalen — ingen konto nødvendig.</p>
          <form className="comment-form" onSubmit={submit}>
            <div className="form-row">
              <label>Brukernavn<input maxLength="40" value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Fjellreven" required /></label>
              <label>Knyttet til<input value={selected?.name || 'Hele Norge'} readOnly /></label>
            </div>
            <label>Kommentar<textarea maxLength="600" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Skriv en kommentar…" required /></label>
            <div className="form-footer"><span>{message.length} / 600</span><button className="primary-button" disabled={sending}>{sending ? 'Sender…' : 'Publiser kommentar'} <Send size={16} /></button></div>
          </form>
        </div>
        <div className="comment-feed">
          <div className="feed-heading"><strong>Kommentarer</strong><span className="live-label"><i /> DIREKTE · {comments.length}</span></div>
          {comments.length === 0 && <div className="empty-comments"><MessageCircle size={24} /><p>Ingen kommentarer ennå. Bli den første!</p></div>}
          {comments.map((comment) => (
            <article className="comment-card" key={comment.id}>
              <div className="avatar">{comment.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="comment-meta">
                  <strong>{comment.name}</strong>
                  {verifiedUsers[comment.authorUid] && <BadgeCheck className="verified-badge" size={16} aria-label="Verifisert bruker" />}
                  <span>{comment.area}</span>
                </div>
                <p>{comment.message}</p>
                <div className="comment-actions">
                  <time>{comment.timeLabel}</time>
                  {isAdmin && comment.id !== 'welcome' && <div>
                    <button onClick={() => onToggleVerified(comment)} title={verifiedUsers[comment.authorUid] ? 'Fjern verifisering' : 'Verifiser bruker'}><ShieldCheck size={14} /> {verifiedUsers[comment.authorUid] ? 'Fjern verifisering' : 'Verifiser'}</button>
                    <button className="delete-comment" onClick={() => onDelete(comment.id)} title="Slett kommentar"><Trash2 size={14} /> Slett</button>
                  </div>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
