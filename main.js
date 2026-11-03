/* Portfólio — interações.
   O canteiro 3D (world.js) carrega à parte: se o WebGL ou a CDN falhar, o resto da página funciona igual. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileMQ = matchMedia('(max-width: 820px)');
const isMobile = () => mobileMQ.matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

let world = null;
let lenis = null;
let active = null;
let fill = 0;

/* ---------- Scroll suave (no toque o navegador continua no comando) ---------- */
if (window.Lenis && !reduce) {
  lenis = new window.Lenis({ lerp: 0.1 });
  const raf = (t) => {
    lenis.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

function scrollToEl(el, immediate = false) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.4, immediate });
  else el.scrollIntoView({ behavior: reduce || immediate ? 'auto' : 'smooth', block: 'start' });
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = id && document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  scrollToEl(el);
  history.replaceState(history.state, '', '#' + id);
  if (a.classList.contains('skip')) {
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
});

/* ---------- Relógio de São Paulo ---------- */
const clock = $('#clock');
const timeFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
const tickClock = () => (clock.textContent = timeFmt.format(new Date()));
tickClock();
setInterval(tickClock, 20000);

/* ---------- Revelação no scroll ---------- */
const rvSel = '.head > :not([data-reveal]), .proj__in > *, .rows > li, .runner, .job, .cv__grid > *, .contact > .eyebrow, .contact__grid > *';
$$(rvSel).forEach((el) => {
  el.classList.add('rv');
  el.style.setProperty('--d', [...el.parentElement.children].indexOf(el));
});
const revealIO = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add('is-in');
      revealIO.unobserve(en.target);
    }
  },
  { rootMargin: '0px 0px -10% 0px' }
);
$$('[data-reveal], .rv').forEach((el) => (reduce ? el.classList.add('is-in') : revealIO.observe(el)));

/* ---------- HUD e navegação ---------- */
const hero = $('#inicio');
const bar = $('.bar');
const hudSec = $('#hudSec');
const hudCap = $('#hudCap');
const hudBuild = $('#hudBuild');
const tabbar = $('.tabbar');
const tabs = $$('a', tabbar);
const deckCap = $('#deckCap');
let capTimer = 0;

function setHud(label, cap) {
  hudSec.textContent = label;
  if (hudCap.textContent === cap) return;
  hudCap.classList.add('is-swap');
  clearTimeout(capTimer);
  capTimer = setTimeout(() => {
    hudCap.textContent = cap;
    hudCap.classList.remove('is-swap');
  }, 240);
}

function setNav(sec) {
  $$('[data-nav]').forEach((a) => (a.dataset.nav === sec ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  tabbar.style.setProperty('--tab', Math.max(0, tabs.findIndex((a) => a.dataset.nav === sec)));
}

/* onde o canteiro fica na tela (fração da largura e da altura) */
const FOCUS = {
  desk: { hero: [0.6, 0.42], proj: [0.74, 0.5], contato: [0.76, 0.4], other: [0.79, 0.48] },
  mob: { hero: [0.5, 0.34], other: [0.5, 0.46] },
};

function applyScene() {
  const el = active;
  if (!el) return;
  const isDeck = el.dataset.form === 'deck';
  const form = isDeck ? deck.form() : el.dataset.form;
  const kind = isDeck ? 'deck' : el.classList.contains('proj') ? 'proj' : form;
  const map = FOCUS[isMobile() ? 'mob' : 'desk'];
  const [fx, fy] = map[kind] || map.other;
  root.toggleAttribute('data-dim', isMobile() && kind !== 'hero' && kind !== 'deck');
  root.toggleAttribute('data-scrim', !isMobile() && kind !== 'hero');
  setHud(el.dataset.label, isDeck ? deck.caption() : el.dataset.caption);
  setNav(el.dataset.sec);
  if (!world) return;
  world.setForm(form);
  if (isDeck) deckFocus();
  else world.setFocus(fx, fy);
  world.setGroup(null);
  if (form === 'vistoria') world.setFill(fill);
}

// no baralho, o canteiro acompanha o vão entre o título e as cartas enquanto a página rola
function deckFocus() {
  const gap = deckCap.getBoundingClientRect();
  world?.setFocus(0.5, clamp((gap.top + gap.height * 0.48) / innerHeight, 0.18, 0.6), 1.3);
}

const anchors = {
  desk: $$('[data-anchor]:not([data-anchor="mob"])'),
  mob: $$('[data-anchor]:not([data-anchor="desk"])'),
};

function track() {
  const list = anchors[isMobile() ? 'mob' : 'desk'];
  const mid = innerHeight * 0.5;
  let cur = list[0];
  for (const el of list) if (el.getBoundingClientRect().top <= mid) cur = el;
  if (cur !== active) {
    active = cur;
    applyScene();
    if (active.id === 'projetos') deck.hint();
  }
  if (active.dataset.form === 'deck') deckFocus();
  const y = window.scrollY;
  hero.style.setProperty('--hp', clamp(y / (hero.offsetHeight * 0.85), 0, 1).toFixed(3));
  bar.classList.toggle('is-scrolled', y > 40);
  root.classList.toggle('at-end', y + innerHeight > root.scrollHeight - 140);
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    track();
  });
}
addEventListener('scroll', onScroll, { passive: true });

