import {
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

import MainNavigation from '../components/MainNavigation'
import { supabase } from '../lib/supabaseClient'

type NotificationRow = {
  id: string
  recipient_id: string
  actor_id: string | null
  type: string
  discovery_id: string | null
  comment_id: string | null
  read_at: string | null
  created_at: string
}

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_path: string | null
}

type ActivityItem = NotificationRow & {
  actorName: string
  actorAvatarUrl: string | null
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

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getActivityText(type: string) {
  switch (type) {
    case 'new_follower':
      return 'começou a seguir você.'
    case 'reaction':
      return 'se encantou com uma descoberta sua.'
    case 'comment':
      return 'comentou em uma descoberta sua.'
    case 'comment_reply':
      return 'respondeu a um comentário seu.'
    case 'related_discovery':
      return 'publicou algo relacionado aos seus interesses.'
    default:
      return 'interagiu com você.'
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'new_follower':
      return '👤'
    case 'reaction':
      return '✨'
    case 'comment':
      return '💬'
    case 'comment_reply':
      return '↩'
    case 'related_discovery':
      return '🌿'
    default:
      return '•'
  }
}

export default function Activity() {
  const navigate = useNavigate()

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null)

  const [items, setItems] =
    useState<ActivityItem[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    async function loadActivity() {
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

        const {
          data: notificationRows,
          error: notificationsError,
        } = await supabase
          .from('notifications')
          .select(
            `
              id,
              recipient_id,
              actor_id,
              type,
              discovery_id,
              comment_id,
              read_at,
              created_at
            `,
          )
          .eq('recipient_id', user.id)
          .order('created_at', {
            ascending: false,
          })
          .limit(50)

        if (notificationsError) {
          throw notificationsError
        }

        const notifications =
          (notificationRows ??
            []) as NotificationRow[]

        if (notifications.length === 0) {
          setItems([])
          return
        }

        const actorIds = [
          ...new Set(
            notifications
              .map(
                (notification) =>
                  notification.actor_id,
              )
              .filter(
                (
                  actorId,
                ): actorId is string =>
                  Boolean(actorId),
              ),
          ),
        ]

        const {
          data: profilesData,
          error: profilesError,
        } =
          actorIds.length > 0
            ? await supabase
                .from('profiles')
                .select(
                  `
                    id,
                    username,
                    display_name,
                    avatar_path
                  `,
                )
                .in('id', actorIds)
            : {
                data: [] as Profile[],
                error: null,
              }

        if (profilesError) {
          throw profilesError
        }

        const profiles =
          (profilesData ??
            []) as Profile[]

        const profilesWithAvatars =
          await Promise.all(
            profiles.map(
              async (profile) => {
                if (!profile.avatar_path) {
                  return {
                    profile,
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
                    profile,
                    avatarUrl: null,
                  }
                }

                return {
                  profile,
                  avatarUrl:
                    data.signedUrl,
                }
              },
            ),
          )

        const profileMap =
          new Map(
            profilesWithAvatars.map(
              ({
                profile,
                avatarUrl,
              }) => [
                profile.id,
                {
                  profile,
                  avatarUrl,
                },
              ],
            ),
          )

        const formatted =
          notifications.map(
            (notification) => {
              const profileEntry =
                notification.actor_id
                  ? profileMap.get(
                      notification.actor_id,
                    )
                  : null

              const profile =
                profileEntry?.profile

              const actorName =
                profile?.display_name?.trim() ||
                profile?.username?.trim() ||
                'Alguém no Florbonacci'

              return {
                ...notification,
                actorName,
                actorAvatarUrl:
                  profileEntry?.avatarUrl ??
                  null,
              }
            },
          )

        setItems(formatted)
      } catch (error) {
        console.error(error)

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar sua atividade.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadActivity()
  }, [])

  async function openActivity(
    item: ActivityItem,
  ) {
    try {
      if (!item.read_at) {
        await supabase
          .from('notifications')
          .update({
            read_at:
              new Date().toISOString(),
          })
          .eq('id', item.id)

        setItems((current) =>
          current.map(
            (notification) =>
              notification.id === item.id
                ? {
                    ...notification,
                    read_at:
                      new Date().toISOString(),
                  }
                : notification,
          ),
        )
      }

      if (
        item.type ===
          'new_follower' &&
        item.actor_id
      ) {
        navigate(
          `/profile/${item.actor_id}`,
        )
        return
      }

      if (item.discovery_id) {
        navigate('/discover')
        return
      }

      if (item.actor_id) {
        navigate(
          `/profile/${item.actor_id}`,
        )
      }
    } catch (error) {
      console.error(error)
    }
  }

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
            Atividade
          </h1>

          <p
            style={{
              margin: '12px 0 0',
              color: '#6c776f',
              lineHeight: 1.55,
              fontSize: 14,
            }}
          >
            Veja quem se conectou,
            comentou ou se encantou
            com suas descobertas.
          </p>
        </header>

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
            Reunindo sua atividade...
          </div>
        ) : items.length === 0 ? (
          <section
            style={{
              padding: '44px 24px',
              textAlign: 'center',
              borderRadius: 22,
              background: '#fff',
              border:
                '1px solid rgba(43, 70, 54, 0.10)',
              boxShadow:
                '0 10px 30px rgba(48, 65, 54, 0.06)',
            }}
          >
            <div
              style={{
                fontSize: 38,
                marginBottom: 12,
              }}
            >
              🌱
            </div>

            <h2
              style={{
                margin: '0 0 8px',
                color: '#284334',
                fontSize: 20,
              }}
            >
              Ainda está quieto por aqui.
            </h2>

            <p
              style={{
                margin: 0,
                color: '#76827a',
                lineHeight: 1.6,
                fontSize: 14,
              }}
            >
              Quando alguém seguir você,
              comentar ou se encantar com
              uma descoberta sua, isso
              aparecerá aqui.
            </p>
          </section>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 12,
            }}
          >
            {items.map((item) => {
              const initial =
                item.actorName
                  .charAt(0)
                  .toUpperCase() ||
                'F'

              const unread =
                !item.read_at

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    void openActivity(
                      item,
                    )
                  }
                  style={{
                    appearance: 'none',
                    width: '100%',
                    border:
                      unread
                        ? '1px solid rgba(47, 107, 79, 0.20)'
                        : '1px solid rgba(43, 70, 54, 0.09)',
                    borderRadius: 18,
                    padding: '14px 15px',
                    background:
                      unread
                        ? '#f5faf6'
                        : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 13,
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow:
                      '0 7px 22px rgba(48, 65, 54, 0.05)',
                    fontFamily: 'inherit',
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      flex: '0 0 52px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      display: 'grid',
                      placeItems: 'center',
                      background: '#dce8df',
                      color: '#315f49',
                      fontSize: 20,
                      fontWeight: 800,
                    }}
                  >
                    {item.actorAvatarUrl ? (
                      <img
                        src={
                          item.actorAvatarUrl
                        }
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
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
                        color: '#2f4939',
                        fontSize: 14,
                        lineHeight: 1.45,
                      }}
                    >
                      <strong>
                        {item.actorName}
                      </strong>{' '}
                      {getActivityText(
                        item.type,
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        color: '#8a958e',
                        fontSize: 12,
                      }}
                    >
                      {formatActivityDate(
                        item.created_at,
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        fontSize: 18,
                      }}
                    >
                      {getActivityIcon(
                        item.type,
                      )}
                    </span>

                    {unread && (
                      <span
                        aria-label="Não lida"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#2f6b4f',
                          display: 'block',
                        }}
                      />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <MainNavigation
        currentUserId={currentUserId}
      />
    </main>
  )
}