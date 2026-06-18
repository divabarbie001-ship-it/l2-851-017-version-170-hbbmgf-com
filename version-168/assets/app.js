(function () {
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');

  if (mobileToggle && mobilePanel) {
    mobileToggle.addEventListener('click', function () {
      mobilePanel.classList.toggle('open');
    });
  }

  document.querySelectorAll('[data-header-search]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const input = form.querySelector('input[name="q"]');
      const value = input ? input.value.trim() : '';
      const url = value ? './search.html?q=' + encodeURIComponent(value) : './search.html';
      window.location.href = url;
    });
  });

  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const slides = Array.from(hero.querySelectorAll('.hero-slide'));
    const dots = Array.from(hero.querySelectorAll('.hero-dot'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let current = 0;
    let timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  document.querySelectorAll('[data-card-filter]').forEach(function (wrap) {
    const input = wrap.querySelector('[data-filter-input]');
    const chips = Array.from(wrap.querySelectorAll('[data-filter-chip]'));
    const cards = Array.from(document.querySelectorAll('[data-search]'));
    const empty = document.querySelector('[data-empty-state]');
    let active = 'all';

    function apply() {
      const q = input ? input.value.trim().toLowerCase() : '';
      let visible = 0;
      cards.forEach(function (card) {
        const text = card.getAttribute('data-search') || '';
        const genre = card.getAttribute('data-genre') || '';
        const matchesText = !q || text.indexOf(q) !== -1;
        const matchesGenre = active === 'all' || genre === active;
        const showCard = matchesText && matchesGenre;
        card.style.display = showCard ? '' : 'none';
        if (showCard) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle('show', visible === 0);
      }
    }

    if (input) {
      input.addEventListener('input', apply);
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        active = chip.getAttribute('data-filter-chip') || 'all';
        chips.forEach(function (item) {
          item.classList.toggle('active', item === chip);
        });
        apply();
      });
    });

    apply();
  });

  const searchRoot = document.querySelector('[data-search-page]');
  if (searchRoot && window.MovieSearchData) {
    const input = searchRoot.querySelector('[data-search-input]');
    const genreSelect = searchRoot.querySelector('[data-search-genre]');
    const yearSelect = searchRoot.querySelector('[data-search-year]');
    const result = searchRoot.querySelector('[data-search-results]');
    const empty = searchRoot.querySelector('[data-empty-state]');
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q') || '';

    function escapeHtml(value) {
      return String(value).replace(/[&<>"]/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;'
        }[char];
      });
    }

    function card(movie) {
      return '<article class="movie-card">' +
        '<a class="poster-link" href="' + escapeHtml(movie.url) + '">' +
        '<span class="poster-frame">' +
        '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
        '<span class="poster-shade"></span>' +
        '<span class="card-badge">' + escapeHtml(movie.genre) + '</span>' +
        '<span class="card-score">★ ' + escapeHtml(movie.rating) + '</span>' +
        '</span>' +
        '</a>' +
        '<div class="movie-card-body">' +
        '<h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>' +
        '<p class="card-meta">' + escapeHtml(movie.year) + ' · ' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.duration) + '</p>' +
        '<p class="card-line">' + escapeHtml(movie.oneLine) + '</p>' +
        '<div class="card-actions"><a class="text-link" href="' + escapeHtml(movie.url) + '">立即观看</a><span>' + escapeHtml(movie.type) + '</span></div>' +
        '</div>' +
        '</article>';
    }

    function fillOptions() {
      const genres = Array.from(new Set(window.MovieSearchData.map(function (movie) {
        return movie.genre;
      }))).sort();
      const years = Array.from(new Set(window.MovieSearchData.map(function (movie) {
        return movie.year;
      }))).sort().reverse();

      genres.forEach(function (genre) {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
      });

      years.forEach(function (year) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
      });
    }

    function runSearch() {
      const q = input.value.trim().toLowerCase();
      const genre = genreSelect.value;
      const year = yearSelect.value;
      const items = window.MovieSearchData.filter(function (movie) {
        const text = [movie.title, movie.genre, movie.region, movie.type, movie.year, movie.oneLine].join(' ').toLowerCase();
        return (!q || text.indexOf(q) !== -1) && (!genre || movie.genre === genre) && (!year || movie.year === year);
      }).slice(0, 96);

      result.innerHTML = items.map(card).join('');
      empty.classList.toggle('show', items.length === 0);
    }

    fillOptions();
    if (input) {
      input.value = initialQuery;
      input.addEventListener('input', runSearch);
    }
    genreSelect.addEventListener('change', runSearch);
    yearSelect.addEventListener('change', runSearch);
    runSearch();
  }

  document.querySelectorAll('.player').forEach(function (player) {
    const video = player.querySelector('video');
    const button = player.querySelector('.play-overlay');
    const src = player.getAttribute('data-src');
    let loaded = false;
    let hls = null;

    function load() {
      if (loaded || !video || !src) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        video.src = src;
      }

      loaded = true;
    }

    function play() {
      load();
      player.classList.add('is-playing');
      const promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          player.classList.remove('is-playing');
        });
      }
    }

    if (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        play();
      });
    }

    player.addEventListener('click', function (event) {
      if (event.target === video) {
        return;
      }
      play();
    });

    video.addEventListener('play', function () {
      player.classList.add('is-playing');
    });

    video.addEventListener('pause', function () {
      if (!video.ended) {
        player.classList.remove('is-playing');
      }
    });

    video.addEventListener('ended', function () {
      player.classList.remove('is-playing');
    });

    window.addEventListener('beforeunload', function () {
      if (hls && typeof hls.destroy === 'function') {
        hls.destroy();
      }
    });
  });
})();