/* ---------- Baralho de projetos (celular) ---------- */
const deck = (() => {
  const el = $('#deck');
  const cards = $$('.proj', el);
  const dots = $$('.deck-dots i');
  const now = $('#deckNow');
  const cap = $('#deckCap');
  const order = cards.map((_, i) => i);
  let on = false;
  let hinted = false;
  let drag = null;
  let suppress = false;
  const top = () => cards[order[0]];

  function layout() {
    order.forEach((ci, pos) => {
      const c = cards[ci];
      c.style.setProperty('--pos', pos);
      c.classList.toggle('is-top', on && pos === 0);
      c.inert = on && pos !== 0;
    });
    now.textContent = String(order[0] + 1).padStart(2, '0');
    dots.forEach((d, i) => d.classList.toggle('is-on', i === order[0]));
    cap.textContent = top().dataset.caption;
    if (on && active?.id === 'projetos') applyScene();
  }

  function measure() {
    if (!on) return;
    const h = Math.max(...cards.map((c) => c.offsetHeight));
    el.style.setProperty('--deck-h', h + 24 + 'px');
  }

  function enable(v) {
    on = v;
    el.classList.toggle('is-deck', v);
    cards.forEach((c) => {
      c.style.transform = '';
      c.style.opacity = '';
      c.classList.remove('is-drag', 'is-fly');
    });
    if (!v) el.style.removeProperty('--deck-h');
    layout();
    measure();
  }

  function step(dir) {
    if (dir > 0) order.push(order.shift());
    else order.unshift(order.pop());
    layout();
  }

  const nextFrame = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

  function next(sign = 1) {
    const c = top();
    navigator.vibrate?.(8);
    if (reduce) return step(1);
    c.classList.remove('is-drag');
    c.classList.add('is-fly');
    c.style.transform = `translate3d(${sign * el.offsetWidth * 1.25}px, 0, 0) rotate(${sign * 16}deg)`;
    setTimeout(() => {
      c.classList.remove('is-fly');
      c.classList.add('is-drag');
      c.style.transform = '';
      step(1);
      nextFrame(() => c.classList.remove('is-drag'));
    }, 400);
  }

  function prev() {
    const c = cards[order[order.length - 1]];
    navigator.vibrate?.(8);
    if (reduce) return step(-1);
    c.classList.add('is-drag');
    c.style.transform = `translate3d(${-el.offsetWidth * 1.25}px, 0, 0) rotate(-16deg)`;
    c.style.opacity = '0';
    step(-1);
    nextFrame(() => {
      c.classList.remove('is-drag');
      c.style.transform = '';
      c.style.opacity = '';
    });
  }

  el.addEventListener('pointerdown', (e) => {
    if (!on || e.button > 0) return;
    const c = e.target.closest('.proj');
    if (c !== top()) return;
    drag = { c, id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, v: 0, lx: 0, lt: performance.now(), lock: null };
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.lock) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.lock === 'y') return void (drag = null);
      drag.c.setPointerCapture(e.pointerId);
      drag.c.classList.add('is-drag');
    }
    const t = performance.now();
    drag.v = (dx - drag.lx) / Math.max(1, t - drag.lt);
    drag.lx = dx;
    drag.lt = t;
    drag.dx = dx;
    drag.c.style.transform = `translate3d(${dx}px, ${dy * 0.12}px, 0) rotate(${dx * 0.045}deg)`;
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { c, dx, v, lock } = drag;
    drag = null;
    if (lock !== 'x') return;
    suppress = true;
    if (Math.abs(dx) > el.offsetWidth * 0.28 || Math.abs(v) > 0.55) next(Math.sign(dx || v));
    else {
      c.classList.remove('is-drag');
      c.style.transform = '';
    }
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener(
    'click',
    (e) => {
      if (suppress) {
        suppress = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const c = on && e.target.closest('.proj');
      if (c && c === top() && !e.target.closest('[data-open]')) openSheet(c.dataset.sheet, $('[data-open]', c));
    },
    true
  );

  $('[data-deck="next"]').addEventListener('click', () => next(1));
  $('[data-deck="prev"]').addEventListener('click', prev);

  return {
    enable,
    measure,
    form: () => top().dataset.form,
    caption: () => top().dataset.caption,
    hint() {
      if (!on || hinted || reduce) return;
      hinted = true;
      setTimeout(() => el.classList.add('is-hint'), 300);
      setTimeout(() => el.classList.remove('is-hint'), 2400);
    },
  };
})();

