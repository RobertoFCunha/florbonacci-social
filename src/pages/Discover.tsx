function Discover() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #f7f5ee 0%, #eef4ee 100%)',
        color: '#1f2a22',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 760,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 24px',
            borderRadius: 24,
            background: '#e3eee4',
            display: 'grid',
            placeItems: 'center',
            fontSize: 34,
          }}
        >
          ✨
        </div>

        <span
          style={{
            display: 'inline-block',
            marginBottom: 14,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#4d6b55',
          }}
        >
          Sua trilha começou
        </span>

        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(2.5rem, 7vw, 4.8rem)',
            lineHeight: 0.98,
            letterSpacing: '-0.04em',
          }}
        >
          Parece que temos coisas
          <br />
          para lhe mostrar.
        </h1>

        <p
          style={{
            maxWidth: 620,
            margin: '24px auto 0',
            fontSize: 19,
            lineHeight: 1.65,
            color: '#59645c',
          }}
        >
          Sua trilha começa com aquilo que desperta sua
          curiosidade. Aos poucos, cada descoberta vai revelar
          novas pessoas, lugares, ideias e caminhos.
        </p>

        <div
          style={{
            marginTop: 34,
          }}
        >
          <button
            type="button"
            style={{
              border: 0,
              borderRadius: 999,
              padding: '16px 28px',
              background: '#315d3b',
              color: '#ffffff',
              fontSize: 17,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow:
                '0 14px 30px rgba(49, 93, 59, 0.16)',
            }}
          >
            Explorar descobertas
          </button>
        </div>

        <p
          style={{
            marginTop: 26,
            fontSize: 14,
            color: '#7a847c',
          }}
        >
          Curiosidade move o mundo. Conexão transforma.
        </p>
      </section>
    </main>
  )
}

export default Discover