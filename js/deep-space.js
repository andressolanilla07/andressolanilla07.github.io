/* ==========================================================================
   Deep Space Background — Canvas 2D Engine v2
   Spiral galaxy, constellations, depth-layered stars, spherical planets.
   Pure Canvas 2D — no Three.js.
   ========================================================================== */

// ── Simplex Noise (compact 2D) ────────────────────────────────────────────

const SimplexNoise = (() => {
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const GRAD = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];

  class SimplexNoise {
    constructor(seed) {
      const p = new Uint8Array(256);
      for (let i = 0; i < 256; i++) p[i] = i;
      let s = seed || (Math.random() * 2147483647) | 0;
      for (let i = 255; i > 0; i--) {
        s = (s * 48271) % 2147483647;
        const j = s % (i + 1);
        [p[i], p[j]] = [p[j], p[i]];
      }
      this.perm = new Uint8Array(512);
      this.mod8 = new Uint8Array(512);
      for (let i = 0; i < 512; i++) {
        this.perm[i] = p[i & 255];
        this.mod8[i] = this.perm[i] % 8;
      }
    }
    noise2D(x, y) {
      const s = (x + y) * F2;
      const i = Math.floor(x + s);
      const j = Math.floor(y + s);
      const t = (i + j) * G2;
      const x0 = x - (i - t);
      const y0 = y - (j - t);
      const i1 = x0 > y0 ? 1 : 0;
      const j1 = x0 > y0 ? 0 : 1;
      const x1 = x0 - i1 + G2;
      const y1 = y0 - j1 + G2;
      const x2 = x0 - 1 + 2 * G2;
      const y2 = y0 - 1 + 2 * G2;
      const ii = i & 255;
      const jj = j & 255;
      let n = 0;
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 > 0) { t0 *= t0; const g = GRAD[this.mod8[ii + this.perm[jj]]]; n += t0 * t0 * (g[0] * x0 + g[1] * y0); }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 > 0) { t1 *= t1; const g = GRAD[this.mod8[ii + i1 + this.perm[jj + j1]]]; n += t1 * t1 * (g[0] * x1 + g[1] * y1); }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 > 0) { t2 *= t2; const g = GRAD[this.mod8[ii + 1 + this.perm[jj + 1]]]; n += t2 * t2 * (g[0] * x2 + g[1] * y2); }
      return 70 * n;
    }
  }
  return SimplexNoise;
})();

// ── Color Palette ──────────────────────────────────────────────────────────

const C = {
  white:   [255, 255, 255],
  blue:    [180, 215, 255],
  warm:    [255, 230, 190],
  emerald: [0, 255, 136],
  teal:    [16, 185, 129],
  deep:    [5, 150, 105],
  gold:    [251, 191, 36],
  cyan:    [80, 220, 220],
  navy:    [10, 22, 40],
};

// ── Main Export ────────────────────────────────────────────────────────────

