import { useState } from 'react'
import { LockKeyhole, X } from 'lucide-react'

export default function LoginModal({ open, onClose, onLogin, error, configured }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  if (!open) return null

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <button className="modal-close" onClick={onClose} aria-label="Lukk"><X size={20} /></button>
        <div className="login-icon"><LockKeyhole size={22} /></div>
        <span className="eyebrow">BEGRENSET OMRÅDE</span>
        <h2 id="login-title">Admin-innlogging</h2>
        <p>Kun kartansvarlig kan endre vurderingene.</p>
        {!configured && <div className="setup-note">Firebase må konfigureres i <code>.env</code> før admin kan logge inn.</div>}
        <form onSubmit={async (e) => {
          e.preventDefault(); setBusy(true)
          await onLogin(email, password)
          setBusy(false)
        }}>
          <label>E-post<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Passord<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button full" disabled={busy || !configured}>{busy ? 'Logger inn…' : 'Logg inn'}</button>
        </form>
      </div>
    </div>
  )
}
