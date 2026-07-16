/* ==========================================================================
   Deep Space Background - Three.js cinematic universe
   All visual data and textures are generated locally and deterministically.
   ========================================================================== */

import * as THREE from './three.module.min.js';

const TAU = Math.PI * 2;
const GALAXY_ROTATION_SECONDS = 154;
const MAX_DELTA_TIME = 0.05;

const CONSTELLATIONS = [
  {
    points: [[0.04, 0.22], [0.23, 0.31], [0.42, 0.27], [0.56, 0.42], [0.72, 0.36], [0.86, 0.48], [0.96, 0.68]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  {
    points: [[0.03, 0.30], [0.25, 0.64], [0.48, 0.22], [0.72, 0.61], [0.96, 0.27]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    points: [[0.18, 0.06], [0.76, 0.12], [0.35, 0.40], [0.52, 0.43], [0.68, 0.47], [0.16, 0.92], [0.82, 0.94]],
    edges: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 1]],
  },
  {
    points: [[0.49, 0.02], [0.50, 0.28], [0.51, 0.53], [0.52, 0.96], [0.10, 0.48], [0.90, 0.54]],
    edges: [[0, 1], [1, 2], [2, 3], [4, 2], [2, 5]],
  },
  {
    points: [[0.05, 0.12], [0.22, 0.24], [0.35, 0.44], [0.50, 0.62], [0.68, 0.72], [0.83, 0.65], [0.93, 0.47], [0.98, 0.25]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]],
  },
  {
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

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value) {
  const normalized = clamp((value - edge0) / (edge1 - edge0));
  return normalized * normalized * (3 - 2 * normalized);
}

function hash2D(x, y, seed) {
  let value = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(x, y, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2D(ix, iy, seed);
  const b = hash2D(ix + 1, iy, seed);
  const c = hash2D(ix, iy + 1, seed);
  const d = hash2D(ix + 1, iy + 1, seed);
  const top = a + (b - a) * sx;
  const bottom = c + (d - c) * sx;
  return top + (bottom - top) * sy;
}

function fbm(x, y, seed, octaves = 4) {
  let value = 0;
  let amplitude = 0.55;
  let frequency = 1;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    value += valueNoise(x * frequency, y * frequency, seed + i * 37) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return value / total;
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createCanvasTexture(canvas, textures, options = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = options.minFilter || THREE.LinearMipmapLinearFilter;
  texture.magFilter = options.magFilter || THREE.LinearFilter;
  texture.generateMipmaps = options.generateMipmaps !== false;
  texture.wrapS = options.wrapS || THREE.ClampToEdgeWrapping;
  texture.wrapT = options.wrapT || THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  textures.add(texture);
  return texture;
}

function createStarTexture(textures) {
  const canvas = createCanvas(64, 64);
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.08, 'rgba(255,255,255,0.98)');
  gradient.addColorStop(0.22, 'rgba(205,230,255,0.56)');
  gradient.addColorStop(0.55, 'rgba(110,190,235,0.12)');
  gradient.addColorStop(1, 'rgba(70,150,220,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return createCanvasTexture(canvas, textures);
}

function createRadialTexture(stops, textures, size = 256) {
  const canvas = createCanvas(size, size);
  const context = canvas.getContext('2d');
  const center = size * 0.5;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  for (let i = 0; i < stops.length; i++) gradient.addColorStop(stops[i][0], stops[i][1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return createCanvasTexture(canvas, textures);
}

function createGalaxyTextures(size, seed, textures) {
  const colorCanvas = createCanvas(size, size);
  const dustCanvas = createCanvas(size, size);
  const colorContext = colorCanvas.getContext('2d');
  const dustContext = dustCanvas.getContext('2d');
  const colorImage = colorContext.createImageData(size, size);
  const dustImage = dustContext.createImageData(size, size);
  const colorData = colorImage.data;
  const dustData = dustImage.data;

  for (let y = 0; y < size; y++) {
    const ny = (y / (size - 1) - 0.5) * 2;
    for (let x = 0; x < size; x++) {
      const nx = (x / (size - 1) - 0.5) * 2;
      const radius = Math.sqrt(nx * nx + ny * ny);
      const index = (y * size + x) * 4;
      if (radius > 1.08) continue;

      const angle = Math.atan2(ny, nx);
      const warp = (fbm(nx * 2.4 + 8, ny * 2.4 - 3, seed, 3) - 0.5) * 0.42;
      const spiralPhase = angle - radius * 5.45 + warp * (0.25 + radius * 0.72);
      const armWave = 0.5 + 0.5 * Math.cos(spiralPhase * 4);
      const brightBand = Math.pow(armWave, 8.5);
      const middleBand = Math.pow(armWave, 3.4);
      const gasBand = Math.pow(0.5 + 0.5 * Math.cos((spiralPhase + 0.12) * 4), 2.7);
      const filamentBand = Math.pow(0.5 + 0.5 * Math.cos((spiralPhase + 0.23) * 4), 7);
      const dustBand = Math.pow(0.5 + 0.5 * Math.cos((spiralPhase - 0.14) * 4), 11);
      const largeNoise = fbm(nx * 3.1 + 17, ny * 3.1 - 11, seed + 71, 4);
      const fineNoise = fbm(nx * 9.5 - 4, ny * 9.5 + 13, seed + 137, 3);
      const cloudBreaks = smoothstep(0.47, 0.75, largeNoise * 0.72 + fineNoise * 0.28);
      const stellarKnots = smoothstep(0.58, 0.82, largeNoise * 0.46 + fineNoise * 0.54);
      const filaments = smoothstep(0.57, 0.8, fineNoise) * filamentBand;
      const outerFade = smoothstep(0.98, 0.7, radius);
      const innerFade = smoothstep(0.04, 0.18, radius);
      const core = Math.exp(-radius * radius * 35);
      const bulge = Math.exp(-radius * radius * 9.5);
      const halo = Math.exp(-radius * radius * 2.4) * 0.1 * outerFade;
      const armDensity = (
        middleBand * cloudBreaks * 0.28
        + brightBand * (0.1 + stellarKnots * 0.62)
        + gasBand * cloudBreaks * 0.09
        + filaments * 0.14
      ) * outerFade * innerFade;
      const dustCut = dustBand * smoothstep(0.12, 0.35, radius) * outerFade * (0.42 + largeNoise * 0.4);
      const density = Math.max(0, armDensity * (1 - dustCut * 0.88) + bulge * 0.34 + core * 0.9 + halo) * outerFade;

      const warmWeight = clamp(core * 1.7 + bulge * 0.68);
      const cyanWeight = clamp((gasBand * cloudBreaks + filaments) * outerFade * (0.16 + radius * 0.32));
      const emeraldWeight = clamp((fineNoise - 0.72) * 1.8) * gasBand * outerFade * 0.28;
      const blueWeight = clamp(middleBand * 0.68 + halo * 1.6);
      const red = 82 + warmWeight * 173 + blueWeight * 62 - cyanWeight * 18 - emeraldWeight * 22;
      const green = 126 + warmWeight * 112 + blueWeight * 61 + cyanWeight * 62 + emeraldWeight * 67;
      const blue = 190 + warmWeight * 40 + blueWeight * 61 + cyanWeight * 42 - emeraldWeight * 18;
      const alpha = clamp(density * 1.3) * 255;

      colorData[index] = clamp(red, 0, 255);
      colorData[index + 1] = clamp(green, 0, 255);
      colorData[index + 2] = clamp(blue, 0, 255);
      colorData[index + 3] = alpha;

      const dustAlpha = clamp(dustCut * 0.52 * outerFade * outerFade * smoothstep(0.08, 0.22, radius)) * 255;
      dustData[index] = 1;
      dustData[index + 1] = 5;
      dustData[index + 2] = 13;
      dustData[index + 3] = dustAlpha;
    }
  }

  colorContext.putImageData(colorImage, 0, 0);
  dustContext.putImageData(dustImage, 0, 0);

  const random = createRandom(seed + 913);
  colorContext.globalCompositeOperation = 'screen';
  for (let i = 0; i < Math.round(size * 0.72); i++) {
    const radius = Math.pow(random(), 1.35) * size * 0.43;
    const angle = random() * TAU;
    const px = size * 0.5 + Math.cos(angle) * radius;
    const py = size * 0.5 + Math.sin(angle) * radius;
    const pointSize = 0.35 + random() * 1.1;
    const opacity = 0.2 + random() * 0.55;
    colorContext.fillStyle = random() < 0.32
      ? `rgba(255,225,174,${opacity})`
      : `rgba(210,235,255,${opacity})`;
    colorContext.fillRect(px, py, pointSize, pointSize);
  }

  return {
    color: createCanvasTexture(colorCanvas, textures),
    dust: createCanvasTexture(dustCanvas, textures),
  };
}

function createNebulaTexture(width, height, seed, palette, textures) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const image = context.createImageData(width, height);
  const data = image.data;

  for (let y = 0; y < height; y++) {
    const ny = (y / (height - 1) - 0.5) * 2;
    for (let x = 0; x < width; x++) {
      const nx = (x / (width - 1) - 0.5) * 2;
      const warpX = fbm(nx * 1.7 + 4, ny * 2.4 - 7, seed, 3) - 0.5;
      const warpY = fbm(nx * 2.1 - 9, ny * 1.6 + 6, seed + 41, 3) - 0.5;
      const cloud = fbm(nx * 2.7 + warpY * 1.8, ny * 3.9 + warpX * 2.1, seed + 83, 5);
      const detail = fbm(nx * 8.4 - warpX, ny * 7.2 + warpY, seed + 149, 3);
      const ridge = 1 - Math.abs(detail * 2 - 1);
      const envelope = Math.exp(-(nx * nx * 0.9 + ny * ny * 3.3));
      const edgeMaskX = 1 - smoothstep(0.72, 0.99, Math.abs(nx));
      const edgeMaskY = 1 - smoothstep(0.7, 0.98, Math.abs(ny));
      const brokenCloud = smoothstep(0.48, 0.76, cloud * 0.78 + ridge * 0.34);
      const filaments = smoothstep(0.66, 0.92, ridge * cloud) * 0.5;
      const alpha = clamp((brokenCloud * 0.72 + filaments) * envelope * edgeMaskX * edgeMaskY * palette.opacity);
      const colorMix = clamp(cloud * 0.7 + detail * 0.3);
      const accentMix = clamp((ridge - 0.62) * 1.8);
      const index = (y * width + x) * 4;

      data[index] = palette.low[0] + (palette.high[0] - palette.low[0]) * colorMix + palette.accent[0] * accentMix * 0.22;
      data[index + 1] = palette.low[1] + (palette.high[1] - palette.low[1]) * colorMix + palette.accent[1] * accentMix * 0.22;
      data[index + 2] = palette.low[2] + (palette.high[2] - palette.low[2]) * colorMix + palette.accent[2] * accentMix * 0.22;
      data[index + 3] = alpha * 255;
    }
  }

  context.putImageData(image, 0, 0);
  return createCanvasTexture(canvas, textures);
}

function createPlanetTextures(size, seed, palette, textures) {
  const colorCanvas = createCanvas(size * 2, size);
  const bumpCanvas = createCanvas(size * 2, size);
  const colorContext = colorCanvas.getContext('2d');
  const bumpContext = bumpCanvas.getContext('2d');
  const colorImage = colorContext.createImageData(size * 2, size);
  const bumpImage = bumpContext.createImageData(size * 2, size);

  for (let y = 0; y < size; y++) {
    const v = y / (size - 1);
    for (let x = 0; x < size * 2; x++) {
      const u = x / (size * 2 - 1);
      const broad = fbm(u * 5.2, v * 7.4, seed, 5);
      const detail = fbm(u * 17.3, v * 20.1, seed + 59, 3);
      const bands = Math.sin((v + broad * 0.12) * Math.PI * palette.bands) * 0.5 + 0.5;
      const mix = clamp(broad * 0.62 + detail * 0.2 + bands * 0.18);
      const index = (y * size * 2 + x) * 4;
      const elevation = clamp(broad * 0.72 + detail * 0.28);
      colorImage.data[index] = palette.dark[0] + (palette.light[0] - palette.dark[0]) * mix;
      colorImage.data[index + 1] = palette.dark[1] + (palette.light[1] - palette.dark[1]) * mix;
      colorImage.data[index + 2] = palette.dark[2] + (palette.light[2] - palette.dark[2]) * mix;
      colorImage.data[index + 3] = 255;
      bumpImage.data[index] = elevation * 255;
      bumpImage.data[index + 1] = elevation * 255;
      bumpImage.data[index + 2] = elevation * 255;
      bumpImage.data[index + 3] = 255;
    }
  }

  colorContext.putImageData(colorImage, 0, 0);
  bumpContext.putImageData(bumpImage, 0, 0);
  return {
    color: createCanvasTexture(colorCanvas, textures, { wrapS: THREE.RepeatWrapping }),
    bump: createCanvasTexture(bumpCanvas, textures, { wrapS: THREE.RepeatWrapping }),
  };
}

function createTrailTexture(textures) {
  const canvas = createCanvas(256, 16);
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, 'rgba(120,190,255,0)');
  gradient.addColorStop(0.72, 'rgba(180,220,255,0.2)');
  gradient.addColorStop(0.96, 'rgba(235,248,255,0.9)');
  gradient.addColorStop(1, 'rgba(255,255,255,1)');
  context.fillStyle = gradient;
  context.fillRect(0, 5, 256, 6);
  return createCanvasTexture(canvas, textures, { generateMipmaps: false });
}

function createPointMaterial(textures, options = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: options.opacity ?? 1 },
      uPixelRatio: { value: 1 },
      uTexture: { value: options.texture || createStarTexture(textures) },
    },
    vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      attribute float aSpeed;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform float uOpacity;
      uniform float uPixelRatio;
      void main() {
        vColor = color;
        vAlpha = uOpacity * (0.84 + sin(uTime * aSpeed + aPhase) * 0.16);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.0, aSize * uPixelRatio);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec4 sprite = texture2D(uTexture, gl_PointCoord);
        if (sprite.a < 0.015) discard;
        gl_FragColor = vec4(vColor * sprite.rgb, sprite.a * vAlpha);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: options.blending || THREE.AdditiveBlending,
    toneMapped: false,
  });
  return material;
}

