/* ==========================================================================
   Deep Space Background - Canvas 2D Engine
   Deterministic cinematic scene with no per-frame random generation.
   ========================================================================== */

const TAU = Math.PI * 2;
const GALAXY_ROTATION_SECONDS = 138;
const MAX_DELTA_TIME = 0.05;

const COLORS = {
  white: [244, 249, 255],
  blueWhite: [184, 216, 255],
  cyan: [87, 210, 232],
  emerald: [45, 208, 157],
  warm: [255, 224, 174],
  navy: [12, 27, 52],
  blue: [31, 82, 142],
};

const CONSTELLATION_TEMPLATES = [
  {
    // Ursa Major
    points: [[0.04, 0.22], [0.23, 0.31], [0.42, 0.27], [0.56, 0.42], [0.72, 0.36], [0.86, 0.48], [0.96, 0.68]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  {
    // Cassiopeia
    points: [[0.03, 0.30], [0.25, 0.64], [0.48, 0.22], [0.72, 0.61], [0.96, 0.27]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    // Orion
    points: [[0.18, 0.06], [0.76, 0.12], [0.35, 0.40], [0.52, 0.43], [0.68, 0.47], [0.16, 0.92], [0.82, 0.94]],
    edges: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 1]],
  },
  {
    // Cygnus
    points: [[0.49, 0.02], [0.50, 0.28], [0.51, 0.53], [0.52, 0.96], [0.10, 0.48], [0.90, 0.54]],
    edges: [[0, 1], [1, 2], [2, 3], [4, 2], [2, 5]],
  },
  {
    // Scorpius
    points: [[0.05, 0.12], [0.22, 0.24], [0.35, 0.44], [0.50, 0.62], [0.68, 0.72], [0.83, 0.65], [0.93, 0.47], [0.98, 0.25]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]],
  },
  {
    // Lyra
    points: [[0.06, 0.06], [0.38, 0.30], [0.82, 0.25], [0.94, 0.78], [0.45, 0.91]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1]],
  },
];

function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function rgba(color, alpha) {
  return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
}

function createCanvasSprite(width, height, paint) {
  const sprite = document.createElement('canvas');
  sprite.width = width;
  sprite.height = height;
  const spriteContext = sprite.getContext('2d');
  paint(spriteContext, width, height);
  return sprite;
}

function createGlowSprite(colorStops) {
  return createCanvasSprite(256, 256, (spriteContext, width, height) => {
    const center = width * 0.5;
    const gradient = spriteContext.createRadialGradient(center, center, 0, center, center, center);
    for (let i = 0; i < colorStops.length; i++) {
      gradient.addColorStop(colorStops[i][0], colorStops[i][1]);
    }
    spriteContext.fillStyle = gradient;
    spriteContext.fillRect(0, 0, width, height);
  });
}

function createNebulaSprite(random, color, intensity) {
  return createCanvasSprite(384, 128, (spriteContext, width, height) => {
    const gradient = spriteContext.createRadialGradient(width * 0.48, height * 0.5, 5, width * 0.5, height * 0.5, width * 0.5);
    gradient.addColorStop(0, rgba(color, 0.12 * intensity));
    gradient.addColorStop(0.3, rgba(color, 0.075 * intensity));
    gradient.addColorStop(0.68, rgba(color, 0.022 * intensity));
    gradient.addColorStop(1, rgba(color, 0));
    spriteContext.fillStyle = gradient;
    spriteContext.fillRect(0, 0, width, height);

    spriteContext.lineCap = 'round';
    for (let i = 0; i < 11; i++) {
      const y = height * (0.16 + random() * 0.68);
      spriteContext.beginPath();
      spriteContext.moveTo(width * 0.08, y);
      spriteContext.bezierCurveTo(
        width * 0.28,
        y + (random() - 0.5) * 34,
        width * 0.68,
        y + (random() - 0.5) * 42,
        width * 0.92,
        y + (random() - 0.5) * 22
      );
      spriteContext.strokeStyle = rgba(color, (0.025 + random() * 0.032) * intensity);
      spriteContext.lineWidth = 3 + random() * 10;
      spriteContext.stroke();
    }
  });
}

