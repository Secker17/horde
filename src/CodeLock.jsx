import { useEffect, useState } from 'react'
import { addDoc, collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'

export default function CodeGuess({ db, firebaseReady }) {
  const [input, setInput] = useState('')
  const [topThree, setTopThree] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!firebaseReady || !db) return

    const unsubscribe = onSnapshot(
      query(collection(db, 'codeGuesses'), orderBy('createdAt', 'desc'), limit(100)),
      (snapshot) => {
        const allGuesses = snapshot.docs.map((doc) => doc.data().guess)
        updateTopThree(allGuesses)
      },
      (error) => {
        console.error('Error loading guesses:', error)
        setError('Kunne ikke laste gjettinger')
      },
    )

    return () => unsubscribe()
  }, [firebaseReady, db])

  const updateTopThree = (allGuesses) => {
    const counts = {}
    allGuesses.forEach((guess) => {
      counts[guess] = (counts[guess] || 0) + 1
    })
    const sorted = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([code, count]) => ({ code, count }))
    setTopThree(sorted)
  }

  const handleGuess = async () => {
    if (input.length !== 4 || !/^\d{4}$/.test(input) || !firebaseReady || !db) return

    setLoading(true)
    setError('')
    try {
      await addDoc(collection(db, 'codeGuesses'), {
        guess: input,
        createdAt: new Date(),
      })
      setInput('')
    } catch (error) {
      console.error('Feil ved lagring av gjetting:', error)
      setError('Kunne ikke lagre gjetting. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="code-guess-widget">
      <div className="guess-header">
        <h3>Gjett 4-sifret koden</h3>
      </div>

      <div className="guess-input-group">
        <div className="guess-display">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="guess-digit">
              {input[i] || ''}
            </div>
          ))}
        </div>

        <input
          type="text"
          maxLength="4"
          inputMode="numeric"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="0000"
          className="guess-input-hidden"
          autoComplete="off"
          onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
        />

        <button
          className="guess-button"
          onClick={handleGuess}
          disabled={input.length !== 4 || loading}
        >
          {loading ? 'Sender...' : 'Gjett'}
        </button>
      </div>

      {error && <div className="guess-error">{error}</div>}

      <div className="guess-stats">
        <div className="stats-title">Mest gjettede koder</div>
        <div className="stats-list">
          {topThree.length > 0 ? (
            topThree.map((item, idx) => (
              <div key={idx} className="stats-row">
                <span className="stats-code">{item.code}</span>
                <span className="stats-count">{item.count} gjettinger</span>
              </div>
            ))
          ) : (
            <div className="stats-empty">Ingen gjettinger ennå</div>
          )}
        </div>
      </div>
    </div>
  )
}

