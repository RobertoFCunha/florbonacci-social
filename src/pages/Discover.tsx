import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Interest = {
  id: string
  name: string
  slug: string
}

type FeedAuthor = {
  id: string
  display_name: string | null
  username: string | null
  avatar_path: string | null
}

type DiscoveryMedia = {
  id: string
  discovery_id: string
  media_type: string
  storage_path: string
  thumbnail_path: string | null
  position: number
}

type Discovery = {
  id: string
  author_id: string
  title: string | null
  body: string
  visibility: string
  status: string
  public_city: string | null
  public_state: string | null
  public_country: string | null
  created_at: string
  published_at: string | null
  author: FeedAuthor | null
  interests: Interest[]
  media: DiscoveryMedia | null
  mediaUrl: string | null
}

type DiscoveryRow = {
  id: string
  author_id: string
  title: string | null
  body: string
  visibility: string
  status: string
  public_city: string | null
  public_state: string | null
  public_country: string | null
  created_at: string
  published_at: string | null
}

type DiscoveryInterestRow = {
  discovery_id: string
  interest_id: string
}

function Discover() {
  const navigate = useNavigate()

  const [interests, setInterests] = useState<Interest[]>([])
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])

  const [loadingTrail, setLoadingTrail] = useState(true)
  const [loadingFeed, setLoadingFeed] = useState(true)

  const [trailError, setTrailError] = useState('')
  const [feedError, setFeedError] = useState('')

  useEffect(() => {
    let active = true

    async function loadPage() {
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

        await Promise.all([
          loadTrail(user.id, active),
          loadFeed(active),
        ])
      } catch (error) {
        console.error(error)

        if (active) {
          setTrailError(
            'Não foi possível carregar sua trilha agora.',
          )

          setFeedError(
            'Não foi possível carregar as descobertas agora.',
          )

          setLoadingTrail(false)
          setLoadingFeed(false)
        }
      }
    }

    void loadPage()

    return () => {
      active = false
    }
  }, [navigate])

  async function loadTrail(
    userId: string,
    active: boolean,
  ) {
    setLoadingTrail(true)
    setTrailError('')

    try {
      const {
        data: profileInterests,
        error: profileInterestsError,
      } = await supabase
        .from('profile_interests')
        .select('interest_id')
        .eq('profile_id', userId)
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
        setTrailError(
          'Não foi possível carregar sua trilha agora.',
        )
      }
    } finally {
      if (active) {
        setLoadingTrail(false)
      }
    }
  }

  async function loadFeed(active: boolean) {
    setLoadingFeed(true)
    setFeedError('')

    try {
      const {
        data: discoveryRows,
        error: discoveriesError,
      } = await supabase
        .from('discoveries')
        .select(`
          id,
          author_id,
          title,
          body,
          visibility,
          status,
          public_city,
          public_state,
          public_country,
          created_at,
          published_at
        `)
        .eq('visibility', 'public')
        .eq('status', 'published')
        .order('published_at', {
          ascending: false,
          nullsFirst: false,
        })

      if (discoveriesError) {
        throw discoveriesError
      }

      const rows = (discoveryRows ?? []) as DiscoveryRow[]

      if (rows.length === 0) {
        if (active) {
          setDiscoveries([])
        }

        return
      }

      const authorIds = Array.from(
        new Set(
          rows.map((item) => item.author_id),
        ),
      )

      const discoveryIds = rows.map(
        (item) => item.id,
      )

      const [
        profilesResult,
        discoveryInterestsResult,
        mediaResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            id,
            display_name,
            username,
            avatar_path
          `)
          .in('id', authorIds),

        supabase
          .from('discovery_interests')
          .select(`
            discovery_id,
            interest_id
          `)
          .in('discovery_id', discoveryIds),

        supabase
          .from('discovery_media')
          .select(`
            id,
            discovery_id,
            media_type,
            storage_path,
            thumbnail_path,
            position
          `)
          .in('discovery_id', discoveryIds)
          .eq('media_type', 'image')
          .order('position', {
            ascending: true,
          }),
      ])

      if (profilesResult.error) {
        throw profilesResult.error
      }

      if (discoveryInterestsResult.error) {
        throw discoveryInterestsResult.error
      }

      if (mediaResult.error) {
        throw mediaResult.error
      }

      const authors =
        (profilesResult.data ?? []) as FeedAuthor[]

      const discoveryInterestRows =
        (discoveryInterestsResult.data ??
          []) as DiscoveryInterestRow[]

      const mediaRows =
        (mediaResult.data ??
          []) as DiscoveryMedia[]

      const feedInterestIds = Array.from(
        new Set(
          discoveryInterestRows.map(
            (item) => item.interest_id,
          ),
        ),
      )

      let feedInterests: Interest[] = []

      if (feedInterestIds.length > 0) {
        const {
          data: interestRows,
          error: interestsError,
        } = await supabase
          .from('interests')
          .select('id, name, slug')
          .in('id', feedInterestIds)

        if (interestsError) {
          throw interestsError
        }

        feedInterests =
          (interestRows ?? []) as Interest[]
      }

      const authorById = new Map(
        authors.map((author) => [
          author.id,
          author,
        ]),
      )

      const interestById = new Map(
        feedInterests.map((interest) => [
          interest.id,
          interest,
        ]),
      )

      const discoveryInterestsByDiscovery =
        new Map<string, Interest[]>()

      for (const item of discoveryInterestRows) {
        const interest =
          interestById.get(item.interest_id)

        if (!interest) {
          continue
        }

        const current =
          discoveryInterestsByDiscovery.get(
            item.discovery_id,
          ) ?? []

        current.push(interest)

        discoveryInterestsByDiscovery.set(
          item.discovery_id,
          current,
        )
      }

      const mediaByDiscovery =
        new Map<string, DiscoveryMedia>()

      for (const media of mediaRows) {
        if (
          !mediaByDiscovery.has(
            media.discovery_id,
          )
        ) {
          mediaByDiscovery.set(
            media.discovery_id,
            media,
          )
        }
      }

      const mediaUrlByDiscovery =
        new Map<string, string>()

      await Promise.all(
        Array.from(mediaByDiscovery.entries()).map(
          async ([discoveryId, media]) => {
            const {
              data,
              error,
            } = await supabase.storage
              .from('discovery-media')
              .createSignedUrl(
                media.storage_path,
                60 * 60,
              )

            if (error) {
              console.error(
                `Não foi possível gerar URL da mídia da descoberta ${discoveryId}.`,
                error,
              )

              return
            }

            if (data?.signedUrl) {
              mediaUrlByDiscovery.set(
                discoveryId,
                data.signedUrl,
              )
            }
          },
        ),
      )

      const feed: Discovery[] = rows.map(
        (row) => ({
          ...row,
          author:
            authorById.get(
              row.author_id,
            ) ?? null,
          interests:
            discoveryInterestsByDiscovery.get(
              row.id,
            ) ?? [],
          media:
            mediaByDiscovery.get(
              row.id,
            ) ?? null,
          mediaUrl:
            mediaUrlByDiscovery.get(
              row.id,
            ) ?? null,
        }),
      )

      if (active) {
        setDiscoveries(feed)
      }
    } catch (error) {
      console.error(error)

      if (active) {
        setFeedError(
          'Não foi possível carregar as descobertas agora.',
        )
      }
    } finally {
      if (active) {
        setLoadingFeed(false)
      }
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  function formatDate(
    dateValue: string | null,
  ) {
    if (!dateValue) {
      return ''
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateValue))
  }

  function getLocation(
    discovery: Discovery,
  ) {
    return [
      discovery.public_city,
      discovery.public_state,
      discovery.public_country,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  function getAuthorName(
    author: FeedAuthor | null,
  ) {
    if (!author) {
      return 'Explorador Florbonacci'
    }

    return (
      author.display_name ||
      author.username ||
      'Explorador Florbonacci'
    )
  }

  function getAuthorInitial(
    author: FeedAuthor | null,
  ) {
    const name =
      getAuthorName(author)

    return (
      name
        .trim()
        .charAt(0)
        .toUpperCase() || 'F'
    )
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
          background:
            'rgba(247, 245, 238, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom:
            '1px solid rgba(49, 93, 59, 0.08)',
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
            onClick={() =>
              navigate('/discover')
            }
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
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() =>
                navigate('/discover/new')
              }
              style={{
                borderRadius: 999,
                padding: '10px 16px',
                background: '#315d3b',
                color: '#ffffff',
                fontWeight: 750,
                cursor: 'pointer',
              }}
            >
              + Nova descoberta
            </button>

            <button
              type="button"
              onClick={() =>
                navigate('/interests')
              }
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
              fontSize:
                'clamp(2.7rem, 7vw, 5.5rem)',
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
            Sua trilha nasce daquilo que
            desperta sua curiosidade. Cada
            descoberta pode revelar novas
            pessoas, lugares, ideias e
            caminhos.
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
              justifyContent:
                'space-between',
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
                  letterSpacing:
                    '0.07em',
                  textTransform:
                    'uppercase',
                }}
              >
                Sua trilha
              </span>

              <h2
                style={{
                  margin: 0,
                  fontSize: 26,
                  letterSpacing:
                    '-0.03em',
                }}
              >
                O que chama sua atenção
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate('/interests')
              }
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

          {loadingTrail && (
            <div
              style={{
                padding: 22,
                borderRadius: 24,
                background:
                  'rgba(255, 255, 255, 0.78)',
                border:
                  '1px solid rgba(49, 93, 59, 0.08)',
                color: '#667068',
              }}
            >
              Organizando sua trilha...
            </div>
          )}

          {trailError && (
            <div
              style={{
                padding: 22,
                borderRadius: 24,
                background: '#fff0ed',
                color: '#8b2f23',
              }}
            >
              {trailError}
            </div>
          )}

          {!loadingTrail &&
            !trailError &&
            interests.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                {interests.map(
                  (interest) => (
                    <div
                      key={interest.id}
                      style={{
                        padding:
                          '11px 16px',
                        borderRadius:
                          999,
                        background:
                          '#ffffff',
                        border:
                          '1px solid rgba(49, 93, 59, 0.13)',
                        boxShadow:
                          '0 6px 20px rgba(49, 93, 59, 0.05)',
                        color:
                          '#315d3b',
                        fontWeight:
                          700,
                      }}
                    >
                      {interest.name}
                    </div>
                  ),
                )}
              </div>
            )}

          {!loadingTrail &&
            !trailError &&
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
                  Sua trilha ainda está
                  vazia.
                </strong>

                <span
                  style={{
                    color: '#667068',
                  }}
                >
                  Escolha alguns interesses
                  para começar a personalizar
                  suas descobertas.
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
              justifyContent:
                'space-between',
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
                  letterSpacing:
                    '0.07em',
                  textTransform:
                    'uppercase',
                }}
              >
                Para você
              </span>

              <h2
                style={{
                  margin: 0,
                  fontSize: 30,
                  letterSpacing:
                    '-0.035em',
                }}
              >
                Descobertas
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate('/discover/new')
              }
              style={{
                padding: 0,
                background: 'transparent',
                color: '#315d3b',
                fontWeight: 750,
                cursor: 'pointer',
              }}
            >
              Compartilhar uma descoberta →
            </button>
          </div>

          {loadingFeed && (
            <div
              style={{
                padding: 26,
                borderRadius: 28,
                background: '#ffffff',
                border:
                  '1px solid rgba(49, 93, 59, 0.08)',
                color: '#667068',
              }}
            >
              Procurando descobertas...
            </div>
          )}

          {feedError && (
            <div
              style={{
                padding: 24,
                borderRadius: 24,
                background: '#fff0ed',
                color: '#8b2f23',
              }}
            >
              {feedError}
            </div>
          )}

          {!loadingFeed &&
            !feedError &&
            discoveries.length === 0 && (
              <div
                style={{
                  padding:
                    'clamp(28px, 6vw, 48px)',
                  borderRadius: 30,
                  background: '#ffffff',
                  border:
                    '1px solid rgba(49, 93, 59, 0.08)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    margin:
                      '0 auto 18px',
                    borderRadius: 24,
                    background: '#e5eee6',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 30,
                  }}
                >
                  ✦
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: 28,
                    letterSpacing:
                      '-0.03em',
                  }}
                >
                  Ainda não há descobertas
                  por aqui.
                </h3>

                <p
                  style={{
                    margin:
                      '12px auto 22px',
                    maxWidth: 480,
                    color: '#667068',
                    lineHeight: 1.6,
                  }}
                >
                  Seja a primeira pessoa a
                  compartilhar algo que fez
                  você parar e prestar
                  atenção.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/discover/new',
                    )
                  }
                  style={{
                    borderRadius: 999,
                    padding:
                      '13px 20px',
                    background:
                      '#315d3b',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Criar descoberta
                </button>
              </div>
            )}

          {!loadingFeed &&
            !feedError &&
            discoveries.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gap: 24,
                }}
              >
                {discoveries.map(
                  (discovery) => {
                    const authorName =
                      getAuthorName(
                        discovery.author,
                      )

                    const location =
                      getLocation(
                        discovery,
                      )

                    return (
                      <article
                        key={
                          discovery.id
                        }
                        style={{
                          overflow:
                            'hidden',
                          borderRadius:
                            30,
                          background:
                            '#ffffff',
                          border:
                            '1px solid rgba(49, 93, 59, 0.09)',
                          boxShadow:
                            '0 18px 48px rgba(49, 93, 59, 0.07)',
                        }}
                      >
                        {discovery.mediaUrl && (
                          <div
                            style={{
                              width:
                                '100%',
                              aspectRatio:
                                '16 / 9',
                              overflow:
                                'hidden',
                              background:
                                '#e5ece6',
                            }}
                          >
                            <img
                              src={
                                discovery.mediaUrl
                              }
                              alt={
                                discovery.title
                                  ? `Fotografia da descoberta ${discovery.title}`
                                  : 'Fotografia da descoberta'
                              }
                              loading="lazy"
                              style={{
                                width:
                                  '100%',
                                height:
                                  '100%',
                                objectFit:
                                  'cover',
                              }}
                            />
                          </div>
                        )}

                        <div
                          style={{
                            padding:
                              'clamp(22px, 5vw, 34px)',
                          }}
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'space-between',
                              gap: 16,
                              flexWrap:
                                'wrap',
                            }}
                          >
                            <div
                              style={{
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap: 12,
                              }}
                            >
                              <div
                                style={{
                                  width: 46,
                                  height: 46,
                                  borderRadius:
                                    '50%',
                                  background:
                                    '#e4efe6',
                                  color:
                                    '#315d3b',
                                  display:
                                    'grid',
                                  placeItems:
                                    'center',
                                  fontWeight:
                                    800,
                                  fontSize:
                                    18,
                                }}
                              >
                                {getAuthorInitial(
                                  discovery.author,
                                )}
                              </div>

                              <div>
                                <strong
                                  style={{
                                    display:
                                      'block',
                                    fontSize:
                                      16,
                                  }}
                                >
                                  {
                                    authorName
                                  }
                                </strong>

                                <span
                                  style={{
                                    display:
                                      'block',
                                    marginTop:
                                      2,
                                    color:
                                      '#7a847c',
                                    fontSize:
                                      13,
                                  }}
                                >
                                  {formatDate(
                                    discovery.published_at ??
                                      discovery.created_at,
                                  )}
                                </span>
                              </div>
                            </div>

                            {location && (
                              <span
                                style={{
                                  color:
                                    '#748078',
                                  fontSize:
                                    13,
                                }}
                              >
                                {location}
                              </span>
                            )}
                          </div>

                          {discovery.title && (
                            <h3
                              style={{
                                margin:
                                  '24px 0 0',
                                fontSize:
                                  'clamp(1.8rem, 4vw, 2.7rem)',
                                lineHeight:
                                  1.05,
                                letterSpacing:
                                  '-0.04em',
                              }}
                            >
                              {
                                discovery.title
                              }
                            </h3>
                          )}

                          <p
                            style={{
                              margin:
                                discovery.title
                                  ? '14px 0 0'
                                  : '24px 0 0',
                              maxWidth:
                                760,
                              color:
                                '#4f5a52',
                              fontSize:
                                17,
                              lineHeight:
                                1.7,
                              whiteSpace:
                                'pre-wrap',
                            }}
                          >
                            {discovery.body}
                          </p>

                          {discovery
                            .interests
                            .length > 0 && (
                            <div
                              style={{
                                display:
                                  'flex',
                                flexWrap:
                                  'wrap',
                                gap: 8,
                                marginTop:
                                  24,
                              }}
                            >
                              {discovery.interests.map(
                                (
                                  interest,
                                ) => (
                                  <span
                                    key={
                                      interest.id
                                    }
                                    style={{
                                      padding:
                                        '8px 12px',
                                      borderRadius:
                                        999,
                                      background:
                                        '#f1f5f1',
                                      color:
                                        '#4c6854',
                                      fontSize:
                                        13,
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    {
                                      interest.name
                                    }
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  },
                )}
              </div>
            )}
        </section>

        <footer
          style={{
            marginTop: 54,
            paddingTop: 22,
            borderTop:
              '1px solid rgba(49, 93, 59, 0.10)',
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