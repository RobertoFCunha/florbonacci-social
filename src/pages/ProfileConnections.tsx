import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type ConnectionType =
  | 'followers'
  | 'following'

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_path: string | null
  city: string | null
  state: string | null
  country: string | null
}

type FollowRow = {
  follower_id: string
  following_id: string
}

type ConnectionProfile =
  Profile & {
    avatarUrl: string | null
  }

function ProfileConnections() {
  const navigate = useNavigate()

  const { profileId } =
    useParams<{
      profileId: string
    }>()

  const [searchParams] =
    useSearchParams()

  const rawType =
    searchParams.get('type')

  const connectionType:
    ConnectionType =
    rawType === 'following'
      ? 'following'
      : 'followers'

  const [
    profile,
    setProfile,
  ] = useState<Profile | null>(
    null,
  )

  const [
    connections,
    setConnections,
  ] = useState<
    ConnectionProfile[]
  >([])

  const [loading, setLoading] =
    useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const displayName =
    useMemo(() => {
      if (!profile) {
        return ''
      }

      return (
        profile.display_name ||
        profile.username ||
        'Explorador'
      )
    }, [profile])

  const title =
    connectionType ===
    'followers'
      ? 'Seguidores'
      : 'Seguindo'

  const subtitle =
    connectionType ===
    'followers'
      ? `Pessoas que acompanham ${displayName}`
      : `Pessoas que ${displayName} acompanha`

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!profileId) {
        setErrorMessage(
          'Perfil não encontrado.',
        )
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      try {
        const {
          data: {
            user,
          },
          error:
            userError,
        } =
          await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!user) {
          navigate(
            '/login',
            {
              replace: true,
            },
          )
          return
        }

        const {
          data:
            profileData,
          error:
            profileError,
        } =
          await supabase
            .from('profiles')
            .select(
              `
                id,
                username,
                display_name,
                bio,
                avatar_path,
                city,
                state,
                country
              `,
            )
            .eq(
              'id',
              profileId,
            )
            .maybeSingle()

        if (profileError) {
          throw profileError
        }

        if (
          !profileData
        ) {
          throw new Error(
            'Perfil indisponível.',
          )
        }

        if (cancelled) {
          return
        }

        setProfile(
          profileData as Profile,
        )

        let followRows:
          FollowRow[] = []

        if (
          connectionType ===
          'followers'
        ) {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                'follows',
              )
              .select(
                `
                  follower_id,
                  following_id
                `,
              )
              .eq(
                'following_id',
                profileId,
              )
              .order(
                'created_at',
                {
                  ascending:
                    false,
                },
              )

          if (error) {
            throw error
          }

          followRows =
            (data ??
              []) as FollowRow[]
        } else {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                'follows',
              )
              .select(
                `
                  follower_id,
                  following_id
                `,
              )
              .eq(
                'follower_id',
                profileId,
              )
              .order(
                'created_at',
                {
                  ascending:
                    false,
                },
              )

          if (error) {
            throw error
          }

          followRows =
            (data ??
              []) as FollowRow[]
        }

        const profileIds =
          connectionType ===
          'followers'
            ? followRows.map(
                (
                  row,
                ) =>
                  row.follower_id,
              )
            : followRows.map(
                (
                  row,
                ) =>
                  row.following_id,
              )

        if (
          profileIds.length ===
          0
        ) {
          if (!cancelled) {
            setConnections(
              [],
            )
          }

          return
        }

        const {
          data:
            profilesData,
          error:
            profilesError,
        } =
          await supabase
            .from(
              'profiles',
            )
            .select(
              `
                id,
                username,
                display_name,
                bio,
                avatar_path,
                city,
                state,
                country
              `,
            )
            .in(
              'id',
              profileIds,
            )

        if (profilesError) {
          throw profilesError
        }

        const typedProfiles =
          (profilesData ??
            []) as Profile[]

        const profileMap =
          new Map(
            typedProfiles.map(
              (
                item,
              ) => [
                item.id,
                item,
              ],
            ),
          )

        const orderedProfiles =
          profileIds
            .map(
              (
                id,
              ) =>
                profileMap.get(
                  id,
                ),
            )
            .filter(
              (
                item,
              ): item is Profile =>
                Boolean(
                  item,
                ),
            )

        const formatted =
          await Promise.all(
            orderedProfiles.map(
              async (
                item,
              ): Promise<ConnectionProfile> => {
                if (
                  !item.avatar_path
                ) {
                  return {
                    ...item,
                    avatarUrl:
                      null,
                  }
                }

                const {
                  data:
                    signedAvatar,
                  error:
                    avatarError,
                } =
                  await supabase.storage
                    .from(
                      'avatars',
                    )
                    .createSignedUrl(
                      item.avatar_path,
                      60 * 60,
                    )

                return {
                  ...item,
                  avatarUrl:
                    avatarError
                      ? null
                      : signedAvatar
                          ?.signedUrl ??
                        null,
                }
              },
            ),
          )

        if (
          !cancelled
        ) {
          setConnections(
            formatted,
          )
        }
      } catch (
        error
      ) {
        console.error(
          'Erro ao carregar conexões:',
          error,
        )

        if (
          !cancelled
        ) {
          setErrorMessage(
            'Não foi possível carregar estas conexões.',
          )
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [
    connectionType,
    navigate,
    profileId,
  ])

  if (loading) {
    return (
      <main
        style={
          styles.page
        }
      >
        <div
          style={
            styles.shell
          }
        >
          <p
            style={
              styles.status
            }
          >
            Carregando
            conexões...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main
      style={
        styles.page
      }
    >
      <div
        style={
          styles.shell
        }
      >
        <button
          type="button"
          onClick={() =>
            navigate(
              `/profile/${profileId}`,
            )
          }
          style={
            styles.backButton
          }
        >
          ← Voltar ao perfil
        </button>

        <header
          style={
            styles.header
          }
        >
          <div
            style={
              styles.eyebrow
            }
          >
            CONEXÕES
          </div>

          <h1
            style={
              styles.title
            }
          >
            {title}
          </h1>

          {profile && (
            <p
              style={
                styles.subtitle
              }
            >
              {subtitle}
            </p>
          )}
        </header>

        {errorMessage ? (
          <div
            style={
              styles.messageCard
            }
          >
            {
              errorMessage
            }
          </div>
        ) : connections.length ===
          0 ? (
          <div
            style={
              styles.messageCard
            }
          >
            <div
              style={
                styles.emptyIcon
              }
            >
              🌿
            </div>

            <p
              style={
                styles.emptyText
              }
            >
              {connectionType ===
              'followers'
                ? 'Ainda não há seguidores por aqui.'
                : 'Ainda não há pessoas sendo seguidas por aqui.'}
            </p>
          </div>
        ) : (
          <section
            style={
              styles.list
            }
          >
            {connections.map(
              (
                connection,
              ) => {
                const name =
                  connection.display_name ||
                  connection.username ||
                  'Explorador'

                const location =
                  [
                    connection.city,
                    connection.state,
                    connection.country,
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      ' · ',
                    )

                return (
                  <button
                    key={
                      connection.id
                    }
                    type="button"
                    onClick={() =>
                      navigate(
                        `/profile/${connection.id}`,
                      )
                    }
                    style={
                      styles.connectionCard
                    }
                  >
                    <div
                      style={
                        styles.avatar
                      }
                    >
                      {connection.avatarUrl ? (
                        <img
                          src={
                            connection.avatarUrl
                          }
                          alt={`Foto de ${name}`}
                          style={
                            styles.avatarImage
                          }
                        />
                      ) : (
                        <span
                          style={
                            styles.avatarPlaceholder
                          }
                        >
                          {name
                            .slice(
                              0,
                              1,
                            )
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div
                      style={
                        styles.connectionInfo
                      }
                    >
                      <strong
                        style={
                          styles.connectionName
                        }
                      >
                        {
                          name
                        }
                      </strong>

                      {connection.username && (
                        <span
                          style={
                            styles.username
                          }
                        >
                          @
                          {
                            connection.username
                          }
                        </span>
                      )}

                      {location && (
                        <span
                          style={
                            styles.location
                          }
                        >
                          📍{' '}
                          {
                            location
                          }
                        </span>
                      )}

                      {connection.bio && (
                        <span
                          style={
                            styles.bio
                          }
                        >
                          {
                            connection.bio
                          }
                        </span>
                      )}
                    </div>

                    <span
                      style={
                        styles.arrow
                      }
                    >
                      →
                    </span>
                  </button>
                )
              },
            )}
          </section>
        )}
      </div>
    </main>
  )
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight:
      '100vh',
    background:
      'linear-gradient(180deg, #f8f7f1 0%, #f2f1e9 100%)',
    color:
      '#213128',
    padding:
      '24px 16px 56px',
  },

  shell: {
    width: '100%',
    maxWidth: 760,
    margin:
      '0 auto',
  },

  backButton: {
    appearance:
      'none',
    border: 0,
    background:
      'transparent',
    padding: '8px 0',
    marginBottom: 18,
    color:
      '#42634e',
    fontSize: 15,
    fontWeight: 700,
    cursor:
      'pointer',
  },

  header: {
    marginBottom: 22,
  },

  eyebrow: {
    color:
      '#66806e',
    fontSize: 11,
    fontWeight: 900,
    letterSpacing:
      '0.14em',
  },

  title: {
    margin:
      '6px 0 0',
    fontSize:
      'clamp(2rem, 7vw, 3rem)',
    lineHeight: 1,
    letterSpacing:
      '-0.035em',
  },

  subtitle: {
    margin:
      '12px 0 0',
    color:
      '#6e7b73',
    fontSize: 15,
    lineHeight: 1.5,
  },

  list: {
    display:
      'grid',
    gap: 12,
  },

  connectionCard: {
    width: '100%',
    appearance:
      'none',
    border:
      '1px solid rgba(45, 76, 56, 0.10)',
    background:
      '#fffef9',
    borderRadius: 20,
    padding:
      '15px 16px',
    display:
      'flex',
    alignItems:
      'center',
    gap: 14,
    textAlign:
      'left',
    color:
      'inherit',
    cursor:
      'pointer',
    boxShadow:
      '0 8px 24px rgba(39, 63, 47, 0.05)',
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius:
      '50%',
    overflow:
      'hidden',
    flexShrink: 0,
    background:
      '#e7eee6',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit:
      'cover',
    display:
      'block',
  },

  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display:
      'flex',
    alignItems:
      'center',
    justifyContent:
      'center',
    color:
      '#42634e',
    fontSize: 22,
    fontWeight: 800,
  },

  connectionInfo: {
    minWidth: 0,
    flex: 1,
    display:
      'flex',
    flexDirection:
      'column',
    gap: 3,
  },

  connectionName: {
    color:
      '#294334',
    fontSize: 16,
  },

  username: {
    color:
      '#7b877f',
    fontSize: 13,
  },

  location: {
    marginTop: 3,
    color:
      '#66746b',
    fontSize: 12,
  },

  bio: {
    marginTop: 4,
    color:
      '#667068',
    fontSize: 13,
    lineHeight: 1.4,
    overflow:
      'hidden',
    textOverflow:
      'ellipsis',
    whiteSpace:
      'nowrap',
  },

  arrow: {
    flexShrink: 0,
    color:
      '#78907e',
    fontSize: 20,
  },

  messageCard: {
    minHeight: 150,
    display:
      'flex',
    flexDirection:
      'column',
    alignItems:
      'center',
    justifyContent:
      'center',
    gap: 10,
    background:
      '#fffef9',
    border:
      '1px dashed rgba(61, 91, 69, 0.20)',
    borderRadius: 22,
    padding: 24,
    color:
      '#748078',
    textAlign:
      'center',
  },

  emptyIcon: {
    fontSize: 28,
  },

  emptyText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
  },

  status: {
    marginTop: 70,
    color:
      '#758078',
    textAlign:
      'center',
  },
}

export default ProfileConnections