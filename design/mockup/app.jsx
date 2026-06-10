// app.jsx — App shell: sidebar + topbar + route switch + Tweaks

const { useState: useS, useEffect: useEf, useRef: useRa } = React;

const DARK_PALETTES = [
  { id: 'default',  label: 'Midnight',  bg: '#0B1220', primary: '#2563EB', accent: '#06B6D4' },
  { id: 'obsidian', label: 'Obsidian',  bg: '#07070E', primary: '#6366F1', accent: '#A78BFA' },
  { id: 'ocean',    label: 'Ocean',     bg: '#050C18', primary: '#0EA5E9', accent: '#38BDF8' },
  { id: 'forest',   label: 'Forest',    bg: '#030E0A', primary: '#10B981', accent: '#34D399' },
  { id: 'aurora',   label: 'Aurora',    bg: '#09060F', primary: '#8B5CF6', accent: '#C084FC' },
  { id: 'wine',     label: 'Wine',      bg: '#0F0608', primary: '#F43F5E', accent: '#FB7185' },
  { id: 'carbon',   label: 'Carbon',    bg: '#0C0A09', primary: '#F59E0B', accent: '#FCD34D' },
  { id: 'espresso', label: 'Espresso',  bg: '#0E0906', primary: '#EA580C', accent: '#FB923C' },
];
const LIGHT_PALETTES = [
  { id: 'default',  label: 'Névoa',    bg: '#F4F6FB', primary: '#2563EB', accent: '#0891B2' },
  { id: 'denim',    label: 'Denim',    bg: '#EEF2FB', primary: '#1D4ED8', accent: '#1E40AF' },
  { id: 'sage',     label: 'Sage',     bg: '#EDF4F1', primary: '#059669', accent: '#0D9488' },
  { id: 'cream',    label: 'Cream',    bg: '#FBF7EE', primary: '#D97706', accent: '#92400E' },
  { id: 'lavender', label: 'Lavender', bg: '#F3F0FC', primary: '#7C3AED', accent: '#8B5CF6' },
  { id: 'rose',     label: 'Rose',     bg: '#FDF2F5', primary: '#E11D48', accent: '#F43F5E' },
  { id: 'coral',    label: 'Coral',    bg: '#FDF4EF', primary: '#EA580C', accent: '#F97316' },
  { id: 'slate',    label: 'Slate',    bg: '#EEF1F7', primary: '#475569', accent: '#0EA5E9' },
];

