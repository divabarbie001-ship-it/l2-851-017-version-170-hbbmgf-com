(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function setupMobileNav() {
    var toggle = document.querySelector('[data-mobile-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('is-open', !expanded);
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
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
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupRails() {
    document.querySelectorAll('[data-rail-wrap]').forEach(function (wrap) {
      var rail = wrap.querySelector('[data-rail]');
      var left = wrap.querySelector('[data-rail-left]');
      var right = wrap.querySelector('[data-rail-right]');
      if (!rail) {
        return;
      }
      if (left) {
        left.addEventListener('click', function () {
          rail.scrollBy({ left: -340, behavior: 'smooth' });
        });
      }
      if (right) {
        right.addEventListener('click', function () {
          rail.scrollBy({ left: 340, behavior: 'smooth' });
        });
      }
    });
  }

  function setupFilters() {
    document.querySelectorAll('[data-filter-scope]').forEach(function (scope) {
      var searchInput = scope.querySelector('[data-search-input]');
      var filters = Array.prototype.slice.call(scope.querySelectorAll('[data-filter]'));
      var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));
      var empty = scope.querySelector('[data-empty-state]');

      function normalized(value) {
        return String(value || '').trim().toLowerCase();
      }

      function apply() {
        var query = normalized(searchInput ? searchInput.value : '');
        var activeFilters = filters.map(function (select) {
          return {
            key: select.getAttribute('data-filter'),
            value: normalized(select.value)
          };
        }).filter(function (item) {
          return item.value;
        });
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalized([
            card.getAttribute('data-title'),
            card.getAttribute('data-category'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-year'),
            card.getAttribute('data-genre'),
            card.textContent
          ].join(' '));
          var matchesQuery = !query || haystack.indexOf(query) !== -1;
          var matchesFilters = activeFilters.every(function (filter) {
            return normalized(card.getAttribute('data-' + filter.key)) === filter.value;
          });
          var isVisible = matchesQuery && matchesFilters;
          card.classList.toggle('is-hidden-card', !isVisible);
          if (isVisible) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle('is-visible', visible === 0);
        }
      }

      if (searchInput) {
        searchInput.addEventListener('input', apply);
      }
      filters.forEach(function (select) {
        select.addEventListener('change', apply);
      });
      apply();
    });
  }

  function setupPlayers() {
    document.querySelectorAll('[data-player]').forEach(function (player) {
      var video = player.querySelector('video[data-stream]');
      var button = player.querySelector('[data-play-button]');
      if (!video) {
        return;
      }
      var streamUrl = video.getAttribute('data-stream');
      var attached = false;

      function attachStream() {
        if (attached || !streamUrl) {
          return;
        }
        attached = true;
        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          video._hls = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
        } else {
          video.src = streamUrl;
        }
      }

      function play() {
        attachStream();
        video.controls = true;
        if (button) {
          button.classList.add('is-hidden');
        }
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            if (button) {
              button.classList.remove('is-hidden');
            }
          });
        }
      }

      if (button) {
        button.addEventListener('click', play);
      }
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener('play', function () {
        if (button) {
          button.classList.add('is-hidden');
        }
      });
      video.addEventListener('pause', function () {
        if (button && video.currentTime === 0) {
          button.classList.remove('is-hidden');
        }
      });
    });
  }

  ready(function () {
    setupMobileNav();
    setupHero();
    setupRails();
    setupFilters();
    setupPlayers();
  });
})();
