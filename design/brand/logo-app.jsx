// ATHENAS PDV — Canvas de design
// Estrutura: Anatomia → Paletas → Variações → Aplicações
// Fumaça (S): estilo "combo" único e definitivo.

// ============== PALETAS ==============
const PALETTES = [
  {
    id: 'indigo-lavanda',
    name: 'Indigo & Lavanda',
    note: 'Tech moderna — diferencial em mercado conservador',
    primary: '#241B4D',
    accent:  '#9C7FF0',
    bg:      '#F4F1FA',
    surface: '#FFFFFF',
  },
  {
    id: 'marinho-prata',
    name: 'Marinho & Prata',
    note: 'Naval + high-tech — sólido e elegante',
    primary: '#0E2538',
    accent:  '#8C97AC',
    bg:      '#ECEEF3',
    surface: '#FFFFFF',
  },
  {
    id: 'marinho-ouro',
    name: 'Marinho & Ouro',
    note: 'Corporativo, confiável — sistemas financeiros',
    primary: '#0E2A47',
    accent:  '#D4A24C',
    bg:      '#F6F2E9',
    surface: '#FFFFFF',
  },
  {
    id: 'marmore-bronze',
    name: 'Mármore & Bronze',
    note: 'Clássico grego premium — alta percepção de valor',
    primary: '#2B2421',
    accent:  '#C8943B',
    bg:      '#F4EFE7',
    surface: '#FFFFFF',
  },
  {
    id: 'tinta-prata',
    name: 'Tinta & Prata',
    note: 'Minimalista, neutro — funciona em qualquer contexto',
    primary: '#111114',
    accent:  '#9DA4B2',
    bg:      '#F2F3F5',
    surface: '#FFFFFF',
  },
  {
    id: 'esmeralda-cobre',
    name: 'Esmeralda & Cobre',
    note: 'Operação e crescimento — varejo em expansão',
    primary: '#0F4A3A',
    accent:  '#C97942',
    bg:      '#F2EEE2',
    surface: '#FFFFFF',
  },
  {
    id: 'terracota-grafite',
    name: 'Terracota & Grafite',
    note: 'Brasil, varejo local — calor e proximidade',
    primary: '#8B2E1F',
    accent:  '#2B2421',
    bg:      '#F0E5D2',
    surface: '#FFFFFF',
  },
];

const ACTIVE = PALETTES[0]; // Indigo & Lavanda como base do canvas

// ============== ANATOMIA ==============

const AnatomyComposition = () => (
  <div style={{
    width: '100%', height: '100%',
    display: 'grid', placeItems: 'center',
    background: ACTIVE.bg,
    padding: 32,
  }}>
    <AthenasSymbol primary={ACTIVE.primary} accent={ACTIVE.accent} size={300} />
  </div>
);