function PalettePicker({ theme, subtheme, setTweak }) {
  const [open, setOpen] = useS(false);
  const ref = useRa(null);
  const palettes = theme === 'dark' ? DARK_PALETTES : LIGHT_PALETTES;
  const active = subtheme || 'default';

  useEf(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="a-btn a-btn-ghost"
        onClick={() => setOpen(o => !o)}
        title="Subtema de cores"
        style={{ width: 36, padding: 0, justifyContent: 'center',
                 color: active !== 'default' ? 'var(--accent)' : 'var(--text-2)' }}>
        <Icon name="palette" size={16} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-pop)',
          padding: '12px 12px 14px',
          width: 228,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted-2)',
                        letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            {theme === 'dark' ? 'Dark' : 'Light'} — subtema
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {palettes.map(p => {
              const isActive = active === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setTweak('subtheme', p.id); setOpen(false); }}
                  title={p.label}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    border: 'none', background: 'transparent', cursor: 'default',
                    padding: '4px 2px', fontFamily: 'inherit',
                  }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, overflow: 'hidden',
                    outline: isActive ? `2.5px solid ${p.primary}` : '1.5px solid rgba(128,128,128,.2)',
                    outlineOffset: isActive ? 2 : 0,
                    boxShadow: isActive ? `0 0 0 4px ${p.primary}30` : '0 1px 3px rgba(0,0,0,.25)',
                    transition: 'outline .12s, box-shadow .12s',
                  }}>
                    <div style={{ height: '50%', background: p.bg }} />
                    <div style={{ height: '50%', background: p.primary }} />
                  </div>
                  <span style={{
                    fontSize: 9.5, lineHeight: 1, fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--text)' : 'var(--muted)',
                    whiteSpace: 'nowrap',
                  }}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const NAV = [
  { k: 'brand',     l: 'Marca',         i: 'sparkle',   group: 'PROTÓTIPO' },
  { k: 'dashboard', l: 'Dashboard',     i: 'dashboard', group: 'PROTÓTIPO' },
  { k: 'pdv',       l: 'PDV',           i: 'pdv',       group: 'PROTÓTIPO', shortcut: 'F2' },
  { k: 'produtos',  l: 'Produtos',      i: 'products',  group: 'GESTÃO' },
  { k: 'stock',     l: 'Estoque',       i: 'stock',     group: 'GESTÃO' },
  { k: 'compras',   l: 'Compras',       i: 'finance',   group: 'GESTÃO' },
  { k: 'clients',   l: 'Clientes',      i: 'clients',   group: 'GESTÃO' },
  { k: 'kds',       l: 'Fabricação',    i: 'sparkle',   group: 'GESTÃO' },
  { k: 'reports',   l: 'Relatórios',    i: 'reports',   group: 'GESTÃO', disabled: true },
  { k: 'settings',  l: 'Configurações', i: 'settings',  group: '',       disabled: true },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply data attributes to <html> so :root tokens flip
  useEf(() => {
    const html = document.documentElement;
    html.dataset.theme = t.theme;
    html.dataset.accent = t.accent;
    html.dataset.font = t.font;
    html.dataset.density = t.density;
    html.dataset.subtheme = t.subtheme || 'default';
  }, [t.theme, t.accent, t.font, t.density, t.subtheme]);

  const route = t.route || 'brand';

  return (
    <div className="a-route" data-screen-label={routeLabel(route)}>
      <Sidebar route={route} setRoute={(k) => setTweak('route', k)} tweaks={t} setTweak={setTweak} />
      <div className="a-main">
        <TopBar route={route} tweaks={t} setTweak={setTweak} subtheme={t.subtheme} />
        <div style={{ flex: 1, minHeight: 0, overflow: route === 'pdv' ? 'hidden' : 'auto',
                       background: route === 'pdv' ? 'var(--bg)' : 'var(--bg)' }}>
          {route === 'brand'     && <Brand tweaks={t} setTweak={setTweak} />}
          {route === 'dashboard' && <Dashboard tweaks={t} setTweak={setTweak} />}
          {route === 'pdv'       && <PDV tweaks={t} />}
          {route === 'produtos'  && <Produtos tweaks={t} setTweak={setTweak} />}
          {route === 'stock'     && <Estoque tweaks={t} />}
          {route === 'compras'   && <Compras tweaks={t} />}
          {route === 'clients'   && <Clientes tweaks={t} />}
          {route === 'kds'       && <KDS tweaks={t} />}
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Tema" />
        <TweakRadio  label="Modo"  value={t.theme}
                     options={['dark', 'light']}
                     onChange={(v) => setTweak('theme', v)} />
        <TweakRadio  label="Acento" value={t.accent}
                     options={['cyan', 'gold']}
                     onChange={(v) => setTweak('accent', v)} />

        <TweakSection label="Tipografia" />
        <TweakRadio  label="Fonte"  value={t.font}
                     options={['manrope', 'inter']}
                     onChange={(v) => setTweak('font', v)} />
        <TweakRadio  label="Densidade" value={t.density}
                     options={['compact', 'regular']}
                     onChange={(v) => setTweak('density', v)} />

        <TweakSection label="Identidade" />
        <TweakSelect label="Logo" value={t.logo}
                     options={[
                       { value: 'pilar',     label: 'Pilar tecnológico' },
                       { value: 'monograma', label: 'Monograma A' },
                       { value: 'fluxo',     label: 'Fluxo operacional' },
                     ]}
                     onChange={(v) => setTweak('logo', v)} />

        <TweakSection label="Navegação" />
        <TweakRadio  label="Tela"  value={t.route}
                     options={['brand', 'dashboard', 'pdv', 'produtos', 'stock', 'compras']}
                     onChange={(v) => setTweak('route', v)} />
        <TweakSection label="Catálogo" />
        <TweakSelect label="Perfil do negócio" value={t.profile || 'mercadinho'}
                     options={[
                       { value: 'mercadinho',    label: 'Mercadinho' },
                       { value: 'restaurante',   label: 'Restaurante' },
                       { value: 'vidracaria',    label: 'Vidraçaria' },
                       { value: 'distribuidora', label: 'Distribuidora' },
                     ]}
                     onChange={(v) => setTweak('profile', v)} />
      </TweaksPanel>
    </div>
  );
}

