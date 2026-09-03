import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

import MainNavigation from '../components/MainNavigation'

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

type Interest = {
  id: string
  name: string
}

type ProfileDiscoveryRow = {
  id: string
  author_id: string
  title: string | null
  body: string
  created_at: string
  published_at: string | null
}

type DiscoveryMedia = {
  id: string
  discovery_id: string
  storage_path: string
  position: number
}

type DiscoveryInterestRelation = {
  discovery_id: string
  interest_id: string
}

type ProfileDiscovery = ProfileDiscoveryRow & {
  imageUrl: string | null
  interests: Interest[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function PublicProfile() {
  const navigate = useNavigate()

  const { profileId } = useParams<{
    profileId: string
  }>()

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [
    profileDiscoveries,
    setProfileDiscoveries,
  ] = useState<ProfileDiscovery[]>([])

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<string | null>(null)

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null)

  const [
    followersCount,
    setFollowersCount,
  ] = useState(0)

  const [
    followingCount,
    setFollowingCount,
  ] = useState(0)

  const [
    discoveriesCount,
    setDiscoveriesCount,
  ] = useState(0)

  const [
    isFollowing,
    setIsFollowing,
  ] = useState(false)

  const [loading, setLoading] =
    useState(true)

  const [
    followLoading,
    setFollowLoading,
  ] = useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const isOwnProfile = useMemo(
    () =>
      Boolean(
        currentUserId &&
          profileId &&
          currentUserId === profileId,
      ),
    [currentUserId, profileId],
  )

  const displayName = useMemo(() => {
    if (!profile) {
      return ''
    }

    return (
      profile.display_name ||
      profile.username ||
      'Explorador'
    )
  }, [profile])

  const locationLabel = useMemo(() => {
    if (!profile) {
      return ''
    }

    return [
      profile.city,
      profile.state,
      profile.country,
    ]
      .filter(Boolean)
      .join(' · ')
  }, [profile])

  const loadProfile = useCallback(
    async () => {
      if (!profileId) {
        setError(
          'Perfil não encontrado.',
        )
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setProfileDiscoveries([])

      try {
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!user) {
          navigate('/login', {
            replace: true,
          })
          return
        }

        setCurrentUserId(user.id)

        const {
          data: profileData,
          error: profileError,
        } = await supabase
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
          .eq('id', profileId)
          .maybeSingle()

        if (profileError) {
          throw profileError
        }

        if (!profileData) {
          setProfile(null)
          setError(
            'Este perfil não está disponível.',
          )
          return
        }

        const typedProfile =
          profileData as Profile

        setProfile(typedProfile)

        if (
          typedProfile.avatar_path
        ) {
          const {
            data: signedAvatar,
            error: avatarError,
          } = await supabase.storage
            .from('avatars')
            .createSignedUrl(
              typedProfile.avatar_path,
              60 * 60,
            )

          if (!avatarError) {
            setAvatarUrl(
              signedAvatar?.signedUrl ??
                null,
            )
          } else {
            setAvatarUrl(null)
          }
        } else {
          setAvatarUrl(null)
        }

        const [
          followersResult,
          followingResult,
          discoveriesResult,
        ] = await Promise.all([
          supabase
            .from('follows')
            .select('*', {
              count: 'exact',
              head: true,
            })
            .eq(
              'following_id',
              profileId,
            ),

          supabase
            .from('follows')
            .select('*', {
              count: 'exact',
              head: true,
            })
            .eq(
              'follower_id',
              profileId,
            ),

          supabase
            .from('discoveries')
            .select('*', {
              count: 'exact',
              head: true,
            })
            .eq(
              'author_id',
              profileId,
            )
            .eq(
              'status',
              'published',
            )
            .eq(
              'visibility',
              'public',
            ),
        ])

        if (
          followersResult.error
        ) {
          throw followersResult.error
        }

        if (
          followingResult.error
        ) {
          throw followingResult.error
        }

        if (
          discoveriesResult.error
        ) {
          throw discoveriesResult.error
        }

        setFollowersCount(
          followersResult.count ?? 0,
        )

        setFollowingCount(
          followingResult.count ?? 0,
        )

        setDiscoveriesCount(
          discoveriesResult.count ?? 0,
        )

        const {
          data: discoveryRows,
          error:
            profileDiscoveriesError,
        } = await supabase
          .from('discoveries')
          .select(
            `
              id,
              author_id,
              title,
              body,
              created_at,
              published_at
            `,
          )
          .eq(
            'author_id',
            profileId,
          )
          .eq(
            'status',
            'published',
          )
          .eq(
            'visibility',
            'public',
          )
          .order('published_at', {
            ascending: false,
            nullsFirst: false,
          })
          .order('created_at', {
            ascending: false,
          })

        if (
          profileDiscoveriesError
        ) {
          throw profileDiscoveriesError
        }

        const discoveryRowsTyped =
          (discoveryRows ??
            []) as ProfileDiscoveryRow[]

        if (
          discoveryRowsTyped.length >
          0
        ) {
          const discoveryIds =
            discoveryRowsTyped.map(
              (discovery) =>
                discovery.id,
            )

          const [
            mediaResult,
            discoveryInterestsResult,
          ] = await Promise.all([
            supabase
              .from(
                'discovery_media',
              )
              .select(
                `
                  id,
                  discovery_id,
                  storage_path,
                  position
                `,
              )
              .in(
                'discovery_id',
                discoveryIds,
              )
              .order('position', {
                ascending: true,
              }),

            supabase
              .from(
                'discovery_interests',
              )
              .select(
                `
                  discovery_id,
                  interest_id
                `,
              )
              .in(
                'discovery_id',
                discoveryIds,
              ),
          ])

          if (mediaResult.error) {
            throw mediaResult.error
          }

          if (
            discoveryInterestsResult.error
          ) {
            throw discoveryInterestsResult.error
          }

          const media =
            (mediaResult.data ??
              []) as DiscoveryMedia[]

          const discoveryInterests =
            (discoveryInterestsResult.data ??
              []) as DiscoveryInterestRelation[]

          const interestIds = [
            ...new Set(
              discoveryInterests.map(
                (relation) =>
                  relation.interest_id,
              ),
            ),
          ]

          let interests: Interest[] =
            []

          if (
            interestIds.length > 0
          ) {
            const {
              data: interestsData,
              error:
                interestsError,
            } = await supabase
              .from('interests')
              .select('id, name')
              .in(
                'id',
                interestIds,
              )

            if (interestsError) {
              throw interestsError
            }

            interests =
              (interestsData ??
                []) as Interest[]
          }

          const interestMap =
            new Map(
              interests.map(
                (interest) => [
                  interest.id,
                  interest,
                ],
              ),
            )

          const interestsByDiscovery =
            new Map<
              string,
              Interest[]
            >()

          for (
            const relation of
            discoveryInterests
          ) {
            const interest =
              interestMap.get(
                relation.interest_id,
              )

            if (!interest) {
              continue
            }

            const current =
              interestsByDiscovery.get(
                relation.discovery_id,
              ) ?? []

            current.push(interest)

            interestsByDiscovery.set(
              relation.discovery_id,
              current,
            )
          }

          const firstMediaByDiscovery =
            new Map<
              string,
              DiscoveryMedia
            >()

          for (
            const mediaItem of media
          ) {
            if (
              !firstMediaByDiscovery.has(
                mediaItem.discovery_id,
              )
            ) {
              firstMediaByDiscovery.set(
                mediaItem.discovery_id,
                mediaItem,
              )
            }
          }

          const signedUrlByDiscovery =
            new Map<
              string,
              string | null
            >()

          await Promise.all(
            Array.from(
              firstMediaByDiscovery.entries(),
            ).map(
              async ([
                discoveryId,
                mediaItem,
              ]) => {
                const {
                  data,
                  error:
                    signedUrlError,
                } =
                  await supabase.storage
                    .from(
                      'discovery-media',
                    )
                    .createSignedUrl(
                      mediaItem.storage_path,
                      60 * 60,
                    )

                if (
                  signedUrlError
                ) {
                  console.error(
                    'Erro ao gerar URL da descoberta:',
                    signedUrlError,
                  )

                  signedUrlByDiscovery.set(
                    discoveryId,
                    null,
                  )

                  return
                }

                signedUrlByDiscovery.set(
                  discoveryId,
                  data.signedUrl,
                )
              },
            ),
          )

          const formatted =
            discoveryRowsTyped.map(
              (discovery) => ({
                ...discovery,
                imageUrl:
                  signedUrlByDiscovery.get(
                    discovery.id,
                  ) ?? null,
                interests: (
                  interestsByDiscovery.get(
                    discovery.id,
                  ) ?? []
                ).sort((a, b) =>
                  a.name.localeCompare(
                    b.name,
                    'pt-BR',
                  ),
                ),
              }),
            )

          setProfileDiscoveries(
            formatted,
          )
        } else {
          setProfileDiscoveries([])
        }

        if (
          user.id !== profileId
        ) {
          const {
            data: followData,
            error: followError,
          } = await supabase
            .from('follows')
            .select(
              'follower_id, following_id',
            )
            .eq(
              'follower_id',
              user.id,
            )
            .eq(
              'following_id',
              profileId,
            )
            .maybeSingle()

          if (followError) {
            throw followError
          }

          setIsFollowing(
            Boolean(followData),
          )
        } else {
          setIsFollowing(false)
        }
      } catch (err) {
        console.error(
          'Erro ao carregar perfil:',
          err,
        )

        setError(
          'Não foi possível carregar este perfil.',
        )
      } finally {
        setLoading(false)
      }
    },
    [navigate, profileId],
  )

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  async function handleFollowToggle() {
    if (
      !profileId ||
      !currentUserId ||
      isOwnProfile ||
      followLoading
    ) {
      return
    }

    setFollowLoading(true)
    setError(null)

    const previousFollowing =
      isFollowing

    const previousFollowersCount =
      followersCount

    setIsFollowing(
      !previousFollowing,
    )

    setFollowersCount(
      (current) =>
        previousFollowing
          ? Math.max(
              0,
              current - 1,
            )
          : current + 1,
    )

    try {
      if (previousFollowing) {
        const {
          error: deleteError,
        } = await supabase
          .from('follows')
          .delete()
          .eq(
            'follower_id',
            currentUserId,
          )
          .eq(
            'following_id',
            profileId,
          )

        if (deleteError) {
          throw deleteError
        }
      } else {
        const {
          error: insertError,
        } = await supabase
          .from('follows')
          .insert({
            follower_id:
              currentUserId,
            following_id:
              profileId,
          })

        if (insertError) {
          throw insertError
        }
      }
    } catch (err) {
      console.error(
        'Erro ao alterar relação de seguir:',
        err,
      )

      setIsFollowing(
        previousFollowing,
      )

      setFollowersCount(
        previousFollowersCount,
      )

      setError(
        'Não foi possível atualizar esta conexão.',
      )
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.shell}>
          <p
            style={
              styles.statusText
            }
          >
            Carregando perfil...
          </p>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main style={styles.page}>
        <div style={styles.shell}>
          <button
            type="button"
            onClick={() =>
              navigate('/discover')
            }
            style={
              styles.backButton
            }
          >
            ← Voltar
          </button>

          <div
            style={
              styles.emptyCard
            }
          >
            <div
              style={
                styles.emptyIcon
              }
            >
              🌿
            </div>

            <h1
              style={
                styles.emptyTitle
              }
            >
              Perfil indisponível
            </h1>

            <p
              style={
                styles.statusText
              }
            >
              {error ||
                'Não encontramos este perfil.'}
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <button
          type="button"
          onClick={() =>
            navigate('/discover')
          }
          style={styles.backButton}
        >
          ← Descobrir
        </button>

        <section
          style={styles.profileCard}
        >
          <div
            style={styles.profileTop}
          >
            <div
              style={styles.avatar}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto de ${displayName}`}
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
                  {displayName
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div
              style={styles.identity}
            >
              <h1
                style={
                  styles.displayName
                }
              >
                {displayName}
              </h1>

              {profile.username && (
                <div
                  style={
                    styles.username
                  }
                >
                  @{profile.username}
                </div>
              )}

              {locationLabel && (
                <div
                  style={
                    styles.location
                  }
                >
                  📍 {locationLabel}
                </div>
              )}
            </div>
          </div>

          {profile.bio && (
            <p style={styles.bio}>
              {profile.bio}
            </p>
          )}

          <div style={styles.stats}>
            <div style={styles.stat}>
              <strong
                style={
                  styles.statNumber
                }
              >
                {discoveriesCount}
              </strong>

              <span
                style={
                  styles.statLabel
                }
              >
                {discoveriesCount === 1
                  ? 'descoberta'
                  : 'descobertas'}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/profile/${profileId}/connections?type=followers`,
                )
              }
              style={{
                ...styles.stat,
                ...styles.statButton,
              }}
              aria-label="Ver seguidores"
            >
              <strong
                style={
                  styles.statNumber
                }
              >
                {followersCount}
              </strong>

              <span
                style={
                  styles.statLabel
                }
              >
                {followersCount === 1
                  ? 'seguidor'
                  : 'seguidores'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/profile/${profileId}/connections?type=following`,
                )
              }
              style={{
                ...styles.stat,
                ...styles.statButton,
              }}
              aria-label="Ver pessoas seguidas"
            >
              <strong
                style={
                  styles.statNumber
                }
              >
                {followingCount}
              </strong>

              <span
                style={
                  styles.statLabel
                }
              >
                seguindo
              </span>
            </button>
          </div>

          <div
            style={
              styles.actionArea
            }
          >
            {isOwnProfile ? (
              <div
                style={
                  styles.ownProfileBadge
                }
              >
                Este é você
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void handleFollowToggle()
                }
                disabled={
                  followLoading
                }
                style={{
                  ...styles.followButton,
                  ...(isFollowing
                    ? styles.followingButton
                    : {}),
                  opacity:
                    followLoading
                      ? 0.65
                      : 1,
                }}
              >
                {followLoading
                  ? 'Aguarde...'
                  : isFollowing
                    ? '✓ Seguindo'
                    : '＋ Seguir'}
              </button>
            )}
          </div>

          {error && (
            <p
              style={
                styles.errorText
              }
            >
              {error}
            </p>
          )}
        </section>

        <section
          style={
            styles.discoverySection
          }
        >
          <div
            style={
              styles.discoverySectionHeader
            }
          >
            <div>
              <div
                style={
                  styles.sectionEyebrow
                }
              >
                DESCOBERTAS
              </div>

              <h2
                style={
                  styles.sectionTitle
                }
              >
                O que desperta a
                curiosidade de{' '}
                {displayName}
              </h2>
            </div>
          </div>

          {profileDiscoveries.length ===
          0 ? (
            <div
              style={
                styles.comingCard
              }
            >
              <span
                style={
                  styles.comingIcon
                }
              >
                ✦
              </span>

              <p
                style={
                  styles.comingText
                }
              >
                Ainda não há
                descobertas públicas
                por aqui.
              </p>
            </div>
          ) : (
            <div
              style={
                styles.discoveryGrid
              }
            >
              {profileDiscoveries.map(
                (discovery) => (
                  <article
                    key={
                      discovery.id
                    }
                    style={
                      styles.discoveryCard
                    }
                  >
                    {discovery.imageUrl ? (
                      <div
                        style={
                          styles.discoveryImageWrapper
                        }
                      >
                        <img
                          src={
                            discovery.imageUrl
                          }
                          alt={
                            discovery.title
                              ? `Fotografia da descoberta ${discovery.title}`
                              : 'Fotografia da descoberta'
                          }
                          style={
                            styles.discoveryImage
                          }
                        />
                      </div>
                    ) : (
                      <div
                        style={
                          styles.discoveryPlaceholder
                        }
                      >
                        <span
                          style={
                            styles.discoveryPlaceholderIcon
                          }
                        >
                          🌿
                        </span>
                      </div>
                    )}

                    <div
                      style={
                        styles.discoveryContent
                      }
                    >
                      <div
                        style={
                          styles.discoveryDate
                        }
                      >
                        {formatDate(
                          discovery.published_at ??
                            discovery.created_at,
                        )}
                      </div>

                      {discovery.title && (
                        <h3
                          style={
                            styles.discoveryTitle
                          }
                        >
                          {
                            discovery.title
                          }
                        </h3>
                      )}

                      <p
                        style={
                          styles.discoveryBody
                        }
                      >
                        {
                          discovery.body
                        }
                      </p>

                      {discovery
                        .interests
                        .length > 0 && (
                        <div
                          style={
                            styles.interestList
                          }
                        >
                          {discovery.interests.map(
                            (
                              interest,
                            ) => (
                              <span
                                key={
                                  interest.id
                                }
                                style={
                                  styles.interestChip
                                }
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
                ),
              )}
            </div>
          )}
        </section>
      </div>

      <MainNavigation
        currentUserId={currentUserId}
      />
    </main>
  )
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: '100vh',
    background:
      'linear-gradient(180deg, #f8f7f1 0%, #f2f1e9 100%)',
    color: '#213128',
    padding: '24px 16px 56px',
  },

  shell: {
    width: '100%',
    maxWidth: 760,
    margin: '0 auto',
  },

  backButton: {
    appearance: 'none',
    border: 0,
    background: 'transparent',
    padding: '8px 0',
    marginBottom: 16,
    color: '#42634e',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },

  profileCard: {
    background: '#fffef9',
    border:
      '1px solid rgba(45, 76, 56, 0.10)',
    borderRadius: 26,
    padding: 24,
    boxShadow:
      '0 16px 42px rgba(39, 63, 47, 0.08)',
  },

  profileTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    background: '#e8eee5',
    border:
      '3px solid rgba(70, 112, 80, 0.12)',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#476952',
    fontSize: 34,
    fontWeight: 800,
  },

  identity: {
    minWidth: 0,
    flex: 1,
  },

  displayName: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },

  username: {
    marginTop: 5,
    color: '#718078',
    fontSize: 15,
  },

  location: {
    marginTop: 10,
    color: '#617168',
    fontSize: 14,
  },

  bio: {
    margin: '22px 0 0',
    color: '#3f4c45',
    fontSize: 16,
    lineHeight: 1.65,
  },

  stats: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
    gap: 10,
    marginTop: 24,
    padding: '18px 0',
    borderTop:
      '1px solid rgba(35, 58, 43, 0.08)',
    borderBottom:
      '1px solid rgba(35, 58, 43, 0.08)',
  },

  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    textAlign: 'center',
  },

  statButton: {
    appearance: 'none',
    border: 0,
    background: 'transparent',
    margin: 0,
    padding: '6px 4px',
    fontFamily: 'inherit',
    color: 'inherit',
    cursor: 'pointer',
    borderRadius: 12,
  },

  statNumber: {
    fontSize: 21,
    lineHeight: 1,
    color: '#24452e',
  },

  statLabel: {
    color: '#758078',
    fontSize: 12,
  },

  actionArea: {
    marginTop: 20,
  },

  followButton: {
    width: '100%',
    border: 0,
    borderRadius: 16,
    padding: '13px 18px',
    background: '#315e3d',
    color: '#fff',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
  },

  followingButton: {
    background: '#e7eee7',
    color: '#315e3d',
    border:
      '1px solid rgba(49, 94, 61, 0.14)',
  },

  ownProfileBadge: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 16,
    padding: '13px 18px',
    background: '#edf1e9',
    color: '#55705d',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
  },

  errorText: {
    margin: '14px 0 0',
    color: '#a44848',
    fontSize: 14,
    textAlign: 'center',
  },

  discoverySection: {
    marginTop: 30,
  },

  discoverySectionHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent:
      'space-between',
    gap: 16,
    marginBottom: 14,
  },

  sectionEyebrow: {
    color: '#66806e',
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: '0.14em',
  },

  sectionTitle: {
    margin: '5px 0 0',
    fontSize: 22,
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
  },

  discoveryGrid: {
    display: 'grid',
    gap: 18,
  },

  discoveryCard: {
    overflow: 'hidden',
    background: '#fffef9',
    border:
      '1px solid rgba(45, 76, 56, 0.10)',
    borderRadius: 22,
    boxShadow:
      '0 12px 34px rgba(39, 63, 47, 0.06)',
  },

  discoveryImageWrapper: {
    width: '100%',
    aspectRatio: '16 / 9',
    background: '#e8ebe5',
    overflow: 'hidden',
  },

  discoveryImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  discoveryPlaceholder: {
    width: '100%',
    aspectRatio: '16 / 7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, #edf2e9 0%, #e4ece3 100%)',
  },

  discoveryPlaceholderIcon: {
    fontSize: 34,
    opacity: 0.75,
  },

  discoveryContent: {
    padding: '18px 20px 20px',
  },

  discoveryDate: {
    marginBottom: 7,
    color: '#8b958e',
    fontSize: 12,
  },

  discoveryTitle: {
    margin: '0 0 9px',
    color: '#294334',
    fontSize: 20,
    lineHeight: 1.25,
  },

  discoveryBody: {
    margin: 0,
    color: '#526058',
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },

  interestList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 15,
  },

  interestChip: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '6px 10px',
    background: '#eef4ef',
    color: '#42634f',
    fontSize: 12,
    fontWeight: 600,
  },

  comingCard: {
    minHeight: 150,
    background:
      'rgba(255, 254, 249, 0.72)',
    border:
      '1px dashed rgba(61, 91, 69, 0.22)',
    borderRadius: 22,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    textAlign: 'center',
  },

  comingIcon: {
    color: '#66806e',
    fontSize: 24,
  },

  comingText: {
    maxWidth: 380,
    margin: 0,
    color: '#758078',
    fontSize: 14,
    lineHeight: 1.55,
  },

  emptyCard: {
    background: '#fffef9',
    borderRadius: 24,
    padding: '56px 24px',
    textAlign: 'center',
  },

  emptyIcon: {
    fontSize: 38,
  },

  emptyTitle: {
    margin: '14px 0 8px',
    fontSize: 24,
  },

  statusText: {
    color: '#758078',
    textAlign: 'center',
    lineHeight: 1.5,
  },
}

export default PublicProfile