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
  const revealElements = Array.from(document.querySelectorAll('.reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = revealElements.indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((el) => observer.observe(el));

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

  // Click to reveal on all devices
  document.querySelectorAll('[data-scratch-card]').forEach((card) => {
    const revealButtons = card.querySelectorAll('.desktop-reveal');
    revealButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        // Add ripple
        const btn = e.currentTarget;
        const circle = document.createElement("span");
        const diameter = Math.max(btn.clientWidth, btn.clientHeight);
        const radius = diameter / 2;
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - btn.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${e.clientY - btn.getBoundingClientRect().top - radius}px`;
        circle.classList.add("ripple");
        btn.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
        
        // Existing logic
        card.classList.add('is-cleared');
        button.setAttribute('aria-expanded', 'true');
      });
    });
  });
})();