const AnatomyExploded = () => {
  const labelStyle = {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 11,
    color: ACTIVE.primary,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };
  return (
    <div style={{
      width: '100%', height: '100%',
      background: ACTIVE.bg,
      padding: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <div style={{ position: 'relative', width: 540, height: 480 }}>
        {/* Vista explodida — 3 cópias do símbolo lado a lado, cada uma com só uma parte visível */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          alignItems: 'end',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <AthenasSymbol primary={ACTIVE.primary} accent={ACTIVE.accent} showFlame={false} showTorch={false} size={130} />
            <div style={labelStyle}>01 · Pilar (T)</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <AthenasSymbol primary={ACTIVE.primary} accent={ACTIVE.accent} showFlame={false} showPillar={false} size={130} />
            <div style={labelStyle}>02 · Tocha</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <AthenasSymbol primary={ACTIVE.primary} accent={ACTIVE.accent} showTorch={false} showPillar={false} size={130} />
            <div style={labelStyle}>03 · Fumaça (S) + partícula</div>
          </div>
        </div>
        <div style={{
          marginTop: 36,
          paddingTop: 24,
          borderTop: `1px solid ${ACTIVE.primary}22`,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 32,
        }}>
          <div style={{
            fontFamily: '"Sora", sans-serif',
            fontSize: 13,
            lineHeight: 1.55,
            color: ACTIVE.primary,
            opacity: 0.85,
          }}>
            <div style={{ ...labelStyle, marginBottom: 8 }}>Anatomia</div>
            O <b>pilar grego em T</b> ancora a marca — capitel + fuste + base, cor primária.
            A <b>tocha de Atena</b> (cuia trapezoidal + cabo) sustenta a chama, com pequeno
            realce metálico. A <b>fumaça em S</b> sobe em três linhas tracejadas — diagonal
            em leque, com a linha externa fechando em caracol e tracejado irregular — que
            ultrapassam o capitel, com <b>partícula decorativa</b>. Tocha (S) + Pilar (T)
            compõem a assinatura oculta <b>ST</b>.
          </div>
          <AthenasSymbol primary={ACTIVE.primary} accent={ACTIVE.accent} size={130} />
        </div>
      </div>
    </div>
  );
};

const AnatomySignature = () => {
  const labelStyle = {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: ACTIVE.primary,
  };
  return (
    <div style={{
      width: '100%', height: '100%',
      background: ACTIVE.bg,
      padding: 32,
      display: 'grid',
      gridTemplateColumns: '1.05fr 1fr',
      gap: 32,
      alignItems: 'center',
    }}>
      <div style={{
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
      }}>
        {/* Símbolo em destaque com letras ST sobrepostas em ghost */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <AthenasSymbol primary={ACTIVE.primary} accent={ACTIVE.accent} size={260} />
          {/* Letras S + T em ghost atrás */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontFamily: '"Sora", sans-serif',
              fontWeight: 800,
              fontSize: 240,
              color: ACTIVE.accent,
              opacity: 0.08,
              letterSpacing: '-0.05em',
              lineHeight: 1,
            }}>ST</div>
          </div>
        </div>
      </div>
      <div>
        <div style={{ ...labelStyle, marginBottom: 14 }}>Assinatura oculta</div>
        <div style={{
          fontFamily: '"Sora", sans-serif',
          fontSize: 28,
          fontWeight: 600,
          lineHeight: 1.2,
          color: ACTIVE.primary,
          marginBottom: 16,
        }}>
          <span style={{ color: ACTIVE.accent }}>S</span>andro
          {' '}
          <span style={{ color: ACTIVE.accent }}>T</span>orres
        </div>
        <div style={{
          fontFamily: '"Sora", sans-serif',
          fontSize: 13.5,
          lineHeight: 1.6,
          color: ACTIVE.primary,
          opacity: 0.82,
          marginBottom: 22,
        }}>
          A tocha desenha o <b>S</b> (chama curvada).<br/>
          O pilar desenha o <b>T</b> (capitel + fuste).<br/>
          No wordmark <b>A<span style={{color:ACTIVE.accent}}>T</span>HENA<span style={{color:ACTIVE.accent}}>S</span></b> as
          mesmas iniciais reaparecem em cor de acento.
        </div>
        <div style={{
          padding: '18px 22px',
          background: ACTIVE.surface,
          borderRadius: 8,
          border: `1px solid ${ACTIVE.primary}18`,
        }}>
          <AthenasWordmark primary={ACTIVE.primary} accent={ACTIVE.accent} size={42} />
        </div>
      </div>
    </div>
  );
};

// ============== PALETAS — card por paleta ==============

const PaletteCard = ({ palette }) => (
  <div style={{
    width: '100%', height: '100%',
    background: palette.bg,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }}>
    <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
      <AthenasLockupV
        primary={palette.primary}
        accent={palette.accent}
        symbolSize={150}
        wordSize={38}
      />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Swatch hex={palette.primary} label="Primária" />
        <Swatch hex={palette.accent} label="Acento" />
        <Swatch hex={palette.bg} label="Fundo" bordered />
      </div>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
        letterSpacing: '0.1em',
        color: palette.primary,
        opacity: 0.7,
        textTransform: 'uppercase',
      }}>
        {palette.note}
      </div>
    </div>
  </div>
);

const Swatch = ({ hex, label, bordered }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{
      height: 28,
      borderRadius: 4,
      background: hex,
      border: bordered ? '1px solid rgba(0,0,0,0.12)' : 'none',
    }} />
    <div style={{
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 9,
      letterSpacing: '0.06em',
      opacity: 0.7,
      color: '#222',
    }}>
      {label} · {hex.toUpperCase()}
    </div>
  </div>
);

