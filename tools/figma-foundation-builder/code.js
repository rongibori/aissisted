/*
 * Aissisted Foundation Builder
 * --------------------------------------------------------------------
 * Figma plugin that builds the design-system foundation pages
 * programmatically. v1 ships the Color page; Type / Spacing /
 * Radius & Shadow / Motion are stubbed for follow-up.
 *
 * Run via Plugins → Development → Aissisted Foundation Builder →
 * Build Color page. The active page must be named "Color".
 *
 * Canon: docs/design-system/aissisted-design-spec.md (v2.1 ratios)
 *        packages/brand/tokens.css
 *
 * Per design spec §2.1 — color ratio:
 *   70% white · 8% graphite · 4% soft graphite · 15% red · 2% aqua · 1% midnight
 */

// ── Canon ────────────────────────────────────────────────────────────

const SWATCHES = [
  // Row 1 — neutrals + structure
  { name: 'White',         hex: '#FFFFFF', ratio: '70%', textOnTop: 'graphite', stroke: true,  pos: { x:  80, y: 260 } },
  { name: 'Graphite',      hex: '#1C1C1E', ratio:  '8%', textOnTop: 'white',    stroke: false, pos: { x: 464, y: 260 } },
  { name: 'Soft Graphite', hex: '#2E2E2E', ratio:  '4%', textOnTop: 'white',    stroke: false, pos: { x: 848, y: 260 } },
  // Row 2 — identity + intelligence
  { name: 'Signal Red',    hex: '#EE2B37', ratio: '15%', textOnTop: 'white',    stroke: false, pos: { x:  80, y: 484 } },
  { name: 'Aqua',          hex: '#00C2D1', ratio:  '2%', textOnTop: 'white',    stroke: false, pos: { x: 464, y: 484 } },
  { name: 'Midnight',      hex: '#0B1D3A', ratio:  '1%', textOnTop: 'white',    stroke: false, pos: { x: 848, y: 484 } },
];

const FRAME_W = 1288;
const FRAME_H = 880;
const CARD_W  = 360;
const CARD_H  = 200;

// ── Utilities ────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substr(0, 2), 16) / 255,
    g: parseInt(c.substr(2, 2), 16) / 255,
    b: parseInt(c.substr(4, 2), 16) / 255,
  };
}

function solidFill(hex, opacity) {
  return [{ type: 'SOLID', color: hexToRgb(hex), opacity: opacity == null ? 1 : opacity }];
}

async function tryLoadFont(family, style) {
  try {
    await figma.loadFontAsync({ family, style });
    return { family, style };
  } catch (e) {
    return null;
  }
}

/*
 * Resolve the display font with graceful fallback.
 * Briston is paid-foundry; if not uploaded, fall back to Inter Tight Bold.
 */
async function resolveDisplayFont() {
  const briston = await tryLoadFont('Briston', 'Bold');
  if (briston) return briston;
  const interTight = await tryLoadFont('Inter Tight', 'Bold');
  if (interTight) return interTight;
  // Last resort — Inter Bold (always available in Figma)
  return await tryLoadFont('Inter', 'Bold');
}

async function resolveSystemFont() {
  const plex = await tryLoadFont('IBM Plex Mono', 'Medium');
  if (plex) return plex;
  return await tryLoadFont('Roboto Mono', 'Medium')
      || await tryLoadFont('Inter', 'Medium')
      || await tryLoadFont('Inter', 'Regular');
}

async function resolveBodyFont() {
  return await tryLoadFont('Inter Tight', 'Regular')
      || await tryLoadFont('Inter', 'Regular');
}

/*
 * Create a TextNode with the given content + style.
 * Caller must have already loaded the font via loadFontAsync.
 */
function makeText(content, opts) {
  const text = figma.createText();
  text.fontName = opts.font;
  text.characters = content;
  text.fontSize = opts.size;

  if (opts.letterSpacing != null) {
    text.letterSpacing = { unit: 'PERCENT', value: opts.letterSpacing };
  }
  if (opts.lineHeightPct != null) {
    text.lineHeight = { unit: 'PERCENT', value: opts.lineHeightPct };
  }
  if (opts.upper) {
    text.textCase = 'UPPER';
  }

  text.fills = solidFill(opts.color, opts.opacity);
  return text;
}

// ── Builders ─────────────────────────────────────────────────────────

function createMainFrame() {
  const f = figma.createFrame();
  f.name = 'Brand Reference';
  f.resize(FRAME_W, FRAME_H);
  f.x = 0;
  f.y = 0;
  f.fills = solidFill('#FFFFFF', 1);
  f.strokes = [];
  f.cornerRadius = 0;
  f.clipsContent = false;
  return f;
}

async function createHeader(displayFont, systemFont, bodyFont) {
  const header = figma.createFrame();
  header.name = 'header';
  header.layoutMode = 'VERTICAL';
  header.itemSpacing = 12;
  header.paddingLeft = 0;
  header.paddingRight = 0;
  header.paddingTop = 0;
  header.paddingBottom = 0;
  header.fills = [];
  header.strokes = [];
  header.primaryAxisSizingMode = 'AUTO';
  header.counterAxisSizingMode = 'AUTO';

  // Eyebrow — IBM Plex Mono Medium 12 / 16% / uppercase / graphite 60%
  const eyebrow = makeText('BRAND REFERENCE', {
    font: systemFont,
    size: 12,
    letterSpacing: 16,
    upper: true,
    color: '#1C1C1E',
    opacity: 0.6,
  });

  // Headline — display font Bold 48 / -2% / graphite
  const headline = makeText('The system, locked.', {
    font: displayFont,
    size: 48,
    letterSpacing: -2,
    lineHeightPct: 105,
    color: '#1C1C1E',
    opacity: 1,
  });

  // Subline — body font 14 / 0 / graphite 70%
  const subline = makeText(
    'Mirrors packages/brand/tokens.css. No invention.',
    {
      font: bodyFont,
      size: 14,
      letterSpacing: 0,
      lineHeightPct: 150,
      color: '#1C1C1E',
      opacity: 0.7,
    }
  );

  header.appendChild(eyebrow);
  header.appendChild(headline);
  header.appendChild(subline);

  return header;
}

