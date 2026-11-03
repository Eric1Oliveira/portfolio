/* Eric Oliveira — portfólio.
   Scroll suave, nome com holofote, rolo de projetos, cenas de cor, linha do
   tempo, cursor, fichas dos projetos e formulário de contato. */
(() => {
  'use strict';
  window.__eo = true;

  const root = document.documentElement;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const media = (q) => window.matchMedia(q);
  const reduceMotion = media('(prefers-reduced-motion: reduce)').matches;
  const finePointer = media('(hover: hover) and (pointer: fine)').matches;
  const topOf = (el) => el.getBoundingClientRect().top + window.scrollY;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------- Scroll suave ---------- */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    const tick = (time) => {
      lenis.raf(time);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const scrollToY = (y, immediate = false) => {
    if (lenis) lenis.scrollTo(y, { immediate, force: true });
    else window.scrollTo({ top: y, behavior: immediate || reduceMotion ? 'auto' : 'smooth' });
  };

  /* ---------- Diálogos (menu e fichas) ---------- */
  const menu = $('#menu');
  const menuBtn = $('[data-menu]');
  const caseDialog = $('#case');
  const caseBody = $('.case__body', caseDialog);

  const openDialog = (dialog) => {
    dialog.showModal();
    lenis?.stop();
    root.classList.add('has-dialog');
  };

  [menu, caseDialog].forEach((dialog) => {
    dialog.addEventListener('close', () => {
      lenis?.start();
      root.classList.remove('has-dialog');
    });
    // clique no fundo escurecido fecha
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
  $$('[data-close]').forEach((btn) => btn.addEventListener('click', () => btn.closest('dialog').close()));

  menuBtn.addEventListener('click', () => {
    openDialog(menu);
    menuBtn.setAttribute('aria-expanded', 'true');
  });
  menu.addEventListener('close', () => menuBtn.setAttribute('aria-expanded', 'false'));

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open]');
    if (!trigger) return;
    const template = document.getElementById(`case-${trigger.dataset.open}`);
    if (!template) return;
    caseBody.replaceChildren(template.content.cloneNode(true));
    openDialog(caseDialog);
    caseDialog.scrollTop = 0;
  });

  /* ---------- Links internos ---------- */
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = decodeURIComponent(link.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    if (link.dataset.subject) setSubject(link.dataset.subject);
    if (menu.open) menu.close();
    scrollToY(id === 'inicio' ? 0 : topOf(target));
    history.replaceState(null, '', `#${id}`);
    target.focus({ preventScroll: true });
  });

  /* ---------- Tema ---------- */
  const themeBtn = $('[data-theme-toggle]');
  const themeColor = $('meta[name="theme-color"]');
  const syncTheme = () => {
    const dark = root.dataset.theme !== 'light';
    themeBtn.setAttribute('aria-label', dark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro');
    themeColor.setAttribute('content', dark ? '#0b1416' : '#f2f5f5');
  };
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', root.dataset.theme);
    } catch (e) {
      /* armazenamento bloqueado: o tema vale só nesta visita */
    }
    syncTheme();
  });
  syncTheme();

  /* ---------- Nome com holofote ---------- */
  const hero = $('.hero');
  const nameEl = $('.hero__name');
  const letters = [];
  $$('[data-letters]', nameEl).forEach((line) => {
    const text = line.textContent.trim();
    line.textContent = '';
    for (const char of text) {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = char;
      span.style.setProperty('--i', letters.length);
      line.append(span);
      letters.push(span);
    }
  });

  const spot = { x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0, radius: 200, running: false, user: false, timer: 0 };

  function spotFrame() {
    spot.x += (spot.tx - spot.x) * 0.14;
    spot.y += (spot.ty - spot.y) * 0.14;
    spot.power += (spot.target - spot.power) * 0.08;
    const settled = Math.abs(spot.tx - spot.x) < 0.3 && Math.abs(spot.ty - spot.y) < 0.3 && Math.abs(spot.target - spot.power) < 0.004;
    if (settled) spot.power = spot.target;

    // lê todas as posições antes de escrever qualquer estilo
    const rects = letters.map((l) => l.getBoundingClientRect());
    rects.forEach((r, i) => {
      const dx = spot.x - (r.left + r.width / 2);
      const dy = (spot.y - (r.top + r.height / 2)) * 1.25;
      let t = clamp(1 - Math.hypot(dx, dy) / spot.radius, 0, 1);
      t = t * t * (3 - 2 * t) * spot.power;
      const letter = letters[i];
      if (Math.abs((letter._t || 0) - t) > 0.002 || (t === 0 && letter._t)) {
        letter._t = t;
        letter.style.setProperty('--t', t.toFixed(3));
      }
    });
    const box = hero.getBoundingClientRect();
    hero.style.setProperty('--sx', `${(spot.x - box.left).toFixed(1)}px`);
    hero.style.setProperty('--sy', `${(spot.y - box.top).toFixed(1)}px`);
    hero.style.setProperty('--spot-o', spot.power.toFixed(3));

    if (settled) spot.running = false;
    else requestAnimationFrame(spotFrame);
  }
  const runSpot = () => {
    if (spot.running) return;
    spot.running = true;
    requestAnimationFrame(spotFrame);
  };

  if (!reduceMotion) {
    hero.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      if (spot.power < 0.05) {
        spot.x = event.clientX;
        spot.y = event.clientY;
      }
      spot.user = true;
      spot.tx = event.clientX;
      spot.ty = event.clientY;
      spot.target = 1;
      runSpot();
    });
    hero.addEventListener('pointerleave', () => {
      spot.target = 0;
      runSpot();
    });
    // no toque, a luz acende onde o dedo encosta e apaga sozinha
    hero.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') return;
      spot.user = true;
      spot.x = spot.tx = event.clientX;
      spot.y = spot.ty = event.clientY;
      spot.target = 1;
      runSpot();
      clearTimeout(spot.timer);
      spot.timer = setTimeout(() => {
        spot.target = 0;
        runSpot();
      }, 1400);
    });
  }

  // Abertura: a luz atravessa o nome uma vez.
  function sweep() {
    if (reduceMotion || spot.user) return;
    const a = letters[0].getBoundingClientRect();
    const b = letters[letters.length - 1].getBoundingClientRect();
    const from = { x: a.left - a.width, y: a.top + a.height / 2 };
    const to = { x: b.right + b.width, y: b.top + b.height / 2 };
    const start = performance.now();
    const duration = 2300;
    spot.x = spot.tx = from.x;
    spot.y = spot.ty = from.y;
    spot.target = 1;
    const step = (now) => {
      if (spot.user) return;
      const p = clamp((now - start) / duration, 0, 1);
      const e = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
      spot.tx = from.x + (to.x - from.x) * e;
      spot.ty = from.y + (to.y - from.y) * e;
      if (p > 0.78) spot.target = 0;
      runSpot();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Manifesto: as palavras acendem com o scroll ---------- */
  const scrubEl = $('[data-scrub]');
  const about = scrubEl.closest('.about');
  const words = [];
  const scrubOn = !reduceMotion;

  const splitWords = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        splitWords(child);
        return;
      }
      if (child.nodeType !== Node.TEXT_NODE) return;
      const frag = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.append(part);
          return;
        }
        const word = document.createElement('span');
        word.className = 'w';
        word.textContent = part;
        words.push(word);
        frag.append(word);
      });
      child.replaceWith(frag);
    });
  };

  if (scrubOn) {
    splitWords(scrubEl);
    about.classList.add('is-scrub');
  }

  function updateScrub() {
    if (!scrubOn) return;
    const box = about.getBoundingClientRect();
    const vh = window.innerHeight;
    if (box.bottom < 0 || box.top > vh) return;
    const p = clamp((vh * 0.55 - box.top) / (about.offsetHeight - vh * 0.8), 0, 1);
    const lit = p * (words.length + 3);
    words.forEach((word, i) => {
      const o = Math.round((0.14 + 0.86 * clamp(lit - i, 0, 1)) * 100) / 100;
      if (word._o !== o) {
        word._o = o;
        word.style.opacity = o;
      }
    });
  }

  /* ---------- Rolo de projetos ---------- */
  const reel = $('.reel');
  const track = $('.reel__track', reel);
  const shots = $$('.shot', reel);
  const countEl = $('[data-reel-count]', reel);
  const reelQuery = media('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
  const R = { on: false, dist: 0, top: 0, range: 0, active: -1 };

  function layoutReel() {
    R.on = reelQuery.matches;
    reel.classList.toggle('is-pinned', R.on);
    if (!R.on) {
      reel.style.height = '';
      track.style.transform = '';
      shots.forEach((shot) => shot.style.removeProperty('--off'));
      return;
    }
    R.dist = Math.max(0, track.scrollWidth - window.innerWidth);
    reel.style.height = `${R.dist + window.innerHeight}px`;
    R.top = topOf(reel);
    R.range = reel.offsetHeight - window.innerHeight;
    shots.forEach((shot) => {
      shot._left = shot.offsetLeft;
      shot._w = shot.offsetWidth;
    });
  }

  function updateReel() {
    if (!R.on) return;
    const p = R.range > 0 ? clamp((window.scrollY - R.top) / R.range, 0, 1) : 0;
    const x = -p * R.dist;
    track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    const vw = window.innerWidth;
    let active = 0;
    let best = Infinity;
    shots.forEach((shot, i) => {
      const off = (shot._left + x + shot._w / 2 - vw / 2) / vw;
      shot.style.setProperty('--off', off.toFixed(3));
      if (Math.abs(off) < best) {
        best = Math.abs(off);
        active = i;
      }
    });
    if (active !== R.active) {
      R.active = active;
      countEl.textContent = String(active + 1).padStart(2, '0');
    }
  }

  // Tab dentro do rolo: leva o quadro focado para o centro da tela.
  track.addEventListener('focusin', (event) => {
    if (!R.on || !R.dist) return;
    const item = event.target.closest('.shot, .reel__intro, .reel__end');
    if (!item) return;
    const x = clamp(item.offsetLeft - (window.innerWidth - item.offsetWidth) / 2, 0, R.dist);
    scrollToY(R.top + (x / R.dist) * R.range, true);
  });

  /* ---------- Cenas, seção ativa e linha do tempo ---------- */
  const sections = $$('main > section[data-label]');
  const navLinks = $$('.topnav a');
  const timeline = $('.timeline');
  const clipsEl = $('.timeline__clips', timeline);
  const playhead = $('.timeline__head', timeline);
  const tlLabel = $('.timeline__label', timeline);
  const tlTime = $('.timeline__time', timeline);
  let totalSeconds = 0;
  let current = null;

  const clips = sections.map((section) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const label = document.createElement('span');
    a.className = 'clip';
    a.href = `#${section.id}`;
    label.textContent = section.dataset.label;
    a.append(label);
    li.append(a);
    clipsEl.append(li);
    return li;
  });
  timeline.hidden = false;

  const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  // Cada trecho da linha ocupa o espaço de scroll em que a seção está no centro da tela.
  function layoutTimeline() {
    const vh = window.innerHeight;
    const max = Math.max(1, root.scrollHeight - vh);
    sections.forEach((section, i) => {
      const top = topOf(section);
      const start = clamp(top - vh / 2, 0, max);
      const end = clamp(top + section.offsetHeight - vh / 2, 0, max);
      clips[i].style.flexGrow = Math.max(end - start, 1);
    });
    const wordCount = ($('main').innerText.match(/\S+/g) || []).length;
    totalSeconds = Math.round(wordCount / 3.6); // ~215 palavras por minuto
  }

  function updateSections() {
    const vh = window.innerHeight;
    const mid = vh / 2;
    let active = sections[0];
    for (const section of sections) {
      const box = section.getBoundingClientRect();
      if (box.top <= mid && box.bottom > mid) {
        active = section;
        break;
      }
    }
    if (active !== current) {
      current = active;
      root.dataset.scene = active.dataset.scene || 'base';
      tlLabel.textContent = active.dataset.label;
      clips.forEach((li) => {
        const link = li.firstChild;
        if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      navLinks.forEach((link) => link.classList.toggle('is-active', link.hash === `#${active.id}`));
    }
    timeline.classList.toggle('is-shown', window.scrollY > vh * 0.3);
    const p = clamp(window.scrollY / Math.max(1, root.scrollHeight - vh), 0, 1);
    playhead.style.left = `${(p * 100).toFixed(2)}%`;
    tlTime.textContent = `${clock(p * totalSeconds)} / ${clock(totalSeconds)}`;
  }

  /* ---------- Barra do topo ---------- */
  const header = $('.topbar');
  let lastY = window.scrollY;
  function updateHeader() {
    const y = window.scrollY;
    header.classList.toggle('is-solid', y > 24);
    if (Math.abs(y - lastY) > 6) {
      header.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.5);
      lastY = y;
    }
  }

  /* ---------- Laço do scroll ---------- */
  const update = () => {
    updateReel();
    updateScrub();
    updateSections();
    updateHeader();
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  }, { passive: true });
  lenis?.on('scroll', update);

  function layoutAll() {
    spot.radius = parseFloat(getComputedStyle(nameEl).fontSize) * 0.95;
    layoutReel();
    layoutTimeline();
    update();
  }

  let resizeTimer = 0;
  const relayout = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutAll, 120);
  };
  window.addEventListener('resize', relayout);
  // a página muda de altura quando uma linha do arquivo abre ou fecha
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe($('main'));

  /* ---------- Revelação no scroll ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target._reveal || [entry.target]).forEach((el) => el.classList.add('is-in'));
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealEls.forEach((el) => {
      if (el.dataset.reveal !== 'mask') {
        io.observe(el);
        return;
      }
      // O título com máscara começa todo recortado (clip-path) e o observador
      // não o enxerga; quem avisa que ele entrou na tela é o elemento pai.
      const parent = el.parentElement;
      (parent._reveal ||= []).push(el);
      io.observe(parent);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Cursor e botões magnéticos ---------- */
  if (finePointer && !reduceMotion) {
    const cursor = $('.cursor');
    const c = { x: -100, y: -100, tx: -100, ty: -100, running: false };
    root.classList.add('has-cursor');

    const loop = () => {
      c.x += (c.tx - c.x) * 0.25;
      c.y += (c.ty - c.y) * 0.25;
      cursor.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`;
      if (Math.abs(c.tx - c.x) > 0.1 || Math.abs(c.ty - c.y) > 0.1) requestAnimationFrame(loop);
      else c.running = false;
    };

    document.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      c.tx = event.clientX;
      c.ty = event.clientY;
      if (!cursor.classList.contains('is-on')) {
        c.x = c.tx;
        c.y = c.ty;
        cursor.classList.add('is-on');
      }
      if (!c.running) {
        c.running = true;
        requestAnimationFrame(loop);
      }
      const t = event.target;
      const field = t.closest('input:not([type="radio"]), textarea');
      const view = !field && t.closest('[data-cursor="view"]');
      const link = !field && !view && t.closest('a, button, summary, label');
      cursor.classList.toggle('is-hidden', Boolean(field));
      cursor.classList.toggle('is-view', Boolean(view));
      cursor.classList.toggle('is-link', Boolean(link));
    }, { passive: true });
    root.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));

    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        const box = el.getBoundingClientRect();
        const x = (event.clientX - (box.left + box.width / 2)) * 0.28;
        const y = (event.clientY - (box.top + box.height / 2)) * 0.38;
        el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.translate = '';
      });
    });
  }

  /* ---------- Copiar e-mail ---------- */
  const copyStatus = $('#copy-status');
  $$('[data-copy]').forEach((btn) => {
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      let ok = true;
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
      } catch (e) {
        ok = false;
      }
      btn.textContent = ok ? 'Copiado' : 'Copie à mão';
      copyStatus.textContent = ok ? 'E-mail copiado.' : 'Não foi possível copiar o e-mail.';
      setTimeout(() => {
        btn.textContent = label;
      }, 1800);
    });
  });

  /* ---------- Formulário (Formspree) ---------- */
  const form = $('#contactForm');
  const status = $('.form__status', form);

  function setSubject(value) {
    const option = $$('input[name="subject"]', form).find((input) => input.value === value);
    if (option) option.checked = true;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = $('[type="submit"]', form);
    const label = button.textContent;
    const data = new FormData(form);
    data.set('_subject', `Portfólio — ${data.get('subject') || 'Contato'}`);
    button.disabled = true;
    button.textContent = 'Enviando…';
    status.textContent = '';
    try {
      const response = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(String(response.status));
      form.reset();
      status.textContent = 'Mensagem enviada. Respondo no e-mail que você informou.';
    } catch (e) {
      status.textContent = 'Não foi possível enviar agora. Tente de novo ou escreva para ericdudu1999@gmail.com.';
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });

  /* ---------- Início ---------- */
  const fontsReady = document.fonts
    ? Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1200))])
    : Promise.resolve();

  fontsReady.then(() => {
    layoutAll();
    root.classList.add('is-ready');
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) scrollToY(topOf(target), true);
    setTimeout(sweep, 950);
  });
  // se as fontes chegarem depois do tempo de espera, as medidas são refeitas
  document.fonts?.ready.then(relayout);
})();
