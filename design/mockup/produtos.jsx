// produtos.jsx — Catálogo modular: revenda · fabricado · serviço · variável
// Perfil do negócio: mercadinho · restaurante · vidraçaria · distribuidora

const { useState: useProd, useMemo: useProdMemo, useEffect: useProdEffect } = React;

// ─────────────────────────────────────────────────────────────────────────────
// DATA MODEL

const ITEM_TYPES = [
  { k: 'todos',     l: 'Todos',     i: 'box',     c: 'muted' },
  { k: 'revenda',   l: 'Revenda',   i: 'box',     c: 'primary',
    desc: 'Comprado para revender' },
  { k: 'fabricado', l: 'Fabricado', i: 'sparkle', c: 'accent',
    desc: 'Produzido com ficha técnica' },
  { k: 'servico',   l: 'Serviço',   i: 'clock',   c: 'success',
    desc: 'Mão de obra ou tempo' },
  { k: 'variavel',  l: 'Variável',  i: 'filter',  c: 'warning',
    desc: 'Vendido por peso ou medida' },
];

const PROFILES = [
  { k: 'mercadinho',    l: 'Mercadinho',     icon: 'pdv',     sub: 'Revenda + variáveis' },
  { k: 'restaurante',   l: 'Restaurante',    icon: 'sparkle', sub: 'Receitas + bebidas' },
  { k: 'vidracaria',    l: 'Vidraçaria',     icon: 'box',     sub: 'Sob medida + serviços' },
  { k: 'distribuidora', l: 'Distribuidora',  icon: 'stock',   sub: 'Atacado + logística' },
];

// Products loaded from API

const TYPE_BADGE = (k) => {
  const map = {
    revenda:   { l: 'Revenda',   c: 'primary' },
    fabricado: { l: 'Fabricado', c: 'accent' },
    servico:   { l: 'Serviço',   c: 'success' },
    variavel:  { l: 'Variável',  c: 'warning' },
  };
  return map[k];
};

const brl = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

