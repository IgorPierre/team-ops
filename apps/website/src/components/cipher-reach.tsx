"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ *
 *  CipherReach (adapted from Originkit's "Two Reaching Hands")
 *
 *  The Creation of Adam, human and machine: the AI's arm (left) is
 *  written in code on a dark dot grid, while the human's arm (right) is
 *  a photograph. A charge gathers at the human fingertip, jumps the gap
 *  and climbs the code arm.
 *
 *  The code hand is the still's own shape: MAP below was sampled cell by
 *  cell from an ASCII "Creation of Adam" on a 96-column grid -- each
 *  cell's peak brightness (tone) and how much of the cell it fills.
 *  The photo is drawn on the same grid, so its fingertip meets the
 *  code hand's at the gap.
 *
 *  Pointer: a torch that brightens, scrambles and pushes the glyphs; a
 *  press sends a ring of light through the code. Reduced motion freezes
 *  everything into a still frame.
 * ------------------------------------------------------------------ */

const LOOK = {
  background: "#050807",
  glyphColor: "#E8F3EE",
  accent: "#10C48A",
  accentAmount: 0.3,
  columns: 128,
  scale: 88,
  glyphSize: 0.92,
  squareSize: 0.67,
  midLevel: 0.74,
  darkLevel: 0.22,
  dotSize: 0.18,
  dotColor: "#1A2A23",
  glow: 0.2,
  bevel: 0.2,
  vignette: 0.15,
  density: 0.76,
  seed: 999,
  buildTime: 1.7,
};

const RESPONSE = { reach: 5, light: 5, repel: 4, ripple: 5 };

// Spark: charge at the human fingertip, jump, then up the code arm.
const SPARK = {
  chargeMs: 1400,
  gapMs: 600,
  leftMs: 1500,
  restMs: 900,
  bandCells: 6,
  bandBoost: 0.4,
  bandBlue: 0.85,
  gapCells: 8,
  gapStaggerMs: 60,
  gapFadeMs: 300,
};

const SHIMMER = { flicker: 3, holdMs: 400, lifeMin: 1200, lifeMax: 3000, fadeMs: 120 };

/* ---------------------------- the still ---------------------------- */

const ART_COLS = 96;
const MAP_TOP = 12;
// "." is unlit, otherwise base-36 v = 4 * tone + finish (tone 1–8, finish 0–3).
const MAP = [
  "..........................................................................................okc8k8",
  "........................................................................................48okgkl9",
  "........................................................................................hecookcd",
  "..................................................................................vulckgir.oogdd",
  "................................................................................vqilgg.kihgg8c9g",
  "...........................................................................wtskppmvphcggh.d44gca",
  "........................................................................xpgkkkppmvvl555678754.gd",
  "......................................................................okskkhkslhmvi95444a854..4g",
  "........v8.4cg.k.ccy................................................ys.ksxxskokkkpako5889a5654g.",
  ".....8uppk.89gpdhpklk.c8g8cggokx.................................yklyyloolkhkko9d.9bk448kl.c8845",
  "....4c.hvktokokkakpplkohdgkkkklqx.........................xxkcgoymmmmmlhl8kokks8d....c545855..5.",
  "..qg8.hvu.ggkoptkdo.sshkklok5klkgx......................kskmpklmmmtddchxlk8wwok9c...95599.54444.",
  "cdkg8kpppoockghpmptkkkhkhkopwoppkkggk.................gophgpppisthtdcgtms8kklogcc....888.9544.4.",
  "qqk8.c88a8cccoilullpokhkdkokpllltodgkcck............okmggkdhf8k8ollpdxplo8kgdgk99......44.984..5",
  "dlcc8g5868gck8cpzyyxlkokkcggkolmxlcsokgoc..........cplk5.xx88...ooodlypoogkgkoc8d9.8.cg.4.tg..45",
  "h8c..469a88...oovvmyxsggcgk8lsplllkltmokgo.........4lix..kk......e8lmmdgcggddc8c88.89c4...kc....",
  "c..4.5546844..clutyyyxphkc88kgdkkkkgdkgplpx.........k8o.........xpsyppddcccc9d88c..s4...........",
  "g.44.48.54....8hlpxyuxxwkkcccgc8.c..dc5klppx...................xplktdockocc888c.c.gs............",
  "c5.4.44.4..c8..klllttxttsgcsw.c..8cc8g.ghlpk..................kxkllgedolso8kk8c..8g.............",
  ".644......okc..kpiplhslssggoswc.dwdd.cc.xpldc.................yi8mmdh9kkoo8kk88g.8..............",
  "4.7544...gso....kospokkkkgooos..dsxd..d.y8oldx................tkookotc.csg848gwo................",
  "4554.4..8t8.......cg88ssggkkoo8c88o8..g.o.4ydq................kkpcchcd.os4ss.gw.................",
  "..44...4u.............wscgswgoggc...8cc....sck.................lp8cl.w5kk4ss....................",
  ".....4.k..................swkkkhdc..8g.c.w.....................plccldwwg84......................",
  "46..........................48gdolc..c.d.o.....................lk8kkd.wkd8......................",
  "...5..........................8dgkc..wcgd8.....................yg.pd9..kk84.....................",
  "..5.5.........................cc.kc..wxxc......................xp8occ..oog8.....................",
  "...d..........................os.g...4ws.......................gl9c8s4.wwsk.....................",
  "..............................os................................l98cw4..........................",
  "g...............................................................kc.9............................",
];
// Columns left of this are the code hand; the photo replaces the rest.
const SPLIT_COL = 48;

// The code arm's centreline, fingertip → shoulder (the spark's way up).
const PATH_L = [
  [45.5, 33.5],
  [33, 28],
  [16, 27],
  [-2, 31],
];
const TIP_L = PATH_L[0];
const TIP_R = [51.5, 27];

// The human hand: /human-hand.png is cut from a 1376 px wide photo drawn
// on the same 96-column grid, so 1376 / 96 photo px per cell.
const PHOTO = {
  src: "/human-hand.png",
  px: 1376 / ART_COLS,
  /** Top-left of the cut-out in photo px. */
  x: 710,
  y: 280,
  /** Photo rows sit this many cells lower than the code hand's. */
  dy: 1.26,
};

const GLYPHS = ["0", "1", "X", "x", ">", "$", "s", "S", "-", ".", "/"];
const SETS = [
  [5, 6, 10, 4, 9, 8],
  [5, 6, 4, 0, 1, 3, 7],
  [0, 1, 2, 1, 0, 4, 2],
];
const SQUARE_CHANCE = [0.1, 0.4, 0.75, 0.95];

// Cells across the frame height at the least: on a tall phone frame the arms
// run off the sides and the fingertips stay large.
const MIN_ROWS_TALL = 40;
const WAVE_SPEED = 55;
const WAVE_LIFE = 1.2;
const WAVE_WIDTH = 1.6;
const BUILD_DELAY = 0.1;
const BUILD_JITTER = 0.35;
const BUILD_FLASH = 0.22;
const EDGE_BAND = 6;
const DROP_L = 4 / 18;

/* ----------------------------- helpers ----------------------------- */

interface Cell {
  ax: number;
  ay: number;
  tone: number;
  level: number;
  square: boolean;
  glyph: number;
  s: number;
  out: number;
  jitter: number;
  hold: number;
  blue: boolean;
  blueAmt: number;
  life: number;
}

interface Wave {
  x: number;
  y: number;
  t: number;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function toneTable(dark: number, mid: number) {
  const d = clamp(dark, 0, 0.99);
  const ratio = clamp((mid - d) / (1 - d), 0.001, 0.999);
  const g = Math.log(ratio) / Math.log(0.5);
  const out = [0];
  for (let t = 1; t <= 8; t++) out.push(d + (1 - d) * Math.pow((t - 1) / 7, g));
  return out;
}

function hash(i: number, j: number, s: number, k: number) {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul(((s | 0) + k * 7919) | 0, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

function mapAt(c: number, r: number) {
  const row = MAP[r - MAP_TOP];
  if (!row || c < 0 || c >= SPLIT_COL || row[c] === ".") return -1;
  return parseInt(row[c], 36);
}

// Past the still's left edge the code arm carries on along its slope.
function mapExt(c: number, r: number) {
  if (c < 0) return mapAt((-c - 1) % EDGE_BAND, Math.round(r - DROP_L * -c));
  return mapAt(c, r);
}

function pathLen(p: number[][]) {
  let l = 0;
  for (let k = 1; k < p.length; k++) l += Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]);
  return l;
}
const LEN_L = pathLen(PATH_L);

function pathParam(p: number[][], px: number, py: number) {
  let best = 1e9;
  let s = 0;
  let acc = 0;
  for (let k = 1; k < p.length; k++) {
    const ax = p[k - 1][0];
    const ay = p[k - 1][1];
    const dx = p[k][0] - ax;
    const dy = p[k][1] - ay;
    const len = Math.hypot(dx, dy);
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / (len * len), 0, 1);
    const d = Math.hypot(px - ax - dx * t, py - ay - dy * t);
    if (d < best) {
      best = d;
      s = acc + t * len;
    }
    acc += len;
  }
  return s;
}

function sample(ax: number, ay: number, k: number) {
  if (k <= 1) return mapExt(Math.floor(ax), Math.floor(ay));
  const c0 = Math.floor(ax - k / 2);
  const c1 = Math.ceil(ax + k / 2) - 1;
  const r0 = Math.floor(ay - k / 2);
  const r1 = Math.ceil(ay + k / 2) - 1;
  let best = -1;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const v = mapExt(c, r);
      if (v >> 2 > best >> 2) best = v;
    }
  }
  return best;
}

