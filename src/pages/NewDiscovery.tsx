import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Interest = {
  id: string
  name: string
}

const MAX_IMAGE_SIZE = 15 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]

function NewDiscovery() {
  const navigate = useNavigate()
  const fileInputRef =
    useRef<HTMLInputElement | null>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const [interests, setInterests] =
    useState<Interest[]>([])
  const [selectedIds, setSelectedIds] =
    useState<string[]>([])

  const [imageFile, setImageFile] =
    useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] =
    useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] =
    useState('')

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
          navigate('/login', {
            replace: true,
          })
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

        const preferredIds = (
          profileInterests ?? []
        ).map(
          (item) => item.interest_id,
        )

        const {
          data: interestRows,
          error: interestsError,
        } = await supabase
          .from('interests')
          .select('id, name')
          .eq('status', 'active')
          .order('name', {
            ascending: true,
          })

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

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null)
      return
    }

    const previewableTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (
      !previewableTypes.includes(
        imageFile.type,
      )
    ) {
      setImagePreviewUrl(null)
      return
    }

    const objectUrl =
      URL.createObjectURL(imageFile)

    setImagePreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [imageFile])

  function toggleInterest(
    interestId: string,
  ) {
    if (saving) {
      return
    }

    setSelectedIds((current) => {
      if (current.includes(interestId)) {
        return current.filter(
          (id) => id !== interestId,
        )
      }

      return [...current, interestId]
    })
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ?? null

    setErrorMessage('')

    if (!file) {
      setImageFile(null)
      return
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type,
      )
    ) {
      setImageFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setErrorMessage(
        'Escolha uma imagem JPEG, PNG, WebP, HEIC ou HEIF.',
      )

      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setErrorMessage(
        'A fotografia deve ter no máximo 15 MB.',
      )

      return
    }

    setImageFile(file)
  }

  function removeImage() {
    if (saving) {
      return
    }

    setImageFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function getFileExtension(
    file: File,
  ) {
    const originalExtension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase()

    if (originalExtension) {
      return originalExtension
    }

    const mimeExtensions: Record<
      string,
      string
    > = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    }

    return (
      mimeExtensions[file.type] ??
      'jpg'
    )
  }

  async function handlePublish() {
    const cleanTitle = title.trim()
    const cleanBody = body.trim()

    if (!cleanBody || saving) {
      return
    }

    setSaving(true)
    setErrorMessage('')

    let createdDiscoveryId:
      | string
      | null = null

    let uploadedStoragePath:
      | string
      | null = null

    try {
      const {
        data: { user },
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
          status: 'draft',
          published_at: null,
        })
        .select('id')
        .single()

      if (discoveryError) {
        throw discoveryError
      }

      createdDiscoveryId =
        discovery.id

      if (selectedIds.length > 0) {
        const rows = selectedIds.map(
          (interestId) => ({
            discovery_id:
              discovery.id,
            interest_id:
              interestId,
          }),
        )

        const {
          error: interestsError,
        } = await supabase
          .from(
            'discovery_interests',
          )
          .insert(rows)

        if (interestsError) {
          throw interestsError
        }
      }

      if (imageFile) {
        const extension =
          getFileExtension(imageFile)

        const storagePath = [
          'discoveries',
          user.id,
          discovery.id,
          `${crypto.randomUUID()}.${extension}`,
        ].join('/')

        const {
          error: uploadError,
        } = await supabase.storage
          .from('discovery-media')
          .upload(
            storagePath,
            imageFile,
            {
              cacheControl: '3600',
              upsert: false,
              contentType:
                imageFile.type,
            },
          )

        if (uploadError) {
          throw uploadError
        }

        uploadedStoragePath =
          storagePath

        const {
          error: mediaError,
        } = await supabase
          .from('discovery_media')
          .insert({
            discovery_id:
              discovery.id,
            media_type: 'image',
            storage_path:
              storagePath,
            thumbnail_path: null,
            width: null,
            height: null,
            file_size:
              imageFile.size,
            mime_type:
              imageFile.type,
            position: 0,
          })

        if (mediaError) {
          throw mediaError
        }
      }

      const {
        error: publishError,
      } = await supabase
        .from('discoveries')
        .update({
          status: 'published',
          published_at:
            new Date().toISOString(),
        })
        .eq('id', discovery.id)
        .eq('author_id', user.id)

      if (publishError) {
        throw publishError
      }

      navigate('/discover')
    } catch (error) {
      console.error(error)

      if (uploadedStoragePath) {
        const {
          error: removeError,
        } = await supabase.storage
          .from('discovery-media')
          .remove([
            uploadedStoragePath,
          ])

        if (removeError) {
          console.error(
            'Não foi possível remover o arquivo após falha na publicação.',
            removeError,
          )
        }
      }

      if (createdDiscoveryId) {
        const {
          error: cleanupError,
        } = await supabase
          .from('discoveries')
          .update({
            status: 'deleted',
          })
          .eq(
            'id',
            createdDiscoveryId,
          )

        if (cleanupError) {
          console.error(
            'Não foi possível encerrar o rascunho após falha na publicação.',
            cleanupError,
          )
        }
      }

      setErrorMessage(
        'Não foi possível publicar sua descoberta. Tente novamente.',
      )
    } finally {
      setSaving(false)
    }
  }

  const canPublish =
    body.trim().length > 0 &&
    !saving

  const imageSizeLabel =
    imageFile
      ? `${(
          imageFile.size /
          (1024 * 1024)
        ).toFixed(1)} MB`
      : ''

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #f7f5ee 0%, #eef4ee 100%)',
        color: '#1f2a22',
        padding:
          '32px 20px 56px',
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
          disabled={saving}
          onClick={() =>
            navigate('/discover')
          }
          style={{
            padding: 0,
            background: 'transparent',
            color: '#587260',
            fontWeight: 750,
            cursor: saving
              ? 'wait'
              : 'pointer',
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
              textTransform:
                'uppercase',
            }}
          >
            Nova descoberta
          </span>

          <h1
            style={{
              margin: 0,
              fontSize:
                'clamp(2.6rem, 7vw, 4.8rem)',
              lineHeight: 0.98,
              letterSpacing:
                '-0.05em',
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
            Registre algo que fez você
            parar, observar, pensar ou
            querer saber mais.
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
            padding:
              'clamp(22px, 5vw, 36px)',
            borderRadius: 30,
            background: '#ffffff',
            border:
              '1px solid rgba(49, 93, 59, 0.09)',
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
            onChange={(event) =>
              setTitle(
                event.target.value,
              )
            }
            placeholder="Opcional"
            maxLength={120}
            style={{
              width: '100%',
              border:
                '1px solid #dce3dc',
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
            onChange={(event) =>
              setBody(
                event.target.value,
              )
            }
            placeholder="O que você viu, percebeu ou achou curioso?"
            rows={7}
            style={{
              width: '100%',
              resize: 'vertical',
              border:
                '1px solid #dce3dc',
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
            <strong
              style={{
                display: 'block',
                fontSize: 17,
              }}
            >
              Mostre o que chamou sua
              atenção
            </strong>

            <span
              style={{
                display: 'block',
                marginTop: 4,
                color: '#6c766e',
                fontSize: 14,
              }}
            >
              Adicione uma fotografia à
              descoberta. Nesta primeira
              versão, usamos uma imagem por
              publicação.
            </span>

            <input
              ref={fileInputRef}
              id="discovery-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
              disabled={saving}
              onChange={
                handleImageChange
              }
              style={{
                display: 'none',
              }}
            />

            {!imageFile && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                style={{
                  width: '100%',
                  minHeight: 150,
                  marginTop: 16,
                  padding: 24,
                  border:
                    '1.5px dashed #b9c8bc',
                  borderRadius: 22,
                  background:
                    '#f7faf7',
                  color: '#315d3b',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: saving
                    ? 'wait'
                    : 'pointer',
                }}
              >
                <span>
                  <span
                    style={{
                      display:
                        'block',
                      marginBottom: 8,
                      fontSize: 30,
                    }}
                  >
                    ＋
                  </span>

                  <strong
                    style={{
                      display:
                        'block',
                      fontSize: 16,
                    }}
                  >
                    Adicionar fotografia
                  </strong>

                  <span
                    style={{
                      display:
                        'block',
                      marginTop: 5,
                      color:
                        '#738078',
                      fontSize: 13,
                    }}
                  >
                    JPEG, PNG, WebP, HEIC
                    ou HEIF · até 15 MB
                  </span>
                </span>
              </button>
            )}

            {imageFile && (
              <div
                style={{
                  marginTop: 16,
                  overflow: 'hidden',
                  border:
                    '1px solid #dde5de',
                  borderRadius: 22,
                  background:
                    '#f7faf7',
                }}
              >
                {imagePreviewUrl ? (
                  <img
                    src={
                      imagePreviewUrl
                    }
                    alt="Pré-visualização da fotografia selecionada"
                    style={{
                      width: '100%',
                      maxHeight: 440,
                      objectFit:
                        'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      minHeight: 160,
                      padding: 28,
                      display:
                        'grid',
                      placeItems:
                        'center',
                      textAlign:
                        'center',
                      color:
                        '#667068',
                    }}
                  >
                    A fotografia foi
                    selecionada. O navegador
                    não oferece
                    pré-visualização para este
                    formato, mas o arquivo
                    poderá ser enviado.
                  </div>
                )}

                <div
                  style={{
                    padding:
                      '16px 18px',
                    display: 'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'space-between',
                    gap: 14,
                    flexWrap:
                      'wrap',
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <strong
                      style={{
                        display:
                          'block',
                        maxWidth: 460,
                        overflow:
                          'hidden',
                        textOverflow:
                          'ellipsis',
                        whiteSpace:
                          'nowrap',
                        fontSize: 14,
                      }}
                    >
                      {imageFile.name}
                    </strong>

                    <span
                      style={{
                        display:
                          'block',
                        marginTop: 3,
                        color:
                          '#758078',
                        fontSize: 13,
                      }}
                    >
                      {imageSizeLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={
                      removeImage
                    }
                    style={{
                      padding:
                        '9px 13px',
                      borderRadius:
                        999,
                      background:
                        '#f0f3f0',
                      color:
                        '#5f6961',
                      fontWeight:
                        700,
                      cursor: saving
                        ? 'wait'
                        : 'pointer',
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            )}
          </div>

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
                Seus interesses já aparecem
                selecionados. Ajuste se
                quiser.
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
                {interests.map(
                  (interest) => {
                    const selected =
                      selectedIds.includes(
                        interest.id,
                      )

                    return (
                      <button
                        key={
                          interest.id
                        }
                        type="button"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          toggleInterest(
                            interest.id,
                          )
                        }
                        style={{
                          border:
                            selected
                              ? '1px solid #315d3b'
                              : '1px solid #dce3dc',
                          borderRadius:
                            999,
                          padding:
                            '9px 14px',
                          background:
                            selected
                              ? '#e4efe6'
                              : '#ffffff',
                          color:
                            selected
                              ? '#315d3b'
                              : '#59645c',
                          fontWeight:
                            700,
                          cursor:
                            saving
                              ? 'wait'
                              : 'pointer',
                        }}
                      >
                        {interest.name}
                      </button>
                    )
                  },
                )}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 34,
              paddingTop: 24,
              borderTop:
                '1px solid #edf0ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
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
                padding:
                  '14px 24px',
                background:
                  canPublish
                    ? '#315d3b'
                    : '#c9d1ca',
                color: '#ffffff',
                fontWeight: 800,
                cursor:
                  canPublish
                    ? 'pointer'
                    : 'not-allowed',
              }}
            >
              {saving
                ? imageFile
                  ? 'Enviando e publicando...'
                  : 'Publicando...'
                : 'Publicar descoberta'}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default NewDiscovery