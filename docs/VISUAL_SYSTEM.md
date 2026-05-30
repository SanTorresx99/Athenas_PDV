# Sistema Visual — ATHENAS PDV

Fonte da verdade: `LOGOTIPO/logo-symbol.jsx` e `LOGOTIPO/brand-kit/`.
O MOKUP VISUAL (`MOKUP VISUAL/`) implementa e demonstra este sistema.

---

## Símbolo

Anatomia do símbolo ATHENAS (viewBox `0 0 240 300`, ratio 4:5):

| Elemento | Cor | Significado |
|---|---|---|
| Pilar grego (T) | Primária | Solidez, arquitetura, tradição |
| Tocha (S) | Acento | Luz, conhecimento, Atena |
| Fumaça em S (S) | Acento (tracejado) | Movimento, operação, fluxo |

**Assinatura oculta:** T (pilar) + S (tocha/fumaça) = ST = Sandro Torres

### Componentes React disponíveis (`window.*`)

```jsx
<AthenasSymbol
  primary="#0E2A47"
  accent="#D4A24C"
  size={120}               // largura; altura = size × 1.25 (ratio 4:5)
  monochrome={false}
  cutoutColor={null}       // efeito vazado sobre fundo colorido
/>

<AthenasWordmark
  primary="#0E2A47"
  accent="#D4A24C"
  size={48}                // tamanho da fonte em px
  showPdv={true}
  weight={700}
/>

<AthenasLockupH  symbolSize={80} wordSize={40} />  // horizontal
<AthenasLockupV  symbolSize={100} wordSize={36} />  // vertical
```

---

## Paletas de cor

| Nome | Primary | Accent | Background |
|------|---------|--------|------------|
| **Marinho & Ouro** (padrão) | `#0E2A47` | `#D4A24C` | `#F6F2E9` |
| Indigo & Lavanda | `#241B4D` | `#9C7FF0` | `#F4F1FA` |
| Marinho & Prata | `#0E2538` | `#8C97AC` | `#ECEEF3` |
| Mármore & Bronze | `#2B2421` | `#C8943B` | `#F4EFE7` |
| Tinta & Prata | `#111114` | `#9DA4B2` | `#F2F3F5` |
| Esmeralda & Cobre | `#0F4A3A` | `#C97942` | `#F2EEE2` |
| Terracota & Grafite | `#8B2E1F` | `#2B2421` | `#F0E5D2` |

---

## CSS Variables (MOKUP VISUAL)

### Tema escuro (padrão)
```css
--bg:           #0B1220
--surface:      #0F172A
--surface-2:    #111B30
--surface-3:    #182338
--border:       #1E293B
--text:         #F8FAFC
--text-2:       #CBD5E1
--muted:        #94A3B8
--primary:      #2563EB   /* ação / destaque UI */
--accent:       #06B6D4   /* cyan padrão */
--success:      #10B981
--warning:      #F59E0B
--danger:       #EF4444
```

### Variantes de acento
```css
[data-accent="gold"]  → --accent: #F59E0B
```

### Temas disponíveis via `data-theme`
- `dark` (padrão)
- `light`

---

## Tipografia

| Uso | Fonte | Peso | Onde |
|-----|-------|------|------|
| Wordmark ATHENAS | Sora | 700 | Logo, títulos de marca |
| UI / Corpo | Manrope | 400–700 | Interface geral |
| Alternativa UI | Inter | 400–700 | Selecionável pelo usuário |
| Valores técnicos / Código | JetBrains Mono | 400–500 | Preços, códigos, dados |

### Hierarquia de tamanhos (referência)
```
48px  → Hero / título de página
32px  → Título de seção
24px  → Subtítulo / card header
18px  → Corpo principal
14px  → Labels, metadados
12px  → Captions, badges
11px  → Micro (pill, tag)
```

---

## Componentes de interface

Definidos como classes CSS utilitárias em `MOKUP VISUAL/index.html`:

| Classe | Uso |
|--------|-----|
| `.a-card` | Card com border, surface e shadow |
| `.a-btn` | Botão secundário padrão |
| `.a-btn-primary` | Botão de ação principal (azul) |
| `.a-btn-accent` | Botão de destaque (accent color) |
| `.a-btn-ghost` | Botão transparente |
| `.a-pill` | Badge / status pequeno |
| `.a-pill-success/warning/danger/accent` | Pill colorido por semântica |
| `.a-input` | Campo de texto |
| `.a-mono` | Texto em JetBrains Mono |
| `.a-num` | Números com tabular-nums |

---

## Ícones

Set de ~30 ícones SVG outline em `logo.jsx` → componente `<Icon name="..." size={18} />`.

Nomes disponíveis: `dashboard`, `pdv`, `products`, `stock`, `finance`, `reports`,
`clients`, `settings`, `search`, `bell`, `plus`, `minus`, `trash`, `check`,
`arrow-right`, `arrow-up`, `arrow-down`, `trend-up`, `card`, `cash`, `pix`,
`box`, `user`, `menu`, `sun`, `moon`, `chevron-down`, `chevron-right`, `star`,
`bolt`, `clock`, `filter`, `close`, `sparkle`, `wifi`

---

## Regras visuais

1. **Nunca usar a cor de acento como fundo de área grande** — apenas para highlights, CTAs e detalhes
2. **Bordas arredondadas:** `--radius-sm: 8px` (inputs, pills), `--radius: 12px` (cards), `--radius-lg: 16px` (modais)
3. **Espaçamento base:** `--gutter: 24px` — múltiplos de 4px para espaços menores
4. **Sombras:** usar `--shadow-card` para cards e `--shadow-pop` para popovers/dropdowns
5. **Fonte do wordmark é sempre Sora** — nunca substituir por Manrope/Inter no logo
6. **T e S em ATHENAS sempre em `--accent`** — assinatura oculta ST deve ser preservada
