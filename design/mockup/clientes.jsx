// clientes.jsx — Módulo de Clientes e Controle de Fiado

const { useState: useC, useEffect: useCE, useMemo: useCM } = React;
const brlC = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

// ─────────────────────────────────────────────────────────────────────────────
function Clientes({ tweaks }) {
  const [clientes, setClientes] = useC([]);
  const [loading, setLoading] = useC(true);
  const [query, setQuery] = useC('');
  const [selected, setSelected] = useC(null);
  const [showModal, setShowModal] = useC(false);
  const [showPagamento, setShowPagamento] = useC(false);
  const [editando, setEditando] = useC(null);

  function carregar() {
    setLoading(true);
    window.api.get('/api/cliente').then(setClientes).catch(() => {}).finally(() => setLoading(false));
  }

  useCE(() => { carregar(); }, []);

  const filtrados = useCM(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(c => c.nome.toLowerCase().includes(q) || (c.cpf_cnpj || '').includes(q) || (c.telefone || '').includes(q));
  }, [clientes, query]);

  const totalDevedor = useCM(() => clientes.reduce((s, c) => s + Number(c.saldo_devedor || 0), 0), [clientes]);

  // Carregar saldo devedor de cada cliente (via detalhe)
  useCE(() => {
    if (!clientes.length) return;
    Promise.all(clientes.map(c => window.api.get(`/api/cliente/${c.id}`).catch(() => c)))
      .then(detalhes => setClientes(detalhes));
  }, [clientes.length]);

  return (
    <div style={{ padding: '24px 32px 60px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>Gestão</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, letterSpacing: '-.025em' }}>
            Clientes <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 16 }}>· {clientes.length} cadastrados</span>
          </h1>
        </div>
        <button className="a-btn a-btn-primary" onClick={() => { setEditando(null); setShowModal(true); }}>
          <Icon name="plus" size={14} stroke={2.4} /> Novo cliente
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total clientes', v: clientes.length, icon: 'user', tone: 'primary' },
          { l: 'Com fiado aberto', v: clientes.filter(c => Number(c.saldo_devedor || 0) > 0).length, icon: 'clock', tone: 'warning' },
          { l: 'Total a receber', v: brlC(totalDevedor), icon: 'trend-up', tone: 'accent' },
        ].map(kpi => (
          <div key={kpi.l} className="a-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `var(--${kpi.tone}-soft)`, color: `var(--${kpi.tone})`, display: 'grid', placeItems: 'center' }}>
              <Icon name={kpi.icon} size={17} stroke={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{kpi.l}</div>
              <div className="a-num" style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{kpi.v}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: 12, maxWidth: 400 }}>
        <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nome, CPF/CNPJ ou telefone…"
          className="a-input" style={{ paddingLeft: 36 }} />
      </div>

      {/* Tabela */}
      <div className="a-card" style={{ overflow: 'hidden' }}>
        {/* Cabeçalho da tabela */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 140px 130px 120px 130px 100px', padding: '10px 16px',
                      fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em',
                      borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <span>Cliente</span><span>CPF / CNPJ</span><span>Telefone</span><span>Limite</span><span>Saldo Devedor</span><span></span>
        </div>

        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Carregando…</div>}
        {!loading && filtrados.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Nenhum cliente encontrado.</div>}

        {filtrados.map(cli => {
          const saldo = Number(cli.saldo_devedor || 0);
          const atrasado = saldo > 0 && saldo > Number(cli.limite_fiado || 0);
          return (
            <div key={cli.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 140px 130px 120px 130px 100px',
                                       padding: '12px 16px', borderBottom: '1px solid var(--border)',
                                       alignItems: 'center', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{cli.nome}</div>
                {cli.email && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{cli.email}</div>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{cli.cpf_cnpj || '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{cli.telefone || '—'}</div>
              <div className="a-num" style={{ fontSize: 12, color: 'var(--muted)' }}>{brlC(cli.limite_fiado)}</div>
              <div>
                {saldo > 0
                  ? <span className={`a-pill ${atrasado ? 'a-pill-danger' : 'a-pill-warning'}`}>
                      <span className="dot" />{brlC(saldo)}
                    </span>
                  : <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>Em dia</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button className="a-btn a-btn-ghost" style={{ height: 28, padding: '0 8px', fontSize: 11.5 }}
                        onClick={() => { setSelected(cli); setShowPagamento(true); }}
                        title="Registrar pagamento">
                  <Icon name="check" size={12} />
                </button>
                <button className="a-btn a-btn-ghost" style={{ height: 28, padding: '0 8px', fontSize: 11.5 }}
                        onClick={() => { setSelected(cli); setEditando(cli); setShowModal(true); }}
                        title="Editar">
                  <Icon name="edit" size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modais */}
      {showModal && (
        <ClienteModal
          editando={editando}
          onSalvar={async (dados) => {
            if (editando) await window.api.put(`/api/cliente/${editando.id}`, dados);
            else await window.api.post('/api/cliente', dados);
            setShowModal(false); carregar();
          }}
          onCancelar={() => setShowModal(false)}
        />
      )}

      {showPagamento && selected && (
        <PagamentoFiadoModal
          cliente={selected}
          onConfirmar={async (valor, obs) => {
            await window.api.post(`/api/cliente/${selected.id}/pagar`, { valor, observacao: obs });
            setShowPagamento(false); carregar();
          }}
          onCancelar={() => setShowPagamento(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function ClienteModal({ editando, onSalvar, onCancelar }) {
  const [form, setForm] = useC({
    nome: editando?.nome || '',
    cpf_cnpj: editando?.cpf_cnpj || '',
    telefone: editando?.telefone || '',
    email: editando?.email || '',
    endereco: editando?.endereco || '',
    limite_fiado: editando?.limite_fiado ?? 0,
  });

  const F = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <Overlay onClose={onCancelar}>
      <div className="a-card" style={{ width: 480, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{editando ? 'Editar cliente' : 'Novo cliente'}</div>
          <button onClick={onCancelar} className="a-btn a-btn-ghost" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}>
            <Icon name="close" size={16} />
          </button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={labelStyle}>Nome *</label>
          <input className="a-input" value={form.nome} onChange={F('nome')} placeholder="Nome completo" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>CPF / CNPJ</label>
              <input className="a-input" value={form.cpf_cnpj} onChange={F('cpf_cnpj')} placeholder="000.000.000-00" />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input className="a-input" value={form.telefone} onChange={F('telefone')} placeholder="(11) 99999-0000" />
            </div>
          </div>
          <label style={labelStyle}>E-mail</label>
          <input className="a-input" value={form.email} onChange={F('email')} placeholder="email@exemplo.com" type="email" />
          <label style={labelStyle}>Endereço</label>
          <input className="a-input" value={form.endereco} onChange={F('endereco')} placeholder="Rua, número, bairro…" />
          <label style={labelStyle}>Limite de fiado (R$)</label>
          <input className="a-input" type="number" min="0" step="0.01" value={form.limite_fiado} onChange={F('limite_fiado')} />
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--surface-2)' }}>
          <button onClick={onCancelar} className="a-btn" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
          <button onClick={() => form.nome.trim() && onSalvar(form)} disabled={!form.nome.trim()}
                  className="a-btn a-btn-primary" style={{ flex: 2, justifyContent: 'center', opacity: form.nome.trim() ? 1 : .45 }}>
            <Icon name="check" size={15} stroke={2.4} /> {editando ? 'Salvar alterações' : 'Cadastrar cliente'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function PagamentoFiadoModal({ cliente, onConfirmar, onCancelar }) {
  const [valor, setValor] = useC('');
  const [obs, setObs] = useC('');
  const valorNum = parseFloat(valor.replace(',', '.')) || 0;
  const saldo = Number(cliente.saldo_devedor || 0);

  return (
    <Overlay onClose={onCancelar}>
      <div className="a-card" style={{ width: 400, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Pagamento de fiado</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginTop: 4 }}>{cliente.nome}</div>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--warning-soft)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 700, textTransform: 'uppercase' }}>Saldo devedor atual</div>
            <div className="a-num" style={{ fontSize: 24, fontWeight: 700, color: 'var(--warning)', marginTop: 4 }}>{brlC(saldo)}</div>
          </div>
          <label style={labelStyle}>Valor do pagamento (R$)</label>
          <input className="a-input" type="number" min="0.01" step="0.01" max={saldo}
                 value={valor} onChange={e => setValor(e.target.value)}
                 placeholder={saldo.toFixed(2).replace('.', ',')} autoFocus />
          {valorNum > 0 && (
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              Saldo após pagamento: <strong style={{ color: Math.max(0, saldo - valorNum) > 0 ? 'var(--warning)' : 'var(--success)' }}>
                {brlC(Math.max(0, saldo - valorNum))}
              </strong>
            </div>
          )}
          <label style={labelStyle}>Observação (opcional)</label>
          <input className="a-input" value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: Pagamento referente a..." />
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--surface-2)' }}>
          <button onClick={onCancelar} className="a-btn" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
          <button onClick={() => valorNum > 0 && onConfirmar(valorNum, obs)} disabled={valorNum <= 0}
                  className="a-btn a-btn-primary" style={{ flex: 2, justifyContent: 'center', opacity: valorNum > 0 ? 1 : .45 }}>
            <Icon name="check" size={15} stroke={2.4} /> Confirmar pagamento
          </button>
        </div>
      </div>
    </Overlay>
  );
}

const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 4 };
