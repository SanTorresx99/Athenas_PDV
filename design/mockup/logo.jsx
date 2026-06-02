// logo.jsx — three logo concepts + icon set for ATHENAS

// ─────────────────────────────────────────────────────────────────────────────
// BRAND COLOR BRIDGE — reads CSS variables reactively for AthenasSymbol props
// ─────────────────────────────────────────────────────────────────────────────

function readCssVars() {
  const s = getComputedStyle(document.documentElement);
  return {
    primary: s.getPropertyValue('--primary').trim(),
    accent:  s.getPropertyValue('--accent').trim(),
  };
}

function useBrandColors() {
  const [colors, setColors] = React.useState(readCssVars);
  React.useEffect(() => {
    const obs = new MutationObserver(() => setColors(readCssVars()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent', 'data-subtheme'] });
    return () => obs.disconnect();
  }, []);
  return colors;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGO MARKS — 3 directions
// ─────────────────────────────────────────────────────────────────────────────

function LogoMark({ variant = 'pilar', size = 32, tone = 'duo' /* duo | mono | inverse */ }) {
  const colors = useBrandColors();
  // tone: duo = primary + accent, mono = monochrome, inverse = white on primary tile
  const primary = tone === 'mono' ? 'currentColor' : 'var(--primary)';
  const accent  = tone === 'mono' ? 'currentColor' : 'var(--accent)';
  const tile    = tone === 'inverse' ? 'var(--primary)' : 'transparent';

  if (variant === 'monograma') {
    // Bold geometric "A" — two slabs meeting at apex, with a notched crossbar
    // The notch in the crossbar implies a hidden S curve / T riser
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} aria-label="Athenas">
        {tile !== 'transparent' && <rect width="40" height="40" rx="9" fill={tile} />}
        <g fill={primary}>
          {/* Left slab */}
          <path d="M 5 35 L 16.5 5 L 22 5 L 10.5 35 Z" />
          {/* Right slab */}
          <path d="M 17.5 5 L 23 5 L 35 35 L 29.5 35 Z" />
        </g>
        {/* Crossbar with offset notch (the "S/T" integration) */}
        <path d="M 12.5 22 L 27.5 22 L 26 26 L 14 26 Z" fill={accent} />
      </svg>
    );
  }

  if (variant === 'fluxo') {
    // Two interlocking arcs forming an implicit A — flow / continuity
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} aria-label="Athenas">
        {tile !== 'transparent' && <rect width="40" height="40" rx="9" fill={tile} />}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Left arc rising */}
          <path d="M 6 33 Q 6 12 20 12" stroke={primary} strokeWidth="4.5" />
          {/* Right arc descending */}
          <path d="M 20 12 Q 34 12 34 33" stroke={primary} strokeWidth="4.5" />
          {/* Connector node — the apex */}
          <circle cx="20" cy="12" r="3.2" fill={accent} stroke="none" />
          {/* Flow ticks at base */}
          <line x1="6" y1="33" x2="13" y2="33" stroke={accent} strokeWidth="4.5" />
        </g>
      </svg>
    );
  }

  // pilar (default) — símbolo oficial ATHENAS (pilar grego + tocha + fumaça em S)
  // Usa AthenasSymbol do LOGOTIPO, adaptado às cores do tema do MOKUP VISUAL.
  if (tone === 'inverse') {
    const pad = Math.round(size * 0.14);
    return (
      <div style={{ background: colors.primary, borderRadius: Math.round(size * 0.23), padding: pad, display: 'inline-flex', lineHeight: 0 }}>
        <AthenasSymbol size={size - pad * 2} primary="rgba(255,255,255,0.95)" accent="rgba(255,255,255,0.95)" />
      </div>
    );
  }
  return (
    <AthenasSymbol
      size={size}
      primary={colors.primary}
      accent={colors.accent}
      monochrome={tone === 'mono'}
    />
  );
}

