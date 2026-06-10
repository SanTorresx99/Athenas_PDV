// pdv.jsx — Interactive Point of Sale

const { useState: useP, useEffect: useE, useMemo: useM, useRef: useR } = React;

// ─────────────────────────────────────────────────────────────────────────────
function PDV({ tweaks }) {
  const [query, setQuery] = useP('');
  const [cat, setCat] = useP('Todos');
  const [cart, setCart] = useP([]);
  const [stage, setStage] = useP('shop'); // shop | pay | done
  const [discount, setDiscount] = useP(0);
  const [lastSale, setLastSale] = useP(null);
  const [reprinting, setReprinting] = useP(null);
  const [products, setProducts] = useP([]);
  const [cats, setCats] = useP(['Todos']);
  const [saving, setSaving] = useP(false);
  const [recentSales, setRecentSales] = useP([]);
  const [saleHistory, setSaleHistory] = useP(() => new Map());
  const [caixaStage, setCaixaStage] = useP('fechado'); // 'fechado' | 'operando'
  const [caixaInfo, setCaixaInfo] = useP({
    fundo: 0,
    abertoEm: null,
    operador: { nome: '', codigo: '' },   // quem abriu o caixa
    sangrias: [],                          // [{valor, motivo, ts, autorizador}]
  });
  const [showFechamento, setShowFechamento] = useP(false);
  const [showSangria, setShowSangria] = useP(false);
  const [cancelandoId, setCancelandoId] = useP(null);
  const [clienteSelecionado, setClienteSelecionado] = useP(null); // { id, nome } para fiado
  const inputRef = useR(null);

  const CAIXA_KEY = 'athenas_caixa_sessao';

  function saveCaixaLocal(info) {
    try { localStorage.setItem(CAIXA_KEY, JSON.stringify(info)); } catch (_) {}
  }
  function clearCaixaLocal() {
    try { localStorage.removeItem(CAIXA_KEY); } catch (_) {}
  }

  function loadRecentSales() {
    window.api.get('/api/venda/dia').then(v => setRecentSales(v)).catch(() => {});
  }

  // Restaura sessão do caixa ao montar o PDV
  useE(() => {
    try {
      const raw = localStorage.getItem(CAIXA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.abertoEm = parsed.abertoEm ? new Date(parsed.abertoEm) : null;
        parsed.sangrias = (parsed.sangrias || []).map(s => ({ ...s, ts: new Date(s.ts) }));
        setCaixaInfo(parsed);
        setCaixaStage('operando');
      }
    } catch (_) {}
  }, []);

  useE(() => {
    Promise.all([
      window.api.get('/api/estoque'),
      window.api.get('/api/produto/categorias'),
    ]).then(([estoques, categorias]) => {
      setProducts(estoques.map(e => ({
        id: e.id,
        sku: e.codigo,
        n: e.nome,
        p: e.preco_venda,
        c: e.categoria || 'Geral',
        stock: e.saldo,
      })));
      setCats(['Todos', ...categorias]);
    }).catch(() => {});
    loadRecentSales();
  }, []);

  useE(() => {
    function onKey(e) {
      if (stage === 'shop') {
        if (e.key === 'F2') { e.preventDefault(); inputRef.current?.focus(); }
        if (e.key === 'F8') { e.preventDefault(); if (cart.length > 0) setStage('pay'); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, cart.length]);

  const filtered = useM(() => {
    const q = query.trim().toLowerCase();
    return products.filter(p => {
      if (cat !== 'Todos' && p.c !== cat) return false;
      if (!q) return true;
      return p.n.toLowerCase().includes(q) || p.sku.includes(q);
    });
  }, [query, cat, products]);

  const subtotal = cart.reduce((s, it) => s + it.p * it.q, 0);
  const itemDiscountTotal = cart.reduce((s, it) => s + (it.d || 0), 0);
  const orderDiscountValue = ((subtotal - itemDiscountTotal) * discount) / 100;
  const discountValue = itemDiscountTotal + orderDiscountValue;
  const total = Math.max(0, subtotal - discountValue);
  const itemCount = cart.reduce((s, it) => s + it.q, 0);

  function addToCart(prod) {
    setCart(c => {
      const ex = c.find(i => i.sku === prod.sku);
      if (ex) return c.map(i => i.sku === prod.sku ? { ...i, q: i.q + 1 } : i);
      return [...c, { ...prod, q: 1, d: 0 }];
    });
  }
  function setQty(sku, q) {
    if (q <= 0) return setCart(c => c.filter(i => i.sku !== sku));
    setCart(c => c.map(i => i.sku === sku ? { ...i, q } : i));
  }
  function setItemDiscount(sku, d) {
    setCart(c => c.map(i => i.sku === sku ? { ...i, d: Math.max(0, Math.min(d, i.p * i.q)) } : i));
  }
  function removeItem(sku) { setCart(c => c.filter(i => i.sku !== sku)); }
  function clearAll() { setCart([]); setDiscount(0); }

  // Barcode scanner: Enter adds exact code match directly; falls back to single filtered result
  function onSearchKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;
      const exactMatch = products.find(p => p.sku === q);
      if (exactMatch) { addToCart(exactMatch); setQuery(''); inputRef.current?.focus(); return; }
      if (filtered.length === 1) { addToCart(filtered[0]); setQuery(''); inputRef.current?.focus(); }
    }
    if (e.key === 'Escape') setQuery('');
  }

  async function finalizeSale(pagamentos, troco) {
    setSaving(true);
    try {
      const result = await window.api.post('/api/venda', {
        itens: cart.map(i => ({ produto_id: i.id, quantidade: i.q, desconto: i.d || 0 })),
        pagamentos,
        desconto: orderDiscountValue,
        troco,
        operador_id: caixaInfo.operador?.nome || null,
        dispositivo_id: caixaInfo.sessaoId || null,
        cliente_id: clienteSelecionado?.id || null,
      });
      const saleData = {
        id: `V-${String(result.numero).padStart(4, '0')}`,
        ts: new Date(),
        items: cart, subtotal, discount, discountValue, total,
        pagamentos, troco,
      };
      setLastSale(saleData);
      setSaleHistory(h => { const m = new Map(h); m.set(result.id, saleData); return m; });
      loadRecentSales();
      setStage('done');
    } catch (err) {
      alert('Erro ao registrar venda: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function newSale() {
    setCart([]); setDiscount(0); setStage('shop');
    setClienteSelecionado(null); setQuery(''); inputRef.current?.focus();
  }

  async function handleAbrirCaixa(fundo, operador) {
    const info = { fundo, abertoEm: new Date(), operador, sessaoId: null, sangrias: [] };
    try {
      const res = await window.api.post('/api/caixa/abrir', {
        operador_nome: operador.nome,
        operador_codigo: operador.codigo || null,
        fundo_inicial: fundo,
      });
      info.sessaoId = res.id;
    } catch (_) {}
    setCaixaInfo(info);
    saveCaixaLocal(info);
    setCaixaStage('operando');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleFecharCaixa(autorizador, contagemFisica) {
    if (caixaInfo.sessaoId) {
      try {
        await window.api.post(`/api/caixa/${caixaInfo.sessaoId}/fechar`, {
          supervisor_nome: autorizador.nome,
          supervisor_codigo: autorizador.codigo || null,
          contagem_fisica: contagemFisica ?? null,
        });
      } catch (_) {}
    }
    clearCaixaLocal();
    setShowFechamento(false);
    setCaixaStage('fechado');
    clearAll();
    loadRecentSales();
  }

  async function handleSangria(valor, motivo, autorizador) {
    const entry = { valor, motivo, ts: new Date(), autorizador };
    if (caixaInfo.sessaoId) {
      try {
        await window.api.post(`/api/caixa/${caixaInfo.sessaoId}/sangria`, {
          valor,
          motivo: motivo || null,
          supervisor_nome: autorizador.nome,
          supervisor_codigo: autorizador.codigo || null,
        });
      } catch (_) {}
    }
    setCaixaInfo(ci => {
      const updated = { ...ci, sangrias: [...ci.sangrias, entry] };
      saveCaixaLocal(updated);
      return updated;
    });
    setShowSangria(false);
  }

  async function handleCancelarVenda(vendaId, motivo, autorizador) {
    try {
      await window.api.post(`/api/venda/${vendaId}/cancelar`, { motivo, autorizador });
      loadRecentSales();
      setCancelandoId(null);
    } catch (err) {
      alert('Erro ao cancelar venda: ' + err.message);
    }
  }

  async function handleReprint(vendaId) {
    if (saleHistory.has(vendaId)) { setReprinting(saleHistory.get(vendaId)); return; }
    try {
      const v = await window.api.get(`/api/venda/${vendaId}`);
      const pagsArr = typeof v.pagamentos === 'string'
        ? JSON.parse(v.pagamentos || '[]')
        : (v.pagamentos || []);
      const items = (v.itens || []).map(it => ({
        sku: it.codigo || it.produto_id,
        n: it.nome,
        p: Number(it.preco_unit),
        q: Number(it.quantidade),
      }));
      const sub = items.reduce((s, it) => s + it.p * it.q, 0);
      setReprinting({
        id: `V-${String(v.numero).padStart(4, '0')}`,
        ts: new Date(String(v.criado_em).replace(' ', 'T')),
        items,
        subtotal: sub,
        discount: 0,
        discountValue: Number(v.desconto) || 0,
        total: Number(v.total),
        pagamentos: pagsArr,
        troco: Number(v.troco) || 0,
      });
    } catch (err) {
      alert('Erro ao carregar venda: ' + err.message);
    }
  }

  if (caixaStage === 'fechado') {
    return (
      <CaixaAberturaScreen
        onAbrir={handleAbrirCaixa}
        caixaInfo={caixaInfo}
        recentSales={recentSales}
      />
    );
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 420px', gap: 0,
      height: '100%', minHeight: 0,
    }}>
      {/* LEFT — products */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, padding: 20, gap: 12 }}>
        {/* Caixa status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 10px', borderRadius: 8,
                      background: 'var(--success-soft)', border: '1px solid var(--success)',
                      fontSize: 11.5 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--success)', fontWeight: 600 }}>
            <Icon name="check" size={13} stroke={2.4} />
            Caixa aberto · fundo R$ {caixaInfo.fundo.toFixed(2).replace('.',',')}
            {caixaInfo.abertoEm && (
              <span style={{ fontWeight: 400, color: 'var(--muted)' }}>
                · desde {caixaInfo.abertoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {caixaInfo.operador?.nome && (
              <span style={{ fontWeight: 500, color: 'var(--muted)', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                · <Icon name="user" size={11} /> {caixaInfo.operador.nome}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowSangria(true)} className="a-btn a-btn-ghost"
                    style={{ height: 28, padding: '0 10px', fontSize: 11.5 }}>
              <Icon name="arrow-down" size={12} /> Sangria
            </button>
            <button onClick={() => setShowFechamento(true)} className="a-btn"
                    style={{ height: 28, padding: '0 10px', fontSize: 11.5 }}>
              <Icon name="close" size={12} /> Fechar caixa
            </button>
          </div>
        </div>
        {/* Search bar */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Icon name="search" size={16}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                           color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Buscar por nome ou bipar código de barras…"
              className="a-input"
              style={{ height: 48, paddingLeft: 38, fontSize: 14.5, fontWeight: 500 }}
            />
            <span style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em',
              border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4,
              fontFamily: 'var(--font-mono)',
            }}>F2</span>
          </div>
          <button className="a-btn" style={{ height: 48, padding: '0 16px' }} title="Cliente">
            <Icon name="user" size={16} /> Cliente
          </button>
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: cat === c ? 'var(--primary)' : 'var(--surface)',
                color: cat === c ? '#fff' : 'var(--text-2)',
                border: '1px solid', borderColor: cat === c ? 'var(--primary)' : 'var(--border)',
                cursor: 'default', fontFamily: 'inherit',
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 10, padding: '4px 4px 8px 0',
        }}>
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
              <Icon name="search" size={36} stroke={1.4} />
              <div style={{ marginTop: 12, fontSize: 14 }}>
                {products.length === 0
                  ? 'Carregando produtos…'
                  : `Nenhum produto encontrado para "${query}"`}
              </div>
              {products.length > 0 && (
                <button className="a-btn" style={{ marginTop: 16 }} onClick={() => setQuery('')}>Limpar busca</button>
              )}
            </div>
          )}
          {filtered.map(p => <ProductTile key={p.sku} p={p} onAdd={() => addToCart(p)} />)}
        </div>
      </div>

      {/* RIGHT — cart */}
      <CartPanel
        cart={cart}
        subtotal={subtotal}
        discount={discount} setDiscount={setDiscount}
        discountValue={discountValue}
        total={total}
        itemCount={itemCount}
        setQty={setQty}
        removeItem={removeItem}
        clearAll={clearAll}
        onCheckout={() => cart.length > 0 && setStage('pay')}
        recentSales={recentSales}
        onReprint={handleReprint}
        setItemDiscount={setItemDiscount}
        onCancelar={(id) => setCancelandoId(id)}
      />

      {/* PAYMENT MODAL */}
      {stage === 'pay' && (
        <PaymentModal
          total={total}
          onCancel={() => setStage('shop')}
          onConfirm={finalizeSale}
          saving={saving}
          clienteSelecionado={clienteSelecionado}
          onClienteChange={setClienteSelecionado}
        />
      )}

      {/* RECEIPT MODAL */}
      {stage === 'done' && lastSale && (
        <ReceiptModal sale={lastSale} onClose={newSale} />
      )}

      {/* REPRINT MODAL */}
      {reprinting && (
        <ReceiptModal sale={reprinting} onClose={() => setReprinting(null)} reprint />
      )}

      {/* SANGRIA MODAL */}
      {showSangria && (
        <SangriaModal onConfirmar={handleSangria} onCancelar={() => setShowSangria(false)} />
      )}

      {/* FECHAMENTO MODAL */}
      {showFechamento && (
        <CaixaFechamentoModal
          caixaInfo={caixaInfo}
          recentSales={recentSales}
          onConfirmar={handleFecharCaixa}
          onCancelar={() => setShowFechamento(false)}
        />
      )}

      {/* CANCELAMENTO DE VENDA */}
      {cancelandoId && (
        <CancelVendaModal
          vendaId={cancelandoId}
          venda={recentSales.find(v => v.id === cancelandoId)}
          onConfirmar={handleCancelarVenda}
          onCancelar={() => setCancelandoId(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function ProductTile({ p, onAdd }) {
  const stockColor = p.stock <= 5 ? 'var(--danger)' : p.stock <= 12 ? 'var(--warning)' : 'var(--muted-2)';
  return (
    <button onClick={onAdd} className="a-card" style={{
      padding: 12, textAlign: 'left', cursor: 'default',
      transition: 'transform .08s ease, border-color .12s ease, box-shadow .12s ease',
      position: 'relative', overflow: 'hidden',
    }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(.98)'}
      onMouseUp={(e) => e.currentTarget.style.transform = ''}
      onMouseLeave={(e) => e.currentTarget.style.transform = ''}
    >
      {/* Visual placeholder square */}
      <div style={{
        aspectRatio: '1 / 1', borderRadius: 8, marginBottom: 10,
        background: `repeating-linear-gradient(135deg, var(--surface-2), var(--surface-2) 10px, var(--surface-3) 10px, var(--surface-3) 20px)`,
        display: 'grid', placeItems: 'center', position: 'relative',
        border: '1px solid var(--border)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)' }}>{p.c}</span>
        <span style={{
          position: 'absolute', top: 6, right: 6,
          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          background: 'var(--surface)', color: stockColor,
          fontFamily: 'var(--font-mono)',
        }}>{p.stock}</span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3,
                    minHeight: 32, display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.n}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
        <span className="a-num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em' }}>
          R$ {p.p.toFixed(2).replace('.', ',')}
        </span>
        <span style={{
          width: 22, height: 22, borderRadius: 6, background: 'var(--accent)',
          display: 'grid', placeItems: 'center', color: '#001018',
        }}>
          <Icon name="plus" size={14} stroke={2.6} />
        </span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function CartPanel({ cart, subtotal, discount, setDiscount, discountValue, total, itemCount,
                     setQty, removeItem, clearAll, onCheckout, recentSales, onReprint, setItemDiscount, onCancelar }) {
  const [page, setPage] = useP(0);
  const [discEditing, setDiscEditing] = useP(null);
  const [discInput, setDiscInput] = useP('');
  const [qtyEditing, setQtyEditing] = useP(null); // sku com qty em edição
  const [qtyInput, setQtyInput] = useP('');
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(recentSales.length / PAGE_SIZE);
  const pagedSales = recentSales.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useE(() => { setPage(0); }, [recentSales.length]);

  return (
    <aside style={{
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Header — always visible */}
      <div style={{ flexShrink: 0, padding: '18px 20px 12px', borderBottom: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.12em',
                          textTransform: 'uppercase', fontWeight: 700 }}>Cupom atual</div>
            <div style={{ fontSize: 19, fontWeight: 700, marginTop: 2 }}>Nova venda</div>
          </div>
          {cart.length > 0 && (
            <button onClick={clearAll} className="a-btn a-btn-ghost" style={{ height: 30, padding: '0 10px', fontSize: 12 }}>
              <Icon name="trash" size={13} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Items — cresce até ~5 linhas (288px), depois rola */}
      <div style={{ overflowY: 'auto', maxHeight: 288 }}>
        {cart.length === 0 ? (
          <div style={{ padding: '10px 20px 12px', fontSize: 12, color: 'var(--muted)',
                        textAlign: 'center', borderBottom: '1px dashed var(--border)' }}>
            Adicione produtos ao cupom
          </div>
        ) : null}
        <div style={{ padding: cart.length > 0 ? '8px 12px' : '0 12px' }}>
          {cart.map(it => (
            <div key={it.sku} style={{
              padding: '8px 8px 6px', borderRadius: 8,
              transition: 'background .12s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    R$ {it.p.toFixed(2).replace('.',',')} · un.
                    {it.d > 0 && (
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        − R$ {it.d.toFixed(2).replace('.',',')}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => { setDiscEditing(it.sku); setDiscInput(it.d > 0 ? it.d.toFixed(2) : ''); }}
                    title="Desconto por item"
                    style={{
                      width: 22, height: 22, borderRadius: 5, fontFamily: 'inherit',
                      border: '1px solid', fontSize: 10, fontWeight: 800, cursor: 'default',
                      display: 'grid', placeItems: 'center',
                      borderColor: it.d > 0 ? 'var(--accent)' : 'var(--border)',
                      background: it.d > 0 ? 'var(--accent-soft)' : 'transparent',
                      color: it.d > 0 ? 'var(--accent)' : 'var(--muted-2)',
                    }}>%</button>
                  <div style={{ display: 'flex', alignItems: 'center',
                                background: 'var(--surface-2)', borderRadius: 7,
                                border: '1px solid var(--border)' }}>
                    <button onClick={() => setQty(it.sku, it.q - 1)} style={qtyBtn}>
                      <Icon name="minus" size={11} stroke={2.4} />
                    </button>
                    {qtyEditing === it.sku ? (
                      <input
                        autoFocus
                        type="number" min="1"
                        value={qtyInput}
                        onChange={e => setQtyInput(e.target.value)}
                        onFocus={e => e.target.select()}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const v = Math.max(1, parseInt(qtyInput) || 1);
                            setQty(it.sku, v);
                            setQtyEditing(null);
                          }
                          if (e.key === 'Escape') setQtyEditing(null);
                        }}
                        onBlur={() => {
                          const v = Math.max(1, parseInt(qtyInput) || 1);
                          setQty(it.sku, v);
                          setQtyEditing(null);
                        }}
                        style={{
                          width: 44, textAlign: 'center', fontSize: 13, fontWeight: 700,
                          border: 'none', background: 'var(--primary-soft)',
                          color: 'var(--primary)', outline: 'none',
                          fontFamily: 'var(--font-mono)', padding: '0 2px',
                          MozAppearance: 'textfield',
                        }}
                      />
                    ) : (
                      <span
                        className="a-num"
                        onClick={() => { setQtyEditing(it.sku); setQtyInput(String(it.q)); }}
                        title="Clique para editar quantidade"
                        style={{
                          width: 28, textAlign: 'center', fontSize: 13, fontWeight: 600,
                          cursor: 'text', borderRadius: 4,
                          transition: 'background .1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-soft)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >{it.q}</span>
                    )}
                    <button onClick={() => setQty(it.sku, it.q + 1)} style={qtyBtn}>
                      <Icon name="plus" size={11} stroke={2.4} />
                    </button>
                  </div>
                  <div className="a-num" style={{ minWidth: 68, textAlign: 'right', fontSize: 13.5, fontWeight: 700 }}>
                    R$ {(it.p * it.q - (it.d || 0)).toFixed(2).replace('.',',')}
                  </div>
                </div>
              </div>
              {/* Inline discount editor */}
              {discEditing === it.sku && (
                <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Desc R$</span>
                  <input
                    autoFocus
                    type="number" min="0" step="0.01"
                    value={discInput}
                    onChange={e => setDiscInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === 'Tab') {
                        setItemDiscount(it.sku, parseFloat(discInput.replace(',','.')) || 0);
                        setDiscEditing(null);
                      }
                      if (e.key === 'Escape') { setDiscEditing(null); }
                    }}
                    onBlur={() => { setItemDiscount(it.sku, parseFloat(discInput.replace(',','.')) || 0); setDiscEditing(null); }}
                    className="a-input"
                    style={{ flex: 1, height: 28, fontSize: 12.5, padding: '0 8px' }}
                  />
                  <button onClick={() => { setItemDiscount(it.sku, 0); setDiscEditing(null); }}
                          className="a-btn a-btn-ghost" style={{ height: 28, padding: '0 8px', fontSize: 11 }}>
                    Zerar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Totals — bloco fixo, sempre visível abaixo dos itens */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '14px 20px',
                    background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)', marginBottom: 6 }}>
            <span>Subtotal · {itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
            <span className="a-num">R$ {subtotal.toFixed(2).replace('.',',')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Desconto</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[0, 5, 10].map(d => (
                <button key={d} onClick={() => setDiscount(d)} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  fontFamily: 'inherit', border: '1px solid',
                  borderColor: discount === d ? 'var(--accent)' : 'var(--border)',
                  background: discount === d ? 'var(--accent-soft)' : 'transparent',
                  color: discount === d ? 'var(--accent)' : 'var(--muted)', cursor: 'default',
                }}>{d}%</button>
              ))}
              <span className="a-num" style={{ minWidth: 64, textAlign: 'right',
                                                color: discountValue ? 'var(--accent)' : 'var(--muted)' }}>
                −R$ {discountValue.toFixed(2).replace('.',',')}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        padding: '12px 0 0', borderTop: '1px dashed var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
            <span className="a-num" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.02em' }}>
              R$ {total.toFixed(2).replace('.',',')}
            </span>
          </div>

          <button disabled={cart.length === 0} onClick={onCheckout} className="a-btn a-btn-primary"
                  style={{ width: '100%', height: 52, fontSize: 15, marginTop: 12,
                           justifyContent: 'center', opacity: cart.length === 0 ? 0.45 : 1 }}>
            Finalizar venda
            <Icon name="arrow-right" size={16} />
            <span className="a-mono" style={{ marginLeft: 4, fontSize: 11, opacity: .8,
                                               border: '1px solid rgba(255,255,255,.3)',
                                               padding: '1px 5px', borderRadius: 3 }}>F8</span>
          </button>

          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button className="a-btn a-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                    title="Em breve">
              <Icon name="clock" size={13} /> Salvar
            </button>
            <button onClick={clearAll} className="a-btn a-btn-ghost"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12,
                             color: cart.length > 0 ? 'var(--danger)' : 'var(--muted-2)' }}
                    disabled={cart.length === 0}>
              <Icon name="close" size={13} stroke={2} /> Cancelar
            </button>
          </div>
        </div>

      {/* Recent sales — flex: 1 para preencher o espaço restante, com scroll próprio */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', borderTop: '1px solid var(--border)',
                    padding: '10px 14px 12px', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.1em',
                        textTransform: 'uppercase', fontWeight: 700 }}>
            Vendas do dia {recentSales.length > 0 && <span style={{ fontWeight: 400, letterSpacing: 0 }}>({recentSales.length})</span>}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      style={{ ...pagBtn, opacity: page === 0 ? 0.3 : 1 }}>
                <Icon name="chevron-right" size={11} stroke={2.2} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <span className="a-mono" style={{ fontSize: 10, color: 'var(--muted)', minWidth: 36, textAlign: 'center' }}>
                {page + 1} / {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                      style={{ ...pagBtn, opacity: page === totalPages - 1 ? 0.3 : 1 }}>
                <Icon name="chevron-right" size={11} stroke={2.2} />
              </button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {pagedSales.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--muted)', padding: '6px 0' }}>
              Nenhuma venda registrada hoje
            </div>
          )}
          {pagedSales.map(v => {
            const hora = v.criado_em
              ? new Date(v.criado_em.replace(' ', 'T')).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : '--:--';
            const metodo = v.forma_pagto === 'pix' ? 'Pix'
              : v.forma_pagto === 'credit' ? 'Crédito'
              : v.forma_pagto === 'debit' ? 'Débito'
              : v.forma_pagto === 'cash' ? 'Din.'
              : v.forma_pagto === 'multiplo' ? 'Split'
              : v.forma_pagto || '—';
            return (
              <div key={v.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 6px', borderRadius: 6, fontSize: 11.5, transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <span className="a-mono" style={{ color: 'var(--muted-2)', fontSize: 11 }}>
                    V-{String(v.numero).padStart(4, '0')}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>{hora}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    background: 'var(--surface-2)', color: 'var(--muted-2)', border: '1px solid var(--border)',
                  }}>{metodo}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span className="a-num" style={{ fontWeight: 700, fontSize: 12 }}>
                    R$ {Number(v.total).toFixed(2).replace('.', ',')}
                  </span>
                  <button onClick={() => onReprint(v.id)} title="Reimprimir cupom"
                          style={{ width: 24, height: 24, border: 'none', background: 'transparent',
                                   color: 'var(--muted-2)', cursor: 'default', display: 'grid',
                                   placeItems: 'center', borderRadius: 5, fontFamily: 'inherit',
                                   transition: 'background .1s, color .1s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-soft)'; e.currentTarget.style.color = 'var(--primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-2)'; }}>
                    <Icon name="arrow-down" size={13} stroke={2} />
                  </button>
                  <button onClick={() => onCancelar(v.id)} title="Cancelar venda"
                          style={{ width: 24, height: 24, border: 'none', background: 'transparent',
                                   color: 'var(--muted-2)', cursor: 'default', display: 'grid',
                                   placeItems: 'center', borderRadius: 5, fontFamily: 'inherit',
                                   transition: 'background .1s, color .1s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-soft)'; e.currentTarget.style.color = 'var(--danger)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-2)'; }}>
                    <Icon name="close" size={12} stroke={2.2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

const qtyBtn = {
  width: 26, height: 26, border: 'none', background: 'transparent',
  color: 'var(--text-2)', cursor: 'default', display: 'grid', placeItems: 'center',
  fontFamily: 'inherit',
};

const pagBtn = {
  width: 22, height: 22, border: '1px solid var(--border)', borderRadius: 5,
  background: 'transparent', color: 'var(--muted)', cursor: 'default',
  display: 'grid', placeItems: 'center', fontFamily: 'inherit',
};

// ─────────────────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { k: 'pix',    l: 'Pix',      i: 'pix'     },
  { k: 'credit', l: 'Crédito',  i: 'card'    },
  { k: 'debit',  l: 'Débito',   i: 'card'    },
  { k: 'cash',   l: 'Dinheiro', i: 'cash'    },
  { k: 'fiado',  l: 'Fiado',    i: 'clients' },
];
const formaLabel = k => PAYMENT_METHODS.find(m => m.k === k)?.l ?? k;

function PaymentModal({ total, onCancel, onConfirm, saving, clienteSelecionado, onClienteChange }) {
  const [entries, setEntries] = useP([]);   // [{forma, valor}]
  const [forma, setForma] = useP('pix');
  const [valorStr, setValorStr] = useP('');
  const [buscaCliente, setBuscaCliente] = useP('');
  const [clientes, setClientes] = useP([]);
  const valorRef = useR(null);

  const totalPago = entries.reduce((s, e) => s + e.valor, 0);
  const faltando = Math.max(0, total - totalPago);
  const troco = Math.max(0, totalPago - total);
  const temFiado = entries.some(e => e.forma === 'fiado') || forma === 'fiado';
  const fiadoOk = !temFiado || clienteSelecionado;
  const canConfirm = totalPago >= total && entries.length > 0 && !saving && fiadoOk;

  useE(() => {
    if (forma !== 'fiado') return;
    const q = buscaCliente.trim();
    if (q.length < 2) { setClientes([]); return; }
    window.api.get(`/api/cliente?q=${encodeURIComponent(q)}`).then(setClientes).catch(() => {});
  }, [buscaCliente, forma]);

  useE(() => {
    function onKey(e) {
      if (e.key === 'F8' && canConfirm) { e.preventDefault(); onConfirm(entries, troco); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canConfirm, entries, troco]);

  function addEntry() {
    const valor = parseFloat(valorStr.replace(',', '.')) || faltando;
    if (valor <= 0) return;
    setEntries(prev => [...prev, { forma, valor }]);
    setValorStr('');
    valorRef.current?.focus();
  }

  function removeEntry(i) { setEntries(prev => prev.filter((_, idx) => idx !== i)); }

  return (
    <Overlay onClose={onCancel}>
      <div className="a-card" style={{ width: 580, padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-pop)' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.12em',
                          textTransform: 'uppercase', fontWeight: 700 }}>Pagamento</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Como o cliente vai pagar?</div>
          </div>
          <button onClick={onCancel} className="a-btn a-btn-ghost"
                  style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div style={{ padding: 22 }}>
          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
            {[
              { label: 'Total', value: total, color: null, gradient: true },
              { label: 'Pago',  value: totalPago, color: totalPago > 0 ? 'var(--success)' : null, gradient: false },
              { label: troco > 0 ? 'Troco' : 'Faltando',
                value: troco > 0 ? troco : faltando,
                color: troco > 0 ? 'var(--accent)' : faltando > 0 ? 'var(--danger)' : 'var(--success)',
                gradient: false },
            ].map(b => (
              <div key={b.label} style={{
                padding: '12px 14px', borderRadius: 10,
                background: b.gradient
                  ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 200%)'
                  : 'var(--surface-2)',
                border: b.gradient ? 'none' : '1px solid var(--border)',
                color: b.gradient ? '#fff' : 'var(--text)',
              }}>
                <div style={{ fontSize: 10, opacity: b.gradient ? .8 : 1,
                              color: b.gradient ? 'inherit' : 'var(--muted)',
                              letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700 }}>
                  {b.label}
                </div>
                <div className="a-num" style={{ fontSize: 22, fontWeight: 700, marginTop: 2,
                                                 color: b.gradient ? 'inherit' : (b.color || 'var(--text)') }}>
                  R$ {b.value.toFixed(2).replace('.',',')}
                </div>
              </div>
            ))}
          </div>

          {/* Entries list */}
          {entries.length > 0 && (
            <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 10,
                          background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {entries.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                                      alignItems: 'center', padding: '5px 0', fontSize: 13,
                                      borderBottom: i < entries.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                  <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{formaLabel(e.forma)}</span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="a-num" style={{ fontWeight: 700 }}>
                      R$ {e.valor.toFixed(2).replace('.',',')}
                    </span>
                    <button onClick={() => removeEntry(i)} style={{
                      width: 20, height: 20, border: 'none', background: 'transparent',
                      color: 'var(--muted)', cursor: 'default', display: 'grid', placeItems: 'center',
                      fontFamily: 'inherit',
                    }}>
                      <Icon name="close" size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Seletor de cliente para fiado */}
          {(temFiado) && (
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--warning-soft)', border: '1px solid var(--warning)', marginBottom: 10 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
                Cliente para fiado {!clienteSelecionado && '— obrigatório'}
              </div>
              {clienteSelecionado
                ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      <Icon name="user" size={13} /> {clienteSelecionado.nome}
                    </div>
                    <button onClick={() => { onClienteChange(null); setBuscaCliente(''); }} className="a-btn a-btn-ghost" style={{ height: 26, padding: '0 8px', fontSize: 11 }}>
                      <Icon name="close" size={11} /> Trocar
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input className="a-input" value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)}
                      placeholder="Digite o nome ou CPF do cliente…" autoFocus style={{ height: 36 }} />
                    {clientes.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, boxShadow: 'var(--shadow-pop)' }}>
                        {clientes.slice(0, 5).map(c => (
                          <button key={c.id} onClick={() => { onClienteChange(c); setBuscaCliente(''); setClientes([]); }}
                            style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', textAlign: 'left',
                                     cursor: 'default', fontFamily: 'inherit', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 600 }}>{c.nome}</div>
                            {c.cpf_cnpj && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.cpf_cnpj}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          )}

          {/* Add entry panel */}
          {faltando > 0 && (
            <div style={{ padding: 16, borderRadius: 12, background: 'var(--surface-2)',
                          border: '1px solid var(--border)' }}>
              {/* Method selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 12 }}>
                {PAYMENT_METHODS.map(m => (
                  <button key={m.k} onClick={() => setForma(m.k)} style={{
                    padding: '10px 6px', borderRadius: 8, cursor: 'default', fontFamily: 'inherit',
                    background: forma === m.k ? 'var(--primary-soft)' : 'var(--surface)',
                    border: '1.5px solid', borderColor: forma === m.k ? 'var(--primary)' : 'var(--border)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <Icon name={m.i} size={18} stroke={1.6}
                          style={{ color: forma === m.k ? 'var(--primary)' : 'var(--text-2)' }} />
                    <div style={{ fontWeight: 700, fontSize: 12,
                                  color: forma === m.k ? 'var(--primary)' : 'var(--text)' }}>{m.l}</div>
                  </button>
                ))}
              </div>

              {/* Amount + add */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={valorRef}
                  autoFocus
                  value={valorStr}
                  onChange={e => setValorStr(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addEntry(); }}
                  placeholder={faltando.toFixed(2).replace('.',',')}
                  className="a-input"
                  style={{ flex: 1, height: 46, fontSize: 20, fontWeight: 700 }}
                />
                <button onClick={addEntry} className="a-btn a-btn-primary"
                        style={{ height: 46, padding: '0 18px', flexShrink: 0 }}>
                  <Icon name="plus" size={16} stroke={2.4} /> Adicionar
                </button>
              </div>

              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {(forma === 'cash' ? [50, 100, 200] : []).concat([faltando]).map((v, i, arr) => (
                  <button key={i} onClick={() => setValorStr(v.toFixed(2).replace('.', ','))}
                          className="a-btn" style={{ flex: 1, justifyContent: 'center', fontSize: 11.5 }}>
                    R$ {Number(v).toFixed(0)}{v === faltando ? ' · exato' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'var(--surface-2)' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            <span className="a-mono" style={{ padding: '1px 6px', borderRadius: 4,
                                               background: 'var(--surface)', border: '1px solid var(--border)' }}>
              Esc
            </span> cancelar
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCancel} className="a-btn">Voltar</button>
            <button onClick={() => onConfirm(entries, troco)} disabled={!canConfirm}
                    className="a-btn a-btn-primary"
                    style={{ opacity: canConfirm ? 1 : .45, padding: '0 22px' }}>
              <Icon name="check" size={16} stroke={2.4} />
              {saving ? 'Registrando…' : 'Confirmar pagamento'}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function PixQR() {
  // Stylized QR placeholder
  const cells = useM(() => {
    const arr = [];
    for (let i = 0; i < 21*21; i++) arr.push(Math.random() > 0.5);
    return arr;
  }, []);
  return (
    <div style={{
      width: 112, height: 112, padding: 8, borderRadius: 8,
      background: '#fff', flexShrink: 0,
      display: 'grid', gridTemplateColumns: 'repeat(21, 1fr)', gap: 0,
    }}>
      {cells.map((on, i) => {
        // Force the three position markers
        const r = Math.floor(i / 21), c = i % 21;
        const inFinder = (rr, cc) => (rr < 7 && cc < 7) || (rr < 7 && cc > 13) || (rr > 13 && cc < 7);
        const finderRing = inFinder(r, c) && (r % 6 === 0 || c % 6 === 0 || (r > 1 && r < 5 && c > 1 && c < 5)
          || (r > 1 && r < 5 && c < 5 && c > 14) || (r > 14 && r < 19 && c > 1 && c < 5));
        const filled = inFinder(r, c) ? finderRing : on;
        return <div key={i} style={{ background: filled ? '#000' : '#fff', aspectRatio: '1/1' }} />;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function ReceiptModal({ sale, onClose, reprint = false }) {
  useE(() => {
    function onKey(e) { if (e.key === 'F2') { e.preventDefault(); onClose(); } }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function sendWhatsApp() {
    const dt = sale.ts.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const sep = '━━━━━━━━━━━━━━━━━━━━━';

    const itensLines = sale.items.map(it => {
      const net = (it.p * it.q - (it.d || 0)).toFixed(2).replace('.', ',');
      const nome = it.n.length > 24 ? it.n.slice(0, 22) + '…' : it.n;
      return `  ${it.q}× ${nome}  R$ ${net}`;
    }).join('\n');

    const pagsLines = (sale.pagamentos || []).map(pg =>
      `  💳 ${formaLabel(pg.forma)}  R$ ${pg.valor.toFixed(2).replace('.', ',')}`
    ).join('\n');

    const descontoLine = sale.discountValue > 0
      ? `  Desconto     −R$ ${sale.discountValue.toFixed(2).replace('.', ',')}\n`
      : '';

    const trocoLine = sale.troco > 0
      ? `  Troco         R$ ${sale.troco.toFixed(2).replace('.', ',')}\n`
      : '';

    const lines = [
      `🏛️ *ATHENAS PDV* · Bom Preço · Centro`,
      sep,
      `🧾 *${sale.id}* · ${dt}`,
      sep,
      itensLines,
      sep,
      `  Subtotal      R$ ${sale.subtotal.toFixed(2).replace('.', ',')}`,
      descontoLine.trim() || null,
      `  *TOTAL        R$ ${sale.total.toFixed(2).replace('.', ',')}*`,
      ``,
      pagsLines,
      trocoLine.trim() || null,
      sep,
      `Obrigado pela preferência! 🙏`,
      `_ATHENAS PDV · Sistema de gestão_`,
    ].filter(l => l !== null).join('\n');

    // whatsapp:// abre o app desktop; fallback para web se não instalado
    const encoded = encodeURIComponent(lines);
    const appUrl = `whatsapp://send?text=${encoded}`;
    const webUrl = `https://web.whatsapp.com/send?text=${encoded}`;
    const a = document.createElement('a');
    a.href = appUrl;
    a.click();
    // fallback: se o protocolo não abrir em 1.5s, abre no browser
    setTimeout(() => { if (document.hasFocus()) window.open(webUrl, '_blank', 'noopener'); }, 1500);
  }

  function printReceipt() {
    // symbol-black.svg embutido inline (fiel ao arquivo original do brand-kit)
    const symbolSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" style="width:40px;height:50px;display:block;margin:0 auto 5px">
<defs><clipPath id="rc-pclip">
  <rect x="46" y="60" width="148" height="11" rx="1"/>
  <path d="M 54 71 L 186 71 L 176 82 L 64 82 Z"/>
  <rect x="93" y="82" width="54" height="3.5"/>
  <rect x="97" y="85.5" width="46" height="158"/>
  <rect x="93" y="243.5" width="54" height="3.5"/>
  <path d="M 64 247 L 176 247 L 186 258 L 54 258 Z"/>
  <rect x="46" y="258" width="148" height="14" rx="1"/>
</clipPath></defs>
<g fill="#111114">
  <rect x="46" y="60" width="148" height="11" rx="1"/>
  <path d="M 54 71 L 186 71 L 176 82 L 64 82 Z"/>
  <rect x="93" y="82" width="54" height="3.5"/>
  <rect x="97" y="85.5" width="46" height="158"/>
  <rect x="93" y="243.5" width="54" height="3.5"/>
  <path d="M 64 247 L 176 247 L 186 258 L 54 258 Z"/>
  <rect x="46" y="258" width="148" height="14" rx="1"/>
</g>
<g>
  <rect x="113" y="156" width="14" height="78" fill="#111114"/>
  <path d="M 94 122 L 146 122 L 138 158 L 102 158 Z" fill="#111114"/>
  <rect x="96" y="127" width="48" height="2.5" fill="rgba(255,255,255,0.18)"/>
  <rect x="102" y="156" width="36" height="2" fill="rgba(0,0,0,0.18)"/>
</g>
<g clip-path="url(#rc-pclip)" fill="none" stroke="#FFFFFF" stroke-linejoin="round">
  <rect x="113" y="156" width="14" height="78" stroke-width="1"/>
  <line x1="120" y1="156" x2="120" y2="234" stroke-width="0.6" opacity="0.7"/>
  <path d="M 94 122 L 146 122 L 138 158 L 102 158 Z" stroke-width="1"/>
  <line x1="96" y1="128" x2="144" y2="128" stroke-width="0.8"/>
</g>
<g stroke="#111114" stroke-linecap="round" stroke-linejoin="round" fill="none">
  <path d="M 106 122 C 128 102,122 86,116 70 C 110 54,124 38,138 22" stroke-width="2.4" stroke-dasharray="20 6 10 5 14 7" opacity="0.55"/>
  <path d="M 114 122 C 140 100,132 80,124 64 C 116 48,134 30,154 16" stroke-width="2.6" stroke-dasharray="24 5 12 8 18 6"/>
  <path d="M 122 122 C 150 98,138 74,128 58 C 118 42,142 24,164 14 C 178 10,184 24,172 30 C 162 34,162 22,172 20" stroke-width="2.4" stroke-dasharray="28 6 12 5 16 8" opacity="0.55"/>
</g>
<line x1="156" y1="38" x2="164" y2="32" stroke="#111114" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="148" cy="50" r="1.6" fill="#111114" opacity="0.55"/>
<g clip-path="url(#rc-pclip)"><g stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round" fill="none">
  <path d="M 106 122 C 128 102,122 86,116 70 C 110 54,124 38,138 22" stroke-width="2.4" stroke-dasharray="20 6 10 5 14 7" opacity="0.72"/>
  <path d="M 114 122 C 140 100,132 80,124 64 C 116 48,134 30,154 16" stroke-width="2.6" stroke-dasharray="24 5 12 8 18 6"/>
  <path d="M 122 122 C 150 98,138 74,128 58 C 118 42,142 24,164 14 C 178 10,184 24,172 30 C 162 34,162 22,172 20" stroke-width="2.4" stroke-dasharray="28 6 12 5 16 8" opacity="0.72"/>
</g>
<line x1="156" y1="38" x2="164" y2="32" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="148" cy="50" r="1.6" fill="#FFFFFF" opacity="0.72"/></g>
</svg>`;

    const itensHtml = sale.items.map(it =>
      `<div class="item"><span class="iname">${it.q}&times; ${it.n}</span><span class="ival">R$&nbsp;${(it.p * it.q).toFixed(2).replace('.',',')}</span></div>`
    ).join('');
    const pagsHtml = (sale.pagamentos || []).map(p =>
      `<div class="row sm"><span>${formaLabel(p.forma)}</span><span>R$&nbsp;${p.valor.toFixed(2).replace('.',',')}</span></div>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Cupom ${sale.id}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter','Helvetica Neue',sans-serif;font-size:11px;color:#111;background:#fff;
       width:302px;margin:0 auto;padding:14px 10px 20px;
       -webkit-print-color-adjust:exact;print-color-adjust:exact}
  .header{text-align:center;margin-bottom:11px}
  .wordmark{font-family:'Sora',system-ui,sans-serif;font-size:17px;font-weight:700;
            letter-spacing:.01em;display:inline-flex;align-items:baseline;gap:5px;margin-top:3px;color:#111114}
  .wm-st{color:#1E3A8A}
  .wm-pdv{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:500;
          letter-spacing:.22em;color:#111114;opacity:.5}
  .store-name{font-size:11px;font-weight:600;margin-top:7px}
  .store-sub{font-size:9px;color:#888;margin-top:1px}
  hr{border:none;border-top:1px dashed #bbb;margin:9px 0}
  .meta{font-size:9px;color:#666;text-align:center;line-height:1.6}
  .item{display:flex;justify-content:space-between;padding:2.5px 0;font-size:10.5px}
  .iname{flex:1;padding-right:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ival{flex-shrink:0;font-variant-numeric:tabular-nums}
  .row{display:flex;justify-content:space-between;padding:1.5px 0;font-size:10.5px;color:#444}
  .row.sm{font-size:10px;color:#666}
  .row.grand{font-size:15px;font-weight:700;color:#111;padding-top:5px}
  .footer{text-align:center;margin-top:12px;font-size:9px;color:#999;line-height:1.7}
  .powered{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.05em}
  @media print{
    @page{size:80mm auto;margin:4mm 3mm}
    body{width:80mm;margin:0;padding:4px 2px;font-size:10px}
    .wordmark{font-size:15px}
    .row.grand{font-size:13px}
  }
</style>
</head>
<body>
<div class="header">
  ${symbolSvg}
  <div class="wordmark">
    <span>A<span class="wm-st">T</span>HENA<span class="wm-st">S</span></span>
    <span class="wm-pdv">PDV</span>
  </div>
  <div class="store-name">Loja Bom Preço · Centro</div>
  <div class="store-sub">CNPJ: 00.000.000/0001-00 · Rua Exemplo, 123</div>
</div>
<hr>
<div class="meta">Cupom não fiscal · ${sale.id}<br>${sale.ts.toLocaleString('pt-BR')}</div>
<hr>
${itensHtml}
<hr>
<div class="row"><span>Subtotal</span><span>R$&nbsp;${sale.subtotal.toFixed(2).replace('.',',')}</span></div>
${sale.discount > 0 ? `<div class="row"><span>Desconto (${sale.discount}%)</span><span>&minus;R$&nbsp;${sale.discountValue.toFixed(2).replace('.',',')}</span></div>` : ''}
<div class="row grand"><span>TOTAL</span><span>R$&nbsp;${sale.total.toFixed(2).replace('.',',')}</span></div>
<hr>
${pagsHtml}
${sale.troco > 0 ? `<div class="row sm"><span>Troco</span><span>R$&nbsp;${sale.troco.toFixed(2).replace('.',',')}</span></div>` : ''}
<hr>
<div class="footer">
  Obrigado pela preferência!<br>
  <span class="powered">ATHENAS PDV · Sistema de gestão</span>
</div>
<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`;
    const w = window.open('', '_blank', 'width=420,height=700,toolbar=0,menubar=0,location=0,scrollbars=1');
    if (w) { w.document.write(html); w.document.close(); }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="a-card" style={{ width: 460, padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-pop)' }}>
        {/* Success header */}
        <div style={{
          padding: '28px 24px 22px', textAlign: 'center', position: 'relative',
          background: 'linear-gradient(180deg, var(--success-soft) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border)',
        }}>
          <button onClick={onClose} className="a-btn a-btn-ghost"
                  style={{ position: 'absolute', top: 12, right: 12,
                           width: 32, height: 32, padding: 0, justifyContent: 'center' }}>
            <Icon name="close" size={16} />
          </button>
          <div style={{
            width: 56, height: 56, borderRadius: 999,
            background: reprint ? 'var(--primary)' : 'var(--success)', color: '#fff',
            display: 'grid', placeItems: 'center', margin: '0 auto 14px',
            boxShadow: `0 8px 28px -10px ${reprint ? 'var(--primary)' : 'var(--success)'}`,
          }}>
            <Icon name={reprint ? 'arrow-down' : 'check'} size={28} stroke={2.6} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 700 }}>{reprint ? 'Reimpressão' : 'Venda concluída'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
            <span className="a-mono">{sale.id}</span> · {sale.ts.toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Receipt body */}
        <div style={{ padding: '18px 24px', maxHeight: 240, overflowY: 'auto' }}>
          {sale.items.map(it => (
            <div key={it.sku} style={{ display: 'flex', justifyContent: 'space-between',
                                        fontSize: 12.5, padding: '4px 0', color: 'var(--text-2)' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {it.q}× {it.n}
              </span>
              <span className="a-num">R$ {(it.p*it.q).toFixed(2).replace('.',',')}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px dashed var(--border)', marginTop: 10, paddingTop: 10,
                        display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5 }}>
            <Row l="Subtotal" v={`R$ ${sale.subtotal.toFixed(2).replace('.',',')}`} muted />
            {sale.discountValue > 0 && (
              <Row l={sale.discount > 0 ? `Desconto (${sale.discount}%)` : 'Desconto'} v={`−R$ ${sale.discountValue.toFixed(2).replace('.',',')}`} muted accent />
            )}
            {(sale.pagamentos || []).map((p, i) => (
              <Row key={i} l={formaLabel(p.forma)} v={`R$ ${p.valor.toFixed(2).replace('.',',')}`} muted />
            ))}
            {sale.troco > 0 && (
              <Row l="Troco" v={`R$ ${sale.troco.toFixed(2).replace('.',',')}`} accent />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
            <span className="a-num" style={{ fontSize: 26, fontWeight: 700 }}>
              R$ {sale.total.toFixed(2).replace('.',',')}
            </span>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)',
                      display: 'flex', gap: 8, background: 'var(--surface-2)', flexWrap: 'wrap' }}>
          <button onClick={printReceipt} className="a-btn" style={{ flex: 1, justifyContent: 'center', minWidth: 90 }}>
            <Icon name="arrow-down" size={14} /> Imprimir
          </button>
          <button onClick={() => {
            // Abre a mesma janela de recibo mas com title PDF para o navegador salvar como PDF
            const w = window.open('', '_blank', 'width=420,height=700,toolbar=0,menubar=0,location=0');
            if (!w) return;
            // Inject receipt — usa a mesma função printReceipt mas muda o título
            printReceipt();
            setTimeout(() => {
              try { w.document.title = `Recibo-${sale.id}.pdf`; } catch(_) {}
            }, 200);
          }} className="a-btn" style={{ flex: 1, justifyContent: 'center', minWidth: 90 }}>
            <Icon name="reports" size={14} /> PDF
          </button>
          <button onClick={sendWhatsApp} className="a-btn"
                  style={{ flex: 1, justifyContent: 'center', minWidth: 90, color: '#25D366',
                           borderColor: 'rgba(37,211,102,.35)', background: 'rgba(37,211,102,.08)' }}>
            <Icon name="whatsapp" size={14} /> WhatsApp
          </button>
          <button onClick={onClose} className="a-btn a-btn-primary" style={{ flex: 1.4, justifyContent: 'center', minWidth: 100 }}>
            Nova venda
            <span className="a-mono" style={{ fontSize: 10, opacity: .8, marginLeft: 4,
                                               border: '1px solid rgba(255,255,255,.3)',
                                               padding: '0 4px', borderRadius: 3 }}>F2</span>
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente reutilizável de autorização — estrutura para futura integração com usuários
function SupervisorAuth({ label, value, onChange }) {
  return (
    <div style={{
      marginTop: 14, padding: '12px 14px', borderRadius: 10,
      border: '1px solid var(--border)', background: 'var(--surface-3)',
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted)',
                    textTransform: 'uppercase', letterSpacing: '.08em',
                    marginBottom: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
        <Icon name="user" size={12} stroke={2} /> {label || 'Autorização'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input
          type="text"
          placeholder="Nome do supervisor *"
          value={value.nome}
          onChange={e => onChange({ ...value, nome: e.target.value })}
          className="a-input"
          style={{ height: 36, fontSize: 12.5 }}
        />
        <input
          type="password"
          placeholder="Código / PIN"
          value={value.codigo}
          onChange={e => onChange({ ...value, codigo: e.target.value })}
          className="a-input"
          style={{ height: 36, fontSize: 12.5 }}
        />
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted-2)', marginTop: 6, lineHeight: 1.4 }}>
        Registrado para auditoria · sistema de autenticação em configuração no painel admin
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function CancelVendaModal({ vendaId, venda, onConfirmar, onCancelar }) {
  const [motivo, setMotivo] = useP('');
  const [auth, setAuth] = useP({ nome: '', codigo: '' });
  const [loading, setLoading] = useP(false);
  const canConfirm = motivo.trim().length >= 3 && auth.nome.trim().length > 0 && !loading;

  const numero = venda ? `V-${String(venda.numero).padStart(4,'0')}` : vendaId;
  const total  = venda ? `R$ ${Number(venda.total).toFixed(2).replace('.',',')}` : '—';

  async function confirmar() {
    setLoading(true);
    await onConfirmar(vendaId, motivo, auth);
    setLoading(false);
  }

  return (
    <Overlay onClose={onCancelar}>
      <div className="a-card" style={{ width: 460, padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-pop)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--danger)', letterSpacing: '.12em',
                          textTransform: 'uppercase', fontWeight: 700 }}>Cancelamento</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Cancelar venda {numero}</div>
          </div>
          <button onClick={onCancelar} className="a-btn a-btn-ghost"
                  style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Resumo da venda */}
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--danger-soft)',
                        border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '.06em' }}>Venda a cancelar</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{numero}</div>
            </div>
            <div className="a-num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)' }}>{total}</div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--warning-soft)',
                        border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
            ⚠️ O estoque dos produtos será estornado automaticamente. Esta ação não pode ser desfeita.
          </div>

          {/* Motivo */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)',
                            display: 'block', marginBottom: 6 }}>
              Motivo do cancelamento *
            </label>
            <input
              autoFocus
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ex: erro na digitação, desistência do cliente…"
              className="a-input"
            />
            {motivo.length > 0 && motivo.trim().length < 3 && (
              <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>Mínimo 3 caracteres</div>
            )}
          </div>

          {/* Autorização */}
          <SupervisorAuth label="Autorização do supervisor" value={auth} onChange={setAuth} />
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)',
                      display: 'flex', gap: 8, background: 'var(--surface-2)' }}>
          <button onClick={onCancelar} className="a-btn" style={{ flex: 1, justifyContent: 'center' }}>
            Voltar
          </button>
          <button onClick={confirmar} disabled={!canConfirm}
                  style={{
                    flex: 2, justifyContent: 'center', height: 36, display: 'inline-flex',
                    alignItems: 'center', gap: 8, padding: '0 16px', borderRadius: 8,
                    border: '1px solid var(--danger)', background: canConfirm ? 'var(--danger)' : 'var(--danger-soft)',
                    color: canConfirm ? '#fff' : 'var(--danger)', fontWeight: 700, fontSize: 13,
                    cursor: 'default', fontFamily: 'inherit', opacity: canConfirm ? 1 : .6,
                  }}>
            <Icon name="close" size={15} stroke={2.4} />
            {loading ? 'Cancelando…' : 'Confirmar cancelamento'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function CaixaAberturaScreen({ onAbrir, caixaInfo, recentSales }) {
  const [fundo, setFundo] = useP('');
  const [opNome, setOpNome] = useP('');
  const [opCodigo, setOpCodigo] = useP('');
  const [now, setNow] = useP(new Date());
  useE(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const canAbrir = opNome.trim().length > 0;

  const totalTurno = recentSales.reduce((s, v) => s + Number(v.total), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', background: 'var(--bg)', padding: 40, gap: 20 }}>
      <LogoLockup variant="pilar" size={28} />
      <div className="a-card" style={{ width: 420, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '28px 28px 22px', textAlign: 'center',
                      background: 'linear-gradient(160deg, var(--primary-soft) 0%, transparent 100%)',
                      borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700,
                        letterSpacing: '.14em', textTransform: 'uppercase' }}>Abertura de Caixa</div>
          <div className="a-num" style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-.03em', marginTop: 6 }}>
            {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, textTransform: 'capitalize' }}>
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </div>
        </div>

        <div style={{ padding: '22px 28px 0' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block',
                          marginBottom: 8, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Fundo de Troco
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                           fontSize: 15, fontWeight: 600, color: 'var(--muted)' }}>R$</span>
            <input
              autoFocus type="number" min="0" step="0.01"
              value={fundo}
              onChange={e => setFundo(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && canAbrir) onAbrir(parseFloat(fundo.replace(',','.')) || 0, { nome: opNome.trim(), codigo: opCodigo }); }}
              placeholder="0,00"
              className="a-input"
              style={{ height: 54, paddingLeft: 40, fontSize: 22, fontWeight: 700, letterSpacing: '-.01em' }}
            />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.4 }}>
            Valor em dinheiro disponível para troco no início do turno. Pode ser zero.
          </div>
        </div>

        {/* Identificação do operador */}
        <div style={{ padding: '0 28px 16px' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block',
                          marginBottom: 8, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Identificação do Operador
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              type="text"
              value={opNome}
              onChange={e => setOpNome(e.target.value)}
              placeholder="Seu nome *"
              className="a-input"
              style={{ height: 40, fontSize: 13 }}
            />
            <input
              type="password"
              value={opCodigo}
              onChange={e => setOpCodigo(e.target.value)}
              placeholder="Código / PIN"
              className="a-input"
              style={{ height: 40, fontSize: 13 }}
              onKeyDown={e => { if (e.key === 'Enter' && canAbrir) onAbrir(parseFloat(fundo.replace(',','.')) || 0, { nome: opNome.trim(), codigo: opCodigo }); }}
            />
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 6 }}>
            Registrado para auditoria · sistema de autenticação em configuração
          </div>
        </div>

        {recentSales.length > 0 && (
          <div style={{ margin: '16px 28px 0', padding: '10px 14px', borderRadius: 10,
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>Último turno · {recentSales.length} vendas</span>
            <span className="a-num" style={{ fontWeight: 700 }}>
              R$ {totalTurno.toFixed(2).replace('.',',')}
            </span>
          </div>
        )}

        <div style={{ padding: '20px 28px 24px' }}>
          <button
            onClick={() => onAbrir(parseFloat(fundo.replace(',','.')) || 0, { nome: opNome.trim(), codigo: opCodigo })}
            disabled={!canAbrir}
            className="a-btn a-btn-primary"
            style={{ width: '100%', height: 52, fontSize: 15, justifyContent: 'center', opacity: canAbrir ? 1 : .45 }}>
            <Icon name="check" size={18} stroke={2.4} /> Abrir Caixa
          </button>
          {!canAbrir && (
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>
              Informe o nome do operador para abrir o caixa
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function SangriaModal({ onConfirmar, onCancelar }) {
  const [valor, setValor] = useP('');
  const [motivo, setMotivo] = useP('');
  const [auth, setAuth] = useP({ nome: '', codigo: '' });
  const valorNum = parseFloat(valor.replace(',','.')) || 0;
  const canConfirm = valorNum > 0 && auth.nome.trim().length > 0;
  return (
    <Overlay onClose={onCancelar}>
      <div className="a-card" style={{ width: 400, padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-pop)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.12em',
                          textTransform: 'uppercase', fontWeight: 700 }}>PDV</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Retirada (Sangria)</div>
          </div>
          <button onClick={onCancelar} className="a-btn a-btn-ghost"
                  style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}>
            <Icon name="close" size={16} />
          </button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)',
                            display: 'block', marginBottom: 6 }}>Valor da retirada</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                             fontSize: 15, fontWeight: 600, color: 'var(--muted)' }}>R$</span>
              <input autoFocus type="number" min="0.01" step="0.01"
                     value={valor}
                     onChange={e => setValor(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter' && valorNum > 0) onConfirmar(valorNum, motivo); }}
                     placeholder="0,00"
                     className="a-input"
                     style={{ height: 52, paddingLeft: 40, fontSize: 22, fontWeight: 700 }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)',
                            display: 'block', marginBottom: 6 }}>
              Motivo <span style={{ fontWeight: 400 }}>(opcional)</span>
            </label>
            <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)}
                   placeholder="Ex: envio para cofre, pagamento de fornecedor…"
                   className="a-input" />
          </div>
          <SupervisorAuth label="Autorização do supervisor" value={auth} onChange={setAuth} />
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)',
                      display: 'flex', gap: 8, background: 'var(--surface-2)' }}>
          <button onClick={onCancelar} className="a-btn" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
          <button onClick={() => canConfirm && onConfirmar(valorNum, motivo, auth)}
                  disabled={!canConfirm}
                  className="a-btn a-btn-primary"
                  style={{ flex: 2, justifyContent: 'center', opacity: canConfirm ? 1 : .45 }}>
            <Icon name="check" size={16} stroke={2.4} /> Confirmar sangria
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function CaixaFechamentoModal({ caixaInfo, recentSales, onConfirmar, onCancelar }) {
  const [contagem, setContagem] = useP('');
  const [auth, setAuth] = useP({ nome: '', codigo: '' });
  const canFechar = auth.nome.trim().length > 0;

  const totalVendas = recentSales.length;
  const totalFaturado = recentSales.reduce((s, v) => s + Number(v.total), 0);
  const totalTroco = recentSales.reduce((s, v) => s + Number(v.troco || 0), 0);
  const totalSangrias = (caixaInfo.sangrias || []).reduce((s, sg) => s + sg.valor, 0);
  const estimado = caixaInfo.fundo + totalFaturado - totalTroco - totalSangrias;

  const contagemVal = contagem ? parseFloat(contagem.replace(',','.')) : null;
  const diferenca = contagemVal !== null ? contagemVal - estimado : null;

  const turnoMin = caixaInfo.abertoEm
    ? Math.round((Date.now() - caixaInfo.abertoEm.getTime()) / 60000)
    : 0;
  const turnoStr = turnoMin < 60
    ? `${turnoMin}min`
    : `${Math.floor(turnoMin/60)}h ${turnoMin % 60}min`;

  return (
    <Overlay onClose={onCancelar}>
      <div className="a-card" style={{ width: 500, padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-pop)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.12em',
                          textTransform: 'uppercase', fontWeight: 700 }}>Fechamento</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Encerrar turno</div>
          </div>
          <button onClick={onCancelar} className="a-btn a-btn-ghost"
                  style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            {[
              { l: 'Vendas', v: totalVendas },
              { l: 'Duração', v: turnoStr },
              { l: 'Faturado', v: `R$ ${totalFaturado.toFixed(2).replace('.',',')}` },
              { l: 'Sangrias', v: totalSangrias > 0 ? `R$ ${totalSangrias.toFixed(2).replace('.',',')}` : '—' },
            ].map(s => (
              <div key={s.l} style={{ padding: '10px 12px', borderRadius: 10,
                                      background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.l}</div>
                <div className="a-num" style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Cash breakdown */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-2)',
                        border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase',
                          letterSpacing: '.08em', marginBottom: 10 }}>Acerto de caixa</div>
            {[
              { l: 'Fundo inicial', v: caixaInfo.fundo, neg: false },
              { l: 'Total faturado', v: totalFaturado, neg: false },
              { l: 'Troco devolvido', v: totalTroco, neg: true },
              { l: 'Sangrias', v: totalSangrias, neg: true },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between',
                                      padding: '3px 0', fontSize: 12.5, color: 'var(--text-2)' }}>
                <span>{r.l}</span>
                <span className="a-num" style={{ fontWeight: 600 }}>
                  {r.neg ? '−' : '+'}R$ {r.v.toFixed(2).replace('.',',')}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                          marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)',
                          fontSize: 14, fontWeight: 700 }}>
              <span>Esperado no caixa</span>
              <span className="a-num">R$ {estimado.toFixed(2).replace('.',',')}</span>
            </div>
          </div>

          {/* Physical count */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              Contagem física <span style={{ fontWeight: 400 }}>(opcional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                             fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>R$</span>
              <input type="number" min="0" step="0.01"
                     value={contagem}
                     onChange={e => setContagem(e.target.value)}
                     placeholder={estimado.toFixed(2).replace('.',',')}
                     className="a-input"
                     style={{ paddingLeft: 36 }}
              />
            </div>
            {diferenca !== null && (
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700,
                            color: Math.abs(diferenca) < 0.01
                              ? 'var(--success)'
                              : diferenca < 0 ? 'var(--danger)' : 'var(--warning)' }}>
                {Math.abs(diferenca) < 0.01
                  ? '✓ Caixa conferido — sem diferença'
                  : diferenca < 0
                    ? `Faltam R$ ${Math.abs(diferenca).toFixed(2).replace('.',',')} no caixa`
                    : `Sobram R$ ${diferenca.toFixed(2).replace('.',',')} no caixa`}
              </div>
            )}
          </div>

          <SupervisorAuth label="Autorização do supervisor para fechamento" value={auth} onChange={setAuth} />

          {/* Sangrias list */}
          {caixaInfo.sangrias && caixaInfo.sangrias.length > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 10,
                          background: 'var(--warning-soft)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--warning)',
                            textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                Sangrias do turno
              </div>
              {caixaInfo.sangrias.map((sg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                                      fontSize: 12, color: 'var(--text-2)', padding: '2px 0' }}>
                  <span>{sg.motivo || 'Sem descrição'} · {sg.ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="a-num" style={{ fontWeight: 700 }}>−R$ {sg.valor.toFixed(2).replace('.',',')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)',
                      display: 'flex', gap: 8, background: 'var(--surface-2)' }}>
          <button onClick={onCancelar} className="a-btn" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
          <button onClick={() => canFechar && onConfirmar(auth, contagemVal)}
                  disabled={!canFechar}
                  className="a-btn a-btn-primary"
                  style={{ flex: 2, justifyContent: 'center', opacity: canFechar ? 1 : .45 }}>
            <Icon name="check" size={16} stroke={2.4} /> Confirmar fechamento
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function Row({ l, v, muted, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
                  color: accent ? 'var(--accent)' : muted ? 'var(--muted)' : 'var(--text)' }}>
      <span>{l}</span>
      <span className="a-num" style={{ fontWeight: accent ? 700 : 500 }}>{v}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  useE(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(2, 6, 23, 0.62)', backdropFilter: 'blur(6px)',
      display: 'grid', placeItems: 'center', padding: 20,
      animation: 'fadeIn .15s ease',
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{ animation: 'popIn .18s ease' }}>
        <style>{`@keyframes popIn{from{transform:scale(.96);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { PDV });
