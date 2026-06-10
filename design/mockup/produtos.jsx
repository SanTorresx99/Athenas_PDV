// produtos.jsx — Catálogo modular: Comércio · Serviços · Fabricados

const { useState: useProd, useMemo: useProdMemo, useEffect: useProdEffect } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Módulos operacionais do negócio
const MODULOS = [
  {
    k: 'comercio', l: 'Comércio', i: 'box',
    sub: 'Produtos comprados e estocados para venda',
    color: 'primary',
    // Quais perfis de negócio têm este módulo ativo
    ativos: ['mercadinho', 'distribuidora', 'restaurante', 'vidracaria'],
  },
  {
    k: 'servicos', l: 'Serviços', i: 'clock',
    sub: 'Mão de obra, tempo e prestação de serviço',
    color: 'success',
    ativos: ['restaurante', 'vidracaria'],
  },
  {
    k: 'fabricados', l: 'Fabricados', i: 'sparkle',
    sub: 'Produção própria com ficha técnica',
    color: 'accent',
    ativos: ['restaurante', 'vidracaria'],
  },
];

// Sub-filtros dentro de Comércio
const ITEM_TYPES = [
  { k: 'todos',   l: 'Todos',    i: 'box',    c: 'muted' },
  { k: 'revenda', l: 'Revenda',  i: 'box',    c: 'primary', desc: 'Comprado para revender' },
  { k: 'variavel',l: 'Variável', i: 'filter', c: 'warning', desc: 'Vendido por peso ou medida' },
];

const TYPE_BADGE = (k) => {
  const map = {
    revenda:   { l: 'Revenda',   c: 'primary' },
    fabricado: { l: 'Fabricado', c: 'accent' },
    servico:   { l: 'Serviço',   c: 'success' },
    variavel:  { l: 'Variável',  c: 'warning' },
  };
  return map[k] || { l: 'Revenda', c: 'primary' };
};

const brl = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