function createSwatchCard(spec, displayFont, systemFont) {
  const card = figma.createFrame();
  // Slash-naming creates Type/Variant grouping in the Assets panel.
  card.name = 'Swatch/' + spec.name.replace(/\s+/g, '-');
  card.resize(CARD_W, CARD_H);
  card.cornerRadius = 16;
  card.fills = solidFill(spec.hex, 1);
  card.clipsContent = true;

  if (spec.stroke) {
    card.strokes = [{
      type: 'SOLID',
      color: hexToRgb('#1C1C1E'),
      opacity: 0.08,
    }];
    card.strokeWeight = 1;
    card.strokeAlign = 'INSIDE';
  } else {
    card.strokes = [];
  }

  const txtHex = spec.textOnTop === 'white' ? '#FFFFFF' : '#1C1C1E';

  // Ratio (top-left) — IBM Plex Mono 12 / opacity 50
  const ratio = makeText(spec.ratio, {
    font: systemFont,
    size: 12,
    letterSpacing: 0,
    color: txtHex,
    opacity: 0.5,
  });
  ratio.x = 24;
  ratio.y = 24;
  card.appendChild(ratio);

  // Name (below ratio) — display font Bold 22 / -1%
  const name = makeText(spec.name, {
    font: displayFont,
    size: 22,
    letterSpacing: -1,
    lineHeightPct: 110,
    color: txtHex,
    opacity: 1,
  });
  name.x = 24;
  name.y = 48;
  card.appendChild(name);

  // Hex (bottom-left) — IBM Plex Mono 13 / uppercase / opacity 50
  const hex = makeText(spec.hex.toUpperCase(), {
    font: systemFont,
    size: 13,
    letterSpacing: 0,
    upper: true,
    color: txtHex,
    opacity: 0.5,
  });
  hex.x = 24;
  hex.y = CARD_H - 24 - 13; // 24 from bottom, accounting for ~13px text height
  card.appendChild(hex);

  return card;
}

// ── Color page command ───────────────────────────────────────────────

async function buildColorPage() {
  if (figma.currentPage.name !== 'Color') {
    figma.notify('Switch to the "Color" page first, then run again.', { error: true, timeout: 4000 });
    return;
  }

  // Idempotency: if a "Brand Reference" frame already exists on this
  // page, bail out so we don't stack duplicates. User can delete the
  // old one and re-run.
  const existing = figma.currentPage.findOne(
    (n) => n.name === 'Brand Reference' && n.type === 'FRAME'
  );
  if (existing) {
    figma.notify(
      'A "Brand Reference" frame already exists on this page. Delete it first, then re-run.',
      { error: true, timeout: 5000 }
    );
    return;
  }

  // Load fonts up front — Figma requires this before mutating any text.
  figma.notify('Loading fonts…');
  const [displayFont, systemFont, bodyFont] = await Promise.all([
    resolveDisplayFont(),
    resolveSystemFont(),
    resolveBodyFont(),
  ]);

  if (!displayFont || !systemFont || !bodyFont) {
    figma.notify('Required fonts could not load. Check Figma\'s font availability.', { error: true });
    return;
  }

  // Build container
  const main = createMainFrame();
  figma.currentPage.appendChild(main);

  // Header
  const header = await createHeader(displayFont, systemFont, bodyFont);
  main.appendChild(header);
  header.x = 80;
  header.y = 80;

  // Swatches — create, position, then convert each to a component.
  for (const spec of SWATCHES) {
    const card = createSwatchCard(spec, displayFont, systemFont);
    main.appendChild(card);
    card.x = spec.pos.x;
    card.y = spec.pos.y;
    // Convert to component in-place. The frame node is replaced by a
    // ComponentNode that inherits its name + children. The "Swatch/Name"
    // slash convention buckets them in the Assets panel.
    figma.createComponentFromNode(card);
  }

  // Center the viewport on the new frame so the user sees it.
  figma.viewport.scrollAndZoomIntoView([main]);

  const fontNote = displayFont.family === 'Briston'
    ? 'Briston loaded.'
    : `Briston unavailable; using ${displayFont.family} ${displayFont.style} as display fallback.`;

  figma.notify(`Color page built · 6 swatch components created. ${fontNote}`, { timeout: 6000 });
}

// ── About ────────────────────────────────────────────────────────────

function showAbout() {
  figma.notify(
    'Aissisted Foundation Builder v0.1 — builds the Color page on 00 — Foundations. Type / Spacing / Radius / Motion coming soon.',
    { timeout: 6000 }
  );
}

// ── Entry point ──────────────────────────────────────────────────────

(async () => {
  try {
    if (figma.command === 'build-color') {
      await buildColorPage();
    } else if (figma.command === 'about') {
      showAbout();
    } else {
      figma.notify('Unknown command: ' + figma.command, { error: true });
    }
  } catch (err) {
    figma.notify('Plugin error: ' + (err && err.message ? err.message : String(err)), { error: true, timeout: 8000 });
    console.error(err);
  } finally {
    figma.closePlugin();
  }
})();
