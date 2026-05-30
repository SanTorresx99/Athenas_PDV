// dashboard.jsx — Dashboard route

const { useState: useDashState, useMemo: useDashMemo, useEffect: useDashEffect } = React;

function Dashboard({ tweaks, setTweak }) {
  const [range, setRange] = useDashState('7d');
  const [layout] = useDashState(tweaks.layout || 'overview');

  const compact = tweaks.density === 'compact';
  const gap = compact ? 12 : 16;

  const [dados, setDados] = useDashState(null);
  const [dLoading, setDLoading] = useDashState(true);

  useDashEffect(() => {
    window.api.get('/api/dashboard')
      .then(setDados)
      .catch(() => {})
      .finally(() => setDLoading(false));
  }, []);

  const brlD = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');
  const fmtN = (v) => Number(v).toLocaleString('pt-BR');

  return (
    <div style={{ padding: compact ? '20px 28px 60px' : '28px 36px 80px', maxWidth: 1480, margin: '0 auto', width: '100%' }}>
      {/* Page head */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>
            Mercadinho Bom Preço · Centro
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 700, letterSpacing: '-.025em' }}>
            Olá, Patrícia.
            <span style={{ color: 'var(--muted)', fontWeight: 500 }}> Aqui está o seu dia.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
            {[
              { k: 'hoje', l: 'Hoje' },
              { k: '7d',   l: '7 dias' },
              { k: '30d',  l: '30 dias' },
              { k: 'mes',  l: 'Mês' },
            ].map(r => (
              <button
                key={r.k}
                onClick={() => setRange(r.k)}
                style={{
                  padding: '6px 12px', borderRadius: 5,
                  background: range === r.k ? 'var(--surface-3)' : 'transparent',
                  color: range === r.k ? 'var(--text)' : 'var(--muted)',
                  border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'default',
                  fontFamily: 'inherit',
                }}>
                {r.l}
              </button>
            ))}
          </div>
          <button className="a-btn">
            <Icon name="filter" size={14} /> Filtros
          </button>
          <button className="a-btn a-btn-primary">
            <Icon name="arrow-down" size={14} /> Exportar
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap }}>
        <KPI big eyebrow="Vendas do dia" value={dLoading ? '…' : brlD(dados?.resumo?.faturamento ?? 0)} trend="up"
             foot="Total de vendas fechadas hoje" spark={[3,5,4,6,8,7,9,10,8,11,12,14]} />
        <KPI eyebrow="Caixa atual" value="R$ 3.214,80" pillBg="success-soft" pillFg="success" pillText="Aberto · 08:12"
             foot="Sangria sugerida em R$ 5.000" />
        <KPI eyebrow="Ticket médio" value={dLoading ? '…' : brlD(dados?.resumo?.ticket_medio ?? 0)} trend="up"
             foot="Média por venda fechada hoje" />
        <KPI eyebrow="Vendas realizadas" value={dLoading ? '…' : fmtN(dados?.resumo?.qtd_vendas ?? 0)} trend="up"
             foot="Cupons fechados hoje" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap, marginTop: gap }}>
        <KPI eyebrow="Clientes" value="124" foot="12 novos esta semana" pillBg="primary-soft" pillFg="primary" pillText="cadastrados" />
        <KPI eyebrow="Margem média" value="32,8%" delta="-1,2%" trend="down" foot="Cervejaria puxou pra baixo" />
        <KPI eyebrow="Estoque crítico" value={dLoading ? '…' : String(dados?.criticos?.length ?? 0)} pillBg="warning-soft" pillFg="warning" pillText="atenção"
             foot="Itens abaixo do estoque mínimo" />
        <KPI eyebrow="Status do sistema" value="OK" pillBg="success-soft" pillFg="success" pillText="online"
             foot="SAT, NFC-e e Pix conectados" mono />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 1fr)', gap, marginTop: gap }}>
        <SalesChart range={range} compact={compact} />
        <PaymentMix compact={compact} />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap, marginTop: gap }}>
        <TopProducts compact={compact} items={dados?.mais_vendidos ?? []} />
        <StockAlerts compact={compact} items={dados?.criticos ?? []} />
        <RecentActivity compact={compact} events={dados?.ultimas_vendas ?? []} />
      </div>

      {/* Footer status strip */}
      <div className="a-card" style={{
        marginTop: gap, padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, color: 'var(--muted)',
      }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--success)' }} />
            Sincronizado às 14:32
          </span>
          <span>SAT · OK</span>
          <span>Sefaz · OK</span>
          <span>Pix · OK</span>
        </div>
        <div className="a-mono" style={{ fontSize: 11 }}>v3.0.41 · sessão #A8821</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function KPI({ eyebrow, value, delta, trend, foot, pillBg, pillFg, pillText, spark, big, mono }) {
  return (
    <div className="a-card" style={{ padding: 18, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', letterSpacing: '.04em',
                      textTransform: 'uppercase', fontWeight: 700,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eyebrow}</div>
        {pillText && (
          <span style={{
            padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: `var(--${pillBg || 'surface-3'})`, color: `var(--${pillFg || 'muted'})`,
            display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />
            {pillText}
          </span>
        )}
      </div>
      <div style={{
        fontSize: big ? 'clamp(22px, 2.4cqi + 14px, 32px)' : 'clamp(19px, 1.8cqi + 13px, 26px)',
        fontWeight: 700,
        letterSpacing: '-.02em',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }} className="a-num">{value}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          {delta && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                          color: trend === 'down' ? 'var(--danger)' : 'var(--success)' }}>
              <Icon name={trend === 'down' ? 'arrow-down' : 'arrow-up'} size={11} stroke={2.4} />
              {delta}
            </div>
          )}
          {foot && <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4 }}>{foot}</div>}
        </div>
        {spark && <Sparkline data={spark} />}
      </div>
    </div>
  );
}

