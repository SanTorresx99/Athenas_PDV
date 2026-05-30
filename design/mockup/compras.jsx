// compras.jsx — Módulo Compras: Ordens de Compra + Fornecedores

const { useState: useC, useEffect: useCE, useMemo: useCM, useRef: useCR } = React;

const brlC = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
const fmtDateC = (s) => {
  if (!s) return '—';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
  return isNaN(d) ? s : d.toLocaleDateString('pt-BR');
};

const STATUS_ORDEM = {
  rascunho: { l: 'Rascunho', c: 'muted' },
  enviada:  { l: 'Enviada',  c: 'warning' },
  recebida: { l: 'Recebida', c: 'success' },
  cancelada:{ l: 'Cancelada',c: 'danger' },
};

// ─────────────────────────────────────────────────────────────────────────────
function Compras({ tweaks }) {
  const [tab, setTab] = useC('ordens');
  const compact = tweaks?.density === 'compact';
  const pad = compact ? '20px 28px 60px' : '28px 36px 80px';

  return (
    <div style={{ padding: pad, maxWidth: 1480, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>
            Gestão
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, letterSpacing: '-.02em' }}>
            Compras
          </h1>
        </div>
        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {[
            { k: 'ordens', l: 'Ordens de compra' },
            { k: 'fornecedores', l: 'Fornecedores' },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              padding: '6px 14px', borderRadius: 5, border: 'none', fontFamily: 'inherit',
              background: tab === t.k ? 'var(--surface-3)' : 'transparent',
              color: tab === t.k ? 'var(--text)' : 'var(--muted)',
              fontSize: 13, fontWeight: 600, cursor: 'default',
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {tab === 'ordens'       && <OrdensTab compact={compact} />}
      {tab === 'fornecedores' && <FornecedoresTab compact={compact} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDENS DE COMPRA
// ─────────────────────────────────────────────────────────────────────────────
function OrdensTab({ compact }) {
  const [ordens, setOrdens]           = useC([]);
  const [fornecedores, setFornecedores] = useC([]);
  const [produtos, setProdutos]       = useC([]);
  const [loading, setLoading]         = useC(true);
  const [statusFilter, setStatusFilter] = useC('');
  const [showNovaOrdem, setShowNovaOrdem] = useC(false);
  const [showReceber, setShowReceber] = useC(null); // ordem selecionada
  const [showDetalhe, setShowDetalhe] = useC(null);

  function load() {
    setLoading(true);
    Promise.all([
      window.api.get('/api/compras/ordem'),
      window.api.get('/api/compras/fornecedor'),
      window.api.get('/api/produto'),
    ]).then(([o, f, p]) => {
      setOrdens(o);
      setFornecedores(f);
      setProdutos(p);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }

  useCE(() => { load(); }, []);

  const filtered = useCM(() => {
    if (!statusFilter) return ordens;
    return ordens.filter(o => o.status === statusFilter);
  }, [ordens, statusFilter]);

  const totais = useCM(() => ({
    total: ordens.length,
    rascunho: ordens.filter(o => o.status === 'rascunho').length,
    enviada:  ordens.filter(o => o.status === 'enviada').length,
    recebida: ordens.filter(o => o.status === 'recebida').length,
  }), [ordens]);

  return (
    <>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total de ordens', v: totais.total,    c: 'text' },
          { l: 'Em rascunho',     v: totais.rascunho, c: 'muted' },
          { l: 'Enviadas',        v: totais.enviada,  c: 'warning' },
          { l: 'Recebidas',       v: totais.recebida, c: 'success' },
        ].map(k => (
          <div key={k.l} className="a-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.08em' }}>{k.l}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: `var(--${k.c})`, marginTop: 4 }} className="a-num">{k.v}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['', 'rascunho', 'enviada', 'recebida', 'cancelada'].map(s => (
            <button key={s || 'todos'} onClick={() => setStatusFilter(s)}
              className="a-btn" style={{
                height: 32, padding: '0 12px', fontSize: 12,
                background: statusFilter === s ? 'var(--primary-soft)' : 'transparent',
                color: statusFilter === s ? 'var(--primary)' : 'var(--muted)',
                border: statusFilter === s ? '1px solid var(--primary)' : '1px solid var(--border)',
              }}>
              {s ? (STATUS_ORDEM[s]?.l ?? s) : 'Todos'}
            </button>
          ))}
        </div>
        <button className="a-btn a-btn-primary" style={{ height: 36 }}
                onClick={() => setShowNovaOrdem(true)}>
          <Icon name="plus" size={14} stroke={2.4} /> Nova ordem
        </button>
      </div>

      {/* Table */}
      <div className="a-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nº', 'Fornecedor', 'Status', 'Total', 'Previsão', 'Criado em', ''].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11,
                                     fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase',
                                     letterSpacing: '.07em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Carregando…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                Nenhuma ordem encontrada
              </td></tr>
            )}
            {filtered.map((o, i) => {
              const st = STATUS_ORDEM[o.status] ?? { l: o.status, c: 'muted' };
              return (
                <tr key={o.id} style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'transparent',
                  transition: 'background .12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="a-mono" style={{ fontSize: 12, color: 'var(--muted-2)' }}>
                      #{String(o.numero).padStart(4, '0')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{o.fornecedor_nome}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: `var(--${st.c}-soft)`, color: `var(--${st.c})`,
                    }}>{st.l}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }} className="a-num">{brlC(o.total)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{fmtDateC(o.previsao_entrega)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{fmtDateC(o.criado_em)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="a-btn a-btn-ghost" style={{ height: 28, padding: '0 8px', fontSize: 11 }}
                              onClick={() => setShowDetalhe(o)}>
                        Ver
                      </button>
                      {(o.status === 'enviada' || o.status === 'rascunho') && (
                        <button className="a-btn a-btn-primary" style={{ height: 28, padding: '0 10px', fontSize: 11 }}
                                onClick={() => setShowReceber(o)}>
                          Receber
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNovaOrdem && (
        <NovaOrdemModal
          fornecedores={fornecedores}
          produtos={produtos}
          onClose={() => setShowNovaOrdem(false)}
          onSaved={() => { setShowNovaOrdem(false); load(); }}
        />
      )}
      {showReceber && (
        <ReceberModal
          ordem={showReceber}
          onClose={() => setShowReceber(null)}
          onSaved={() => { setShowReceber(null); load(); }}
        />
      )}
      {showDetalhe && (
        <DetalheOrdemModal
          ordem={showDetalhe}
          onClose={() => setShowDetalhe(null)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function NovaOrdemModal({ fornecedores, produtos, onClose, onSaved }) {
  const [fornecedorId, setFornecedorId] = useC('');
  const [previsao, setPrevisao]         = useC('');
  const [observacao, setObservacao]     = useC('');
  const [itens, setItens]               = useC([]);
  const [saving, setSaving]             = useC(false);
  const [erro, setErro]                 = useC('');

  // Item em edição
  const [produtoId, setProdutoId] = useC('');
  const [qtdStr, setQtdStr]       = useC('');
  const [precoStr, setPrecoStr]   = useC('');
  const [prodSearch, setProdSearch] = useC('');

  const prodFiltrado = useCM(() => {
    if (!prodSearch.trim()) return produtos.slice(0, 8);
    const q = prodSearch.toLowerCase();
    return produtos.filter(p => p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)).slice(0, 8);
  }, [produtos, prodSearch]);

  function addItem() {
    if (!produtoId) return;
    const prod = produtos.find(p => p.id === produtoId);
    if (!prod) return;
    const qtd = parseFloat(qtdStr) || 1;
    const preco = parseFloat(precoStr) || null;
    setItens(prev => [...prev, { produto_id: produtoId, nome: prod.nome, unidade: prod.unidade, quantidade: qtd, preco_unit: preco }]);
    setProdutoId(''); setQtdStr(''); setPrecoStr(''); setProdSearch('');
  }

  function removeItem(i) { setItens(prev => prev.filter((_, j) => j !== i)); }

  const totalPrev = itens.reduce((s, it) => s + (it.quantidade * (it.preco_unit || 0)), 0);

  async function salvar() {
    if (!fornecedorId) { setErro('Selecione um fornecedor'); return; }
    if (itens.length === 0) { setErro('Adicione ao menos um item'); return; }
    setSaving(true); setErro('');
    try {
      await window.api.post('/api/compras/ordem', {
        fornecedor_id: fornecedorId,
        previsao_entrega: previsao || null,
        observacao: observacao || null,
        itens: itens.map(it => ({ produto_id: it.produto_id, quantidade: it.quantidade, preco_unit: it.preco_unit })),
      });
      onSaved();
    } catch (e) {
      setErro(e?.erro || 'Erro ao criar ordem');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Nova ordem de compra" onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Fornecedor + datas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <Label>Fornecedor *</Label>
            <select className="a-input" value={fornecedorId} onChange={e => setFornecedorId(e.target.value)}
                    style={{ height: 38, background: 'var(--surface-2)' }}>
              <option value="">Selecionar…</option>
              {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div>
            <Label>Previsão de entrega</Label>
            <input className="a-input" type="date" value={previsao}
                   onChange={e => setPrevisao(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Observação</Label>
          <input className="a-input" placeholder="Opcional" value={observacao}
                 onChange={e => setObservacao(e.target.value)} />
        </div>

        {/* Adicionar item */}
        <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 10,
                        textTransform: 'uppercase', letterSpacing: '.08em' }}>Adicionar produto</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px auto', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ position: 'relative' }}>
              <Label>Produto</Label>
              <input className="a-input" placeholder="Buscar produto…" value={prodSearch}
                     onChange={e => { setProdSearch(e.target.value); setProdutoId(''); }} />
              {prodSearch && !produtoId && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                  maxHeight: 200, overflowY: 'auto', boxShadow: 'var(--shadow-pop)',
                }}>
                  {prodFiltrado.map(p => (
                    <button key={p.id} style={{
                      width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none',
                      background: 'transparent', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
                      cursor: 'default',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => { setProdutoId(p.id); setProdSearch(p.nome);
                                       setPrecoStr(p.preco_custo ? String(p.preco_custo) : ''); }}>
                      <span style={{ fontWeight: 600 }}>{p.nome}</span>
                      <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--muted)' }}>{p.codigo}</span>
                    </button>
                  ))}
                  {prodFiltrado.length === 0 && (
                    <div style={{ padding: '10px 12px', color: 'var(--muted)', fontSize: 12 }}>Nenhum produto encontrado</div>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label>Qtd</Label>
              <input className="a-input" type="number" min="0.01" step="0.01" placeholder="1"
                     value={qtdStr} onChange={e => setQtdStr(e.target.value)} />
            </div>
            <div>
              <Label>Custo unit.</Label>
              <input className="a-input" type="number" min="0" step="0.01" placeholder="0,00"
                     value={precoStr} onChange={e => setPrecoStr(e.target.value)} />
            </div>
            <button className="a-btn a-btn-primary" style={{ height: 38, alignSelf: 'flex-end' }}
                    onClick={addItem} disabled={!produtoId}>
              <Icon name="plus" size={14} stroke={2.4} />
            </button>
          </div>
        </div>

        {/* Lista de itens */}
        {itens.length > 0 && (
          <div className="a-card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  {['Produto', 'Qtd', 'Custo unit.', 'Total', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11,
                                         fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map((it, i) => (
                  <tr key={i} style={{ borderBottom: i < itens.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{it.nome}</td>
                    <td style={{ padding: '9px 12px', color: 'var(--muted)' }}>{it.quantidade} {it.unidade}</td>
                    <td style={{ padding: '9px 12px' }} className="a-num">
                      {it.preco_unit ? brlC(it.preco_unit) : '—'}
                    </td>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }} className="a-num">
                      {it.preco_unit ? brlC(it.quantidade * it.preco_unit) : '—'}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                      <button className="a-btn a-btn-ghost" style={{ height: 26, padding: '0 8px', fontSize: 11,
                                                                       color: 'var(--danger)' }}
                              onClick={() => removeItem(i)}>
                        <Icon name="x" size={12} stroke={2.4} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface-2)' }}>
                  <td colSpan={3} style={{ padding: '9px 12px', textAlign: 'right',
                                            fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                    Total previsto
                  </td>
                  <td style={{ padding: '9px 12px', fontWeight: 700, fontSize: 14 }} className="a-num">
                    {brlC(totalPrev)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {erro && <div style={{ color: 'var(--danger)', fontSize: 12, padding: '8px 12px',
                               background: 'var(--danger-soft)', borderRadius: 8 }}>{erro}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <button className="a-btn" onClick={onClose}>Cancelar</button>
          <button className="a-btn a-btn-primary" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando…' : 'Criar ordem'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function ReceberModal({ ordem, onClose, onSaved }) {
  const [detalhe, setDetalhe] = useC(null);
  const [loading, setLoading] = useC(true);
  const [qtds, setQtds]       = useC({});
  const [saving, setSaving]   = useC(false);
  const [erro, setErro]       = useC('');

  useCE(() => {
    window.api.get(`/api/compras/ordem/${ordem.id}`)
      .then(d => {
        setDetalhe(d);
        const init = {};
        d.itens.forEach(it => { init[it.id] = String(it.quantidade); });
        setQtds(init);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ordem.id]);

  async function confirmar() {
    if (!detalhe) return;
    setSaving(true); setErro('');
    try {
      await window.api.post(`/api/compras/ordem/${ordem.id}/receber`, {
        itens: detalhe.itens.map(it => ({
          item_ordem_compra_id: it.id,
          quantidade_recebida: parseFloat(qtds[it.id]) || it.quantidade,
          preco_unit: it.preco_unit || null,
        })),
      });
      onSaved();
    } catch (e) {
      setErro(e?.erro || 'Erro ao registrar recebimento');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Receber — Ordem #${String(ordem.numero).padStart(4,'0')}`} onClose={onClose}>
      {loading && <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Carregando…</div>}
      {!loading && detalhe && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Fornecedor: <b style={{ color: 'var(--text)' }}>{detalhe.fornecedor_nome}</b>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Produto', 'Pedido', 'Recebido'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11,
                                       fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detalhe.itens.map((it, i) => (
                <tr key={it.id} style={{ borderBottom: i < detalhe.itens.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{it.nome}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{it.quantidade} {it.unidade}</td>
                  <td style={{ padding: '10px 12px', width: 120 }}>
                    <input className="a-input" type="number" min="0" step="0.01"
                           value={qtds[it.id] ?? ''} style={{ height: 34 }}
                           onChange={e => setQtds(prev => ({ ...prev, [it.id]: e.target.value }))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ background: 'var(--success-soft)', borderRadius: 10, padding: '10px 14px',
                         fontSize: 12, color: 'var(--success)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon name="check" size={14} stroke={2.4} />
            O estoque será atualizado automaticamente ao confirmar.
          </div>

          {erro && <div style={{ color: 'var(--danger)', fontSize: 12, padding: '8px 12px',
                                  background: 'var(--danger-soft)', borderRadius: 8 }}>{erro}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="a-btn" onClick={onClose}>Cancelar</button>
            <button className="a-btn a-btn-primary" onClick={confirmar} disabled={saving}
                    style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>
              {saving ? 'Registrando…' : 'Confirmar recebimento'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function DetalheOrdemModal({ ordem, onClose }) {
  const [detalhe, setDetalhe] = useC(null);
  const [loading, setLoading] = useC(true);

  useCE(() => {
    window.api.get(`/api/compras/ordem/${ordem.id}`)
      .then(setDetalhe)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ordem.id]);

  const st = STATUS_ORDEM[ordem.status] ?? { l: ordem.status, c: 'muted' };

  return (
    <Modal title={`Ordem #${String(ordem.numero).padStart(4,'0')}`} onClose={onClose}>
      {loading && <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Carregando…</div>}
      {!loading && detalhe && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <InfoField label="Fornecedor" value={detalhe.fornecedor_nome} />
            <InfoField label="Status">
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                              background: `var(--${st.c}-soft)`, color: `var(--${st.c})` }}>{st.l}</span>
            </InfoField>
            <InfoField label="Total" value={brlC(detalhe.total)} mono />
            <InfoField label="Previsão" value={fmtDateC(detalhe.previsao_entrega)} />
            <InfoField label="Criado em" value={fmtDateC(detalhe.criado_em)} />
            <InfoField label="Recebido em" value={fmtDateC(detalhe.recebido_em)} />
          </div>
          {detalhe.observacao && (
            <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface-2)',
                           padding: '8px 12px', borderRadius: 8 }}>{detalhe.observacao}</div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Produto', 'Pedido', 'Recebido', 'Custo unit.', 'Total'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11,
                                       fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detalhe.itens.map((it, i) => (
                <tr key={it.id} style={{ borderBottom: i < detalhe.itens.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{it.nome}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{it.quantidade} {it.unidade}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {it.quantidade_recebida > 0
                      ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>{it.quantidade_recebida}</span>
                      : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }} className="a-num">
                    {it.preco_unit ? brlC(it.preco_unit) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }} className="a-num">
                    {it.total ? brlC(it.total) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="a-btn" onClick={onClose}>Fechar</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORNECEDORES
// ─────────────────────────────────────────────────────────────────────────────
function FornecedoresTab() {
  const [fornecedores, setFornecedores] = useC([]);
  const [loading, setLoading]           = useC(true);
  const [query, setQuery]               = useC('');
  const [editando, setEditando]         = useC(null); // null | {} (novo) | {id,...}

  function load() {
    setLoading(true);
    window.api.get('/api/compras/fornecedor')
      .then(setFornecedores)
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useCE(() => { load(); }, []);

  const filtered = useCM(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fornecedores;
    return fornecedores.filter(f =>
      f.nome.toLowerCase().includes(q) ||
      (f.cnpj_cpf || '').includes(q) ||
      (f.telefone || '').includes(q)
    );
  }, [fornecedores, query]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12 }}>
        <input className="a-input" placeholder="Buscar por nome, CNPJ, telefone…"
               value={query} onChange={e => setQuery(e.target.value)}
               style={{ maxWidth: 380 }} />
        <button className="a-btn a-btn-primary" onClick={() => setEditando({})}>
          <Icon name="plus" size={14} stroke={2.4} /> Novo fornecedor
        </button>
      </div>

      <div className="a-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nome', 'CNPJ / CPF', 'Telefone', 'E-mail', 'Contato', ''].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11,
                                     fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase',
                                     letterSpacing: '.07em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Carregando…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                {query ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
              </td></tr>
            )}
            {filtered.map((f, i) => (
              <tr key={f.id} style={{
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                background: 'transparent', transition: 'background .12s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{f.nome}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {f.cnpj_cpf || '—'}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{f.telefone || '—'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{f.email || '—'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{f.contato || '—'}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button className="a-btn a-btn-ghost" style={{ height: 28, padding: '0 8px', fontSize: 11 }}
                          onClick={() => setEditando(f)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando !== null && (
        <FornecedorModal
          fornecedor={editando}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); load(); }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function FornecedorModal({ fornecedor, onClose, onSaved }) {
  const isNovo = !fornecedor.id;
  const [form, setForm] = useC({
    nome: fornecedor.nome || '',
    cnpj_cpf: fornecedor.cnpj_cpf || '',
    telefone: fornecedor.telefone || '',
    email: fornecedor.email || '',
    endereco: fornecedor.endereco || '',
    contato: fornecedor.contato || '',
  });
  const [saving, setSaving] = useC(false);
  const [erro, setErro]     = useC('');

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function salvar() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    setSaving(true); setErro('');
    try {
      if (isNovo) {
        await window.api.post('/api/compras/fornecedor', form);
      } else {
        await window.api.put(`/api/compras/fornecedor/${fornecedor.id}`, form);
      }
      onSaved();
    } catch (e) {
      setErro(e?.erro || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isNovo ? 'Novo fornecedor' : 'Editar fornecedor'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Label>Nome / Razão social *</Label>
          <input className="a-input" value={form.nome} onChange={set('nome')} placeholder="Ex: Distribuidora Central Ltda" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <Label>CNPJ / CPF</Label>
            <input className="a-input" value={form.cnpj_cpf} onChange={set('cnpj_cpf')} placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <Label>Telefone / WhatsApp</Label>
            <input className="a-input" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-9999" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <Label>E-mail</Label>
            <input className="a-input" type="email" value={form.email} onChange={set('email')} placeholder="comercial@fornecedor.com" />
          </div>
          <div>
            <Label>Nome do contato</Label>
            <input className="a-input" value={form.contato} onChange={set('contato')} placeholder="Ex: Carlos Vendas" />
          </div>
        </div>
        <div>
          <Label>Endereço</Label>
          <input className="a-input" value={form.endereco} onChange={set('endereco')} placeholder="Rua, número, bairro, cidade" />
        </div>

        {erro && <div style={{ color: 'var(--danger)', fontSize: 12, padding: '8px 12px',
                               background: 'var(--danger-soft)', borderRadius: 8 }}>{erro}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <button className="a-btn" onClick={onClose}>Cancelar</button>
          <button className="a-btn a-btn-primary" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando…' : isNovo ? 'Cadastrar' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="a-card" style={{
        width: '100%', maxWidth: wide ? 860 : 520,
        maxHeight: '90vh', overflowY: 'auto',
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

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 5,
                        textTransform: 'uppercase', letterSpacing: '.05em' }}>{children}</div>;
}

function InfoField({ label, value, children, mono }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase',
                     fontWeight: 700, letterSpacing: '.08em', marginBottom: 4 }}>{label}</div>
      {children || (
        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>
          {value || '—'}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Compras });