export function createBackground() {
  const hero = document.querySelector('.hero');
  if (!hero) return { destroy() {} };

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  hero.insertBefore(canvas, hero.firstChild);
  const ctx = canvas.getContext('2d');

  const isMobile = window.innerWidth < 768;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Sizing ─────────────────────────────────────────────────────────────
  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = hero.clientWidth * dpr;
    canvas.height = hero.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  const noise = new SimplexNoise(42);

  // ── Avatar position constants ──────────────────────────────────────────
  const AX = 0.5;
  const AY = 0.42;

  // ── Mouse parallax ─────────────────────────────────────────────────────
  let mX = 0.5, mY = 0.5, sX = 0.5, sY = 0.5;
  function onMouse(e) { mX = e.clientX / window.innerWidth; mY = e.clientY / window.innerHeight; }
  window.addEventListener('mousemove', onMouse, { passive: true });

  // ── Visibility ─────────────────────────────────────────────────────────
  let alive = true;
  let raf = null;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { if (!alive) { alive = true; tick(); } }
        else alive = false;
      }
    },
    { threshold: 0 }
  );
  observer.observe(hero);

  // ── Render Helper ──────────────────────────────────────────────────────
  function radial(x, y, r, color, opacity) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0,    `rgba(${color[0]},${color[1]},${color[2]},${opacity})`);
    g.addColorStop(0.3,  `rgba(${color[0]},${color[1]},${color[2]},${opacity * 0.45})`);
    g.addColorStop(0.65, `rgba(${color[0]},${color[1]},${color[2]},${opacity * 0.08})`);
    g.addColorStop(1,    `rgba(${color[0]},${color[1]},${color[2]},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // ── Star Field (3 depth layers) ────────────────────────────────────────
  function makeStars(count, extraBright) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      let color;
      if (r < 0.7) color = 'white';
      else if (r < 0.92) color = 'blue';
      else color = 'warm';
      arr.push({
        x: Math.random(),
        y: Math.random(),
        size: 0.3 + Math.random() * (extraBright ? 1.6 : 1.0),
        base: (extraBright ? 0.3 : 0.15) + Math.random() * 0.5,
        amp: extraBright ? 0.1 + Math.random() * 0.2 : 0.05 + Math.random() * 0.15,
        freq: 0.4 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
        color,
      });
    }
    return arr;
  }

  const starLayers = [
    { pxAmt: 4,  stars: makeStars(isMobile ? 150 : 400, false) },
    { pxAmt: 12, stars: makeStars(isMobile ? 80 : 200, false) },
    { pxAmt: 24, stars: makeStars(isMobile ? 20 : 45, true) },
  ];

  function drawStarLayer(layer, w, h) {
    const px = (sX - 0.5) * layer.pxAmt;
    const py = (sY - 0.5) * layer.pxAmt * 0.6;
    for (const s of layer.stars) {
      const tw = Math.sin(time * s.freq + s.phase);
      const op = Math.max(0.05, s.base + tw * s.amp);
      const x = s.x * w + px;
      const y = s.y * h + py;
      const c = C[s.color];
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${op})`;
      ctx.beginPath();
      ctx.arc(x, y, s.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Nebula — dark blue / cyan / restrained emerald ─────────────────────
  function makeNebula(count, palette, maxSz) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.pow(Math.random(), 0.4) * 0.45;
      arr.push({
        bx: 0.5 + Math.cos(a) * d,
        by: 0.42 + Math.sin(a) * d * 0.7,
        sz: 40 + Math.random() * maxSz,
        op: 0.03 + Math.random() * 0.06,
        nx: Math.random() * 1000,
        ny: Math.random() * 1000,
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }
    return arr;
  }

  const nebulaLayers = [
    { depth: 0.2, speed: 0.02,  particles: makeNebula(isMobile ? 15 : 30, ['navy', 'cyan'], 140) },
    { depth: 0.5, speed: 0.035, particles: makeNebula(isMobile ? 20 : 40, ['cyan', 'deep'], 120) },
    { depth: 0.8, speed: 0.05,  particles: makeNebula(isMobile ? 12 : 25, ['emerald', 'teal'], 100) },
  ];

  function drawNebula(layer, w, h) {
    const px = (sX - 0.5) * 30 * layer.depth;
    const py = (sY - 0.5) * 20 * layer.depth;
    for (const p of layer.particles) {
      const n1 = noise.noise2D(p.nx + time * layer.speed, p.ny);
      const n2 = noise.noise2D(p.nx + 100, p.ny + time * layer.speed);
      const x = p.bx * w + n1 * 60 + px;
      const y = p.by * h + n2 * 45 + py;
      const density = noise.noise2D(p.nx * 0.4, p.ny * 0.4) * 0.5 + 0.5;
      const dx = x - AX * w;
      const dy = y - AY * h;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxD = Math.min(w, h) * 0.6;
      const light = 1 - Math.min(dist / maxD, 1);
      const op = p.op * (0.4 + light * 0.6) * (0.6 + density * 0.4);
      const sz = p.sz * (0.8 + light * 0.2) * (0.85 + density * 0.15);
      radial(x, y, sz, C[p.color], op);
    }
  }

  // ── Spiral Galaxy — precomputed particles, rotation only ──────────────
  const galaxyAngle = Math.random() * Math.PI * 2;
  const galaxyScale = 0.3 + Math.random() * 0.08;
  const galaxyParticles = [];
  const galaxyArmCount = isMobile ? 80 : 600;
  for (let i = 0; i < galaxyArmCount; i++) {
    const armIndex = Math.floor(Math.random() * 4);
    const armAngleOffset = armIndex * Math.PI / 2 + (Math.random() - 0.5) * 0.25;
    const dist = 0.04 + Math.random() * 0.32;
    const spiralAngle = armAngleOffset + dist * 10 + (Math.random() - 0.5) * 0.2;
    const px = Math.cos(spiralAngle) * dist;
    const py = Math.sin(spiralAngle) * dist;
    const size = 0.3 + Math.random() * 0.8;
    const baseOp = (0.3 + Math.random() * 0.6) * Math.max(0, 1 - dist * 1.5);
    const isCore = dist < 0.08;
    galaxyParticles.push({ px, py, size, op: baseOp, isCore });
  }

  function drawGalaxy(w, h) {
    const cx = AX * w;
    const cy = AY * h;
    const maxR = Math.min(w, h) * galaxyScale;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.0008 + galaxyAngle);

    // Core glow
    const coreR = maxR * 0.12;
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
    core.addColorStop(0, `rgba(255,255,255,${isMobile ? 0.06 : 0.12})`);
    core.addColorStop(0.3, `rgba(180,215,255,${isMobile ? 0.04 : 0.07})`);
    core.addColorStop(0.7, `rgba(100,180,220,${isMobile ? 0.02 : 0.04})`);
    core.addColorStop(1, 'rgba(50,150,200,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, coreR, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow
    const outerR = maxR * 0.35;
    const outer = ctx.createRadialGradient(0, 0, coreR * 0.5, 0, 0, outerR);
    outer.addColorStop(0, `rgba(80,180,220,${isMobile ? 0.015 : 0.03})`);
    outer.addColorStop(0.5, `rgba(30,120,180,${isMobile ? 0.008 : 0.015})`);
    outer.addColorStop(1, 'rgba(10,60,120,0)');
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.fill();

    // Arm particles
    const yScale = 0.55;
    ctx.scale(1, yScale);
    for (const p of galaxyParticles) {
      const x = p.px * maxR;
      const y = p.py * maxR;
      const c = p.isCore ? C.white : C.blue;
      const op = p.op * (isMobile ? 0.4 : 0.7);
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${op})`;
      ctx.fillRect(x - p.size * 0.25, y - p.size * 0.25, p.size * 0.5, p.size * 0.5);
    }

    // A few warm core stars
    for (let i = 0; i < (isMobile ? 5 : 20); i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * 0.06;
      const x = Math.cos(a) * d * maxR;
      const y = Math.sin(a) * d * maxR;
      ctx.fillStyle = `rgba(255,230,190,${0.2 + Math.random() * 0.3})`;
      const sz = 0.5 + Math.random() * 0.8;
      ctx.fillRect(x - sz * 0.25, y - sz * 0.25, sz * 0.5, sz * 0.5);
    }

    ctx.restore();
  }

  // ── Constellations — 6 groups, outer periphery ────────────────────────
  function makeConstellationGroups() {
    const groups = [];
    const positions = [
      { bx: 0.12, by: 0.15 }, { bx: 0.88, by: 0.18 },
      { bx: 0.08, by: 0.55 }, { bx: 0.92, by: 0.50 },
      { bx: 0.20, by: 0.85 }, { bx: 0.80, by: 0.80 },
    ];
    for (let g = 0; g < positions.length; g++) {
      const count = 6 + Math.floor(Math.random() * 5);
      const stars = [];
      const { bx, by } = positions[g];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: bx + (Math.random() - 0.5) * 0.08,
          y: by + (Math.random() - 0.5) * 0.06,
          size: 0.6 + Math.random() * 0.8,
          op: 0.3 + Math.random() * 0.4,
        });
      }
      const lines = [];
      for (let i = 0; i < count - 1; i++) {
        lines.push([i, i + 1]);
      }
      groups.push({ stars, lines, driftX: (Math.random() - 0.5) * 0.003, driftY: (Math.random() - 0.5) * 0.003 });
    }
    return groups;
  }
  const constellationGroups = makeConstellationGroups();

  function drawConstellations(w, h) {
    ctx.save();
    for (const group of constellationGroups) {
      const dx = Math.sin(time * group.driftX) * 0.01;
      const dy = Math.cos(time * group.driftY) * 0.01;

      // Lines
      ctx.beginPath();
      for (const [i, j] of group.lines) {
        const s1 = group.stars[i];
        const s2 = group.stars[j];
        const x1 = (s1.x + dx) * w;
        const y1 = (s1.y + dy) * h;
        const x2 = (s2.x + dx) * w;
        const y2 = (s2.y + dy) * h;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.strokeStyle = `rgba(180,215,255,0.12)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Stars
      for (const s of group.stars) {
        const x = (s.x + dx) * w;
        const y = (s.y + dy) * h;
        ctx.fillStyle = `rgba(255,255,255,${s.op})`;
        ctx.beginPath();
        ctx.arc(x, y, s.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ── Planets — 2 small distant worlds, spherical shading ───────────────
  const PLANET_DATA = [
    { orbitR: 0.55, angle: 1.8, driftSpeed: 0.006, radius: 15, depth: 0.6, hue: 0.55 },
    { orbitR: 0.75, angle: 3.9, driftSpeed: 0.003, radius: 10, depth: 1.0, hue: 0.42 },
  ];

  function drawPlanets(w, h) {
    const cx = AX * w;
    const cy = AY * h;
    const safeR = Math.max(w * 0.18, h * 0.20);

    for (const p of PLANET_DATA) {
      const angle = p.angle + time * p.driftSpeed;
      const sx = Math.cos(angle) * p.orbitR * w * 0.5;
      const sy = Math.sin(angle) * p.orbitR * h * 0.55;
      const px = (sX - 0.5) * 25 * p.depth;
      const py = (sY - 0.5) * 15 * p.depth;
      const x = cx + sx + px;
      const y = cy + sy + py;

      if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < safeR) continue;

      const r = p.radius;
      const avatarDist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const illumination = Math.max(0, 1 - avatarDist / (Math.min(w, h) * 0.55));

      // Atmospheric glow
      radial(x, y, r * 1.5, C.blue, 0.035 * illumination);

      // Planet body with spherical shading
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();

      // Base color — cool blue-gray
      const baseBright = 40 + p.hue * 30;
      const baseRed = 20 + p.hue * 10;
      const baseGreen = 30 + p.hue * 20;
      const baseBlue = 50 + p.hue * 40;

      // Surface noise texture
      for (let i = 0; i < (isMobile ? 15 : 35); i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * r;
        const nx = x + Math.cos(a) * d;
        const ny = y + Math.sin(a) * d;
        const sz = 1.5 + Math.random() * 3;
        const variation = (Math.random() - 0.5) * 15;
        ctx.fillStyle = `rgba(${baseRed + variation},${baseGreen + variation},${baseBlue + variation},0.3)`;
        ctx.beginPath();
        ctx.arc(nx, ny, sz, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D sphere shading — bright on avatar-facing side, dark on opposite
      const lightDir = Math.atan2(cy - y, cx - x);
      const grad = ctx.createRadialGradient(
        x - Math.cos(lightDir) * r * 0.4,
        y - Math.sin(lightDir) * r * 0.4,
        0,
        x, y, r
      );
      const highlight = illumination * 0.5;
      grad.addColorStop(0, `rgba(${baseRed + 40},${baseGreen + 50},${baseBlue + 60},${highlight})`);
      grad.addColorStop(0.3, `rgba(${baseRed + 10},${baseGreen + 15},${baseBlue + 25},${0.3 + illumination * 0.2})`);
      grad.addColorStop(0.7, `rgba(${baseRed - 10},${baseGreen - 8},${baseBlue - 5},${0.2 + illumination * 0.1})`);
      grad.addColorStop(1, `rgba(2,3,6,${0.5 * (1 + 0.3 * (1 - illumination))})`);
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);

      // Thin rim light
      const rim = ctx.createRadialGradient(x, y, r * 0.8, x, y, r);
      rim.addColorStop(0, 'rgba(180,215,255,0)');
      rim.addColorStop(0.6, 'rgba(180,215,255,0)');
      rim.addColorStop(1, `rgba(180,215,255,${0.12 * illumination})`);
      ctx.fillStyle = rim;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);

      ctx.restore();
    }
  }

  // ── Shooting Stars — rare, fast, fading ───────────────────────────────
  const shootingStars = [];
  for (let i = 0; i < (isMobile ? 2 : 5); i++) {
    shootingStars.push({
      x: Math.random(),
      y: Math.random() * 0.4,
      angle: -0.4 + Math.random() * 0.3,
      speed: 0.3 + Math.random() * 0.5,
      length: 0.04 + Math.random() * 0.06,
      timer: Math.random() * 20,
      duration: 0.6 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      active: false,
      progress: 0,
    });
  }

  function drawShootingStars(w, h) {
    for (const s of shootingStars) {
      s.timer += 0.016;
      const cycle = 8 + Math.sin(s.phase) * 4;
      if (s.timer > cycle) {
        s.timer = 0;
        s.active = true;
        s.x = 0.3 + Math.random() * 0.4;
        s.y = 0.05 + Math.random() * 0.2;
        s.progress = 0;
      }
      if (!s.active) continue;

      s.progress += s.speed * 0.02;
      if (s.progress > 1) { s.active = false; continue; }

      const fade = 1 - s.progress;
      const headX = (s.x + Math.cos(s.angle) * s.progress * s.length * 10) * w;
      const headY = (s.y + Math.sin(s.angle) * s.progress * s.length * 10) * h;
      const tailX = (s.x + Math.cos(s.angle) * (s.progress - s.length) * 10) * w;
      const tailY = (s.y + Math.sin(s.angle) * (s.progress - s.length) * 10) * h;

      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = `rgba(255,255,255,${fade * 0.5})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = `rgba(255,255,255,${fade * 0.6})`;
      ctx.beginPath();
      ctx.arc(headX, headY, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Cosmic Dust ────────────────────────────────────────────────────────
  const dustParticles = (() => {
    const count = isMobile ? 60 : 150;
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random(), y: Math.random(),
        size: 0.3 + Math.random() * 0.6,
        op: 0.015 + Math.random() * 0.04,
        driftX: (Math.random() - 0.5) * 0.001,
        driftY: (Math.random() - 0.5) * 0.001,
      });
    }
    return arr;
  })();

  function drawDust(w, h) {
    for (const d of dustParticles) {
      const x = ((d.x + time * d.driftX) % 1 + 1) % 1 * w;
      const y = ((d.y + time * d.driftY) % 1 + 1) % 1 * h;
      ctx.fillStyle = `rgba(180,215,255,${d.op})`;
      ctx.fillRect(x, y, d.size, d.size);
    }
  }

  // ── Avatar Glow ────────────────────────────────────────────────────────
  function drawAvatarGlow(w, h) {
    const cx = AX * w;
    const cy = AY * h;
    const layers = [
      { r: 0.10, op: 0.10, c: C.blue },
      { r: 0.18, op: 0.07, c: C.emerald },
      { r: 0.28, op: 0.04, c: [0, 220, 140] },
      { r: 0.40, op: 0.02, c: [0, 180, 110] },
      { r: 0.58, op: 0.008, c: [0, 100, 70] },
    ];
    for (const l of layers) {
      const rad = Math.min(w, h) * l.r;
      radial(cx, cy, rad, l.c, l.op);
    }
  }

  // ── Gold Core Accents ──────────────────────────────────────────────────
  const goldAccents = [];
  for (let i = 0; i < (isMobile ? 3 : 5); i++) {
    const a = (i / (isMobile ? 3 : 5)) * Math.PI * 2 + Math.random() * 0.6;
    const d = 0.03 + Math.random() * 0.06;
    goldAccents.push({
      ox: Math.cos(a) * d, oy: Math.sin(a) * d * 0.7,
      sz: 40 + Math.random() * 60, op: 0.08 + Math.random() * 0.08,
      freq: 0.3 + Math.random() * 0.5, phase: Math.random() * Math.PI * 2,
    });
  }

  function drawGoldCore(w, h) {
    const cx = AX * w;
    const cy = AY * h;
    for (const g of goldAccents) {
      const pulse = 0.7 + 0.3 * Math.sin(time * g.freq + g.phase);
      radial(cx + g.ox * w, cy + g.oy * h, g.sz, C.gold, g.op * pulse);
    }
  }

  // ── Solar Flares ───────────────────────────────────────────────────────
  const solarFlares = [];
  for (let i = 0; i < (isMobile ? 4 : 8); i++) {
    solarFlares.push({
      angle: (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.35,
      length: 0.03 + Math.random() * 0.06, curl: (Math.random() - 0.5) * 0.6,
      width: 1 + Math.random() * 1.5,
      freq1: 0.12 + Math.random() * 0.2, freq2: 0.35 + Math.random() * 0.5,
      freq3: 1.0 + Math.random() * 1.8, phase: Math.random() * Math.PI * 2,
      gold: Math.random() < 0.3, delay: Math.random() * 6,
    });
  }

  function drawSolarFlares(w, h) {
    const cx = AX * w;
    const cy = AY * h;
    const r = Math.min(w, h) * 0.08;
    for (const f of solarFlares) {
      const t = time * 0.25 + f.delay;
      const raw = Math.sin(t * f.freq1 + f.phase) * 0.35
               + Math.sin(t * f.freq2 + f.phase * 1.3) * 0.35
               + Math.sin(t * f.freq3 + f.phase * 0.7) * 0.3;
      const alive = Math.max(0, raw * 2 - 0.35);
      if (alive < 0.01) continue;

      const maxLen = Math.min(w, h) * f.length;
      const cosA = Math.cos(f.angle);
      const sinA = Math.sin(f.angle);
      const curlOff = f.curl * maxLen;
      const sx = cx + r * cosA;
      const sy = cy + r * sinA;
      const ex = sx + cosA * maxLen - sinA * curlOff;
      const ey = sy + sinA * maxLen + cosA * curlOff;
      const cp1x = sx + cosA * maxLen * 0.35 - sinA * curlOff * 0.3;
      const cp1y = sy + sinA * maxLen * 0.35 + cosA * curlOff * 0.3;
      const cp2x = sx + cosA * maxLen * 0.65 - sinA * curlOff * 0.6;
      const cp2y = sy + sinA * maxLen * 0.65 + cosA * curlOff * 0.6;

      const baseOp = alive * 0.3;
      const color = f.gold ? C.gold : C.emerald;
      ctx.save();
      for (const [wMult, opMult] of [[2.5, 0.15], [1.0, 0.4], [0.35, 0.3]]) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
        ctx.lineWidth = f.width * wMult;
        ctx.strokeStyle = wMult > 1
          ? `rgba(${color[0]},${color[1]},${color[2]},${baseOp * opMult})`
          : `rgba(255,255,255,${baseOp * opMult})`;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawStatic() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    ctx.clearRect(0, 0, w, h);
    drawGalaxy(w, h); drawDust(w, h);
    drawAvatarGlow(w, h); drawGoldCore(w, h); drawSolarFlares(w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const L of nebulaLayers) {
      for (const p of L.particles) radial(p.bx * w, p.by * h, p.sz, C[p.color], p.op * 0.5);
    }
    for (const L of starLayers) {
      for (const s of L.stars) {
        ctx.fillStyle = `rgba(${C[s.color][0]},${C[s.color][1]},${C[s.color][2]},${s.base * 0.4})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    drawPlanets(w, h);
  }

  // ── Time (needs to be before drawStatic and tick) ─────────────────────
  let time = 0;

  // ── Reduced Motion → static frame ──────────────────────────────────────
  if (reducedMotion) {
    drawStatic();
    return {
      destroy() {
        observer.disconnect();
        window.removeEventListener('mousemove', onMouse);
        window.removeEventListener('resize', resize);
        canvas.remove();
      },
    };
  }

  function tick() {
    if (!alive) return;
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    sX += (mX - sX) * 0.02;
    sY += (mY - sY) * 0.02;
    ctx.clearRect(0, 0, w, h);

    // Layer order — back to front
    drawGalaxy(w, h);
    drawDust(w, h);
    drawAvatarGlow(w, h);
    drawGoldCore(w, h);
    drawSolarFlares(w, h);

    ctx.globalCompositeOperation = 'lighter';
    for (const L of nebulaLayers) drawNebula(L, w, h);
    for (const L of starLayers) drawStarLayer(L, w, h);
    ctx.globalCompositeOperation = 'source-over';

    drawConstellations(w, h);
    drawPlanets(w, h);
    drawShootingStars(w, h);

    time += 0.03;
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  tick();

  return {
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', resize);
      canvas.remove();
    },
  };
}