function createPlanetSprite(random, palette) {
  return createCanvasSprite(128, 128, (spriteContext, width, height) => {
    const center = width * 0.5;
    const radius = 48;

    const atmosphere = spriteContext.createRadialGradient(center, center, radius * 0.72, center, center, radius * 1.2);
    atmosphere.addColorStop(0.62, rgba(palette.rim, 0));
    atmosphere.addColorStop(0.82, rgba(palette.rim, 0.2));
    atmosphere.addColorStop(1, rgba(palette.rim, 0));
    spriteContext.fillStyle = atmosphere;
    spriteContext.fillRect(0, 0, width, height);

    if (palette.ring) {
      spriteContext.save();
      spriteContext.translate(center, center);
      spriteContext.rotate(-0.24);
      spriteContext.strokeStyle = rgba(palette.ring, 0.22);
      spriteContext.lineWidth = 4;
      spriteContext.beginPath();
      spriteContext.ellipse(0, 0, radius * 1.36, radius * 0.35, 0, 0, TAU);
      spriteContext.stroke();
      spriteContext.strokeStyle = rgba(palette.rim, 0.3);
      spriteContext.lineWidth = 1;
      spriteContext.stroke();
      spriteContext.restore();
    }

    spriteContext.save();
    spriteContext.beginPath();
    spriteContext.arc(center, center, radius, 0, TAU);
    spriteContext.clip();
    spriteContext.fillStyle = rgba(palette.base, 1);
    spriteContext.fillRect(center - radius, center - radius, radius * 2, radius * 2);

    for (let i = 0; i < 30; i++) {
      const angle = random() * TAU;
      const distance = Math.sqrt(random()) * radius * 0.9;
      const detailRadius = 1.2 + random() * 4.5;
      spriteContext.fillStyle = rgba(random() > 0.45 ? palette.detail : palette.shadow, 0.12 + random() * 0.12);
      spriteContext.beginPath();
      spriteContext.arc(
        center + Math.cos(angle) * distance,
        center + Math.sin(angle) * distance,
        detailRadius,
        0,
        TAU
      );
      spriteContext.fill();
    }

    const sphereLight = spriteContext.createRadialGradient(center - 20, center - 16, 2, center, center, radius * 1.06);
    sphereLight.addColorStop(0, rgba(palette.light, 0.95));
    sphereLight.addColorStop(0.38, rgba(palette.light, 0.3));
    sphereLight.addColorStop(0.68, rgba(palette.shadow, 0.28));
    sphereLight.addColorStop(0.86, 'rgba(2,5,12,0.72)');
    sphereLight.addColorStop(1, 'rgba(0,1,5,0.96)');
    spriteContext.fillStyle = sphereLight;
    spriteContext.fillRect(center - radius, center - radius, radius * 2, radius * 2);

    const terminator = spriteContext.createLinearGradient(center - radius, center, center + radius, center);
    terminator.addColorStop(0, 'rgba(0,0,0,0)');
    terminator.addColorStop(0.43, 'rgba(0,0,0,0.03)');
    terminator.addColorStop(0.65, 'rgba(0,1,5,0.38)');
    terminator.addColorStop(1, 'rgba(0,1,5,0.86)');
    spriteContext.fillStyle = terminator;
    spriteContext.fillRect(center - radius, center - radius, radius * 2, radius * 2);
    spriteContext.restore();

    spriteContext.strokeStyle = rgba(palette.rim, 0.42);
    spriteContext.lineWidth = 1.35;
    spriteContext.beginPath();
    spriteContext.arc(center, center, radius + 0.5, Math.PI * 0.55, Math.PI * 1.45);
    spriteContext.stroke();
  });
}

