import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Profile = {
  id: string
  username: string | null
  display_name: string | null
}

type Interest = {
  id: string
  name: string
}

type DiscoveryInterest = {
  discovery_id: string
  interest_id: string
}

type DiscoveryMedia = {
  id: string
  discovery_id: string
  storage_path: string
  position: number
}

type Reaction = {
  profile_id: string
  discovery_id: string
  reaction_type: string
}

type CommentRow = {
  id: string
  discovery_id: string
  author_id: string
  parent_comment_id: string | null
  body: string
  status: string
  created_at: string
  updated_at: string
}

type CommentView = CommentRow & {
  authorName: string
}

type DiscoveryRow = {
  id: string
  author_id: string
  title: string | null
  body: string
  visibility: string
  status: string
  created_at: string
  published_at: string | null
}

type Discovery = DiscoveryRow & {
  authorName: string
  interests: Interest[]
  imageUrl: string | null
  reactionCount: number
  reactedByMe: boolean
  comments: CommentView[]
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
  padding: '28px 18px 56px',
  boxSizing: 'border-box',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginBottom: 24,
}

const primaryButtonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 999,
  background: '#2f6b4f',
  color: '#fff',
  padding: '11px 18px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const cardStyle: React.CSSProperties = {
  overflow: 'hidden',
  borderRadius: 24,
  background: '#fff',
  border: '1px solid rgba(43, 70, 54, 0.10)',
  boxShadow: '0 12px 34px rgba(48, 65, 54, 0.08)',
  marginBottom: 22,
}

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eef4ef',
  color: '#42634f',
  fontSize: 12,
  fontWeight: 600,
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function Discover() {
  const navigate = useNavigate()

  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    null,
  )
  const [selectedInterestNames, setSelectedInterestNames] =
    useState<string[]>([])
  const [reactionLoading, setReactionLoading] = useState<
    Record<string, boolean>
  >({})
  const [commentDrafts, setCommentDrafts] = useState<
    Record<string, string>
  >({})
  const [commentLoading, setCommentLoading] = useState<
    Record<string, boolean>
  >({})

  const loadDiscoveries = useCallback(async () => {
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
        throw new Error('Usuário não autenticado.')
      }

      setCurrentUserId(user.id)

      const {
        data: selectedProfileInterests,
        error: selectedProfileInterestsError,
      } = await supabase
        .from('profile_interests')
        .select('interest_id')
        .eq('profile_id', user.id)
        .eq('source', 'selected')

      if (selectedProfileInterestsError) {
        throw selectedProfileInterestsError
      }

      const selectedInterestIds = (
        selectedProfileInterests ?? []
      ).map((item) => item.interest_id)

      if (selectedInterestIds.length > 0) {
        const {
          data: selectedInterests,
          error: selectedInterestsError,
        } = await supabase
          .from('interests')
          .select('id, name')
          .in('id', selectedInterestIds)

        if (selectedInterestsError) {
          throw selectedInterestsError
        }

        setSelectedInterestNames(
          (selectedInterests ?? [])
            .map((interest) => interest.name)
            .sort((a, b) => a.localeCompare(b, 'pt-BR')),
        )
      } else {
        setSelectedInterestNames([])
      }

      const {
        data: discoveryRows,
        error: discoveriesError,
      } = await supabase
        .from('discoveries')
        .select(
          `
            id,
            author_id,
            title,
            body,
            visibility,
            status,
            created_at,
            published_at
          `,
        )
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('published_at', {
          ascending: false,
          nullsFirst: false,
        })
        .order('created_at', { ascending: false })

      if (discoveriesError) {
        throw discoveriesError
      }

      const rows = (discoveryRows ?? []) as DiscoveryRow[]

      if (rows.length === 0) {
        setDiscoveries([])
        return
      }

      const discoveryIds = rows.map((item) => item.id)
      const authorIds = [
        ...new Set(rows.map((item) => item.author_id)),
      ]

      const [
        discoveryInterestsResult,
        interestsResult,
        mediaResult,
        reactionsResult,
        commentsResult,
      ] = await Promise.all([
        supabase
          .from('discovery_interests')
          .select('discovery_id, interest_id')
          .in('discovery_id', discoveryIds),

        supabase.from('interests').select('id, name'),

        supabase
          .from('discovery_media')
          .select(
            'id, discovery_id, storage_path, position',
          )
          .in('discovery_id', discoveryIds)
          .order('position', { ascending: true }),

        supabase
          .from('reactions')
          .select(
            'profile_id, discovery_id, reaction_type',
          )
          .in('discovery_id', discoveryIds)
          .eq('reaction_type', 'enchanted'),

        supabase
          .from('comments')
          .select(
            `
              id,
              discovery_id,
              author_id,
              parent_comment_id,
              body,
              status,
              created_at,
              updated_at
            `,
          )
          .in('discovery_id', discoveryIds)
          .eq('status', 'active')
          .is('parent_comment_id', null)
          .order('created_at', { ascending: true }),
      ])

      if (discoveryInterestsResult.error) {
        throw discoveryInterestsResult.error
      }

      if (interestsResult.error) {
        throw interestsResult.error
      }

      if (mediaResult.error) {
        throw mediaResult.error
      }

      if (reactionsResult.error) {
        throw reactionsResult.error
      }

      if (commentsResult.error) {
        throw commentsResult.error
      }

      const discoveryInterests = (
        discoveryInterestsResult.data ?? []
      ) as DiscoveryInterest[]
      const interests = (interestsResult.data ?? []) as Interest[]
      const media = (mediaResult.data ?? []) as DiscoveryMedia[]
      const reactions = (reactionsResult.data ?? []) as Reaction[]
      const comments = (commentsResult.data ?? []) as CommentRow[]

      const commentAuthorIds = [
        ...new Set(comments.map((comment) => comment.author_id)),
      ]

      const allProfileIds = [
        ...new Set([...authorIds, ...commentAuthorIds]),
      ]

      const {
        data: profilesData,
        error: profilesError,
      } =
        allProfileIds.length > 0
          ? await supabase
              .from('profiles')
              .select('id, username, display_name')
              .in('id', allProfileIds)
          : {
              data: [] as Profile[],
              error: null,
            }

      if (profilesError) {
        throw profilesError
      }

      const profiles = (profilesData ?? []) as Profile[]

      const profileMap = new Map(
        profiles.map((profile) => [profile.id, profile]),
      )

      const interestMap = new Map(
        interests.map((interest) => [interest.id, interest]),
      )

      const interestsByDiscovery = new Map<string, Interest[]>()

      for (const relation of discoveryInterests) {
        const interest = interestMap.get(relation.interest_id)

        if (!interest) {
          continue
        }

        const list =
          interestsByDiscovery.get(relation.discovery_id) ?? []

        list.push(interest)
        interestsByDiscovery.set(relation.discovery_id, list)
      }

      const firstMediaByDiscovery = new Map<
        string,
        DiscoveryMedia
      >()

      for (const mediaItem of media) {
        if (!firstMediaByDiscovery.has(mediaItem.discovery_id)) {
          firstMediaByDiscovery.set(
            mediaItem.discovery_id,
            mediaItem,
          )
        }
      }

      const signedUrlByDiscovery = new Map<
        string,
        string | null
      >()

      await Promise.all(
        Array.from(firstMediaByDiscovery.entries()).map(
          async ([discoveryId, mediaItem]) => {
            const { data, error } = await supabase.storage
              .from('discovery-media')
              .createSignedUrl(
                mediaItem.storage_path,
                60 * 60,
              )

            if (error) {
              console.error(
                'Erro ao gerar URL assinada:',
                error,
              )

              signedUrlByDiscovery.set(discoveryId, null)
              return
            }

            signedUrlByDiscovery.set(
              discoveryId,
              data.signedUrl,
            )
          },
        ),
      )

      const reactionsByDiscovery = new Map<string, Reaction[]>()

      for (const reaction of reactions) {
        const list =
          reactionsByDiscovery.get(reaction.discovery_id) ?? []

        list.push(reaction)
        reactionsByDiscovery.set(reaction.discovery_id, list)
      }

      const commentsByDiscovery = new Map<
        string,
        CommentView[]
      >()

      for (const comment of comments) {
        const profile = profileMap.get(comment.author_id)

        const authorName =
          profile?.display_name?.trim() ||
          profile?.username?.trim() ||
          'Explorador Florbonacci'

        const list =
          commentsByDiscovery.get(comment.discovery_id) ?? []

        list.push({
          ...comment,
          authorName,
        })

        commentsByDiscovery.set(comment.discovery_id, list)
      }

      const formatted: Discovery[] = rows.map((row) => {
        const profile = profileMap.get(row.author_id)

        const authorName =
          profile?.display_name?.trim() ||
          profile?.username?.trim() ||
          'Explorador Florbonacci'

        const discoveryReactions =
          reactionsByDiscovery.get(row.id) ?? []

        return {
          ...row,
          authorName,
          interests: (
            interestsByDiscovery.get(row.id) ?? []
          ).sort((a, b) =>
            a.name.localeCompare(b.name, 'pt-BR'),
          ),
          imageUrl:
            signedUrlByDiscovery.get(row.id) ?? null,
          reactionCount: discoveryReactions.length,
          reactedByMe: discoveryReactions.some(
            (reaction) =>
              reaction.profile_id === user.id,
          ),
          comments:
            commentsByDiscovery.get(row.id) ?? [],
        }
      })

      setDiscoveries(formatted)
    } catch (error) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as descobertas.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDiscoveries()
  }, [loadDiscoveries])

  const toggleReaction = async (discovery: Discovery) => {
    if (!currentUserId) {
      return
    }

    if (reactionLoading[discovery.id]) {
      return
    }

    setReactionLoading((current) => ({
      ...current,
      [discovery.id]: true,
    }))

    const previousReacted = discovery.reactedByMe
    const previousCount = discovery.reactionCount

    setDiscoveries((current) =>
      current.map((item) =>
        item.id === discovery.id
          ? {
              ...item,
              reactedByMe: !previousReacted,
              reactionCount: previousReacted
                ? Math.max(0, previousCount - 1)
                : previousCount + 1,
            }
          : item,
      ),
    )

    try {
      if (previousReacted) {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('profile_id', currentUserId)
          .eq('discovery_id', discovery.id)

        if (error) {
          throw error
        }
      } else {
        const { error } = await supabase
          .from('reactions')
          .insert({
            profile_id: currentUserId,
            discovery_id: discovery.id,
            reaction_type: 'enchanted',
          })

        if (error) {
          throw error
        }
      }
    } catch (error) {
      console.error(error)

      setDiscoveries((current) =>
        current.map((item) =>
          item.id === discovery.id
            ? {
                ...item,
                reactedByMe: previousReacted,
                reactionCount: previousCount,
              }
            : item,
        ),
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a reação.',
      )
    } finally {
      setReactionLoading((current) => ({
        ...current,
        [discovery.id]: false,
      }))
    }
  }

  const submitComment = async (
    event: FormEvent<HTMLFormElement>,
    discoveryId: string,
  ) => {
    event.preventDefault()

    if (!currentUserId) {
      return
    }

    if (commentLoading[discoveryId]) {
      return
    }

    const body = (
      commentDrafts[discoveryId] ?? ''
    ).trim()

    if (!body) {
      return
    }

    setCommentLoading((current) => ({
      ...current,
      [discoveryId]: true,
    }))

    setErrorMessage('')

    try {
      const {
        data: insertedComment,
        error: insertError,
      } = await supabase
        .from('comments')
        .insert({
          discovery_id: discoveryId,
          author_id: currentUserId,
          parent_comment_id: null,
          body,
          status: 'active',
        })
        .select(
          `
            id,
            discovery_id,
            author_id,
            parent_comment_id,
            body,
            status,
            created_at,
            updated_at
          `,
        )
        .single()

      if (insertError) {
        throw insertError
      }

      const {
        data: authorProfile,
        error: authorProfileError,
      } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .eq('id', currentUserId)
        .single()

      if (authorProfileError) {
        throw authorProfileError
      }

      const profile = authorProfile as Profile

      const authorName =
        profile.display_name?.trim() ||
        profile.username?.trim() ||
        'Explorador Florbonacci'

      const newComment: CommentView = {
        ...(insertedComment as CommentRow),
        authorName,
      }

      setDiscoveries((current) =>
        current.map((discovery) =>
          discovery.id === discoveryId
            ? {
                ...discovery,
                comments: [
                  ...discovery.comments,
                  newComment,
                ],
              }
            : discovery,
        ),
      )

      setCommentDrafts((current) => ({
        ...current,
        [discoveryId]: '',
      }))
    } catch (error) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível publicar o comentário.',
      )
    } finally {
      setCommentLoading((current) => ({
        ...current,
        [discoveryId]: false,
      }))
    }
  }

  const feedSubtitle = useMemo(() => {
    if (selectedInterestNames.length === 0) {
      return 'Descobertas que podem despertar sua curiosidade.'
    }

    return `Seus interesses: ${selectedInterestNames.join(' · ')}`
  }, [selectedInterestNames])

  return (
    <main style={pageStyle}>
      <div style={contentStyle}>
        <header style={headerStyle}>
          <div>
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
                fontSize: 'clamp(30px, 6vw, 44px)',
                lineHeight: 1,
                color: '#233b2e',
              }}
            >
              Descobrir
            </h1>
          </div>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => navigate('/discover/new')}
          >
            + Nova descoberta
          </button>
        </header>

        <p
          style={{
            margin: '0 0 28px',
            color: '#6c776f',
            lineHeight: 1.55,
            fontSize: 14,
          }}
        >
          {feedSubtitle}
        </p>

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
              padding: '56px 20px',
              textAlign: 'center',
              color: '#738078',
            }}
          >
            Procurando descobertas...
          </div>
        ) : discoveries.length === 0 ? (
          <section
            style={{
              ...cardStyle,
              padding: '42px 26px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 36,
                marginBottom: 12,
              }}
            >
              🌿
            </div>

            <h2
              style={{
                margin: '0 0 10px',
                color: '#284334',
              }}
            >
              O mundo está esperando sua primeira descoberta.
            </h2>

            <p
              style={{
                margin: '0 auto 22px',
                maxWidth: 460,
                lineHeight: 1.6,
                color: '#6e786f',
              }}
            >
              Observe algo que chamou sua atenção e compartilhe
              com quem também gosta de descobrir.
            </p>

            <button
              type="button"
              style={primaryButtonStyle}
              onClick={() => navigate('/discover/new')}
            >
              Fazer uma descoberta
            </button>
          </section>
        ) : (
          discoveries.map((discovery) => (
            <article key={discovery.id} style={cardStyle}>
              {discovery.imageUrl && (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    background: '#e8ebe5',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={discovery.imageUrl}
                    alt={
                      discovery.title
                        ? `Fotografia da descoberta ${discovery.title}`
                        : 'Fotografia da descoberta'
                    }
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  padding: '20px 21px 18px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'flex-start',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 750,
                        color: '#365541',
                        fontSize: 14,
                      }}
                    >
                      {discovery.authorName}
                    </div>

                    <div
                      style={{
                        color: '#919991',
                        fontSize: 12,
                        marginTop: 3,
                      }}
                    >
                      {formatDate(
                        discovery.published_at ??
                          discovery.created_at,
                      )}
                    </div>
                  </div>
                </div>

                {discovery.title && (
                  <h2
                    style={{
                      margin: '0 0 10px',
                      color: '#253d30',
                      fontSize: 23,
                      lineHeight: 1.2,
                    }}
                  >
                    {discovery.title}
                  </h2>
                )}

                <p
                  style={{
                    margin: '0 0 18px',
                    color: '#4e5c53',
                    lineHeight: 1.65,
                    fontSize: 15,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {discovery.body}
                </p>

                {discovery.interests.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 7,
                      marginBottom: 17,
                    }}
                  >
                    {discovery.interests.map((interest) => (
                      <span
                        key={interest.id}
                        style={chipStyle}
                      >
                        {interest.name}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    borderTop:
                      '1px solid rgba(48, 76, 60, 0.09)',
                    paddingTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    disabled={reactionLoading[discovery.id]}
                    onClick={() =>
                      void toggleReaction(discovery)
                    }
                    aria-pressed={discovery.reactedByMe}
                    style={{
                      border: discovery.reactedByMe
                        ? '1px solid rgba(47, 107, 79, 0.30)'
                        : '1px solid rgba(48, 76, 60, 0.12)',
                      background: discovery.reactedByMe
                        ? '#edf5ef'
                        : '#fff',
                      color: discovery.reactedByMe
                        ? '#2f6b4f'
                        : '#5f6d64',
                      borderRadius: 999,
                      padding: '9px 13px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: reactionLoading[discovery.id]
                        ? 'wait'
                        : 'pointer',
                      opacity: reactionLoading[discovery.id]
                        ? 0.65
                        : 1,
                    }}
                  >
                    ✨{' '}
                    {discovery.reactedByMe
                      ? 'Encantou'
                      : 'Me encantou'}
                  </button>

                  <span
                    style={{
                      fontSize: 13,
                      color: '#859087',
                    }}
                  >
                    {discovery.reactionCount === 0
                      ? 'Seja o primeiro a se encantar'
                      : discovery.reactionCount === 1
                        ? '1 pessoa se encantou'
                        : `${discovery.reactionCount} pessoas se encantaram`}
                  </span>
                </div>

                <section
                  style={{
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop:
                      '1px solid rgba(48, 76, 60, 0.09)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom:
                        discovery.comments.length > 0
                          ? 14
                          : 10,
                    }}
                  >
                    <strong
                      style={{
                        color: '#365541',
                        fontSize: 14,
                      }}
                    >
                      Comentários
                    </strong>

                    <span
                      style={{
                        color: '#919991',
                        fontSize: 12,
                      }}
                    >
                      {discovery.comments.length === 0
                        ? 'Nenhum ainda'
                        : discovery.comments.length === 1
                          ? '1 comentário'
                          : `${discovery.comments.length} comentários`}
                    </span>
                  </div>

                  {discovery.comments.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      {discovery.comments.map((comment) => (
                        <div
                          key={comment.id}
                          style={{
                            padding: '11px 13px',
                            borderRadius: 14,
                            background: '#f6f8f5',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent:
                                'space-between',
                              gap: 10,
                              marginBottom: 5,
                            }}
                          >
                            <strong
                              style={{
                                fontSize: 13,
                                color: '#355542',
                              }}
                            >
                              {comment.authorName}
                            </strong>

                            <span
                              style={{
                                fontSize: 11,
                                color: '#969e98',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatCommentDate(
                                comment.created_at,
                              )}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: 14,
                              lineHeight: 1.5,
                              color: '#56635a',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {comment.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <form
                    onSubmit={(event) =>
                      void submitComment(
                        event,
                        discovery.id,
                      )
                    }
                    style={{
                      display: 'flex',
                      gap: 9,
                      alignItems: 'flex-end',
                    }}
                  >
                    <textarea
                      value={
                        commentDrafts[discovery.id] ?? ''
                      }
                      onChange={(event) =>
                        setCommentDrafts((current) => ({
                          ...current,
                          [discovery.id]:
                            event.target.value,
                        }))
                      }
                      maxLength={5000}
                      rows={2}
                      placeholder="Escreva um comentário..."
                      style={{
                        flex: 1,
                        resize: 'vertical',
                        minHeight: 42,
                        maxHeight: 140,
                        border:
                          '1px solid rgba(48, 76, 60, 0.16)',
                        borderRadius: 14,
                        padding: '10px 12px',
                        fontFamily: 'inherit',
                        fontSize: 14,
                        lineHeight: 1.4,
                        color: '#35463b',
                        background: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />

                    <button
                      type="submit"
                      disabled={
                        commentLoading[discovery.id] ||
                        !(
                          commentDrafts[
                            discovery.id
                          ] ?? ''
                        ).trim()
                      }
                      style={{
                        border: 0,
                        borderRadius: 999,
                        padding: '10px 14px',
                        background: '#315f49',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor:
                          commentLoading[
                            discovery.id
                          ] ||
                          !(
                            commentDrafts[
                              discovery.id
                            ] ?? ''
                          ).trim()
                            ? 'default'
                            : 'pointer',
                        opacity:
                          commentLoading[
                            discovery.id
                          ] ||
                          !(
                            commentDrafts[
                              discovery.id
                            ] ?? ''
                          ).trim()
                            ? 0.55
                            : 1,
                      }}
                    >
                      {commentLoading[discovery.id]
                        ? 'Enviando...'
                        : 'Comentar'}
                    </button>
                  </form>
                </section>
              </div>
            </article>
          ))
        )}

        <footer
          style={{
            textAlign: 'center',
            padding: '28px 10px 8px',
            color: '#829087',
            fontSize: 13,
          }}
        >
          Curiosidade move o mundo. Conexão transforma.
        </footer>
      </div>
    </main>
  )
}