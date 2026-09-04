import {
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabaseClient'

export default function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] =
    useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [loading, setLoading] =
    useState(false)

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true)

  const [
    hasRecoverySession,
    setHasRecoverySession,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  useEffect(() => {
    let cancelled = false

    async function checkRecoverySession() {
      setCheckingSession(true)
      setErrorMessage('')

      try {
        const {
          data: {
            session,
          },
          error,
        } =
          await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (cancelled) {
          return
        }

        setHasRecoverySession(
          Boolean(session),
        )

        if (!session) {
          setErrorMessage(
            'Este link de recuperação não está mais válido. Solicite um novo link para redefinir sua senha.',
          )
        }
      } catch (error) {
        console.error(error)

        if (!cancelled) {
          setHasRecoverySession(
            false,
          )

          setErrorMessage(
            'Não foi possível validar este link de recuperação.',
          )
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false)
        }
      }
    }

    void checkRecoverySession()

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      (
        event,
        session,
      ) => {
        if (
          event ===
            'PASSWORD_RECOVERY' &&
          session
        ) {
          setHasRecoverySession(
            true,
          )

          setErrorMessage('')
          setCheckingSession(
            false,
          )
        }
      },
    )

    return () => {
      cancelled = true
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      loading ||
      !hasRecoverySession
    ) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    if (password.length < 6) {
      setErrorMessage(
        'Sua nova senha precisa ter pelo menos 6 caracteres.',
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

    setLoading(true)

    try {
      const { error } =
        await supabase.auth.updateUser({
          password,
        })

      if (error) {
        throw error
      }

      setSuccessMessage(
        'Senha atualizada com sucesso. Agora você já pode entrar com a nova senha.',
      )

      setPassword('')
      setConfirmPassword('')

      await supabase.auth.signOut()
    } catch (error) {
      console.error(error)

      setErrorMessage(
        'Não foi possível atualizar sua senha. Solicite um novo link de recuperação e tente novamente.',
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
            marginBottom: 26,
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
              fontSize:
                'clamp(2rem, 7vw, 3.3rem)',
              lineHeight: 1,
              letterSpacing: '-0.04em',
            }}
          >
            Crie uma nova senha.
          </h1>

          <p
            style={{
              margin: '16px 0 0',
              fontSize: 16,
              lineHeight: 1.6,
              color: '#667068',
            }}
          >
            Escolha uma senha nova para
            voltar à sua trilha de
            descobertas.
          </p>
        </div>

        {checkingSession ? (
          <div
            style={{
              padding: '24px 10px',
              textAlign: 'center',
              color: '#758078',
              fontSize: 14,
            }}
          >
            Validando seu link...
          </div>
        ) : (
          <>
            {successMessage && (
              <div
                style={{
                  marginBottom: 20,
                  padding: 16,
                  borderRadius: 16,
                  background: '#edf6ee',
                  color: '#315d3b',
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  marginBottom: 20,
                  padding: 16,
                  borderRadius: 16,
                  background: '#fff0ed',
                  color: '#8b2f23',
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                {errorMessage}
              </div>
            )}

            {hasRecoverySession &&
              !successMessage && (
                <form
                  onSubmit={(event) => {
                    void handleSubmit(
                      event,
                    )
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
                      Nova senha
                    </span>

                    <input
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target
                            .value,
                        )
                      }
                      autoComplete="new-password"
                      minLength={6}
                      required
                      placeholder="Mínimo de 6 caracteres"
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
                      Confirme a nova
                      senha
                    </span>

                    <input
                      type="password"
                      value={
                        confirmPassword
                      }
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target
                            .value,
                        )
                      }
                      autoComplete="new-password"
                      minLength={6}
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

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      border: 0,
                      borderRadius: 999,
                      padding:
                        '15px 20px',
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
                      ? 'Atualizando...'
                      : 'Salvar nova senha'}
                  </button>
                </form>
              )}

            <button
              type="button"
              onClick={() =>
                navigate('/login')
              }
              style={{
                display: 'block',
                width: '100%',
                marginTop: 18,
                border: 0,
                background: 'transparent',
                color: '#315d3b',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 8,
              }}
            >
              ← Voltar para entrar
            </button>
          </>
        )}
      </section>
    </main>
  )
}