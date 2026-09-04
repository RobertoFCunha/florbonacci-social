import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type AuthMode = 'login' | 'signup'

function Login() {
  const navigate = useNavigate()

  const [mode, setMode] =
    useState<AuthMode>('login')

  const [displayName, setDisplayName] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [loading, setLoading] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const isSignup = mode === 'signup'

  function changeMode(
    nextMode: AuthMode,
  ) {
    if (loading) {
      return
    }

    setMode(nextMode)
    setErrorMessage('')
    setSuccessMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (loading) {
      return
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    if (
      !normalizedEmail ||
      !password
    ) {
      return
    }

    if (isSignup) {
      if (!displayName.trim()) {
        setErrorMessage(
          'Informe seu nome para criar a conta.',
        )
        return
      }

      if (password.length < 6) {
        setErrorMessage(
          'Sua senha precisa ter pelo menos 6 caracteres.',
        )
        return
      }

      if (
        password !==
        confirmPassword
      ) {
        setErrorMessage(
          'As senhas não coincidem.',
        )
        return
      }
    }

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      if (isSignup) {
        const {
          data,
          error,
        } =
          await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: {
                display_name:
                  displayName.trim(),
                full_name:
                  displayName.trim(),
              },
            },
          })

        if (error) {
          throw error
        }

        if (data.session) {
          navigate('/interests')
          return
        }

        setSuccessMessage(
          'Conta criada! Verifique seu e-mail para confirmar o cadastro e depois volte para entrar.',
        )

        setMode('login')
        setPassword('')
        setConfirmPassword('')
        return
      }

      const { error } =
        await supabase.auth.signInWithPassword(
          {
            email: normalizedEmail,
            password,
          },
        )

      if (error) {
        throw error
      }

      navigate('/interests')
    } catch (error) {
      console.error(error)

      if (isSignup) {
        setErrorMessage(
          'Não foi possível criar a conta. Verifique os dados informados ou tente outro e-mail.',
        )
      } else {
        setErrorMessage(
          'Não foi possível entrar. Verifique seu e-mail e sua senha.',
        )
      }
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
        boxSizing: 'border-box',
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
          boxSizing: 'border-box',
          boxShadow:
            '0 24px 60px rgba(31, 42, 34, 0.10)',
        }}
      >
        <div
          style={{
            marginBottom: 24,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              marginBottom: 12,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing:
                '0.08em',
              textTransform:
                'uppercase',
              color: '#4d6b55',
            }}
          >
            Florbonacci Social
          </span>

          <h1
            style={{
              margin: 0,
              fontSize:
                'clamp(2.1rem, 7vw, 3.5rem)',
              lineHeight: 1,
              letterSpacing:
                '-0.04em',
            }}
          >
            {isSignup
              ? 'Comece sua trilha de descobertas.'
              : 'Entre para continuar sua trilha.'}
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
            {isSignup
              ? 'Crie seu perfil e descubra pessoas que se encantam pelas mesmas coisas que você.'
              : 'Suas descobertas começam com aquilo que desperta sua curiosidade.'}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: 6,
            padding: 5,
            marginBottom: 24,
            borderRadius: 999,
            background: '#eef2ed',
          }}
        >
          <button
            type="button"
            onClick={() =>
              changeMode('login')
            }
            style={{
              border: 0,
              borderRadius: 999,
              padding: '11px 14px',
              background:
                !isSignup
                  ? '#ffffff'
                  : 'transparent',
              color:
                !isSignup
                  ? '#315d3b'
                  : '#6e7971',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow:
                !isSignup
                  ? '0 3px 10px rgba(31, 42, 34, 0.07)'
                  : 'none',
            }}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() =>
              changeMode('signup')
            }
            style={{
              border: 0,
              borderRadius: 999,
              padding: '11px 14px',
              background:
                isSignup
                  ? '#ffffff'
                  : 'transparent',
              color:
                isSignup
                  ? '#315d3b'
                  : '#6e7971',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow:
                isSignup
                  ? '0 3px 10px rgba(31, 42, 34, 0.07)'
                  : 'none',
            }}
          >
            Criar conta
          </button>
        </div>

        {successMessage && (
          <div
            style={{
              marginBottom: 18,
              padding: 16,
              borderRadius: 16,
              background: '#edf6ee',
              color: '#315d3b',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              marginBottom: 18,
              padding: 16,
              borderRadius: 16,
              background: '#fff0ed',
              color: '#8b2f23',
              fontSize: 14,
              lineHeight: 1.5,
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
          {isSignup && (
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
                Como devemos chamar
                você?
              </span>

              <input
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value,
                  )
                }
                autoComplete="name"
                placeholder="Seu nome"
                required
                style={{
                  width: '100%',
                  boxSizing:
                    'border-box',
                  border:
                    '1px solid #d8dfd9',
                  borderRadius: 16,
                  padding:
                    '14px 16px',
                  fontSize: 16,
                  outline: 'none',
                  background:
                    '#fbfcfa',
                  color: '#1f2a22',
                }}
              />
            </label>
          )}

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
                setEmail(
                  event.target.value,
                )
              }
              autoComplete="email"
              placeholder="voce@exemplo.com"
              required
              style={{
                width: '100%',
                boxSizing:
                  'border-box',
                border:
                  '1px solid #d8dfd9',
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
              marginBottom:
                isSignup
                  ? 16
                  : 8,
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
                setPassword(
                  event.target.value,
                )
              }
              autoComplete={
                isSignup
                  ? 'new-password'
                  : 'current-password'
              }
              placeholder={
                isSignup
                  ? 'Mínimo de 6 caracteres'
                  : 'Sua senha'
              }
              required
              minLength={
                isSignup
                  ? 6
                  : undefined
              }
              style={{
                width: '100%',
                boxSizing:
                  'border-box',
                border:
                  '1px solid #d8dfd9',
                borderRadius: 16,
                padding: '14px 16px',
                fontSize: 16,
                outline: 'none',
                background: '#fbfcfa',
                color: '#1f2a22',
              }}
            />
          </label>

          {!isSignup && (
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                marginBottom: 22,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/forgot-password',
                  )
                }
                style={{
                  appearance: 'none',
                  border: 0,
                  background:
                    'transparent',
                  padding: '5px 0',
                  color: '#315d3b',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          {isSignup && (
            <label
              style={{
                display: 'block',
                marginBottom: 22,
              }}
            >
              <span
                style={{
                  display:
                    'block',
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Confirme a senha
              </span>

              <input
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                required
                minLength={6}
                style={{
                  width: '100%',
                  boxSizing:
                    'border-box',
                  border:
                    '1px solid #d8dfd9',
                  borderRadius: 16,
                  padding:
                    '14px 16px',
                  fontSize: 16,
                  outline: 'none',
                  background:
                    '#fbfcfa',
                  color: '#1f2a22',
                }}
              />
            </label>
          )}

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
            {loading
              ? isSignup
                ? 'Criando conta...'
                : 'Entrando...'
              : isSignup
                ? 'Criar minha conta'
                : 'Entrar'}
          </button>
        </form>

        <p
          style={{
            margin: '22px 0 0',
            textAlign: 'center',
            color: '#7a847d',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {isSignup
            ? 'Curiosidade move o mundo. Conexão transforma.'
            : 'Ainda não faz parte? Escolha “Criar conta” acima.'}
        </p>
      </section>
    </main>
  )
}

export default Login