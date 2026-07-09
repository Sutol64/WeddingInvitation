(() => {
  'use strict';

  // ─── PRELOADER ──────────────────────────────────────────────
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('hidden'), 800);
  });

  // ─── THEME – system preference + manual toggle ─────────────
  const root = document.documentElement;
  const themeToggle = document.querySelector('[data-theme-toggle]');

  const storedTheme = localStorage.getItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  let currentTheme = storedTheme || systemTheme;

  const applyTheme = (mode) => {
    currentTheme = mode;
    root.setAttribute('data-theme', mode);
    localStorage.setItem('theme', mode);
    const icon = themeToggle?.querySelector('i');
    if (icon) {
      icon.className = mode === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  };

  applyTheme(currentTheme);

  themeToggle?.addEventListener('click', () => {
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    themeToggle.classList.add('is-pressed');
    setTimeout(() => themeToggle.classList.remove('is-pressed'), 150);
  });

  // ─── MOBILE MENU ────────────────────────────────────────────
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const primaryNav = document.querySelector('.primary-nav');
  menuToggle?.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true' ? false : true;
    menuToggle.setAttribute('aria-expanded', expanded);
    primaryNav.classList.toggle('open');
  });
  primaryNav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      primaryNav.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  // ─── SCROLL REVEAL ──────────────────────────────────────────
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealElements.forEach(el => revealObserver.observe(el));

  // ─── COUNTDOWN RING ─────────────────────────────────────────
  const countdownEl = document.querySelector('[data-countdown]');
  if (countdownEl) {
    const target = new Date(countdownEl.dataset.countdown).getTime();
    const ring = countdownEl.querySelector('.ring-progress');
    const units = {
      days: countdownEl.querySelector('[data-unit="days"]'),
      hours: countdownEl.querySelector('[data-unit="hours"]'),
      minutes: countdownEl.querySelector('[data-unit="minutes"]'),
      seconds: countdownEl.querySelector('[data-unit="seconds"]')
    };
    const circumference = 2 * Math.PI * 68;
    countdownEl._startTime = Date.now();
    countdownEl._totalMs = Math.max(1, target - countdownEl._startTime);

    const update = () => {
      const now = Date.now();
      let diff = Math.max(0, target - now);
      const days = Math.floor(diff / 86400000);
      diff -= days * 86400000;
      const hours = Math.floor(diff / 3600000);
      diff -= hours * 3600000;
      const minutes = Math.floor(diff / 60000);
      diff -= minutes * 60000;
      const seconds = Math.floor(diff / 1000);

      const values = { days, hours, minutes, seconds };
      Object.keys(values).forEach(key => {
        const el = units[key];
        if (el) {
          const str = String(values[key]).padStart(2, '0');
          if (el.textContent !== str) {
            el.textContent = str;
            el.classList.remove('countdown-tick');
            void el.offsetWidth;
            el.classList.add('countdown-tick');
            setTimeout(() => el.classList.remove('countdown-tick'), 600);
          }
        }
      });

      const elapsed = now - countdownEl._startTime;
      const progress = Math.min(1, elapsed / countdownEl._totalMs);
      const offset = circumference * (1 - progress);
      ring.style.strokeDashoffset = offset;
      const primaryColor = getComputedStyle(root).getPropertyValue('--primary-soft').trim() || '#1a2a5c';
      ring.style.stroke = progress > 0.9 ? '#c0392b' : primaryColor;
    };

    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference;
    update();
    setInterval(update, 1000);
  }

  // ─── EVENTS CAROUSEL – with auto-rotate ────────────────────
  const carousel = document.getElementById('eventsCarousel');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('carouselDots');
  let currentIndex = 0;
  let cardWidth = 0;
  let visibleCards = 1;
  let autoRotateInterval = null;
  const ROTATE_DELAY = 4000;

  const getVisibleCards = () => {
    if (window.innerWidth < 820) return 1;
    if (window.innerWidth < 1100) return 2;
    return 3;
  };

  const getMaxIndex = () => {
    const cards = carousel?.querySelectorAll('.event-card') || [];
    const total = cards.length;
    return Math.max(0, total - getVisibleCards());
  };

  const updateCarousel = (animate = true) => {
    if (!carousel) return;
    visibleCards = getVisibleCards();
    const cards = carousel.querySelectorAll('.event-card');
    const total = cards.length;
    const maxIndex = getMaxIndex();
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    const wrapper = carousel.parentElement;
    const containerWidth = wrapper ? wrapper.clientWidth - 40 : 600;
    cardWidth = Math.max(200, (containerWidth - (visibleCards - 1) * 24) / visibleCards);
    cards.forEach(c => c.style.flex = `0 0 ${cardWidth}px`);
    const offset = currentIndex * (cardWidth + 24);
    carousel.style.transform = `translateX(-${offset}px)`;
    carousel.style.transition = animate ? 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';

    // dots
    const dotCount = Math.ceil(total / visibleCards);
    const existingDots = dotsContainer?.querySelectorAll('button') || [];
    if (existingDots.length !== dotCount && dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `Go to slide ${i+1}`);
        dot.addEventListener('click', () => {
          stopAutoRotate();
          currentIndex = i * visibleCards;
          updateCarousel();
          startAutoRotate();
        });
        dotsContainer.appendChild(dot);
      }
    }
    const dotButtons = dotsContainer?.querySelectorAll('button') || [];
    const activeDot = Math.floor(currentIndex / visibleCards);
    dotButtons.forEach((dot, i) => dot.classList.toggle('active', i === activeDot));
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
  };

  const goToNext = () => {
    const maxIndex = getMaxIndex();
    const step = getVisibleCards();
    if (currentIndex + step <= maxIndex) {
      currentIndex += step;
    } else {
      currentIndex = 0;
    }
    updateCarousel();
  };

  const startAutoRotate = () => {
    stopAutoRotate();
    autoRotateInterval = setInterval(goToNext, ROTATE_DELAY);
  };

  const stopAutoRotate = () => {
    if (autoRotateInterval) {
      clearInterval(autoRotateInterval);
      autoRotateInterval = null;
    }
  };

  const pauseAndResume = () => {
    stopAutoRotate();
    clearTimeout(window._resumeTimer);
    window._resumeTimer = setTimeout(() => {
      startAutoRotate();
    }, 6000);
  };

  prevBtn?.addEventListener('click', () => {
    const step = getVisibleCards();
    currentIndex = Math.max(0, currentIndex - step);
    updateCarousel();
    pauseAndResume();
  });

  nextBtn?.addEventListener('click', () => {
    const step = getVisibleCards();
    const maxIndex = getMaxIndex();
    currentIndex = Math.min(maxIndex, currentIndex + step);
    updateCarousel();
    pauseAndResume();
  });

  const cards = carousel?.querySelectorAll('.event-card');
  cards?.forEach(card => {
    card.addEventListener('mouseenter', stopAutoRotate);
    card.addEventListener('mouseleave', () => {
      if (!autoRotateInterval) {
        clearTimeout(window._resumeTimer);
        window._resumeTimer = setTimeout(startAutoRotate, 2000);
      }
    });
    card.addEventListener('touchstart', () => {
      stopAutoRotate();
      clearTimeout(window._resumeTimer);
      window._resumeTimer = setTimeout(startAutoRotate, 5000);
    });
  });

  window.addEventListener('resize', () => {
    updateCarousel(false);
    if (!autoRotateInterval) {
      clearTimeout(window._resumeTimer);
      window._resumeTimer = setTimeout(startAutoRotate, 2000);
    }
  });

  setTimeout(() => {
    updateCarousel(false);
    startAutoRotate();
  }, 500);

  // ─── BLESSINGS FORM ─────────────────────────────────────────
  const form = document.getElementById('blessingForm');
  const feed = document.getElementById('blessingsFeed');
  const blessCount = document.getElementById('blessCount');

  const loadBlessings = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('blessings') || '[]');
      stored.forEach(b => addBlessingToFeed(b.name, b.relation, b.message, b.time, false));
      updateCount();
    } catch (e) {}
  };
  loadBlessings();

  const updateCount = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('blessings') || '[]');
      if (blessCount) blessCount.textContent = stored.length;
    } catch (e) {}
  };

  const addBlessingToFeed = (name, relation, message, time, save = true) => {
    if (!feed) return;
    const item = document.createElement('div');
    item.className = 'blessing-item';
    const relHtml = relation ? `<span class="bless-relation">· ${escapeHtml(relation)}</span>` : '';
    item.innerHTML = `
      <strong>${escapeHtml(name)}</strong> ${relHtml}
      <div class="bless-text">${escapeHtml(message)}</div>
      <span class="bless-time">${time || new Date().toLocaleString()}</span>
    `;
    feed.prepend(item);
    if (save) {
      try {
        const stored = JSON.parse(localStorage.getItem('blessings') || '[]');
        stored.unshift({ name, relation, message, time: new Date().toLocaleString() });
        if (stored.length > 50) stored.pop();
        localStorage.setItem('blessings', JSON.stringify(stored));
        updateCount();
      } catch (e) {}
    }
  };

  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('blessName');
    const relationInput = document.getElementById('blessRelation');
    const msgInput = document.getElementById('blessMsg');
    const name = nameInput?.value.trim() || 'A guest';
    const relation = relationInput?.value.trim() || '';
    const message = msgInput?.value.trim() || 'Wishing you a blessed life together!';
    if (message) {
      addBlessingToFeed(name, relation, message, null, true);
      if (nameInput) nameInput.value = '';
      if (relationInput) relationInput.value = '';
      if (msgInput) msgInput.value = '';
      const btn = form.querySelector('.button');
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
        setTimeout(() => btn.innerHTML = original, 2000);
      }
    }
  });

  // ─── FLOATING PETALS & STARS ───────────────────────────────
  const petalsContainer = document.getElementById('petalsContainer');
  if (petalsContainer) {
    const symbols = ['✿', '🌸', '🌺', '✽', '❁'];
    for (let i = 0; i < 18; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.textContent = symbols[i % symbols.length];
      const size = 0.8 + Math.random() * 1.2;
      petal.style.fontSize = size + 'rem';
      petal.style.left = Math.random() * 100 + '%';
      petal.style.animationDuration = (12 + Math.random() * 18) + 's';
      petal.style.animationDelay = (Math.random() * 20) + 's';
      petal.style.opacity = 0.08 + Math.random() * 0.12;
      petalsContainer.appendChild(petal);
    }
  }

  // Stars (canvas)
  const canvas = document.getElementById('starCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    let W, H;

    const resize = () => {
      W = canvas.width = canvas.parentElement.offsetWidth;
      H = canvas.height = canvas.parentElement.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const initStars = (count = 80) => {
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.2,
          speed: Math.random() * 0.02 + 0.005,
        });
      }
    };
    initStars();

    const drawStars = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.fill();
        s.alpha += (Math.random() - 0.5) * 0.02;
        s.alpha = Math.min(0.8, Math.max(0.1, s.alpha));
      });
      requestAnimationFrame(drawStars);
    };
    drawStars();
  }

  // ─── BACK TO TOP ────────────────────────────────────────────
  const backBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (backBtn) {
      backBtn.classList.toggle('visible', window.scrollY > 400);
    }
  });
  backBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ─── ACTIVE NAV LINKS (header + floating) ──────────────────
  const navLinks = document.querySelectorAll('.primary-nav a, .floating-nav a');
  const sections = document.querySelectorAll('section[id]');
  const navObserver = new IntersectionObserver((entries) => {
    let currentId = '';
    entries.forEach(entry => {
      if (entry.isIntersecting) currentId = entry.target.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }, { threshold: 0.3, rootMargin: '0px 0px -100px 0px' });
  sections.forEach(section => navObserver.observe(section));

  // ─── EVENT CARD GLOW FOLLOW MOUSE ──────────────────────────
  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--x', x + '%');
      card.style.setProperty('--y', y + '%');
    });
  });

})();