// ─────────────────────────────────────────────────────────────────────────────
function Produtos({ tweaks, setTweak }) {
  const profile = tweaks.profile || 'distribuidora';
  const [modulo, setModulo] = useProd('comercio');
  const [items, setItems] = useProd([]);
  const [pLoading, setPLoading] = useProd(true);
  const [type, setType] = useProd('todos');
  const [query, setQuery] = useProd('');
  const [selectedId, setSelectedId] = useProd(null);
  const [view, setView] = useProd('list');
  const [showNovo, setShowNovo] = useProd(false);
  const [editando, setEditando] = useProd(null);      // item a editar
  const [showImport, setShowImport] = useProd(false);
  const [detalheExtra, setDetalheExtra] = useProd({}); // { [id]: { ficha, recursos, custo } }

  function carregar() {
    setPLoading(true);
    Promise.all([
      window.api.get('/api/produto'),
      window.api.get('/api/estoque'),
    ]).then(([produtos, estoques]) => {
      const saldoMap = Object.fromEntries(estoques.map(e => [e.id, Number(e.saldo)]));
      setItems(produtos.map(p => ({
        id: p.id,
        t: p.tipo || 'revenda',
        n: p.nome,
        sku: p.codigo,
        cat: p.categoria || 'Geral',
        cost: p.custo_medio || p.preco_custo || 0,
        custo_medio: p.custo_medio || 0,
        preco_custo: p.preco_custo || 0,
        price: p.preco_venda,
        stock: saldoMap[p.id] ?? 0,
        unit: (p.unidade || 'UN').toLowerCase(),
        unidade: p.unidade || 'UN',
        stockAlert: (saldoMap[p.id] ?? 0) <= (p.estoque_min || 0),
        estoque_min: p.estoque_min || 0,
        tempo_preparo_min: p.tempo_preparo_min,
        rendimento_qtd: p.rendimento_qtd,
        rendimento_un: p.rendimento_un,
        qtd_embalagem: p.qtd_embalagem,
        requer_producao: p.requer_producao,
        categoria: p.categoria,
        ativo: p.ativo,
        descricao: p.descricao,
      })));
    }).catch(() => {})
      .finally(() => setPLoading(false));
  }

  useProdEffect(() => { carregar(); }, []);

  // Carrega ficha/recursos/custo do produto selecionado (fabricado ou serviço)
  useProdEffect(() => {
    if (!selectedId) return;
    const item = items.find(i => i.id === selectedId);
    if (!item || detalheExtra[selectedId]) return;
    if (item.t === 'fabricado' || item.t === 'servico') {
      Promise.all([
        window.api.get(`/api/produto/${selectedId}`),
        window.api.get(`/api/produto/${selectedId}/custo`),
      ]).then(([det, custo]) => {
        setDetalheExtra(prev => ({ ...prev, [selectedId]: { ficha: det.ficha || [], recursos: det.recursos || [], custo } }));
      }).catch(() => {});
    } else if (item.t === 'revenda' || item.t === 'variavel') {
      window.api.get(`/api/produto/${selectedId}/custo`)
        .then(custo => setDetalheExtra(prev => ({ ...prev, [selectedId]: { ficha: [], recursos: [], custo } })))
        .catch(() => {});
    }
  }, [selectedId]);

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
    const c = { todos: items.length, revenda: 0, variavel: 0, fabricado: 0, servico: 0 };
    items.forEach(i => { if (c[i.t] !== undefined) c[i.t]++; });
    return c;
  }, [items]);

  // KPI calc usando CME real
  const kpis = useProdMemo(() => {
    const tot = items.length;
    const lowStock = items.filter(i => typeof i.stock === 'number' && i.stockAlert).length;
    const margens = items
      .filter(i => i.custo_medio > 0 && i.price > 0)
      .map(i => ((i.price - i.custo_medio) / i.price) * 100);
    const avgMargin = margens.length ? margens.reduce((a,b) => a+b, 0) / margens.length : 0;
    return { tot, lowStock, avgMargin, fabricados: counts.fabricado };
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
          <button className="a-btn" onClick={() => setShowImport(true)}>
            <Icon name="arrow-down" size={14} /> Importar planilha
          </button>
          <button className="a-btn a-btn-primary" onClick={() => { setEditando(null); setShowNovo(true); }}>
            <Icon name="plus" size={14} stroke={2.4} /> Novo item
          </button>
        </div>
      </div>

      {/* Módulos operacionais */}
      <ModuleTabs profile={profile} current={modulo} onChange={(m) => { setModulo(m); setType('todos'); setSelectedId(null); }} />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                     gap: 12, marginTop: 16 }}>
        <SmallKPI eyebrow="Total no catálogo" value={kpis.tot} foot="itens ativos" icon="box" tone="primary" />
        <SmallKPI eyebrow="Estoque crítico" value={kpis.lowStock} foot="precisam de reposição" icon="stock" tone="warning" />
        <SmallKPI eyebrow="Margem média" value={`${kpis.avgMargin.toFixed(1)}%`} foot="dos itens com custo" icon="trend-up" tone="success" />
        <SmallKPI eyebrow="Fabricados / ficha técnica" value={kpis.fabricados} foot="com receita cadastrada" icon="sparkle" tone="accent" />
      </div>

      {/* Sub-filtros + search */}
      <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'space-between',
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
              }}>{counts[t.k] ?? 0}</span>
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
            ? <ItemDetail
                item={selected}
                extra={detalheExtra[selected.id]}
                onEditar={(item) => { setEditando(item); setShowNovo(true); }}
              />
            : <EmptyDetail />}
        </div>
      </div>

      {/* Modais */}
      {showNovo && (
        <ProdutoModal
          editando={editando}
          onSalvar={async (dados) => {
            if (editando) {
              await window.api.put(`/api/produto/${editando.id}`, dados);
            } else {
              await window.api.post('/api/produto', dados);
            }
            setShowNovo(false);
            setEditando(null);
            // Limpa cache de detalhe do produto editado
            if (editando) setDetalheExtra(prev => { const n = {...prev}; delete n[editando.id]; return n; });
            carregar();
          }}
          onCancelar={() => { setShowNovo(false); setEditando(null); }}
        />
      )}

      {showImport && (
        <CsvImportModal
          onImportar={async (produtos) => {
            await Promise.all(produtos.map(p => window.api.post('/api/produto', p)));
            setShowImport(false);
            carregar();
          }}
          onCancelar={() => setShowImport(false)}
        />
      )}
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
function ModuleTabs({ profile, current, onChange }) {
  return (
    <div style={{
      marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
    }}>
      {MODULOS.map(m => {
        const ativo = m.ativos.includes(profile);
        const sel = current === m.k && ativo;
        return (
          <button
            key={m.k}
            onClick={() => ativo && onChange(m.k)}
            disabled={!ativo}
            style={{
              padding: '14px 16px', borderRadius: 12, fontFamily: 'inherit',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14,
              border: '1px solid',
              borderColor: sel ? `var(--${m.color})` : 'var(--border)',
              background: sel
                ? `linear-gradient(135deg, var(--${m.color}-soft) 0%, transparent 120%)`
                : 'var(--surface)',
              cursor: ativo ? 'default' : 'not-allowed',
              opacity: ativo ? 1 : 0.48,
              position: 'relative',
              transition: 'border-color .15s, background .15s',
            }}>
            {/* Icon tile */}
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: sel ? `var(--${m.color})` : 'var(--surface-2)',
              color: sel ? '#fff' : `var(--${m.color})`,
              display: 'grid', placeItems: 'center',
              transition: 'background .15s, color .15s',
            }}>
              <Icon name={m.i} size={18} stroke={1.8} />
            </div>

            {/* Text */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13.5, fontWeight: 700, letterSpacing: '-.01em',
                color: sel ? 'var(--text)' : ativo ? 'var(--text-2)' : 'var(--muted)',
              }}>{m.l}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, lineHeight: 1.3 }}>
                {m.sub}
              </div>
            </div>

            {/* Estado */}
            {sel && (
              <span style={{
                position: 'absolute', top: 10, right: 12,
                width: 7, height: 7, borderRadius: 999,
                background: `var(--${m.color})`,
                boxShadow: `0 0 0 3px var(--${m.color}-soft)`,
              }} />
            )}
            {!ativo && (
              <span style={{
                position: 'absolute', top: 10, right: 12,
                fontSize: 10, fontWeight: 700, color: 'var(--muted-2)',
                letterSpacing: '.06em', textTransform: 'uppercase',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <Icon name="close" size={10} stroke={2.2} /> não ativo
              </span>
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

function ItemDetail({ item, extra, onEditar }) {
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
        {item.t === 'revenda'   && <BodyRevenda item={item} custo={extra?.custo} />}
        {item.t === 'fabricado' && <BodyFabricado item={item} ficha={extra?.ficha} custo={extra?.custo} />}
        {item.t === 'servico'   && <BodyServico item={item} recursos={extra?.recursos} custo={extra?.custo} />}
        {item.t === 'variavel'  && <BodyVariavel item={item} custo={extra?.custo} />}
        {!extra && (item.t === 'fabricado' || item.t === 'servico') && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, padding: '12px 0' }}>
            Carregando detalhes…
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 14px',
                     background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
        <button className="a-btn" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                onClick={() => onEditar && onEditar(item)}>
          <Icon name="edit" size={12} /> Editar
        </button>
        <button className="a-btn a-btn-primary" style={{ flex: 2, justifyContent: 'center', fontSize: 12 }}
                onClick={() => window.dispatchEvent(new CustomEvent('pdv:add', { detail: item }))}>
          <Icon name="plus" size={13} /> Adicionar ao PDV
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

function BodyRevenda({ item, custo }) {
  const cme   = custo?.custo_medio ?? item.custo_medio ?? 0;
  const pv    = item.price;
  const margin = custo?.margem_bruta ?? (cme > 0 && pv > 0 ? ((pv - cme) / pv) * 100 : null);
  const markup = custo?.markup ?? (cme > 0 ? (pv / cme - 1) * 100 : null);
  const low   = item.stockAlert;
  return (
    <div>
      <SectionTitle>Estoque</SectionTitle>
      <DetailRow l="Em estoque" v={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: low ? 'var(--danger)' : 'var(--text)' }}>
          {low && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />}
          {item.stock} {item.unit}
        </span>
      } />
      <DetailRow l="Estoque mínimo" v={`${item.estoque_min} ${item.unit}`} />

      <SectionTitle style={{ marginTop: 14 }}>Custo & margem</SectionTitle>
      <DetailRow l="CME (custo médio)" v={brl(cme)} />
      <DetailRow l="Preço de venda" v={brl(pv)} />
      {margin != null && <DetailRow l="Margem bruta" v={`${margin.toFixed(1)}%`} accent />}
      {markup != null && <DetailRow l="Markup" v={`${markup.toFixed(1)}%`} />}
      {cme > 0 && <DetailRow l="Lucro por un." v={brl(pv - cme)} />}

      {low && (
        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 9,
                      background: 'var(--danger-soft)', color: 'var(--danger)',
                      display: 'flex', gap: 10, alignItems: 'center', fontSize: 12 }}>
          <Icon name="bell" size={14} stroke={2} />
          <div><b>Estoque crítico.</b> Pedido sugerido para o fornecedor.</div>
        </div>
      )}
    </div>
  );
}

function BodyFabricado({ item, ficha, custo }) {
  const fichaItens = ficha || [];
  const custoTotal = custo?.cmv_fabricado
    ?? fichaItens.reduce((s, l) => s + (l.custo_unitario || 0) * l.quantidade, 0);
  const pv = item.price;
  const margin = pv > 0 && custoTotal > 0 ? ((pv - custoTotal) / pv) * 100 : null;

  return (
    <div>
      <SectionTitle>
        Ficha técnica
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--muted)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
          custo via CME dos insumos
        </span>
      </SectionTitle>
      <div style={{ background: 'var(--surface-2)', borderRadius: 9, padding: 10,
                    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {fichaItens.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>
            Ficha técnica não cadastrada
          </div>
        )}
        {fichaItens.map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px',
                                  fontSize: 12, padding: '4px 0', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 500 }}>{l.insumo_nome}</span>
            <span style={{ color: 'var(--muted)', textAlign: 'right' }}>{l.quantidade} {l.unidade}</span>
            <span className="a-num" style={{ textAlign: 'right', fontWeight: 600 }}>
              {brl((l.custo_unitario || 0) * l.quantidade)}
            </span>
          </div>
        ))}
        {fichaItens.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                         paddingTop: 8, borderTop: '1px dashed var(--border)', marginTop: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>CMV total da receita</span>
            <span className="a-num" style={{ fontWeight: 700, fontSize: 13.5 }}>{brl(custoTotal)}</span>
          </div>
        )}
      </div>

      <SectionTitle style={{ marginTop: 14 }}>Fabricação</SectionTitle>
      {item.tempo_preparo_min
        ? <DetailRow l="Tempo de preparo" v={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon name="clock" size={12} stroke={1.8} />
              {item.tempo_preparo_min < 60
                ? `${item.tempo_preparo_min} min`
                : `${Math.floor(item.tempo_preparo_min / 60)}h${item.tempo_preparo_min % 60 > 0 ? ` ${item.tempo_preparo_min % 60}min` : ''}`}
            </span>
          } />
        : null}
      {item.rendimento_qtd && <DetailRow l="Rendimento" v={`${item.rendimento_qtd} ${item.rendimento_un || item.unit}`} />}
      <DetailRow l="Prontos em estoque" v={`${item.stock} ${item.unit}`} />
      <DetailRow l="Entra na fila de produção" v={item.requer_producao ? 'Sim' : 'Não'} />

      {custoTotal > 0 && (
        <>
          <SectionTitle style={{ marginTop: 14 }}>Resultado</SectionTitle>
          <DetailRow l="Preço de venda" v={brl(pv)} />
          {margin != null && <DetailRow l="Margem bruta" v={`${margin.toFixed(1)}%`} accent />}
          <DetailRow l="Lucro por un." v={brl(pv - custoTotal)} />
        </>
      )}
    </div>
  );
}

