(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const applyTheme = (mode) => {
    theme = mode;
    root.setAttribute('data-theme', mode);
    if (toggle) {
      const next = mode === 'dark' ? 'light' : 'dark';
      toggle.setAttribute('aria-label', `Switch to ${next} mode`);
      toggle.textContent = mode === 'dark' ? '☾' : '☀';
    }
  };

  applyTheme(theme);

  toggle?.addEventListener('click', () => {
    // small press animation
    toggle.classList.remove('is-pressed');
    void toggle.offsetWidth;
    toggle.classList.add('is-pressed');
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  });

  // Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  // Countdown
  document.querySelectorAll('[data-countdown]').forEach((countdown) => {
    const target = new Date(countdown.dataset.countdown).getTime();
    const fields = {
      days: countdown.querySelector('[data-unit="days"]'),
      hours: countdown.querySelector('[data-unit="hours"]'),
      minutes: countdown.querySelector('[data-unit="minutes"]'),
      seconds: countdown.querySelector('[data-unit="seconds"]')
    };

    const render = () => {
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor(diff / 3600000) % 24;
      const minutes = Math.floor(diff / 60000) % 60;
      const seconds = Math.floor(diff / 1000) % 60;
      const nextValues = { days, hours, minutes, seconds };

      Object.entries(nextValues).forEach(([unit, value]) => {
        const el = fields[unit];
        if (!el) return;
        const formatted = String(value).padStart(2, '0');
        if (el.textContent !== formatted) {
          el.textContent = formatted;
          el.classList.remove('countdown-tick');
          void el.offsetWidth;
          el.classList.add('countdown-tick');
        }
      });
    };

    render();
    window.setInterval(render, 1000);
  });

  const mobileReveal = window.matchMedia('(max-width: 768px)');

  // Scratch card
  document.querySelectorAll('[data-scratch-card]').forEach((card) => {
    const canvas = card.querySelector('.scratch-canvas');
    const desktopButton = card.querySelector('.desktop-reveal');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let drawing = false;

    const paintOverlay = () => {
      if (!mobileReveal.matches) return;
      const rect = card.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      const gold = ctx.createLinearGradient(0, 0, width, height);
      gold.addColorStop(0, '#8e5b14');
      gold.addColorStop(0.18, '#f2d27e');
      gold.addColorStop(0.36, '#fff0b8');
      gold.addColorStop(0.58, '#c78d2f');
      gold.addColorStop(0.8, '#f5d978');
      gold.addColorStop(1, '#8a5a1f');
      ctx.fillStyle = gold;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 1400; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.8;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(122,21,34,0.10)';
        ctx.fillRect(x, y, size, size);
      }

      const sheen = ctx.createLinearGradient(-width * 0.2, 0, width * 1.2, height);
      sheen.addColorStop(0.2, 'rgba(255,255,255,0)');
      sheen.addColorStop(0.45, 'rgba(255,255,255,0.32)');
      sheen.addColorStop(0.55, 'rgba(255,255,255,0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'destination-out';
    };

    const scratchAt = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
    };

    const revealProgress = () => {
      if (!mobileReveal.matches) return;
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      for (let i = 3; i < pixels.length; i += 72) {
        if (pixels[i] === 0) transparent += 1;
      }
      const total = Math.ceil((pixels.length / 4) / 18);
      if (transparent / total > 0.45) card.classList.add('is-cleared');
    };

    paintOverlay();
    window.addEventListener('resize', paintOverlay);
    mobileReveal.addEventListener?.('change', paintOverlay);

    desktopButton?.addEventListener('click', () => card.classList.add('is-cleared'));

    canvas.addEventListener('pointerdown', (event) => {
      if (!mobileReveal.matches) return;
      drawing = true;
      scratchAt(event.clientX, event.clientY);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!drawing || !mobileReveal.matches) return;
      scratchAt(event.clientX, event.clientY);
      revealProgress();
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((type) => {
      canvas.addEventListener(type, () => {
        drawing = false;
        revealProgress();
      });
    });
  });
})();