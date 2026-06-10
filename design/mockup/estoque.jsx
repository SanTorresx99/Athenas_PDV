// estoque.jsx — Gestão de Estoque: saldos, entradas, ajustes, histórico

const { useState: useEst, useEffect: useEstE, useMemo: useEstM } = React;

const brlE = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
const fmtDateE = (s) => {
  if (!s) return '—';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
  return isNaN(d) ? s : d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
};

const TIPO_MOV = {
  entrada:  { l: 'Entrada',   c: 'success' },
  saida:    { l: 'Saída',     c: 'danger' },
  ajuste:   { l: 'Ajuste',    c: 'warning' },
  perda:    { l: 'Perda',     c: 'muted' },
};

// ─────────────────────────────────────────────────────────────────────────────
function Estoque({ tweaks }) {
  const compact = tweaks?.density === 'compact';
  const pad = compact ? '20px 28px 60px' : '28px 36px 80px';

  const [produtos, setProdutos] = useEst([]);
  const [loading, setLoading]   = useEst(true);
  const [query, setQuery]       = useEst('');
  const [filtro, setFiltro]     = useEst('todos'); // todos | critico
  const [selected, setSelected] = useEst(null);   // produto com detalhe aberto
  const [showEntrada, setShowEntrada] = useEst(null);
  const [showAjuste, setShowAjuste]   = useEst(null);

  function load() {
    setLoading(true);
    window.api.get('/api/estoque')
      .then(setProdutos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEstE(() => { load(); }, []);

  const filtered = useEstM(() => {
    const q = query.trim().toLowerCase();
    return produtos.filter(p => {
      if (filtro === 'critico' && !p.critico) return false;
      if (!q) return true;
      return (p.nome || '').toLowerCase().includes(q) ||
             (p.codigo || '').toLowerCase().includes(q) ||
             (p.categoria || '').toLowerCase().includes(q);
    });
  }, [produtos, query, filtro]);

  const totais = useEstM(() => ({
    total:   produtos.length,
    critico: produtos.filter(p => p.critico).length,
    valorEstoque: produtos.reduce((s, p) => s + (Number(p.saldo) * Number(p.custo_medio || p.preco_custo || 0)), 0),
  }), [produtos]);

  return (
    <div style={{ padding: pad, maxWidth: 1480, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>
            Gestão
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, letterSpacing: '-.02em' }}>
            Estoque
          </h1>
        </div>
        <button className="a-btn" onClick={load} style={{ height: 36 }}>
          <Icon name="refresh" size={14} /> Atualizar
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div className="a-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.08em' }}>
            Produtos ativos
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }} className="a-num">{totais.total}</div>
        </div>
        <div className="a-card" style={{ padding: '14px 18px', borderColor: totais.critico > 0 ? 'var(--warning)' : undefined }}>
          <div style={{ fontSize: 11, color: totais.critico > 0 ? 'var(--warning)' : 'var(--muted)',
                         textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.08em' }}>
            Estoque crítico
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4,
                         color: totais.critico > 0 ? 'var(--warning)' : 'var(--text)' }} className="a-num">
            {totais.critico}
          </div>
        </div>
        <div className="a-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.08em' }}>
            Valor em estoque (custo)
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }} className="a-num">{brlE(totais.valorEstoque)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
          <input className="a-input" placeholder="Buscar por nome, código, categoria…"
                 value={query} onChange={e => setQuery(e.target.value)}
                 style={{ maxWidth: 360 }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { k: 'todos',   l: 'Todos' },
              { k: 'critico', l: 'Críticos' },
            ].map(f => (
              <button key={f.k} onClick={() => setFiltro(f.k)} className="a-btn" style={{
                height: 32, padding: '0 12px', fontSize: 12,
                background: filtro === f.k ? 'var(--primary-soft)' : 'transparent',
                color: filtro === f.k ? 'var(--primary)' : 'var(--muted)',
                border: filtro === f.k ? '1px solid var(--primary)' : '1px solid var(--border)',
              }}>{f.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="a-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Produto', 'Código', 'Categoria', 'Un.', 'Saldo', 'Mínimo', 'Custo unit.', 'Valor total', ''].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11,
                                     fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase',
                                     letterSpacing: '.07em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Carregando…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                Nenhum produto encontrado
              </td></tr>
            )}
            {filtered.map((p, i) => {
              const saldo = Number(p.saldo);
              const critico = !!p.critico;
              const zerado = saldo <= 0;
              const valorTotal = saldo * Number(p.preco_custo || 0);
              return (
                <tr key={p.id} style={{
                  borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none',
                  background: 'transparent', transition: 'background .12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 14px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {critico && (
                        <span style={{ width: 7, height: 7, borderRadius: 999, flexShrink: 0,
                                        background: zerado ? 'var(--danger)' : 'var(--warning)' }} />
                      )}
                      {p.nome}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                    {p.codigo}
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--muted)' }}>{p.categoria || '—'}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--muted)' }}>{p.unidade}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 700,
                                color: zerado ? 'var(--danger)' : critico ? 'var(--warning)' : 'var(--text)' }}
                      className="a-num">
                    {saldo.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--muted)' }} className="a-num">
                    {Number(p.estoque_min).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--muted)' }} className="a-num">
                    {p.preco_custo ? brlE(p.preco_custo) : '—'}
                  </td>
                  <td style={{ padding: '11px 14px' }} className="a-num">
                    {p.preco_custo ? brlE(valorTotal) : '—'}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="a-btn a-btn-ghost" style={{ height: 27, padding: '0 8px', fontSize: 11 }}
                              onClick={() => setShowEntrada(p)}>
                        + Entrada
                      </button>
                      <button className="a-btn a-btn-ghost" style={{ height: 27, padding: '0 8px', fontSize: 11 }}
                              onClick={() => setShowAjuste(p)}>
                        Ajuste
                      </button>
                      <button className="a-btn a-btn-ghost" style={{ height: 27, padding: '0 8px', fontSize: 11 }}
                              onClick={() => setSelected(p)}>
                        <Icon name="clock" size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showEntrada && (
        <EntradaModal
          produto={showEntrada}
          onClose={() => setShowEntrada(null)}
          onSaved={() => { setShowEntrada(null); load(); }}
        />
      )}
      {showAjuste && (
        <AjusteModal
          produto={showAjuste}
          onClose={() => setShowAjuste(null)}
          onSaved={() => { setShowAjuste(null); load(); }}
        />
      )}
      {selected && (
        <HistoricoModal
          produto={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function EntradaModal({ produto, onClose, onSaved }) {
  const [qtdStr, setQtdStr]     = useEst('');
  const [precoStr, setPrecoStr] = useEst(produto.custo_medio > 0 ? String(produto.custo_medio) : (produto.preco_custo ? String(produto.preco_custo) : ''));
  const [obs, setObs]           = useEst('');
  const [saving, setSaving]     = useEst(false);
  const [erro, setErro]         = useEst('');

  async function salvar() {
    const qtd = parseFloat(qtdStr);
    if (!qtd || qtd <= 0) { setErro('Informe uma quantidade válida'); return; }
    setSaving(true); setErro('');
    try {
      await window.api.post('/api/estoque/entrada', {
        produto_id: produto.id,
        quantidade: qtd,
        custo_unitario: parseFloat(precoStr) || null,
        observacao: obs || null,
      });
      onSaved();
    } catch (e) {
      setErro(e?.erro || 'Erro ao registrar entrada');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalE title={`Entrada — ${produto.nome}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--success-soft)', borderRadius: 10, padding: '10px 14px',
                       display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--muted)' }}>Saldo atual</span>
          <span style={{ fontWeight: 700, color: 'var(--success)' }} className="a-num">
            {Number(produto.saldo).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {produto.unidade}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <LabelE>Quantidade *</LabelE>
            <input className="a-input" type="number" min="0.01" step="0.01" placeholder="0"
                   value={qtdStr} onChange={e => setQtdStr(e.target.value)} autoFocus />
          </div>
          <div>
            <LabelE>Custo unitário</LabelE>
            <input className="a-input" type="number" min="0" step="0.01" placeholder="0,00"
                   value={precoStr} onChange={e => setPrecoStr(e.target.value)} />
          </div>
        </div>
        <div>
          <LabelE>Observação</LabelE>
          <input className="a-input" placeholder="Ex: NF 1234 — Distribuidora ABC"
                 value={obs} onChange={e => setObs(e.target.value)} />
        </div>
        {qtdStr && parseFloat(qtdStr) > 0 && (
          <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 12px',
                         fontSize: 12, color: 'var(--muted)' }}>
            Novo saldo após entrada:{' '}
            <b style={{ color: 'var(--success)' }}>
              {(Number(produto.saldo) + parseFloat(qtdStr)).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {produto.unidade}
            </b>
          </div>
        )}
        {erro && <div style={{ color: 'var(--danger)', fontSize: 12, padding: '8px 12px',
                               background: 'var(--danger-soft)', borderRadius: 8 }}>{erro}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <button className="a-btn" onClick={onClose}>Cancelar</button>
          <button className="a-btn a-btn-primary" onClick={salvar} disabled={saving}
                  style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>
            {saving ? 'Registrando…' : 'Registrar entrada'}
          </button>
        </div>
      </div>
    </ModalE>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function AjusteModal({ produto, onClose, onSaved }) {
  const [tipo, setTipo]     = useEst('ajuste');
  const [qtdStr, setQtdStr] = useEst('');
  const [obs, setObs]       = useEst('');
  const [saving, setSaving] = useEst(false);
  const [erro, setErro]     = useEst('');

  const novoSaldo = useEstM(() => {
    const qtd = parseFloat(qtdStr) || 0;
    const base = Number(produto.saldo);
    if (tipo === 'entrada') return base + qtd;
    return base - qtd;
  }, [qtdStr, tipo, produto.saldo]);

  async function salvar() {
    const qtd = parseFloat(qtdStr);
    if (!qtd || qtd <= 0) { setErro('Informe uma quantidade válida'); return; }
    setSaving(true); setErro('');
    try {
      await window.api.post('/api/estoque/ajuste', {
        produto_id: produto.id,
        tipo,
        quantidade: qtd,
        observacao: obs || null,
      });
      onSaved();
    } catch (e) {
      setErro(e?.erro || 'Erro ao registrar ajuste');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalE title={`Ajuste de estoque — ${produto.nome}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 14px',
                       display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--muted)' }}>Saldo atual</span>
          <span style={{ fontWeight: 700 }} className="a-num">
            {Number(produto.saldo).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {produto.unidade}
          </span>
        </div>

        <div>
          <LabelE>Tipo de ajuste</LabelE>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { k: 'ajuste', l: 'Ajuste de inventário', c: 'warning' },
              { k: 'perda',  l: 'Perda / Avaria',       c: 'danger' },
              { k: 'entrada',l: 'Entrada adicional',     c: 'success' },
            ].map(t => (
              <button key={t.k} onClick={() => setTipo(t.k)} style={{
                flex: 1, padding: '8px 6px', borderRadius: 8, border: 'none', fontFamily: 'inherit',
                fontSize: 11.5, fontWeight: 600, cursor: 'default', textAlign: 'center',
                background: tipo === t.k ? `var(--${t.c}-soft)` : 'var(--surface-2)',
                color: tipo === t.k ? `var(--${t.c})` : 'var(--muted)',
                outline: tipo === t.k ? `2px solid var(--${t.c})` : '2px solid transparent',
              }}>{t.l}</button>
            ))}
          </div>
        </div>

        <div>
          <LabelE>Quantidade *</LabelE>
          <input className="a-input" type="number" min="0.01" step="0.01" placeholder="0"
                 value={qtdStr} onChange={e => setQtdStr(e.target.value)} autoFocus />
        </div>
        <div>
          <LabelE>Motivo / Observação</LabelE>
          <input className="a-input" placeholder="Descreva o motivo do ajuste"
                 value={obs} onChange={e => setObs(e.target.value)} />
        </div>

        {qtdStr && parseFloat(qtdStr) > 0 && (
          <div style={{
            background: novoSaldo < 0 ? 'var(--danger-soft)' : 'var(--surface-2)',
            borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--muted)',
          }}>
            Saldo após ajuste:{' '}
            <b style={{ color: novoSaldo < 0 ? 'var(--danger)' : 'var(--text)' }}>
              {novoSaldo.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {produto.unidade}
            </b>
            {novoSaldo < 0 && <span style={{ marginLeft: 8, color: 'var(--danger)' }}>⚠ saldo negativo</span>}
          </div>
        )}

        {erro && <div style={{ color: 'var(--danger)', fontSize: 12, padding: '8px 12px',
                               background: 'var(--danger-soft)', borderRadius: 8 }}>{erro}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <button className="a-btn" onClick={onClose}>Cancelar</button>
          <button className="a-btn a-btn-primary" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando…' : 'Confirmar ajuste'}
          </button>
        </div>
      </div>
    </ModalE>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function HistoricoModal({ produto, onClose }) {
  const [historico, setHistorico] = useEst([]);
  const [loading, setLoading]     = useEst(true);

  useEstE(() => {
    window.api.get(`/api/estoque/${produto.id}`)
      .then(d => setHistorico(d.historico || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [produto.id]);

  return (
    <ModalE title={`Histórico — ${produto.nome}`} onClose={onClose}>
      {loading && <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Carregando…</div>}
      {!loading && (
        <>
          {historico.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Nenhum movimento registrado
            </div>
          )}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)' }}>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data', 'Tipo', 'Qtd', 'Saldo após', 'Origem', 'Obs'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11,
                                         fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase',
                                         whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map((m, i) => {
                  const tm = TIPO_MOV[m.tipo] ?? { l: m.tipo, c: 'muted' };
                  const sinal = (m.tipo === 'entrada') ? '+' : '-';
                  return (
                    <tr key={m.id} style={{ borderBottom: i < historico.length-1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '9px 12px', color: 'var(--muted)', fontSize: 11.5, whiteSpace: 'nowrap' }}>
                        {fmtDateE(m.criado_em)}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                                        background: `var(--${tm.c}-soft)`, color: `var(--${tm.c})` }}>
                          {tm.l}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 600,
                                    color: m.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)' }}
                          className="a-num">
                        {sinal}{Number(m.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }} className="a-num">
                        {Number(m.saldo_apos).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--muted)', fontSize: 11.5 }}>
                        {m.origem || '—'}
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--muted)', fontSize: 11.5,
                                    maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.observacao || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
            <button className="a-btn" onClick={onClose}>Fechar</button>
          </div>
        </>
      )}
    </ModalE>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function ModalE({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="a-card" style={{
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        padding: 24, position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <button className="a-btn a-btn-ghost" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                  onClick={onClose}>
            <Icon name="x" size={14} stroke={2.4} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LabelE({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 5,
                        textTransform: 'uppercase', letterSpacing: '.05em' }}>{children}</div>;
}

Object.assign(window, { Estoque });