function routeLabel(r) {
  const m = { brand:'Marca', dashboard:'Dashboard', pdv:'PDV',
               produtos:'Produtos', stock:'Estoque', compras:'Compras',
               clients:'Clientes', kds:'Fabricação' };
  return m[r] || r;
}

// ─────────────────────────────────────────────────────────────────────────────
function Sidebar({ route, setRoute, tweaks }) {
  const groups = ['PROTÓTIPO', 'GESTÃO', ''];
  return (
    <aside style={{
      width: 248, flexShrink: 0, background: 'var(--surface)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--border)' }}>
        <LogoLockup variant={tweaks.logo} size={26} tag />
      </div>

      {/* Store switcher */}
      <button className="a-btn" style={{
        margin: 12, height: 44, padding: '0 12px', justifyContent: 'space-between',
        background: 'var(--surface-2)', borderColor: 'var(--border)',
      }}>
        <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'var(--primary)', color: '#fff',
            display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, letterSpacing: '-.02em',
          }}>BP</span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
            <span style={{ fontWeight: 700, fontSize: 12.5 }}>Bom Preço · Centro</span>
            <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 500 }}>Loja matriz</span>
          </span>
        </span>
        <Icon name="chevron-down" size={14} />
      </button>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px' }}>
        {groups.map(g => (
          <div key={g || 'misc'} style={{ marginTop: g ? 12 : 18 }}>
            {g && (
              <div style={{
                padding: '6px 10px', fontSize: 10, fontWeight: 700,
                color: 'var(--muted-2)', letterSpacing: '.14em',
              }}>{g}</div>
            )}
            {NAV.filter(n => n.group === g).map(n => {
              const active = route === n.k && !n.disabled;
              return (
                <button
                  key={n.k}
                  onClick={() => !n.disabled && setRoute(n.k)}
                  disabled={n.disabled}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, margin: '1px 0',
                    border: 'none', cursor: 'default', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: 500,
                    background: active ? 'var(--primary-soft)' : 'transparent',
                    color: active ? 'var(--primary)' : n.disabled ? 'var(--muted-2)' : 'var(--text-2)',
                    position: 'relative',
                    opacity: n.disabled ? 0.7 : 1,
                  }}>
                  <span style={{ width: 18, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name={n.i} size={16} stroke={active ? 2 : 1.6} />
                  </span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{n.l}</span>
                  {n.count && (
                    <span style={{ fontSize: 10.5, color: 'var(--muted-2)', fontFamily: 'var(--font-mono)' }}>
                      {n.count}
                    </span>
                  )}
                  {n.badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999,
                      background: 'var(--warning)', color: '#291800',
                    }}>{n.badge}</span>
                  )}
                  {n.shortcut && active && (
                    <span className="a-mono" style={{ fontSize: 10, color: 'var(--primary)', opacity: .7 }}>
                      {n.shortcut}
                    </span>
                  )}
                  {active && (
                    <span style={{
                      position: 'absolute', left: 0, top: 6, bottom: 6, width: 3,
                      background: 'var(--primary)', borderRadius: 999,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Plan card */}
      <div style={{ margin: 12, padding: 14, borderRadius: 12,
                    background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)',
                    border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', right: -20, top: -20, width: 80, height: 80, borderRadius: 999,
          background: 'var(--accent-soft)', filter: 'blur(20px)',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="a-pill a-pill-accent" style={{ background: 'var(--accent)', color: '#001018' }}>
              ATHENAS Pro
            </span>
            <Icon name="bolt" size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 10, lineHeight: 1.4 }}>
            Sua loja está nos <b style={{ color: 'var(--text)' }}>top 8%</b> em produtividade este mês.
          </div>
          <button className="a-btn a-btn-ghost" style={{ height: 28, padding: '0 0',
                  marginTop: 8, fontSize: 11.5, color: 'var(--accent)' }}>
            Ver relatório <Icon name="chevron-right" size={12} stroke={2.2} />
          </button>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 999, flexShrink: 0,
          background: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)',
          display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 12,
        }}>PA</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Patrícia Andrade
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Gerente · operadora</div>
        </div>
        <Icon name="chevron-down" size={14} style={{ color: 'var(--muted)' }} />
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function TopBar({ route, tweaks, setTweak, subtheme }) {
  const map = {
    brand:     { c: 'Identidade', t: 'Marca & Sistema' },
    dashboard: { c: 'Visão geral', t: 'Dashboard' },
    pdv:       { c: 'Operação',   t: 'Ponto de venda' },
    produtos:  { c: 'Catálogo',   t: 'Produtos, serviços e fabricados' },
    stock:     { c: 'Gestão',     t: 'Estoque' },
    compras:   { c: 'Gestão',     t: 'Compras & Fornecedores' },
    clients:   { c: 'Gestão',     t: 'Clientes & Fiado' },
    kds:       { c: 'Fabricação',  t: 'Fabricação & Fila de Produção' },
  };
  const m = map[route] || map.brand;
  return (
    <header style={{
      height: 60, flexShrink: 0,
      borderBottom: '1px solid var(--border)',
      background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
      backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', padding: '0 20px 0 24px',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: '.14em',
                      textTransform: 'uppercase', fontWeight: 700 }}>{m.c}</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 1, letterSpacing: '-.01em' }}>{m.t}</div>
      </div>

      {/* Search (cmd-k style) */}
      <button className="a-btn" style={{
        height: 36, width: 280, padding: '0 12px',
        background: 'var(--surface-2)', justifyContent: 'space-between',
        color: 'var(--muted)', fontWeight: 500,
      }}>
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <Icon name="search" size={14} /> Buscar produto, venda, cliente…
        </span>
        <span className="a-mono" style={{ fontSize: 10.5, color: 'var(--muted-2)',
                                           border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 4 }}>
          ⌘K
        </span>
      </button>

      <div style={{ display: 'flex', gap: 6, marginLeft: 10 }}>
        <button className="a-btn a-btn-ghost" title="Notificações"
                style={{ width: 36, padding: 0, justifyContent: 'center', position: 'relative' }}>
          <Icon name="bell" size={16} />
          <span style={{
            position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 999,
            background: 'var(--accent)', boxShadow: '0 0 0 2px var(--surface)',
          }} />
        </button>
        <button onClick={() => { setTweak('theme', tweaks.theme === 'dark' ? 'light' : 'dark'); setTweak('subtheme', 'default'); }}
                className="a-btn a-btn-ghost"
                title={`Trocar para ${tweaks.theme === 'dark' ? 'light' : 'dark'}`}
                style={{ width: 36, padding: 0, justifyContent: 'center' }}>
          <Icon name={tweaks.theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
        <PalettePicker theme={tweaks.theme} subtheme={tweaks.subtheme} setTweak={setTweak} />
        <button className="a-btn a-btn-primary" style={{ padding: '0 14px' }}
                onClick={() => setTweak('route', 'pdv')}>
          <Icon name="plus" size={14} stroke={2.4} />
          Nova venda
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
