import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Interest = {
  id: string
  name: string
  slug: string
}

function Discover() {
  const navigate = useNavigate()

  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadTrail() {
      setLoading(true)
      setErrorMessage('')

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!user) {
          navigate('/login', { replace: true })
          return
        }

        const {
          data: profileInterests,
          error: profileInterestsError,
        } = await supabase
          .from('profile_interests')
          .select('interest_id')
          .eq('profile_id', user.id)
          .eq('source', 'selected')

        if (profileInterestsError) {
          throw profileInterestsError
        }

        const interestIds = (profileInterests ?? []).map(
          (item) => item.interest_id,
        )

        if (interestIds.length === 0) {
          if (active) {
            setInterests([])
          }

          return
        }

        const {
          data: interestRows,
          error: interestsError,
        } = await supabase
          .from('interests')
          .select('id, name, slug')
          .in('id', interestIds)
          .order('name', { ascending: true })

        if (interestsError) {
          throw interestsError
        }

        if (active) {
          setInterests(interestRows ?? [])
        }
      } catch (error) {
        console.error(error)

        if (active) {
          setErrorMessage(
            'Não foi possível carregar sua trilha agora.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadTrail()

    return () => {
      active = false
    }
  }, [navigate])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #f7f5ee 0%, #eef4ee 100%)',
        color: '#1f2a22',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(247, 245, 238, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(49, 93, 59, 0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/discover')}
            style={{
              padding: 0,
              background: 'transparent',
              color: '#315d3b',
              fontSize: 21,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              cursor: 'pointer',
            }}
          >
            Florbonacci
          </button>

          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/interests')}
              style={{
                borderRadius: 999,
                padding: '10px 15px',
                background: '#e7eee7',
                color: '#315d3b',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Meus interesses
            </button>

            <button
              type="button"
              onClick={() => {
                void handleSignOut()
              }}
              style={{
                borderRadius: 999,
                padding: '10px 15px',
                background: 'transparent',
                color: '#6d766f',
                fontWeight: 650,
                cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '48px 20px 72px',
        }}
      >
        <section
          style={{
            maxWidth: 760,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              marginBottom: 14,
              color: '#587260',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Descobrir
          </span>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(2.7rem, 7vw, 5.5rem)',
              lineHeight: 0.94,
              letterSpacing: '-0.055em',
              maxWidth: 850,
            }}
          >
            O mundo tem mais
            <br />
            quando você olha.
          </h1>

          <p
            style={{
              margin: '24px 0 0',
              maxWidth: 650,
              color: '#59645c',
              fontSize: 19,
              lineHeight: 1.65,
            }}
          >
            Sua trilha nasce daquilo que desperta sua
            curiosidade. Cada descoberta poderá revelar novas
            pessoas, lugares, ideias e caminhos.
          </p>
        </section>

        <section
          style={{
            marginTop: 44,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 18,
              flexWrap: 'wrap',
              marginBottom: 18,
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  marginBottom: 5,
                  color: '#748078',
                  fontSize: 13,
                  fontWeight: 750,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                }}
              >
                Sua trilha
              </span>

              <h2
                style={{
                  margin: 0,
                  fontSize: 26,
                  letterSpacing: '-0.03em',
                }}
              >
                O que chama sua atenção
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('/interests')}
              style={{
                padding: 0,
                background: 'transparent',
                color: '#315d3b',
                fontWeight: 750,
                cursor: 'pointer',
              }}
            >
              Editar interesses →
            </button>
          </div>

          {loading && (
            <div
              style={{
                padding: 22,
                borderRadius: 24,
                background: 'rgba(255, 255, 255, 0.78)',
                border: '1px solid rgba(49, 93, 59, 0.08)',
                color: '#667068',
              }}
            >
              Organizando sua trilha...
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: 22,
                borderRadius: 24,
                background: '#fff0ed',
                color: '#8b2f23',
              }}
            >
              {errorMessage}
            </div>
          )}

          {!loading &&
            !errorMessage &&
            interests.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                {interests.map((interest) => (
                  <div
                    key={interest.id}
                    style={{
                      padding: '11px 16px',
                      borderRadius: 999,
                      background: '#ffffff',
                      border:
                        '1px solid rgba(49, 93, 59, 0.13)',
                      boxShadow:
                        '0 6px 20px rgba(49, 93, 59, 0.05)',
                      color: '#315d3b',
                      fontWeight: 700,
                    }}
                  >
                    {interest.name}
                  </div>
                ))}
              </div>
            )}

          {!loading &&
            !errorMessage &&
            interests.length === 0 && (
              <div
                style={{
                  padding: 24,
                  borderRadius: 24,
                  background: '#ffffff',
                  border:
                    '1px solid rgba(49, 93, 59, 0.08)',
                }}
              >
                <strong
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 18,
                  }}
                >
                  Sua trilha ainda está vazia.
                </strong>

                <span
                  style={{
                    color: '#667068',
                  }}
                >
                  Escolha alguns interesses para começar a
                  personalizar suas descobertas.
                </span>
              </div>
            )}
        </section>

        <section
          style={{
            marginTop: 56,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 20,
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  marginBottom: 5,
                  color: '#748078',
                  fontSize: 13,
                  fontWeight: 750,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                }}
              >
                Para você
              </span>

              <h2
                style={{
                  margin: 0,
                  fontSize: 30,
                  letterSpacing: '-0.035em',
                }}
              >
                Descobertas
              </h2>
            </div>
          </div>

          <article
            style={{
              overflow: 'hidden',
              borderRadius: 32,
              background: '#1f2a22',
              color: '#ffffff',
              minHeight: 360,
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(280px, 1fr))',
              boxShadow:
                '0 24px 60px rgba(31, 42, 34, 0.12)',
            }}
          >
            <div
              style={{
                minHeight: 300,
                background:
                  'radial-gradient(circle at 30% 20%, rgba(177, 210, 168, 0.42), transparent 34%), radial-gradient(circle at 72% 68%, rgba(98, 143, 106, 0.46), transparent 38%), linear-gradient(145deg, #6e896c 0%, #26392d 100%)',
                display: 'grid',
                placeItems: 'center',
                padding: 32,
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.36)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 52,
                }}
              >
                ✦
              </div>
            </div>

            <div
              style={{
                padding: 'clamp(28px, 5vw, 52px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: '#b9cbbd',
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                O próximo passo
              </span>

              <h3
                style={{
                  margin: '12px 0 0',
                  maxWidth: 460,
                  fontSize: 'clamp(2rem, 4vw, 3.4rem)',
                  lineHeight: 1,
                  letterSpacing: '-0.045em',
                }}
              >
                Sua curiosidade vai ganhar um feed.
              </h3>

              <p
                style={{
                  margin: '18px 0 0',
                  maxWidth: 480,
                  color: '#d4ddd6',
                  fontSize: 17,
                  lineHeight: 1.6,
                }}
              >
                Aqui entrarão as descobertas publicadas pela
                comunidade, organizadas pelos assuntos que fazem
                sentido para você.
              </p>
            </div>
          </article>
        </section>

        <footer
          style={{
            marginTop: 54,
            paddingTop: 22,
            borderTop: '1px solid rgba(49, 93, 59, 0.10)',
            color: '#7a847c',
            fontSize: 14,
          }}
        >
          Curiosidade move o mundo. Conexão transforma.
        </footer>
      </div>
    </main>
  )
}

export default Discover