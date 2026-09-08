import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  ChangeEvent,
  FormEvent,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  supabase,
} from '../lib/supabaseClient'

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_path: string | null
  cover_path: string | null
  city: string | null
  state: string | null
  country: string | null
}

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

function getFileExtension(
  file: File,
) {
  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase()

  if (
    extension === 'jpg' ||
    extension === 'jpeg' ||
    extension === 'png' ||
    extension === 'webp'
  ) {
    return extension
  }

  if (
    file.type ===
    'image/png'
  ) {
    return 'png'
  }

  if (
    file.type ===
    'image/webp'
  ) {
    return 'webp'
  }

  return 'jpg'
}

function EditProfile() {
  const navigate =
    useNavigate()

  const [
    profile,
    setProfile,
  ] =
    useState<Profile | null>(
      null,
    )

  const [
    displayName,
    setDisplayName,
  ] = useState('')

  const [
    username,
    setUsername,
  ] = useState('')

  const [bio, setBio] =
    useState('')

  const [city, setCity] =
    useState('')

  const [state, setState] =
    useState('')

  const [country, setCountry] =
    useState('Brasil')

  const [
    avatarFile,
    setAvatarFile,
  ] =
    useState<File | null>(
      null,
    )

  const [
    coverFile,
    setCoverFile,
  ] =
    useState<File | null>(
      null,
    )

  const [
    currentAvatarUrl,
    setCurrentAvatarUrl,
  ] =
    useState<string | null>(
      null,
    )

  const [
    currentCoverUrl,
    setCurrentCoverUrl,
  ] =
    useState<string | null>(
      null,
    )

  const [
    avatarPreviewUrl,
    setAvatarPreviewUrl,
  ] =
    useState<string | null>(
      null,
    )

  const [
    coverPreviewUrl,
    setCoverPreviewUrl,
  ] =
    useState<string | null>(
      null,
    )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const shownAvatarUrl =
    avatarPreviewUrl ||
    currentAvatarUrl

  const shownCoverUrl =
    coverPreviewUrl ||
    currentCoverUrl

  const avatarFallback =
    useMemo(() => {
      const value =
        displayName ||
        username ||
        'F'

      return value
        .slice(0, 1)
        .toUpperCase()
    }, [
      displayName,
      username,
    ])

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
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
          await supabase.auth
            .getUser()

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
                cover_path,
                city,
                state,
                country
              `,
            )
            .eq(
              'id',
              user.id,
            )
            .maybeSingle()

        if (profileError) {
          throw profileError
        }

        if (!profileData) {
          throw new Error(
            'Perfil não encontrado.',
          )
        }

        if (cancelled) {
          return
        }

        const typedProfile =
          profileData as Profile

        setProfile(
          typedProfile,
        )

        setDisplayName(
          typedProfile
            .display_name ??
            '',
        )

        setUsername(
          typedProfile
            .username ??
            '',
        )

        setBio(
          typedProfile.bio ??
            '',
        )

        setCity(
          typedProfile.city ??
            '',
        )

        setState(
          typedProfile.state ??
            '',
        )

        setCountry(
          typedProfile.country ||
            'Brasil',
        )

        const imageRequests:
          Promise<void>[] = []

        if (
          typedProfile
            .avatar_path
        ) {
          imageRequests.push(
            (async () => {
              const {
                data:
                  signedAvatar,
                error:
                  avatarError,
              } =
                await supabase
                  .storage
                  .from(
                    'avatars',
                  )
                  .createSignedUrl(
                    typedProfile
                      .avatar_path!,
                    60 * 60,
                  )

              if (
                !avatarError &&
                signedAvatar
                  ?.signedUrl &&
                !cancelled
              ) {
                setCurrentAvatarUrl(
                  signedAvatar
                    .signedUrl,
                )
              }
            })(),
          )
        }

        if (
          typedProfile
            .cover_path
        ) {
          imageRequests.push(
            (async () => {
              const {
                data:
                  signedCover,
                error:
                  coverError,
              } =
                await supabase
                  .storage
                  .from(
                    'profile-covers',
                  )
                  .createSignedUrl(
                    typedProfile
                      .cover_path!,
                    60 * 60,
                  )

              if (
                !coverError &&
                signedCover
                  ?.signedUrl &&
                !cancelled
              ) {
                setCurrentCoverUrl(
                  signedCover
                    .signedUrl,
                )
              }
            })(),
          )
        }

        await Promise.all(
          imageRequests,
        )
      } catch (error) {
        console.error(
          'Erro ao carregar perfil:',
          error,
        )

        if (!cancelled) {
          setErrorMessage(
            'Não foi possível carregar seu perfil.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(
        null,
      )
      return
    }

    const objectUrl =
      URL.createObjectURL(
        avatarFile,
      )

    setAvatarPreviewUrl(
      objectUrl,
    )

    return () => {
      URL.revokeObjectURL(
        objectUrl,
      )
    }
  }, [avatarFile])

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(
        null,
      )
      return
    }

    const objectUrl =
      URL.createObjectURL(
        coverFile,
      )

    setCoverPreviewUrl(
      objectUrl,
    )

    return () => {
      URL.revokeObjectURL(
        objectUrl,
      )
    }
  }, [coverFile])

  function validateImage(
    file: File,
    label: string,
  ) {
    if (
      !ACCEPTED_IMAGE_TYPES
        .includes(file.type)
    ) {
      setErrorMessage(
        `${label}: escolha uma imagem JPG, PNG ou WEBP.`,
      )
      return false
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      setErrorMessage(
        `${label}: a imagem deve ter no máximo 5 MB.`,
      )
      return false
    }

    return true
  }

  function handleAvatarChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    setErrorMessage('')
    setSuccessMessage('')

    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    if (
      !validateImage(
        file,
        'Foto do perfil',
      )
    ) {
      event.target.value =
        ''
      return
    }

    setAvatarFile(file)
  }

  function handleCoverChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    setErrorMessage('')
    setSuccessMessage('')

    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    if (
      !validateImage(
        file,
        'Meu Horizonte',
      )
    ) {
      event.target.value =
        ''
      return
    }

    setCoverFile(file)
  }

  async function uploadAvatar(
    userId: string,
  ) {
    if (!avatarFile) {
      return (
        profile
          ?.avatar_path ??
        null
      )
    }

    const extension =
      getFileExtension(
        avatarFile,
      )

    const fileName =
      `avatar-${Date.now()}.${extension}`

    const storagePath =
      `${userId}/${fileName}`

    const {
      error:
        uploadError,
    } =
      await supabase.storage
        .from('avatars')
        .upload(
          storagePath,
          avatarFile,
          {
            cacheControl:
              '3600',
            upsert: false,
            contentType:
              avatarFile.type,
          },
        )

    if (uploadError) {
      throw uploadError
    }

    return storagePath
  }

  async function uploadCover(
    userId: string,
  ) {
    if (!coverFile) {
      return (
        profile
          ?.cover_path ??
        null
      )
    }

    const extension =
      getFileExtension(
        coverFile,
      )

    /*
     * Um único horizonte por
     * usuário. O caminho é
     * previsível e o arquivo é
     * substituído com upsert.
     */
    const storagePath =
      `${userId}/cover.${extension}`

    /*
     * Se a extensão da capa
     * anterior for diferente,
     * removemos o arquivo antigo
     * depois que o novo upload
     * for concluído.
     */
    const previousPath =
      profile?.cover_path ??
      null

    const {
      error:
        uploadError,
    } =
      await supabase.storage
        .from(
          'profile-covers',
        )
        .upload(
          storagePath,
          coverFile,
          {
            cacheControl:
              '3600',
            upsert: true,
            contentType:
              coverFile.type,
          },
        )

    if (uploadError) {
      throw uploadError
    }

    if (
      previousPath &&
      previousPath !==
        storagePath
    ) {
      const {
        error:
          removeError,
      } =
        await supabase.storage
          .from(
            'profile-covers',
          )
          .remove([
            previousPath,
          ])

      if (removeError) {
        console.warn(
          'Não foi possível remover a capa anterior:',
          removeError,
        )
      }
    }

    return storagePath
  }

  async function refreshAvatarUrl(
    avatarPath:
      string | null,
  ) {
    if (!avatarPath) {
      setCurrentAvatarUrl(
        null,
      )
      return
    }

    const {
      data:
        signedAvatar,
      error:
        avatarError,
    } =
      await supabase.storage
        .from('avatars')
        .createSignedUrl(
          avatarPath,
          60 * 60,
        )

    if (
      !avatarError &&
      signedAvatar?.signedUrl
    ) {
      setCurrentAvatarUrl(
        signedAvatar.signedUrl,
      )
    }
  }

  async function refreshCoverUrl(
    coverPath:
      string | null,
  ) {
    if (!coverPath) {
      setCurrentCoverUrl(
        null,
      )
      return
    }

    const {
      data:
        signedCover,
      error:
        coverError,
    } =
      await supabase.storage
        .from(
          'profile-covers',
        )
        .createSignedUrl(
          coverPath,
          60 * 60,
        )

    if (
      !coverError &&
      signedCover?.signedUrl
    ) {
      setCurrentCoverUrl(
        signedCover.signedUrl,
      )
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      saving ||
      !profile
    ) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    const trimmedDisplayName =
      displayName.trim()

    const trimmedUsername =
      username
        .trim()
        .replace(/^@/, '')
        .toLowerCase()

    if (!trimmedDisplayName) {
      setErrorMessage(
        'Informe seu nome.',
      )
      return
    }

    if (!trimmedUsername) {
      setErrorMessage(
        'Informe seu nome de usuário.',
      )
      return
    }

    if (
      !/^[a-z0-9._]+$/.test(
        trimmedUsername,
      )
    ) {
      setErrorMessage(
        'O nome de usuário pode conter apenas letras minúsculas, números, ponto e sublinhado.',
      )
      return
    }

    setSaving(true)

    let newAvatarPath =
      profile.avatar_path

    let newCoverPath =
      profile.cover_path

    try {
      newAvatarPath =
        await uploadAvatar(
          profile.id,
        )

      newCoverPath =
        await uploadCover(
          profile.id,
        )

      const {
        error:
          updateError,
      } =
        await supabase
          .from('profiles')
          .update({
            display_name:
              trimmedDisplayName,

            username:
              trimmedUsername,

            bio:
              bio.trim() ||
              null,

            city:
              city.trim() ||
              null,

            state:
              state.trim() ||
              null,

            country:
              country.trim() ||
              null,

            avatar_path:
              newAvatarPath,

            cover_path:
              newCoverPath,
          })
          .eq(
            'id',
            profile.id,
          )

      if (updateError) {
        throw updateError
      }

      if (avatarFile) {
        await refreshAvatarUrl(
          newAvatarPath,
        )
        setAvatarFile(null)
      }

      if (coverFile) {
        await refreshCoverUrl(
          newCoverPath,
        )
        setCoverFile(null)
      }

      setProfile(
        (current) =>
          current
            ? {
                ...current,

                display_name:
                  trimmedDisplayName,

                username:
                  trimmedUsername,

                bio:
                  bio.trim() ||
                  null,

                city:
                  city.trim() ||
                  null,

                state:
                  state.trim() ||
                  null,

                country:
                  country.trim() ||
                  null,

                avatar_path:
                  newAvatarPath,

                cover_path:
                  newCoverPath,
              }
            : current,
      )

      setDisplayName(
        trimmedDisplayName,
      )

      setUsername(
        trimmedUsername,
      )

      setSuccessMessage(
        'Perfil e horizonte atualizados com sucesso.',
      )
    } catch (error) {
      console.error(
        'Erro ao salvar perfil:',
        error,
      )

      setErrorMessage(
        'Não foi possível salvar as alterações.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.shell}>
          <p style={styles.status}>
            Carregando perfil...
          </p>
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
            navigate(
              profile
                ? `/profile/${profile.id}`
                : '/discover',
            )
          }
          style={styles.backButton}
        >
          ← Voltar
        </button>

        <header style={styles.header}>
          <div style={styles.eyebrow}>
            SEU PERFIL
          </div>

          <h1 style={styles.title}>
            Mostre quem está por trás
            das descobertas.
          </h1>

          <p style={styles.subtitle}>
            Seu perfil apresenta você.
            Seu horizonte mostra um
            pouco do mundo que desperta
            o seu olhar.
          </p>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
          style={styles.card}
        >
          <section
            style={
              styles.coverSection
            }
          >
            <div
              style={
                styles.coverHeader
              }
            >
              <div>
                <div
                  style={
                    styles.coverEyebrow
                  }
                >
                  MEU HORIZONTE
                </div>

                <strong
                  style={
                    styles.coverTitle
                  }
                >
                  Uma imagem do seu
                  universo
                </strong>

                <p
                  style={
                    styles.coverHint
                  }
                >
                  Escolha uma paisagem,
                  uma descoberta, uma
                  textura, uma obra ou
                  algo que represente
                  seu olhar.
                </p>
              </div>

              <label
                style={
                  styles.coverButton
                }
              >
                {shownCoverUrl
                  ? 'Alterar horizonte'
                  : 'Escolher horizonte'}

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={
                    handleCoverChange
                  }
                  style={
                    styles.hiddenInput
                  }
                />
              </label>
            </div>

            <div
              style={
                styles.coverPreview
              }
            >
              {shownCoverUrl ? (
                <img
                  src={
                    shownCoverUrl
                  }
                  alt="Meu Horizonte"
                  style={
                    styles.coverImage
                  }
                />
              ) : (
                <div
                  style={
                    styles.coverPlaceholder
                  }
                >
                  <span
                    style={
                      styles.coverPlaceholderIcon
                    }
                  >
                    ◡
                  </span>

                  <strong>
                    Seu horizonte
                    começa aqui
                  </strong>

                  <span>
                    JPG, PNG ou WEBP ·
                    até 5 MB
                  </span>
                </div>
              )}

              <div
                style={
                  styles.coverShade
                }
              />

              <div
                style={
                  styles.coverLabel
                }
              >
                Meu Horizonte
              </div>
            </div>

            {coverFile && (
              <div
                style={
                  styles.pendingImage
                }
              >
                Nova imagem selecionada.
                Ela será publicada quando
                você salvar o perfil.
              </div>
            )}
          </section>

          <section
            style={
              styles.avatarSection
            }
          >
            <div
              style={styles.avatar}
            >
              {shownAvatarUrl ? (
                <img
                  src={
                    shownAvatarUrl
                  }
                  alt="Foto do perfil"
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
                  {
                    avatarFallback
                  }
                </span>
              )}
            </div>

            <div
              style={
                styles.avatarActions
              }
            >
              <strong
                style={
                  styles.avatarTitle
                }
              >
                Foto do perfil
              </strong>

              <span
                style={
                  styles.avatarHint
                }
              >
                JPG, PNG ou WEBP ·
                até 5 MB
              </span>

              <label
                style={
                  styles.photoButton
                }
              >
                Escolher foto

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={
                    handleAvatarChange
                  }
                  style={
                    styles.hiddenInput
                  }
                />
              </label>

              {avatarFile && (
                <span
                  style={
                    styles.avatarPending
                  }
                >
                  Nova foto selecionada
                </span>
              )}
            </div>
          </section>

          <div
            style={
              styles.formGrid
            }
          >
            <label
              style={styles.field}
            >
              <span
                style={
                  styles.label
                }
              >
                Nome
              </span>

              <input
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target
                      .value,
                  )
                }
                placeholder="Como você quer ser chamado?"
                maxLength={100}
                style={
                  styles.input
                }
              />
            </label>

            <label
              style={styles.field}
            >
              <span
                style={
                  styles.label
                }
              >
                Nome de usuário
              </span>

              <div
                style={
                  styles.usernameField
                }
              >
                <span
                  style={
                    styles.atSign
                  }
                >
                  @
                </span>

                <input
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target
                        .value,
                    )
                  }
                  placeholder="seunome"
                  maxLength={60}
                  autoCapitalize="none"
                  style={
                    styles.usernameInput
                  }
                />
              </div>
            </label>

            <label
              style={{
                ...styles.field,
                ...styles.fullWidth,
              }}
            >
              <span
                style={
                  styles.label
                }
              >
                Bio
              </span>

              <textarea
                value={bio}
                onChange={(event) =>
                  setBio(
                    event.target
                      .value,
                  )
                }
                placeholder="Conte brevemente o que desperta sua curiosidade."
                maxLength={300}
                rows={4}
                style={
                  styles.textarea
                }
              />

              <span
                style={
                  styles.counter
                }
              >
                {bio.length}/300
              </span>
            </label>

            <label
              style={styles.field}
            >
              <span
                style={
                  styles.label
                }
              >
                Cidade
              </span>

              <input
                type="text"
                value={city}
                onChange={(event) =>
                  setCity(
                    event.target
                      .value,
                  )
                }
                placeholder="Belém"
                maxLength={100}
                style={
                  styles.input
                }
              />
            </label>

            <label
              style={styles.field}
            >
              <span
                style={
                  styles.label
                }
              >
                Estado
              </span>

              <input
                type="text"
                value={state}
                onChange={(event) =>
                  setState(
                    event.target
                      .value,
                  )
                }
                placeholder="Pará"
                maxLength={100}
                style={
                  styles.input
                }
              />
            </label>

            <label
              style={{
                ...styles.field,
                ...styles.fullWidth,
              }}
            >
              <span
                style={
                  styles.label
                }
              >
                País
              </span>

              <input
                type="text"
                value={country}
                onChange={(event) =>
                  setCountry(
                    event.target
                      .value,
                  )
                }
                placeholder="Brasil"
                maxLength={100}
                style={
                  styles.input
                }
              />
            </label>
          </div>

          {errorMessage && (
            <div
              style={
                styles.errorMessage
              }
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              style={
                styles.successMessage
              }
            >
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.saveButton,

              opacity:
                saving
                  ? 0.65
                  : 1,

              cursor:
                saving
                  ? 'default'
                  : 'pointer',
            }}
          >
            {saving
              ? 'Salvando...'
              : 'Salvar perfil'}
          </button>
        </form>
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
    boxSizing: 'border-box',
  },

  shell: {
    width: '100%',
    maxWidth: 760,
    margin: '0 auto',
  },

  backButton: {
    appearance: 'none',
    border: 0,
    background:
      'transparent',
    padding: '8px 0',
    marginBottom: 18,
    color: '#42634e',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },

  header: {
    marginBottom: 24,
  },

  eyebrow: {
    color: '#66806e',
    fontSize: 11,
    fontWeight: 900,
    letterSpacing:
      '0.14em',
  },

  title: {
    maxWidth: 650,
    margin: '7px 0 0',
    fontSize:
      'clamp(2rem, 7vw, 3rem)',
    lineHeight: 1.05,
    letterSpacing:
      '-0.04em',
  },

  subtitle: {
    maxWidth: 620,
    margin: '14px 0 0',
    color: '#6e7b73',
    fontSize: 15,
    lineHeight: 1.6,
  },

  card: {
    background: '#fffef9',
    border:
      '1px solid rgba(45, 76, 56, 0.10)',
    borderRadius: 26,
    padding: '24px',
    boxShadow:
      '0 16px 42px rgba(39, 63, 47, 0.08)',
  },

  coverSection: {
    paddingBottom: 24,
    borderBottom:
      '1px solid rgba(35, 58, 43, 0.08)',
  },

  coverHeader: {
    display: 'flex',
    alignItems:
      'flex-start',
    justifyContent:
      'space-between',
    gap: 18,
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  coverEyebrow: {
    color: '#66806e',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing:
      '0.14em',
    marginBottom: 5,
  },

  coverTitle: {
    display: 'block',
    color: '#294334',
    fontSize: 18,
  },

  coverHint: {
    maxWidth: 470,
    margin: '6px 0 0',
    color: '#7b877f',
    fontSize: 12,
    lineHeight: 1.5,
  },

  coverButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent:
      'center',
    flexShrink: 0,
    borderRadius: 13,
    padding: '10px 14px',
    background: '#315e3d',
    color: '#fff',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },

  coverPreview: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    aspectRatio: '3 / 1',
    minHeight: 150,
    borderRadius: 20,
    background:
      'linear-gradient(135deg, #dce9dc 0%, #b7d1bb 48%, #789d80 100%)',
    border:
      '1px solid rgba(48, 84, 59, 0.12)',
  },

  coverImage: {
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'cover',
  },

  coverPlaceholder: {
    width: '100%',
    height: '100%',
    minHeight: 150,
    boxSizing:
      'border-box',
    display: 'flex',
    flexDirection:
      'column',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 5,
    padding: 20,
    textAlign: 'center',
    color: '#355c42',
    background:
      'radial-gradient(circle at 50% 100%, rgba(255,255,255,0.55), transparent 38%)',
  },

  coverPlaceholderIcon: {
    fontSize: 34,
    lineHeight: 1,
    opacity: 0.7,
  },

  coverShade: {
    pointerEvents: 'none',
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, transparent 48%, rgba(18, 45, 29, 0.28) 100%)',
  },

  coverLabel: {
    position: 'absolute',
    left: 16,
    bottom: 13,
    zIndex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing:
      '0.05em',
    textShadow:
      '0 1px 5px rgba(0,0,0,0.28)',
  },

  pendingImage: {
    marginTop: 9,
    color: '#66806e',
    fontSize: 11,
    fontWeight: 700,
  },

  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    paddingTop: 24,
    paddingBottom: 24,
    borderBottom:
      '1px solid rgba(35, 58, 43, 0.08)',
  },

  avatar: {
    width: 104,
    height: 104,
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
    justifyContent:
      'center',
    color: '#476952',
    fontSize: 36,
    fontWeight: 800,
  },

  avatarActions: {
    minWidth: 0,
    display: 'flex',
    flexDirection:
      'column',
    alignItems:
      'flex-start',
    gap: 6,
  },

  avatarTitle: {
    color: '#294334',
    fontSize: 17,
  },

  avatarHint: {
    color: '#7b877f',
    fontSize: 12,
  },

  avatarPending: {
    color: '#66806e',
    fontSize: 11,
    fontWeight: 700,
  },

  photoButton: {
    marginTop: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent:
      'center',
    borderRadius: 13,
    padding: '10px 14px',
    background: '#e9f0e8',
    color: '#365b43',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },

  hiddenInput: {
    display: 'none',
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(230px, 1fr))',
    gap: 18,
    marginTop: 24,
  },

  field: {
    display: 'flex',
    flexDirection:
      'column',
    gap: 7,
  },

  fullWidth: {
    gridColumn: '1 / -1',
  },

  label: {
    color: '#42564a',
    fontSize: 13,
    fontWeight: 800,
  },

  input: {
    width: '100%',
    boxSizing:
      'border-box',
    border:
      '1px solid rgba(54, 87, 65, 0.17)',
    borderRadius: 14,
    padding: '13px 14px',
    background: '#fbfbf7',
    color: '#27392f',
    fontFamily: 'inherit',
    fontSize: 15,
    outline: 'none',
  },

  usernameField: {
    width: '100%',
    boxSizing:
      'border-box',
    display: 'flex',
    alignItems: 'center',
    border:
      '1px solid rgba(54, 87, 65, 0.17)',
    borderRadius: 14,
    background: '#fbfbf7',
    overflow: 'hidden',
  },

  atSign: {
    paddingLeft: 14,
    color: '#78907e',
    fontWeight: 800,
  },

  usernameInput: {
    minWidth: 0,
    width: '100%',
    border: 0,
    background:
      'transparent',
    padding:
      '13px 14px 13px 4px',
    color: '#27392f',
    fontFamily: 'inherit',
    fontSize: 15,
    outline: 'none',
  },

  textarea: {
    width: '100%',
    boxSizing:
      'border-box',
    resize: 'vertical',
    minHeight: 110,
    border:
      '1px solid rgba(54, 87, 65, 0.17)',
    borderRadius: 14,
    padding: '13px 14px',
    background: '#fbfbf7',
    color: '#27392f',
    fontFamily: 'inherit',
    fontSize: 15,
    lineHeight: 1.5,
    outline: 'none',
  },

  counter: {
    alignSelf:
      'flex-end',
    color: '#8a948e',
    fontSize: 11,
  },

  errorMessage: {
    marginTop: 20,
    borderRadius: 14,
    padding: '12px 14px',
    background: '#fff0ee',
    color: '#a44949',
    fontSize: 13,
  },

  successMessage: {
    marginTop: 20,
    borderRadius: 14,
    padding: '12px 14px',
    background: '#edf5ed',
    color: '#3e6949',
    fontSize: 13,
  },

  saveButton: {
    width: '100%',
    marginTop: 22,
    border: 0,
    borderRadius: 16,
    padding: '14px 18px',
    background: '#315e3d',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: 15,
    fontWeight: 800,
  },

  status: {
    marginTop: 70,
    color: '#758078',
    textAlign: 'center',
  },
}

export default EditProfile