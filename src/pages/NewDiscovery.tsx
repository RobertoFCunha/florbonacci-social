import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Interest = {
  id: string
  name: string
}

function NewDiscovery() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [interests, setInterests] = useState<Interest[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadInterests() {
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

        const preferredIds = (profileInterests ?? []).map(
          (item) => item.interest_id,
        )

        const {
          data: interestRows,
          error: interestsError,
        } = await supabase
          .from('interests')
          .select('id, name')
          .eq('status', 'active')
          .order('name', { ascending: true })

        if (interestsError) {
          throw interestsError
        }

        if (!active) {
          return
        }

        setInterests(interestRows ?? [])
        setSelectedIds(preferredIds)
      } catch (error) {
        console.error(error)

        if (active) {
          setErrorMessage(
            'Não foi possível preparar sua nova descoberta.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadInterests()

    return () => {
      active = false
    }
  }, [navigate])

  function toggleInterest(interestId: string) {
    if (saving) {
      return
    }

    setSelectedIds((current) => {
      if (current.includes(interestId)) {
        return current.filter((id) => id !== interestId)
      }

      return [...current, interestId]
    })
  }

  async function handlePublish() {
    const cleanTitle = title.trim()
    const cleanBody = body.trim()

    if (!cleanBody || saving) {
      return
    }

    setSaving(true)
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
        data: discovery,
        error: discoveryError,
      } = await supabase
        .from('discoveries')
        .insert({
          author_id: user.id,
          title: cleanTitle || null,
          body: cleanBody,
          visibility: 'public',
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (discoveryError) {
        throw discoveryError
      }

      if (selectedIds.length > 0) {
        const rows = selectedIds.map((interestId) => ({
          discovery_id: discovery.id,
          interest_id: interestId,
        }))

        const { error: interestsError } = await supabase
          .from('discovery_interests')
          .insert(rows)

        if (interestsError) {
          throw interestsError
        }
      }

      navigate('/discover')
    } catch (error) {
      console.error(error)

      setErrorMessage(
        'Não foi possível publicar sua descoberta. Tente novamente.',
      )
    } finally {
      setSaving(false)
    }
  }

  const canPublish = body.trim().length > 0 && !saving

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #f7f5ee 0%, #eef4ee 100%)',
        color: '#1f2a22',
        padding: '32px 20px 56px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 760,
          margin: '0 auto',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/discover')}
          style={{
            padding: 0,
            background: 'transparent',
            color: '#587260',
            fontWeight: 750,
            cursor: 'pointer',
          }}
        >
          ← Voltar ao Discover
        </button>

        <header
          style={{
            marginTop: 38,
            marginBottom: 34,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              marginBottom: 12,
              color: '#587260',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Nova descoberta
          </span>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(2.6rem, 7vw, 4.8rem)',
              lineHeight: 0.98,
              letterSpacing: '-0.05em',
            }}
          >
            O que chamou
            <br />
            sua atenção?
          </h1>

          <p
            style={{
              margin: '20px 0 0',
              maxWidth: 620,
              color: '#59645c',
              fontSize: 18,
              lineHeight: 1.6,
            }}
          >
            Registre algo que fez você parar, observar, pensar
            ou querer saber mais.
          </p>
        </header>

        {errorMessage && (
          <div
            style={{
              marginBottom: 22,
              padding: 18,
              borderRadius: 18,
              background: '#fff0ed',
              color: '#8b2f23',
            }}
          >
            {errorMessage}
          </div>
        )}

        <div
          style={{
            padding: 'clamp(22px, 5vw, 36px)',
            borderRadius: 30,
            background: '#ffffff',
            border: '1px solid rgba(49, 93, 59, 0.09)',
            boxShadow:
              '0 18px 50px rgba(49, 93, 59, 0.07)',
          }}
        >
          <label
            htmlFor="discovery-title"
            style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: 750,
            }}
          >
            Dê um nome à descoberta
          </label>

          <input
            id="discovery-title"
            type="text"
            value={title}
            disabled={saving}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Opcional"
            maxLength={120}
            style={{
              width: '100%',
              border: '1px solid #dce3dc',
              borderRadius: 16,
              padding: '14px 16px',
              background: '#fbfcfa',
              outline: 'none',
            }}
          />

          <label
            htmlFor="discovery-body"
            style={{
              display: 'block',
              marginTop: 26,
              marginBottom: 8,
              fontWeight: 750,
            }}
          >
            Conte o que você percebeu
          </label>

          <textarea
            id="discovery-body"
            value={body}
            disabled={saving}
            onChange={(event) => setBody(event.target.value)}
            placeholder="O que você viu, percebeu ou achou curioso?"
            rows={7}
            style={{
              width: '100%',
              resize: 'vertical',
              border: '1px solid #dce3dc',
              borderRadius: 18,
              padding: '16px',
              background: '#fbfcfa',
              outline: 'none',
              lineHeight: 1.6,
            }}
          />

          <div
            style={{
              marginTop: 30,
            }}
          >
            <div
              style={{
                marginBottom: 14,
              }}
            >
              <strong
                style={{
                  display: 'block',
                  fontSize: 17,
                }}
              >
                Isso se conecta a quê?
              </strong>

              <span
                style={{
                  display: 'block',
                  marginTop: 4,
                  color: '#6c766e',
                  fontSize: 14,
                }}
              >
                Seus interesses já aparecem selecionados. Ajuste
                se quiser.
              </span>
            </div>

            {loading ? (
              <div
                style={{
                  color: '#667068',
                }}
              >
                Carregando interesses...
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 9,
                }}
              >
                {interests.map((interest) => {
                  const selected = selectedIds.includes(
                    interest.id,
                  )

                  return (
                    <button
                      key={interest.id}
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        toggleInterest(interest.id)
                      }
                      style={{
                        border: selected
                          ? '1px solid #315d3b'
                          : '1px solid #dce3dc',
                        borderRadius: 999,
                        padding: '9px 14px',
                        background: selected
                          ? '#e4efe6'
                          : '#ffffff',
                        color: selected
                          ? '#315d3b'
                          : '#59645c',
                        fontWeight: 700,
                        cursor: saving
                          ? 'wait'
                          : 'pointer',
                      }}
                    >
                      {interest.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 34,
              paddingTop: 24,
              borderTop: '1px solid #edf0ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                color: '#758078',
                fontSize: 14,
              }}
            >
              Esta descoberta será pública.
            </span>

            <button
              type="button"
              disabled={!canPublish}
              onClick={() => {
                void handlePublish()
              }}
              style={{
                borderRadius: 999,
                padding: '14px 24px',
                background: canPublish
                  ? '#315d3b'
                  : '#c9d1ca',
                color: '#ffffff',
                fontWeight: 800,
                cursor: canPublish
                  ? 'pointer'
                  : 'not-allowed',
              }}
            >
              {saving
                ? 'Publicando...'
                : 'Publicar descoberta'}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default NewDiscovery