deck.enable(isMobile());
mobileMQ.addEventListener('change', () => {
  deck.enable(isMobile());
  active = null;
  track();
});
addEventListener('resize', () => {
  deck.measure();
  onScroll();
});

/* ---------- Ficha do projeto ---------- */
const sheet = $('#sheet');
const sheetBody = $('#sheetBody');
const panel = $('.sheet__panel', sheet);
let opener = null;
let closing = false;

function openSheet(id, from) {
  const tpl = document.getElementById('t-' + id);
  if (!tpl || sheet.open) return;
  sheetBody.replaceChildren(tpl.content.cloneNode(true));
  [...sheetBody.children].forEach((c, i) => c.style.setProperty('--d', i));
  opener = from || document.activeElement;
  panel.style.transform = '';
  sheet.showModal();
  panel.scrollTop = 0;
  lenis?.stop();
  root.classList.add('is-sheet');
  requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('is-open')));
  history.pushState({ sheet: id }, '');
}

function closeSheet(fromHistory = false) {
  if (!sheet.open || closing) return;
  if (!fromHistory && history.state?.sheet) return history.back();
  closing = true;
  panel.style.transform = '';
  sheet.classList.remove('is-open');
  setTimeout(
    () => {
      sheet.close();
      closing = false;
      sheetBody.replaceChildren();
      lenis?.start();
      root.classList.remove('is-sheet');
      opener?.focus({ preventScroll: true });
    },
    reduce ? 0 : 480
  );
}

addEventListener('popstate', () => closeSheet(true));
sheet.addEventListener('cancel', (e) => {
  e.preventDefault();
  closeSheet();
});
sheet.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) closeSheet();
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-open]');
  if (b) openSheet(b.dataset.open, b);
});

// no celular a folha fecha arrastando para baixo
const grab = $('.sheet__top', sheet);
let sd = null;
grab.addEventListener('pointerdown', (e) => {
  if (!isMobile() || e.target.closest('button')) return;
  sd = { id: e.pointerId, y: e.clientY, dy: 0, t: performance.now() };
  grab.setPointerCapture(e.pointerId);
  panel.classList.add('is-drag');
});
grab.addEventListener('pointermove', (e) => {
  if (!sd || e.pointerId !== sd.id) return;
  sd.dy = Math.max(0, e.clientY - sd.y);
  panel.style.transform = `translateY(${sd.dy}px)`;
});
const sheetRelease = (e) => {
  if (!sd || e.pointerId !== sd.id) return;
  const { dy, t } = sd;
  sd = null;
  panel.classList.remove('is-drag');
  if (dy > 110 || dy / (performance.now() - t) > 0.6) closeSheet();
  else panel.style.transform = '';
};
grab.addEventListener('pointerup', sheetRelease);
grab.addEventListener('pointercancel', sheetRelease);

/* ---------- Linha ou etapa acende o prédio dela no canteiro ---------- */
$$('[data-group]').forEach((el) => {
  const on = () => active?.contains(el) && world?.setGroup(+el.dataset.group);
  const off = () => world?.setGroup(null);
  el.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && on());
  el.addEventListener('pointerleave', off);
  el.addEventListener('focus', on);
  el.addEventListener('blur', off);
});

/* ---------- Vistoria: as verificações rodam quando a seção aparece ---------- */
const runner = $('#runner');
const runLines = $$('.runner__list li', runner);
const runState = $('#runState');
const runSum = $('#runSum');
const runCount = $('[data-count]', runner);

