import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

import MainNavigation from '../components/MainNavigation'
import { supabase } from '../lib/supabaseClient'

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_path: string | null
  city: string | null
  state: string | null
}

type Interest = {
  id: string
  name: string
}

type ProfileView = Profile & {
  avatarUrl: string | null
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background:
    'linear-gradient(180deg, #f7f6ef 0%, #f3f1e8 100%)',
  color: '#26342d',
}

const contentStyle: React.CSSProperties = {
  width: 'min(100%, 760px)',
  margin: '0 auto',
  padding: '28px 18px 130px',
  boxSizing: 'border-box',
}

export default function Explore() {
  const navigate = useNavigate()

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null)

  const [profiles, setProfiles] =
    useState<ProfileView[]>([])

  const [interests, setInterests] =
    useState<Interest[]>([])

  const [search, setSearch] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    async function loadExplore() {
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
          throw new Error(
            'Usuário não autenticado.',
          )
        }

        setCurrentUserId(user.id)

        const [
          profilesResult,
          interestsResult,
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select(
              `
                id,
                username,
                display_name,
                bio,
                avatar_path,
                city,
                state
              `,
            )
            .neq('id', user.id)
            .eq('status', 'active')
            .eq('visibility', 'public')
            .order('display_name', {
              ascending: true,
            }),

          supabase
            .from('interests')
            .select('id, name')
            .order('name', {
                ascending: true,
            }),
        ])

        if (profilesResult.error) {
          throw profilesResult.error
        }

        if (interestsResult.error) {
          throw interestsResult.error
        }

        const profileRows =
          (profilesResult.data ??
            []) as Profile[]

        const profilesWithAvatars =
          await Promise.all(
            profileRows.map(
              async (profile) => {
                if (
                  !profile.avatar_path
                ) {
                  return {
                    ...profile,
                    avatarUrl: null,
                  }
                }

                const {
                  data,
                  error,
                } =
                  await supabase.storage
                    .from('avatars')
                    .createSignedUrl(
                      profile.avatar_path,
                      60 * 60,
                    )

                if (error) {
                  console.error(
                    'Erro ao carregar avatar:',
                    error,
                  )

                  return {
                    ...profile,
                    avatarUrl: null,
                  }
                }

                return {
                  ...profile,
                  avatarUrl:
                    data.signedUrl,
                }
              },
            ),
          )

        setProfiles(
          profilesWithAvatars,
        )

        setInterests(
          (interestsResult.data ??
            []) as Interest[],
        )
      } catch (error) {
        console.error(error)

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o Explorar.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadExplore()
  }, [])

  const normalizedSearch =
    search.trim().toLocaleLowerCase(
      'pt-BR',
    )

  const filteredProfiles =
    useMemo(() => {
      if (!normalizedSearch) {
        return profiles
      }

      return profiles.filter(
        (profile) => {
          const text = [
            profile.display_name,
            profile.username,
            profile.bio,
            profile.city,
            profile.state,
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(
              'pt-BR',
            )

          return text.includes(
            normalizedSearch,
          )
        },
      )
    }, [
      normalizedSearch,
      profiles,
    ])

  const filteredInterests =
    useMemo(() => {
      if (!normalizedSearch) {
        return interests.slice(0, 12)
      }

      return interests.filter(
        (interest) =>
          interest.name
            .toLocaleLowerCase(
              'pt-BR',
            )
            .includes(
              normalizedSearch,
            ),
      )
    }, [
      interests,
      normalizedSearch,
    ])

  return (
    <main style={pageStyle}>
      <div style={contentStyle}>
        <header
          style={{
            marginBottom: 26,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#64806d',
              marginBottom: 5,
            }}
          >
            Florbonacci
          </div>

          <h1
            style={{
              margin: 0,
              fontSize:
                'clamp(30px, 6vw, 44px)',
              lineHeight: 1,
              color: '#233b2e',
            }}
          >
            Explorar
          </h1>

          <p
            style={{
              margin: '12px 0 0',
              color: '#6c776f',
              lineHeight: 1.55,
              fontSize: 14,
            }}
          >
            Encontre o que te encanta.
            Encontre quem também se
            encanta.
          </p>
        </header>

        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Busque pessoas ou interesses..."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border:
              '1px solid rgba(48, 76, 60, 0.14)',
            borderRadius: 18,
            padding: '14px 16px',
            marginBottom: 28,
            background: '#fff',
            color: '#35463b',
            fontFamily: 'inherit',
            fontSize: 15,
            outline: 'none',
            boxShadow:
              '0 7px 22px rgba(48, 65, 54, 0.05)',
          }}
        />

        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              marginBottom: 20,
              borderRadius: 14,
              background: '#fff1ee',
              color: '#8a4438',
              fontSize: 14,
            }}
          >
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: '50px 20px',
              textAlign: 'center',
              color: '#738078',
            }}
          >
            Procurando novas
            conexões...
          </div>
        ) : (
          <>
            <section
              style={{
                marginBottom: 32,
              }}
            >
              <h2
                style={{
                  margin: '0 0 14px',
                  color: '#284334',
                  fontSize: 20,
                }}
              >
                Interesses para explorar
              </h2>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {filteredInterests.length >
                0 ? (
                  filteredInterests.map(
                    (interest) => (
                      <span
                        key={interest.id}
                        style={{
                          display:
                            'inline-flex',
                          borderRadius: 999,
                          padding:
                            '9px 13px',
                          background:
                            '#e9f1ea',
                          color:
                            '#3d654c',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {interest.name}
                      </span>
                    ),
                  )
                ) : (
                  <span
                    style={{
                      color: '#89938c',
                      fontSize: 14,
                    }}
                  >
                    Nenhum interesse
                    encontrado.
                  </span>
                )}
              </div>
            </section>

            <section>
              <h2
                style={{
                  margin: '0 0 14px',
                  color: '#284334',
                  fontSize: 20,
                }}
              >
                Pessoas para descobrir
              </h2>

              <div
                style={{
                  display: 'grid',
                  gap: 12,
                }}
              >
                {filteredProfiles.length >
                0 ? (
                  filteredProfiles.map(
                    (profile) => {
                      const name =
                        profile.display_name?.trim() ||
                        profile.username?.trim() ||
                        'Explorador Florbonacci'

                      const initial =
                        name
                          .charAt(0)
                          .toUpperCase() ||
                        'F'

                      return (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() =>
                            navigate(
                              `/profile/${profile.id}`,
                            )
                          }
                          style={{
                            appearance:
                              'none',
                            width: '100%',
                            border:
                              '1px solid rgba(43, 70, 54, 0.10)',
                            borderRadius: 18,
                            padding:
                              '14px 15px',
                            background:
                              '#fff',
                            display: 'flex',
                            alignItems:
                              'center',
                            gap: 13,
                            textAlign:
                              'left',
                            cursor:
                              'pointer',
                            boxShadow:
                              '0 7px 22px rgba(48, 65, 54, 0.05)',
                            fontFamily:
                              'inherit',
                          }}
                        >
                          <div
                            style={{
                              width: 52,
                              height: 52,
                              flex:
                                '0 0 52px',
                              borderRadius:
                                '50%',
                              overflow:
                                'hidden',
                              display:
                                'grid',
                              placeItems:
                                'center',
                              background:
                                '#dce8df',
                              color:
                                '#315f49',
                              fontSize: 20,
                              fontWeight:
                                800,
                            }}
                          >
                            {profile.avatarUrl ? (
                              <img
                                src={
                                  profile.avatarUrl
                                }
                                alt=""
                                style={{
                                  width:
                                    '100%',
                                  height:
                                    '100%',
                                  objectFit:
                                    'cover',
                                  display:
                                    'block',
                                }}
                              />
                            ) : (
                              initial
                            )}
                          </div>

                          <div
                            style={{
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                color:
                                  '#2c4938',
                                fontSize: 15,
                                fontWeight:
                                  800,
                              }}
                            >
                              {name}
                            </div>

                            {profile.username && (
                              <div
                                style={{
                                  marginTop:
                                    2,
                                  color:
                                    '#839087',
                                  fontSize:
                                    12,
                                }}
                              >
                                @
                                {
                                  profile.username
                                }
                              </div>
                            )}

                            {(profile.city ||
                              profile.state) && (
                              <div
                                style={{
                                  marginTop:
                                    5,
                                  color:
                                    '#6d7a71',
                                  fontSize:
                                    12,
                                }}
                              >
                                {[
                                  profile.city,
                                  profile.state,
                                ]
                                  .filter(
                                    Boolean,
                                  )
                                  .join(
                                    ' · ',
                                  )}
                              </div>
                            )}

                            {profile.bio && (
                              <div
                                style={{
                                  marginTop:
                                    5,
                                  color:
                                    '#5d6b62',
                                  fontSize:
                                    13,
                                  lineHeight:
                                    1.4,
                                }}
                              >
                                {profile.bio}
                              </div>
                            )}
                          </div>

                          <span
                            aria-hidden="true"
                            style={{
                              color:
                                '#91a097',
                              fontSize: 22,
                            }}
                          >
                            ›
                          </span>
                        </button>
                      )
                    },
                  )
                ) : (
                  <div
                    style={{
                      padding:
                        '30px 18px',
                      textAlign:
                        'center',
                      borderRadius: 18,
                      background: '#fff',
                      color: '#7c8981',
                    }}
                  >
                    Nenhuma pessoa
                    encontrada.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      <MainNavigation
        currentUserId={currentUserId}
      />
    </main>
  )
}