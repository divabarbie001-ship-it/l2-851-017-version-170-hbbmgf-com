(function () {
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.mobile-panel');

  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var opened = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
      toggle.textContent = opened ? '×' : '☰';
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function showHero(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function restartHero() {
      if (timer) {
        window.clearInterval(timer);
      }

      timer = window.setInterval(function () {
        showHero(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showHero(Number(dot.getAttribute('data-hero-dot')) || 0);
        restartHero();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        showHero(index - 1);
        restartHero();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showHero(index + 1);
        restartHero();
      });
    }

    showHero(0);
    restartHero();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function setupFilter(scope) {
    var list = scope.querySelector('.filterable-list');

    if (!list) {
      return;
    }

    var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card, .rank-row'));
    var buttons = Array.prototype.slice.call(scope.querySelectorAll('.filter-btn'));
    var input = scope.querySelector('.category-filter-search');
    var empty = scope.querySelector('.empty-state');
    var activeFilter = 'all';

    function matchesFilter(card) {
      if (activeFilter === 'all') {
        return true;
      }

      var parts = activeFilter.split(':');
      var key = parts[0];
      var expected = normalize(parts.slice(1).join(':'));
      return normalize(card.getAttribute('data-' + key)).indexOf(expected) !== -1;
    }

    function matchesText(card) {
      var query = input ? normalize(input.value) : '';

      if (!query) {
        return true;
      }

      var haystack = [
        card.getAttribute('data-title'),
        card.getAttribute('data-year'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-tags')
      ].join(' ');

      return normalize(haystack).indexOf(query) !== -1;
    }

    function applyFilter() {
      var visible = 0;

      cards.forEach(function (card) {
        var show = matchesFilter(card) && matchesText(card);
        card.style.display = show ? '' : 'none';

        if (show) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('show', visible === 0);
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeFilter = button.getAttribute('data-filter') || 'all';

        buttons.forEach(function (item) {
          item.classList.toggle('active', item === button);
        });

        applyFilter();
      });
    });

    if (input) {
      input.addEventListener('input', applyFilter);
    }
  }

  Array.prototype.slice.call(document.querySelectorAll('main')).forEach(setupFilter);

  function renderSearch() {
    var container = document.getElementById('search-results');
    var empty = document.getElementById('search-empty');
    var input = document.getElementById('search-page-input');

    if (!container || !empty || !input || !window.MOVIE_SEARCH_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    input.value = query;

    function cardTemplate(item) {
      var tags = (item.tags || []).slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');

      return '<article class="movie-card card-hover silver-border">' +
        '<a href="./' + encodeAttr(item.page) + '" class="card-cover" aria-label="' + encodeAttr(item.title) + '">' +
        '<img src="' + encodeAttr(item.cover) + '" alt="' + encodeAttr(item.title) + '" loading="lazy">' +
        '<span class="card-gradient"></span><span class="play-chip">▶</span></a>' +
        '<div class="card-body"><div class="card-meta"><span>' + escapeHtml(item.year) + '</span><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div>' +
        '<h3><a href="./' + encodeAttr(item.page) + '">' + escapeHtml(item.title) + '</a></h3>' +
        '<p>' + escapeHtml(item.one_line) + '</p><div class="tag-row">' + tags + '</div></div></article>';
    }

    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[char];
      });
    }

    function encodeAttr(value) {
      return escapeHtml(value);
    }

    function search(value) {
      var q = normalize(value);
      container.innerHTML = '';

      if (!q) {
        empty.textContent = '请输入关键词开始搜索';
        empty.classList.add('show');
        return;
      }

      var results = window.MOVIE_SEARCH_INDEX.filter(function (item) {
        var haystack = [item.title, item.year, item.region, item.type, item.genre, item.category, item.one_line, (item.tags || []).join(' ')].join(' ');
        return normalize(haystack).indexOf(q) !== -1;
      }).slice(0, 120);

      if (!results.length) {
        empty.textContent = '暂无匹配影片';
        empty.classList.add('show');
        return;
      }

      empty.classList.remove('show');
      container.innerHTML = results.map(cardTemplate).join('');
    }

    input.addEventListener('input', function () {
      search(input.value);
    });

    search(query);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSearch);
  } else {
    renderSearch();
  }
})();