function setPointAttributes(geometry, positions, colors, sizes, phases, speeds) {
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
  geometry.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));
}

export function createBackground() {
  const hero = document.querySelector('.hero');
  if (!hero) return { destroy() {} };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;
  const isTablet = !isMobile && window.innerWidth < 1024;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const random = createRandom(0xA17D5EED);
  const textures = new Set();
  const materials = new Set();
  const geometries = new Set();
  const animatedPointMaterials = [];
  const avatar = hero.querySelector('.hero__avatar-wrapper');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: !isMobile,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    });
  } catch {
    return { destroy() {} };
  }

  renderer.setClearColor(0x02050a, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;';
  hero.insertBefore(canvas, hero.firstChild);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02050a);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 60);
  camera.position.set(0, 0, 10);
  const clock = new THREE.Clock(false);

  function trackMaterial(material) {
    materials.add(material);
    return material;
  }

  function trackGeometry(geometry) {
    geometries.add(geometry);
    return geometry;
  }

  const starTexture = createStarTexture(textures);

  // Far, middle and near star fields use normalized screen-space geometry.
  function createStarLayer(count, depth, sizeRange, opacity, renderOrder) {
    const positions = [];
    const colors = [];
    const sizes = [];
    const phases = [];
    const speeds = [];
    for (let i = 0; i < count; i++) {
      let x = random() - 0.5;
      let y = random() - 0.5;
      if (random() < 0.26) {
        const angle = random() * TAU;
        const radius = 0.08 + Math.sqrt(random()) * 0.44;
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius * 0.68 + 0.1;
      }
      positions.push(x, y, (random() - 0.5) * 0.18);
      const colorChance = random();
      if (colorChance < 0.7) colors.push(0.88, 0.94, 1);
      else if (colorChance < 0.94) colors.push(0.56, 0.78, 1);
      else if (colorChance < 0.985) colors.push(1, 0.83, 0.65);
      else colors.push(0.35, 0.9, 0.68);
      sizes.push(sizeRange[0] + random() * (sizeRange[1] - sizeRange[0]));
      phases.push(random() * TAU);
      speeds.push(0.3 + random() * (depth > -2 ? 1.2 : 0.55));
    }
    const geometry = trackGeometry(new THREE.BufferGeometry());
    setPointAttributes(geometry, positions, colors, sizes, phases, speeds);
    const material = trackMaterial(createPointMaterial(textures, { texture: starTexture, opacity }));
    animatedPointMaterials.push(material);
    const points = new THREE.Points(geometry, material);
    points.position.z = depth;
    points.renderOrder = renderOrder;
    points.frustumCulled = false;
    scene.add(points);
    return points;
  }

  const farStars = createStarLayer(isMobile ? 720 : isTablet ? 1500 : 2400, -6, [0.6, 1.4], 0.46, 10);
  const midStars = createStarLayer(isMobile ? 260 : isTablet ? 470 : 720, -2, [0.85, 2.1], 0.68, 50);
  const nearStars = createStarLayer(isMobile ? 34 : 92, 0.3, [1.25, 3.1], 0.78, 90);

  // A few near-star glints are sprites, never large blurred particles.
  const glintTexture = createRadialTexture([
    [0, 'rgba(255,255,255,1)'],
    [0.04, 'rgba(235,248,255,0.95)'],
    [0.15, 'rgba(165,215,255,0.36)'],
    [0.42, 'rgba(80,160,230,0.06)'],
    [1, 'rgba(20,80,150,0)'],
  ], textures, 128);
  const glints = [];
  const glintCount = isMobile ? 3 : 8;
  for (let i = 0; i < glintCount; i++) {
    const material = trackMaterial(new THREE.SpriteMaterial({
      map: glintTexture,
      color: i % 3 === 0 ? 0xb9dcff : 0xffffff,
      transparent: true,
      opacity: 0.46 + random() * 0.24,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }));
    const sprite = new THREE.Sprite(material);
    sprite.userData.nx = 0.04 + random() * 0.92;
    sprite.userData.ny = 0.08 + random() * 0.75;
    sprite.userData.sizePx = 8 + random() * 7;
    sprite.userData.phase = random() * TAU;
    sprite.position.z = 0.38;
    sprite.renderOrder = 91;
    scene.add(sprite);
    glints.push(sprite);
  }

  // Procedural nebula planes use layered fBm and ridge noise.
  const nebulaGroup = new THREE.Group();
  nebulaGroup.position.z = -4.6;
  scene.add(nebulaGroup);
  const nebulaResolution = isMobile ? [320, 144] : [512, 224];
  const nebulaDefinitions = [
    {
      nx: 0.08, ny: 0.26, width: 0.52, height: 0.3, rotation: -0.12, phase: 0.2,
      palette: { low: [8, 20, 48], high: [38, 116, 178], accent: [80, 220, 235], opacity: 0.62 },
    },
    {
      nx: 0.91, ny: 0.3, width: 0.5, height: 0.28, rotation: 0.18, phase: 2.1,
      palette: { low: [7, 25, 50], high: [22, 126, 150], accent: [66, 210, 165], opacity: 0.55 },
    },
    {
      nx: 0.13, ny: 0.74, width: 0.42, height: 0.22, rotation: 0.13, phase: 4.2,
      palette: { low: [12, 17, 48], high: [52, 86, 154], accent: [118, 68, 150], opacity: 0.42 },
    },
  ];
  const nebulae = [];
  const visibleNebulaCount = isMobile ? 2 : 3;
  for (let i = 0; i < visibleNebulaCount; i++) {
    const definition = nebulaDefinitions[i];
    const texture = createNebulaTexture(
      nebulaResolution[0],
      nebulaResolution[1],
      310 + i * 109,
      definition.palette,
      textures
    );
    const geometry = trackGeometry(new THREE.PlaneGeometry(2, 1));
    const material = trackMaterial(new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.66,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.z = definition.rotation;
    mesh.renderOrder = 20 + i;
    mesh.userData = { ...definition, baseX: 0, baseY: 0 };
    nebulaGroup.add(mesh);
    nebulae.push(mesh);
  }

  // Galaxy combines a continuous volumetric texture with sharp star geometry.
  const galaxyGroup = new THREE.Group();
  galaxyGroup.position.z = -3;
  scene.add(galaxyGroup);

  const galaxyTextureSize = isMobile ? 512 : 768;
  const galaxyTextures = createGalaxyTextures(galaxyTextureSize, 823, textures);
  const galaxyPlaneGeometry = trackGeometry(new THREE.PlaneGeometry(2, 2));
  const galaxyMaterial = trackMaterial(new THREE.MeshBasicMaterial({
    map: galaxyTextures.color,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  }));
  const galaxyPlane = new THREE.Mesh(galaxyPlaneGeometry, galaxyMaterial);
  galaxyPlane.renderOrder = 32;
  galaxyGroup.add(galaxyPlane);

  const dustMaterial = trackMaterial(new THREE.MeshBasicMaterial({
    map: galaxyTextures.dust,
    transparent: true,
    opacity: 0.46,
    blending: THREE.NormalBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  }));
  const dustPlane = new THREE.Mesh(galaxyPlaneGeometry, dustMaterial);
  dustPlane.position.z = 0.012;
  dustPlane.renderOrder = 31;
  galaxyGroup.add(dustPlane);

  const haloTexture = createRadialTexture([
    [0, 'rgba(180,220,255,0.13)'],
    [0.24, 'rgba(65,155,210,0.08)'],
    [0.55, 'rgba(25,95,145,0.038)'],
    [0.82, 'rgba(10,48,90,0.014)'],
    [1, 'rgba(2,8,20,0)'],
  ], textures, 512);
  const haloMaterial = trackMaterial(new THREE.SpriteMaterial({
    map: haloTexture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  }));
  const galaxyHalo = new THREE.Sprite(haloMaterial);
  galaxyHalo.position.z = -0.02;
  galaxyHalo.renderOrder = 30;
  galaxyGroup.add(galaxyHalo);

  function createGalaxyPoints(count) {
    const positions = [];
    const colors = [];
    const sizes = [];
    const phases = [];
    const speeds = [];
    const coreEnd = Math.round(count * 0.23);
    const armEnd = coreEnd + Math.round(count * 0.53);
    const haloEnd = armEnd + Math.round(count * 0.17);

    for (let i = 0; i < count; i++) {
      let radius;
      let angle;
      let opacityScale = 1;
      if (i < coreEnd) {
        radius = Math.pow(random(), 2.25) * 0.3;
        angle = random() * TAU;
      } else if (i < armEnd) {
        const arm = i % 4;
        radius = 0.08 + Math.pow(random(), 0.82) * 0.92;
        const spread = (random() + random() + random() + random() - 2) * (0.07 + radius * 0.18);
        angle = arm * TAU / 4 + radius * 5.45 + spread;
      } else if (i < haloEnd) {
        radius = 0.22 + Math.pow(random(), 0.7) * 0.84;
        angle = random() * TAU;
        opacityScale = 0.52;
      } else {
        const arm = i % 4;
        radius = 0.16 + random() * 0.8;
        const spread = (random() + random() - 1) * 0.085;
        angle = arm * TAU / 4 + radius * 5.45 + spread;
      }

      positions.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.61,
        (random() - 0.5) * (0.035 + radius * 0.055)
      );

      const colorChance = random();
      if (i < coreEnd && colorChance < 0.52) colors.push(1, 0.82, 0.55);
      else if (colorChance < 0.58) colors.push(0.86, 0.94, 1);
      else if (colorChance < 0.86) colors.push(0.52, 0.79, 1);
      else if (colorChance < 0.97) colors.push(0.28, 0.82, 0.93);
      else colors.push(0.25, 0.82, 0.58);

      const largePoint = random() < 0.035;
      sizes.push((largePoint ? 1.9 + random() * 1.35 : 0.68 + random() * 1.08) * opacityScale);
      phases.push(random() * TAU);
      speeds.push(0.16 + random() * 0.52);
    }

    const geometry = trackGeometry(new THREE.BufferGeometry());
    setPointAttributes(geometry, positions, colors, sizes, phases, speeds);
    const material = trackMaterial(createPointMaterial(textures, {
      texture: starTexture,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    }));
    animatedPointMaterials.push(material);
    const points = new THREE.Points(geometry, material);
    points.position.z = 0.025;
    points.renderOrder = 33;
    points.frustumCulled = false;
    galaxyGroup.add(points);
    return points;
  }

  const galaxyPointCount = isMobile ? 3000 : isTablet ? 6800 : 9200;
  const galaxyPoints = createGalaxyPoints(galaxyPointCount);

  // Fine dust around the galactic plane adds depth without reading as snow.
  const cosmicDustCount = isMobile ? 260 : 850;
  const dustPositions = [];
  const dustColors = [];
  const dustSizes = [];
  const dustPhases = [];
  const dustSpeeds = [];
  for (let i = 0; i < cosmicDustCount; i++) {
    const radius = 0.14 + Math.pow(random(), 0.74) * 0.96;
    const angle = random() * TAU;
    dustPositions.push(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.67, (random() - 0.5) * 0.12);
    dustColors.push(0.28, 0.5 + random() * 0.18, 0.72 + random() * 0.18);
    dustSizes.push(0.35 + random() * 0.55);
    dustPhases.push(random() * TAU);
    dustSpeeds.push(0.08 + random() * 0.2);
  }
  const cosmicDustGeometry = trackGeometry(new THREE.BufferGeometry());
  setPointAttributes(cosmicDustGeometry, dustPositions, dustColors, dustSizes, dustPhases, dustSpeeds);
  const cosmicDustMaterial = trackMaterial(createPointMaterial(textures, {
    texture: starTexture,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
  }));
  animatedPointMaterials.push(cosmicDustMaterial);
  const cosmicDust = new THREE.Points(cosmicDustGeometry, cosmicDustMaterial);
  cosmicDust.position.z = 0.018;
  cosmicDust.renderOrder = 34;
  cosmicDust.frustumCulled = false;
  galaxyGroup.add(cosmicDust);

  // The nucleus is built from independent white, ivory and cyan light layers.
  const coreLayers = [
    { size: 0.32, color: 0xffffff, opacity: 0.78, texture: createRadialTexture([[0, 'rgba(255,255,255,1)'], [0.14, 'rgba(255,255,250,0.92)'], [0.5, 'rgba(255,244,215,0.2)'], [1, 'rgba(255,240,210,0)']], textures) },
    { size: 0.78, color: 0xffdca2, opacity: 0.5, texture: createRadialTexture([[0, 'rgba(255,250,225,0.9)'], [0.28, 'rgba(255,218,158,0.48)'], [0.72, 'rgba(240,190,110,0.08)'], [1, 'rgba(220,160,80,0)']], textures) },
    { size: 1.15, color: 0xc9e5ff, opacity: 0.22, texture: createRadialTexture([[0, 'rgba(220,240,255,0.65)'], [0.3, 'rgba(150,210,255,0.25)'], [0.72, 'rgba(65,180,220,0.06)'], [1, 'rgba(30,120,180,0)']], textures) },
    { size: 1.55, color: 0x53d5c0, opacity: 0.075, texture: createRadialTexture([[0, 'rgba(90,220,210,0.22)'], [0.46, 'rgba(40,175,175,0.08)'], [1, 'rgba(20,110,130,0)']], textures) },
  ];
  const coreSprites = [];
  for (let i = 0; i < coreLayers.length; i++) {
    const layer = coreLayers[i];
    const material = trackMaterial(new THREE.SpriteMaterial({
      map: layer.texture,
      color: layer.color,
      transparent: true,
      opacity: layer.opacity,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }));
    const sprite = new THREE.Sprite(material);
    sprite.position.z = 0.05 + i * 0.002;
    sprite.renderOrder = 36 + i;
    sprite.userData.baseSize = layer.size;
    galaxyGroup.add(sprite);
    coreSprites.push(sprite);
  }

  // Intentional constellation patterns live in normalized edge-safe regions.
  const constellationPlacements = [
    { nx: 0.035, ny: 0.15, width: 0.16, height: 0.09, phase: 0.4, drift: 3.4 },
    { nx: 0.805, ny: 0.14, width: 0.15, height: 0.09, phase: 1.6, drift: 3.1 },
    { nx: 0.035, ny: 0.4, width: 0.13, height: 0.16, phase: 2.7, drift: 4.2 },
    { nx: 0.84, ny: 0.4, width: 0.12, height: 0.16, phase: 3.8, drift: 3.5 },
    { nx: 0.055, ny: 0.75, width: 0.15, height: 0.11, phase: 4.9, drift: 3.8 },
    { nx: 0.81, ny: 0.74, width: 0.14, height: 0.11, phase: 5.7, drift: 3.4 },
  ];
  const constellationGroups = [];
  const visibleConstellationCount = isMobile ? 4 : 6;
  for (let i = 0; i < visibleConstellationCount; i++) {
    const template = CONSTELLATIONS[i];
    const placement = constellationPlacements[i];
    const group = new THREE.Group();
    group.position.z = -0.8;
    group.userData = { ...placement, baseX: 0, baseY: 0 };

    const pointPositions = [];
    const pointColors = [];
    const pointSizes = [];
    const pointPhases = [];
    const pointSpeeds = [];
    for (let j = 0; j < template.points.length; j++) {
      pointPositions.push(template.points[j][0], 1 - template.points[j][1], 0);
      pointColors.push(0.78, 0.9, 1);
      pointSizes.push(j === 0 || j === Math.floor(template.points.length / 2) ? 3.2 : 2.1);
      pointPhases.push(random() * TAU);
      pointSpeeds.push(0.25 + random() * 0.35);
    }
    const pointGeometry = trackGeometry(new THREE.BufferGeometry());
    setPointAttributes(pointGeometry, pointPositions, pointColors, pointSizes, pointPhases, pointSpeeds);
    const pointMaterial = trackMaterial(createPointMaterial(textures, { texture: starTexture, opacity: 0.82 }));
    animatedPointMaterials.push(pointMaterial);
    const points = new THREE.Points(pointGeometry, pointMaterial);
    points.renderOrder = 61;
    group.add(points);

    const linePositions = [];
    for (let j = 0; j < template.edges.length; j++) {
      const start = template.points[template.edges[j][0]];
      const end = template.points[template.edges[j][1]];
      linePositions.push(start[0], 1 - start[1], 0, end[0], 1 - end[1], 0);
    }
    const lineGeometry = trackGeometry(new THREE.BufferGeometry());
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMaterial = trackMaterial(new THREE.LineBasicMaterial({
      color: 0xaed7ff,
      transparent: true,
      opacity: 0.2 + random() * 0.07,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false,
    }));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    lines.renderOrder = 60;
    group.add(lines);
    scene.add(group);
    constellationGroups.push(group);
  }

  // Real lit planet meshes with procedural color and bump textures.
  scene.add(new THREE.HemisphereLight(0x8dcaff, 0x02050a, 0.38));
  const keyLight = new THREE.DirectionalLight(0xdaf2ff, 2.3);
  keyLight.position.set(-4, 4, 6);
  scene.add(keyLight);
  const warmLight = new THREE.PointLight(0xffd59a, 1.5, 12, 2);
  warmLight.position.set(0, 0.5, 2.5);
  scene.add(warmLight);

  const planetDefinitions = [
    {
      nx: isMobile ? 0.83 : 0.88, ny: isMobile ? 0.21 : 0.27, radiusPx: isMobile ? 11 : 20,
      period: 168, phase: 0.6, orbitX: 8, orbitY: 5, ring: true,
      palette: { dark: [18, 31, 48], light: [72, 124, 155], bands: 7 },
    },
    {
      nx: 0.12, ny: 0.68, radiusPx: 15, period: 214, phase: 2.4, orbitX: 6, orbitY: 7, ring: false,
      palette: { dark: [17, 34, 37], light: [60, 112, 109], bands: 5 },
    },
  ];
  const planets = [];
  const planetCount = isMobile ? 1 : 2;
  for (let i = 0; i < planetCount; i++) {
    const definition = planetDefinitions[i];
    const group = new THREE.Group();
    group.position.z = -0.35;
    group.userData = { ...definition, baseX: 0, baseY: 0 };
    const planetTextures = createPlanetTextures(isMobile ? 128 : 192, 701 + i * 131, definition.palette, textures);
    const geometry = trackGeometry(new THREE.SphereGeometry(1, isMobile ? 28 : 40, isMobile ? 18 : 26));
    const material = trackMaterial(new THREE.MeshStandardMaterial({
      map: planetTextures.color,
      bumpMap: planetTextures.bump,
      bumpScale: 0.055,
      roughness: 0.88,
      metalness: 0.03,
      color: i === 0 ? 0xb7d6e5 : 0x9fc9bf,
      emissive: i === 0 ? 0x071522 : 0x061713,
      emissiveIntensity: 0.18,
    }));
    const sphere = new THREE.Mesh(geometry, material);
    sphere.renderOrder = 72;
    group.add(sphere);

    const atmosphereMaterial = trackMaterial(new THREE.MeshBasicMaterial({
      color: i === 0 ? 0x73d5ef : 0x5ad6b0,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      toneMapped: false,
    }));
    const atmosphere = new THREE.Mesh(geometry, atmosphereMaterial);
    atmosphere.scale.setScalar(1.08);
    atmosphere.renderOrder = 71;
    group.add(atmosphere);

    if (definition.ring) {
      const ringGeometry = trackGeometry(new THREE.RingGeometry(1.42, 2.05, 72));
      const ringMaterial = trackMaterial(new THREE.MeshBasicMaterial({
        color: 0x8fc6d5,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }));
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = 1.18;
      ring.rotation.z = -0.28;
      ring.renderOrder = 70;
      group.add(ring);
    }

    scene.add(group);
    planets.push({ group, sphere, definition });
  }

  // One reusable shooting-star sprite cycles through deterministic routes.
  const trailTexture = createTrailTexture(textures);
  const trailMaterial = trackMaterial(new THREE.SpriteMaterial({
    map: trailTexture,
    color: 0xd9efff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  }));
  const shootingStar = new THREE.Sprite(trailMaterial);
  shootingStar.position.z = 0.48;
  shootingStar.visible = false;
  shootingStar.renderOrder = 100;
  scene.add(shootingStar);
  const shootingRoutes = [];
  for (let i = 0; i < 5; i++) {
    shootingRoutes.push({
      startX: 0.15 + random() * 0.58,
      startY: 0.05 + random() * 0.2,
      dx: 0.13 + random() * 0.09,
      dy: 0.07 + random() * 0.05,
      duration: 0.72 + random() * 0.38,
      delay: 10 + random() * 6,
    });
  }

  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let centerX = 0.5;
  let centerY = 0.4;
  let galaxyRadiusWorld = 1;
  let rafId = 0;
  let inViewport = true;
  let destroyed = false;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let elapsed = 0;
  let shootingDelay = shootingRoutes[0].delay;
  let shootingProgress = 0;
  let shootingRouteIndex = 0;
  let shootingActive = false;

  function viewSizeAtZ(z) {
    const distance = camera.position.z - z;
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
    return { width: viewHeight * camera.aspect, height: viewHeight };
  }

  function normalizedToWorld(nx, ny, z) {
    const view = viewSizeAtZ(z);
    return {
      x: (nx - 0.5) * view.width,
      y: (0.5 - ny) * view.height,
    };
  }

  function updateLayout() {
    width = Math.max(1, hero.clientWidth);
    height = Math.max(1, hero.clientHeight);
    pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    if (avatar) {
      const heroRect = hero.getBoundingClientRect();
      const avatarRect = avatar.getBoundingClientRect();
      centerX = (avatarRect.left + avatarRect.width * 0.5 - heroRect.left) / width;
      centerY = (avatarRect.top + avatarRect.height * 0.5 - heroRect.top) / height;
    }

    const galaxyPosition = normalizedToWorld(centerX, centerY, galaxyGroup.position.z);
    galaxyGroup.position.x = galaxyPosition.x;
    galaxyGroup.position.y = galaxyPosition.y;
    const galaxyView = viewSizeAtZ(galaxyGroup.position.z);
    const worldPerPixel = galaxyView.height / height;
    galaxyRadiusWorld = Math.min(width, height) * worldPerPixel * (isMobile ? 0.49 : 0.52);
    galaxyPlane.scale.set(galaxyRadiusWorld * 1.12, galaxyRadiusWorld * 0.69, 1);
    dustPlane.scale.copy(galaxyPlane.scale);
    galaxyHalo.scale.set(galaxyRadiusWorld * 2.55, galaxyRadiusWorld * 1.48, 1);
    galaxyPoints.scale.setScalar(galaxyRadiusWorld);
    cosmicDust.scale.setScalar(galaxyRadiusWorld);
    for (let i = 0; i < coreSprites.length; i++) {
      const size = galaxyRadiusWorld * coreSprites[i].userData.baseSize;
      coreSprites[i].scale.set(size, size * 0.82, 1);
    }

    const farView = viewSizeAtZ(farStars.position.z);
    farStars.scale.set(farView.width, farView.height, 1);
    const midView = viewSizeAtZ(midStars.position.z);
    midStars.scale.set(midView.width, midView.height, 1);
    const nearView = viewSizeAtZ(nearStars.position.z);
    nearStars.scale.set(nearView.width, nearView.height, 1);

    for (let i = 0; i < nebulae.length; i++) {
      const nebula = nebulae[i];
      const definition = nebula.userData;
      const position = normalizedToWorld(definition.nx, definition.ny, nebulaGroup.position.z);
      definition.baseX = position.x;
      definition.baseY = position.y;
      nebula.position.set(position.x, position.y, i * 0.01);
      const view = viewSizeAtZ(nebulaGroup.position.z);
      nebula.scale.set(view.width * definition.width * 0.5, view.height * definition.height, 1);
    }

    for (let i = 0; i < constellationGroups.length; i++) {
      const group = constellationGroups[i];
      const definition = group.userData;
      const position = normalizedToWorld(definition.nx, definition.ny, group.position.z);
      definition.baseX = position.x;
      definition.baseY = position.y;
      group.position.x = position.x;
      group.position.y = position.y;
      const view = viewSizeAtZ(group.position.z);
      group.scale.set(view.width * definition.width, view.height * definition.height, 1);
    }

    for (let i = 0; i < planets.length; i++) {
      const planet = planets[i];
      const definition = planet.definition;
      const position = normalizedToWorld(definition.nx, definition.ny, planet.group.position.z);
      planet.group.userData.baseX = position.x;
      planet.group.userData.baseY = position.y;
      planet.group.position.x = position.x;
      planet.group.position.y = position.y;
      const planetView = viewSizeAtZ(planet.group.position.z);
      const radius = definition.radiusPx * planetView.height / height;
      planet.group.scale.setScalar(radius);
    }

    const nearWorldPerPixel = viewSizeAtZ(0.38).height / height;
    for (let i = 0; i < glints.length; i++) {
      const glint = glints[i];
      const position = normalizedToWorld(glint.userData.nx, glint.userData.ny, glint.position.z);
      glint.position.x = position.x;
      glint.position.y = position.y;
      const size = glint.userData.sizePx * nearWorldPerPixel;
      glint.scale.set(size, size, 1);
    }

    for (let i = 0; i < animatedPointMaterials.length; i++) {
      animatedPointMaterials[i].uniforms.uPixelRatio.value = pixelRatio;
    }
  }

  function updateShootingStar(deltaTime) {
    if (!shootingActive) {
      shootingDelay -= deltaTime;
      if (shootingDelay <= 0) {
        shootingActive = true;
        shootingProgress = 0;
        shootingStar.visible = true;
      }
      return;
    }

    const route = shootingRoutes[shootingRouteIndex];
    shootingProgress += deltaTime / route.duration;
    if (shootingProgress >= 1) {
      shootingActive = false;
      shootingStar.visible = false;
      trailMaterial.opacity = 0;
      shootingRouteIndex = (shootingRouteIndex + 1) % shootingRoutes.length;
      shootingDelay = shootingRoutes[shootingRouteIndex].delay;
      return;
    }

    const eased = shootingProgress * (2 - shootingProgress);
    const nx = route.startX + route.dx * eased;
    const ny = route.startY + route.dy * eased;
    const position = normalizedToWorld(nx, ny, shootingStar.position.z);
    shootingStar.position.x = position.x;
    shootingStar.position.y = position.y;
    const view = viewSizeAtZ(shootingStar.position.z);
    shootingStar.scale.set(view.width * 0.085, view.height * 0.008, 1);
    trailMaterial.rotation = -Math.atan2(route.dy * height, route.dx * width);
    const fadeIn = Math.min(1, shootingProgress * 7);
    const fadeOut = Math.min(1, (1 - shootingProgress) * 4);
    trailMaterial.opacity = fadeIn * fadeOut * 0.82;
  }

  function updateScene(deltaTime) {
    elapsed += deltaTime;
    const damping = 1 - Math.exp(-deltaTime * 3.1);
    if (isCoarsePointer) {
      pointerTargetX = Math.sin(elapsed * 0.075) * 0.18;
      pointerTargetY = Math.cos(elapsed * 0.058) * 0.12;
    }
    pointerX += (pointerTargetX - pointerX) * damping;
    pointerY += (pointerTargetY - pointerY) * damping;
    camera.position.x = pointerX * 0.11;
    camera.position.y = -pointerY * 0.07;
    camera.lookAt(0, 0, -1.4);

    galaxyGroup.rotation.z = elapsed * TAU / GALAXY_ROTATION_SECONDS;
    galaxyGroup.rotation.x = Math.sin(elapsed * 0.025) * 0.008;
    galaxyMaterial.opacity = 0.89 + Math.sin(elapsed * 0.22) * 0.018;
    for (let i = 0; i < coreSprites.length; i++) {
      const pulse = 1 + Math.sin(elapsed * (0.19 + i * 0.035) + i) * (0.012 + i * 0.003);
      const size = galaxyRadiusWorld * coreSprites[i].userData.baseSize * pulse;
      coreSprites[i].scale.set(size, size * 0.82, 1);
    }

    for (let i = 0; i < animatedPointMaterials.length; i++) {
      animatedPointMaterials[i].uniforms.uTime.value = elapsed;
    }

    nebulaGroup.position.x = pointerX * 0.018;
    nebulaGroup.position.y = -pointerY * 0.012;
    for (let i = 0; i < nebulae.length; i++) {
      const nebula = nebulae[i];
      const definition = nebula.userData;
      nebula.position.x = definition.baseX + Math.sin(elapsed * 0.018 + definition.phase) * 0.045;
      nebula.position.y = definition.baseY + Math.cos(elapsed * 0.014 + definition.phase) * 0.028;
    }

    for (let i = 0; i < constellationGroups.length; i++) {
      const group = constellationGroups[i];
      const definition = group.userData;
      const worldPerPixel = viewSizeAtZ(group.position.z).height / height;
      group.position.x = definition.baseX + Math.sin(elapsed * 0.035 + definition.phase) * definition.drift * worldPerPixel;
      group.position.y = definition.baseY + Math.cos(elapsed * 0.029 + definition.phase) * definition.drift * 0.7 * worldPerPixel;
    }

    for (let i = 0; i < planets.length; i++) {
      const planet = planets[i];
      const definition = planet.definition;
      const worldPerPixel = viewSizeAtZ(planet.group.position.z).height / height;
      const orbit = elapsed * TAU / definition.period + definition.phase;
      planet.group.position.x = planet.group.userData.baseX + Math.cos(orbit) * definition.orbitX * worldPerPixel;
      planet.group.position.y = planet.group.userData.baseY + Math.sin(orbit) * definition.orbitY * worldPerPixel;
      planet.sphere.rotation.y += deltaTime * (0.045 + i * 0.012);
      planet.sphere.rotation.x = 0.08 + Math.sin(elapsed * 0.027 + i) * 0.025;
    }

    for (let i = 0; i < glints.length; i++) {
      glints[i].material.opacity = 0.46 + Math.sin(elapsed * 0.62 + glints[i].userData.phase) * 0.13;
    }

    updateShootingStar(deltaTime);
  }

  function renderStatic() {
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, -1.4);
    galaxyGroup.rotation.set(0, 0, 0.22);
    for (let i = 0; i < animatedPointMaterials.length; i++) {
      animatedPointMaterials[i].uniforms.uTime.value = 0;
    }
    shootingStar.visible = false;
    renderer.render(scene, camera);
  }

  function shouldAnimate() {
    return !destroyed && !reducedMotion && inViewport && !document.hidden;
  }

  function requestTick() {
    if (shouldAnimate() && !rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    rafId = 0;
    if (!shouldAnimate()) return;
    const deltaTime = Math.min(clock.getDelta(), MAX_DELTA_TIME);
    updateScene(deltaTime);
    renderer.render(scene, camera);
    requestTick();
  }

  function startAnimation() {
    if (!shouldAnimate()) return;
    clock.start();
    clock.getDelta();
    requestTick();
  }

  function stopAnimation() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    clock.stop();
  }

  function onPointerMove(event) {
    pointerTargetX = clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1);
    pointerTargetY = clamp(event.clientY / window.innerHeight * 2 - 1, -1, 1);
  }

  function onVisibilityChange() {
    if (document.hidden) stopAnimation();
    else startAnimation();
  }

  const intersectionObserver = new IntersectionObserver((entries) => {
    inViewport = entries[0] ? entries[0].isIntersecting : true;
    if (inViewport) startAnimation();
    else stopAnimation();
  }, { threshold: 0 });

  const resizeObserver = new ResizeObserver(() => {
    updateLayout();
    if (reducedMotion || !shouldAnimate()) renderStatic();
  });

  document.addEventListener('visibilitychange', onVisibilityChange);
  if (!reducedMotion && !isCoarsePointer) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }
  intersectionObserver.observe(hero);
  resizeObserver.observe(hero);
  updateLayout();
  renderStatic();
  startAnimation();

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopAnimation();
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (!reducedMotion && !isCoarsePointer) {
        window.removeEventListener('pointermove', onPointerMove);
      }

      scene.clear();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