// ============== VARIAÇÕES DE ORIENTAÇÃO ==============

const VariantH = () => (
  <div style={{ width: '100%', height: '100%', background: ACTIVE.bg, display: 'grid', placeItems: 'center', padding: 28 }}>
    <AthenasLockupH primary={ACTIVE.primary} accent={ACTIVE.accent} symbolSize={130} wordSize={62} />
  </div>
);

const VariantV = () => (
  <div style={{ width: '100%', height: '100%', background: ACTIVE.bg, display: 'grid', placeItems: 'center', padding: 28 }}>
    <AthenasLockupV primary={ACTIVE.primary} accent={ACTIVE.accent} symbolSize={170} wordSize={42} />
  </div>
);

const VariantSymbolOnly = () => (
  <div style={{ width: '100%', height: '100%', background: ACTIVE.bg, display: 'grid', placeItems: 'center', padding: 28 }}>
    <AthenasSymbol primary={ACTIVE.primary} accent={ACTIVE.accent} size={210} />
  </div>
);

const VariantWordmarkOnly = () => (
  <div style={{ width: '100%', height: '100%', background: ACTIVE.bg, display: 'grid', placeItems: 'center', padding: 28 }}>
    <AthenasWordmark primary={ACTIVE.primary} accent={ACTIVE.accent} size={70} />
  </div>
);

const VariantMono = () => (
  <div style={{ width: '100%', height: '100%', background: ACTIVE.bg, display: 'grid', placeItems: 'center', padding: 28 }}>
    <AthenasLockupH
      primary={ACTIVE.primary}
      accent={ACTIVE.primary}
      cutoutColor={ACTIVE.bg}
      monochrome
      symbolSize={130}
      wordSize={62}
    />
  </div>
);

const VariantMonoInverse = () => (
  <div style={{ width: '100%', height: '100%', background: ACTIVE.primary, display: 'grid', placeItems: 'center', padding: 28 }}>
    <AthenasLockupH
      primary="#FFFFFF"
      accent="#FFFFFF"
      cutoutColor={ACTIVE.primary}
      monochrome
      symbolSize={130}
      wordSize={62}
    />
  </div>
);

// ============== APLICAÇÕES ==============

const AppLoginScreen = () => {
  const p = ACTIVE;
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'grid',
      gridTemplateColumns: '1.05fr 1fr',
      fontFamily: '"Sora", sans-serif',
    }}>
      {/* Painel esquerdo — escuro com lockup */}
      <div style={{
        background: p.primary,
        padding: 56,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Símbolo decorativo grande no fundo */}
        <div style={{ position: 'absolute', right: -80, bottom: -60, opacity: 0.06 }}>
          <AthenasSymbol primary="#fff" accent="#fff" monochrome size={500} />
        </div>
        <AthenasLockupH primary="#fff" accent={p.accent} symbolSize={64} wordSize={32} showPdv />
        <div style={{ position: 'relative' }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            letterSpacing: '0.18em',
            opacity: 0.7,
            textTransform: 'uppercase',
            marginBottom: 14,
          }}>Inteligência operacional do varejo local</div>
          <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.15, maxWidth: 420 }}>
            A estabilidade de uma rede nacional, na sua loja.
          </div>
        </div>
        <div style={{ fontSize: 11, opacity: 0.5, fontFamily: '"JetBrains Mono", monospace' }}>
          v3.2.1 · Athenas Sistemas
        </div>
      </div>
      {/* Painel direito — formulário */}
      <div style={{
        background: p.surface,
        padding: 56,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: p.primary, marginBottom: 6 }}>
          Bem-vindo de volta
        </div>
        <div style={{ fontSize: 13, color: p.primary, opacity: 0.6, marginBottom: 28 }}>
          Acesse seu PDV
        </div>
        <FormField label="Usuário" value="caixa.01@athenas" p={p} />
        <FormField label="Senha" value="••••••••••" p={p} />
        <FormField label="Loja" value="Mercadinho Torres — Matriz" p={p} />
        <button style={{
          marginTop: 14,
          height: 44,
          background: p.primary,
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          fontFamily: 'inherit',
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: '0.04em',
          cursor: 'pointer',
        }}>
          ENTRAR
        </button>
        <div style={{ marginTop: 16, fontSize: 11, color: p.primary, opacity: 0.5, textAlign: 'center' }}>
          Esqueci minha senha · Suporte 24/7
        </div>
      </div>
    </div>
  );
};

