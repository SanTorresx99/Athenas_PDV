// brand.jsx — Brand showcase route

const { useState } = React;

function Brand({ tweaks, setTweak }) {
  return (
    <div style={{ padding: '32px 40px 80px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Hero */}
      <section style={{
        display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 48, alignItems: 'center',
        padding: '24px 0 48px',
      }}>
        <div>
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center',
                        padding: '4px 10px 4px 4px', border: '1px solid var(--border)',
                        borderRadius: 999, fontSize: 12, color: 'var(--muted)' }}>
            <span style={{
              padding: '2px 8px', borderRadius: 999,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
            }}>NOVO</span>
            Plataforma 2026 · v3.0
          </div>
          <h1 style={{
            margin: '20px 0 16px', fontSize: 64, lineHeight: 1.02, fontWeight: 700,
            letterSpacing: '-.035em',
          }}>
            Inteligência<br />
            operacional do<br />
            <span style={{
              backgroundImage: 'linear-gradient(95deg, var(--primary) 0%, var(--accent) 90%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>varejo local.</span>
          </h1>
          <p style={{
            margin: 0, color: 'var(--muted)', fontSize: 17.5, lineHeight: 1.55,
            maxWidth: 520,
          }}>
            ATHENAS é o PDV e o cérebro de gestão para mercadinhos, padarias, adegas
            e distribuidoras que querem operar como uma rede nacional — sem deixar
            de ser de bairro.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            <button className="a-btn a-btn-primary" style={{ height: 44, padding: '0 20px', fontSize: 14 }}>
              Ver o sistema
              <Icon name="arrow-right" size={16} />
            </button>
            <button className="a-btn" style={{ height: 44, padding: '0 18px', fontSize: 14 }}>
              Falar com vendas
            </button>
          </div>

          <div style={{ display: 'flex', gap: 28, marginTop: 36, color: 'var(--muted)', fontSize: 13 }}>
            <div><b style={{ color: 'var(--text)' }}>3.400+</b> comércios ativos</div>
            <div><b style={{ color: 'var(--text)' }}>R$ 2.1B</b> processados/ano</div>
            <div><b style={{ color: 'var(--text)' }}>99,98%</b> uptime</div>
          </div>
        </div>

        {/* Hero device frame */}
        <div style={{ position: 'relative' }}>
          <BrandDeviceFrame variant={tweaks.logo} />
        </div>
      </section>

      {/* Logo Concepts */}
      <SectionHeader
        eyebrow="Identidade"
        title="Três direções para a marca"
        sub="Cada conceito explora um lado do que ATHENAS representa. Toque para selecionar."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <LogoCard
          variant="pilar"
          label="Pilar tecnológico"
          desc="Coluna grega em forma de T com tocha de Atena em frente. A chama curva em S."
          active={tweaks.logo === 'pilar'}
          onSelect={() => setTweak('logo', 'pilar')}
        />
        <LogoCard
          variant="monograma"
          label="Monograma A"
          desc="Duas placas geométricas com travessão entalhado. O recorte sugere S/T integrados."
          active={tweaks.logo === 'monograma'}
          onSelect={() => setTweak('logo', 'monograma')}
        />
        <LogoCard
          variant="fluxo"
          label="Fluxo operacional"
          desc="Dois arcos contínuos com nó central. Conexão, automação, escala."
          active={tweaks.logo === 'fluxo'}
          onSelect={() => setTweak('logo', 'fluxo')}
        />
      </div>

      {/* PILAR — deep dive */}
      {tweaks.logo === 'pilar' && <PilarFocus />}

      {/* Palette */}
      <SectionHeader
        eyebrow="Paleta"
        title="Slate profundo, azul tecnológico"
        sub="Base neutra estável + um único acento para sinalização e energia."
        style={{ marginTop: 72 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="a-card" style={{ padding: 20 }}>
          <Eyebrow>Primárias</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
            <Swatch hex="#0F172A" name="Slate 900" role="Background / autoridade" />
            <Swatch hex="#2563EB" name="Royal 600" role="Ações primárias / links" />
            <Swatch hex="#F8FAFC" name="Ice 50"    role="Texto / superfícies claras" textOn="#0F172A" />
          </div>
          <Eyebrow style={{ marginTop: 20 }}>Secundárias</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
            <Swatch hex="#1E293B" name="Graphite 800" role="Superfícies, sidebar" />
            <Swatch hex="#CBD5E1" name="Slate 300"    role="Bordas, divisores" textOn="#0F172A" />
            <Swatch hex="#94A3B8" name="Slate 400"    role="Texto secundário"   textOn="#0F172A" />
          </div>
        </div>

        <div className="a-card" style={{ padding: 20 }}>
          <Eyebrow>Acento</Eyebrow>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 16 }}>
            <button onClick={() => setTweak('accent', 'cyan')}
                    className="a-btn" style={{
                      flex: 1, justifyContent: 'center',
                      borderColor: tweaks.accent === 'cyan' ? 'var(--accent)' : 'var(--border)',
                      background: tweaks.accent === 'cyan' ? 'var(--accent-soft)' : 'var(--surface-3)',
                      color: tweaks.accent === 'cyan' ? 'var(--accent)' : 'var(--text-2)',
                    }}>
              <span className="dot" style={{ width: 10, height: 10, background: '#06B6D4', borderRadius: 999 }} />
              Ciano
            </button>
            <button onClick={() => setTweak('accent', 'gold')}
                    className="a-btn" style={{
                      flex: 1, justifyContent: 'center',
                      borderColor: tweaks.accent === 'gold' ? 'var(--accent)' : 'var(--border)',
                      background: tweaks.accent === 'gold' ? 'var(--accent-soft)' : 'var(--surface-3)',
                      color: tweaks.accent === 'gold' ? 'var(--accent)' : 'var(--text-2)',
                    }}>
              <span className="dot" style={{ width: 10, height: 10, background: '#F59E0B', borderRadius: 999 }} />
              Dourado
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Swatch hex={tweaks.accent === 'gold' ? '#F59E0B' : '#06B6D4'}
                    name={tweaks.accent === 'gold' ? 'Amber 500' : 'Cyan 500'}
                    role="Destaques, badges, growth" textOn="#0F172A" />
            <div style={{
              borderRadius: 10, padding: 12,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              border: '1px solid transparent',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: 84,
            }}>
              <Icon name="sparkle" size={18} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Em uso</div>
                <div style={{ fontSize: 11, opacity: .8 }}>chips, gráficos, pulse</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <SectionHeader
        eyebrow="Tipografia"
        title="Manrope para a UI"
        sub="Sans-serif geométrica, legível em densidades de PDV e em manchetes corporativas."
        style={{ marginTop: 72 }}
      />
      <div className="a-card" style={{ padding: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>Display 700 / -3% tracking</div>
          <div style={{ fontSize: 64, lineHeight: 1, fontWeight: 700, letterSpacing: '-.03em', margin: '12px 0' }}>Aa Áê Çç</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700, marginTop: 28 }}>Numerais tabulares</div>
          <div style={{ fontSize: 32, fontWeight: 600, marginTop: 8 }} className="a-num">R$ 12.480,30</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }} className="a-mono">SKU-738291-A · 0123456789</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { w: 800, s: 24, l: 'ExtraBold 800 · headlines de seção' },
            { w: 700, s: 19, l: 'Bold 700 · títulos de card' },
            { w: 600, s: 15, l: 'Semibold 600 · labels, botões, KPIs' },
            { w: 500, s: 14, l: 'Medium 500 · navegação' },
            { w: 400, s: 14, l: 'Regular 400 · corpo' },
            { w: 300, s: 13, l: 'Light 300 · captions raras' },
          ].map(r => (
            <div key={r.w} style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              gap: 16, paddingBottom: 12, borderBottom: '1px dashed var(--border)',
            }}>
              <span style={{ fontWeight: r.w, fontSize: r.s, letterSpacing: '-.01em' }}>
                Operação de varejo precisa ser rápida.
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{r.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Voice / pillars */}
      <SectionHeader
        eyebrow="Posicionamento"
        title="O que a marca promete"
        style={{ marginTop: 72 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { i: 'bolt',    t: 'Rápida',     d: 'Venda em 3 cliques. Sincroniza em segundos.' },
          { i: 'check',   t: 'Confiável',  d: '99,98% de uptime medido. Modo offline nativo.' },
          { i: 'sparkle', t: 'Inteligente',d: 'Sugestões de reposição, ranking automático.' },
          { i: 'trend-up',t: 'Escalável',  d: 'Do balcão único à rede com 40 lojas.' },
        ].map(p => (
          <div key={p.t} className="a-card" style={{ padding: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--primary-soft)', color: 'var(--primary)',
              display: 'grid', placeItems: 'center', marginBottom: 14,
            }}>
              <Icon name={p.i} size={18} stroke={1.8} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.t}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{p.d}</div>
          </div>
        ))}
      </div>

      {/* CTA strip */}
      <div className="a-card" style={{
        marginTop: 56, padding: '28px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)',
      }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.01em' }}>Pronto pra ver o sistema em ação?</div>
          <div style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 4 }}>
            Dashboard e PDV navegáveis. Sem login, sem demora.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="a-btn a-btn-primary" onClick={() => setTweak('route', 'dashboard')}>
            <Icon name="dashboard" size={16} />
            Abrir Dashboard
          </button>
          <button className="a-btn a-btn-accent" onClick={() => setTweak('route', 'pdv')}>
            <Icon name="pdv" size={16} />
            Abrir PDV
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, sub, style }) {
  return (
    <div style={{ marginBottom: 20, marginTop: 12, ...style }}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24, marginTop: 8 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-.025em' }}>{title}</h2>
        {sub && <div style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 420, textAlign: 'right' }}>{sub}</div>}
      </div>
    </div>
  );
}