export function createBackground() {
  const hero = document.querySelector('.hero');
  if (!hero) return { destroy() {} };

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;';
  hero.insertBefore(canvas, hero.firstChild);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    canvas.remove();
    return { destroy() {} };
  }

  const random = createRandom(0xA17D5EED);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;
  const avatar = hero.querySelector('.hero__avatar-wrapper');

  let width = 1;
  let height = 1;
  let centerX = 0.5;
  let centerY = 0.4;
  let time = 0;
  let lastTimestamp = 0;
  let rafId = 0;
  let inViewport = true;
  let destroyed = false;
  let targetParallaxX = 0;
  let targetParallaxY = 0;
  let parallaxX = 0;
  let parallaxY = 0;

  const galaxyArmGroups = {
    blueWhite: [],
    white: [],
    warm: [],
    cyan: [],
    emerald: [],
  };
  const galaxyCoreGroups = { white: [], warm: [], blueWhite: [] };
  const galaxyHaloGroups = { blueWhite: [], cyan: [], white: [] };
  const galaxyKnots = [];
  const armSpinePaths = [];
  const dustLanePaths = [];

  function chooseStarColor(chance) {
    if (chance < 0.58) return 'white';
    if (chance < 0.95) return 'blueWhite';
    if (chance < 0.975) return 'warm';
    return 'emerald';
  }

  function createStars(count, depth) {
    const stars = new Array(count);
    for (let i = 0; i < count; i++) {
      const colorName = chooseStarColor(random());
      const near = depth === 2;
      const middle = depth === 1;
      let x = random();
      let y = random();
      if (random() < 0.34) {
        const angle = random() * TAU;
        const radius = 0.08 + Math.sqrt(random()) * 0.46;
        x = Math.max(0.015, Math.min(0.985, 0.5 + Math.cos(angle) * radius));
        y = Math.max(0.015, Math.min(0.985, 0.4 + Math.sin(angle) * radius * 0.62));
      }
      stars[i] = {
        x,
        y,
        size: near ? 0.9 + random() * 1.15 : middle ? 0.55 + random() * 0.7 : 0.3 + random() * 0.42,
        opacity: near ? 0.48 + random() * 0.38 : middle ? 0.3 + random() * 0.38 : 0.12 + random() * 0.25,
        twinkle: near ? 0.08 + random() * 0.13 : middle ? 0.06 + random() * 0.1 : 0.025 + random() * 0.05,
        frequency: 0.35 + random() * (near ? 1.25 : 0.75),
        phase: random() * TAU,
        color: rgba(COLORS[colorName], 1),
        glint: near && random() < 0.18,
      };
    }
    return stars;
  }

  const starLayers = [
    { stars: createStars(isMobile ? 280 : 680, 0), parallax: 3.5 },
    { stars: createStars(isMobile ? 125 : 300, 1), parallax: 9 },
    { stars: createStars(isMobile ? 18 : 46, 2), parallax: 17 },
  ];

  function createGalaxy() {
    const totalCount = isMobile ? 1800 : 6200;
    const coreCount = Math.round(totalCount * 0.25);
    const armCount = Math.round(totalCount * 0.5);
    const haloCount = totalCount - coreCount - armCount;
    const spiralTightness = 5.35;

    for (let i = 0; i < armCount; i++) {
      const arm = i % 4;
      const radialNoise = (random() + random() + random() - 1.5) * 0.035;
      const normalizedRadius = Math.max(0.08, Math.min(1, 0.09 + Math.pow(random(), 0.82) * 0.91 + radialNoise));
      const bandChance = random();
      const bandSpread = bandChance < 0.24
        ? 0.035 + normalizedRadius * 0.055
        : bandChance < 0.8
          ? 0.075 + normalizedRadius * 0.14
          : 0.14 + normalizedRadius * 0.23;
      const bandOffset = bandChance < 0.24 ? -0.055 : bandChance < 0.8 ? 0 : 0.045;
      const gaussianSpread = (random() + random() + random() + random() - 2) * bandSpread;
      const angle = arm * (TAU / 4) + normalizedRadius * spiralTightness + bandOffset + gaussianSpread;
      const colorChance = random();
      let colorName = 'blueWhite';
      if (colorChance < 0.16) colorName = 'white';
      else if (colorChance > 0.82 && colorChance < 0.96) colorName = 'cyan';
      else if (colorChance >= 0.96) colorName = 'emerald';
      if (normalizedRadius < 0.22 && colorChance < 0.22) colorName = 'warm';

      const outerFade = 1 - Math.max(0, normalizedRadius - 0.78) / 0.22;
      const haze = bandChance >= 0.8;
      galaxyArmGroups[colorName].push({
        cos: Math.cos(angle),
        sin: Math.sin(angle),
        radius: normalizedRadius,
        size: 0.4 + random() * (bandChance < 0.24 ? 0.95 : 0.72),
        opacity: (haze ? 0.12 + random() * 0.24 : 0.3 + random() * 0.52) * (0.54 + outerFade * 0.46),
      });

      if (!haze && random() < 0.028) {
        galaxyKnots.push({
          cos: Math.cos(angle),
          sin: Math.sin(angle),
          radius: normalizedRadius,
          size: 1.25 + random() * 1.1,
          opacity: 0.45 + random() * 0.4,
          color: rgba(colorName === 'emerald' ? COLORS.cyan : COLORS[colorName], 1),
        });
      }
    }

    for (let i = 0; i < coreCount; i++) {
      const radius = Math.pow(random(), 2.15) * 0.3;
      const angle = random() * TAU;
      const colorChance = random();
      const colorName = colorChance < 0.42 ? 'warm' : colorChance < 0.78 ? 'white' : 'blueWhite';
      galaxyCoreGroups[colorName].push({
        cos: Math.cos(angle),
        sin: Math.sin(angle),
        radius,
        size: 0.45 + random() * 1.05,
        opacity: 0.32 + random() * 0.55,
      });
    }

    for (let i = 0; i < haloCount; i++) {
      const radius = 0.16 + Math.pow(random(), 0.72) * 0.9;
      const angle = random() * TAU;
      const colorChance = random();
      const colorName = colorChance < 0.72 ? 'blueWhite' : colorChance < 0.93 ? 'cyan' : 'white';
      galaxyHaloGroups[colorName].push({
        cos: Math.cos(angle),
        sin: Math.sin(angle),
        radius,
        size: 0.3 + random() * 0.5,
        opacity: (0.055 + random() * 0.14) * Math.max(0.2, 1.12 - radius),
      });
    }

    for (let arm = 0; arm < 4; arm++) {
      const spinePoints = new Array(52);
      const points = new Array(46);
      for (let i = 0; i < spinePoints.length; i++) {
        const radius = 0.1 + i / (spinePoints.length - 1) * 0.9;
        const angle = arm * (TAU / 4) + radius * spiralTightness + Math.sin(radius * 9 + arm * 0.7) * 0.012;
        spinePoints[i] = { cos: Math.cos(angle), sin: Math.sin(angle), radius };
      }
      for (let i = 0; i < points.length; i++) {
        const radius = 0.12 + i / (points.length - 1) * 0.88;
        const angle = arm * (TAU / 4) + radius * spiralTightness + 0.115 + Math.sin(radius * 8 + arm) * 0.018;
        points[i] = { cos: Math.cos(angle), sin: Math.sin(angle), radius };
      }
      armSpinePaths.push(spinePoints);
      dustLanePaths.push(points);
    }
  }
  createGalaxy();

  const dustParticles = new Array(isMobile ? 65 : 180);
  for (let i = 0; i < dustParticles.length; i++) {
    dustParticles[i] = {
      x: random(),
      y: random(),
      size: 0.25 + random() * 0.45,
      opacity: 0.035 + random() * 0.075,
      speedX: (random() - 0.5) * 0.0008,
      speedY: (random() - 0.5) * 0.00055,
    };
  }

  const nebulaDefinitions = [
    { x: 0.07, y: 0.23, sx: 0.38, sy: 0.17, rotation: -0.2, color: COLORS.navy, intensity: 1, depth: 0.25, phase: 0.2 },
    { x: 0.93, y: 0.22, sx: 0.37, sy: 0.16, rotation: 0.25, color: COLORS.blue, intensity: 0.84, depth: 0.3, phase: 1.4 },
    { x: 0.04, y: 0.7, sx: 0.34, sy: 0.14, rotation: 0.15, color: COLORS.blue, intensity: 0.7, depth: 0.4, phase: 2.2 },
    { x: 0.96, y: 0.66, sx: 0.36, sy: 0.14, rotation: -0.28, color: COLORS.navy, intensity: 0.96, depth: 0.25, phase: 3.1 },
    { x: 0.2, y: 0.09, sx: 0.27, sy: 0.1, rotation: 0.08, color: COLORS.cyan, intensity: 0.44, depth: 0.55, phase: 4.3 },
    { x: 0.85, y: 0.49, sx: 0.28, sy: 0.11, rotation: -0.1, color: COLORS.cyan, intensity: 0.4, depth: 0.6, phase: 5.1 },
    { x: 0.13, y: 0.5, sx: 0.23, sy: 0.09, rotation: 0.3, color: COLORS.emerald, intensity: 0.18, depth: 0.65, phase: 5.8 },
    { x: 0.79, y: 0.82, sx: 0.28, sy: 0.1, rotation: 0.18, color: COLORS.blue, intensity: 0.5, depth: 0.4, phase: 0.8 },
  ];

  const nebulae = new Array(isMobile ? 5 : nebulaDefinitions.length);
  for (let i = 0; i < nebulae.length; i++) {
    const definition = nebulaDefinitions[i];
    nebulae[i] = {
      x: definition.x,
      y: definition.y,
      scaleX: definition.sx,
      scaleY: definition.sy,
      rotation: definition.rotation,
      depth: definition.depth,
      phase: definition.phase,
      sprite: createNebulaSprite(random, definition.color, definition.intensity),
    };
  }

  const galaxyHaloSprite = createGlowSprite([
    [0, 'rgba(191,224,255,0.085)'],
    [0.2, 'rgba(90,187,224,0.055)'],
    [0.48, 'rgba(43,116,166,0.03)'],
    [0.78, 'rgba(21,76,112,0.014)'],
    [1, 'rgba(5,20,35,0)'],
  ]);

  const galaxyCoreSprite = createGlowSprite([
    [0, 'rgba(255,255,250,0.88)'],
    [0.12, 'rgba(255,248,224,0.74)'],
    [0.32, 'rgba(255,222,166,0.44)'],
    [0.54, 'rgba(225,231,232,0.21)'],
    [0.73, 'rgba(95,199,226,0.075)'],
    [0.88, 'rgba(44,181,147,0.018)'],
    [1, 'rgba(20,58,100,0)'],
  ]);

  const avatarGlowSprite = createGlowSprite([
    [0, 'rgba(255,254,242,0.28)'],
    [0.25, 'rgba(255,241,210,0.2)'],
    [0.52, 'rgba(255,218,164,0.11)'],
    [0.7, 'rgba(190,224,255,0.045)'],
    [0.88, 'rgba(80,199,225,0.012)'],
    [1, 'rgba(5,20,35,0)'],
  ]);

  const constellationPlacements = [
    { x: 0.035, y: 0.15, width: 0.16, height: 0.09, drift: 4.2, phase: 0.4, parallax: 4.2 },
    { x: 0.805, y: 0.14, width: 0.15, height: 0.09, drift: 3.6, phase: 1.6, parallax: 5 },
    { x: 0.035, y: 0.4, width: 0.13, height: 0.16, drift: 5, phase: 2.7, parallax: 5.8 },
    { x: 0.84, y: 0.4, width: 0.12, height: 0.16, drift: 3.8, phase: 3.8, parallax: 5.3 },
    { x: 0.055, y: 0.75, width: 0.15, height: 0.11, drift: 4.5, phase: 4.9, parallax: 4.6 },
    { x: 0.81, y: 0.74, width: 0.14, height: 0.11, drift: 4, phase: 5.7, parallax: 5.5 },
  ];

  const constellations = new Array(CONSTELLATION_TEMPLATES.length);
  for (let i = 0; i < constellations.length; i++) {
    const template = CONSTELLATION_TEMPLATES[i];
    const placement = constellationPlacements[i];
    const stars = new Array(template.points.length);
    for (let j = 0; j < template.points.length; j++) {
      stars[j] = {
        x: template.points[j][0],
        y: template.points[j][1],
        size: 1.05 + random() * 0.75,
        opacity: 0.62 + random() * 0.23,
        anchor: j === 0 || j === Math.floor(template.points.length * 0.5),
      };
    }
    constellations[i] = {
      stars,
      edges: template.edges,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      drift: placement.drift,
      phase: placement.phase,
      parallax: placement.parallax,
      lineOpacity: 0.22 + random() * 0.08,
    };
  }

  const planetDefinitions = [
    {
      x: isMobile ? 0.82 : 0.88,
      y: isMobile ? 0.22 : 0.27,
      radius: isMobile ? 10 : 16,
      orbitX: 7,
      orbitY: 4,
      period: 148,
      phase: 0.6,
      palette: { base: [42, 62, 83], detail: [80, 112, 137], shadow: [14, 24, 39], light: [150, 185, 208], rim: [126, 221, 235], ring: [102, 165, 191] },
    },
    {
      x: 0.12,
      y: 0.67,
      radius: 12,
      orbitX: 5,
      orbitY: 7,
      period: 188,
      phase: 2.4,
      palette: { base: [38, 54, 66], detail: [65, 103, 111], shadow: [15, 24, 30], light: [143, 190, 196], rim: [104, 205, 189] },
    },
  ];

  const planetCount = isMobile ? 1 : 2;
  const planets = new Array(planetCount);
  for (let i = 0; i < planetCount; i++) {
    const definition = planetDefinitions[i];
    planets[i] = {
      x: definition.x,
      y: definition.y,
      radius: definition.radius,
      orbitX: definition.orbitX,
      orbitY: definition.orbitY,
      period: definition.period,
      phase: definition.phase,
      sprite: createPlanetSprite(random, definition.palette),
    };
  }

  const shootingStars = new Array(isMobile ? 3 : 5);
  for (let i = 0; i < shootingStars.length; i++) {
    const angle = 0.42 + random() * 0.2;
    shootingStars[i] = {
      startX: 0.18 + random() * 0.55,
      startY: 0.04 + random() * 0.2,
      directionX: Math.cos(angle),
      directionY: Math.sin(angle),
      distance: 0.16 + random() * 0.11,
      tail: 0.045 + random() * 0.035,
      duration: 0.7 + random() * 0.45,
      interval: 8 + random() * 7,
      progress: 0,
      active: false,
    };
  }
  let shootingStarIndex = 0;
  let shootingStarDelay = shootingStars[0].interval;

  function updateMetrics() {
    width = Math.max(1, hero.clientWidth);
    height = Math.max(1, hero.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (avatar) {
      const heroRect = hero.getBoundingClientRect();
      const avatarRect = avatar.getBoundingClientRect();
      centerX = (avatarRect.left + avatarRect.width * 0.5 - heroRect.left) / width;
      centerY = (avatarRect.top + avatarRect.height * 0.5 - heroRect.top) / height;
    }
  }

  function drawStars(layer, staticFrame) {
    const offsetX = staticFrame ? 0 : parallaxX * layer.parallax;
    const offsetY = staticFrame ? 0 : parallaxY * layer.parallax * 0.65;
    const stars = layer.stars;
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      const twinkle = staticFrame ? 0 : Math.sin(time * star.frequency + star.phase) * star.twinkle;
      context.globalAlpha = Math.max(0.05, star.opacity + twinkle);
      context.fillStyle = star.color;
      const x = star.x * width + offsetX;
      const y = star.y * height + offsetY;
      context.fillRect(x - star.size * 0.5, y - star.size * 0.5, star.size, star.size);
      if (star.glint) {
        context.globalAlpha *= 0.35;
        context.fillRect(x - star.size * 2.2, y - 0.3, star.size * 4.4, 0.6);
        context.fillRect(x - 0.3, y - star.size * 2.2, 0.6, star.size * 4.4);
      }
    }
    context.globalAlpha = 1;
  }

  function drawNebula(staticFrame) {
    context.save();
    context.globalCompositeOperation = 'screen';
    for (let i = 0; i < nebulae.length; i++) {
      const nebula = nebulae[i];
      const driftX = staticFrame ? 0 : Math.sin(time * 0.032 + nebula.phase) * 5;
      const driftY = staticFrame ? 0 : Math.cos(time * 0.026 + nebula.phase) * 3.5;
      const x = nebula.x * width + driftX + parallaxX * nebula.depth * 3;
      const y = nebula.y * height + driftY + parallaxY * nebula.depth * 2;
      const drawWidth = width * nebula.scaleX;
      const drawHeight = height * nebula.scaleY;
      context.save();
      context.translate(x, y);
      context.rotate(nebula.rotation);
      context.drawImage(nebula.sprite, -drawWidth * 0.5, -drawHeight * 0.5, drawWidth, drawHeight);
      context.restore();
    }
    context.restore();
  }

  function drawGalaxyGroup(group, galaxyRadius, compression, color) {
    context.fillStyle = color;
    for (let i = 0; i < group.length; i++) {
      const particle = group[i];
      const radius = particle.radius * galaxyRadius;
      const x = particle.cos * radius;
      const y = particle.sin * radius * compression;
      context.globalAlpha = particle.opacity;
      context.fillRect(x - particle.size * 0.5, y - particle.size * 0.5, particle.size, particle.size);
    }
  }

  function drawDustLanes(galaxyRadius, compression) {
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (let i = 0; i < dustLanePaths.length; i++) {
      const path = dustLanePaths[i];
      context.beginPath();
      for (let j = 0; j < path.length; j++) {
        const point = path[j];
        const radius = point.radius * galaxyRadius;
        const x = point.cos * radius;
        const y = point.sin * radius * compression;
        if (j === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = 'rgba(0,4,13,0.24)';
      context.lineWidth = Math.max(4, galaxyRadius * 0.034);
      context.stroke();
      context.strokeStyle = 'rgba(2,10,22,0.31)';
      context.lineWidth = Math.max(1.5, galaxyRadius * 0.012);
      context.stroke();
    }
  }

  function drawArmSpines(galaxyRadius, compression) {
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (let i = 0; i < armSpinePaths.length; i++) {
      const path = armSpinePaths[i];
      context.beginPath();
      for (let j = 0; j < path.length; j++) {
        const point = path[j];
        const radius = point.radius * galaxyRadius;
        const x = point.cos * radius;
        const y = point.sin * radius * compression;
        if (j === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = 'rgba(33,103,158,0.08)';
      context.lineWidth = Math.max(10, galaxyRadius * 0.075);
      context.stroke();
      context.strokeStyle = 'rgba(77,181,218,0.11)';
      context.lineWidth = Math.max(5, galaxyRadius * 0.036);
      context.stroke();
      context.strokeStyle = 'rgba(193,226,255,0.15)';
      context.lineWidth = Math.max(1.2, galaxyRadius * 0.009);
      context.stroke();
    }
  }

  function drawGalaxy(staticFrame) {
    const galaxyRadius = Math.min(width, height) * (isMobile ? 0.48 : 0.5);
    const compression = isMobile ? 0.62 : 0.58;
    const cx = centerX * width + (staticFrame ? 0 : parallaxX * 3.2);
    const cy = centerY * height + (staticFrame ? 0 : parallaxY * 2);
    const rotation = 0.34 + (staticFrame ? 0 : time * TAU / GALAXY_ROTATION_SECONDS);

    context.save();
    context.translate(cx, cy);
    context.rotate(rotation);

    const haloWidth = galaxyRadius * 2.2;
    const haloHeight = haloWidth * compression;
    context.drawImage(galaxyHaloSprite, -haloWidth * 0.5, -haloHeight * 0.5, haloWidth, haloHeight);
    drawGalaxyGroup(galaxyHaloGroups.blueWhite, galaxyRadius, compression, rgba(COLORS.blueWhite, 1));
    drawGalaxyGroup(galaxyHaloGroups.cyan, galaxyRadius, compression, rgba(COLORS.cyan, 1));
    drawGalaxyGroup(galaxyHaloGroups.white, galaxyRadius, compression, rgba(COLORS.white, 1));

    drawDustLanes(galaxyRadius, compression);
    drawArmSpines(galaxyRadius, compression);

    drawGalaxyGroup(galaxyArmGroups.blueWhite, galaxyRadius, compression, rgba(COLORS.blueWhite, 1));
    drawGalaxyGroup(galaxyArmGroups.white, galaxyRadius, compression, rgba(COLORS.white, 1));
    drawGalaxyGroup(galaxyArmGroups.warm, galaxyRadius, compression, rgba(COLORS.warm, 1));
    drawGalaxyGroup(galaxyArmGroups.cyan, galaxyRadius, compression, rgba(COLORS.cyan, 1));
    drawGalaxyGroup(galaxyArmGroups.emerald, galaxyRadius, compression, rgba(COLORS.emerald, 1));

    for (let i = 0; i < galaxyKnots.length; i++) {
      const knot = galaxyKnots[i];
      const radius = knot.radius * galaxyRadius;
      const x = knot.cos * radius;
      const y = knot.sin * radius * compression;
      context.globalAlpha = knot.opacity;
      context.fillStyle = knot.color;
      context.fillRect(x - knot.size * 0.5, y - knot.size * 0.5, knot.size, knot.size);
      context.globalAlpha = knot.opacity * 0.22;
      context.fillRect(x - knot.size * 1.5, y - 0.3, knot.size * 3, 0.6);
    }

    const coreSize = galaxyRadius * 0.98;
    const coreHeight = coreSize * (isMobile ? 0.82 : 0.78);
    context.globalAlpha = 0.94;
    context.drawImage(galaxyCoreSprite, -coreSize * 0.5, -coreHeight * 0.5, coreSize, coreHeight);
    context.globalAlpha = 1;
    drawGalaxyGroup(galaxyCoreGroups.blueWhite, galaxyRadius, compression, rgba(COLORS.blueWhite, 1));
    drawGalaxyGroup(galaxyCoreGroups.white, galaxyRadius, compression, rgba(COLORS.white, 1));
    drawGalaxyGroup(galaxyCoreGroups.warm, galaxyRadius, compression, rgba(COLORS.warm, 1));

    const nucleusWidth = Math.max(2.5, galaxyRadius * 0.018);
    context.fillStyle = 'rgba(255,250,226,0.72)';
    context.beginPath();
    context.arc(0, 0, nucleusWidth, 0, TAU);
    context.fill();
    context.globalAlpha = 1;
    context.restore();

    const glowRadius = Math.min(width, height) * (isMobile ? 0.22 : 0.24);
    context.globalAlpha = 0.52;
    context.drawImage(
      avatarGlowSprite,
      centerX * width - glowRadius,
      centerY * height - glowRadius,
      glowRadius * 2,
      glowRadius * 2
    );
    context.globalAlpha = 1;

    context.fillStyle = rgba(COLORS.blueWhite, 1);
    for (let i = 0; i < dustParticles.length; i++) {
      const dust = dustParticles[i];
      const driftX = staticFrame ? 0 : time * dust.speedX;
      const driftY = staticFrame ? 0 : time * dust.speedY;
      const x = (((dust.x + driftX) % 1) + 1) % 1 * width;
      const y = (((dust.y + driftY) % 1) + 1) % 1 * height;
      context.globalAlpha = dust.opacity;
      context.fillRect(x, y, dust.size, dust.size);
    }
    context.globalAlpha = 1;
  }

  function drawConstellations(staticFrame) {
    for (let i = 0; i < constellations.length; i++) {
      const constellation = constellations[i];
      const driftX = staticFrame ? 0 : Math.sin(time * 0.045 + constellation.phase) * constellation.drift;
      const driftY = staticFrame ? 0 : Math.cos(time * 0.037 + constellation.phase) * constellation.drift * 0.7;
      const baseX = constellation.x * width + driftX + parallaxX * constellation.parallax;
      const baseY = constellation.y * height + driftY + parallaxY * constellation.parallax * 0.65;
      const constellationWidth = constellation.width * width;
      const constellationHeight = constellation.height * height;

      context.beginPath();
      for (let j = 0; j < constellation.edges.length; j++) {
        const edge = constellation.edges[j];
        const start = constellation.stars[edge[0]];
        const end = constellation.stars[edge[1]];
        context.moveTo(baseX + start.x * constellationWidth, baseY + start.y * constellationHeight);
        context.lineTo(baseX + end.x * constellationWidth, baseY + end.y * constellationHeight);
      }
      context.strokeStyle = rgba(COLORS.blueWhite, constellation.lineOpacity);
      context.lineWidth = isMobile ? 0.6 : 0.75;
      context.stroke();

      context.fillStyle = rgba(COLORS.white, 1);
      for (let j = 0; j < constellation.stars.length; j++) {
        const star = constellation.stars[j];
        const x = baseX + star.x * constellationWidth;
        const y = baseY + star.y * constellationHeight;
        if (star.anchor) {
          context.globalAlpha = star.opacity * 0.2;
          context.fillStyle = rgba(COLORS.blueWhite, 1);
          context.fillRect(x - star.size * 2.1, y - 0.35, star.size * 4.2, 0.7);
          context.fillRect(x - 0.35, y - star.size * 2.1, 0.7, star.size * 4.2);
        }
        context.globalAlpha = star.opacity;
        context.fillStyle = rgba(COLORS.white, 1);
        context.fillRect(x - star.size * 0.5, y - star.size * 0.5, star.size, star.size);
      }
      context.globalAlpha = 1;
    }
  }

  function drawPlanets(staticFrame) {
    const avatarX = centerX * width;
    const avatarY = centerY * height;
    for (let i = 0; i < planets.length; i++) {
      const planet = planets[i];
      const orbitAngle = planet.phase + (staticFrame ? 0 : time * TAU / planet.period);
      const x = planet.x * width + Math.cos(orbitAngle) * planet.orbitX + parallaxX * 8;
      const y = planet.y * height + Math.sin(orbitAngle) * planet.orbitY + parallaxY * 5;
      const lightAngle = Math.atan2(avatarY - y, avatarX - x) - Math.PI;
      const size = planet.radius * 2.7;

      context.save();
      context.translate(x, y);
      context.rotate(lightAngle);
      context.drawImage(planet.sprite, -size * 0.5, -size * 0.5, size, size);
      context.restore();
    }
  }

  function updateShootingStars(deltaTime) {
    let active = false;
    for (let i = 0; i < shootingStars.length; i++) {
      const shootingStar = shootingStars[i];
      if (!shootingStar.active) continue;
      active = true;
      shootingStar.progress += deltaTime / shootingStar.duration;
      if (shootingStar.progress >= 1) {
        shootingStar.active = false;
        shootingStar.progress = 0;
        active = false;
      }
    }

    if (!active) {
      shootingStarDelay -= deltaTime;
      if (shootingStarDelay <= 0) {
        const shootingStar = shootingStars[shootingStarIndex];
        shootingStar.active = true;
        shootingStar.progress = 0;
        shootingStarDelay = shootingStar.interval;
        shootingStarIndex = (shootingStarIndex + 1) % shootingStars.length;
      }
    }
  }

  function drawShootingStars() {
    for (let i = 0; i < shootingStars.length; i++) {
      const shootingStar = shootingStars[i];
      if (!shootingStar.active) continue;

      const easedProgress = shootingStar.progress * (2 - shootingStar.progress);
      const fadeIn = Math.min(1, shootingStar.progress * 7);
      const fadeOut = Math.min(1, (1 - shootingStar.progress) * 4);
      const opacity = fadeIn * fadeOut;
      const headX = (shootingStar.startX + shootingStar.directionX * shootingStar.distance * easedProgress) * width;
      const headY = (shootingStar.startY + shootingStar.directionY * shootingStar.distance * easedProgress) * height;
      const tailX = headX - shootingStar.directionX * shootingStar.tail * width;
      const tailY = headY - shootingStar.directionY * shootingStar.tail * width;
      const gradient = context.createLinearGradient(tailX, tailY, headX, headY);
      gradient.addColorStop(0, 'rgba(184,216,255,0)');
      gradient.addColorStop(0.72, rgba(COLORS.blueWhite, opacity * 0.32));
      gradient.addColorStop(1, rgba(COLORS.white, opacity * 0.88));
      context.strokeStyle = gradient;
      context.lineWidth = 0.9;
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(headX, headY);
      context.stroke();
      context.globalAlpha = opacity;
      context.fillStyle = rgba(COLORS.white, 1);
      context.fillRect(headX - 0.7, headY - 0.7, 1.4, 1.4);
      context.globalAlpha = 1;
    }
  }

  function renderFrame(staticFrame) {
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    context.fillStyle = '#02050a';
    context.fillRect(0, 0, width, height);

    drawStars(starLayers[0], staticFrame);
    drawNebula(staticFrame);
    drawGalaxy(staticFrame);
    drawStars(starLayers[1], staticFrame);
    drawConstellations(staticFrame);
    drawPlanets(staticFrame);
    drawStars(starLayers[2], staticFrame);
    if (!staticFrame) drawShootingStars();
  }

  function shouldAnimate() {
    return !destroyed && !reducedMotion && inViewport && !document.hidden;
  }

  function requestTick() {
    if (shouldAnimate() && !rafId) rafId = requestAnimationFrame(tick);
  }

  function tick(timestamp) {
    rafId = 0;
    if (!shouldAnimate()) return;

    const deltaTime = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, MAX_DELTA_TIME) : 0;
    lastTimestamp = timestamp;
    time += deltaTime;

    const damping = 1 - Math.exp(-deltaTime * 3.2);
    parallaxX += (targetParallaxX - parallaxX) * damping;
    parallaxY += (targetParallaxY - parallaxY) * damping;
    updateShootingStars(deltaTime);
    renderFrame(false);
    requestTick();
  }

  function onPointerMove(event) {
    targetParallaxX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
    targetParallaxY = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1));
  }

  function onResize() {
    updateMetrics();
    if (reducedMotion || !shouldAnimate()) renderFrame(true);
  }

  function onVisibilityChange() {
    lastTimestamp = 0;
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    } else {
      requestTick();
    }
  }

  const observer = new IntersectionObserver((entries) => {
    inViewport = entries[0] ? entries[0].isIntersecting : true;
    lastTimestamp = 0;
    if (!inViewport && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    requestTick();
  }, { threshold: 0 });

  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  if (!reducedMotion) window.addEventListener('pointermove', onPointerMove, { passive: true });
  observer.observe(hero);

  updateMetrics();
  renderFrame(reducedMotion);
  requestTick();

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (!reducedMotion) window.removeEventListener('pointermove', onPointerMove);
      canvas.remove();
    },
  };
}