const FormField = ({ label, value, p }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{
      fontSize: 10,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: p.primary,
      opacity: 0.55,
      marginBottom: 6,
      fontFamily: '"JetBrains Mono", monospace',
    }}>{label}</div>
    <div style={{
      height: 40,
      borderBottom: `1px solid ${p.primary}33`,
      display: 'flex',
      alignItems: 'center',
      fontSize: 14,
      color: p.primary,
    }}>{value}</div>
  </div>
);

const AppFavicon = () => {
  const p = ACTIVE;
  const sizes = [
    { px: 128, label: '128 · App icon' },
    { px: 64,  label: '64 · Aba do navegador' },
    { px: 32,  label: '32 · Favicon' },
    { px: 16,  label: '16 · Mínimo' },
  ];
  return (
    <div style={{
      width: '100%', height: '100%',
      background: p.bg,
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: p.primary,
        opacity: 0.65,
        marginBottom: 24,
      }}>Favicon · App icon · Touch icon</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28 }}>
        {sizes.map(s => (
          <div key={s.px} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: s.px,
              height: s.px,
              background: p.primary,
              borderRadius: Math.max(4, s.px * 0.18),
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            }}>
              <AthenasSymbol
                primary="#FFFFFF"
                accent={p.accent}
                size={s.px * 0.78}
              />
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              letterSpacing: '0.08em',
              color: p.primary,
              opacity: 0.7,
            }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 28,
        fontFamily: '"Sora", sans-serif',
        fontSize: 12,
        lineHeight: 1.55,
        color: p.primary,
        opacity: 0.7,
        maxWidth: 520,
      }}>
        Em todos os tamanhos exibimos o símbolo completo — o <b>pilar (T)</b> garante
        reconhecimento mesmo quando a fumaça tracejada se torna sutil.
      </div>
    </div>
  );
};

const AppShirt = () => {
  const p = ACTIVE;
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#E8E5DE',
      display: 'grid',
      placeItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Polo simplificada como SVG */}
      <svg viewBox="0 0 400 460" width="80%" style={{ maxHeight: '92%' }}>
        <defs>
          <linearGradient id="shirtShade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.18)" />
            <stop offset="20%" stopColor="rgba(0,0,0,0)" />
            <stop offset="80%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
          </linearGradient>
        </defs>
        {/* Corpo da polo */}
        <path
          d="M 110 80 
             L 160 50 
             L 180 70 
             Q 200 90 220 70
             L 240 50
             L 290 80
             L 340 110
             L 320 160
             L 295 145
             L 295 410
             L 105 410
             L 105 145
             L 80 160
             L 60 110 Z"
          fill={p.primary}
        />
        <path
          d="M 110 80 
             L 160 50 
             L 180 70 
             Q 200 90 220 70
             L 240 50
             L 290 80
             L 340 110
             L 320 160
             L 295 145
             L 295 410
             L 105 410
             L 105 145
             L 80 160
             L 60 110 Z"
          fill="url(#shirtShade)"
        />
        {/* Gola */}
        <path
          d="M 175 60 L 200 95 L 225 60 L 215 55 Q 200 80 185 55 Z"
          fill={p.primary}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />
        {/* Plaket */}
        <line x1="200" y1="95" x2="200" y2="135" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        <circle cx="200" cy="110" r="2" fill="rgba(255,255,255,0.25)" />
        <circle cx="200" cy="125" r="2" fill="rgba(255,255,255,0.25)" />
      </svg>
      {/* Lockup no peito esquerdo */}
      <div style={{
        position: 'absolute',
        top: '38%',
        left: '32%',
        transform: 'translate(-50%, -50%) rotate(-1deg)',
      }}>
        <AthenasLockupH
          primary="#FFFFFF"
          accent={p.accent}
          symbolSize={42}
          wordSize={18}
          showPdv={false}
        />
      </div>
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#333',
        opacity: 0.7,
      }}>Camisa polo · Bordado peito esquerdo</div>
    </div>
  );
};

