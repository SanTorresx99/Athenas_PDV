// ATHENAS PDV — Símbolo
// Anatomia:
//   T = Pilar grego (capitel + fuste + base) — cor primária
//   S = Fumaça da tocha de Atena (estilo "combo") — cor de acento
//   Tocha (cuia trapezoidal + cabo) sustenta a fumaça em frente ao pilar
//   Partícula decorativa próxima ao topo
// Assinatura oculta ST: tocha (S) + pilar (T) → iniciais de Sandro Torres

// =================================================
// SMOKE — fumaça em S "combo"
//   diagonal em leque + caracol na 3ª linha + tracejado irregular
// =================================================
//
// Convenções:
//  - viewBox compartilhado com AthenasSymbol (0 0 240 300)
//  - origem da fumaça: ~ (120, 122) (topo da cuia)
//  - extremidade superior ultrapassa o capitel (~ y < 20)

const Smoke = ({ a, monochrome }) => {
  const dim = monochrome ? 0.55 : 0.72;
  const common = {
    stroke: a,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  return (
    <g>
      {/* Linha interna (curta, inclinação leve) */}
      <path d="M 106 122 C 128 102, 122 86, 116 70 C 110 54, 124 38, 138 22"
            {...common} strokeWidth="2.4" strokeDasharray="20 6 10 5 14 7" opacity={dim} />
      {/* Linha central (média) */}
      <path d="M 114 122 C 140 100, 132 80, 124 64 C 116 48, 134 30, 154 16"
            {...common} strokeWidth="2.6" strokeDasharray="24 5 12 8 18 6" />
      {/* Linha externa com caracol */}
      <path d="M 122 122
               C 150 98, 138 74, 128 58
               C 118 42, 142 24, 164 14
               C 178 10, 184 24, 172 30
               C 162 34, 162 22, 172 20"
            {...common} strokeWidth="2.4" strokeDasharray="28 6 12 5 16 8" opacity={dim} />
      <line x1="156" y1="38" x2="164" y2="32" stroke={a} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="148" cy="50" r="1.6" fill={a} opacity={dim} />
    </g>
  );
};

const AthenasSymbol = ({
  primary = '#0E2A47',
  accent  = '#D4A24C',
  highlight = 'rgba(255,255,255,0.32)',
  size = 240,
  showFlame = true,
  showTorch = true,
  showPillar = true,
  monochrome = false,
  cutoutColor = null,   // se setado: desenha fumaça e sombra da tocha (cor de fundo)
                        // sobre o pilar — efeito "vazado" no monocromo
  className = '',
  style = {},
}) => {
  const p = monochrome ? primary : primary;
  const a = monochrome ? primary : accent;
  const h = monochrome ? 'rgba(255,255,255,0.18)' : highlight;
  const uid = React.useId().replace(/:/g, '');
  const clipId = `pillar-clip-${uid}`;
  const hasCutout = !!cutoutColor && showPillar;
  return (
    <svg
      viewBox="0 0 240 300"
      width={size}
      height={size * 300 / 240}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ATHENAS PDV"
    >
      {hasCutout && (
        <defs>
          {/* clipPath do pilar — usado para o efeito vazado */}
          <clipPath id={clipId}>
            <rect x="46" y="60" width="148" height="11" rx="1" />
            <path d="M 54 71 L 186 71 L 176 82 L 64 82 Z" />
            <rect x="93" y="82" width="54" height="3.5" />
            <rect x="97" y="85.5" width="46" height="158" />
            <rect x="93" y="243.5" width="54" height="3.5" />
            <path d="M 64 247 L 176 247 L 186 258 L 54 258 Z" />
            <rect x="46" y="258" width="148" height="14" rx="1" />
          </clipPath>
        </defs>
      )}

      {/* ============== PILAR (T) ============== */}
      {showPillar && (
        <g fill={p}>
          {/* Abacus — slab superior */}
          <rect x="46" y="60" width="148" height="11" rx="1" />
          {/* Echinus — coxim trapezoidal */}
          <path d="M 54 71 L 186 71 L 176 82 L 64 82 Z" />
          {/* Anel de pescoço */}
          <rect x="93" y="82" width="54" height="3.5" />
          {/* Fuste — shaft */}
          <rect x="97" y="85.5" width="46" height="158" />
          {/* Anel inferior */}
          <rect x="93" y="243.5" width="54" height="3.5" />
          {/* Toro — base arredondada */}
          <path d="M 64 247 L 176 247 L 186 258 L 54 258 Z" />
          {/* Plinth — slab inferior */}
          <rect x="46" y="258" width="148" height="14" rx="1" />
        </g>
      )}

      {/* ============== TOCHA + CHAMA (S) ============== */}
      {showTorch && (
        <g>
          {/* Cabo (handle) — atrás do fuste a partir da metade */}
          <rect x="113" y="156" width="14" height="78" fill={a} />
          {/* Cuia trapezoidal */}
          <path d="M 94 122 L 146 122 L 138 158 L 102 158 Z" fill={a} />
          {/* Realce metálico (banda fina no topo da cuia) */}
          <rect x="96" y="127" width="48" height="2.5" fill={h} />
          {/* Sombra sutil sob a cuia para destacar do fuste */}
          <rect x="102" y="156" width="36" height="2" fill="rgba(0,0,0,0.18)" />
        </g>
      )}

      {/* ===== SOMBRA VAZADA DA TOCHA (somente onde sobrepõe o pilar) ===== */}
      {hasCutout && showTorch && (
        <g clipPath={`url(#${clipId})`} fill="none" stroke={cutoutColor} strokeLinejoin="round">
          {/* Contorno fino do cabo */}
          <rect x="113" y="156" width="14" height="78" strokeWidth="1" />
          {/* Hairline central do cabo (vincado) */}
          <line x1="120" y1="156" x2="120" y2="234" strokeWidth="0.6" opacity="0.7" />
          {/* Contorno fino da cuia */}
          <path d="M 94 122 L 146 122 L 138 158 L 102 158 Z" strokeWidth="1" />
          {/* Banda metálica vazada no topo da cuia */}
          <line x1="96" y1="128" x2="144" y2="128" strokeWidth="0.8" />
        </g>
      )}

      {/* ============== FUMAÇA (S) ============== */}
      {showFlame && <Smoke a={a} monochrome={monochrome} />}

      {/* ===== FUMAÇA VAZADA (somente onde sobrepõe o pilar) ===== */}
      {hasCutout && showFlame && (
        <g clipPath={`url(#${clipId})`}>
          <Smoke a={cutoutColor} monochrome={false} />
        </g>
      )}
    </svg>
  );
};

// ============ WORDMARK ============
// "ATHENAS" — T e S em cor de acento (assinatura oculta ST)
// "PDV" — descritor secundário
const AthenasWordmark = ({
  primary = '#0E2A47',
  accent  = '#D4A24C',
  size = 64,
  showPdv = true,
  monochrome = false,
  letterSpacing = '0.04em',
  weight = 700,
  style = {},
}) => {
  const p = primary;
  const a = monochrome ? primary : accent;
  const letters = 'ATHENAS'.split('');
  // T = index 1, S = index 6
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: `${size * 0.22}px`,
        fontFamily: '"Sora", system-ui, sans-serif',
        ...style,
      }}
    >
      <span
        style={{
          fontSize: `${size}px`,
          fontWeight: weight,
          letterSpacing,
          lineHeight: 1,
          color: p,
          display: 'inline-flex',
        }}
      >
        {letters.map((ch, i) => (
          <span
            key={i}
            style={{
              color: (i === 1 || i === 6) ? a : p,
            }}
          >
            {ch}
          </span>
        ))}
      </span>
      {showPdv && (
        <span
          style={{
            fontSize: `${size * 0.42}px`,
            fontWeight: 500,
            letterSpacing: '0.22em',
            color: p,
            opacity: 0.62,
            fontFamily: '"JetBrains Mono", "Sora", monospace',
          }}
        >
          PDV
        </span>
      )}
    </div>
  );
};

