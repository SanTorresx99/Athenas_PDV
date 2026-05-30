// brand-kit/_assets-gen.js
// Geradores de strings SVG para o kit de marca ATHENAS PDV.
// Pure functions — sem dependências de React/DOM. Rodam em run_script.

const PALETTES = {
  'indigo-lavanda':    { name: 'Indigo & Lavanda',    primary: '#241B4D', accent: '#9C7FF0', bg: '#F4F1FA' },
  'marinho-prata':     { name: 'Marinho & Prata',     primary: '#0E2538', accent: '#8C97AC', bg: '#ECEEF3' },
  'marinho-ouro':      { name: 'Marinho & Ouro',      primary: '#0E2A47', accent: '#D4A24C', bg: '#F6F2E9' },
  'marmore-bronze':    { name: 'Mármore & Bronze',    primary: '#2B2421', accent: '#C8943B', bg: '#F4EFE7' },
  'tinta-prata':       { name: 'Tinta & Prata',       primary: '#111114', accent: '#9DA4B2', bg: '#F2F3F5' },
  'esmeralda-cobre':   { name: 'Esmeralda & Cobre',   primary: '#0F4A3A', accent: '#C97942', bg: '#F2EEE2' },
  'terracota-grafite': { name: 'Terracota & Grafite', primary: '#8B2E1F', accent: '#2B2421', bg: '#F0E5D2' },
};

const SVG_NS = 'http://www.w3.org/2000/svg';

// ============== PARTS ==============

function pillarMarkup(color) {
  return `<g fill="${color}">
    <rect x="46" y="60" width="148" height="11" rx="1"/>
    <path d="M 54 71 L 186 71 L 176 82 L 64 82 Z"/>
    <rect x="93" y="82" width="54" height="3.5"/>
    <rect x="97" y="85.5" width="46" height="158"/>
    <rect x="93" y="243.5" width="54" height="3.5"/>
    <path d="M 64 247 L 176 247 L 186 258 L 54 258 Z"/>
    <rect x="46" y="258" width="148" height="14" rx="1"/>
  </g>`;
}

function torchMarkup(color, highlight) {
  return `<g>
    <rect x="113" y="156" width="14" height="78" fill="${color}"/>
    <path d="M 94 122 L 146 122 L 138 158 L 102 158 Z" fill="${color}"/>
    <rect x="96" y="127" width="48" height="2.5" fill="${highlight}"/>
    <rect x="102" y="156" width="36" height="2" fill="rgba(0,0,0,0.18)"/>
  </g>`;
}

function smokeMarkup(color, monochrome) {
  const dim = monochrome ? 0.55 : 0.72;
  return `<g stroke="${color}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M 106 122 C 128 102, 122 86, 116 70 C 110 54, 124 38, 138 22"
          stroke-width="2.4" stroke-dasharray="20 6 10 5 14 7" opacity="${dim}"/>
    <path d="M 114 122 C 140 100, 132 80, 124 64 C 116 48, 134 30, 154 16"
          stroke-width="2.6" stroke-dasharray="24 5 12 8 18 6"/>
    <path d="M 122 122 C 150 98, 138 74, 128 58 C 118 42, 142 24, 164 14 C 178 10, 184 24, 172 30 C 162 34, 162 22, 172 20"
          stroke-width="2.4" stroke-dasharray="28 6 12 5 16 8" opacity="${dim}"/>
  </g>
  <line x1="156" y1="38" x2="164" y2="32" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="148" cy="50" r="1.6" fill="${color}" opacity="${dim}"/>`;
}

function pillarClipPath(id) {
  return `<clipPath id="${id}">
    <rect x="46" y="60" width="148" height="11" rx="1"/>
    <path d="M 54 71 L 186 71 L 176 82 L 64 82 Z"/>
    <rect x="93" y="82" width="54" height="3.5"/>
    <rect x="97" y="85.5" width="46" height="158"/>
    <rect x="93" y="243.5" width="54" height="3.5"/>
    <path d="M 64 247 L 176 247 L 186 258 L 54 258 Z"/>
    <rect x="46" y="258" width="148" height="14" rx="1"/>
  </clipPath>`;
}

function torchCutoutMarkup(clipId, color) {
  return `<g clip-path="url(#${clipId})" fill="none" stroke="${color}" stroke-linejoin="round">
    <rect x="113" y="156" width="14" height="78" stroke-width="1"/>
    <line x1="120" y1="156" x2="120" y2="234" stroke-width="0.6" opacity="0.7"/>
    <path d="M 94 122 L 146 122 L 138 158 L 102 158 Z" stroke-width="1"/>
    <line x1="96" y1="128" x2="144" y2="128" stroke-width="0.8"/>
  </g>`;
}

// ============== SYMBOL BUILDERS ==============