const AppReceipt = () => {
  const p = ACTIVE;
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#E8E5DE',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
    }}>
      <div style={{
        width: 280,
        background: '#FBFAF6',
        boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        padding: '24px 22px',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
        color: '#1a1a1a',
        lineHeight: 1.55,
        position: 'relative',
      }}>
        {/* Topo recortado */}
        <div style={{
          position: 'absolute',
          top: -10,
          left: 0, right: 0,
          height: 10,
          background: `linear-gradient(135deg, transparent 33%, #FBFAF6 33%) 0 0/14px 14px, linear-gradient(225deg, transparent 33%, #FBFAF6 33%) 7px 0/14px 14px`,
        }} />
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <AthenasLockupV primary="#1a1a1a" accent="#1a1a1a" cutoutColor="#FBFAF6" monochrome symbolSize={70} wordSize={18} showPdv />
        </div>
        <div style={{ textAlign: 'center', fontSize: 9, opacity: 0.75, marginBottom: 4 }}>
          MERCADINHO TORRES LTDA
        </div>
        <div style={{ textAlign: 'center', fontSize: 8.5, opacity: 0.6, marginBottom: 12 }}>
          CNPJ 12.345.678/0001-90<br/>
          R. das Oliveiras, 144 · Itabuna/BA
        </div>
        <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '8px 0', textAlign: 'center', fontSize: 9, letterSpacing: '0.1em' }}>
          CUPOM FISCAL ELETRÔNICO
        </div>
        <div style={{ padding: '10px 0', fontSize: 9 }}>
          <Row k="01  ARROZ BRANCO 5KG" v="R$ 24,90" />
          <Row k="02  FEIJÃO CARIOCA 1KG" v="R$  9,49" />
          <Row k="01  ÓLEO SOJA 900ML" v="R$  7,29" />
          <Row k="03  REFRIGERANTE 2L" v="R$ 26,97" />
          <Row k="01  CAFÉ TORRADO 500G" v="R$ 18,90" />
        </div>
        <div style={{ borderTop: '1px dashed #999', paddingTop: 8, fontSize: 10 }}>
          <Row k="TOTAL" v="R$ 87,55" bold />
          <Row k="CARTÃO DÉBITO" v="R$ 87,55" />
          <Row k="TROCO" v="R$  0,00" />
        </div>
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 8, opacity: 0.6, letterSpacing: '0.05em' }}>
          26/05/2026 · 14:32 · CX 01<br/>
          OPERADOR: SANDRO T.<br/>
          ATHENAS PDV v3.2.1
        </div>
        {/* Fundo recortado */}
        <div style={{
          position: 'absolute',
          bottom: -10,
          left: 0, right: 0,
          height: 10,
          background: `linear-gradient(45deg, transparent 33%, #FBFAF6 33%) 0 100%/14px 14px, linear-gradient(-45deg, transparent 33%, #FBFAF6 33%) 7px 100%/14px 14px`,
        }} />
      </div>
    </div>
  );
};

const Row = ({ k, v, bold }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: bold ? 700 : 400,
    fontSize: bold ? 10.5 : 9,
    padding: '1px 0',
  }}>
    <span>{k}</span>
    <span>{v}</span>
  </div>
);