// ─────────────────────────────────────────────────────────────────────────────
function Produtos({ tweaks, setTweak }) {
  const profile = tweaks.profile || 'mercadinho';
  const [items, setItems] = useProd([]);
  const [pLoading, setPLoading] = useProd(true);
  const [type, setType] = useProd('todos');
  const [query, setQuery] = useProd('');
  const [selectedId, setSelectedId] = useProd(null);
  const [view, setView] = useProd('list'); // list | grid

  useProdEffect(() => {
    setPLoading(true);
    Promise.all([
      window.api.get('/api/produto'),
      window.api.get('/api/estoque'),
    ]).then(([produtos, estoques]) => {
      const saldoMap = Object.fromEntries(estoques.map(e => [e.id, Number(e.saldo)]));
      setItems(produtos.map(p => ({
        id: p.id,
        t: 'revenda',
        n: p.nome,
        sku: p.codigo,
        cat: p.categoria || 'Geral',
        cost: p.preco_custo,
        price: p.preco_venda,
        stock: saldoMap[p.id] ?? 0,
        unit: (p.unidade || 'UN').toLowerCase(),
        stockAlert: (saldoMap[p.id] ?? 0) <= (p.estoque_min || 0),
      })));
    }).catch(() => {})
      .finally(() => setPLoading(false));
  }, []);

  const filtered = useProdMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(it => {
      if (type !== 'todos' && it.t !== type) return false;
      if (!q) return true;
      return it.n.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q) || it.cat.toLowerCase().includes(q);
    });
  }, [items, type, query]);

  // Auto-select first when filter changes
  const effectiveSelected = useProdMemo(() => {
    if (selectedId && filtered.find(i => i.id === selectedId)) return selectedId;
    return filtered[0]?.id || null;
  }, [selectedId, filtered]);
  const selected = filtered.find(i => i.id === effectiveSelected);

  const counts = useProdMemo(() => {
    const c = { todos: items.length, revenda: 0, fabricado: 0, servico: 0, variavel: 0 };
    items.forEach(i => c[i.t]++);
    return c;
  }, [items]);

  // KPI calc
  const kpis = useProdMemo(() => {
    const tot = items.length;
    const lowStock = items.filter(i => typeof i.stock === 'number' && i.stock <= 5).length;
    const margens = items
      .filter(i => i.cost && i.price && typeof i.price === 'number')
      .map(i => ((i.price - i.cost) / i.price) * 100);
    const avgMargin = margens.length ? margens.reduce((a,b) => a+b, 0) / margens.length : 0;
    const fabricados = counts.fabricado;
    return { tot, lowStock, avgMargin, fabricados };
  }, [items, counts]);

  if (pLoading) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
      Carregando catálogo…
    </div>
  );

  return (
    <div style={{ padding: '24px 32px 60px', maxWidth: 1640, margin: '0 auto', width: '100%' }}>
      {/* Page head */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>
            Catálogo
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700, letterSpacing: '-.025em' }}>
            Produtos, serviços e fabricados
            <span style={{ color: 'var(--muted)', fontWeight: 500, marginLeft: 8, fontSize: 16 }}>
              · {kpis.tot} itens
            </span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="a-btn">
            <Icon name="arrow-down" size={14} /> Importar planilha
          </button>
          <button className="a-btn">
            <Icon name="filter" size={14} /> Mais
          </button>
          <button className="a-btn a-btn-primary">
            <Icon name="plus" size={14} stroke={2.4} /> Novo item
          </button>
        </div>
      </div>

      {/* Profile switcher */}
      <ProfileSwitcher current={profile} onChange={(p) => { setTweak('profile', p); setSelectedId(null); }} />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                     gap: 12, marginTop: 16 }}>
        <SmallKPI eyebrow="Total no catálogo" value={kpis.tot} foot="itens ativos" icon="box" tone="primary" />
        <SmallKPI eyebrow="Estoque crítico" value={kpis.lowStock} foot="precisam de reposição" icon="stock" tone="warning" />
        <SmallKPI eyebrow="Margem média" value={`${kpis.avgMargin.toFixed(1)}%`} foot="dos itens com custo" icon="trend-up" tone="success" />
        <SmallKPI eyebrow="Fabricados / ficha técnica" value={kpis.fabricados} foot="com receita cadastrada" icon="sparkle" tone="accent" />
      </div>

      {/* Type tabs + search */}
      <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'space-between',
                     alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)',
                       border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
          {ITEM_TYPES.map(t => (
            <button key={t.k} onClick={() => setType(t.k)}
              style={{
                padding: '7px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                background: type === t.k ? `var(--${t.c}-soft)` : 'transparent',
                color: type === t.k ? `var(--${t.c})` : 'var(--muted)',
                border: 'none', cursor: 'default', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 7,
              }}>
              <Icon name={t.i} size={13} stroke={type === t.k ? 2 : 1.6} />
              {t.l}
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                background: type === t.k ? 'transparent' : 'var(--surface-3)',
                color: type === t.k ? 'inherit' : 'var(--muted)',
                opacity: type === t.k ? .85 : 1,
                fontFamily: 'var(--font-mono)',
              }}>{counts[t.k]}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={14}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                       color: 'var(--muted)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nome, SKU ou categoria…"
              className="a-input"
              style={{ height: 36, paddingLeft: 32, width: 280, fontSize: 12.5 }}
            />
          </div>
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)',
                         borderRadius: 8, padding: 3 }}>
            <button onClick={() => setView('list')} title="Lista"
                    style={viewToggleBtn(view === 'list')}>
              <Icon name="reports" size={14} stroke={1.8} />
            </button>
            <button onClick={() => setView('grid')} title="Cartões"
                    style={viewToggleBtn(view === 'grid')}>
              <Icon name="dashboard" size={14} stroke={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* Main: list + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <div className="a-card" style={{ overflow: 'hidden' }}>
          {view === 'list'
            ? <ItemTable items={filtered} selectedId={effectiveSelected} onSelect={setSelectedId} />
            : <ItemGrid  items={filtered} selectedId={effectiveSelected} onSelect={setSelectedId} />}
        </div>

        <div style={{ position: 'sticky', top: 76 }}>
          {selected
            ? <ItemDetail item={selected} />
            : <EmptyDetail />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function viewToggleBtn(active) {
  return {
    width: 30, height: 28, padding: 0, border: 'none', borderRadius: 5,
    background: active ? 'var(--surface-3)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--muted)',
    cursor: 'default', display: 'grid', placeItems: 'center', fontFamily: 'inherit',
  };
}

function SmallKPI({ eyebrow, value, foot, icon, tone }) {
  return (
    <div className="a-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `var(--${tone}-soft)`, color: `var(--${tone})`,
        display: 'grid', placeItems: 'center',
      }}>
        <Icon name={icon} size={18} stroke={1.8} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: '.08em',
                       textTransform: 'uppercase', fontWeight: 700 }}>{eyebrow}</div>
        <div className="a-num" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', marginTop: 2 }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{foot}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function ProfileSwitcher({ current, onChange }) {
  return (
    <div className="a-card" style={{
      padding: 6, marginTop: 8, display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
      background: 'var(--surface)',
    }}>
      {PROFILES.map(p => {
        const active = current === p.k;
        return (
          <button key={p.k} onClick={() => onChange(p.k)}
            style={{
              padding: '12px 14px', borderRadius: 9, cursor: 'default', fontFamily: 'inherit',
              background: active ? 'linear-gradient(135deg, var(--primary-soft) 0%, var(--accent-soft) 200%)' : 'transparent',
              border: '1px solid', borderColor: active ? 'var(--primary)' : 'transparent',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
              position: 'relative', minHeight: 56,
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: active ? 'var(--primary)' : 'var(--surface-2)',
              color: active ? '#fff' : 'var(--muted)',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              <Icon name={p.icon} size={16} stroke={1.8} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--text)' : 'var(--text-2)' }}>
                {p.l}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{p.sub}</div>
            </div>
            {active && (
              <span style={{
                position: 'absolute', top: 8, right: 10,
                width: 6, height: 6, borderRadius: 999, background: 'var(--accent)',
                boxShadow: '0 0 0 4px var(--accent-soft)',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function ItemTable({ items, selectedId, onSelect }) {
  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.8fr 110px 130px 110px 140px 100px 40px',
        padding: '10px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)',
        fontSize: 10.5, fontWeight: 700, color: 'var(--muted)',
        letterSpacing: '.08em', textTransform: 'uppercase',
      }}>
        <div>Item</div>
        <div>Tipo</div>
        <div>Categoria</div>
        <div style={{ textAlign: 'right' }}>Preço</div>
        <div style={{ textAlign: 'right' }}>Estoque / Tempo</div>
        <div style={{ textAlign: 'right' }}>Margem</div>
        <div></div>
      </div>
      <div style={{ maxHeight: 'calc(100vh - 420px)', minHeight: 280, overflowY: 'auto' }}>
        {items.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Nenhum item encontrado nesse filtro.
          </div>
        )}
        {items.map(it => <ItemRow key={it.id} item={it} selected={selectedId === it.id} onClick={() => onSelect(it.id)} />)}
      </div>
    </div>
  );
}

function ItemRow({ item, selected, onClick }) {
  const tb = TYPE_BADGE(item.t);
  const margin = item.cost && typeof item.price === 'number'
    ? ((item.price - item.cost) / item.price) * 100 : null;

  const stockCell = (() => {
    if (item.t === 'fabricado' && item.tempo) {
      return <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', justifyContent: 'flex-end', color: 'var(--text-2)' }}>
        <Icon name="clock" size={12} stroke={1.8} /> {item.tempo}
      </span>;
    }
    if (item.t === 'servico') {
      return <span style={{ color: 'var(--muted)', fontSize: 11.5 }}>{item.duracao || '—'}</span>;
    }
    if (item.t === 'variavel') {
      return <span style={{ color: 'var(--muted)', fontSize: 11.5 }}>por {item.unit}</span>;
    }
    if (typeof item.stock === 'number') {
      const low = item.stockAlert || item.stock <= 5;
      return (
        <span style={{
          display: 'inline-flex', gap: 5, alignItems: 'center', justifyContent: 'flex-end',
          color: low ? 'var(--danger)' : 'var(--text-2)', fontWeight: low ? 700 : 500,
        }}>
          {low && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />}
          <span className="a-num">{item.stock}</span>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>{item.unit}</span>
        </span>
      );
    }
    return <span style={{ color: 'var(--muted)', fontSize: 11.5 }}>{item.stockTxt || '∞'}</span>;
  })();

  const priceCell = typeof item.price === 'number'
    ? <span className="a-num" style={{ fontWeight: 700 }}>{brl(item.price)}{item.unit && (item.t === 'variavel' || item.t === 'fabricado' && item.unit !== 'un') ? <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 11 }}>/{item.unit}</span> : null}</span>
    : <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 11.5 }}>{item.priceModel}</span>;

  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'grid', gridTemplateColumns: '1.8fr 110px 130px 110px 140px 100px 40px',
      padding: '12px 16px', alignItems: 'center', gap: 8,
      background: selected ? 'var(--primary-soft)' : 'transparent',
      borderLeft: '3px solid', borderLeftColor: selected ? 'var(--primary)' : 'transparent',
      borderBottom: '1px solid var(--border)', cursor: 'default',
      fontFamily: 'inherit', textAlign: 'left', fontSize: 13, color: 'var(--text)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.n}
        </div>
        <div className="a-mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.sku}</div>
      </div>
      <div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          background: `var(--${tb.c}-soft)`, color: `var(--${tb.c})`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />
          {tb.l}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{item.cat}</div>
      <div style={{ textAlign: 'right' }}>{priceCell}</div>
      <div style={{ textAlign: 'right', fontSize: 12 }}>{stockCell}</div>
      <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>
        {margin != null ? <><span className="a-num" style={{ color: margin >= 40 ? 'var(--success)' : 'var(--text-2)', fontWeight: 600 }}>{margin.toFixed(1)}%</span></> : '—'}
      </div>
      <div style={{ textAlign: 'center', color: 'var(--muted-2)' }}>
        <Icon name="chevron-right" size={14} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function ItemGrid({ items, selectedId, onSelect }) {
  return (
    <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10,
                   maxHeight: 'calc(100vh - 420px)', minHeight: 280, overflowY: 'auto' }}>
      {items.map(it => {
        const tb = TYPE_BADGE(it.t);
        const sel = selectedId === it.id;
        return (
          <button key={it.id} onClick={() => onSelect(it.id)} style={{
            padding: 12, borderRadius: 10,
            background: sel ? 'var(--primary-soft)' : 'var(--surface-2)',
            border: '1px solid', borderColor: sel ? 'var(--primary)' : 'var(--border)',
            textAlign: 'left', cursor: 'default', fontFamily: 'inherit',
          }}>
            <div style={{
              aspectRatio: '1.4 / 1', borderRadius: 6, marginBottom: 10,
              background: `repeating-linear-gradient(45deg, var(--surface-3), var(--surface-3) 6px, var(--surface) 6px, var(--surface) 12px)`,
              display: 'grid', placeItems: 'center', border: '1px solid var(--border)',
              position: 'relative',
            }}>
              <Icon name={ITEM_TYPES.find(t => t.k === it.t)?.i || 'box'} size={22}
                    stroke={1.4} style={{ color: `var(--${tb.c})`, opacity: .7 }} />
              <span style={{
                position: 'absolute', top: 6, left: 6,
                padding: '2px 6px', borderRadius: 4, fontSize: 9.5, fontWeight: 700,
                background: `var(--${tb.c}-soft)`, color: `var(--${tb.c})`, textTransform: 'uppercase', letterSpacing: '.06em',
              }}>{tb.l}</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, minHeight: 32,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {it.n}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
              <span className="a-num" style={{ fontSize: 14, fontWeight: 700 }}>
                {typeof it.price === 'number' ? brl(it.price) : it.priceModel}
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{it.cat}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function EmptyDetail() {
  return (
    <div className="a-card" style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
      <Icon name="box" size={32} stroke={1.4} />
      <div style={{ marginTop: 10, fontSize: 13 }}>Selecione um item para ver os detalhes.</div>
    </div>
  );
}

function ItemDetail({ item }) {
  const tb = TYPE_BADGE(item.t);
  const typeMeta = ITEM_TYPES.find(t => t.k === item.t);

  return (
    <div className="a-card" style={{ overflow: 'hidden' }}>
      {/* Hero */}
      <div style={{
        height: 124, position: 'relative',
        background: `repeating-linear-gradient(45deg, var(--surface-2), var(--surface-2) 10px, var(--surface-3) 10px, var(--surface-3) 20px)`,
        borderBottom: '1px solid var(--border)',
        display: 'grid', placeItems: 'center',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: 14,
          background: `var(--${tb.c}-soft)`, color: `var(--${tb.c})`,
          display: 'grid', placeItems: 'center',
        }}>
          <Icon name={typeMeta?.i || 'box'} size={28} stroke={1.6} />
        </div>
        <span style={{
          position: 'absolute', top: 10, left: 12,
          padding: '4px 9px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          background: `var(--${tb.c})`, color: tb.c === 'warning' ? '#291800' : '#fff',
          textTransform: 'uppercase', letterSpacing: '.06em',
        }}>{tb.l}</span>
        <span style={{
          position: 'absolute', top: 10, right: 12,
          padding: '4px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600,
          background: 'var(--surface)', color: 'var(--text-2)',
          border: '1px solid var(--border)',
        }}>
          {item.cat}
        </span>
      </div>

      {/* Header */}
      <div style={{ padding: '16px 18px 8px' }}>
        <div className="a-mono" style={{ fontSize: 10.5, color: 'var(--muted)' }}>{item.sku}</div>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.01em', marginTop: 4 }}>{item.n}</div>

        {/* Price block */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
          {typeof item.price === 'number' ? (
            <>
              <span className="a-num" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em' }}>{brl(item.price)}</span>
              {item.unit && (item.t === 'variavel' || (item.t === 'fabricado' && item.unit !== 'un')) && (
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>/ {item.unit}</span>
              )}
            </>
          ) : (
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{item.priceModel}</span>
          )}
        </div>
      </div>

      {/* Type-specific body */}
      <div style={{ padding: '4px 18px 16px', borderTop: '1px dashed var(--border)', marginTop: 4 }}>
        {item.t === 'revenda'   && <BodyRevenda item={item} />}
        {item.t === 'fabricado' && <BodyFabricado item={item} />}
        {item.t === 'servico'   && <BodyServico item={item} />}
        {item.t === 'variavel'  && <BodyVariavel item={item} />}
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 14px',
                     background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
        <button className="a-btn" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>Editar</button>
        <button className="a-btn" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>Histórico</button>
        <button className="a-btn a-btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
          <Icon name="plus" size={13} /> Adicionar
        </button>
      </div>
    </div>
  );
}

// Detail bodies ───────────────────────────────────────────────────────────────
function DetailRow({ l, v, mono, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                   padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{l}</span>
      <span className={mono ? 'a-mono' : 'a-num'}
            style={{ fontSize: 13, fontWeight: 600,
                     color: accent ? 'var(--accent)' : 'var(--text)' }}>
        {v}
      </span>
    </div>
  );
}

function BodyRevenda({ item }) {
  const margin = item.cost && typeof item.price === 'number'
    ? ((item.price - item.cost) / item.price) * 100 : null;
  const low = item.stockAlert || (typeof item.stock === 'number' && item.stock <= 5);
  return (
    <div>
      <SectionTitle>Estoque & fornecedor</SectionTitle>
      <DetailRow l="Em estoque" v={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: low ? 'var(--danger)' : 'var(--text)' }}>
          {low && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />}
          {item.stock} {item.unit}
        </span>
      } />
      {item.supplier && <DetailRow l="Fornecedor" v={item.supplier} mono={false} />}
      {item.mov && <DetailRow l="Última movimentação" v={item.mov} />}

      <SectionTitle style={{ marginTop: 14 }}>Custo & margem</SectionTitle>
      <DetailRow l="Custo de aquisição" v={brl(item.cost)} />
      <DetailRow l="Preço de venda" v={brl(item.price)} />
      <DetailRow l="Margem bruta" v={`${margin?.toFixed(1)}%`} accent />
      <DetailRow l="Lucro por un." v={brl(item.price - item.cost)} />

      {low && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 9,
          background: 'var(--danger-soft)', color: 'var(--danger)',
          display: 'flex', gap: 10, alignItems: 'center', fontSize: 12,
        }}>
          <Icon name="bell" size={14} stroke={2} />
          <div>
            <b>Estoque crítico.</b> Pedido sugerido para o fornecedor.
          </div>
        </div>
      )}
    </div>
  );
}

function BodyFabricado({ item }) {
  const totalCusto = (item.ficha || []).reduce((s, l) => s + l.c, 0);
  const margin = typeof item.price === 'number' && totalCusto
    ? ((item.price - totalCusto) / item.price) * 100 : null;
  return (
    <div>
      <SectionTitle>
        Ficha técnica
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--muted)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
          custo calculado dos insumos
        </span>
      </SectionTitle>
      <div style={{
        background: 'var(--surface-2)', borderRadius: 9, padding: 10,
        border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {(item.ficha || []).map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px',
                                  fontSize: 12, padding: '4px 0', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 500 }}>{l.i}</span>
            <span style={{ color: 'var(--muted)', textAlign: 'right' }}>{l.q}</span>
            <span className="a-num" style={{ textAlign: 'right', fontWeight: 600 }}>{brl(l.c)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                       paddingTop: 8, borderTop: '1px dashed var(--border)', marginTop: 4 }}>
          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Custo total da receita</span>
          <span className="a-num" style={{ fontWeight: 700, fontSize: 13.5 }}>{brl(totalCusto)}</span>
        </div>
      </div>

      <SectionTitle style={{ marginTop: 14 }}>Produção</SectionTitle>
      <DetailRow l="Tempo de preparo" v={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name="clock" size={12} stroke={1.8} /> {item.tempo}
        </span>
      } />
      {item.rendimento && <DetailRow l="Rendimento" v={item.rendimento} />}
      {typeof item.stock === 'number' && <DetailRow l="Prontos em estoque" v={`${item.stock} un`} />}

      <SectionTitle style={{ marginTop: 14 }}>Resultado</SectionTitle>
      <DetailRow l="Preço de venda" v={brl(item.price)} />
      <DetailRow l="Margem bruta" v={`${margin?.toFixed(1)}%`} accent />
      <DetailRow l="Lucro por un." v={brl(item.price - totalCusto)} />
    </div>
  );
}

function BodyServico({ item }) {
  return (
    <div>
      <SectionTitle>Modelo de cobrança</SectionTitle>
      <DetailRow l="Tipo de preço" v={
        typeof item.price === 'number' ? `Fixo · ${brl(item.price)}` : item.priceModel
      } accent />
      {item.duracao && <DetailRow l="Duração estimada" v={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name="clock" size={12} stroke={1.8} /> {item.duracao}
        </span>
      } />}
      {item.profissional && <DetailRow l="Equipe / profissional" v={item.profissional} />}
      {item.comissao && <DetailRow l="Comissão do operador" v={item.comissao} />}

      <div style={{
        marginTop: 14, padding: 12, borderRadius: 9,
        background: 'var(--success-soft)', color: 'var(--success)',
        display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12,
      }}>
        <Icon name="sparkle" size={14} stroke={1.8} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <b>Serviço.</b> Não consome estoque. Aparece no PDV como linha de serviço
          e pode ser combinado com produtos no mesmo cupom.
        </div>
      </div>
    </div>
  );
}

function BodyVariavel({ item }) {
  const margin = item.cost && typeof item.price === 'number'
    ? ((item.price - item.cost) / item.price) * 100 : null;
  return (
    <div>
      <SectionTitle>Vendido por medida</SectionTitle>
      <DetailRow l="Unidade" v={
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '2px 9px', borderRadius: 999,
          background: 'var(--warning-soft)', color: 'var(--warning)',
          fontWeight: 700, fontSize: 11.5,
        }}>{item.unit}</span>
      } />
      {item.cost && <DetailRow l="Custo / unidade" v={brl(item.cost)} />}
      <DetailRow l="Preço / unidade" v={brl(item.price)} />
      {margin && <DetailRow l="Margem" v={`${margin.toFixed(1)}%`} accent />}

      {typeof item.stock === 'number' && (
        <>
          <SectionTitle style={{ marginTop: 14 }}>Estoque atual</SectionTitle>
          <DetailRow l="Disponível" v={`${item.stock} ${item.unit}`} />
        </>
      )}

      {/* Quick calculator */}
      <SectionTitle style={{ marginTop: 14 }}>Calculadora rápida</SectionTitle>
      <QuickCalc unit={item.unit} price={item.price} />

      {item.notes && (
        <div style={{
          marginTop: 12, padding: 10, borderRadius: 8,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          fontSize: 11.5, color: 'var(--muted)',
        }}>{item.notes}</div>
      )}
    </div>
  );
}

function QuickCalc({ unit, price }) {
  const [v, setV] = useProd(1);
  return (
    <div style={{
      padding: 12, borderRadius: 9,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="number" step="0.01" min="0"
          value={v}
          onChange={e => setV(parseFloat(e.target.value) || 0)}
          className="a-input"
          style={{ height: 32, fontSize: 13, fontWeight: 600, width: 90 }}
        />
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{unit} ×</span>
        <span className="a-num" style={{ fontSize: 12, color: 'var(--muted)' }}>{brl(price)}</span>
        <span style={{ flex: 1, textAlign: 'right' }}>
          <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>=</span>{' '}
          <span className="a-num" style={{ fontSize: 16, fontWeight: 700 }}>
            {brl(v * price)}
          </span>
        </span>
      </div>
    </div>
  );
}

function SectionTitle({ children, style }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 700, color: 'var(--muted)',
      letterSpacing: '.12em', textTransform: 'uppercase',
      marginTop: 10, marginBottom: 6, display: 'flex', alignItems: 'baseline', ...style,
    }}>{children}</div>
  );
}

Object.assign(window, { Produtos });
