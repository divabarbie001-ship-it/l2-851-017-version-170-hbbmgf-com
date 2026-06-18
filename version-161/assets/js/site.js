function setupNavigation() {
  var toggle = document.querySelector('[data-nav-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (!toggle || !mobileNav) {
    return;
  }

  toggle.addEventListener('click', function () {
    mobileNav.classList.toggle('open');
  });
}

function setupHero() {
  var hero = document.querySelector('[data-hero]');

  if (!hero) {
    return;
  }

  var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
  var index = 0;

  function show(nextIndex) {
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

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      show(Number(dot.getAttribute('data-hero-dot')) || 0);
    });
  });

  setInterval(function () {
    show(index + 1);
  }, 5200);
}

function setupSearchPanels() {
  var roots = Array.prototype.slice.call(document.querySelectorAll('[data-search-root]'));

  roots.forEach(function (root) {
    var input = root.querySelector('[data-search-input]');
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-filter-value]'));
    var cards = Array.prototype.slice.call(root.querySelectorAll('[data-movie-card]'));
    var currentFilter = 'all';

    function apply() {
      var term = input ? input.value.trim().toLowerCase() : '';

      cards.forEach(function (card) {
        var text = [
          card.getAttribute('data-title') || '',
          card.getAttribute('data-meta') || '',
          card.getAttribute('data-genre') || '',
          card.textContent || ''
        ].join(' ').toLowerCase();
        var matchesTerm = !term || text.indexOf(term) !== -1;
        var matchesFilter = currentFilter === 'all' || text.indexOf(currentFilter.toLowerCase()) !== -1;
        card.classList.toggle('hidden', !(matchesTerm && matchesFilter));
      });
    }

    if (input) {
      input.addEventListener('input', apply);
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        currentFilter = button.getAttribute('data-filter-value') || 'all';
        buttons.forEach(function (item) {
          item.classList.toggle('active', item === button);
        });
        apply();
      });
    });
  });
}

function initMoviePlayer(sourceUrl) {
  var video = document.getElementById('movieVideo');
  var cover = document.getElementById('playerCover');
  var hlsInstance = null;
  var attached = false;

  if (!video || !sourceUrl) {
    return;
  }

  function attachSource() {
    if (attached) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl;
      attached = true;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        maxBufferLength: 30,
        enableWorker: true
      });
      hlsInstance.loadSource(sourceUrl);
      hlsInstance.attachMedia(video);
      attached = true;
      return;
    }

    video.src = sourceUrl;
    attached = true;
  }

  function playVideo() {
    attachSource();

    if (cover) {
      cover.classList.add('is-hidden');
    }

    var playPromise = video.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        if (cover) {
          cover.classList.remove('is-hidden');
        }
      });
    }
  }

  if (cover) {
    cover.addEventListener('click', playVideo);
  }

  video.addEventListener('click', function () {
    if (!attached || video.paused) {
      playVideo();
    }
  });

  video.addEventListener('play', function () {
    if (cover) {
      cover.classList.add('is-hidden');
    }
  });

  video.addEventListener('ended', function () {
    if (cover) {
      cover.classList.remove('is-hidden');
    }
  });

  window.addEventListener('beforeunload', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}

window.initMoviePlayer = initMoviePlayer;

document.addEventListener('DOMContentLoaded', function () {
  setupNavigation();
  setupHero();
  setupSearchPanels();
});
