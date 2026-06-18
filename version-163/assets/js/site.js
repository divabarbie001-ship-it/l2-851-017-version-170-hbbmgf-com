(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function normalize(text) {
    return (text || '').toString().trim().toLowerCase();
  }

  ready(function () {
    var menuButton = document.querySelector('.mobile-menu-button');
    var mobileNav = document.querySelector('.mobile-nav');

    if (menuButton && mobileNav) {
      menuButton.addEventListener('click', function () {
        var isOpen = mobileNav.classList.toggle('is-open');
        menuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        menuButton.textContent = isOpen ? '×' : '☰';
      });
    }

    document.querySelectorAll('.search-form').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = form.querySelector('input[name="q"]');
        if (!input || !input.value.trim()) {
          event.preventDefault();
          input && input.focus();
        }
      });
    });

    initHero();
    initSearchPage();
    initLocalFilters();
    initImageFallback();
  });

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
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

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function initSearchPage() {
    var page = document.querySelector('[data-search-page]');
    if (!page) {
      return;
    }

    var input = page.querySelector('[data-search-input]');
    var category = page.querySelector('[data-category-filter]');
    var year = page.querySelector('[data-year-filter]');
    var count = page.querySelector('[data-search-count]');
    var cards = Array.prototype.slice.call(page.querySelectorAll('.movie-card'));
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';

    if (input) {
      input.value = initialQuery;
    }

    function apply() {
      var q = normalize(input && input.value);
      var selectedCategory = category ? category.value : '';
      var selectedYear = year ? year.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute('data-title') + ' ' + card.getAttribute('data-keywords'));
        var cardCategory = card.getAttribute('data-channel') || '';
        var cardYear = card.getAttribute('data-year') || '';
        var matched = true;

        if (q && haystack.indexOf(q) === -1) {
          matched = false;
        }

        if (selectedCategory && cardCategory !== selectedCategory) {
          matched = false;
        }

        if (selectedYear && cardYear.indexOf(selectedYear) === -1) {
          matched = false;
        }

        card.classList.toggle('is-hidden-card', !matched);
        if (matched) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = visible;
      }
    }

    [input, category, year].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });

    apply();
  }

  function initLocalFilters() {
    document.querySelectorAll('[data-local-filter]').forEach(function (panel) {
      var input = panel.querySelector('.local-filter-input');
      var count = panel.querySelector('[data-filter-count]');
      var cards = Array.prototype.slice.call(panel.querySelectorAll('.movie-card'));

      if (!input) {
        return;
      }

      function apply() {
        var q = normalize(input.value);
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize(card.getAttribute('data-title') + ' ' + card.getAttribute('data-keywords'));
          var matched = !q || haystack.indexOf(q) !== -1;
          card.classList.toggle('is-hidden-card', !matched);
          if (matched) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = visible + ' 部影片';
        }
      }

      input.addEventListener('input', apply);
      apply();
    });
  }

  function initImageFallback() {
    document.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.style.background = 'linear-gradient(135deg, #92400e, #f59e0b)';
        img.style.objectFit = 'cover';
        img.alt = img.alt || '影片封面';
      }, { once: true });
    });
  }
})();