function LogoLockup({ variant = 'pilar', size = 28, tone = 'duo', tag = false, weight = 700, highlightST = true }) {
  // ATHENAS — destaca T (posição 1) e S (posição 6) em cor de acento.
  // Iniciais ocultas: ST = Sandro Torres.
  const letters = 'ATHENAS'.split('');
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, lineHeight: 1 }}>
      <LogoMark variant={variant} size={size} tone={tone} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontFamily: '"Sora", system-ui, sans-serif',
          fontWeight: weight,
          fontSize: size * 0.62,
          letterSpacing: '-.005em',
          color: 'var(--text)',
          display: 'inline-flex',
        }}>
          {letters.map((ch, i) => {
            const isST = highlightST && ((ch === 'T' && i === 1) || (ch === 'S' && i === letters.length - 1));
            return (
              <span key={i} style={{
                color: isST ? 'var(--accent)' : 'inherit',
              }}>{ch}</span>
            );
          })}
        </span>
        {tag && (
          <span style={{
            fontSize: size * 0.30,
            fontWeight: 500,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}>
            PDV · Gestão
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ICON SET — outline, 1.5 stroke, 20×20 grid (lucide-like, original drawings)
// ─────────────────────────────────────────────────────────────────────────────
function Icon({ name, size = 18, stroke = 1.6, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
              stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round',
              strokeLinejoin: 'round', style };
  switch (name) {
    case 'dashboard': return (<svg {...p}><rect x="3" y="3" width="8" height="9" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/></svg>);
    case 'pdv': return (<svg {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><circle cx="8" cy="16" r="1"/><circle cx="12" cy="16" r="1"/><circle cx="16" cy="16" r="1"/></svg>);
    case 'products': return (<svg {...p}><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>);
    case 'stock': return (<svg {...p}><rect x="3" y="4" width="18" height="5" rx="1"/><rect x="3" y="11" width="18" height="9" rx="1"/><path d="M9 15h6"/></svg>);
    case 'finance': return (<svg {...p}><path d="M12 2v20"/><path d="M17 6H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6"/></svg>);
    case 'reports': return (<svg {...p}><path d="M3 21V3"/><path d="M3 21h18"/><path d="M7 17v-5"/><path d="M12 17v-9"/><path d="M17 17v-7"/></svg>);
    case 'clients': return (<svg {...p}><circle cx="9" cy="8" r="3.5"/><path d="M3 21a6 6 0 0 1 12 0"/><circle cx="17" cy="10" r="2.5"/><path d="M21 19a4 4 0 0 0-6-3.46"/></svg>);
    case 'settings': return (<svg {...p}><circle cx="12" cy="12" r="2.5"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 4.17 16.93l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 8.9 1.7 1.7 0 0 0 4.3 7.03l-.06-.06A2 2 0 1 1 7.07 4.14l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/></svg>);
    case 'search': return (<svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>);
    case 'bell': return (<svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>);
    case 'plus': return (<svg {...p}><path d="M12 5v14M5 12h14"/></svg>);
    case 'minus': return (<svg {...p}><path d="M5 12h14"/></svg>);
    case 'trash': return (<svg {...p}><path d="M4 6h16"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>);
    case 'check': return (<svg {...p}><path d="m20 6-11 11-5-5"/></svg>);
    case 'arrow-right': return (<svg {...p}><path d="M5 12h14"/><path d="m13 5 7 7-7 7"/></svg>);
    case 'arrow-up': return (<svg {...p}><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>);
    case 'arrow-down': return (<svg {...p}><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>);
    case 'trend-up': return (<svg {...p}><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>);
    case 'card': return (<svg {...p}><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/></svg>);
    case 'cash': return (<svg {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M5 12h.01M19 12h.01"/></svg>);
    case 'pix': return (<svg {...p}><path d="M12 3 21 12 12 21 3 12Z"/><path d="m7.5 7.5 4.5 4.5 4.5-4.5"/><path d="m7.5 16.5 4.5-4.5 4.5 4.5"/></svg>);
    case 'box': return (<svg {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>);
    case 'user': return (<svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>);
    case 'menu': return (<svg {...p}><path d="M4 6h16M4 12h16M4 18h16"/></svg>);
    case 'sun': return (<svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>);
    case 'moon': return (<svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>);
    case 'chevron-down': return (<svg {...p}><path d="m6 9 6 6 6-6"/></svg>);
    case 'chevron-right': return (<svg {...p}><path d="m9 6 6 6-6 6"/></svg>);
    case 'star': return (<svg {...p}><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1Z"/></svg>);
    case 'bolt': return (<svg {...p}><path d="m13 2-9 12h7l-1 8 9-12h-7Z"/></svg>);
    case 'clock': return (<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>);
    case 'filter': return (<svg {...p}><path d="M3 5h18l-7 9v6l-4-2v-4Z"/></svg>);
    case 'close': return (<svg {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>);
    case 'sparkle': return (<svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>);
    case 'wifi': return (<svg {...p}><path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M8.5 16.05a6 6 0 0 1 7 0"/><circle cx="12" cy="20" r="0.5" fill="currentColor" stroke="none"/></svg>);
    case 'palette': return (<svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="9" cy="9.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="14.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="17" cy="13" r="1.5" fill="currentColor" stroke="none"/><circle cx="14" cy="17" r="1.5" fill="currentColor" stroke="none"/><path d="M3.5 12.5c0 1.5 1 3 3 3.5"/></svg>);
    case 'whatsapp': return (<svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
    default: return null;
  }
}

Object.assign(window, { LogoMark, LogoLockup, Icon });
