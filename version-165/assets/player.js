(function () {
  document.querySelectorAll('[data-player]').forEach(function (root) {
    var video = root.querySelector('video');
    var button = root.querySelector('[data-play-button]');
    var stream = root.getAttribute('data-stream');
    var started = false;
    var hlsInstance = null;

    function attach() {
      if (!video || !stream || started) {
        return;
      }
      started = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
      } else {
        video.src = stream;
      }
    }

    function play() {
      attach();
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

    if (video) {
      video.addEventListener('play', function () {
        if (button) {
          button.classList.add('is-hidden');
        }
      });
      video.addEventListener('pause', function () {
        if (!video.ended && button) {
          button.classList.remove('is-hidden');
        }
      });
      video.addEventListener('click', function () {
        if (!started || video.paused) {
          play();
        }
      });
      window.addEventListener('pagehide', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
        }
      });
    }
  });
})();
