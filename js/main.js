(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Modo revisão ---------- */
  const reviewBtn = $('#reviewToggle');
  try { if (localStorage.getItem('vl-review') === 'off') body.classList.add('no-review'); } catch (e) {}
  const syncReviewLabel = () => {
    reviewBtn.textContent = body.classList.contains('no-review') ? 'Mostrar destaques' : 'Ocultar destaques';
  };
  syncReviewLabel();
  reviewBtn.addEventListener('click', () => {
    body.classList.toggle('no-review');
    try { localStorage.setItem('vl-review', body.classList.contains('no-review') ? 'off' : 'on'); } catch (e) {}
    syncReviewLabel();
  });

  /* ---------- Menu mobile ---------- */
  const menuBtn = $('#menuBtn');
  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  $$('#nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Faixa: duplica o conteúdo para o loop contínuo ---------- */
  const strip = $('.strip__inner');
  strip.innerHTML += strip.innerHTML.replace(/<span>/g, '<span aria-hidden="true">');

  /* ---------- Entrada dos elementos ao rolar ---------- */
  // Escalonamento: elementos irmãos com .reveal entram em sequência
  $$('.cards, .steps, .faq').forEach(group => {
    $$('.reveal', group).forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 5) * 0.08}s`));
  });
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('is-visible');
      revealIO.unobserve(el);
      if (el.matches('.hero__text, .hero__photo, .about__photo')) setTimeout(() => el.classList.add('settled'), 1000);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.reveal').forEach(el => revealIO.observe(el));

  /* ---------- Link ativo no menu conforme a seção ---------- */
  const links = $$('#nav a[href^="#"]');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const navIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => navIO.observe(s));

  /* ---------- Efeitos ligados ao scroll (um único rAF) ---------- */
  const header = $('#header');
  const progress = $('.progress');
  const hero = $('.hero');
  const heroText = $('.hero__text');
  const heroPhoto = $('.hero__photo');
  const aboutPhoto = $('.about__photo');
  const steps = $('.steps');
  const stepItems = $$('.step');
  const office = $('.office .photo-slot');
  const wa = $('.wa-float');

  let lastY = scrollY;
  let ticking = false;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  const update = () => {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;
    const max = root.scrollHeight - vh;

    // Progresso de leitura
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);

    // Cabeçalho: fica sólido após o topo e se esconde ao descer (volta ao subir)
    header.classList.toggle('is-scrolled', y > 24);
    if (!body.classList.contains('menu-open')) {
      header.classList.toggle('is-hidden', y > vh * 0.9 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove('is-hidden');
    }
    lastY = y;

    // Botão do WhatsApp aparece depois do hero
    wa.classList.toggle('is-shown', y > vh * 0.55);

    // Linha do tempo: preenche conforme a rolagem e acende cada etapa
    const sr = steps.getBoundingClientRect();
    const fill = clamp((vh * 0.65 - sr.top) / sr.height);
    steps.style.setProperty('--fill', fill.toFixed(4));
    stepItems.forEach((s, i) => s.classList.toggle('is-done', fill >= (i + 0.15) / stepItems.length || fill >= 0.98));

    if (reduceMotion) return;

    // Hero: texto sobe e esmaece, foto em parallax mais lento
    const h = hero.offsetHeight;
    if (y < h) {
      const t = y / h;
      heroText.style.setProperty('--hero-shift', `${(t * 80).toFixed(1)}px`);
      hero.style.setProperty('--hero-fade', (1 - t * 1.1).toFixed(3));
      heroPhoto.style.setProperty('--photo-shift', `${(t * -50).toFixed(1)}px`);
    }

    // Parallax suave da foto "Sobre"
    const ar = aboutPhoto.getBoundingClientRect();
    if (ar.bottom > 0 && ar.top < vh) {
      const t = (ar.top + ar.height / 2 - vh / 2) / vh; // -1..1
      aboutPhoto.style.setProperty('--par', `${(t * 40).toFixed(1)}px`);
    }

    // Foto do escritório: leve zoom-out conforme passa
    const or = office.getBoundingClientRect();
    if (or.bottom > 0 && or.top < vh) {
      const t = clamp(1 - (or.top + or.height) / (vh + or.height));
      office.style.setProperty('--office-scale', (1.12 - t * 0.12).toFixed(4));
    }
  };

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  update();
})();