// ============ LOCKUPS ============

// Horizontal: símbolo à esquerda, wordmark à direita
const AthenasLockupH = ({
  primary,
  accent,
  symbolSize = 110,
  wordSize = 56,
  gap,
  showPdv = true,
  monochrome = false,
  cutoutColor = null,
  style = {},
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: gap ?? `${symbolSize * 0.22}px`,
      ...style,
    }}
  >
    <AthenasSymbol
      primary={primary}
      accent={accent}
      monochrome={monochrome}
      cutoutColor={cutoutColor}
      size={symbolSize * 240 / 300}
    />
    <AthenasWordmark
      primary={primary}
      accent={accent}
      size={wordSize}
      showPdv={showPdv}
      monochrome={monochrome}
    />
  </div>
);

// Vertical: símbolo acima, wordmark abaixo
const AthenasLockupV = ({
  primary,
  accent,
  symbolSize = 140,
  wordSize = 48,
  showPdv = true,
  monochrome = false,
  cutoutColor = null,
  style = {},
}) => (
  <div
    style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: `${symbolSize * 0.14}px`,
      ...style,
    }}
  >
    <AthenasSymbol
      primary={primary}
      accent={accent}
      monochrome={monochrome}
      cutoutColor={cutoutColor}
      size={symbolSize * 240 / 300}
    />
    <AthenasWordmark
      primary={primary}
      accent={accent}
      size={wordSize}
      showPdv={showPdv}
      monochrome={monochrome}
    />
  </div>
);

Object.assign(window, {
  AthenasSymbol,
  AthenasWordmark,
  AthenasLockupH,
  AthenasLockupV,
  Smoke,
});
