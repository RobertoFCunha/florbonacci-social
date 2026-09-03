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

const MAX_AVATAR_SIZE =
  5 * 1024 * 1024

const ACCEPTED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

function EditProfile() {
  const navigate = useNavigate()

  const [profile, setProfile] =
    useState<Profile | null>(null)

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
  ] = useState<File | null>(null)

  const [
    currentAvatarUrl,
    setCurrentAvatarUrl,
  ] = useState<string | null>(null)

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState<string | null>(null)

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
    previewUrl || currentAvatarUrl

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
          typedProfile.display_name ??
            '',
        )

        setUsername(
          typedProfile.username ??
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

        if (
          typedProfile.avatar_path
        ) {
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
                typedProfile.avatar_path,
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
      setPreviewUrl(null)
      return
    }

    const objectUrl =
      URL.createObjectURL(
        avatarFile,
      )

    setPreviewUrl(
      objectUrl,
    )

    return () => {
      URL.revokeObjectURL(
        objectUrl,
      )
    }
  }, [avatarFile])

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
      !ACCEPTED_AVATAR_TYPES.includes(
        file.type,
      )
    ) {
      setErrorMessage(
        'Escolha uma imagem JPG, PNG ou WEBP.',
      )

      event.target.value =
        ''

      return
    }

    if (
      file.size >
      MAX_AVATAR_SIZE
    ) {
      setErrorMessage(
        'A foto deve ter no máximo 5 MB.',
      )

      event.target.value =
        ''

      return
    }

    setAvatarFile(file)
  }

  async function uploadAvatar(
    userId: string,
  ) {
    if (!avatarFile) {
      return profile?.avatar_path ??
        null
    }

    const extension =
      avatarFile.name
        .split('.')
        .pop()
        ?.toLowerCase() ||
      'jpg'

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

    try {
      newAvatarPath =
        await uploadAvatar(
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
          })
          .eq(
            'id',
            profile.id,
          )

      if (updateError) {
        throw updateError
      }

      if (
        avatarFile &&
        newAvatarPath
      ) {
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
              newAvatarPath,
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

        setAvatarFile(null)
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
        'Perfil atualizado com sucesso.',
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
            Mostre quem está por trás das descobertas.
          </h1>

          <p style={styles.subtitle}>
            Sua foto e algumas palavras ajudam outras pessoas a reconhecer quem compartilha as mesmas curiosidades.
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
                JPG, PNG ou WEBP · até 5 MB
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
            </div>
          </section>

          <div style={styles.formGrid}>
            <label style={styles.field}>
              <span style={styles.label}>
                Nome
              </span>

              <input
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value,
                  )
                }
                placeholder="Como você quer ser chamado?"
                maxLength={100}
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>
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
                      event.target.value,
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
              <span style={styles.label}>
                Bio
              </span>

              <textarea
                value={bio}
                onChange={(event) =>
                  setBio(
                    event.target.value,
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

            <label style={styles.field}>
              <span style={styles.label}>
                Cidade
              </span>

              <input
                type="text"
                value={city}
                onChange={(event) =>
                  setCity(
                    event.target.value,
                  )
                }
                placeholder="Belém"
                maxLength={100}
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>
                Estado
              </span>

              <input
                type="text"
                value={state}
                onChange={(event) =>
                  setState(
                    event.target.value,
                  )
                }
                placeholder="Pará"
                maxLength={100}
                style={styles.input}
              />
            </label>

            <label
              style={{
                ...styles.field,
                ...styles.fullWidth,
              }}
            >
              <span style={styles.label}>
                País
              </span>

              <input
                type="text"
                value={country}
                onChange={(event) =>
                  setCountry(
                    event.target.value,
                  )
                }
                placeholder="Brasil"
                maxLength={100}
                style={styles.input}
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
    letterSpacing: '0.14em',
  },

  title: {
    maxWidth: 650,
    margin: '7px 0 0',
    fontSize:
      'clamp(2rem, 7vw, 3rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
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

  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
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
    justifyContent: 'center',
    color: '#476952',
    fontSize: 36,
    fontWeight: 800,
  },

  avatarActions: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
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

  photoButton: {
    marginTop: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
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
      'repeat(2, minmax(0, 1fr))',
    gap: 18,
    marginTop: 24,
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
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
    boxSizing: 'border-box',
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
    boxSizing: 'border-box',
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
    background: 'transparent',
    padding: '13px 14px 13px 4px',
    color: '#27392f',
    fontFamily: 'inherit',
    fontSize: 15,
    outline: 'none',
  },

  textarea: {
    width: '100%',
    boxSizing: 'border-box',
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
    alignSelf: 'flex-end',
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