function buildCells(cols: number, i0: number, i1: number, j0: number, j1: number): Cell[] {
  const out: Cell[] = [];
  const k = ART_COLS / cols;
  const lifeSpan = SHIMMER.lifeMax - SHIMMER.lifeMin;
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const ax = (i + 0.5) * k;
      const ay = (j + 0.5) * k;
      const v = sample(ax, ay, k);
      if (v < 4) continue;
      const tone = v >> 2;
      if (hash(i, j, LOOK.seed, 1) >= LOOK.density) continue;
      const level = tone <= 2 ? 0 : tone <= 4 ? 1 : 2;
      const s = pathParam(PATH_L, ax, ay) + Math.max(0, PATH_L[PATH_L.length - 1][0] - ax);
      const set = SETS[level];
      const blue = hash(i, j, LOOK.seed, 4) < LOOK.accentAmount * (level === 0 ? 1.3 : level === 1 ? 1 : 0.6);
      out.push({
        ax,
        ay,
        tone,
        level,
        square: tone >= 6 && hash(i, j, LOOK.seed, 3) < SQUARE_CHANCE[v & 3],
        glyph: set[Math.floor(hash(i, j, LOOK.seed, 5) * set.length)],
        s,
        out: clamp(1 - s / LEN_L, 0, 1),
        jitter: hash(i, j, LOOK.seed, 7),
        hold: 0,
        blue,
        blueAmt: blue ? 1 : 0,
        life: SHIMMER.lifeMin + hash(i, j, LOOK.seed, 6) * lifeSpan,
      });
    }
  }
  return out;
}

