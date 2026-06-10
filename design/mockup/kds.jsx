// kds.jsx — Kitchen Display System (fila de produção)

const { useState: useK, useEffect: useKE, useRef: useKR } = React;

const STATUS_COLS = [
  { k: 'pendente',    l: 'Pendente',    cor: 'warning', acao: 'Iniciar',  proximoStatus: 'iniciar' },
  { k: 'em_producao', l: 'Produzindo',  cor: 'accent',  acao: 'Pronto',   proximoStatus: 'pronto' },
  { k: 'pronto',      l: 'Pronto',      cor: 'success', acao: 'Entregar', proximoStatus: 'entregar' },
];

// ─────────────────────────────────────────────────────────────────────────────
function KDS({ tweaks }) {
  const [pedidos, setPedidos] = useK([]);
  const [loading, setLoading] = useK(true);
  const audioRef = useKR(null);

  function carregar() {
    window.api.get('/api/kds/fila').then(data => {
      setPedidos(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useKE(() => {
    carregar();
    const intervalo = setInterval(carregar, 10000); // polling a cada 10s
    return () => clearInterval(intervalo);
  }, []);

  async function avancar(pedidoId, acao) {
    try {
      await window.api.put(`/api/kds/${pedidoId}/${acao}`);
      carregar();
    } catch (err) {
      alert('Erro: ' + (err.message || err));
    }
  }

  const porStatus = (status) => pedidos.filter(p => p.status === status);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', fontSize: 15 }}>
      Carregando fila de produção…
    </div>
  );

  const totalAtivos = pedidos.length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Barra de status */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="sparkle" size={18} stroke={1.6} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Cozinha / Produção</span>
          {totalAtivos > 0 && (
            <span style={{ padding: '2px 10px', borderRadius: 999, background: 'var(--warning-soft)', color: 'var(--warning)', fontWeight: 700, fontSize: 12 }}>
              {totalAtivos} na fila
            </span>
          )}
        </div>
        <button onClick={carregar} className="a-btn a-btn-ghost" style={{ height: 30, padding: '0 12px', fontSize: 12 }}>
          <Icon name="arrow-right" size={12} /> Atualizar
        </button>
      </div>

      {/* Colunas KDS */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, minHeight: 0, background: 'var(--border)' }}>
        {STATUS_COLS.map(col => (
          <KDSColuna
            key={col.k}
            col={col}
            pedidos={porStatus(col.k)}
            onAvancar={avancar}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function KDSColuna({ col, pedidos, onAvancar }) {
  return (
    <div style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Cabeçalho da coluna */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: `var(--${col.cor})` }} />
            <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '.06em', color: `var(--${col.cor})` }}>
              {col.l}
            </span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: pedidos.length > 0 ? `var(--${col.cor})` : 'var(--muted)' }}>
            {pedidos.length}
          </span>
        </div>
      </div>

      {/* Pedidos */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pedidos.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 40 }}>
            Nenhum pedido
          </div>
        )}
        {pedidos.map(pedido => (
          <KDSCard key={pedido.id} pedido={pedido} col={col} onAvancar={onAvancar} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function KDSCard({ pedido, col, onAvancar }) {
  const minutos = Number(pedido.minutos_aguardando || 0);
  const atrasado = minutos >= 10;
  const muitoAtrasado = minutos >= 20;

  const corTempo = muitoAtrasado ? 'var(--danger)' : atrasado ? 'var(--warning)' : 'var(--muted)';

  return (
    <div style={{
      borderRadius: 12, border: '1px solid',
      borderColor: muitoAtrasado ? 'var(--danger)' : atrasado ? 'var(--warning)' : 'var(--border)',
      background: muitoAtrasado ? 'var(--danger-soft)' : atrasado ? 'var(--warning-soft)' : 'var(--surface)',
      overflow: 'hidden',
    }}>
      {/* Header do card */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>
            #{String(pedido.venda_numero || '?').padStart(4, '0')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: corTempo, fontWeight: muitoAtrasado || atrasado ? 700 : 400 }}>
          <Icon name="clock" size={12} stroke={atrasado ? 2.4 : 1.8} />
          {minutos < 1 ? 'agora' : `${minutos}min`}
        </div>
      </div>

      {/* Itens */}
      <div style={{ padding: '10px 14px' }}>
        {(pedido.itens || []).map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0',
                                borderBottom: i < pedido.itens.length - 1 ? '1px dashed var(--border)' : 'none' }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{it.nome}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: `var(--${col.cor})` }}>
              ×{it.quantidade}
            </span>
          </div>
        ))}
        {pedido.observacao && (
          <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'var(--surface-2)', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
            {pedido.observacao}
          </div>
        )}
      </div>

      {/* Ação */}
      {col.proximoStatus && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <button
            className="a-btn a-btn-primary"
            onClick={() => onAvancar(pedido.id, col.proximoStatus)}
            style={{ width: '100%', justifyContent: 'center', height: 36, fontSize: 13 }}>
            <Icon name="check" size={14} stroke={2.4} /> {col.acao}
          </button>
        </div>
      )}
    </div>
  );
}