function countUp(el, to, ms) {
  const t0 = performance.now();
  const frame = (t) => {
    const p = Math.min(1, (t - t0) / ms);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function passTo(n) {
  fill = n / runLines.length;
  if (active?.dataset.form === 'vistoria') world?.setFill(fill);
}

function runTests() {
  const total = runLines.length;
  if (reduce) {
    runLines.forEach((li) => li.classList.add('is-pass'));
    runState.textContent = 'concluído';
    runSum.classList.add('is-done');
    return passTo(total);
  }
  let i = 0;
  runState.textContent = 'rodando';
  countUp(runCount, Number(runCount.dataset.count), 3400);
  const tick = () => {
    if (i > 0) {
      runLines[i - 1].classList.replace('is-run', 'is-pass');
      passTo(i);
    }
    if (i < total) {
      runLines[i].classList.add('is-run');
      runSum.textContent = `${i} / ${total} passaram`;
      i++;
      setTimeout(tick, 260 + Math.random() * 240);
    } else {
      runState.textContent = 'concluído';
      runSum.textContent = `${total} verificações · ${total} passaram`;
      runSum.classList.add('is-done');
    }
  };
  tick();
}

if (!reduce) runCount.textContent = '0';
const runIO = new IntersectionObserver(
  ([en]) => {
    if (!en.isIntersecting) return;
    runIO.disconnect();
    runTests();
  },
  { threshold: 0.35 }
);
runIO.observe(runner);

/* ---------- Contato ---------- */
$$('[data-copy]').forEach((btn) =>
  btn.addEventListener('click', async () => {
    const label = btn.textContent;
    let ok = false;
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      ok = true;
    } catch {}
    btn.textContent = ok ? 'Copiado' : 'Copie à mão';
    $('#copyStatus').textContent = ok ? 'E-mail copiado.' : 'Não foi possível copiar o e-mail.';
    setTimeout(() => (btn.textContent = label), 1800);
  })
);

const form = $('#contactForm');
const formStatus = $('.form__status', form);
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = $('[type="submit"]', form);
  const label = button.textContent;
  const data = new FormData(form);
  data.set('_subject', `Portfólio — ${data.get('subject') || 'Contato'}`);
  button.disabled = true;
  button.textContent = 'Enviando…';
  formStatus.textContent = '';
  try {
    const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    formStatus.textContent = 'Mensagem enviada. Respondo no e-mail que você informou.';
  } catch {
    formStatus.textContent = 'Não foi possível enviar agora. Tente de novo ou escreva para ericdudu1999@gmail.com.';
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
});

/* ---------- Mouse, toque e inclinação mexem no canteiro ---------- */
addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType !== 'mouse' || !world) return;
    const nx = (e.clientX / innerWidth) * 2 - 1, ny = -(e.clientY / innerHeight) * 2 + 1;
    world.pointer(nx, ny);
    world.setTilt(nx * 0.5, ny * 0.4);
  },
  { passive: true }
);
document.addEventListener('mouseout', (e) => !e.relatedTarget && world?.pointer(null));

hero.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' || e.target.closest('a, button') || !world) return;
  world.pulse((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
});

function listenTilt() {
  addEventListener(
    'deviceorientation',
    (e) => {
      if (e.gamma == null || !world) return;
      world.setTilt(e.gamma / 25, (e.beta - 50) / 25);
    },
    { passive: true }
  );
}
// só o iPhone/iPad pede permissão para ler a inclinação; os outros já liberam
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (isMobile() && !reduce && 'DeviceOrientationEvent' in window) {
  if (isIOS && typeof DeviceOrientationEvent.requestPermission === 'function') {
    const gyro = $('#gyro');
    gyro.hidden = false;
    gyro.addEventListener('click', async () => {
      try {
        if ((await DeviceOrientationEvent.requestPermission()) === 'granted') listenTilt();
      } catch {}
      gyro.hidden = true;
    });
  } else listenTilt();
}

/* ---------- Canteiro 3D ---------- */
let introDone = false;
function onBuild(p, form) {
  if (introDone) return;
  if (form !== 'hero') {
    introDone = true;
    hudBuild.textContent = '';
    return;
  }
  hudBuild.textContent = p < 1 ? `Construindo ${String(Math.round(p * 1600)).padStart(4, '0')} / 1600` : 'Canteiro de pé';
  if (p >= 1) {
    introDone = true;
    setTimeout(() => (hudBuild.textContent = ''), 2600);
  }
}

async function boot3D() {
  try {
    const { createWorld } = await import('./world.js');
    world = createWorld($('#world'), { reduce, onBuild });
    applyScene();
  } catch (err) {
    console.warn('Canteiro 3D indisponível:', err);
    root.classList.add('no-3d');
  }
}

/* ---------- Abertura ---------- */
const fontsReady = document.fonts
  ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))])
  : Promise.resolve();

boot3D();
fontsReady.then(() => {
  root.classList.add('is-ready');
  deck.measure();
  const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) scrollToEl(target, true);
  track();
});
track();
