import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

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

function PublicProfile() {
  const navigate = useNavigate()
  const { profileId } = useParams<{
    profileId: string
  }>()

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null)

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null)

  const [followersCount, setFollowersCount] =
    useState(0)

  const [followingCount, setFollowingCount] =
    useState(0)

  const [
    discoveriesCount,
    setDiscoveriesCount,
  ] = useState(0)

  const [isFollowing, setIsFollowing] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [followLoading, setFollowLoading] =
    useState(false)

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

  const loadProfile = useCallback(async () => {
    if (!profileId) {
      setError('Perfil não encontrado.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser()

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

      if (typedProfile.avatar_path) {
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
            signedAvatar?.signedUrl ?? null,
          )
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
          .eq('following_id', profileId),

        supabase
          .from('follows')
          .select('*', {
            count: 'exact',
            head: true,
          })
          .eq('follower_id', profileId),

        supabase
          .from('discoveries')
          .select('*', {
            count: 'exact',
            head: true,
          })
          .eq('author_id', profileId)
          .eq('status', 'published')
          .eq('visibility', 'public'),
      ])

      if (followersResult.error) {
        throw followersResult.error
      }

      if (followingResult.error) {
        throw followingResult.error
      }

      if (discoveriesResult.error) {
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

      if (user.id !== profileId) {
        const {
          data: followData,
          error: followError,
        } = await supabase
          .from('follows')
          .select(
            'follower_id, following_id',
          )
          .eq('follower_id', user.id)
          .eq('following_id', profileId)
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
  }, [navigate, profileId])

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

    setFollowersCount((current) =>
      previousFollowing
        ? Math.max(0, current - 1)
        : current + 1,
    )

    try {
      if (previousFollowing) {
        const { error: deleteError } =
          await supabase
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
        const { error: insertError } =
          await supabase
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
          <p style={styles.statusText}>
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
            style={styles.backButton}
          >
            ← Voltar
          </button>

          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              🌿
            </div>

            <h1 style={styles.emptyTitle}>
              Perfil indisponível
            </h1>

            <p style={styles.statusText}>
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

        <section style={styles.profileCard}>
          <div style={styles.profileTop}>
            <div style={styles.avatar}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto de ${displayName}`}
                  style={styles.avatarImage}
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
                style={styles.displayName}
              >
                {displayName}
              </h1>

              {profile.username && (
                <div
                  style={styles.username}
                >
                  @{profile.username}
                </div>
              )}

              {locationLabel && (
                <div
                  style={styles.location}
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
                style={styles.statNumber}
              >
                {discoveriesCount}
              </strong>

              <span
                style={styles.statLabel}
              >
                {discoveriesCount === 1
                  ? 'descoberta'
                  : 'descobertas'}
              </span>
            </div>

            <div style={styles.stat}>
              <strong
                style={styles.statNumber}
              >
                {followersCount}
              </strong>

              <span
                style={styles.statLabel}
              >
                {followersCount === 1
                  ? 'seguidor'
                  : 'seguidores'}
              </span>
            </div>

            <div style={styles.stat}>
              <strong
                style={styles.statNumber}
              >
                {followingCount}
              </strong>

              <span
                style={styles.statLabel}
              >
                seguindo
              </span>
            </div>
          </div>

          <div style={styles.actionArea}>
            {isOwnProfile ? (
              <div
                style={styles.ownProfileBadge}
              >
                Este é você
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void handleFollowToggle()
                }
                disabled={followLoading}
                style={{
                  ...styles.followButton,
                  ...(isFollowing
                    ? styles.followingButton
                    : {}),
                  opacity: followLoading
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
            <p style={styles.errorText}>
              {error}
            </p>
          )}
        </section>

        <section style={styles.discoverySection}>
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

          <div style={styles.comingCard}>
            <span
              style={styles.comingIcon}
            >
              ✦
            </span>

            <p style={styles.comingText}>
              Em breve, as descobertas
              públicas desta pessoa
              aparecerão aqui.
            </p>
          </div>
        </section>
      </div>
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
    justifyContent: 'space-between',
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