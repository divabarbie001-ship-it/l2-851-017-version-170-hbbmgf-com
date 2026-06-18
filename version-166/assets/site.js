(() => {
  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  };

  const normalize = (value) => String(value || '').toLowerCase().trim();

  function initMobileNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.mobile-menu');

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function initHeroCarousel() {
    const carousel = document.querySelector('[data-hero-carousel]');

    if (!carousel) {
      return;
    }

    const slides = Array.from(carousel.querySelectorAll('.hero-slide'));
    const dots = Array.from(carousel.querySelectorAll('.hero-dot'));
    const prev = carousel.querySelector('[data-hero-prev]');
    const next = carousel.querySelector('[data-hero-next]');
    let index = 0;
    let timer = null;

    const show = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    };

    const start = () => {
      stop();
      timer = window.setInterval(() => show(index + 1), 5200);
    };

    const stop = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    prev?.addEventListener('click', () => {
      show(index - 1);
      start();
    });

    next?.addEventListener('click', () => {
      show(index + 1);
      start();
    });

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        show(Number(dot.dataset.slideIndex || 0));
        start();
      });
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initFilters() {
    const panels = Array.from(document.querySelectorAll('.filter-panel'));

    panels.forEach((panel) => {
      const scope = panel.closest('.content-section') || document;
      const cards = Array.from(scope.querySelectorAll('[data-movie-card]'));
      const queryInput = panel.querySelector('[data-filter-query]');
      const categorySelect = panel.querySelector('[data-filter-category]');
      const typeSelect = panel.querySelector('[data-filter-type]');
      const yearInput = panel.querySelector('[data-filter-year]');
      const count = panel.querySelector('[data-filter-count]');

      const update = () => {
        const query = normalize(queryInput?.value);
        const category = normalize(categorySelect?.value);
        const type = normalize(typeSelect?.value);
        const year = normalize(yearInput?.value);
        let visible = 0;

        cards.forEach((card) => {
          const haystack = normalize([
            card.dataset.title,
            card.dataset.region,
            card.dataset.year,
            card.dataset.type,
            card.dataset.category,
            card.dataset.tags,
          ].join(' '));
          const matchesQuery = !query || haystack.includes(query);
          const matchesCategory = !category || normalize(card.dataset.category) === category;
          const matchesType = !type || normalize(card.dataset.type).includes(type);
          const matchesYear = !year || normalize(card.dataset.year).includes(year);
          const shouldShow = matchesQuery && matchesCategory && matchesType && matchesYear;

          card.classList.toggle('is-hidden', !shouldShow);
          if (shouldShow) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = `当前显示 ${visible} 部影片`;
        }
      };

      [queryInput, categorySelect, typeSelect, yearInput].forEach((control) => {
        control?.addEventListener('input', update);
        control?.addEventListener('change', update);
      });

      update();
    });
  }

  function setPlayerStatus(container, message) {
    const status = container.querySelector('[data-player-status]');

    if (status) {
      status.textContent = message;
    }
  }

  function loadHlsScript() {
    return new Promise((resolve, reject) => {
      if (window.Hls) {
        resolve(window.Hls);
        return;
      }

      const existing = document.querySelector('script[data-hls-loader]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.Hls));
        existing.addEventListener('error', reject);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
      script.async = true;
      script.dataset.hlsLoader = 'true';
      script.onload = () => resolve(window.Hls);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function bindVideoSource(container, video, sourceUrl) {
    if (!sourceUrl) {
      setPlayerStatus(container, '当前影片没有可用播放地址。');
      return false;
    }

    if (container._hlsInstance) {
      container._hlsInstance.destroy();
      container._hlsInstance = null;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl;
      setPlayerStatus(container, '已使用浏览器原生 HLS 能力加载播放源。');
      return true;
    }

    try {
      const Hls = await loadHlsScript();

      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
        container._hlsInstance = hls;
        setPlayerStatus(container, 'HLS 播放器已初始化，播放源已绑定。');
        return true;
      }
    } catch (error) {
      setPlayerStatus(container, 'HLS 脚本加载失败，请检查网络后重试。');
      return false;
    }

    setPlayerStatus(container, '当前浏览器不支持 HLS 播放。');
    return false;
  }

  function initPlayers() {
    const players = Array.from(document.querySelectorAll('.js-player'));

    players.forEach((container) => {
      const video = container.querySelector('video');
      const overlay = container.querySelector('[data-play-button]');
      const sourceButtons = Array.from(container.querySelectorAll('.source-button'));
      let activeSource = container.dataset.defaultSource || sourceButtons[0]?.dataset.source || '';
      let sourceBound = false;

      if (!video) {
        return;
      }

      const selectSource = async (button) => {
        activeSource = button.dataset.source || activeSource;
        sourceButtons.forEach((item) => item.classList.toggle('is-active', item === button));
        setPlayerStatus(container, `已选择${button.textContent.trim()}，点击播放即可开始。`);

        if (sourceBound) {
          await bindVideoSource(container, video, activeSource);
          video.play().catch(() => {
            setPlayerStatus(container, '播放已加载，请手动点击视频控件继续。');
          });
        }
      };

      sourceButtons.forEach((button) => {
        button.addEventListener('click', () => selectSource(button));
      });

      overlay?.addEventListener('click', async () => {
        overlay.classList.add('is-hidden');
        sourceBound = await bindVideoSource(container, video, activeSource);

        if (sourceBound) {
          video.play().catch(() => {
            setPlayerStatus(container, '播放源已加载，请使用视频控件开始播放。');
          });
        } else {
          overlay.classList.remove('is-hidden');
        }
      });
    });
  }

  ready(() => {
    initMobileNavigation();
    initHeroCarousel();
    initFilters();
    initPlayers();
  });
})();
