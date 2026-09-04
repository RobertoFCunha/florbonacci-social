import { useLocation, useNavigate } from 'react-router-dom'

type MainNavigationProps = {
  currentUserId: string | null
}

type NavigationItem = {
  label: string
  icon: string
  path?: string
  action?: 'new' | 'profile'
}

export default function MainNavigation({
  currentUserId,
}: MainNavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const items: NavigationItem[] = [
    {
      label: 'Descobrir',
      icon: '🌿',
      path: '/discover',
    },
    {
    label: 'Explorar',
    icon: '⌕',
    path: '/explore',
    },
    {
      label: 'Descobrir',
      icon: '+',
      action: 'new',
    },
    {
    label: 'Atividade',
    icon: '♡',
    path: '/activity',
    },
    {
      label: 'Eu',
      icon: '◉',
      action: 'profile',
    },
  ]

  function handleNavigation(
    item: NavigationItem,
  ) {
    if (item.action === 'new') {
      navigate('/discover/new')
      return
    }

    if (
      item.action === 'profile' &&
      currentUserId
    ) {
      navigate(
        `/profile/${currentUserId}`,
      )
      return
    }

    if (item.path) {
      navigate(item.path)
    }
  }

  function isActive(
    item: NavigationItem,
  ) {
    if (
      item.path === '/discover' &&
      location.pathname === '/discover'
    ) {
      return true
    }

    if (
      item.action === 'profile' &&
      currentUserId &&
      location.pathname ===
        `/profile/${currentUserId}`
    ) {
      return true
    }

    return false
  }

  return (
    <nav
      aria-label="Navegação principal"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 16,
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: 'min(calc(100% - 24px), 720px)',
        padding: '8px 10px',
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        alignItems: 'center',
        background:
          'rgba(255, 255, 255, 0.96)',
        border:
          '1px solid rgba(43, 70, 54, 0.12)',
        borderRadius: 24,
        boxShadow:
          '0 14px 40px rgba(35, 59, 46, 0.16)',
        backdropFilter: 'blur(14px)',
      }}
    >
      {items.map((item, index) => {
        const active = isActive(item)
        const isNew =
          item.action === 'new'

        return (
          <button
            key={`${item.label}-${index}`}
            type="button"
            onClick={() =>
              handleNavigation(item)
            }
            disabled={
              item.action === 'profile' &&
              !currentUserId
            }
            aria-label={
              isNew
                ? 'Fazer nova descoberta'
                : item.label
            }
            style={{
              appearance: 'none',
              border: 0,
              background: 'transparent',
              padding: isNew
                ? '2px 4px'
                : '7px 4px',
              margin: 0,
              minWidth: 0,
              fontFamily: 'inherit',
              color: active
                ? '#2f6b4f'
                : '#78857c',
              cursor:
                item.action === 'profile' &&
                !currentUserId
                  ? 'default'
                  : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            {isNew ? (
              <span
                aria-hidden="true"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: '#2f6b4f',
                  color: '#fff',
                  fontSize: 29,
                  fontWeight: 400,
                  lineHeight: 1,
                  boxShadow:
                    '0 7px 18px rgba(47, 107, 79, 0.24)',
                }}
              >
                +
              </span>
            ) : (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: 20,
                    lineHeight: 1,
                    fontWeight: 700,
                  }}
                >
                  {item.icon}
                </span>

                <span
                  style={{
                    fontSize: 10,
                    lineHeight: 1.2,
                    fontWeight: active
                      ? 800
                      : 650,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </span>
              </>
            )}
          </button>
        )
      })}
    </nav>
  )
}