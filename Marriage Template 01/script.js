(() => {
  'use strict';

  // ─── PRELOADER ──────────────────────────────────────────────
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
    }, 800);
  });

  // ─── THEME TOGGLE ──────────────────────────────────────────
  const root = document.documentElement;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  let currentTheme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

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
    // Haptic feedback (optional)
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

  // Close menu on link click
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
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Optional: unobserve after reveal
        // revealObserver.unobserve(entry.target);
      }
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
    const circumference = 2 * Math.PI * 68; // r=68

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
            // optional pulse
            el.classList.remove('countdown-tick');
            void el.offsetWidth;
            el.classList.add('countdown-tick');
            setTimeout(() => el.classList.remove('countdown-tick'), 600);
          }
        }
      });

      // Update ring progress (based on total seconds until target)
      const totalSeconds = (target - now) / 1000;
      const maxSeconds = (target - new Date(target).setHours(0,0,0,0)) / 1000; // not perfect, but ok
      // Better: use total days as fraction
      const totalMs = target - Date.now();
      const totalDuration = target - new Date(target).setHours(0,0,0,0); // approx 24h? Actually we need total from now until target in ms, but we can use a fixed total if we know start? For simplicity, we just animate based on days remaining.
      // We'll use days fraction: 1 day = 100% of ring? We want ring to complete when days=0.
      // Simpler: map progress to (1 - days/maxDays) where maxDays is initial days. But we don't know initial.
      // Better: compute progress based on milliseconds elapsed since start of day? Let's use a simpler approach: progress = 1 - (diff / (86400000 * 30))? Not accurate.
      // Instead, use a linear progress from now until target date, assuming we know the total duration from now to target? That changes.
      // We'll set ring to represent days remaining: full ring when days=0? Actually it should count down to zero.
      // Let's use a fixed max value: e.g., 30 days? Not robust.
      // We'll just set progress based on seconds left within a 24h day? No.
      // Let's do: progress = (days_remaining / total_days) where total_days is days from now to target? We can compute on load.
      // We'll compute totalDays at start, then each update use days/totalDays.
      // But we want ring to represent overall countdown, so we need total duration from now to target.
      // Let's set a fixed total of 30 days? Not accurate.
      // Instead, use a percentage based on the year? Not needed.
      // We'll simply use the fraction of time remaining relative to the total time from page load to target.
      // So we store initial timestamp and compute progress.
      if (!countdownEl._startTime) {
        countdownEl._startTime = Date.now();
        countdownEl._totalMs = target - countdownEl._startTime;
      }
      const elapsed = Date.now() - countdownEl._startTime;
      const progress = Math.min(1, elapsed / countdownEl._totalMs);
      const offset = circumference * (1 - progress);
      ring.style.strokeDashoffset = offset;

      // Also change color when near the end?
      if (progress > 0.9) {
        ring.style.stroke = '#c0392b';
      } else {
        ring.style.stroke = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#b8860b';
      }
    };

    // Set initial ring state
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference;

    update();
    setInterval(update, 1000);
  }

  // ─── BLESSINGS FORM ─────────────────────────────────────────
  const form = document.getElementById('blessingForm');
  const feed = document.getElementById('blessingsFeed');

  // Load stored blessings
  const loadBlessings = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('blessings') || '[]');
      stored.forEach(b => addBlessingToFeed(b.name, b.message, b.time, false));
    } catch (e) {}
  };
  loadBlessings();

  const addBlessingToFeed = (name, message, time, save = true) => {
    const item = document.createElement('div');
    item.className = 'blessing-item';
    item.innerHTML = `
      <strong>${escapeHtml(name)}</strong>
      <div class="bless-text">${escapeHtml(message)}</div>
      <span class="bless-time">${time || new Date().toLocaleString()}</span>
    `;
    feed.prepend(item);

    if (save) {
      // Store in localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('blessings') || '[]');
        stored.unshift({ name, message, time: new Date().toLocaleString() });
        if (stored.length > 50) stored.pop();
        localStorage.setItem('blessings', JSON.stringify(stored));
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
    const msgInput = document.getElementById('blessMsg');
    const name = nameInput.value.trim() || 'A guest';
    const message = msgInput.value.trim() || 'Wishing you a blessed life together!';
    if (message) {
      addBlessingToFeed(name, message, null, true);
      nameInput.value = '';
      msgInput.value = '';
      // subtle feedback
      const btn = form.querySelector('.button');
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
      setTimeout(() => btn.innerHTML = original, 2000);
    }
  });

  // ─── FLOATING PETALS ────────────────────────────────────────
  const petalsContainer = document.getElementById('petalsContainer');
  if (petalsContainer) {
    const petalSymbols = ['✿', '🌸', '🌺', '✽', '❁'];
    for (let i = 0; i < 18; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.textContent = petalSymbols[i % petalSymbols.length];
      const size = 0.8 + Math.random() * 1.2;
      petal.style.fontSize = size + 'rem';
      petal.style.left = Math.random() * 100 + '%';
      petal.style.animationDuration = (12 + Math.random() * 18) + 's';
      petal.style.animationDelay = (Math.random() * 20) + 's';
      petal.style.opacity = 0.08 + Math.random() * 0.12;
      petalsContainer.appendChild(petal);
    }
  }

  // ─── ACTIVE NAV LINK ────────────────────────────────────────
  const navLinks = document.querySelectorAll('.primary-nav a');
  const sections = document.querySelectorAll('section[id]');
  const observerNav = new IntersectionObserver((entries) => {
    let currentId = '';
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        currentId = entry.target.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }, { threshold: 0.3, rootMargin: '0px 0px -100px 0px' });
  sections.forEach(section => observerNav.observe(section));

})();