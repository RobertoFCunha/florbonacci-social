import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Interest = {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
}

function InterestsOnboarding() {
  const navigate = useNavigate()

  const [interests, setInterests] = useState<Interest[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function loadInterests() {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('interests')
        .select('id, name, slug, description, parent_id')
        .eq('status', 'active')
        .order('name', { ascending: true })

      if (error) {
        console.error(error)

        setErrorMessage(
          'Não foi possível carregar os interesses agora.',
        )
        setLoading(false)
        return
      }

      setInterests(data ?? [])
      setLoading(false)
    }

    void loadInterests()
  }, [])

  const selectedCount = selectedIds.length

  const selectedInterests = useMemo(
    () =>
      interests.filter((interest) =>
        selectedIds.includes(interest.id),
      ),
    [interests, selectedIds],
  )

  function toggleInterest(interestId: string) {
    if (saving) {
      return
    }

    setSuccessMessage('')

    setSelectedIds((current) => {
      if (current.includes(interestId)) {
        return current.filter((id) => id !== interestId)
      }

      return [...current, interestId]
    })
  }

  async function handleContinue() {
    if (selectedIds.length === 0 || saving) {
      return
    }

    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        setErrorMessage(
          'Sua sessão não foi encontrada. Entre novamente para continuar.',
        )
        return
      }

      const { error: deleteError } = await supabase
        .from('profile_interests')
        .delete()
        .eq('profile_id', user.id)
        .eq('source', 'selected')

      if (deleteError) {
        throw deleteError
      }

      const rows = selectedIds.map((interestId) => ({
        profile_id: user.id,
        interest_id: interestId,
        weight: 1,
        source: 'selected',
      }))

      const { error: insertError } = await supabase
        .from('profile_interests')
        .insert(rows)

      if (insertError) {
        throw insertError
      }

      setSuccessMessage(
        'Sua trilha de curiosidades começou a tomar forma. ✨',
      )

      navigate('/discover')
    } catch (error) {
      console.error(error)

      setErrorMessage(
        'Não foi possível salvar seus interesses. Tente novamente.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f7f5ee',
        color: '#1f2a22',
        padding: '32px 20px 48px',
      }}
    >
      <section
        style={{
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            marginBottom: 32,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#4d6b55',
              marginBottom: 12,
            }}
          >
            Florbonacci Social
          </span>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(2.2rem, 6vw, 4rem)',
              lineHeight: 1,
              maxWidth: 760,
            }}
          >
            O que desperta sua curiosidade?
          </h1>

          <p
            style={{
              marginTop: 18,
              marginBottom: 0,
              maxWidth: 640,
              fontSize: 18,
              lineHeight: 1.6,
              color: '#536057',
            }}
          >
            Escolha alguns temas que fazem você parar para olhar.
            Eles vão ajudar o Florbonacci a construir sua primeira
            trilha de descobertas.
          </p>
        </div>

        {loading && (
          <div
            style={{
              padding: 24,
              borderRadius: 20,
              background: '#ffffff',
            }}
          >
            Carregando o seu mapa de curiosidades...
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              marginBottom: 20,
              padding: 20,
              borderRadius: 18,
              background: '#fff0ed',
              color: '#8b2f23',
            }}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              marginBottom: 20,
              padding: 20,
              borderRadius: 18,
              background: '#e7f2e8',
              color: '#315d3b',
              fontWeight: 700,
            }}
          >
            {successMessage}
          </div>
        )}

        {!loading && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(190px, 1fr))',
                gap: 14,
              }}
            >
              {interests.map((interest) => {
                const isSelected = selectedIds.includes(
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
                      border: isSelected
                        ? '2px solid #315d3b'
                        : '1px solid #dce3dc',
                      background: isSelected
                        ? '#e4efe6'
                        : '#ffffff',
                      color: '#1f2a22',
                      borderRadius: 22,
                      padding: '18px 16px',
                      minHeight: 96,
                      textAlign: 'left',
                      cursor: saving
                        ? 'wait'
                        : 'pointer',
                      opacity: saving ? 0.72 : 1,
                      boxShadow: isSelected
                        ? '0 10px 24px rgba(49, 93, 59, 0.10)'
                        : 'none',
                      transition:
                        'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                    }}
                  >
                    <strong
                      style={{
                        display: 'block',
                        fontSize: 17,
                        marginBottom: 6,
                      }}
                    >
                      {interest.name}
                    </strong>

                    {interest.description && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: 14,
                          lineHeight: 1.4,
                          color: '#667068',
                        }}
                      >
                        {interest.description}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div
              style={{
                position: 'sticky',
                bottom: 16,
                marginTop: 28,
                padding: 16,
                background: 'rgba(247, 245, 238, 0.94)',
                backdropFilter: 'blur(12px)',
                borderRadius: 24,
                border: '1px solid rgba(49, 93, 59, 0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong>
                  {selectedCount === 0
                    ? 'Escolha pelo menos um interesse'
                    : `${selectedCount} ${
                        selectedCount === 1
                          ? 'interesse escolhido'
                          : 'interesses escolhidos'
                      }`}
                </strong>

                {selectedInterests.length > 0 && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 14,
                      color: '#667068',
                    }}
                  >
                    {selectedInterests
                      .slice(0, 4)
                      .map((interest) => interest.name)
                      .join(' · ')}
                    {selectedInterests.length > 4
                      ? ' · ...'
                      : ''}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={
                  selectedCount === 0 || saving
                }
                onClick={() => {
                  void handleContinue()
                }}
                style={{
                  border: 0,
                  borderRadius: 999,
                  padding: '14px 24px',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor:
                    selectedCount === 0 || saving
                      ? 'not-allowed'
                      : 'pointer',
                  background:
                    selectedCount === 0 || saving
                      ? '#c9d1ca'
                      : '#315d3b',
                  color: '#ffffff',
                  minWidth: 130,
                }}
              >
                {saving ? 'Salvando...' : 'Continuar'}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default InterestsOnboarding