function buildAtlas(S: number, fontPx: number, colA: string, colB: string) {
  const cv = document.createElement("canvas");
  cv.width = S * GLYPHS.length;
  cv.height = S * 2;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.font = `700 ${fontPx}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let r = 0; r < 2; r++) {
    g.fillStyle = r === 0 ? colA : colB;
    for (let k = 0; k < GLYPHS.length; k++) g.fillText(GLYPHS[k], k * S + S / 2, r * S + S / 2 + S * 0.04);
  }
  return cv;
}

/* ---------------------------- component ---------------------------- */

/**
 * Human hand (photo) reaching for an AI hand written in code. Decorative:
 * pointer events are read from the window, so text laid over it keeps
 * working.
 */
export function CipherReach({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const photo = new Image();
    photo.src = PHOTO.src;

    let W = 0;
    let H = 0;
    let dpr = 1;
    const measure = () => {
      W = root.offsetWidth;
      H = root.offsetHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    let visible = false;
    let buildStart = -1;
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
    });
    io.observe(root);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let seedState = 0x2f6b1d37;
    const rng = () => {
      seedState = (seedState + 0x6d2b79f5) | 0;
      let t = seedState;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    let cells: Cell[] = [];
    let cellKey = "";
    let atlas: HTMLCanvasElement | null = null;
    let atlasKey = "";
    let dots: HTMLCanvasElement | null = null;
    let dotKey = "";
    let cycT = 0;
    let last = -1;
    let raf = 0;
    const waves: Wave[] = [];
    const ptr = { x: 0, y: 0, sx: 0, sy: 0, inside: false, over: 0, press: false };

    // Text sits over the canvas, so read the pointer from the window.
    const locate = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      ptr.x = ((e.clientX - r.left) * W) / Math.max(1, r.width);
      ptr.y = ((e.clientY - r.top) * H) / Math.max(1, r.height);
      if (inside && !ptr.inside) {
        ptr.sx = ptr.x;
        ptr.sy = ptr.y;
      }
      ptr.inside = inside;
      return inside;
    };
    const onDown = (e: PointerEvent) => {
      if (locate(e)) ptr.press = true;
    };
    const onLeave = () => {
      ptr.inside = false;
    };
    window.addEventListener("pointermove", locate, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || W < 2 || H < 2) {
        last = -1;
        return;
      }
      let dt = last < 0 ? 0 : (now - last) / 1000;
      last = now;
      if (dt > 1 / 20) dt = 1 / 20;

      const reduce = mq.matches;
      const sdt = reduce ? 0 : dt;

      const cols = LOOK.columns;
      const k = ART_COLS / cols;
      const unit = (Math.max(W / ART_COLS, H / MIN_ROWS_TALL) * LOOK.scale) / 100;
      const cell = unit * k;
      const ox = W / 2 - (ART_COLS * unit) / 2;
      // The gap between the fingertips (row ~30) sits a little above the
      // middle, between the CTA's title and subtitle, so the spark shows.
      const oy = H * 0.46 - 30 * unit;

      const margin = 6;
      const i0 = Math.floor(-ox / cell) - margin;
      const i1 = Math.ceil((W - ox) / cell) + margin;
      const j0 = Math.floor(-oy / cell) - margin;
      const j1 = Math.ceil((H - oy) / cell) + margin;
      const key = [i0, i1, j0, j1].join("|");
      if (key !== cellKey) {
        cellKey = key;
        cells = buildCells(cols, i0, i1, j0, j1);
      }

      const span = LOOK.buildTime;
      const buildEnd = BUILD_DELAY + span + BUILD_JITTER + BUILD_FLASH;
      if (buildStart < 0) buildStart = now;
      const bt = reduce ? buildEnd : (now - buildStart) / 1000;
      const building = bt < buildEnd;

      const ease = (tau: number) => 1 - Math.exp(-dt / tau);
      ptr.over += ((ptr.inside ? 1 : 0) - ptr.over) * ease(ptr.inside ? 0.083 : 0.133);
      ptr.sx += (ptr.x - ptr.sx) * ease(0.06);
      ptr.sy += (ptr.y - ptr.sy) * ease(0.06);

      const pu = (ptr.sx - ox) / unit;
      const pv = (ptr.sy - oy) / unit;
      const rad = 2 + RESPONSE.reach * 1.2;
      const lightK = (RESPONSE.light / 10) * ptr.over;
      const repelK = reduce ? 0 : (RESPONSE.repel / 10) * 2.2 * ptr.over;
      const ripK = RESPONSE.ripple / 5;
      const pointerOn = ptr.over > 0.002;

      const C = SPARK.chargeMs;
      const G = SPARK.gapMs;
      const L = SPARK.leftMs;
      const cyc = C + G + L + SPARK.restMs;
      if (ptr.press) {
        ptr.press = false;
        if (!reduce) {
          waves.push({ x: pu, y: pv, t: now });
          if (waves.length > 5) waves.shift();
        }
      }
      cycT = building ? 0 : (cycT + sdt * 1000) % cyc;
      for (let w = waves.length - 1; w >= 0; w--) if ((now - waves[w].t) / 1000 > WAVE_LIFE) waves.splice(w, 1);

      const bw = SPARK.bandCells * k * 0.5;
      let posL = 0;
      let ampL = 0;
      let charge = 0;
      if (!building) {
        if (cycT < C) charge = smooth(0, C, cycT);
        else if (cycT < C + G) charge = 1 - (cycT - C) / Math.max(1, G);
        else if (cycT < C + G + L) {
          const lt = cycT - C - G;
          posL = easeOutCubic(lt / L) * (LEN_L + 3 * bw);
          ampL = Math.min(1, lt / 150);
        }
      }

      const slot = Math.ceil(cell * dpr) + 2;
      const fontPx = Math.max(4, cell * dpr * LOOK.glyphSize);
      const aKey = [slot, fontPx.toFixed(2)].join("|");
      if (aKey !== atlasKey || !atlas) {
        atlasKey = aKey;
        atlas = buildAtlas(slot, fontPx, LOOK.glyphColor, LOOK.accent);
      }
      const dotPx = Math.max(1, Math.round(cell * LOOK.dotSize * dpr));
      const dKey = [canvas.width, canvas.height, cell.toFixed(4), ox.toFixed(2), oy.toFixed(2), dotPx, dpr].join("|");
      if (dKey !== dotKey || !dots) {
        dotKey = dKey;
        dots = document.createElement("canvas");
        dots.width = canvas.width;
        dots.height = canvas.height;
        const g = dots.getContext("2d");
        if (g) {
          g.fillStyle = LOOK.dotColor;
          const gi0 = Math.floor(-ox / cell) - 1;
          const gi1 = Math.ceil((W - ox) / cell) + 1;
          const gj0 = Math.floor(-oy / cell) - 1;
          const gj1 = Math.ceil((H - oy) / cell) + 1;
          for (let j = gj0; j <= gj1; j++) {
            const cy = Math.round((oy + (j + 0.5) * cell) * dpr - dotPx / 2);
            for (let i = gi0; i <= gi1; i++) {
              g.fillRect(Math.round((ox + (i + 0.5) * cell) * dpr - dotPx / 2), cy, dotPx, dotPx);
            }
          }
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = LOOK.background;
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(dots, 0, 0, W, H);

      if (pointerOn && lightK > 0) {
        ctx.fillStyle = LOOK.glyphColor;
        const ds = (dotPx * 1.6) / dpr;
        const rc = Math.ceil(rad / k);
        const ci = Math.floor(pu / k);
        const cj = Math.floor(pv / k);
        for (let j = cj - rc; j <= cj + rc; j++) {
          for (let i = ci - rc; i <= ci + rc; i++) {
            const pr = smooth(rad, 0, Math.hypot((i + 0.5) * k - pu, (j + 0.5) * k - pv));
            if (pr <= 0) continue;
            ctx.globalAlpha = 0.8 * pr * lightK;
            ctx.fillRect(ox + (i + 0.5) * cell - ds / 2, oy + (j + 0.5) * cell - ds / 2, ds, ds);
          }
        }
      }

      // The human hand: the photo, on the same grid, sliding in from the right.
      if (photo.complete && photo.naturalWidth) {
        const arrive = reduce ? 1 : easeOutCubic(clamp((bt - BUILD_DELAY) / (span + BUILD_JITTER), 0, 1));
        const pw = (photo.naturalWidth / PHOTO.px) * unit;
        const ph = (photo.naturalHeight / PHOTO.px) * unit;
        const px = ox + (PHOTO.x / PHOTO.px) * unit + (1 - arrive) * 8 * unit;
        const py = oy + (PHOTO.y / PHOTO.px - PHOTO.dy) * unit;
        ctx.globalAlpha = arrive;
        ctx.drawImage(photo, px, py, pw, ph);
        // The arm runs on past the cut-out's right edge to the frame's.
        const rightEdge = px + pw;
        if (rightEdge < W) {
          ctx.drawImage(photo, photo.naturalWidth - 2, 0, 2, photo.naturalHeight, rightEdge - 1, py, W - rightEdge + 1, ph);
        }
      }

      // Charge gathering at the human fingertip.
      if (charge > 0.01) {
        const tx = ox + TIP_R[0] * unit;
        const ty = oy + TIP_R[1] * unit;
        const r = unit * (1.5 + 2.5 * charge);
        const glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, r);
        glow.addColorStop(0, LOOK.accent);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.85 * charge;
        ctx.fillStyle = glow;
        ctx.fillRect(tx - r, ty - r, r * 2, r * 2);
      }

      const alphaOf = toneTable(LOOK.darkLevel, LOOK.midLevel);
      const sz = Math.max(1, Math.round(cell * LOOK.squareSize * dpr)) / dpr;
      const half = sz / 2;
      const bevW = Math.max(1, Math.round(sz * 0.14 * dpr)) / dpr;
      const bevel = new Path2D();
      const glowPad = Math.max(1 / dpr, cell * 0.12);
      const rate = SHIMMER.flicker / 100;
      const blueStep = sdt > 0 ? (sdt * 1000) / SHIMMER.fadeMs : 0;
      const slotCss = slot / dpr;
      const snap = (v: number) => Math.round(v * dpr) / dpr;
      let blueCount = 0;

      for (const c of cells) {
        const age = bt - (BUILD_DELAY + c.out * span + c.jitter * BUILD_JITTER);
        if (age < 0) continue;

        let cx = c.ax;
        let cy = c.ay;
        let prox = 0;
        if (pointerOn) {
          const ex = c.ax - pu;
          const ey = c.ay - pv;
          const d = Math.hypot(ex, ey);
          prox = smooth(rad, 0, d);
          if (repelK > 0 && prox > 0 && d > 1e-3) {
            const push = (repelK * prox * prox) / d;
            cx += ex * push;
            cy += ey * push;
          }
        }

        let wave = 0;
        for (const wv of waves) {
          const t = (now - wv.t) / 1000;
          const z = (Math.hypot(c.ax - wv.x, c.ay - wv.y) - t * WAVE_SPEED) / WAVE_WIDTH;
          const hit = Math.exp(-z * z) * (1 - t / WAVE_LIFE) * ripK;
          if (hit > 0.01) wave += hit;
        }

        if (rate > 0 && sdt > 0) {
          if (c.hold > 0) c.hold -= sdt * 1000;
          else if (rng() < rate * (1 + 6 * prox * lightK + 30 * wave) * sdt) {
            const set = SETS[c.level];
            if (c.tone >= 6 && rng() < 0.3) c.square = !c.square;
            else c.glyph = set[Math.floor(rng() * set.length)];
            c.hold = SHIMMER.holdMs;
          }
        }
        if (c.blue && sdt > 0) {
          c.life -= sdt * 1000;
          if (c.life <= 0) c.blue = false;
        }
        if (sdt > 0) c.blueAmt = c.blue ? Math.min(1, c.blueAmt + blueStep) : Math.max(0, c.blueAmt - blueStep);
        if (c.blue) blueCount++;

        const x = ox + cx * unit;
        const y = oy + cy * unit;
        if (x < -cell || x > W + cell || y < -cell || y > H + cell) continue;

        let band = 0;
        if (ampL > 0) {
          const z = (c.s - posL) / bw;
          band = ampL * Math.exp(-z * z);
        }
        let a = Math.min(1, alphaOf[c.tone] * (1 + SPARK.bandBoost * band) + 0.7 * lightK * prox + 0.6 * wave);
        let m = Math.max(c.blueAmt, band * SPARK.bandBlue, Math.min(1, wave) * 0.9);
        let glyph = c.glyph;
        let square = c.square;
        if (age < BUILD_FLASH) {
          const f = 1 - age / BUILD_FLASH;
          a = Math.max(a, f);
          m = Math.max(m, 0.6 * f);
          glyph = SETS[2][Math.floor(rng() * SETS[2].length)];
          square = false;
        }
        const aB = Math.max(a, c.blueAmt);

        if (square || c.blueAmt > 0.01) {
          const x0 = snap(x - half);
          const y0 = snap(y - half);
          if (LOOK.glow > 0 && c.level === 2 && m < 0.5) {
            ctx.globalAlpha = LOOK.glow * 0.6 * a * (1 - m);
            ctx.fillStyle = LOOK.glyphColor;
            ctx.fillRect(x0 - glowPad, y0 - glowPad, sz + glowPad * 2, sz + glowPad * 2);
          }
          if (m < 0.999) {
            ctx.globalAlpha = a * (1 - m);
            ctx.fillStyle = LOOK.glyphColor;
            ctx.fillRect(x0, y0, sz, sz);
          }
          if (m > 0.001) {
            ctx.globalAlpha = aB * m;
            ctx.fillStyle = LOOK.accent;
            ctx.fillRect(x0, y0, sz, sz);
          }
          bevel.rect(x0, y0 + sz - bevW, sz, bevW);
          bevel.rect(x0 + sz - bevW, y0, bevW, sz - bevW);
        } else if (atlas) {
          const dx = snap(x - slotCss / 2);
          const dy = snap(y - slotCss / 2);
          const sx = glyph * slot;
          if (m < 0.999) {
            ctx.globalAlpha = a * (1 - m);
            ctx.drawImage(atlas, sx, 0, slot, slot, dx, dy, slotCss, slotCss);
          }
          if (m > 0.001) {
            ctx.globalAlpha = a * m;
            ctx.drawImage(atlas, sx, slot, slot, slot, dx, dy, slotCss, slotCss);
          }
        }
      }

      if (LOOK.bevel > 0) {
        ctx.globalAlpha = LOOK.bevel;
        ctx.fillStyle = "#000000";
        ctx.fill(bevel);
      }

      // Keep the accent share steady: an expiring cell hands its colour on, shade first.
      if (cells.length) {
        const want = Math.round(cells.length * LOOK.accentAmount);
        let guard = 0;
        while (blueCount < want && guard++ < 60) {
          let c = cells[Math.floor(rng() * cells.length)];
          const c2 = cells[Math.floor(rng() * cells.length)];
          if (c2.tone < c.tone) c = c2;
          if (c.blue) continue;
          c.blue = true;
          c.life = SHIMMER.lifeMin + rng() * (SHIMMER.lifeMax - SHIMMER.lifeMin);
          if (sdt === 0) c.blueAmt = 1;
          blueCount++;
        }
        guard = 0;
        while (blueCount > want && guard++ < 60) {
          const c = cells[Math.floor(rng() * cells.length)];
          if (!c.blue) continue;
          c.blue = false;
          if (sdt === 0) c.blueAmt = 0;
          blueCount--;
        }
      }

      // The spark jumping the gap, human → code: a flash of light first,
      // so it reads even with text laid over the middle.
      const gt = cycT - C;
      const nGap = SPARK.gapCells;
      if (!reduce && !building && gt >= 0 && gt < SPARK.gapMs) {
        const f = 1 - gt / SPARK.gapMs;
        const gx = ox + ((TIP_R[0] + TIP_L[0]) / 2) * unit;
        const gy = oy + ((TIP_R[1] + TIP_L[1]) / 2) * unit;
        const r = unit * (4 + 6 * (1 - f));
        const flash = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
        flash.addColorStop(0, LOOK.accent);
        flash.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.55 * f;
        ctx.fillStyle = flash;
        ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
      }
      if (!reduce && !building && gt >= 0 && gt < nGap * SPARK.gapStaggerMs + SPARK.gapFadeMs + 60) {
        ctx.fillStyle = LOOK.accent;
        for (let g = 0; g < nGap; g++) {
          const tt = gt - g * SPARK.gapStaggerMs;
          if (tt < 0) continue;
          const inten = tt < 60 ? 1 : Math.max(0, 1 - (tt - 60) / SPARK.gapFadeMs);
          if (inten <= 0) continue;
          const f = (g + 1) / (nGap + 1);
          const gi = Math.floor((TIP_R[0] + (TIP_L[0] - TIP_R[0]) * f) / k);
          const gj = Math.floor((TIP_R[1] + (TIP_L[1] - TIP_R[1]) * f) / k);
          ctx.globalAlpha = inten;
          ctx.fillRect(snap(ox + (gi + 0.5) * cell - half), snap(oy + (gj + 0.5) * cell - half), sz, sz);
        }
      }

      if (LOOK.vignette > 0) {
        const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) / 2);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(1, `rgba(0,0,0,${Math.min(1, LOOK.vignette * 1.2)})`);
        ctx.globalAlpha = 1;
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", locate);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: LOOK.background }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
