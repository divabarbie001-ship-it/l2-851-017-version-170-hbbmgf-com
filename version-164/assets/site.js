import { H as Hls } from './hls.esm.js';

const ready = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
};

const normalize = (value) => String(value || '').toLowerCase().trim();

function setupBrokenImages() {
  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      image.classList.add('is-broken');
    }, { once: true });
  });
}

function setupHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) {
    return;
  }

  const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
  const prev = hero.querySelector('[data-hero-prev]');
  const next = hero.querySelector('[data-hero-next]');
  let active = 0;
  let timer = null;

  const show = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === active);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === active);
      dot.setAttribute('aria-current', dotIndex === active ? 'true' : 'false');
    });
  };

  const restart = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(active + 1), 5000);
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      show(index);
      restart();
    });
  });

  if (prev) {
    prev.addEventListener('click', () => {
      show(active - 1);
      restart();
    });
  }

  if (next) {
    next.addEventListener('click', () => {
      show(active + 1);
      restart();
    });
  }

  show(0);
  restart();
}

function setupFilters() {
  document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
    const search = scope.querySelector('[data-filter-search]');
    const year = scope.querySelector('[data-filter-year]');
    const region = scope.querySelector('[data-filter-region]');
    const type = scope.querySelector('[data-filter-type]');
    const cards = Array.from(scope.querySelectorAll('[data-movie-card]'));
    const count = scope.querySelector('[data-filter-count]');
    const empty = scope.querySelector('[data-empty-state]');

    const apply = () => {
      const keyword = normalize(search?.value);
      const yearValue = normalize(year?.value);
      const regionValue = normalize(region?.value);
      const typeValue = normalize(type?.value);
      let visible = 0;

      cards.forEach((card) => {
        const haystack = normalize(card.dataset.searchText);
        const matchKeyword = !keyword || haystack.includes(keyword);
        const matchYear = !yearValue || normalize(card.dataset.year) === yearValue;
        const matchRegion = !regionValue || normalize(card.dataset.region).includes(regionValue);
        const matchType = !typeValue || normalize(card.dataset.type).includes(typeValue);
        const isVisible = matchKeyword && matchYear && matchRegion && matchType;

        card.hidden = !isVisible;
        if (isVisible) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = `当前显示 ${visible} 部 / 共 ${cards.length} 部`;
      }

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    };

    [search, year, region, type].forEach((control) => {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });

    apply();
  });
}

function setupPlayer() {
  const player = document.querySelector('[data-hls-player]');
  if (!player) {
    return;
  }

  const video = player.querySelector('video');
  const button = player.querySelector('[data-play-button]');
  const overlay = player.querySelector('[data-play-overlay]');
  const status = player.querySelector('[data-player-status]');
  const source = player.dataset.source;
  let hls = null;
  let initialized = false;

  const setStatus = (message) => {
    if (status) {
      status.textContent = message;
    }
  };

  const initialize = () => {
    if (initialized || !video || !source) {
      return;
    }

    initialized = true;
    setStatus('正在初始化高清播放源…');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      setStatus('播放源已绑定，可直接播放。');
      return;
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus('播放源加载完成。');
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data && data.fatal) {
          setStatus('播放源暂时无法加载，请刷新或稍后重试。');
          if (hls) {
            hls.destroy();
            hls = null;
          }
          initialized = false;
        }
      });
      return;
    }

    video.src = source;
    setStatus('当前浏览器不支持 HLS.js，已尝试使用原生播放。');
  };

  if (button) {
    button.addEventListener('click', async () => {
      initialize();
      video.classList.add('is-ready');
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      try {
        await video.play();
      } catch (error) {
        setStatus('浏览器阻止了自动播放，请再次点击播放器开始观看。');
      }
    });
  }

  window.addEventListener('beforeunload', () => {
    if (hls) {
      hls.destroy();
    }
  });
}

ready(() => {
  setupBrokenImages();
  setupHero();
  setupFilters();
  setupPlayer();
});
