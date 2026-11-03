/* Canteiro 3D: 1.600 blocos que se montam numa forma por seção.
   Cada forma usa um dado real do projeto (7 torres = 7 módulos, 1.070 blocos = 1.070 termos...). */
import * as THREE from 'three';

const N = 1600;
const SPREAD = 0.9;         // quanto a montagem se espalha no tempo (de baixo para cima)
const DUR = 1.9;            // segundos de uma troca de forma
const D2R = Math.PI / 180;

const COLOR = { bg: 0x151413, conc: 0x9a938a, sig: 0xff5a1f, grid: 0x2a2724, grid2: 0x1f1d1b };

/* Câmera e clima de cada forma: distância, elevação, azimute, altura do alvo, giro, respiração, varredura */
const SCENE = {
  hero:      { r: 50, el: 30, az: 38, y: 1, spin: 0.018, wave: 0.55, scan: 1 },
  hub:       { r: 56, el: 22, az: 30, y: 5, spin: 0.07 },
  delivery:  { r: 62, el: 44, az: 20, y: 1, spin: 0.05 },
  cmv:       { r: 50, el: 22, az: 40, y: 6, spin: 0.09 },
  dumos:     { r: 62, el: 26, az: 30, y: 3, spin: 0.05 },
  auditsync: { r: 74, el: 46, az: 22, y: 0, spin: 0.025 },
  field:     { r: 62, el: 32, az: 34, y: 2, spin: 0.04 },
  vistoria:  { r: 60, el: 26, az: 40, y: 5, spin: 0.1 },
  cv:        { r: 54, el: 22, az: 34, y: 4, spin: 0.06 },
  contato:   { r: 64, el: 40, az: 30, y: 0, spin: 0.035 },
};

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* blocos empilhados: caixa w x d x h de cubos unitários */
function stack(out, cx, cz, w, d, h, opts = {}) {
  for (let y = 0; y < h; y++)
    for (let i = 0; i < w; i++)
      for (let j = 0; j < d; j++)
        out.push({ x: cx + i - (w - 1) / 2, y: (opts.y0 || 0) + y, z: cz + j - (d - 1) / 2, s: 0.9, h: 1, hot: opts.hot ? 1 : 0, g: opts.g });
  return out;
}