function Sparkline({ data }) {
  const max = Math.max(...data), min = Math.min(...data);
  const w = 100, h = 32;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i*step},${h - ((v - min)/(max - min || 1)) * h}`).join(' ');
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="sp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity=".35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="var(--accent)" strokeWidth="1.5" points={points} />
      <polygon fill="url(#sp)" points={`0,${h} ${points} ${w},${h}`} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function SalesChart({ range, compact }) {
  // Pseudo data: 14 days
  const dataset = useDashMemo(() => {
    const seed = [620, 840, 720, 980, 1100, 1480, 920, 760, 1020, 880, 1240, 1380, 1620, 1248];
    const labels = ['Q','Q','S','S','D','S','T','Q','Q','S','S','D','S','T'];
    return seed.map((v, i) => ({ v, l: labels[i % labels.length] }));
  }, []);
  const sliced = range === 'hoje' ? dataset.slice(-1) : range === '7d' ? dataset.slice(-7)
                : range === '30d' ? dataset : dataset;
  const max = Math.max(...sliced.map(d => d.v)) * 1.18;
  const W = 600, H = compact ? 220 : 260, PAD = 28, BAR = (W - PAD*2) / sliced.length;

  return (
    <div className="a-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Vendas</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Comparado ao período anterior</div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12 }}>
          <Legend dot="var(--primary)" label="Este período" />
          <Legend dot="var(--surface-3)" label="Anterior" hollow />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 12 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em' }} className="a-num">R$ 18.420,80</div>
        <div style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600, display: 'inline-flex', gap: 4 }}>
          <Icon name="trend-up" size={14} /> +24% vs semana anterior
        </div>
      </div>

      <div style={{ marginTop: 16, position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
          {/* Y grid */}
          {[0.25, 0.5, 0.75, 1].map((y, i) => (
            <g key={i}>
              <line x1={PAD} x2={W-PAD} y1={H - 24 - y * (H - 48)} y2={H - 24 - y * (H - 48)}
                    stroke="var(--border)" strokeDasharray="3 3" />
            </g>
          ))}
          {/* Bars */}
          {sliced.map((d, i) => {
            const bh = (d.v / max) * (H - 48);
            const x = PAD + i * BAR + BAR * 0.18;
            const y = H - 24 - bh;
            const bw = BAR * 0.64;
            const peak = i === sliced.length - 1;
            return (
              <g key={i}>
                {/* "previous" ghost bar */}
                <rect x={x - 2} y={H - 24 - bh*0.78} width={bw} height={bh*0.78} fill="var(--surface-3)" rx="3" />
                <rect x={x} y={y} width={bw} height={bh} fill={peak ? 'var(--accent)' : 'var(--primary)'} rx="3" />
              </g>
            );
          })}
          {/* X labels */}
          {sliced.map((d, i) => (
            <text key={i} x={PAD + i * BAR + BAR/2} y={H - 6} fill="var(--muted)"
                  fontSize="10" textAnchor="middle" fontFamily="var(--font-sans)">{d.l}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function Legend({ dot, label, hollow }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
      <span style={{
        width: 8, height: 8, borderRadius: 2,
        background: hollow ? 'transparent' : dot,
        border: hollow ? `1.5px solid ${dot}` : 'none',
      }} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function PaymentMix({ compact }) {
  const segs = [
    { l: 'Pix',          v: 5840, c: 'var(--primary)',  pct: 47 },
    { l: 'Crédito',      v: 3120, c: 'var(--accent)',   pct: 25 },
    { l: 'Débito',       v: 2240, c: '#8B5CF6',         pct: 18 },
    { l: 'Dinheiro',     v: 1280, c: 'var(--muted-2)',  pct: 10 },
  ];
  return (
    <div className="a-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Formas de pagamento</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Distribuição do dia</div>
        </div>
        <button className="a-btn a-btn-ghost" style={{ height: 28, padding: '0 8px', fontSize: 11 }}>
          Detalhes
        </button>
      </div>

      {/* Donut */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16 }}>
        <Donut segs={segs} size={compact ? 112 : 128} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {segs.map(s => (
            <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.c }} />
              <span style={{ color: 'var(--text-2)', flex: 1 }}>{s.l}</span>
              <span className="a-num" style={{ fontWeight: 600 }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-soft)',
                      color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
          <Icon name="sparkle" size={14} />
        </div>
        <div style={{ flex: 1, color: 'var(--text-2)' }}>
          Pix subiu <b style={{ color: 'var(--accent)' }}>+9p.p.</b> esta semana.
        </div>
      </div>
    </div>
  );
}

function Donut({ segs, size = 128 }) {
  const stroke = size * 0.18;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      {segs.map((s, i) => {
        const len = (s.pct / 100) * C;
        const dash = `${len} ${C - len}`;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r}
                  fill="none" stroke={s.c} strokeWidth={stroke}
                  strokeDasharray={dash} strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size/2} ${size/2})`}
                  strokeLinecap="butt" />
        );
        offset += len + 2;
        return el;
      })}
      <text x="50%" y="46%" textAnchor="middle" fill="var(--text)"
            fontSize={size*0.20} fontWeight="700" fontFamily="var(--font-sans)" letterSpacing="-.02em">
        R$ 12k
      </text>
      <text x="50%" y="62%" textAnchor="middle" fill="var(--muted)"
            fontSize={size*0.085} fontFamily="var(--font-sans)">total · dia</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function TopProducts({ compact, items }) {
  const display = items.map(mv => ({
    n: mv.nome, q: mv.qtd_vendida, r: mv.receita, t: mv.unidade || '—',
  }));
  const max = display.length ? Math.max(...display.map(i => i.r)) : 1;

  return (
    <div className="a-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Top produtos</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Mais vendidos no período</div>
        </div>
        <span className="a-pill a-pill-accent">
          <Icon name="star" size={11} stroke={2.4} />
          ranking
        </span>
      </div>
      {display.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
          Sem vendas no período
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {display.map((it, i) => (
          <div key={it.n} style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 700,
                           fontFamily: 'var(--font-mono)' }}>{String(i+1).padStart(2,'0')}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.n}</span>
                <span style={{ fontSize: 10.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{it.t}</span>
              </div>
              <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(it.r/max)*100}%`, height: '100%',
                              background: i === 0 ? 'var(--accent)' : 'var(--primary)',
                              borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="a-num" style={{ fontSize: 12.5, fontWeight: 600 }}>R$ {Number(it.r).toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{it.q} un.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function StockAlerts({ compact, items }) {
  const display = items.slice(0, 5).map(c => ({
    n: c.nome,
    q: Number(c.saldo),
    s: Number(c.saldo) <= 0 ? 'crítico' : 'baixo',
    t: Number(c.saldo) <= 0 ? 'pedir agora' : `mín ${c.estoque_min}`,
  }));
  const tone = { 'crítico': ['danger','danger-soft'], 'baixo': ['warning','warning-soft'] };

  return (
    <div className="a-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Estoque crítico</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{items.length} itens precisando de atenção</div>
        </div>
        <button className="a-btn a-btn-ghost" style={{ height: 28, padding: '0 8px', fontSize: 11 }}>
          Ver tudo
        </button>
      </div>
      {display.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
          Nenhum item em alerta
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {display.map(it => (
          <div key={it.n} style={{
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
            padding: '10px 12px', borderRadius: 10,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{it.n}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                Cobertura: {it.t}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="a-num" style={{ fontSize: 14, fontWeight: 700 }}>{it.q}</div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: `var(--${tone[it.s][1]})`, color: `var(--${tone[it.s][0]})`,
                textTransform: 'uppercase', letterSpacing: '.06em',
              }}>{it.s}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function RecentActivity({ compact, events }) {
  const fmtHora = (s) => {
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  const fmtForma = (f) => ({ pix: 'Pix', credit: 'Crédito', debit: 'Débito', cash: 'Dinheiro' }[f] || f);
  const display = events.map(v => ({
    t: fmtHora(v.criado_em),
    a: `Venda #${v.numero}`,
    d: `R$ ${Number(v.total).toFixed(2).replace('.', ',')} · ${fmtForma(v.forma_pagto)}`,
    i: 'pdv',
    c: 'primary',
  }));

  return (
    <div className="a-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Atividade</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Últimas vendas do dia</div>
        </div>
        <button className="a-btn a-btn-ghost" style={{ height: 28, padding: '0 8px', fontSize: 11 }}>
          Histórico
        </button>
      </div>
      {display.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
          Nenhuma venda registrada hoje
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 13, top: 6, bottom: 6, width: 1, background: 'var(--border)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {display.map((e, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center', position: 'relative' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `var(--${e.c}-soft)`, color: `var(--${e.c})`,
                display: 'grid', placeItems: 'center', position: 'relative', zIndex: 1,
                border: '2px solid var(--surface)',
              }}>
                <Icon name={e.i} size={13} stroke={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{e.a}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{e.d}</div>
              </div>
              <div className="a-mono" style={{ fontSize: 11, color: 'var(--muted-2)' }}>{e.t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