function Eyebrow({ children, style }) {
  return (
    <div style={{
      fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase',
      color: 'var(--accent)', fontWeight: 700, ...style,
    }}>
      {children}
    </div>
  );
}

function LogoCard({ variant, label, desc, active, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="a-card"
      style={{
        padding: 0, textAlign: 'left', cursor: 'default',
        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: active ? '0 0 0 3px var(--accent-soft), var(--shadow-card)' : 'var(--shadow-card)',
        outline: 'none',
        transition: 'border-color .2s ease, box-shadow .2s ease',
        background: 'var(--surface)',
      }}>
      <div style={{
        height: 180, display: 'grid', placeItems: 'center',
        background: 'linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%)',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
      }}>
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '24px 24px', opacity: .25,
        }} />
        <div style={{ position: 'relative' }}>
          <LogoMark variant={variant} size={92} />
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <LogoLockup variant={variant} size={20} />
          {active && (
            <span className="a-pill a-pill-accent" style={{ background: 'var(--accent)', color: '#001018' }}>
              <Icon name="check" size={11} stroke={2.5} />
              Em uso
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{desc}</div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PILAR — Focus / deep-dive view
function PilarFocus() {
  return (
    <div style={{ marginTop: 32 }}>
      <SectionHeader
        eyebrow="Pilar tecnológico · em foco"
        title="A coluna que segura o varejo"
        sub="A coluna grega forma um T. Em frente, a tocha de Atena com chama em S. Juntas: ST — assinatura de Sandro Torres."
      />

      {/* Hero of the mark */}
      <div className="a-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.1fr .9fr', minHeight: 360,
        }}>
          {/* Big logo on textured background */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'radial-gradient(ellipse at 30% 40%, color-mix(in srgb, var(--primary) 22%, transparent) 0%, transparent 60%), var(--surface-2)',
            borderRight: '1px solid var(--border)',
            display: 'grid', placeItems: 'center', padding: 40,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
              backgroundSize: '32px 32px', opacity: .18,
            }} />
            <div style={{ position: 'relative' }}>
              <LogoMark variant="pilar" size={260} />
            </div>
            <div style={{
              position: 'absolute', bottom: 16, left: 20, right: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 10.5, color: 'var(--muted-2)', fontFamily: 'var(--font-mono)',
            }}>
              <span>marca / mark</span>
              <span>48 × 48 grid</span>
            </div>
          </div>

          {/* Anatomy + meaning */}
          <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <Eyebrow>Anatomia</Eyebrow>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <AnatomyRow num="01" name="Capitel + base" color="primary"
                  desc="Lintel arquitetônico e base sólida. Lê como a barra do T." />
                <AnatomyRow num="02" name="Fuste central" color="primary"
                  desc="A haste vertical do T. Estabilidade técnica." />
                <AnatomyRow num="03" name="Tocha de Atena" color="accent"
                  desc="Em primeiro plano, deusa do conhecimento e estratégia." />
                <AnatomyRow num="04" name="Chama em S" color="accent"
                  desc="Curva ascendente. Energia, fluxo, escala." />
              </div>
            </div>
            <div style={{
              padding: 14, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary-soft) 0%, var(--accent-soft) 200%)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                Assinatura oculta
              </div>
              <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: 'var(--text-2)' }}>
                A <b style={{ color: 'var(--text)' }}>tocha</b> ⟶ <b style={{ color: 'var(--accent)' }}>S</b>,
                o <b style={{ color: 'var(--text)' }}>pilar</b> ⟶ <b style={{ color: 'var(--accent)' }}>T</b>.
                {' '}Juntos formam <b style={{ color: 'var(--accent)' }}>ST</b> — as iniciais do fundador,
                Sandro Torres, escondidas dentro de ATHENA<b style={{ color: 'var(--accent)' }}>S</b>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wordmark reveal */}
      <div className="a-card" style={{ marginTop: 16, padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <Eyebrow>Wordmark · ST destacado</Eyebrow>
            <div style={{
              marginTop: 12, fontSize: 92, fontWeight: 800, lineHeight: 1,
              letterSpacing: '-.035em', display: 'inline-flex',
            }}>
              {'ATHENAS'.split('').map((ch, i) => {
                const isST = (ch === 'T' && i === 1) || (ch === 'S' && i === 6);
                return (
                  <span key={i} style={{
                    color: isST ? 'var(--accent)' : 'var(--text)',
                    position: 'relative',
                  }}>
                    {ch}
                    {isST && (
                      <span style={{
                        position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                        width: 6, height: 6, borderRadius: 999,
                        background: 'var(--accent)',
                      }} />
                    )}
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
              A · <span style={{ color: 'var(--accent)', fontWeight: 700 }}>T</span> · H · E · N · A · <span style={{ color: 'var(--accent)', fontWeight: 700 }}>S</span>
            </div>
          </div>
          <div style={{
            padding: 18, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)',
            minWidth: 280, maxWidth: 340,
          }}>
            <Eyebrow>Voz da marca</Eyebrow>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-2)', marginTop: 8 }}>
              "Atena segura a tocha do conhecimento sobre o pilar do varejo brasileiro.
              <b style={{ color: 'var(--text)' }}> ATHENAS</b> é o sistema; <b style={{ color: 'var(--accent)' }}>ST</b> é a assinatura."
            </div>
          </div>
        </div>
      </div>

      {/* Variants grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
        <VariantTile label="Duo · padrão"   bg="var(--surface)" tone="duo" />
        <VariantTile label="Mono · escuro"  bg="var(--surface)" tone="mono" mono="var(--text)" />
        <VariantTile label="Inverso · azul" bg="var(--primary)" tone="inverse" textColor="#fff" />
        <VariantTile label="Outline · claro"bg="#F8FAFC" tone="duo" textColor="#0F172A" />
      </div>

      {/* Tamanhos */}
      <div className="a-card" style={{ marginTop: 16, padding: '20px 24px' }}>
        <Eyebrow>Escalas mínimas e máximas</Eyebrow>
        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'flex-end', gap: 32,
          flexWrap: 'wrap', paddingBottom: 8,
        }}>
          {[
            { size: 16, l: 'Favicon · 16px' },
            { size: 24, l: 'Sidebar collapsed · 24px' },
            { size: 32, l: 'Sidebar · 32px' },
            { size: 56, l: 'Cabeçalho · 56px' },
            { size: 96, l: 'Hero · 96px' },
          ].map(s => (
            <div key={s.size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ height: 100, display: 'flex', alignItems: 'flex-end' }}>
                <LogoMark variant="pilar" size={s.size} />
              </div>
              <div className="a-mono" style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Spacing / clear-space */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 12, marginTop: 16 }}>
        <div className="a-card" style={{ padding: '20px 24px' }}>
          <Eyebrow>Área de proteção</Eyebrow>
          <div style={{
            marginTop: 14, padding: 32, borderRadius: 10,
            background: 'var(--surface-2)', border: '1px dashed var(--border-2)',
            display: 'flex', justifyContent: 'center', position: 'relative',
          }}>
            <LogoLockup variant="pilar" size={48} />
            {/* clear-space markers */}
            {['top','right','bottom','left'].map(side => (
              <div key={side} style={{
                position: 'absolute',
                ...(side === 'top'    && { top: 8,  left: '50%', transform: 'translateX(-50%)' }),
                ...(side === 'bottom' && { bottom: 8, left: '50%', transform: 'translateX(-50%)' }),
                ...(side === 'left'   && { left: 8, top: '50%',   transform: 'translateY(-50%)' }),
                ...(side === 'right'  && { right: 8, top: '50%',  transform: 'translateY(-50%)' }),
                color: 'var(--muted-2)', fontFamily: 'var(--font-mono)', fontSize: 10,
              }}>X</div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>
            Manter no mínimo <b style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>X</b> de respiro,
            onde <b style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>X</b> = altura do capitel.
          </div>
        </div>

        <div className="a-card" style={{ padding: '20px 24px' }}>
          <Eyebrow>Não fazer</Eyebrow>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { ic: 'close', t: 'Trocar a tocha de cor' },
              { ic: 'close', t: 'Esticar ou rotacionar a marca' },
              { ic: 'close', t: 'Adicionar contorno ou sombra' },
              { ic: 'close', t: 'Apagar o T ou o S do wordmark' },
            ].map(r => (
              <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: 'var(--danger-soft)', color: 'var(--danger)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <Icon name={r.ic} size={12} stroke={2.4} />
                </span>
                <span style={{ color: 'var(--text-2)' }}>{r.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnatomyRow({ num, name, color, desc }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr', gap: 12, alignItems: 'flex-start' }}>
      <span style={{
        width: 24, height: 24, borderRadius: 6,
        background: `var(--${color}-soft)`, color: `var(--${color})`,
        display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 700,
        fontFamily: 'var(--font-mono)',
      }}>{num}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2, lineHeight: 1.45 }}>{desc}</div>
      </div>
    </div>
  );
}

function VariantTile({ label, bg, tone, textColor, mono }) {
  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)',
      background: bg,
    }}>
      <div style={{
        padding: 28, display: 'grid', placeItems: 'center', minHeight: 130,
        color: mono || textColor || undefined,
      }}>
        <LogoMark variant="pilar" size={56} tone={tone} />
      </div>
      <div style={{
        padding: '8px 12px', borderTop: '1px solid var(--border)',
        background: 'var(--surface)', fontSize: 11, color: 'var(--muted)',
      }}>{label}</div>
    </div>
  );
}