const FORMS = {
  hero() {
    const r = rng(7), out = [];
    for (let i = 0; i < 40; i++)
      for (let j = 0; j < 40; j++) {
        const x = i - 19.5, z = j - 19.5, d = Math.hypot(x, z) / 27.6;
        let h = 0.6 + (Math.sin(x * 0.31) * Math.cos(z * 0.27) + 1) * 1.5 + Math.pow(r(), 4) * 10 * (1 - d);
        h *= 1.15 - d * 0.8;
        out.push({ x, y: 0, z, s: 0.84, h: Math.max(0.3, h), hot: r() < 0.03 ? 1 : 0, o: d });
      }
    return out;
  },

  hub() {
    const out = [], heights = [9, 12, 8, 13, 10, 11, 9];
    heights.forEach((h, k) => {
      const a = (k / 7) * Math.PI * 2;
      stack(out, Math.cos(a) * 8.5, Math.sin(a) * 8.5, 4, 4, h, { g: k });
    });
    return stack(out, 0, 0, 3, 3, 15, { hot: true, g: 7 });
  },

  delivery() {
    const out = [], R = 15;
    const route = new Set();
    // rota em degraus da loja (centro) até o cliente
    let x = 0, z = 0;
    while (x < 10 || z > -7) {
      if (x < 10 && (x - z) % 3 !== 0) x++; else if (z > -7) z--; else x++;
      route.add(x + ',' + z);
    }
    for (let i = -R; i <= R; i++)
      for (let j = -R; j <= R; j++) {
        const d = Math.hypot(i, j);
        if (d > R || (i === 0 && j === 0)) continue;
        const onRoute = route.has(i + ',' + j);
        out.push({ x: i, y: 0, z: j, s: 0.92, h: d > R - 0.9 ? 1.4 : onRoute ? 0.7 : 0.3, hot: onRoute ? 1 : 0 });
      }
    for (let y = 0; y < 8; y++) out.push({ x: 0, y, z: 0, s: 0.9, h: 1, hot: 1 });
    stack(out, 0, 0, 3, 3, 3, { y0: 8, hot: true });
    stack(out, 10, -8, 2, 2, 2, { y0: 0.7 });
    // casas fora do raio: o pedido não fecha
    [[-17, 9], [12, 14], [18, -6]].forEach(([cx, cz]) => stack(out, cx, cz, 2, 2, 2));
    return out;
  },

  cmv() {
    const out = [];
    for (let y = 0; y < 14; y++)
      for (let i = 0; i < 10; i++)
        for (let j = 0; j < 10; j++) {
          const n = y * 100 + i * 10 + j;
          // R$ 14,82 de R$ 64,90 = 22,8% → 319 de 1.400 blocos
          out.push({ x: i - 4.5, y, z: j - 4.5, s: 0.9, h: 1, hot: n < 319 ? 1 : 0, o: n / 1400 });
        }
    return out;
  },

  dumos() {
    const out = [], r = rng(3);
    const isles = [[-10, -4, 3, 4.2], [2, -9, 6, 3.6], [11, -1, 2, 4.6], [-2, 6, 5, 3.8], [-13, 8, 1, 3]];
    isles.forEach(([cx, cz, cy, rad], k) => {
      for (let layer = 0; layer < 4; layer++) {
        const rr = rad - layer * 1.15;
        for (let i = -Math.ceil(rr); i <= Math.ceil(rr); i++)
          for (let j = -Math.ceil(rr); j <= Math.ceil(rr); j++)
            if (Math.hypot(i, j) <= rr) out.push({ x: cx + i, y: cy - layer, z: cz + j, s: 0.9, h: layer ? 1 : 0.6, g: k });
      }
      const n = 2 + Math.floor(r() * 3);
      for (let b = 0; b < n; b++) {
        const a = r() * Math.PI * 2, dist = r() * (rad - 2);
        stack(out, Math.round(cx + Math.cos(a) * dist), Math.round(cz + Math.sin(a) * dist), 2, 2, 2 + Math.floor(r() * 5), { y0: cy + 0.6, hot: k === 1, g: k });
      }
    });
    return out;
  },

  auditsync() {
    const out = [], r = rng(11), wrong = new Set();
    while (wrong.size < 14) wrong.add(Math.floor(r() * 1070));
    for (let n = 0; n < 1070; n++) {
      const c = n % 35, row = Math.floor(n / 35);
      const bad = wrong.has(n);
      out.push({ x: c - 19.5, y: 0, z: row - 15, s: 0.86, h: bad ? 1.8 : 0.45, hot: bad ? 1 : 0, g: 0 });
    }
    [-12, -4, 4, 12].forEach((cz, k) => stack(out, 19, cz, 3, 3, 13, { g: k + 1 }));
    return out;
  },

  field() {
    const out = [];
    const sizes = [[4, 4, 7], [3, 5, 5], [5, 3, 4], [4, 4, 9], [3, 3, 6], [5, 4, 3]];
    sizes.forEach(([w, d, h], k) => {
      const cx = [-11, 0, 11][k % 3], cz = k < 3 ? -6 : 6;
      for (let i = -1; i <= w; i++)
        for (let j = -1; j <= d; j++)
          if (i < 0 || j < 0 || i >= w || j >= d)
            out.push({ x: cx + i - (w - 1) / 2, y: 0, z: cz + j - (d - 1) / 2, s: 0.92, h: 0.25, g: k });
      stack(out, cx, cz, w, d, h, { g: k });
    });
    return out;
  },

  vistoria() {
    const out = [];
    for (let y = 0; y < 11; y++)
      for (let i = 0; i < 11; i++)
        for (let j = 0; j < 11; j++)
          out.push({ x: i - 5, y, z: j - 5, s: 0.9, h: 1, o: y / 11 + (i + j) * 0.0015 });
    return out;
  },

  cv() {
    const out = [];
    [3, 6, 9].forEach((h, k) => stack(out, (k - 1) * 6.4, 0, 6, 6, h, { hot: k === 2, g: k }));
    return out;
  },

  contato() {
    const out = [];
    const W = 18, D = 12;
    for (let i = 0; i < W; i++)
      for (let j = 0; j < D; j++) {
        const edge = i === 0 || j === 0 || i === W - 1 || j === D - 1;
        if (!edge) continue;
        const corner = (i === 0 || i === W - 1) && (j === 0 || j === D - 1);
        out.push({ x: i - W / 2 - 3, y: 0, z: j - D / 2 + 0.5, s: corner ? 0.55 : 0.92, h: corner ? 4.5 : 0.35, hot: corner ? 1 : 0 });
      }
    [-5.5, 0.5, 6.5].forEach((cz) => stack(out, 12, cz, 4, 4, 4));
    return out;
  },
};

