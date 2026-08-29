import { useEffect, useState } from 'react'
import type {
  CSSProperties,
  SyntheticEvent,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import './App.css'

function App() {
  const [session, setSession] =
    useState<Session | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const [interestCount, setInterestCount] =
    useState<number | null>(null)

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      setSession(currentSession)
      setLoading(false)
    }

    void initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const loadInterests = async () => {
      if (!session) {
        setInterestCount(null)
        return
      }

      const { count, error } = await supabase
        .from('interests')
        .select('id', {
          count: 'exact',
          head: true,
        })

      if (error) {
        console.error(
          'Erro ao consultar interesses:',
          error,
        )

        setMessage(
          `Erro ao consultar interesses: ${error.message}`,
        )

        return
      }

      setInterestCount(count ?? 0)
    }

    void loadInterests()
  }, [session])

  const handleLogin = async (
    event: SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setLoading(true)
    setMessage('Entrando...')

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

    if (error) {
      console.error('Erro no login:', error)
      setMessage(error.message)
      setLoading(false)
      return
    }

    setPassword('')
    setMessage('')
    setLoading(false)
  }

  const handleLogout = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      setMessage(error.message)
    }

    setLoading(false)
  }

  if (loading && !session) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <div style={styles.leaf}>🌿</div>

          <strong>
            Preparando o Florbonacci Social...
          </strong>
        </section>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.leaf}>🌿</div>

        <p style={styles.brand}>
          FLORBONACCI SOCIAL
        </p>

        {!session ? (
          <>
            <h1 style={styles.title}>
              Curiosidade conecta.
            </h1>

            <p style={styles.subtitle}>
              Entre para começar a descobrir o que
              desperta sua curiosidade.
            </p>

            <form
              onSubmit={handleLogin}
              style={styles.form}
            >
              <label style={styles.label}>
                E-mail

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  autoComplete="email"
                  style={styles.input}
                  placeholder="seu@email.com"
                />
              </label>

              <label style={styles.label}>
                Senha

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  autoComplete="current-password"
                  style={styles.input}
                  placeholder="••••••••"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                style={styles.button}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            {message && (
              <p style={styles.error}>
                {message}
              </p>
            )}
          </>
        ) : (
          <>
            <p style={styles.successLabel}>
              ✓ CONECTADO
            </p>

            <h1 style={styles.title}>
              O Florbonacci está vivo.
            </h1>

            <p style={styles.subtitle}>
              Frontend, autenticação, RLS e banco de
              dados estão conversando.
            </p>

            <div style={styles.result}>
              <strong style={styles.resultNumber}>
                {interestCount ?? '...'}
              </strong>

              <span>
                interesses encontrados no
                <br />
                Grafo de Curiosidade
              </span>
            </div>

            <p style={styles.account}>
              Sessão autenticada como
              <br />

              <strong>
                {session.user.email}
              </strong>
            </p>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              style={styles.secondaryButton}
            >
              Sair
            </button>

            {message && (
              <p style={styles.error}>
                {message}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    background:
      'linear-gradient(180deg, #f7f8f2 0%, #eaf1e4 100%)',
    color: '#20352a',
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  card: {
    width: 'min(100%, 500px)',
    padding: '42px 32px',
    borderRadius: 28,
    background: 'rgba(255,255,255,0.92)',
    boxShadow:
      '0 24px 70px rgba(32, 53, 42, 0.12)',
    textAlign: 'center',
  },

  leaf: {
    fontSize: 46,
    marginBottom: 10,
  },

  brand: {
    margin: 0,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.17em',
    color: '#557263',
  },

  title: {
    margin: '16px 0 10px',
    fontSize: 'clamp(32px, 7vw, 48px)',
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
  },

  subtitle: {
    margin: '0 auto 28px',
    maxWidth: 410,
    color: '#68766d',
    lineHeight: 1.6,
  },

  form: {
    display: 'grid',
    gap: 18,
    textAlign: 'left',
  },

  label: {
    display: 'grid',
    gap: 7,
    fontSize: 14,
    fontWeight: 700,
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #d7dfd5',
    borderRadius: 14,
    padding: '14px 15px',
    fontSize: 16,
    outline: 'none',
    background: '#fbfcf9',
  },

  button: {
    border: 0,
    borderRadius: 14,
    padding: '15px 20px',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    background: '#284f39',
    color: 'white',
  },

  secondaryButton: {
    border: '1px solid #ccd8ce',
    borderRadius: 14,
    padding: '12px 22px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    background: 'white',
    color: '#284f39',
  },

  successLabel: {
    margin: '20px 0 0',
    color: '#477154',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.14em',
  },

  result: {
    margin: '26px 0',
    padding: 22,
    borderRadius: 18,
    background: '#edf6ec',
    display: 'grid',
    gap: 6,
    color: '#486653',
  },

  resultNumber: {
    fontSize: 42,
    lineHeight: 1,
    color: '#284f39',
  },

  account: {
    margin: '0 0 22px',
    color: '#738078',
    lineHeight: 1.5,
    fontSize: 14,
  },

  error: {
    margin: '18px 0 0',
    padding: 12,
    borderRadius: 12,
    background: '#fff0ed',
    color: '#8b4c42',
    fontSize: 14,
  },
}

export default App