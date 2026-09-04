import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import type { FormEvent } from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import MainNavigation from '../components/MainNavigation'
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
  padding: '24px 18px 130px',
  boxSizing: 'border-box',
}

const cardStyle: React.CSSProperties = {
  overflow: 'hidden',
  borderRadius: 24,
  background: '#fff',
  border:
    '1px solid rgba(43, 70, 54, 0.10)',
  boxShadow:
    '0 12px 34px rgba(48, 65, 54, 0.08)',
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
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(new Date(value))
}

function formatCommentDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(new Date(value))
}

export default function DiscoveryDetails() {
  const navigate = useNavigate()

  const { discoveryId } =
    useParams<{
      discoveryId: string
    }>()

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<string | null>(
    null,
  )

  const [
    discovery,
    setDiscovery,
  ] = useState<Discovery | null>(
    null,
  )

  const [loading, setLoading] =
    useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    reactionLoading,
    setReactionLoading,
  ] = useState(false)

  const [
    commentDraft,
    setCommentDraft,
  ] = useState('')

  const [
    commentLoading,
    setCommentLoading,
  ] = useState(false)

  const loadDiscovery =
    useCallback(async () => {
      if (!discoveryId) {
        setErrorMessage(
          'Descoberta não identificada.',
        )
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

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
          throw new Error(
            'Usuário não autenticado.',
          )
        }

        setCurrentUserId(user.id)

        const {
          data: discoveryData,
          error: discoveryError,
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
          .eq('id', discoveryId)
          .eq('status', 'published')
          .eq('visibility', 'public')
          .maybeSingle()

        if (discoveryError) {
          throw discoveryError
        }

        if (!discoveryData) {
          setDiscovery(null)
          setErrorMessage(
            'Esta descoberta não está disponível.',
          )
          return
        }

        const row =
          discoveryData as DiscoveryRow

        const [
          profileResult,
          discoveryInterestsResult,
          mediaResult,
          reactionsResult,
          commentsResult,
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select(
              'id, username, display_name',
            )
            .eq('id', row.author_id)
            .maybeSingle(),

          supabase
            .from(
              'discovery_interests',
            )
            .select(
              'discovery_id, interest_id',
            )
            .eq(
              'discovery_id',
              row.id,
            ),

          supabase
            .from(
              'discovery_media',
            )
            .select(
              'id, discovery_id, storage_path, position',
            )
            .eq(
              'discovery_id',
              row.id,
            )
            .order('position', {
              ascending: true,
            }),

          supabase
            .from('reactions')
            .select(
              'profile_id, discovery_id, reaction_type',
            )
            .eq(
              'discovery_id',
              row.id,
            )
            .eq(
              'reaction_type',
              'enchanted',
            ),

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
            .eq(
              'discovery_id',
              row.id,
            )
            .eq(
              'status',
              'active',
            )
            .is(
              'parent_comment_id',
              null,
            )
            .order('created_at', {
              ascending: true,
            }),
        ])

        if (profileResult.error) {
          throw profileResult.error
        }

        if (
          discoveryInterestsResult.error
        ) {
          throw discoveryInterestsResult.error
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

        const authorProfile =
          profileResult.data as
            | Profile
            | null

        const relations =
          (discoveryInterestsResult.data ??
            []) as DiscoveryInterest[]

        let interests: Interest[] = []

        const interestIds =
          relations.map(
            (item) =>
              item.interest_id,
          )

        if (
          interestIds.length > 0
        ) {
          const {
            data: interestsData,
            error: interestsError,
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

          interests.sort(
            (a, b) =>
              a.name.localeCompare(
                b.name,
                'pt-BR',
              ),
          )
        }

        const media =
          (mediaResult.data ??
            []) as DiscoveryMedia[]

        let imageUrl:
          | string
          | null = null

        if (media.length > 0) {
          const {
            data: signedData,
            error: signedError,
          } =
            await supabase.storage
              .from(
                'discovery-media',
              )
              .createSignedUrl(
                media[0]
                  .storage_path,
                60 * 60,
              )

          if (signedError) {
            console.error(
              'Erro ao gerar URL assinada:',
              signedError,
            )
          } else {
            imageUrl =
              signedData.signedUrl
          }
        }

        const reactions =
          (reactionsResult.data ??
            []) as Reaction[]

        const comments =
          (commentsResult.data ??
            []) as CommentRow[]

        const commentAuthorIds = [
          ...new Set(
            comments.map(
              (comment) =>
                comment.author_id,
            ),
          ),
        ]

        let commentProfiles:
          Profile[] = []

        if (
          commentAuthorIds.length > 0
        ) {
          const {
            data:
              commentProfilesData,
            error:
              commentProfilesError,
          } = await supabase
            .from('profiles')
            .select(
              'id, username, display_name',
            )
            .in(
              'id',
              commentAuthorIds,
            )

          if (
            commentProfilesError
          ) {
            throw commentProfilesError
          }

          commentProfiles =
            (commentProfilesData ??
              []) as Profile[]
        }

        const profileMap =
          new Map(
            commentProfiles.map(
              (profile) => [
                profile.id,
                profile,
              ],
            ),
          )

        const formattedComments:
          CommentView[] =
          comments.map(
            (comment) => {
              const profile =
                profileMap.get(
                  comment.author_id,
                )

              const authorName =
                profile?.display_name?.trim() ||
                profile?.username?.trim() ||
                'Explorador Florbonacci'

              return {
                ...comment,
                authorName,
              }
            },
          )

        const authorName =
          authorProfile?.display_name?.trim() ||
          authorProfile?.username?.trim() ||
          'Explorador Florbonacci'

        setDiscovery({
          ...row,
          authorName,
          interests,
          imageUrl,
          reactionCount:
            reactions.length,
          reactedByMe:
            reactions.some(
              (reaction) =>
                reaction.profile_id ===
                user.id,
            ),
          comments:
            formattedComments,
        })
      } catch (error) {
        console.error(error)

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar esta descoberta.',
        )
      } finally {
        setLoading(false)
      }
    }, [discoveryId])

  useEffect(() => {
    void loadDiscovery()
  }, [loadDiscovery])

  async function toggleReaction() {
    if (
      !currentUserId ||
      !discovery ||
      reactionLoading
    ) {
      return
    }

    const previousReacted =
      discovery.reactedByMe

    const previousCount =
      discovery.reactionCount

    setReactionLoading(true)
    setErrorMessage('')

    setDiscovery({
      ...discovery,
      reactedByMe:
        !previousReacted,
      reactionCount:
        previousReacted
          ? Math.max(
              0,
              previousCount - 1,
            )
          : previousCount + 1,
    })

    try {
      if (previousReacted) {
        const { error } =
          await supabase
            .from('reactions')
            .delete()
            .eq(
              'profile_id',
              currentUserId,
            )
            .eq(
              'discovery_id',
              discovery.id,
            )

        if (error) {
          throw error
        }
      } else {
        const { error } =
          await supabase
            .from('reactions')
            .insert({
              profile_id:
                currentUserId,
              discovery_id:
                discovery.id,
              reaction_type:
                'enchanted',
            })

        if (error) {
          throw error
        }
      }
    } catch (error) {
      console.error(error)

      setDiscovery(
        (current) =>
          current
            ? {
                ...current,
                reactedByMe:
                  previousReacted,
                reactionCount:
                  previousCount,
              }
            : current,
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a reação.',
      )
    } finally {
      setReactionLoading(false)
    }
  }

  async function submitComment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !currentUserId ||
      !discovery ||
      commentLoading
    ) {
      return
    }

    const body =
      commentDraft.trim()

    if (!body) {
      return
    }

    setCommentLoading(true)
    setErrorMessage('')

    try {
      const {
        data: insertedComment,
        error: insertError,
      } = await supabase
        .from('comments')
        .insert({
          discovery_id:
            discovery.id,
          author_id:
            currentUserId,
          parent_comment_id:
            null,
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
        error:
          authorProfileError,
      } = await supabase
        .from('profiles')
        .select(
          'id, username, display_name',
        )
        .eq(
          'id',
          currentUserId,
        )
        .single()

      if (
        authorProfileError
      ) {
        throw authorProfileError
      }

      const profile =
        authorProfile as Profile

      const authorName =
        profile.display_name?.trim() ||
        profile.username?.trim() ||
        'Explorador Florbonacci'

      const newComment:
        CommentView = {
        ...(insertedComment as CommentRow),
        authorName,
      }

      setDiscovery(
        (current) =>
          current
            ? {
                ...current,
                comments: [
                  ...current.comments,
                  newComment,
                ],
              }
            : current,
      )

      setCommentDraft('')
    } catch (error) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível publicar o comentário.',
      )
    } finally {
      setCommentLoading(false)
    }
  }

  return (
    <main style={pageStyle}>
      <div style={contentStyle}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 22,
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            style={{
              border:
                '1px solid rgba(47, 107, 79, 0.16)',
              borderRadius: 999,
              background: '#fff',
              color: '#315f49',
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
              fontSize: 20,
              cursor: 'pointer',
              flex: '0 0 42px',
            }}
            aria-label="Voltar"
          >
            ←
          </button>

          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing:
                  '0.08em',
                textTransform:
                  'uppercase',
                color: '#64806d',
                marginBottom: 3,
              }}
            >
              Florbonacci
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 26,
                color: '#233b2e',
              }}
            >
              Descoberta
            </h1>
          </div>
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
              padding: '60px 20px',
              textAlign: 'center',
              color: '#738078',
            }}
          >
            Abrindo a descoberta...
          </div>
        ) : !discovery ? (
          <section
            style={{
              ...cardStyle,
              padding: '44px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 38,
                marginBottom: 12,
              }}
            >
              🍃
            </div>

            <h2
              style={{
                margin: '0 0 9px',
                color: '#284334',
              }}
            >
              Esta descoberta não está disponível.
            </h2>

            <button
              type="button"
              onClick={() =>
                navigate('/discover')
              }
              style={{
                marginTop: 16,
                border: 0,
                borderRadius: 999,
                background: '#315f49',
                color: '#fff',
                padding: '11px 17px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Voltar para Descobrir
            </button>
          </section>
        ) : (
          <article style={cardStyle}>
            {discovery.imageUrl && (
              <div
                style={{
                  width: '100%',
                  aspectRatio:
                    '16 / 9',
                  background: '#e8ebe5',
                  overflow: 'hidden',
                }}
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
                padding:
                  '20px 21px 22px',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/profile/${discovery.author_id}`,
                  )
                }
                style={{
                  appearance: 'none',
                  border: 0,
                  background:
                    'transparent',
                  padding: 0,
                  margin: 0,
                  color: '#365541',
                  fontWeight: 750,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                {discovery.authorName}
              </button>

              <div
                style={{
                  color: '#919991',
                  fontSize: 12,
                  marginTop: 3,
                  marginBottom: 17,
                }}
              >
                {formatDate(
                  discovery.published_at ??
                    discovery.created_at,
                )}
              </div>

              {discovery.title && (
                <h2
                  style={{
                    margin:
                      '0 0 10px',
                    color: '#253d30',
                    fontSize: 25,
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
                  whiteSpace:
                    'pre-wrap',
                }}
              >
                {discovery.body}
              </p>

              {discovery.interests
                .length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 7,
                    marginBottom: 18,
                  }}
                >
                  {discovery.interests.map(
                    (interest) => (
                      <span
                        key={
                          interest.id
                        }
                        style={
                          chipStyle
                        }
                      >
                        {interest.name}
                      </span>
                    ),
                  )}
                </div>
              )}

              <div
                style={{
                  borderTop:
                    '1px solid rgba(48, 76, 60, 0.09)',
                  paddingTop: 15,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  disabled={
                    reactionLoading
                  }
                  onClick={() =>
                    void toggleReaction()
                  }
                  aria-pressed={
                    discovery.reactedByMe
                  }
                  style={{
                    border:
                      discovery.reactedByMe
                        ? '1px solid rgba(47, 107, 79, 0.30)'
                        : '1px solid rgba(48, 76, 60, 0.12)',
                    background:
                      discovery.reactedByMe
                        ? '#edf5ef'
                        : '#fff',
                    color:
                      discovery.reactedByMe
                        ? '#2f6b4f'
                        : '#5f6d64',
                    borderRadius: 999,
                    padding: '9px 13px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor:
                      reactionLoading
                        ? 'wait'
                        : 'pointer',
                    opacity:
                      reactionLoading
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
                  {discovery.reactionCount ===
                  0
                    ? 'Seja o primeiro a se encantar'
                    : discovery.reactionCount ===
                        1
                      ? '1 pessoa se encantou'
                      : `${discovery.reactionCount} pessoas se encantaram`}
                </span>
              </div>

              <section
                style={{
                  marginTop: 20,
                  paddingTop: 18,
                  borderTop:
                    '1px solid rgba(48, 76, 60, 0.09)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 14,
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
                    {discovery.comments
                      .length === 0
                      ? 'Nenhum ainda'
                      : discovery.comments
                            .length === 1
                        ? '1 comentário'
                        : `${discovery.comments.length} comentários`}
                  </span>
                </div>

                {discovery.comments
                  .length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    {discovery.comments.map(
                      (comment) => (
                        <div
                          key={
                            comment.id
                          }
                          style={{
                            padding:
                              '11px 13px',
                            borderRadius: 14,
                            background:
                              '#f6f8f5',
                          }}
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'space-between',
                              gap: 10,
                              marginBottom: 5,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/profile/${comment.author_id}`,
                                )
                              }
                              style={{
                                appearance:
                                  'none',
                                border: 0,
                                padding: 0,
                                background:
                                  'transparent',
                                fontFamily:
                                  'inherit',
                                fontSize: 13,
                                fontWeight: 700,
                                color:
                                  '#355542',
                                cursor:
                                  'pointer',
                              }}
                            >
                              {
                                comment.authorName
                              }
                            </button>

                            <span
                              style={{
                                fontSize: 11,
                                color:
                                  '#969e98',
                                whiteSpace:
                                  'nowrap',
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
                              color:
                                '#56635a',
                              whiteSpace:
                                'pre-wrap',
                            }}
                          >
                            {comment.body}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                <form
                  onSubmit={(event) =>
                    void submitComment(
                      event,
                    )
                  }
                  style={{
                    display: 'flex',
                    gap: 9,
                    alignItems:
                      'flex-end',
                  }}
                >
                  <textarea
                    value={commentDraft}
                    onChange={(event) =>
                      setCommentDraft(
                        event.target
                          .value,
                      )
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
                      padding:
                        '10px 12px',
                      fontFamily:
                        'inherit',
                      fontSize: 14,
                      lineHeight: 1.4,
                      color: '#35463b',
                      background: '#fff',
                      outline: 'none',
                      boxSizing:
                        'border-box',
                    }}
                  />

                  <button
                    type="submit"
                    disabled={
                      commentLoading ||
                      !commentDraft.trim()
                    }
                    style={{
                      border: 0,
                      borderRadius: 999,
                      padding:
                        '10px 14px',
                      background: '#315f49',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor:
                        commentLoading ||
                        !commentDraft.trim()
                          ? 'default'
                          : 'pointer',
                      opacity:
                        commentLoading ||
                        !commentDraft.trim()
                          ? 0.55
                          : 1,
                    }}
                  >
                    {commentLoading
                      ? 'Enviando...'
                      : 'Comentar'}
                  </button>
                </form>
              </section>
            </div>
          </article>
        )}
      </div>

      <MainNavigation
        currentUserId={currentUserId}
      />
    </main>
  )
}