function pack(list) {
  if (list.length > N) list.length = N;
  const V = list.length;
  list.sort((a, b) => a.x + a.z * 0.37 - (b.x + b.z * 0.37));
  let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
  for (const b of list) {
    y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y);
    x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x);
  }
  const pos = new Float32Array(N * 4), h = new Float32Array(N), hot = new Float32Array(N);
  const order = new Float32Array(N), group = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    const idx = Math.floor((k * V) / N), b = list[idx];
    const dup = k > 0 && Math.floor(((k - 1) * V) / N) === idx;
    pos.set([b.x, b.y, b.z, dup ? 0 : b.s], k * 4);
    h[k] = b.h;
    hot[k] = b.hot || 0;
    order[k] = b.o ?? ((b.y - y0) / (y1 - y0 || 1)) * 0.8 + ((b.x - x0) / (x1 - x0 || 1)) * 0.2;
    group[k] = b.g ?? -1;
  }
  return { pos, h, hot, order, group };
}

const ioc = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const VERT = /* glsl */ `
attribute vec4 aFrom;
attribute vec4 aTo;
attribute vec4 aExt;   // altura de/para, laranja de/para
attribute vec4 aMeta;  // semente, ordem de montagem, grupo
uniform float uT, uTime, uWave, uArc, uFocus, uFill, uFillMix, uScan;
uniform vec3 uMouse;
varying vec3 vN;
varying vec3 vP;
varying vec3 vHalf;
varying float vHot;
varying float vDepth;

float ioc(float t) { return t < .5 ? 4. * t * t * t : 1. - pow(-2. * t + 2., 3.) * .5; }

void main() {
  float st = (aMeta.y * .8 + aMeta.x * .2) * ${SPREAD.toFixed(2)};
  float t = clamp(uT * ${(1 + SPREAD).toFixed(2)} - st, 0., 1.);
  float e = ioc(t);
  float fly = sin(t * 3.14159265);

  vec3 p = mix(aFrom.xyz, aTo.xyz, e);
  p.y += fly * (2.5 + aMeta.x * 7.) * uArc;
  float s = mix(aFrom.w, aTo.w, e);
  float h = mix(aExt.x, aExt.y, e);
  float hot = mix(aExt.z, aExt.w, e);

  h += (sin(p.x * .37 + uTime * .7) * cos(p.z * .29 + uTime * .55) + 1.) * uWave;

  float lift = smoothstep(7., 0., distance(p.xz, uMouse.xz)) * uMouse.y;
  p.y += lift * (1. + p.y * .25);

  hot = max(hot, step(abs(aMeta.z - uFocus), .5));
  hot = max(hot, uFillMix * step(aMeta.y, uFill - .001));
  float sx = mod(uTime * 7., 70.) - 35.;
  hot = max(hot, uScan * smoothstep(1.6, 0., abs(p.x - sx)) * .85);

  float a = fly * (aMeta.x - .5) * 5.;
  float c = cos(a), sn = sin(a);
  mat3 R = mat3(c, 0., -sn, 0., 1., 0., sn, 0., c);
  vec3 size = vec3(s, s * h, s);
  vec3 v = position * size;
  v.y += size.y * .5;
  v = R * v;

  vec4 mv = modelViewMatrix * vec4(p + v, 1.);
  gl_Position = projectionMatrix * mv;
  vN = normalize(mat3(modelMatrix) * (R * normal));
  vP = position * size;
  vHalf = size * .5;
  vHot = clamp(hot + lift * .4, 0., 1.);
  vDepth = -mv.z;
}`;

const FRAG = /* glsl */ `
uniform vec3 uBg, uSig, uConc;
uniform float uFogNear, uFogFar;
varying vec3 vN;
varying vec3 vP;
varying vec3 vHalf;
varying float vHot;
varying float vDepth;

void main() {
  vec3 n = normalize(vN);
  float dif = max(dot(n, normalize(vec3(.42, .86, .3))), 0.);
  float back = max(dot(n, normalize(vec3(-.6, .2, -.5))), 0.);
  vec3 d = vHalf - abs(vP);
  float mn = min(d.x, min(d.y, d.z)), mx = max(d.x, max(d.y, d.z));
  float edge = 1. - smoothstep(.015, .06, d.x + d.y + d.z - mn - mx);

  vec3 col = mix(uConc * (.3 + dif * .62 + back * .1), uSig * (.78 + dif * .32), vHot);
  col *= 1. - edge * .45;
  col += uSig * edge * vHot * .35;
  gl_FragColor = vec4(mix(col, uBg, smoothstep(uFogNear, uFogFar, vDepth)), 1.);
}`;