const AppBusinessCard = () => {
  const p = ACTIVE;
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#E8E5DE',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: 24,
    }}>
      {/* Frente */}
      <div style={{
        width: 320,
        height: 190,
        background: p.primary,
        boxShadow: '0 14px 32px rgba(0,0,0,0.18)',
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -50, bottom: -40, opacity: 0.07 }}>
          <AthenasSymbol primary="#fff" accent="#fff" monochrome size={220} />
        </div>
        <AthenasLockupH primary="#fff" accent={p.accent} symbolSize={48} wordSize={22} showPdv />
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 8.5,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#fff',
          opacity: 0.75,
        }}>
          Inteligência operacional · varejo local
        </div>
      </div>
      {/* Verso */}
      <div style={{
        width: 320,
        height: 190,
        background: p.surface,
        boxShadow: '0 14px 32px rgba(0,0,0,0.18)',
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: '"Sora", sans-serif',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: p.primary }}>Sandro Torres</div>
          <div style={{ fontSize: 11, color: p.primary, opacity: 0.65, marginTop: 2 }}>
            Fundador · Athenas Sistemas
          </div>
        </div>
        <div style={{ fontSize: 11, color: p.primary, opacity: 0.85, lineHeight: 1.6 }}>
          sandro@athenaspdv.com.br<br/>
          +55 73 99100·0000<br/>
          athenaspdv.com.br
        </div>
      </div>
    </div>
  );
};

// ============== CANVAS ==============

const App = () => (
  <DesignCanvas
    title="ATHENAS PDV · Identidade visual"
    subtitle="Símbolo, paletas, variações e aplicações."
  >
    {/* ===== SEÇÃO 1 · ANATOMIA ===== */}
    <DCSection id="anatomia" title="Anatomia">
      <DCArtboard id="composicao" label="Composição final" width={420} height={520}>
        <AnatomyComposition />
      </DCArtboard>
      <DCArtboard id="explodida" label="Vista explodida" width={620} height={520}>
        <AnatomyExploded />
      </DCArtboard>
      <DCArtboard id="assinatura-st" label="Assinatura oculta ST" width={620} height={420}>
        <AnatomySignature />
      </DCArtboard>
    </DCSection>

    {/* ===== SEÇÃO 2 · PALETAS ===== */}
    <DCSection id="paletas" title="Direções de cor">
      {PALETTES.map(pal => (
        <DCArtboard key={pal.id} id={`pal-${pal.id}`} label={pal.name} width={360} height={460}>
          <PaletteCard palette={pal} />
        </DCArtboard>
      ))}
    </DCSection>

    {/* ===== SEÇÃO 3 · VARIAÇÕES ===== */}
    <DCSection id="variacoes" title="Variações de orientação">
      <DCArtboard id="var-h" label="Lockup horizontal" width={560} height={260}>
        <VariantH />
      </DCArtboard>
      <DCArtboard id="var-v" label="Lockup vertical" width={340} height={420}>
        <VariantV />
      </DCArtboard>
      <DCArtboard id="var-symbol" label="Símbolo isolado" width={300} height={360}>
        <VariantSymbolOnly />
      </DCArtboard>
      <DCArtboard id="var-word" label="Wordmark isolado" width={520} height={220}>
        <VariantWordmarkOnly />
      </DCArtboard>
      <DCArtboard id="var-mono" label="Monocromo" width={560} height={260}>
        <VariantMono />
      </DCArtboard>
      <DCArtboard id="var-mono-inv" label="Monocromo invertido" width={560} height={260}>
        <VariantMonoInverse />
      </DCArtboard>
    </DCSection>

    {/* ===== SEÇÃO 4 · APLICAÇÕES ===== */}
    <DCSection id="aplicacoes" title="Aplicações">
      <DCArtboard id="app-login" label="Tela de login do sistema" width={840} height={520}>
        <AppLoginScreen />
      </DCArtboard>
      <DCArtboard id="app-favicon" label="Favicon & App icon" width={560} height={420}>
        <AppFavicon />
      </DCArtboard>
      <DCArtboard id="app-receipt" label="Cupom fiscal" width={420} height={580}>
        <AppReceipt />
      </DCArtboard>
      <DCArtboard id="app-shirt" label="Camisa polo / uniforme" width={460} height={520}>
        <AppShirt />
      </DCArtboard>
      <DCArtboard id="app-card" label="Cartão de visita" width={760} height={300}>
        <AppBusinessCard />
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
