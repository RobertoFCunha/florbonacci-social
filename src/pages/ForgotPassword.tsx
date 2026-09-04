import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabaseClient'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (loading) {
      return
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    if (!normalizedEmail) {
      setErrorMessage(
        'Informe seu e-mail.',
      )
      return
    }

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const redirectTo =
        `${window.location.origin}/reset-password`

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo,
          },
        )

      if (error) {
        throw error
      }

      setSuccessMessage(
        'Se houver uma conta vinculada a esse e-mail, enviaremos as instruções para criar uma nova senha. Confira também a caixa de spam.',
      )
    } catch (error) {
        console.error(error)

        const message =
            error instanceof Error
            ? error.message.toLowerCase()
            : ''

        if (
            message.includes(
            'email rate limit exceeded',
            ) ||
            message.includes(
            'too many requests',
            )
        ) {
            setErrorMessage(
            'Muitas solicitações foram feitas em pouco tempo. Aguarde alguns minutos e tente novamente.',
            )
        } else {
            setErrorMessage(
            'Não foi possível enviar as instruções agora. Tente novamente em alguns instantes.',
            )
        }
        } 
    
    finally {
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
            Esqueceu sua senha?
          </h1>

          <p
            style={{
              margin: '16px 0 0',
              fontSize: 16,
              lineHeight: 1.6,
              color: '#667068',
            }}
          >
            Acontece até com grandes
            exploradores. Informe o
            e-mail da sua conta e
            enviaremos um caminho para
            criar uma nova senha.
          </p>
        </div>

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

        {!successMessage && (
          <form
            onSubmit={(event) => {
              void handleSubmit(event)
            }}
          >
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
                autoFocus
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
                ? 'Enviando...'
                : 'Enviar instruções'}
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

        <p
          style={{
            margin: '18px 0 0',
            textAlign: 'center',
            color: '#8a938d',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          Por segurança, não informamos
          se um e-mail está ou não
          cadastrado.
        </p>
      </section>
    </main>
  )
}