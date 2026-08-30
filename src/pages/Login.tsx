import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!email || !password || loading) {
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      navigate('/interests')
    } catch (error) {
      console.error(error)

      setErrorMessage(
        'Não foi possível entrar. Verifique seu e-mail e sua senha.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #f7f5ee 0%, #eef4ee 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        color: '#1f2a22',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#ffffff',
          borderRadius: 28,
          padding: '34px 30px',
          boxShadow:
            '0 24px 60px rgba(31, 42, 34, 0.10)',
        }}
      >
        <div
          style={{
            marginBottom: 28,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              marginBottom: 12,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#4d6b55',
            }}
          >
            Florbonacci Social
          </span>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(2.2rem, 7vw, 3.6rem)',
              lineHeight: 1,
              letterSpacing: '-0.04em',
            }}
          >
            Entre para continuar sua trilha.
          </h1>

          <p
            style={{
              marginTop: 16,
              marginBottom: 0,
              fontSize: 16,
              lineHeight: 1.6,
              color: '#667068',
            }}
          >
            Suas descobertas começam com aquilo que desperta
            sua curiosidade.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              marginBottom: 18,
              padding: 16,
              borderRadius: 16,
              background: '#fff0ed',
              color: '#8b2f23',
              fontSize: 14,
            }}
          >
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          <label
            style={{
              display: 'block',
              marginBottom: 16,
            }}
          >
            <span
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              E-mail
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid #d8dfd9',
                borderRadius: 16,
                padding: '14px 16px',
                fontSize: 16,
                outline: 'none',
                background: '#fbfcfa',
                color: '#1f2a22',
              }}
            />
          </label>

          <label
            style={{
              display: 'block',
              marginBottom: 22,
            }}
          >
            <span
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Senha
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid #d8dfd9',
                borderRadius: 16,
                padding: '14px 16px',
                fontSize: 16,
                outline: 'none',
                background: '#fbfcfa',
                color: '#1f2a22',
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              border: 0,
              borderRadius: 999,
              padding: '15px 20px',
              background: loading
                ? '#9eb0a1'
                : '#315d3b',
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading
                ? 'wait'
                : 'pointer',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login