const rgb = (hex) => new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

export function createWorld(canvas, { reduce = false, onBuild } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(COLOR.bg, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLOR.bg, 40, 100);
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 400);
  const group = new THREE.Group();
  scene.add(group);

  const grid = new THREE.GridHelper(220, 110, COLOR.grid, COLOR.grid2);
  grid.position.y = -0.02;
  group.add(grid);

  const from = new Float32Array(N * 4), to = new Float32Array(N * 4);
  const ext = new Float32Array(N * 4), meta = new Float32Array(N * 4);
  const seed = rng(42);
  for (let i = 0; i < N; i++) {
    // começo: blocos soltos no céu
    from.set([(seed() - 0.5) * 70, 34 + seed() * 30, (seed() - 0.5) * 70, 0.84], i * 4);
    ext.set([1, 1, 0, 0], i * 4);
    meta[i * 4] = seed();
  }

  const geo = new THREE.InstancedBufferGeometry().copy(new THREE.BoxGeometry(1, 1, 1));
  geo.instanceCount = N;
  const aFrom = new THREE.InstancedBufferAttribute(from, 4);
  const aTo = new THREE.InstancedBufferAttribute(to, 4);
  const aExt = new THREE.InstancedBufferAttribute(ext, 4);
  const aMeta = new THREE.InstancedBufferAttribute(meta, 4);
  geo.setAttribute('aFrom', aFrom);
  geo.setAttribute('aTo', aTo);
  geo.setAttribute('aExt', aExt);
  geo.setAttribute('aMeta', aMeta);

  const U = {
    uT: { value: 0 }, uTime: { value: 0 }, uWave: { value: 0 }, uArc: { value: 0 },
    uFocus: { value: -10 }, uFill: { value: 0 }, uFillMix: { value: 0 }, uScan: { value: 0 },
    uMouse: { value: new THREE.Vector3(0, 0, 0) },
    uBg: { value: rgb(COLOR.bg) }, uSig: { value: rgb(COLOR.sig) }, uConc: { value: rgb(COLOR.conc) },
    uFogNear: { value: 40 }, uFogFar: { value: 100 },
  };
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: U }));
  mesh.frustumCulled = false;
  group.add(mesh);

  const cache = {};
  const formOf = (name) => (cache[name] ||= pack(FORMS[name]()));

  let current = null;
  let dur = DUR;
  const cam = { ...SCENE.hero, r: 70, el: 40 };
  let tgt = SCENE.hero;
  const focus = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, z: 1, tz: 1 };
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  const mouse = { nx: 0, ny: 0, on: 0, k: 0, pulse: false };
  let fillTarget = 0;
  let spin = 0;
  let size = { w: 1, h: 1 };

  function snapshot() {
    const k = U.uT.value * (1 + SPREAD), arc = U.uArc.value;
    for (let i = 0; i < N; i++) {
      const o = i * 4, sd = meta[o];
      const t = Math.min(1, Math.max(0, k - (meta[o + 1] * 0.8 + sd * 0.2) * SPREAD));
      const e = ioc(t);
      from[o] += (to[o] - from[o]) * e;
      from[o + 1] += (to[o + 1] - from[o + 1]) * e + Math.sin(t * Math.PI) * (2.5 + sd * 7) * arc;
      from[o + 2] += (to[o + 2] - from[o + 2]) * e;
      from[o + 3] += (to[o + 3] - from[o + 3]) * e;
      ext[o] += (ext[o + 1] - ext[o]) * e;
      ext[o + 2] += (ext[o + 3] - ext[o + 2]) * e;
    }
  }

  function setForm(name) {
    if (name === current || !FORMS[name]) return;
    const first = current === null;
    if (!first) snapshot();
    current = name;
    const f = formOf(name);
    to.set(f.pos);
    for (let i = 0; i < N; i++) {
      ext[i * 4 + 1] = f.h[i];
      ext[i * 4 + 3] = f.hot[i];
      meta[i * 4 + 1] = f.order[i];
      meta[i * 4 + 2] = f.group[i];
    }
    aFrom.needsUpdate = aTo.needsUpdate = aExt.needsUpdate = aMeta.needsUpdate = true;
    tgt = SCENE[name];
    U.uFocus.value = -10;
    fillTarget = 0;
    U.uFill.value = 0;
    dur = first ? 2.6 : DUR;
    U.uArc.value = first ? 0 : 1;
    U.uT.value = reduce ? 1 : 0;
    if (reduce) settle();
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    size = { w, h };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 900 ? 2 : 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (reduce) settle();
  }

  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  function step(dt) {
    U.uTime.value += dt;
    if (U.uT.value < 1) {
      U.uT.value = Math.min(1, U.uT.value + dt / dur);
      onBuild?.(U.uT.value, current);
    }
    const k = reduce ? 1 : 1 - Math.exp(-dt * 2.2);
    for (const key of ['r', 'el', 'az', 'y']) cam[key] += (tgt[key] - cam[key]) * k;
    spin += ((reduce ? 0 : tgt.spin || 0) - spin) * k;
    group.rotation.y += spin * dt;
    U.uWave.value += ((reduce ? 0 : tgt.wave || 0) - U.uWave.value) * k;
    U.uScan.value += ((reduce ? 0 : tgt.scan || 0) - U.uScan.value) * k;
    const filling = current === 'vistoria' && U.uT.value > 0.9 ? 1 : 0;
    U.uFillMix.value += (filling - U.uFillMix.value) * Math.min(1, k * 2);
    U.uFill.value += (fillTarget - U.uFill.value) * Math.min(1, k * 2.5);
    focus.x += (focus.tx - focus.x) * k;
    focus.y += (focus.ty - focus.y) * k;
    focus.z += (focus.tz - focus.z) * k;
    tilt.x += (tilt.tx - tilt.x) * Math.min(1, k * 1.5);
    tilt.y += (tilt.ty - tilt.y) * Math.min(1, k * 1.5);

    // olhar
    const aspect = size.w / size.h;
    const fit = aspect < 1.25 ? 1 + (1.25 - aspect) * 0.95 : 1;
    const r = cam.r * fit * focus.z;
    const el = (cam.el + tilt.y * 6) * D2R, az = (cam.az + tilt.x * 10) * D2R;
    camera.position.set(Math.sin(az) * Math.cos(el) * r, cam.y + Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
    camera.lookAt(0, cam.y, 0);
    camera.setViewOffset(size.w, size.h, (0.5 - focus.x) * size.w, (0.5 - focus.y) * size.h, size.w, size.h);
    camera.updateProjectionMatrix();
    U.uFogNear.value = r * 0.8;
    U.uFogFar.value = r * 2;
    scene.fog.near = r * 0.6;
    scene.fog.far = r * 1.7;

    // mouse ou toque levanta os blocos perto dele
    mouse.k += ((reduce ? 0 : mouse.on) - mouse.k) * Math.min(1, dt * (mouse.pulse ? 2 : 6));
    if (mouse.pulse && mouse.k > 0.95) mouse.on = 0;
    if (mouse.k > 0.01) {
      raycaster.setFromCamera({ x: mouse.nx, y: mouse.ny }, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        group.worldToLocal(hit);
        U.uMouse.value.set(hit.x, mouse.k, hit.z);
      }
    } else U.uMouse.value.y = 0;
  }

  function render() {
    renderer.render(scene, camera);
  }

  // movimento reduzido: sem laço, um quadro por mudança
  let pending = false;
  function settle() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      step(1);
      render();
    });
  }

  let raf = 0, last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    step(dt);
    render();
  }
  function start() {
    if (reduce || raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  new ResizeObserver(resize).observe(canvas);
  resize();
  setForm('hero');
  start();
  if (reduce) settle();

  return {
    setForm,
    // x, y: onde o centro do canteiro fica na tela (0–1); zoom > 1 afasta a câmera
    setFocus(x, y, zoom = 1) {
      focus.tx = x;
      focus.ty = y;
      focus.tz = zoom;
      if (reduce) { focus.x = x; focus.y = y; focus.z = zoom; settle(); }
    },
    setTilt(x, y) {
      tilt.tx = Math.max(-1, Math.min(1, x));
      tilt.ty = Math.max(-1, Math.min(1, y));
    },
    pointer(nx, ny) {
      if (nx == null) { mouse.on = 0; return; }
      mouse.nx = nx; mouse.ny = ny; mouse.on = 1; mouse.pulse = false;
    },
    pulse(nx, ny) {
      mouse.nx = nx; mouse.ny = ny; mouse.on = 1; mouse.pulse = true;
    },
    setGroup(g) {
      U.uFocus.value = g == null ? -10 : g;
      if (reduce) settle();
    },
    setFill(v) {
      fillTarget = v;
      if (reduce) { U.uFill.value = v; U.uFillMix.value = 1; settle(); }
    },
  };
}