function Swatch({ hex, name, role, textOn = '#F8FAFC' }) {
  return (
    <div style={{
      borderRadius: 10, padding: 12, background: hex, color: textOn,
      minHeight: 84, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      border: '1px solid var(--border)',
    }}>
      <div className="a-mono" style={{ fontSize: 11, opacity: .85 }}>{hex}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
        <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>{role}</div>
      </div>
    </div>
  );
}

// Mini "browser preview" of dashboard, used in hero
function BrandDeviceFrame({ variant }) {
  return (
    <div className="a-card" style={{
      padding: 0, overflow: 'hidden', transform: 'perspective(1400px) rotateY(-6deg) rotateX(3deg)',
      transformStyle: 'preserve-3d',
      boxShadow: '0 30px 80px -20px rgba(0,0,0,.6), 0 0 0 1px var(--border)',
    }}>
      {/* Window chrome */}
      <div style={{
        height: 32, background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#ff5f57' }} />
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#febc2e' }} />
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#28c840' }} />
        <div style={{
          marginLeft: 16, height: 18, padding: '0 10px', borderRadius: 4,
          background: 'var(--surface)', color: 'var(--muted)', fontSize: 10.5,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="wifi" size={10} />
          athenas.app/dashboard
        </div>
      </div>
      {/* Body — mini dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', minHeight: 320 }}>
        <div style={{ borderRight: '1px solid var(--border)', padding: '14px 0',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                      background: 'var(--surface-2)' }}>
          <LogoMark variant={variant} size={22} />
          {['dashboard','pdv','products','stock','finance'].map((n,i) => (
            <div key={n} style={{
              width: 28, height: 28, borderRadius: 7,
              background: i === 0 ? 'var(--primary-soft)' : 'transparent',
              color: i === 0 ? 'var(--primary)' : 'var(--muted)',
              display: 'grid', placeItems: 'center',
            }}>
              <Icon name={n} size={14} />
            </div>
          ))}
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Visão geral</div>
            <span className="a-pill a-pill-success" style={{ fontSize: 9.5 }}>
              <span className="dot" />
              Caixa aberto
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { l: 'Vendas hoje', v: 'R$ 12.480', d: '+18%' },
              { l: 'Ticket médio', v: 'R$ 38,40', d: '+4%' },
              { l: 'Itens', v: '347', d: '+22%' },
            ].map(k => (
              <div key={k.l} className="a-card" style={{ padding: 10, boxShadow: 'none', background: 'var(--surface-2)' }}>
                <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{k.l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{k.v}</div>
                <div style={{ fontSize: 9.5, color: 'var(--success)', marginTop: 2 }}>↑ {k.d}</div>
              </div>
            ))}
          </div>
          <div className="a-card" style={{ padding: 12, marginTop: 8, boxShadow: 'none', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>Vendas · últimos 7 dias</div>
            <MiniChart />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniChart() {
  const data = [38, 52, 47, 64, 58, 78, 92];
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, position: 'relative', height: '100%' }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${(v/max)*100}%`,
            background: i === data.length - 1
              ? 'linear-gradient(180deg, var(--accent) 0%, var(--primary) 100%)'
              : 'var(--surface-3)',
            borderRadius: 3,
          }} />
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Brand });