function BodyServico({ item, recursos, custo }) {
  const consumiveis = (recursos || []).filter(r => r.tipo === 'consumivel');
  const ferramentas = (recursos || []).filter(r => r.tipo !== 'consumivel');
  const cmv = custo?.cmv_fabricado ?? 0;
  const pv = item.price;
  const margin = pv > 0 && cmv > 0 ? ((pv - cmv) / pv) * 100 : null;

  return (
    <div>
      <SectionTitle>Cobrança</SectionTitle>
      <DetailRow l="Preço" v={brl(pv)} accent />
      {item.tempo_preparo_min && <DetailRow l="Duração estimada" v={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name="clock" size={12} stroke={1.8} />
          {item.tempo_preparo_min < 60
            ? `${item.tempo_preparo_min} min`
            : `${Math.floor(item.tempo_preparo_min / 60)}h${item.tempo_preparo_min % 60 > 0 ? ` ${item.tempo_preparo_min % 60}min` : ''}`}
        </span>
      } />}

      {ferramentas.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: 14 }}>Ferramentas & equipamentos</SectionTitle>
          {ferramentas.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                                    fontSize: 12, borderBottom: '1px dashed var(--border)', color: 'var(--text-2)' }}>
              <span style={{ fontWeight: 500 }}>{r.nome}</span>
              <span style={{ color: 'var(--muted)', textTransform: 'capitalize', fontSize: 11 }}>{r.tipo}</span>
            </div>
          ))}
        </>
      )}

      {consumiveis.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: 14 }}>Materiais consumíveis</SectionTitle>
          {consumiveis.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '4px 0',
                                    fontSize: 12, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ fontWeight: 500 }}>{r.nome}</span>
              <span style={{ color: 'var(--muted)', textAlign: 'right' }}>{r.quantidade} {r.unidade}</span>
            </div>
          ))}
          {cmv > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8,
                           borderTop: '1px dashed var(--border)', marginTop: 4, fontSize: 12 }}>
              <span style={{ color: 'var(--muted)' }}>CMV estimado (consumíveis)</span>
              <span className="a-num" style={{ fontWeight: 700 }}>{brl(cmv)}</span>
            </div>
          )}
        </>
      )}

      {recursos !== undefined && recursos.length === 0 && (
        <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'var(--surface-2)',
                      fontSize: 11.5, color: 'var(--muted)', textAlign: 'center' }}>
          Nenhum recurso cadastrado
        </div>
      )}

      {margin != null && (
        <>
          <SectionTitle style={{ marginTop: 14 }}>Resultado</SectionTitle>
          <DetailRow l="Margem (após consumíveis)" v={`${margin.toFixed(1)}%`} accent />
        </>
      )}

      <div style={{ marginTop: 12, padding: 12, borderRadius: 9,
                    background: 'var(--success-soft)', color: 'var(--success)',
                    display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
        <Icon name="sparkle" size={14} stroke={1.8} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <b>Serviço.</b> Não consome estoque físico. Combinável com produtos no mesmo cupom.
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

// ─────────────────────────────────────────────────────────────────────────────
// Modal de cadastro/edição de produto
// ─────────────────────────────────────────────────────────────────────────────
const TIPO_OPTIONS = [
  { k: 'revenda',   l: 'Revenda',   i: 'box',     desc: 'Comprado para revender' },
  { k: 'fabricado', l: 'Fabricado', i: 'sparkle',  desc: 'Produção própria com ficha técnica' },
  { k: 'servico',   l: 'Serviço',   i: 'clock',   desc: 'Mão de obra e tempo' },
  { k: 'variavel',  l: 'Variável',  i: 'filter',  desc: 'Vendido por peso ou medida' },
];

const UNIDADES = ['UN', 'KG', 'LT', 'M', 'M²', 'CX', 'DZ', 'PCT', 'FD', 'G', 'ML'];
const CATEGORIAS_PADRAO = ['Bebidas', 'Cervejas', 'Destilados', 'Vinhos', 'Refrigerantes', 'Águas', 'Sucos', 'Snacks', 'Serviços', 'Fabricados', 'Outros'];

const prdLbl = { fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 5 };
const prdRow2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

function ProdutoModal({ editando, onSalvar, onCancelar }) {
  const [tipo, setTipo] = useProd(editando?.t || 'revenda');
  const [saving, setSaving] = useProd(false);
  const [form, setForm] = useProd({
    codigo:          editando?.sku   || '',
    nome:            editando?.n     || '',
    descricao:       editando?.descricao || '',
    categoria:       editando?.categoria || editando?.cat || '',
    unidade:         editando?.unidade   || 'UN',
    preco_venda:     editando?.price != null ? String(editando.price) : '',
    preco_custo:     editando?.preco_custo != null ? String(editando.preco_custo) : '',
    estoque_min:     editando?.estoque_min != null ? String(editando.estoque_min) : '0',
    qtd_embalagem:   editando?.qtd_embalagem != null ? String(editando.qtd_embalagem) : '',
    tempo_preparo_min: editando?.tempo_preparo_min != null ? String(editando.tempo_preparo_min) : '',
    rendimento_qtd:  editando?.rendimento_qtd != null ? String(editando.rendimento_qtd) : '',
    rendimento_un:   editando?.rendimento_un || '',
    requer_producao: editando?.requer_producao ? true : false,
  });
  // Ficha técnica (fabricado)
  const [ficha, setFicha] = useProd([]);     // [{insumo_nome, insumo_id?, quantidade, unidade}]
  const [novoInsumo, setNovoInsumo] = useProd({ insumo_nome: '', quantidade: '', unidade: 'UN' });
  // Recursos (serviço)
  const [recursos, setRecursos] = useProd([]); // [{tipo, nome, quantidade, unidade}]
  const [novoRec, setNovoRec] = useProd({ tipo: 'ferramenta', nome: '', quantidade: '1', unidade: 'UN' });
  // Busca de insumos cadastrados
  const [buscaInsumo, setBuscaInsumo] = useProd('');
  const [insumosSugeridos, setInsumosSugeridos] = useProd([]);
  const [categoriasDisp, setCategoriasDisp] = useProd(CATEGORIAS_PADRAO);

  useProdEffect(() => {
    window.api.get('/api/produto/categorias').then(cats => {
      setCategoriasDisp([...new Set([...CATEGORIAS_PADRAO, ...cats])].sort());
    }).catch(() => {});
    // Carregar ficha/recursos do editando
    if (editando && (editando.t === 'fabricado' || editando.t === 'servico')) {
      window.api.get(`/api/produto/${editando.id}`).then(det => {
        if (editando.t === 'fabricado') setFicha(det.ficha || []);
        if (editando.t === 'servico') setRecursos(det.recursos || []);
      }).catch(() => {});
    }
  }, []);

  useProdEffect(() => {
    if (buscaInsumo.length < 2) { setInsumosSugeridos([]); return; }
    window.api.get(`/api/produto/busca?q=${encodeURIComponent(buscaInsumo)}`).then(res => {
      setInsumosSugeridos(res.filter(p => p.tipo === 'revenda' || p.tipo === 'variavel').slice(0, 6));
    }).catch(() => {});
  }, [buscaInsumo]);

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const canSave = form.codigo.trim() && form.nome.trim() && form.preco_venda !== '';

  async function salvar() {
    setSaving(true);
    try {
      const dados = {
        codigo: form.codigo.trim(),
        nome: form.nome.trim(),
        descricao: form.descricao || null,
        categoria: form.categoria || null,
        unidade: form.unidade,
        tipo,
        preco_venda: parseFloat(form.preco_venda.replace(',', '.')),
        preco_custo: form.preco_custo ? parseFloat(form.preco_custo.replace(',', '.')) : null,
        estoque_min: parseFloat(form.estoque_min) || 0,
        qtd_embalagem: form.qtd_embalagem ? parseFloat(form.qtd_embalagem.replace(',', '.')) : null,
        tempo_preparo_min: form.tempo_preparo_min ? parseInt(form.tempo_preparo_min) : null,
        rendimento_qtd: form.rendimento_qtd ? parseFloat(form.rendimento_qtd.replace(',', '.')) : null,
        rendimento_un: form.rendimento_un || null,
        requer_producao: tipo === 'fabricado' ? (form.requer_producao ? 1 : 0) : 0,
      };
      await onSalvar(dados);
      // Se fabricado, salva ficha técnica
      if (tipo === 'fabricado' && ficha.length > 0) {
        const id = editando?.id;
        if (id) await window.api.post(`/api/produto/${id}/ficha`, { itens: ficha }).catch(() => {});
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={onCancelar} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(2,6,23,.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 20px', overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} className="a-card"
           style={{ width: 620, padding: 0, overflow: 'hidden', flexShrink: 0, marginBottom: 24 }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{editando ? 'Editar produto' : 'Novo produto'}</div>
          <button onClick={onCancelar} className="a-btn a-btn-ghost"
                  style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Seletor de tipo */}
          {!editando && (
            <div>
              <label style={prdLbl}>Tipo de produto</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {TIPO_OPTIONS.map(t => (
                  <button key={t.k} onClick={() => setTipo(t.k)} style={{
                    padding: '10px 8px', borderRadius: 10, cursor: 'default', fontFamily: 'inherit',
                    background: tipo === t.k ? 'var(--primary-soft)' : 'var(--surface-2)',
                    border: '1.5px solid', borderColor: tipo === t.k ? 'var(--primary)' : 'var(--border)',
                    textAlign: 'center',
                  }}>
                    <Icon name={t.i} size={18} stroke={1.6} style={{ color: tipo === t.k ? 'var(--primary)' : 'var(--muted)', display: 'block', margin: '0 auto 6px' }} />
                    <div style={{ fontWeight: 700, fontSize: 12, color: tipo === t.k ? 'var(--primary)' : 'var(--text)' }}>{t.l}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, lineHeight: 1.3 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campos comuns */}
          <div style={prdRow2}>
            <div>
              <label style={prdLbl}>Código / SKU *</label>
              <input className="a-input" value={form.codigo} onChange={F('codigo')} placeholder="Ex: 7891234567890" disabled={!!editando} />
            </div>
            <div>
              <label style={prdLbl}>Unidade de medida</label>
              <select className="a-input" value={form.unidade} onChange={F('unidade')}
                      style={{ appearance: 'auto' }}>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={prdLbl}>Nome *</label>
            <input className="a-input" value={form.nome} onChange={F('nome')} placeholder="Nome do produto/serviço" />
          </div>

          <div style={prdRow2}>
            <div>
              <label style={prdLbl}>Categoria</label>
              <input className="a-input" list="cats-list" value={form.categoria} onChange={F('categoria')} placeholder="Ex: Cervejas" />
              <datalist id="cats-list">{categoriasDisp.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label style={prdLbl}>Preço de venda *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 13 }}>R$</span>
                <input className="a-input" style={{ paddingLeft: 34 }} type="number" min="0" step="0.01"
                       value={form.preco_venda} onChange={F('preco_venda')} placeholder="0,00" />
              </div>
            </div>
          </div>

          {/* Campos específicos por tipo */}
          {(tipo === 'revenda' || tipo === 'variavel') && (
            <>
              <div style={prdRow2}>
                <div>
                  <label style={prdLbl}>Custo unitário (R$)</label>
                  <input className="a-input" type="number" min="0" step="0.01"
                         value={form.preco_custo} onChange={F('preco_custo')} placeholder="0,00" />
                </div>
                <div>
                  <label style={prdLbl}>Estoque mínimo</label>
                  <input className="a-input" type="number" min="0" step="1"
                         value={form.estoque_min} onChange={F('estoque_min')} placeholder="0" />
                </div>
              </div>
              {tipo === 'revenda' && (
                <div>
                  <label style={prdLbl}>Qtd por embalagem de compra (opcional)</label>
                  <input className="a-input" type="number" min="1" step="1"
                         value={form.qtd_embalagem} onChange={F('qtd_embalagem')} placeholder="Ex: 24 (caixa com 24 unidades)" />
                </div>
              )}
            </>
          )}

          {tipo === 'fabricado' && (
            <>
              <div style={prdRow2}>
                <div>
                  <label style={prdLbl}>Tempo de preparo (minutos)</label>
                  <input className="a-input" type="number" min="1" step="1"
                         value={form.tempo_preparo_min} onChange={F('tempo_preparo_min')} placeholder="Ex: 30" />
                </div>
                <div>
                  <label style={prdLbl}>Estoque mínimo (prontos)</label>
                  <input className="a-input" type="number" min="0" step="1"
                         value={form.estoque_min} onChange={F('estoque_min')} placeholder="0" />
                </div>
              </div>
              <div style={prdRow2}>
                <div>
                  <label style={prdLbl}>Rendimento (qtd)</label>
                  <input className="a-input" type="number" min="0.01" step="0.01"
                         value={form.rendimento_qtd} onChange={F('rendimento_qtd')} placeholder="Ex: 1 (por receita)" />
                </div>
                <div>
                  <label style={prdLbl}>Unidade do rendimento</label>
                  <input className="a-input" value={form.rendimento_un} onChange={F('rendimento_un')} placeholder="UN / KG / porções…" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="reqprod" checked={form.requer_producao}
                       onChange={e => setForm(f => ({ ...f, requer_producao: e.target.checked }))} />
                <label htmlFor="reqprod" style={{ fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
                  Entra na fila de produção ao ser vendido (KDS / Fabricação)
                </label>
              </div>

              {/* Ficha técnica inline */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={prdLbl}>Ficha técnica (insumos)</label>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{ficha.length} item(s)</span>
                </div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  {ficha.length === 0 && (
                    <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                      Nenhum insumo adicionado
                    </div>
                  )}
                  {ficha.map((it, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 28px',
                                          gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)',
                                          alignItems: 'center', fontSize: 12.5 }}>
                      <span style={{ fontWeight: 600 }}>{it.insumo_nome}</span>
                      <span style={{ color: 'var(--muted)' }}>{it.quantidade} {it.unidade}</span>
                      <span className="a-num" style={{ fontSize: 11, color: 'var(--muted)' }}>CME auto</span>
                      <button onClick={() => setFicha(f => f.filter((_, idx) => idx !== i))}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  ))}
                  {/* Linha de adição de novo insumo */}
                  <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', borderTop: ficha.length > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input className="a-input" style={{ height: 34, fontSize: 12.5 }}
                             value={buscaInsumo || novoInsumo.insumo_nome}
                             onChange={e => { setBuscaInsumo(e.target.value); setNovoInsumo(n => ({ ...n, insumo_nome: e.target.value, insumo_id: null })); }}
                             placeholder="Buscar insumo cadastrado ou digitar nome livre" />
                      {insumosSugeridos.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 2, boxShadow: 'var(--shadow-pop)' }}>
                          {insumosSugeridos.map(p => (
                            <button key={p.id} onClick={() => { setNovoInsumo(n => ({ ...n, insumo_nome: p.nome, insumo_id: p.id })); setBuscaInsumo(''); setInsumosSugeridos([]); }}
                                    style={{ width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'default', fontFamily: 'inherit', fontSize: 12 }}>
                              {p.nome} <span style={{ color: 'var(--muted)', fontSize: 10.5 }}>CME: {brl(p.custo_medio || 0)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input className="a-input" style={{ width: 70, height: 34, fontSize: 12.5 }}
                           type="number" min="0.001" step="0.001"
                           value={novoInsumo.quantidade} onChange={e => setNovoInsumo(n => ({ ...n, quantidade: e.target.value }))}
                           placeholder="Qtd" />
                    <select className="a-input" style={{ width: 64, height: 34, fontSize: 12.5, appearance: 'auto' }}
                            value={novoInsumo.unidade} onChange={e => setNovoInsumo(n => ({ ...n, unidade: e.target.value }))}>
                      {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button className="a-btn a-btn-primary" style={{ height: 34, padding: '0 10px', flexShrink: 0, fontSize: 12 }}
                            onClick={() => {
                              if (!novoInsumo.insumo_nome || !novoInsumo.quantidade) return;
                              setFicha(f => [...f, { ...novoInsumo, quantidade: parseFloat(novoInsumo.quantidade) }]);
                              setNovoInsumo({ insumo_nome: '', quantidade: '', unidade: 'UN' });
                              setBuscaInsumo('');
                            }}>
                      <Icon name="plus" size={13} stroke={2.4} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {tipo === 'servico' && (
            <>
              <div>
                <label style={prdLbl}>Duração estimada (minutos, opcional)</label>
                <input className="a-input" type="number" min="1" step="1"
                       value={form.tempo_preparo_min} onChange={F('tempo_preparo_min')} placeholder="Ex: 60" />
              </div>
              <div>
                <label style={prdLbl}>Descrição do serviço</label>
                <input className="a-input" value={form.descricao} onChange={F('descricao')} placeholder="Ex: Troca de vidro temperado até 1m²" />
              </div>

              {/* Recursos do serviço inline */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={prdLbl}>Ferramentas, equipamentos e materiais</label>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{recursos.length} item(s)</span>
                </div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  {recursos.length === 0 && (
                    <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Nenhum recurso adicionado</div>
                  )}
                  {recursos.map((r, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 28px',
                                          gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)',
                                          alignItems: 'center', fontSize: 12.5 }}>
                      <span style={{ color: 'var(--muted)', textTransform: 'capitalize', fontSize: 11 }}>{r.tipo}</span>
                      <span style={{ fontWeight: 600 }}>{r.nome}</span>
                      <span style={{ color: 'var(--muted)', textAlign: 'right' }}>{r.quantidade} {r.unidade}</span>
                      <button onClick={() => setRecursos(rs => rs.filter((_, idx) => idx !== i))}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  ))}
                  <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', borderTop: recursos.length > 0 ? '1px solid var(--border)' : 'none' }}>
                    <select className="a-input" style={{ width: 120, height: 34, fontSize: 12, appearance: 'auto' }}
                            value={novoRec.tipo} onChange={e => setNovoRec(n => ({ ...n, tipo: e.target.value }))}>
                      {['ferramenta', 'equipamento', 'material', 'consumivel'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input className="a-input" style={{ flex: 1, height: 34, fontSize: 12.5 }}
                           value={novoRec.nome} onChange={e => setNovoRec(n => ({ ...n, nome: e.target.value }))}
                           placeholder="Nome do recurso" />
                    <input className="a-input" style={{ width: 60, height: 34, fontSize: 12.5 }}
                           type="number" min="1" step="1"
                           value={novoRec.quantidade} onChange={e => setNovoRec(n => ({ ...n, quantidade: e.target.value }))}
                           placeholder="Qtd" />
                    <button className="a-btn a-btn-primary" style={{ height: 34, padding: '0 10px', flexShrink: 0, fontSize: 12 }}
                            onClick={() => {
                              if (!novoRec.nome) return;
                              setRecursos(rs => [...rs, { ...novoRec, quantidade: parseFloat(novoRec.quantidade) || 1 }]);
                              setNovoRec({ tipo: 'ferramenta', nome: '', quantidade: '1', unidade: 'UN' });
                            }}>
                      <Icon name="plus" size={13} stroke={2.4} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label style={prdLbl}>Descrição / observação</label>
            <input className="a-input" value={form.descricao} onChange={F('descricao')} placeholder="Informação extra opcional" />
          </div>
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--surface-2)' }}>
          <button onClick={onCancelar} className="a-btn" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
          <button onClick={salvar} disabled={!canSave || saving}
                  className="a-btn a-btn-primary"
                  style={{ flex: 2, justifyContent: 'center', opacity: canSave && !saving ? 1 : .45 }}>
            <Icon name="check" size={15} stroke={2.4} />
            {saving ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar produto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de importação CSV
// ─────────────────────────────────────────────────────────────────────────────
function CsvImportModal({ onImportar, onCancelar }) {
  const [linhas, setLinhas] = useProd([]);
  const [erro, setErro] = useProd('');
  const [importing, setImporting] = useProd(false);

  const TEMPLATE_CSV = 'codigo,nome,tipo,unidade,preco_venda,preco_custo,categoria,estoque_min\n' +
    '7891234567000,Produto Exemplo,revenda,UN,10.90,5.50,Bebidas,12\n' +
    '7891234567001,Serviço Exemplo,servico,UN,80.00,,Serviços,0\n' +
    '7891234567002,Produto Fabricado,fabricado,UN,35.00,,Fabricados,5';

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'template_produtos.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function parseCSV(text) {
    setErro('');
    const rows = text.trim().split('\n').map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    if (rows.length < 2) { setErro('Arquivo vazio ou inválido.'); return; }
    const header = rows[0].map(h => h.toLowerCase());
    const required = ['codigo', 'nome', 'preco_venda'];
    const missing = required.filter(r => !header.includes(r));
    if (missing.length) { setErro(`Colunas obrigatórias faltando: ${missing.join(', ')}`); return; }

    const parsed = rows.slice(1).filter(r => r.some(c => c)).map(r => {
      const obj = {};
      header.forEach((h, i) => { obj[h] = r[i] || ''; });
      return {
        codigo:     obj.codigo,
        nome:       obj.nome,
        tipo:       obj.tipo || 'revenda',
        unidade:    obj.unidade || 'UN',
        preco_venda: parseFloat(obj.preco_venda) || 0,
        preco_custo: obj.preco_custo ? parseFloat(obj.preco_custo) : null,
        categoria:  obj.categoria || null,
        estoque_min: parseFloat(obj.estoque_min) || 0,
      };
    });

    const invalidas = parsed.filter(p => !p.codigo || !p.nome || p.preco_venda <= 0);
    if (invalidas.length) { setErro(`${invalidas.length} linha(s) inválida(s) (sem código, nome ou preço).`); }
    setLinhas(parsed.filter(p => p.codigo && p.nome && p.preco_venda > 0));
  }

  return (
    <div onClick={onCancelar} style={{ position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(2,6,23,.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} className="a-card" style={{ width: 560, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Importar planilha CSV</div>
          <button onClick={onCancelar} className="a-btn a-btn-ghost" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--muted)' }}>
            <b style={{ color: 'var(--text)' }}>Formato esperado:</b> arquivo CSV com colunas: <code>codigo, nome, tipo, unidade, preco_venda, preco_custo, categoria, estoque_min</code>
            <div style={{ marginTop: 8 }}>
              <button onClick={downloadTemplate} className="a-btn a-btn-ghost" style={{ height: 28, padding: '0 10px', fontSize: 11.5 }}>
                <Icon name="arrow-down" size={12} /> Baixar template
              </button>
            </div>
          </div>

          <div>
            <label style={prdLbl}>Selecionar arquivo CSV</label>
            <input type="file" accept=".csv,.txt" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => parseCSV(ev.target.result);
              reader.readAsText(file, 'UTF-8');
            }} style={{ fontSize: 13, color: 'var(--text-2)' }} />
          </div>

          {erro && <div style={{ color: 'var(--danger)', fontSize: 12.5, padding: '8px 12px', borderRadius: 8, background: 'var(--danger-soft)' }}>{erro}</div>}

          {linhas.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                <b style={{ color: 'var(--success)' }}>{linhas.length} produtos</b> prontos para importar:
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                {linhas.slice(0, 20).map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 70px', gap: 8,
                                        padding: '7px 12px', borderBottom: '1px solid var(--border)', fontSize: 12,
                                        alignItems: 'center' }}>
                    <span className="a-mono" style={{ color: 'var(--muted)' }}>{p.codigo}</span>
                    <span style={{ fontWeight: 600 }}>{p.nome}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'capitalize' }}>{p.tipo}</span>
                    <span className="a-num" style={{ textAlign: 'right', fontWeight: 700 }}>R$ {p.preco_venda.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
                {linhas.length > 20 && <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>… e mais {linhas.length - 20} itens</div>}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--surface-2)' }}>
          <button onClick={onCancelar} className="a-btn" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
          <button onClick={async () => {
              if (!linhas.length) return;
              setImporting(true);
              try { await onImportar(linhas); } finally { setImporting(false); }
            }}
            disabled={linhas.length === 0 || importing}
            className="a-btn a-btn-primary"
            style={{ flex: 2, justifyContent: 'center', opacity: linhas.length > 0 && !importing ? 1 : .45 }}>
            <Icon name="check" size={15} stroke={2.4} />
            {importing ? 'Importando…' : `Importar ${linhas.length} produto(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Produtos });
