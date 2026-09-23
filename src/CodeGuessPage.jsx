import { ChevronLeft } from 'lucide-react'
import CodeGuess from './CodeLock'

export default function CodeGuessPage({ db, firebaseReady, onBack }) {
  return (
    <div className="code-guess-page">
      <div className="code-guess-background" />
      <div className="code-guess-content">
        <button className="back-button" onClick={onBack} aria-label="Tilbake">
          <ChevronLeft size={20} />
          Tilbake
        </button>

        <div className="code-guess-center">
          <div className="code-guess-header-page">
            <h1>Gjett koden</h1>
            <p>Samarbeid med andre for å finne den 4-sifrede koden</p>
          </div>

          <CodeGuess db={db} firebaseReady={firebaseReady} />
        </div>
      </div>
    </div>
  )
}