function symbolInner({ primary, accent, monochrome=false, cutoutColor=null, idPrefix='ap' }) {
  const p = primary;
  const a = monochrome ? primary : accent;
  const h = monochrome ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.32)';
  const clipId = `${idPrefix}-pclip`;
  const hasCutout = !!cutoutColor;
  return `${hasCutout ? `<defs>${pillarClipPath(clipId)}</defs>` : ''}
${pillarMarkup(p)}
${torchMarkup(a, h)}
${hasCutout ? torchCutoutMarkup(clipId, cutoutColor) : ''}
${smokeMarkup(a, monochrome)}
${hasCutout ? `<g clip-path="url(#${clipId})">${smokeMarkup(cutoutColor, false)}</g>` : ''}`;
}

function buildSymbolSvg(opts) {
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 240 300" aria-label="ATHENAS PDV">
${symbolInner(opts)}
</svg>`;
}

// ============== WORDMARK + LOCKUPS ==============
// Wordmark é SVG com <text> usando Sora. Em ferramentas vetoriais (Illustrator,
// Figma) basta ter a fonte Sora instalada — está incluída via Google Fonts.

function buildWordmarkSvg({ primary, accent, showPdv=true }) {
  // viewBox calibrado para ATHENAS em Sora 700 com letter-spacing 0.04em
  const w = showPdv ? 1180 : 920;
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 ${w} 220" aria-label="ATHENAS PDV">
  <text x="0" y="170" font-family="Sora, system-ui, sans-serif" font-weight="700" font-size="180" letter-spacing="7.2" fill="${primary}">A<tspan fill="${accent}">T</tspan>HENA<tspan fill="${accent}">S</tspan>${showPdv ? `<tspan dx="32" font-family="JetBrains Mono, monospace" font-weight="500" font-size="76" letter-spacing="16.7" fill="${primary}" fill-opacity="0.62">PDV</tspan>` : ''}</text>
</svg>`;
}

function buildLockupHorizontalSvg(opts) {
  const { primary, accent, monochrome=false, cutoutColor=null, showPdv=true } = opts;
  const a = monochrome ? primary : accent;
  // viewBox: símbolo 240x300 + gap + wordmark
  // Símbolo será escalado para altura ~280; texto principal em 180px ocupará ~720, +PDV
  const w = showPdv ? 1260 : 1000;
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 ${w} 300" aria-label="ATHENAS PDV">
${symbolInner({ ...opts, idPrefix: 'lkh' })}
<g transform="translate(310, 0)">
  <text x="0" y="215" font-family="Sora, system-ui, sans-serif" font-weight="700" font-size="180" letter-spacing="7.2" fill="${primary}">A<tspan fill="${a}">T</tspan>HENA<tspan fill="${a}">S</tspan>${showPdv ? `<tspan dx="32" font-family="JetBrains Mono, monospace" font-weight="500" font-size="76" letter-spacing="16.7" fill="${primary}" fill-opacity="0.62">PDV</tspan>` : ''}</text>
</g>
</svg>`;
}

function buildLockupVerticalSvg(opts) {
  const { primary, accent, monochrome=false, showPdv=true } = opts;
  const a = monochrome ? primary : accent;
  const w = showPdv ? 1180 : 920;
  // Símbolo no topo centralizado (240 wide), wordmark centralizado abaixo
  const symbolX = (w - 240) / 2;
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 ${w} 600" aria-label="ATHENAS PDV">
<g transform="translate(${symbolX}, 0)">
${symbolInner({ ...opts, idPrefix: 'lkv' })}
</g>
<g transform="translate(0, 350)">
  <text x="${w/2}" y="170" text-anchor="middle" font-family="Sora, system-ui, sans-serif" font-weight="700" font-size="180" letter-spacing="7.2" fill="${primary}">A<tspan fill="${a}">T</tspan>HENA<tspan fill="${a}">S</tspan>${showPdv ? `<tspan dx="32" font-family="JetBrains Mono, monospace" font-weight="500" font-size="76" letter-spacing="16.7" fill="${primary}" fill-opacity="0.62">PDV</tspan>` : ''}</text>
</g>
</svg>`;
}

// ============== FAVICON ==============

function buildFaviconSvg({ primary, accent, bgColor=null, radius=64 }) {
  // 512x512 com fundo arredondado primário e símbolo centralizado
  const bg = bgColor ?? primary;
  // Símbolo viewBox é 240x300. Vamos centralizar com padding.
  // sx = 80, sy = 50 → símbolo ocupa de (80,50) a (320, 350) = 240x300 em canvas 512x512... falta um pouco
  // Ajustar: escalar símbolo para 380 de altura e centralizar
  // scale = 380/300 = 1.267 → símbolo fica 304x380
  // x = (512 - 304)/2 = 104, y = (512 - 380)/2 = 66
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 512 512" aria-label="ATHENAS PDV">
<rect x="0" y="0" width="512" height="512" rx="${radius}" fill="${bg}"/>
<g transform="translate(104, 66) scale(1.267)">
${symbolInner({ primary: '#FFFFFF', accent: accent, monochrome: false, idPrefix: 'fav' })}
</g>
</svg>`;
}

// ============== EXPORTS ==============

if (typeof module !== 'undefined') {
  module.exports = {
    PALETTES,
    buildSymbolSvg,
    buildWordmarkSvg,
    buildLockupHorizontalSvg,
    buildLockupVerticalSvg,
    buildFaviconSvg,
    symbolInner,
  };
}
